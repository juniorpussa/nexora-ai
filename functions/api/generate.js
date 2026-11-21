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

  async function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  }

  function buildVoiceServices(text, voice, envVars, authHeaders) {
    const shortText = text.slice(0, 420);
    const services = [];

    // 1. Kokoro Brazilian Portuguese (fal.ai)
    services.push({
      id: "kokoro-ptbr",
      label: "Kokoro PT-BR (fal.ai)",
      run: async () => {
        const voiceId = voice === "adam" ? "pm_alex" : "pf_dora";
        const data = await fetchWithTimeout(
          "https://fal.run/fal-ai/kokoro/brazilian-portuguese",
          {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
              prompt: shortText,
              voice: voiceId,
              speed: 1.08
            })
          },
          12000,
          "Kokoro PT-BR"
        );
        return extractAudioUrl(data);
      }
    });

    // 2. MiniMax Speech-02 HD (fal.ai)
    services.push({
      id: "minimax-speech-02-hd",
      label: "MiniMax Speech-02 HD (fal.ai)",
      run: async () => {
        const minimaxVoice = voice === "adam" ? "Deep_Voice_Man" : "Sweet_Girl_2";
        const data = await fetchWithTimeout(
          "https://fal.run/fal-ai/minimax/speech-02-hd",
          {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
              text: shortText,
              voice_setting: {
                voice_id: minimaxVoice,
                speed: 1.08,
                vol: 1.0,
                pitch: 0
              },
              output_format: "mp3"
            })
          },
          15000,
          "MiniMax Speech-02 HD"
        );
        return extractAudioUrl(data);
      }
    });

    // 3. Chatterbox Multilingual (fal.ai)
    services.push({
      id: "chatterbox-multilingual",
      label: "Chatterbox Multilingual (fal.ai)",
      run: async () => {
        const data = await fetchWithTimeout(
          "https://fal.run/fal-ai/chatterbox/text-to-speech/multilingual",
          {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
              text: shortText,
              language: "pt"
            })
          },
          15000,
          "Chatterbox Multilingual"
        );
        return extractAudioUrl(data);
      }
    });

    // 4. ElevenLabs (opcional, se ELEVENLABS_API_KEY estiver configurada na Cloudflare Pages)
    if (envVars.ELEVENLABS_API_KEY) {
      services.push({
        id: "elevenlabs-tts",
        label: "ElevenLabs TTS",
        run: async () => {
          const defaultAdam = envVars.ELEVENLABS_VOICE_ADAM || "pNInz6obpgDQGcFmaJgB";
          const defaultNatasha = envVars.ELEVENLABS_VOICE_NATASHA || "EXAVITQu4vr4xnSDxMaL";
          const elVoiceId = voice === "adam" ? defaultAdam : defaultNatasha;

          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 15000);
          try {
            const res = await fetch(
              `https://api.elevenlabs.io/v1/text-to-speech/${elVoiceId}`,
              {
                method: "POST",
                headers: {
                  "xi-api-key": envVars.ELEVENLABS_API_KEY,
                  "Content-Type": "application/json",
                  "Accept": "audio/mpeg"
                },
                body: JSON.stringify({
                  text: shortText,
                  model_id: "eleven_multilingual_v2"
                }),
                signal: controller.signal
              }
            );
            if (!res.ok) {
              throw new Error(`ElevenLabs falhou (${res.status})`);
            }
            const buf = await res.arrayBuffer();
            const b64 = await arrayBufferToBase64(buf);
            return `data:audio/mpeg;base64,${b64}`;
          } finally {
            clearTimeout(timer);
          }
        }
      });
    }

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
      const text = (body.text || "").trim();
      const voice = body.voice === "adam" ? "adam" : "natasha";

      if (!text) {
        return json({ error: "Digite o roteiro do vídeo antes de gerar." }, 400);
      }

      const services = buildVoiceServices(text, voice, env, authHeaders);
      const voicesAvailable = services.map((s) => ({ id: s.id, label: s.label }));
      const attemptedErrors = [];

      let audioUrl = "";
      let providerUsed = "none";

      // Passa automaticamente para o próximo serviço assim que um falhar ou estourar tempo
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
