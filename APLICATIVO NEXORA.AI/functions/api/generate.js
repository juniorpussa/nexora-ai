export async function onRequestPost(context) {
  try {
    const { imageBase64, mimeType, prompt } = await context.request.json();
    const apiKey = context.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Chave GEMINI_API_KEY não configurada." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType || "image/jpeg",
                    data: imageBase64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            responseModalities: ["IMAGE"]
          }
        })
      }
    );

    const rawText = await response.text();
    let data = {};
    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch {
        return new Response(
          JSON.stringify({ error: `Resposta inválida do Gemini (HTTP ${response.status}): ${rawText.slice(0, 180)}` }),
          { status: 502, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    if (!response.ok) {
      const apiMsg = data?.error?.message || `Erro na API do Gemini (HTTP ${response.status})`;
      return new Response(JSON.stringify({ error: apiMsg }), {
        status: response.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    const parts = data?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p) => p.inlineData || p.inline_data);
    const inline = imagePart?.inlineData || imagePart?.inline_data;

    if (!inline?.data) {
      return new Response(JSON.stringify({ error: "Falha ao gerar imagem.", details: data }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(
      JSON.stringify({
        imageUrl: `data:${inline.mimeType || inline.mime_type || "image/png"};base64,${inline.data}`
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
