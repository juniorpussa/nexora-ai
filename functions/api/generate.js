const DEFAULT_NEGATIVE =
  "slow motion, static shot, frozen background, spinning 180 degrees, spinning 360 degrees, rear underside view, tipping over, falling product, floating in mid-air, standing vertically on tail edge, invented back logo, tribal logo, white glowing letter, random text on product, glowing white side strip, vertical white neon poles, glowing blue arcs, invented red LEDs, extra buttons, altered logo font, morphing, distorted product, black bars, letterbox, grey borders, split screen, text, watermark, arrows, blur, lowres, cartoon";

const MUSIC_CLEAN_NEGATIVE =
  "harsh distortion, clipping, static noise, muddy, messy, off-beat, slow, calm, chill, lofi, ambient, lounge, elevator music, soft piano, acoustic, ballad, sleepy, smooth jazz, vocals, singing, speech, talking, dialogue, rap lyrics, 8-bit, chiptune, cowbell solo";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}

function formatFalError(status, raw) {
  let msg = raw || `Erro HTTP ${status} na fal.ai`;
  try {
    const d = JSON.parse(raw);
    msg = d?.detail || d?.error?.message || d?.message || msg;
    if (typeof msg === "object") msg = JSON.stringify(msg);
  } catch {}
  const low = String(msg).toLowerCase();
  if (status === 403 && (low.includes("exhausted") || low.includes("locked") || low.includes("balance"))) {
    return "Saldo esgotado na fal.ai (HTTP 403). Recarregue em fal.ai/dashboard/billing e tente novamente.";
  }
  return `fal.ai (HTTP ${status}): ${String(msg).slice(0, 260)}`;
}

function isQueueUrl(u) {
  return typeof u === "string" && u.startsWith("https://queue.fal.run/");
}

function isAllowedMedia(u) {
  try {
    const p = new URL(u);
    if (p.protocol !== "https:") return false;
    return (
      p.hostname === "fal.media" ||
      p.hostname.endsWith(".fal.media") ||
      p.hostname.endsWith(".fal.ai") ||
      p.hostname === "storage.googleapis.com"
    );
  } catch {
    return false;
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

export async function onRequestGet(context) {
  const proxyUrl = new URL(context.request.url).searchParams.get("proxyUrl");
  if (!proxyUrl || !isAllowedMedia(proxyUrl)) return json({ error: "URL de mídia inválida." }, 400);
  try {
    const up = await fetch(proxyUrl);
    if (!up.ok) return json({ error: `Erro ao baixar mídia (HTTP ${up.status}).` }, up.status);
    const headers = new Headers();
    headers.set("Content-Type", up.headers.get("Content-Type") || "application/octet-stream");
    headers.set("Access-Control-Allow-Origin", "*");
    return new Response(up.body, { status: 200, headers });
  } catch (err) {
    return json({ error: err.message || "Erro no proxy de mídia." }, 502);
  }
}

export async function onRequestPost(context) {
  try {
    const falKey = context.env.FAL_KEY;
    if (!falKey) return json({ error: "Variável FAL_KEY não configurada no Cloudflare Pages." }, 500);

    const body = await context.request.json();
    const task = body?.task || "submit_scene";
    const headers = { Authorization: `Key ${falKey}`, "Content-Type": "application/json" };

    // 1) KEYFRAME 9:16 ULTRA-REALISTA (Nano Banana Edit)
    if (task === "submit_scene" || task === "scene") {
      const prompt = body.imagePrompt || body.prompt || "";
      const mime = body.mimeType || "image/jpeg";
      const imageInput = body.imageUrl || (body.imageBase64 ? `data:${mime};base64,${body.imageBase64}` : "");
      if (!prompt || !imageInput) return json({ error: "Envie a foto do produto e o prompt." }, 400);

      const res = await fetch("https://queue.fal.run/fal-ai/nano-banana/edit", {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt,
          image_urls: [imageInput],
          aspect_ratio: "9:16",
          num_images: 1,
          output_format: "jpeg"
        })
      });
      const raw = await res.text();
      if (!res.ok) return json({ error: formatFalError(res.status, raw) }, res.status);
      const q = JSON.parse(raw);
      return json({ requestId: q.request_id, statusUrl: q.status_url, responseUrl: q.response_url });
    }

    // 2) CLIPE 3D HOLLYWOOD (Kling v2.6 Pro ou Veo 3.1 Fast c/ fallback para Kling)
    if (task === "submit_clip" || task === "clip") {
      const prompt = body.motionPrompt || body.prompt || "";
      const imageUrl = body.imageUrl || (body.imageBase64 ? `data:${body.mimeType || "image/jpeg"};base64,${body.imageBase64}` : "");
      const duration = String(body.duration === "10" || body.duration === 10 ? "10" : "5");
      const generateAudio = Boolean(body.generateAudio);
      const negativePrompt = body.negativePrompt || DEFAULT_NEGATIVE;
      const engine = body.engine === "veo" ? "veo" : "kling";

      if (!prompt || !imageUrl) return json({ error: "Envie a cena base e o prompt de vídeo." }, 400);

      const candidates = engine === "veo"
        ? [
            {
              name: "Veo 3.1 Fast",
              url: "https://queue.fal.run/fal-ai/veo3.1/fast/image-to-video",
              payload: { prompt, image_url: imageUrl, aspect_ratio: "9:16", duration: "4s", generate_audio: false }
            },
            {
              name: "Kling v2.6 Pro",
              url: "https://queue.fal.run/fal-ai/kling-video/v2.6/pro/image-to-video",
              payload: { prompt, image_url: imageUrl, duration, aspect_ratio: "9:16", generate_audio: generateAudio, negative_prompt: negativePrompt }
            }
          ]
        : [
            {
              name: "Kling v2.6 Pro",
              url: "https://queue.fal.run/fal-ai/kling-video/v2.6/pro/image-to-video",
              payload: { prompt, image_url: imageUrl, duration, aspect_ratio: "9:16", generate_audio: generateAudio, negative_prompt: negativePrompt }
            }
          ];

      let lastErr = "Falha ao enfileirar vídeo.";
      for (const c of candidates) {
        const res = await fetch(c.url, { method: "POST", headers, body: JSON.stringify(c.payload) });
        const raw = await res.text();
        if (res.ok) {
          const q = JSON.parse(raw);
          return json({ engine: c.name, requestId: q.request_id, statusUrl: q.status_url, responseUrl: q.response_url });
        }
        lastErr = formatFalError(res.status, raw);
        if (res.status === 403) return json({ error: lastErr }, 403);
      }
      return json({ error: lastErr }, 502);
    }

    // 3) TRILHA DE ESTÚDIO REAL COM FALLBACK POR ÍNDICE (0: Lyria 2 → 1: CassetteAI → 2: Stable Audio)
    if (task === "submit_music") {
      const prompt = body.musicPrompt || body.prompt || "High-energy modern electronic slap house commercial beat, punchy bouncy bassline, crisp driving four-on-the-floor kick, bright energetic synth hook, 128 BPM, clean studio master, strictly instrumental";
      const musicNeg = body.musicNegativePrompt || MUSIC_CLEAN_NEGATIVE;
      const dur = Math.min(35, Math.max(15, Number(body.duration) || 20));
      const startIndex = Math.max(0, Math.min(2, Number(body.engineIndex) || 0));

      const endpoints = [
        { name: "Lyria 2", url: "https://queue.fal.run/fal-ai/lyria2", payload: { prompt, negative_prompt: musicNeg } },
        { name: "CassetteAI", url: "https://queue.fal.run/fal-ai/cassetteai/music-generator", payload: { prompt, duration: dur } },
        { name: "Stable Audio", url: "https://queue.fal.run/fal-ai/stable-audio", payload: { prompt, seconds_total: dur, steps: 45 } }
      ];

      let lastErr = "Nenhum gerador de trilha disponível.";
      for (let i = startIndex; i < endpoints.length; i++) {
        const ep = endpoints[i];
        const res = await fetch(ep.url, { method: "POST", headers, body: JSON.stringify(ep.payload) });
        const raw = await res.text();
        if (res.ok) {
          const q = JSON.parse(raw);
          return json({ engine: ep.name, engineIndex: i, requestId: q.request_id, statusUrl: q.status_url, responseUrl: q.response_url });
        }
        lastErr = formatFalError(res.status, raw);
        if (res.status === 403) return json({ error: lastErr }, 403);
      }
      return json({ error: lastErr }, 502);
    }

    // 4) CONSULTA DE STATUS NA FILA
    if (task === "poll") {
      const { statusUrl, responseUrl } = body;
      if (!isQueueUrl(statusUrl) || !isQueueUrl(responseUrl)) return json({ error: "URLs da fila inválidas." }, 400);

      const stRes = await fetch(statusUrl, { method: "GET", headers: { Authorization: `Key ${falKey}` } });
      const stRaw = await stRes.text();
      if (!stRes.ok) return json({ error: formatFalError(stRes.status, stRaw) }, stRes.status);
      const st = JSON.parse(stRaw);
      const status = st.status || "IN_PROGRESS";

      if (status === "FAILED" || status === "CANCELLED") {
        return json({ status, error: st.error || "Falha na geração da fal.ai." }, 500);
      }
      if (status !== "COMPLETED") {
        return json({ status, queuePosition: typeof st.queue_position === "number" ? st.queue_position : null });
      }

      const finRes = await fetch(responseUrl, { method: "GET", headers: { Authorization: `Key ${falKey}` } });
      const finRaw = await finRes.text();
      if (!finRes.ok) return json({ error: formatFalError(finRes.status, finRaw) }, finRes.status);
      const result = JSON.parse(finRaw);
      const payload = result?.response || result;

      const imageUrl = payload?.images?.[0]?.url || payload?.image?.url || null;
      const videoUrl = payload?.video?.url || payload?.videos?.[0]?.url || null;
      const audioUrl = payload?.audio?.url || payload?.audio_file?.url || payload?.music?.url || null;

      if (!imageUrl && !videoUrl && !audioUrl) return json({ error: "A fal.ai concluiu sem retornar mídia." }, 502);
      return json({ status: "COMPLETED", imageUrl, videoUrl, audioUrl });
    }

    return json({ error: `Tarefa desconhecida: ${task}` }, 400);
  } catch (err) {
    return json({ error: err.message || "Erro interno no Worker." }, 500);
  }
}
