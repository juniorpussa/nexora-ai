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

  async function fetchWithTimeout(url, options, timeoutMs = 20000, stageName = "serviço") {
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
      .slice(0, 380);
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

  async function fetchPtBrFallbackAudioDataUri(text) {
    const q = encodeURIComponent(text.slice(0, 200));
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=pt-BR&client=tw-ob&q=${q}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: controller.signal
      });
      if (!res.ok) return "";
      const buf = await res.arrayBuffer();
      if (!buf || buf.byteLength < 500) return "";
      const b64 = await arrayBufferToBase64(buf);
      return `data:audio/mpeg;base64,${b64}`;
    } catch {
      return "";
    } finally {
      clearTimeout(timer);
    }
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
              speed: 1.06
            })
          },
          15000,
          "Kokoro PT-BR"
        );
        audioUrl = extractAudioUrl(kokoroData);
        if (audioUrl) providerUsed = "kokoro-ptbr";
      } catch {
        audioUrl = "";
      }

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
                  speed: 1.06,
                  vol: 1.0,
                  pitch: isMale ? -1 : 0
                },
                language_boost: "Portuguese_Brazil",
                output_format: "mp3"
              })
            },
            18000,
            "MiniMax Speech-02 HD"
          );
          audioUrl = extractAudioUrl(minimaxData);
          if (audioUrl) providerUsed = "minimax-speech-02-hd";
        } catch {
          audioUrl = "";
        }
      }

      if (!audioUrl) {
        audioUrl = await fetchPtBrFallbackAudioDataUri(scriptPtBr);
        if (audioUrl) providerUsed = "ptbr-tts-fallback";
      }

      return json({
        ok: true,
        audioUrl,
        voice,
        provider: providerUsed,
        ttsFallback: providerUsed !== "kokoro-ptbr"
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
        "dramatic Hollywood blockbuster hero framing, glowing rim light, floating ember sparks and dark smoke atmosphere",
        "dynamic close-up macro angle highlighting metallic finish and precision details with dramatic light flares",
        "orbiting three-quarter commercial angle with high-contrast studio lighting and deep cinematic shadows"
      ];
      const angle = angleVariations[(sceneIndex - 1) % angleVariations.length];

      const baseDirection =
        imagePrompt ||
        "dark obsidian and brushed gold commercial studio with dramatic rim lighting and glowing embers";

      const fullPrompt = `Hollywood commercial cinematography keeping the exact uploaded product 100% identical and faithful, ${baseDirection}, ${angle}, 9:16 vertical framing, ultra-sharp photorealistic detail, zero added text, zero watermarks, zero extra logos.`;

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

    // Nova etapa opcional: animar cena estática em clipe de vídeo com movimento real de câmera/efeitos
    if (task === "clip") {
      const imageUrl = (body.imageUrl || "").trim();
      const motionPrompt = (body.motionPrompt || "").trim();

      if (!imageUrl) {
        return json({ error: "URL da cena ausente para animação." }, 400);
      }

      const fullMotionPrompt =
        motionPrompt ||
        "Hollywood commercial camera push-in with subtle orbit, floating glowing sparks and atmospheric light rays, keeping the exact product 100% identical, smooth 9:16 motion, zero text.";

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
