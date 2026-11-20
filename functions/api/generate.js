export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    if (!env.GEMINI_API_KEY) {
      return jsonResponse({ error: "GEMINI_API_KEY não configurada na Cloudflare." }, 500);
    }

    const body = await request.json();
    const {
      imageBase64,
      mimeType = "image/jpeg",
      prompt = ""
    } = body;

    if (!imageBase64) {
      return jsonResponse({ error: "Envie a foto do produto antes de gerar." }, 400);
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${env.GEMINI_API_KEY}`;

    const payload = {
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: imageBase64
              }
            },
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        responseModalities: ["IMAGE"]
      }
    };

    const geminiRes = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      const msg = data?.error?.message || `Erro na API Gemini (HTTP ${geminiRes.status})`;
      return jsonResponse({ error: msg }, geminiRes.status);
    }

    const parts = data?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p) => p.inlineData || p.inline_data);
    const inline = imagePart?.inlineData || imagePart?.inline_data;

    if (!inline?.data) {
      return jsonResponse({ error: "A IA não retornou nenhuma imagem. Tente outro estilo." }, 502);
    }

    return jsonResponse({
      imageBase64: inline.data,
      mimeType: inline.mimeType || inline.mime_type || "image/png"
    });
  } catch (err) {
    return jsonResponse({ error: err.message || "Erro interno no servidor." }, 500);
  }
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
