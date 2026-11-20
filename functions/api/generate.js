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

  try {
    if (!env.FAL_KEY) {
      return new Response(
        JSON.stringify({ error: "Variável FAL_KEY não configurada na Cloudflare Pages." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const mode = body.mode || "image";
    const imageBase64 = body.imageBase64 || "";
    const mimeType = body.mimeType || "image/jpeg";
    const customPrompt = (body.prompt || "").trim();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Envie a foto do produto antes de gerar." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const dataUri = `data:${mimeType};base64,${imageBase64}`;
    const headers = {
      "Authorization": `Key ${env.FAL_KEY}`,
      "Content-Type": "application/json"
    };

    if (mode === "image") {
      const prompt = customPrompt ||
        "Luxury commercial product photography keeping the exact uploaded product intact, placed on dark obsidian stone and brushed gold pedestal with dramatic rim lighting, deep shadows, high-contrast studio reflections, ultra sharp 8k look, zero text, zero watermarks, zero extra logos.";

      const res = await fetch("https://fal.run/fal-ai/nano-banana/edit", {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt,
          image_urls: [dataUri],
          aspect_ratio: "9:16",
          num_images: 1,
          output_format: "jpeg"
        })
      });

      const data = await res.json();
      if (!res.ok) {
        return new Response(
          JSON.stringify({ error: data.detail || data.message || "Erro ao gerar imagem na fal.ai." }),
          { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const imageUrl = data?.images?.[0]?.url || data?.image?.url || "";
      return new Response(
        JSON.stringify({ ok: true, mode: "image", url: imageUrl }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (mode === "video") {
      const prompt = customPrompt ||
        "Fast dynamic commercial camera push-in and orbital sweep around the exact product from the input image, dramatic studio lighting shifts, crisp specular highlights, high-energy commercial motion, 9:16 vertical framing, no text overlays, no watermarks.";

      const res = await fetch("https://fal.run/fal-ai/kling-video/v2.6/pro/image-to-video", {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt,
          image_url: dataUri,
          duration: "5",
          aspect_ratio: "9:16",
          generate_audio: false
        })
      });

      const data = await res.json();
      if (!res.ok) {
        return new Response(
          JSON.stringify({ error: data.detail || data.message || "Erro ao gerar vídeo na fal.ai." }),
          { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const videoUrl = data?.video?.url || data?.url || "";
      return new Response(
        JSON.stringify({ ok: true, mode: "video", url: videoUrl }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Modo inválido. Use 'image' ou 'video'." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Falha interna no servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
