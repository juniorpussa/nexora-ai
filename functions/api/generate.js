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

  async function fetchWithTimeout(url, options, timeoutMs = 25000, stageName = "serviço") {
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
        throw new Error(`${stageName} demorou mais do que o tempo limite.`);
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

  function extractVideoUrl(data) {
    return (
      data?.video?.url ||
      data?.video_url ||
      data?.output?.video?.url ||
      data?.url ||
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
      const isMale = voice === "adam";
      let audioUrl = "";
      let providerUsed = "none";
      const errors = [];

      // 1. Kokoro PT-BR (pm_alex para Adam masculino | pf_dora para Natasha feminina)
      try {
        const voiceId = isMale ? "pm_alex" : "pf_dora";
        const kokoroData = await fetchWithTimeout(
          "https://fal.run/fal-ai/kokoro/brazilian-portuguese",
          {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
              prompt: scriptPtBr,
              voice: voiceId,
              speed: 1.18
            })
          },
          22000,
          "Kokoro PT-BR"
        );
        audioUrl = extractAudioUrl(kokoroData);
        if (audioUrl) providerUsed = `kokoro-${voiceId}`;
      } catch (err) {
        errors.push(`Kokoro: ${err?.message || "falha"}`);
      }

      // 2. MiniMax Speech-02 HD (Deep_Voice_Man para Adam masculino | Sweet_Girl_2 para Natasha feminina)
      if (!audioUrl) {
        try {
          const minimaxVoice = isMale ? "Deep_Voice_Man" : "Sweet_Girl_2";
          const minimaxData = await fetchWithTimeout(
            "https://fal.run/fal-ai/minimax/speech-02-hd",
            {
              method: "POST",
              headers: authHeaders,
              body: JSON.stringify({
                text: scriptPtBr,
                voice_setting: {
                  voice_id: minimaxVoice,
                  speed: 1.18,
                  vol: 1.0,
                  pitch: isMale ? -2 : 0
                },
                language_boost: "Portuguese_Brazil",
                output_format: "mp3"
              })
            },
            25000,
            "MiniMax Speech-02 HD"
          );
          audioUrl = extractAudioUrl(minimaxData);
          if (audioUrl) providerUsed = `minimax-${minimaxVoice}`;
        } catch (err) {
          errors.push(`MiniMax: ${err?.message || "falha"}`);
        }
      }

      if (!audioUrl) {
        return json(
          {
            error: `Não foi possível gerar a voz (${voice}). Detalhes: ${errors.join(" | ") || "sem retorno de áudio"}`
          },
          502
        );
      }

      return json({
        ok: true,
        audioUrl,
        voice,
        provider: providerUsed
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
        "dramatic low-angle hero commercial framing, razor-sharp product focus, studio lighting, floating embers and dark atmospheric mist",
        "dynamic close-up three-quarter macro angle highlighting surface texture, metallic rim light and dramatic light streaks",
        "high-contrast wide-angle dramatic studio shot with deep cinematic shadows, volumetric light beam and crisp rim light"
      ];
      const angle = angleVariations[(sceneIndex - 1) % angleVariations.length];

      const baseDirection =
        imagePrompt ||
        "dark obsidian stone pedestal with brushed gold trim, dramatic studio rim lighting, floating sparks and smoke";

      const fullPrompt = `Hollywood commercial product photography keeping the exact uploaded product 100% identical and faithful in shape, color and design, ${baseDirection}, ${angle}, 9:16 vertical framing, ultra-sharp photorealistic detail, zero added text, zero watermarks, zero extra logos.`;

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

    if (task === "clip") {
      const imageUrl = (body.imageUrl || "").trim();
      const motionPrompt = (body.motionPrompt || "").trim();

      if (!imageUrl) {
        return json({ error: "URL da cena ausente para animação." }, 400);
      }

      const fullMotionPrompt =
        motionPrompt ||
        "Hollywood commercial camera orbit and dynamic push-in around the exact product, swirling dark smoke, glowing sparks and shifting dramatic studio rim light, keeping the product 100% faithful, 9:16 vertical motion, zero text.";

      const clipData = await fetchWithTimeout(
        "https://fal.run/fal-ai/kling-video/v1.6/standard/image-to-video",
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            prompt: fullMotionPrompt,
            image_url: imageUrl,
            duration: "5",
            aspect_ratio: "9:16"
          })
        },
        55000,
        "animador de cena (Image-to-Video)"
      );

      const videoUrl = extractVideoUrl(clipData);
      if (!videoUrl) {
        return json({ error: "Clipe animado não retornado." }, 502);
      }

      return json({ ok: true, videoUrl });
    }

    return json({ error: "Tarefa inválida." }, 400);
  } catch (err) {
    return json({ error: err?.message || "Erro interno no servidor." }, 500);
  }
}
