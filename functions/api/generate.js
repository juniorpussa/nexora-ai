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

    // 1. GERAÇÃO DE NARRAÇÃO (VOZ ADAM OU NATASHA)
    if (task === "tts") {
      const text = (body.text || "").trim();
      const voice = body.voice === "adam" ? "adam" : "natasha";

      if (!text) {
        return json({ error: "Digite o roteiro do vídeo antes de gerar." }, 400);
      }

      // Mapeamento para vozes neurais naturais em português via fal.ai Kokoro TTS
      const voiceId = voice === "adam" ? "pm_alex" : "pf_dora";

      const ttsRes = await fetch("https://fal.run/fal-ai/kokoro/brazilian-portuguese", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          prompt: text,
          voice: voiceId,
          speed: 1.05
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

    // 2. GERAÇÃO DE CENAS VISUAIS COMERCIAIS 9:16 (MANTENDO O PRODUTO ORIGINAL)
    if (task === "scene") {
      const imageBase64 = body.imageBase64 || "";
      const mimeType = body.mimeType || "image/jpeg";
      const sceneIndex = Number(body.sceneIndex || 1);
      const style = body.style || "vendas";

      if (!imageBase64) {
        return json({ error: "Envie a foto do produto." }, 400);
      }

      const dataUri = `data:${mimeType};base64,${imageBase64}`;

      const scenePrompts = {
        vendas: [
          "Luxury commercial hero product shot keeping the exact uploaded product intact, placed on dark obsidian stone and brushed gold pedestal with dramatic rim lighting, high-contrast studio reflections, 9:16 vertical, zero text, zero watermarks, zero extra logos.",
          "Dynamic close-up commercial showcase keeping the exact uploaded product intact, sleek dark metallic studio backdrop with warm golden light streaks, crisp specular highlights, 9:16 vertical, zero text, zero watermarks, zero extra logos.",
          "High-converting e-commerce lifestyle tabletop showcase keeping the exact uploaded product intact, modern minimalist dark marble counter with soft ambient studio glow, 9:16 vertical, zero text, zero watermarks, zero extra logos."
        ],
        viral: [
          "High-energy commercial studio showcase keeping the exact uploaded product intact, futuristic neon cyan and gold edge lighting on dark matte surface, ultra sharp focus, 9:16 vertical, zero text, zero watermarks.",
          "Bold editorial product photography keeping the exact uploaded product intact, floating dramatic spotlight beam in dark luxury studio, crisp shadows, 9:16 vertical, zero text, zero watermarks.",
          "Sleek modern tech-luxury product display keeping the exact uploaded product intact, reflective black glass surface with vivid rim highlights, 9:16 vertical, zero text, zero watermarks."
        ],
        pessoal: [
          "Clean bright modern lifestyle product photography keeping the exact uploaded product intact, natural morning sunlight on warm travertine stone surface, soft shadows, 9:16 vertical, zero text, zero watermarks.",
          "Aesthetic minimal studio photography keeping the exact uploaded product intact, soft neutral beige and warm wood backdrop, crisp natural detail, 9:16 vertical, zero text, zero watermarks.",
          "Cozy contemporary home table setting keeping the exact uploaded product intact, soft depth of field and natural daylight, 9:16 vertical, zero text, zero watermarks."
        ]
      };

      const list = scenePrompts[style] || scenePrompts.vendas;
      const chosenPrompt = list[(sceneIndex - 1) % list.length];

      const imgRes = await fetch("https://fal.run/fal-ai/nano-banana/edit", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          prompt: chosenPrompt,
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
