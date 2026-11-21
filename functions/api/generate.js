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

    // 1. NARRAÇÃO EM PORTUGUÊS DO BRASIL (ADAM OU NATASHA)
    if (task === "tts") {
      const text = (body.text || "").trim();
      const voice = body.voice === "adam" ? "adam" : "natasha";

      if (!text) {
        return json({ error: "Digite o roteiro do vídeo antes de gerar." }, 400);
      }

      const voiceId = voice === "adam" ? "pm_alex" : "pf_dora";

      const ttsRes = await fetch("https://fal.run/fal-ai/kokoro/brazilian-portuguese", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          prompt: text,
          voice: voiceId,
          speed: 1.07
        })
      });

      const ttsText = await ttsRes.text();
      let ttsData = {};
      try {
        ttsData = JSON.parse(ttsText);
      } catch {
        return json({ error: `Resposta inválida do motor de voz (${ttsRes.status}).` }, 502);
      }

      if (!ttsRes.ok) {
        return json(
          { error: ttsData.detail || ttsData.message || "Erro ao gerar narração." },
          ttsRes.status
        );
      }

      const audioUrl = ttsData?.audio?.url || ttsData?.audio_url || ttsData?.url || "";
      if (!audioUrl) {
        return json({ error: "Áudio não retornado pelo servidor de voz." }, 502);
      }

      return json({ ok: true, audioUrl, voice });
    }

    // 2. GERAÇÃO DE CENAS ULTRA-REALISTAS 9:16 (50 MODELOS DE IMAGEM)
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
        "hero centered commercial angle, dramatic depth of field",
        "dynamic slightly low-angle three-quarter perspective, crisp edge highlights",
        "tight macro-luxury detail perspective, rich specular reflections"
      ];
      const angle = angleVariations[(sceneIndex - 1) % angleVariations.length];

      const baseDirection =
        imagePrompt ||
        "ultra-realistic commercial product photography on dark obsidian stone and brushed gold pedestal, dramatic rim lighting";

      const fullPrompt = `Ultra-realistic 8k commercial product photography keeping the exact uploaded product completely intact and faithful, ${baseDirection}, ${angle}, 9:16 vertical framing, photorealistic textures, sharp focus, zero added text, zero watermarks, zero extra logos, zero human hands or faces.`;

      const imgRes = await fetch("https://fal.run/fal-ai/nano-banana/edit", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          prompt: fullPrompt,
          image_urls: [dataUri],
          aspect_ratio: "9:16",
          num_images: 1,
          output_format: "jpeg"
        })
      });

      const imgText = await imgRes.text();
      let imgData = {};
      try {
        imgData = JSON.parse(imgText);
      } catch {
        return json({ error: `Resposta inválida ao gerar cena ${sceneIndex}.` }, 502);
      }

      if (!imgRes.ok) {
        return json(
          { error: imgData.detail || imgData.message || `Erro ao gerar cena ${sceneIndex}.` },
          imgRes.status
        );
      }

      const imageUrl = imgData?.images?.[0]?.url || imgData?.image?.url || "";
      if (!imageUrl) {
        return json({ error: `Cena ${sceneIndex} não retornou imagem.` }, 502);
      }

      return json({ ok: true, imageUrl, sceneIndex });
    }

    return json({ error: "Tarefa inválida." }, 400);
  } catch (err) {
    return json({ error: err.message || "Erro interno no servidor." }, 500);
  }
}
