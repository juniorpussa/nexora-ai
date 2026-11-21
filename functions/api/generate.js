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
        throw new Error(`O ${stageName} não respondeu a tempo (limite de ${Math.round(timeoutMs / 1000)}s).`);
      }
      throw err;
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
      const text = (body.text || "").trim();
      const voice = body.voice === "adam" ? "adam" : "natasha";

      if (!text) {
        return json({ error: "Digite o roteiro do vídeo antes de gerar." }, 400);
      }

      const voiceId = voice === "adam" ? "pm_alex" : "pf_dora";
      const trimmedPrompt = text.slice(0, 420);

      const ttsData = await fetchWithTimeout(
        "https://fal.run/fal-ai/kokoro/brazilian-portuguese",
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            prompt: trimmedPrompt,
            voice: voiceId,
            speed: 1.08
          })
        },
        18000,
        "motor de voz"
      );

      const audioUrl = ttsData?.audio?.url || ttsData?.audio_url || ttsData?.url || "";
      if (!audioUrl) {
        return json({ error: "Áudio não retornado pelo servidor de voz." }, 502);
      }

      return json({ ok: true, audioUrl, voice });
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
