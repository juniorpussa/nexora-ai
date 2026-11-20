if (mode === "video") {
      const modelsToTry = ["veo-2.0-generate-001", "veo-3.1-fast-generate-preview"];
      let lastError = "O servidor concluiu sem retornar o arquivo de vídeo.";

      for (const videoModel of modelsToTry) {
        const startUrl = `https://generativelanguage.googleapis.com/v1beta/models/${videoModel}:predictLongRunning?key=${env.GEMINI_API_KEY}`;

        const startPayload = {
          instances: [
            {
              prompt: prompt,
              image: {
                bytesBase64Encoded: imageBase64,
                mimeType: mimeType
              }
            }
          ],
          parameters: {
            aspectRatio: "9:16",
            personGeneration: "dont_allow"
          }
        };

        const startRes = await fetch(startUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(startPayload)
        });

        const startData = await startRes.json();

        if (!startRes.ok) {
          lastError = `[${videoModel}] ${startData?.error?.message || `HTTP ${startRes.status}`}`;
          continue;
        }

        const operationName = startData?.name;
        if (!operationName) {
          lastError = `[${videoModel}] Sem operation name: ${JSON.stringify(startData).slice(0, 220)}`;
          continue;
        }

        const opUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${env.GEMINI_API_KEY}`;
        let opData = startData;

        for (let i = 0; i < 12; i++) {
          if (opData.done) break;
          await new Promise((r) => setTimeout(r, 3500));
          const pollRes = await fetch(opUrl);
          opData = await pollRes.json();
        }

        if (!opData.done) {
          lastError = `[${videoModel}] Ainda em processamento (${operationName}).`;
          continue;
        }

        if (opData.error) {
          lastError = `[${videoModel}] Erro na operação: ${opData.error.message || JSON.stringify(opData.error)}`;
          continue;
        }

        const resp = opData?.response || {};
        const samples =
          resp?.generateVideoResponse?.generatedSamples ||
          resp?.generatedVideos ||
          resp?.videos ||
          [];

        const firstSample = samples[0] || {};
        const inlineVideoBase64 =
          firstSample?.video?.bytesBase64Encoded ||
          firstSample?.bytesBase64Encoded ||
          firstSample?.videoBase64;

        if (inlineVideoBase64) {
          return jsonResponse({
            videoBase64: inlineVideoBase64,
            mimeType: "video/mp4"
          });
        }

        const videoUri =
          firstSample?.video?.uri ||
          firstSample?.uri ||
          resp?.video?.uri;

        if (!videoUri) {
          lastError = `[${videoModel}] Sem URI/base64. Resposta: ${JSON.stringify(opData).slice(0, 260)}`;
          continue;
        }

        const separator = videoUri.includes("?") ? "&" : "?";
        const fileRes = await fetch(`${videoUri}${separator}key=${env.GEMINI_API_KEY}`);
        if (!fileRes.ok) {
          lastError = `[${videoModel}] Falha ao baixar vídeo (HTTP ${fileRes.status}).`;
          continue;
        }

        const arrayBuffer = await fileRes.arrayBuffer();
        const base64Video = arrayBufferToBase64(arrayBuffer);

        return jsonResponse({
          videoBase64: base64Video,
          mimeType: "video/mp4"
        });
      }

      return jsonResponse({ error: lastError }, 502);
    }
