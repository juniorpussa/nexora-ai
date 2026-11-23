const DEFAULT_NEGATIVE =
  "static frozen frame, spinning 180 degrees, turntable spin, rear view, tipping over, floating product, invented logo, altered logo, misspelled text, random text on product, glowing LED strip on product, illuminated buttons, fake neon outline, speed lines, comic streaks, morphing, distorted product, extra fingers, deformed hands, plastic CGI look, 3d render look, black bars, grey borders, watermark, arrows, blur, lowres, cartoon";

const MUSIC_CLEAN_NEGATIVE =
  "tropical house, ukulele, cheesy corporate, stock music, elevator music, acoustic guitar, hand claps, happy whistle, lofi, ambient, chill, lounge, soft piano, acoustic, ballad, sleepy, smooth jazz, sad, gloomy, horror, vocals, singing, speech, talking, dialogue, rap lyrics, 8-bit, chiptune, harsh noise, clipping, static, muddy";

const TTS_VOICE_MAP = {
  male_adam: { el: "Brian", mm: "Deep_Voice_Man", kk: "pm_alex", preferPtNative: true },
  male_tiktok: { el: "Brian", mm: "Casual_Guy", kk: "pm_alex" },
  male_exec: { el: "Daniel", mm: "Patient_Man", kk: "pm_santa" },
  male_impact: { el: "George", mm: "Deep_Voice_Man", kk: "pm_alex" },
  female_natasha: { el: "Sarah", mm: "Lively_Girl", kk: "pf_dora", preferPtNative: true },
  female_viral: { el: "Jessica", mm: "Lively_Girl", kk: "pf_dora" },
  female_tiktok: { el: "Rachel", mm: "Wise_Woman", kk: "pf_dora" },
  female_lux: { el: "Charlotte", mm: "Calm_Woman", kk: "pf_dora" }
};

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

    // 2) CLIPE 3D CINEMA / USO REAL / UGC / POV (Kling v2.6 Pro ou Veo 3.1 Fast c/ fallback)
    if (task === "submit_clip" || task === "clip") {
      const prompt = body.motionPrompt || body.prompt || "";
      const imageUrl = body.imageUrl || (body.imageBase64 ? `data:${body.mimeType || "image/jpeg"};base64,${body.imageBase64}` : "");
      const duration = String(body.duration === "10" || body.duration === 10 ? "10" : "5");
      const generateAudio = Boolean(body.generateAudio);
      const negativePrompt = String(body.negativePrompt || DEFAULT_NEGATIVE).slice(0, 540);
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

    // 3) TRILHA DE ESTÚDIO REAL COM FALLBACK TRIPLO (0: Lyria 2 -> 1: CassetteAI -> 2: Stable Audio)
    if (task === "submit_music") {
      const prompt = body.musicPrompt || body.prompt || "Sleek ultra-modern flagship luxury brand commercial electronic soundtrack, deep punchy analog Moog sub-bass pulse, crisp tight studio percussion, 124 BPM, clean studio master, strictly instrumental";
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

    // 4) CLONAGEM EXATA DE VOZ (Adam / Natasha) VIA MINIMAX VOICE CLONE
    if (task === "clone_voice") {
      const mime = body.mimeType || "audio/wav";
      const audioInput = body.audioUrl || (body.audioBase64 ? `data:${mime};base64,${body.audioBase64}` : "");
      if (!audioInput) return json({ error: "Envie um áudio de referência (10s a 30s) para clonar a voz." }, 400);

      const res = await fetch("https://queue.fal.run/fal-ai/minimax/voice-clone", {
        method: "POST",
        headers,
        body: JSON.stringify({
          audio_url: audioInput,
          noise_reduction: true,
          need_volume_normalization: true
        })
      });
      const raw = await res.text();
      if (!res.ok) return json({ error: formatFalError(res.status, raw) }, res.status);
      const q = JSON.parse(raw);
      return json({ engine: "MiniMax Voice Clone", requestId: q.request_id, statusUrl: q.status_url, responseUrl: q.response_url });
    }

    // 5) NARRAÇÃO PT-BR (Clone Exato MiniMax -> PT-BR Nativo MiniMax/Kokoro -> ElevenLabs Fallback)
    if (task === "submit_tts") {
      const text = String(body.text || "").trim();
      if (!text) return json({ error: "Digite o roteiro da narração em português." }, 400);

      const voiceKey = body.voiceId || (body.gender === "female" ? "female_natasha" : "male_adam");
      const voicePreset = TTS_VOICE_MAP[voiceKey] || TTS_VOICE_MAP.male_adam;

      // Priority: browser-saved clone ID > global Cloudflare Pages env var (ADAM_VOICE_ID / NATASHA_VOICE_ID)
      let customVoiceId = typeof body.customVoiceId === "string" && body.customVoiceId.trim() ? body.customVoiceId.trim() : "";
      if (!customVoiceId && voiceKey === "male_adam" && context.env.ADAM_VOICE_ID) {
        customVoiceId = String(context.env.ADAM_VOICE_ID).trim();
      }
      if (!customVoiceId && voiceKey === "female_natasha" && context.env.NATASHA_VOICE_ID) {
        customVoiceId = String(context.env.NATASHA_VOICE_ID).trim();
      }

      const speed = Math.min(1.25, Math.max(0.85, Number(body.speed) || 1.05));
      const endpoints = [];

      if (customVoiceId) {
        const cloneTag = voiceKey === "male_adam" ? "MiniMax Clone Exato (Adam)" : voiceKey === "female_natasha" ? "MiniMax Clone Exato (Natasha)" : "MiniMax Clone Exato";
        endpoints.push({
          name: cloneTag,
          url: "https://queue.fal.run/fal-ai/minimax/speech-02-hd",
          payload: {
            text,
            voice_setting: { voice_id: customVoiceId, speed, vol: 1.0, pitch: 0 },
            language_boost: "Portuguese",
            output_format: "url"
          }
        });
      }

      // If no clone yet for Adam/Natasha, prefer native PT-BR pronunciation (MiniMax PT-BR / Kokoro PT-BR) instead of English-accented ElevenLabs Bill
      if (voicePreset.preferPtNative) {
        endpoints.push(
          {
            name: "MiniMax PT-BR HD (Sem Clone)",
            url: "https://queue.fal.run/fal-ai/minimax/speech-02-hd",
            payload: {
              text,
              voice_setting: { voice_id: voicePreset.mm, speed, vol: 1.0, pitch: 0 },
              language_boost: "Portuguese",
              output_format: "url"
            }
          },
          {
            name: "Kokoro PT-BR Nativo",
            url: "https://queue.fal.run/fal-ai/kokoro/brazilian-portuguese",
            payload: { prompt: text, voice: voicePreset.kk, speed }
          },
          {
            name: `ElevenLabs (${voicePreset.el})`,
            url: "https://queue.fal.run/fal-ai/elevenlabs/tts/multilingual-v2",
            payload: { text, voice: voicePreset.el, stability: 0.45, similarity_boost: 0.80, speed }
          }
        );
      } else {
        endpoints.push(
          {
            name: `ElevenLabs (${voicePreset.el})`,
            url: "https://queue.fal.run/fal-ai/elevenlabs/tts/multilingual-v2",
            payload: { text, voice: voicePreset.el, stability: 0.45, similarity_boost: 0.80, speed }
          },
          {
            name: "MiniMax Speech-02 HD",
            url: "https://queue.fal.run/fal-ai/minimax/speech-02-hd",
            payload: {
              text,
              voice_setting: { voice_id: voicePreset.mm, speed, vol: 1.0, pitch: 0 },
              language_boost: "Portuguese",
              output_format: "url"
            }
          },
          {
            name: "Kokoro PT-BR",
            url: "https://queue.fal.run/fal-ai/kokoro/brazilian-portuguese",
            payload: { prompt: text, voice: voicePreset.kk, speed }
          }
        );
      }

      const startIndex = Math.max(0, Math.min(endpoints.length - 1, Number(body.engineIndex) || 0));
      let lastErr = "Nenhum motor de narração PT-BR disponível.";
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

    // 6) SINCRONIZAÇÃO EXATA PALAVRA POR PALAVRA PARA LEGENDAS TIKTOK SHOP (Whisper PT-BR)
    if (task === "transcribe_words") {
      const audioUrl = body.audioUrl || "";
      if (!audioUrl) return json({ error: "URL de áudio obrigatória para sincronizar legendas." }, 400);

      const res = await fetch("https://queue.fal.run/fal-ai/whisper", {
        method: "POST",
        headers,
        body: JSON.stringify({
          audio_url: audioUrl,
          task: "transcribe",
          language: "pt",
          chunk_level: "word",
          version: "3"
        })
      });
      const raw = await res.text();
      if (!res.ok) return json({ error: formatFalError(res.status, raw) }, res.status);
      const q = JSON.parse(raw);
      return json({ engine: "Whisper Word-Sync", requestId: q.request_id, statusUrl: q.status_url, responseUrl: q.response_url });
    }

    // 7) REMOVEDOR DE FUNDO PNG TRANSPARENTE (0: BiRefNet v2 -> 1: Bria Remove BG -> 2: Rembg)
    if (task === "remove_bg") {
      const mime = body.mimeType || "image/jpeg";
      const imageInput = body.imageUrl || (body.imageBase64 ? `data:${mime};base64,${body.imageBase64}` : "");
      if (!imageInput) return json({ error: "Envie a imagem do produto para remover o fundo." }, 400);

      const startIndex = Math.max(0, Math.min(2, Number(body.engineIndex) || 0));
      const endpoints = [
        {
          name: "BiRefNet v2 HD",
          url: "https://queue.fal.run/fal-ai/birefnet/v2",
          payload: {
            image_url: imageInput,
            model: "General Use (Heavy)",
            operating_resolution: "1024x1024",
            output_format: "png",
            refine_foreground: true
          }
        },
        {
          name: "Bria Remove BG",
          url: "https://queue.fal.run/fal-ai/bria/background/remove",
          payload: { image_url: imageInput }
        },
        {
          name: "Rembg Fast",
          url: "https://queue.fal.run/fal-ai/imageutils/rembg",
          payload: { image_url: imageInput }
        }
      ];

      let lastErr = "Falha ao remover fundo da imagem.";
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

    // 8) CONSULTA DE STATUS NA FILA
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

      const imageUrl = payload?.image?.url || payload?.images?.[0]?.url || payload?.output?.url || null;
      const videoUrl = payload?.video?.url || payload?.videos?.[0]?.url || null;
      const audioUrl =
        payload?.audio?.url ||
        payload?.audio_url ||
        payload?.audio_file?.url ||
        payload?.music?.url ||
        (typeof payload?.audio === "string" ? payload.audio : null);
      const customVoiceId = payload?.custom_voice_id || payload?.voice_id || result?.custom_voice_id || null;
      const chunks = Array.isArray(payload?.chunks) ? payload.chunks : null;
      const transcriptText = typeof payload?.text === "string" ? payload.text : null;

      if (!imageUrl && !videoUrl && !audioUrl && !customVoiceId && !chunks && !transcriptText) {
        return json({ error: "A fal.ai concluiu sem retornar mídia ou dados." }, 502);
      }
      return json({ status: "COMPLETED", imageUrl, videoUrl, audioUrl, customVoiceId, chunks, transcriptText });
    }

    return json({ error: `Tarefa desconhecida: ${task}` }, 400);
  } catch (err) {
    return json({ error: err.message || "Erro interno no Worker." }, 500);
  }
}
