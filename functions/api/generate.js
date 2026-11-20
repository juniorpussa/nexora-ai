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
          lastError = startData?.error?.message || `Erro ao iniciar vídeo com ${videoModel} (HTTP ${startRes.status})`;
          continue;
        }

        const operationName = startData?.name;
        if (!operationName) {
          lastError = `Operação de vídeo sem identificador em ${videoModel}.`;
          continue;
        }

        const opUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${env.GEMINI_API_KEY}`;
        let opData = startData;

        for (let i = 0; i < 16; i++) {
          if (opData.done) break;
          await new Promise((r) => setTimeout(r, 4000));
          const pollRes = await fetch(opUrl);
          opData = await pollRes.json();
        }

        if (!opData.done) {
          lastError = "Renderização ainda em curso no servidor. Tente novamente em instantes.";
          continue;
        }

        if (opData.error) {
          lastError = opData.error.message || `Falha na renderização em ${videoModel}.`;
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
          lastError = `Modelo ${videoModel} concluiu sem URI de vídeo.`;
          continue;
        }

        const separator = videoUri.includes("?") ? "&" : "?";
        const fileRes = await fetch(`${videoUri}${separator}key=${env.GEMINI_API_KEY}`);
        if (!fileRes.ok) {
          lastError = `Falha ao baixar o vídeo gerado (HTTP ${fileRes.status}).`;
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
