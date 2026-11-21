export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  async function fetchWithTimeout(url, options, timeoutMs = 15000, stageName = "serviço") {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      const rawText = await res.text();
      let parsed = null;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = null;
      }
      if (!res.ok) {
        const detail =
          parsed?.detail ||
          parsed?.message ||
          parsed?.error ||
          `Falha no ${stageName} (${res.status}).`;
        throw new Error(detail);
      }
      if (!parsed) {
        throw new Error(`Resposta inválida do ${stageName}.`);
      }
      return parsed;
    } catch (err) {
      if (err?.name === "AbortError") {
        throw new Error(`${stageName} excedeu o tempo limite.`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  function extractAudioUrl(data) {
    return (
      data?.audio?.url ||
      data?.audio_url ||
      data?.url ||
      data?.output?.audio?.url ||
      ""
    );
  }

  function normalizePtBrScript(raw) {
    return raw
      .replace(/\s+/g, " ")
      .replace(/([.!?])\s*/g, "$1 ")
      .trim()
      .slice(0, 420);
  }

  function buildVoiceServices(scriptPtBr, voice, authHeaders) {
    const isMale = voice === "adam";
    const services = [];

    // 1. Kokoro PT-BR (voz masculina pm_alex para Adam | voz feminina pf_dora para Natasha)
    services.push({
      id: isMale ? "kokoro-ptbr-male-pm_alex" : "kokoro-ptbr-female-pf_dora",
      label: isMale ? "Kokoro PT-BR Masculino (pm_alex)" : "Kokoro PT-BR Feminino (pf_dora)",
      gender: isMale ? "male" : "female",
      run: async () => {
        const voiceId = isMale ? "pm_alex" : "pf_dora";
        const data = await fetchWithTimeout(
          "https://fal.run/fal-ai/kokoro/brazilian-portuguese",
          {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
              prompt: scriptPtBr,
              voice: voiceId,
              speed: 1.05
            })
          },
          18000,
          "Kokoro PT-BR"
        );
        return extractAudioUrl(data);
      }
    });

    // 2. MiniMax Speech-02 HD (reserva respeitando estritamente o gênero escolhido: masculino ou feminino)
    services.push({
      id: isMale ? "minimax-male-deep_voice_man" : "minimax-female-sweet_girl_2",
      label: isMale ? "MiniMax Masculino (Deep_Voice_Man)" : "MiniMax Feminino (Sweet_Girl_2)",
      gender: isMale ? "male" : "female",
      run: async () => {
        const minimaxVoice = isMale ? "Deep_Voice_Man" : "Sweet_Girl_2";
        const data = await fetchWithTimeout(
          "https://fal.run/fal-ai/minimax/speech-02-hd",
          {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
              text: scriptPtBr,
              voice_setting: {
                voice_id: minimaxVoice,
                speed: 1.05,
                vol: 1.0,
                pitch: isMale ? -1 : 0
              },
              language_boost: "Portuguese_Brazil",
              output_format: "mp3"
            })
          },
          22000,
          "MiniMax Speech-02 HD"
        );
        return extractAudioUrl(data);
      }
    });

    return services;
  }

  try {
    if (!env.FAL_KEY) {
      return json({ error: "Variável FAL_KEY não configurada na Cloudflare Pages." }, 500);
    }

    const body = await request.json();
    const task = body.task || "scene";

    const authHeaders = {
      "Authorization": `Key ${env.FAL_KEY}`,
      "Content-Type": "application/json"
    };

    if (task === "tts") {
      const rawText = (body.text || "").trim();
      const voice = body.voice === "adam" ? "adam" : "natasha";

      if (!rawText) {
        return json({ error: "Digite o roteiro do vídeo antes de gerar." }, 400);
      }

      const scriptPtBr = normalizePtBrScript(rawText);
      const services = buildVoiceServices(scriptPtBr, voice, authHeaders);
      const voicesAvailable = services.map((s) => ({
        id: s.id,
        label: s.label,
        gender: s.gender
      }));
      const attemptedErrors = [];

      let audioUrl = "";
      let providerUsed = "none";

      for (const svc of services) {
        try {
          const url = await svc.run();
          if (url) {
            audioUrl = url;
            providerUsed = svc.id;
            break;
          }
          attemptedErrors.push(`${svc.label}: sem áudio retornado`);
        } catch (err) {
          attemptedErrors.push(`${svc.label}: ${err?.message || "falha"}`);
        }
      }

      return json({
        ok: true,
        audioUrl,
        voice,
        gender: voice === "adam" ? "male" : "female",
        provider: providerUsed,
        voicesAvailable,
        attemptedErrors,
        ttsFallback: !audioUrl
      });
    }

    if (task === "scene") {
      const imageBase64 = body.imageBase64 || "";
      const mimeType = body.mimeType || "image/jpeg";
      const sceneIndex = Number(body.sceneIndex || 1);
      const imagePrompt = (body.imagePrompt || "").trim();

      if (!imageBase64) {
        return json({ error: "Envie a foto do produto." }, 400);
      }

      const dataUri = `data:${mimeType};base64,${imageBase64}`;

      const angleVariations = [
        "dramatic low-angle hero commercial framing, razor-sharp product focus, studio lighting",
        "dynamic close-up three-quarter macro angle highlighting surface finish and edge specular light",
        "high-contrast wide-angle dramatic studio shot with deep shadows and crisp rim light"
      ];
      const angle = angleVariations[(sceneIndex - 1) % angleVariations.length];

      const baseDirection =
        imagePrompt ||
        "commercial product shot on dark obsidian stone and brushed gold pedestal, dramatic rim lighting";

      const fullPrompt = `Commercial product photography keeping the exact uploaded product 100% identical and faithful, ${baseDirection}, ${angle}, 9:16 vertical framing, ultra-sharp photorealistic detail, zero added text, zero watermarks, zero extra logos, zero human hands or faces.`;

      const imgData = await fetchWithTimeout(
        "https://fal.run/fal-ai/nano-banana/edit",
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            prompt: fullPrompt,
            image_urls: [dataUri],
            aspect_ratio: "9:16",
            num_images: 1,
            output_format: "jpeg"
          })
        },
        45000,
        `gerador da cena ${sceneIndex}`
      );

      const imageUrl = imgData?.images?.[0]?.url || imgData?.image?.url || "";
      if (!imageUrl) {
        return json({ error: `Cena ${sceneIndex} não retornou imagem.` }, 502);
      }

      return json({ ok: true, imageUrl, sceneIndex });
    }

    return json({ error: "Tarefa inválida." }, 400);
  } catch (err) {
    return json({ error: err?.message || "Erro interno no servidor." }, 500);
  }
}
