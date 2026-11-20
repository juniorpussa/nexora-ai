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
    const action = body.action || "submit";
    const mode = body.mode || "image";
    const model =
      mode === "video"
        ? "fal-ai/kling-video/v2.6/pro/image-to-video"
        : "fal-ai/nano-banana/edit";

    const authHeaders = {
      "Authorization": `Key ${env.FAL_KEY}`,
      "Content-Type": "application/json"
    };

    if (action === "submit") {
      const imageBase64 = body.imageBase64 || "";
      const mimeType = body.mimeType || "image/jpeg";
      const customPrompt = (body.prompt || "").trim();

      if (!imageBase64) {
        return json({ error: "Envie a foto do produto antes de gerar." }, 400);
      }

      const dataUri = `data:${mimeType};base64,${imageBase64}`;

      const payload =
        mode === "video"
          ? {
              prompt:
                customPrompt ||
                "Fast dynamic commercial camera push-in and orbital sweep around the exact product from the input image, dramatic studio lighting shifts, crisp specular highlights, high-energy commercial motion, 9:16 vertical framing, no text overlays, no watermarks.",
              image_url: dataUri,
              duration: "5",
              aspect_ratio: "9:16",
              generate_audio: false
            }
          : {
              prompt:
                customPrompt ||
                "Luxury commercial product photography keeping the exact uploaded product intact, placed on dark obsidian stone and brushed gold pedestal with dramatic rim lighting, deep shadows, high-contrast studio reflections, ultra sharp 8k look, zero text, zero watermarks, zero extra logos.",
              image_urls: [dataUri],
              aspect_ratio: "9:16",
              num_images: 1,
              output_format: "jpeg"
            };

      const submitRes = await fetch(`https://queue.fal.run/${model}`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload)
      });

      const submitText = await submitRes.text();
      let submitData = {};
      try {
        submitData = JSON.parse(submitText);
      } catch {
        return json({ error: `Resposta inválida da fal.ai ao iniciar (${submitRes.status}).` }, 502);
      }

      if (!submitRes.ok) {
        return json(
          { error: submitData.detail || submitData.message || "Falha ao enviar pedido para a fal.ai." },
          submitRes.status
        );
      }

      return json({
        ok: true,
        status: "IN_QUEUE",
        requestId: submitData.request_id,
        statusUrl: submitData.status_url,
        responseUrl: submitData.response_url,
        model
      });
    }

    if (action === "status") {
      const requestId = body.requestId;
      const statusUrl =
        body.statusUrl ||
        (requestId ? `https://queue.fal.run/${model}/requests/${requestId}/status` : "");
      const responseUrl =
        body.responseUrl ||
        (requestId ? `https://queue.fal.run/${model}/requests/${requestId}` : "");

      if (!statusUrl || !responseUrl) {
        return json({ error: "Identificador do pedido em fila em falta." }, 400);
      }

      const stRes = await fetch(statusUrl, {
        method: "GET",
        headers: { "Authorization": `Key ${env.FAL_KEY}` }
      });

      const stText = await stRes.text();
      let stData = {};
      try {
        stData = JSON.parse(stText);
      } catch {
        return json({ status: "IN_PROGRESS" });
      }

      if (!stRes.ok) {
        return json(
          { error: stData.detail || stData.message || "Erro ao consultar estado na fal.ai." },
          stRes.status
        );
      }

      if (stData.status === "COMPLETED") {
        const resFetch = await fetch(responseUrl, {
          method: "GET",
          headers: { "Authorization": `Key ${env.FAL_KEY}` }
        });

        const resText = await resFetch.text();
        let resultData = {};
        try {
          resultData = JSON.parse(resText);
        } catch {
          return json({ error: "Resultado final inválido devolvido pela fal.ai." }, 502);
        }

        if (!resFetch.ok) {
          return json(
            { error: resultData.detail || resultData.message || "Erro ao obter resultado final." },
            resFetch.status
          );
        }

        const mediaUrl =
          mode === "video"
            ? resultData?.video?.url || resultData?.url || ""
            : resultData?.images?.[0]?.url || resultData?.image?.url || "";

        return json({
          ok: true,
          status: "COMPLETED",
          mode,
          url: mediaUrl
        });
      }

      if (stData.status === "FAILED") {
        return json(
          { error: stData.error || "A geração falhou no motor da fal.ai." },
          500
        );
      }

      return json({
        ok: true,
        status: stData.status || "IN_PROGRESS"
      });
    }

    return json({ error: "Ação inválida." }, 400);
  } catch (err) {
    return json({ error: err.message || "Falha interna no servidor." }, 500);
  }
}
