const FAL_QUEUE_BASE = "https://queue.fal.run";

const TTS_VOICE_MAP = {
  "pf_dylan": { voice: "pf_dylan", label: "Dylan (PT-BR Masculino)", gender: "male" },
  "pm_alex": { voice: "pm_alex", label: "Alex (PT-BR Masculino)", gender: "male" },
  "pm_santa": { voice: "pm_santa", label: "Santa (PT-BR Masculino)", gender: "male" },
  "am_adam": { voice: "am_adam", label: "Adam (EN Commercial Male)", gender: "male" },
  "am_michael": { voice: "am_michael", label: "Michael (EN Deep Male)", gender: "male" },
  "am_eric": { voice: "am_eric", label: "Eric (EN Energetic Male)", gender: "male" },
  "bm_george": { voice: "bm_george", label: "George (UK Male)", gender: "male" },
  "bm_lewis": { voice: "bm_lewis", label: "Lewis (UK Narrator Male)", gender: "male" },
  "pf_ora": { voice: "pf_ora", label: "Ora (PT-BR Feminino)", gender: "female" },
  "af_bella": { voice: "af_bella", label: "Bella (EN Commercial Female)", gender: "female" },
  "af_sarah": { voice: "af_sarah", label: "Sarah (EN Bright Female)", gender: "female" },
  "af_nova": { voice: "af_nova", label: "Nova (EN Modern Female)", gender: "female" },
  "af_nicole": { voice: "af_nicole", label: "Nicole (EN Warm Female)", gender: "female" },
  "bf_emma": { voice: "bf_emma", label: "Emma (UK Female)", gender: "female" },
  "bf_isabella": { voice: "bf_isabella", label: "Isabella (UK Expressive Female)", gender: "female" },
};

const ALLOWED_SCENE_MODELS = new Set([
  "fal-ai/nano-banana/edit",
  "fal-ai/nano-banana",
  "fal-ai/flux-pro/v1.1",
  "fal-ai/flux-pro/kontext",
  "fal-ai/flux/dev",
  "fal-ai/flux/schnell",
]);

const CLIP_MODEL_TIERS = {
  "fal-ai/kling-video/v2.6/pro/image-to-video": 12,
  "fal-ai/veo3.1/fast/image-to-video": 12,
  "fal-ai/kling-video/v2.1/pro/image-to-video": 12,
  "fal-ai/kling-video/v1.6/pro/image-to-video": 12,
  "fal-ai/kling-video/v2.1/standard/image-to-video": 6,
  "fal-ai/kling-video/v1.6/standard/image-to-video": 6,
  "fal-ai/wan-i2v": 6,
  "fal-ai/wan/v2.1/1.3b/image-to-video": 6,
  "fal-ai/wan-2.1/image-to-video": 6,
  "fal-ai/wan-2.2/image-to-video": 6,
};

const DEFAULT_SCENE_MODEL_EDIT = "fal-ai/nano-banana/edit";
const DEFAULT_SCENE_MODEL_T2I = "fal-ai/flux-pro/v1.1";
const DEFAULT_CLIP_MODEL = "fal-ai/kling-video/v2.6/pro/image-to-video";

const ACTION_CREDIT_COSTS = {
  submit_scene: 2,
  submit_clip: 12,
  submit_music: 3,
  clone_voice: 3,
  submit_tts: 2,
  transcribe_words: 1,
  remove_bg: 1,
};

const ACTION_DESCRIPTIONS = {
  submit_scene: "Geração de cena visual 9:16",
  submit_clip: "Geração de clipe de vídeo cinematográfico",
  submit_music: "Geração de trilha sonora / batida",
  clone_voice: "Clonagem de voz de referência",
  submit_tts: "Narração de voz (TTS)",
  transcribe_words: "Sincronização de legendas",
  remove_bg: "Remoção de fundo de imagem",
};

const ACTION_ALIASES = {
  remove_bg: "remove_bg",
  removebg: "remove_bg",
  remove_background: "remove_bg",
  bg_remove: "remove_bg",
  submit_scene: "submit_scene",
  generate_image: "submit_scene",
  image: "submit_scene",
  scene: "submit_scene",
  submit_clip: "submit_clip",
  generate_video: "submit_clip",
  video: "submit_clip",
  clip: "submit_clip",
  submit_tts: "submit_tts",
  tts: "submit_tts",
  voice: "submit_tts",
  transcribe_words: "transcribe_words",
  transcribe: "transcribe_words",
  subtitles: "transcribe_words",
  submit_music: "submit_music",
  music: "submit_music",
  clone_voice: "clone_voice",
  poll: "poll",
  status: "poll",
  check_status: "poll",
};

function extractImageInput(body) {
  if (!body || typeof body !== "object") return "";
  const mime =
    typeof body.mimeType === "string" && body.mimeType.startsWith("image/")
      ? body.mimeType
      : "image/jpeg";

  const candidates = [
    body.image_url,
    body.imageUrl,
    body.image,
    body.file,
    body.imageBase64,
    body.image_base64,
    body.dataUrl,
    body.data_url,
  ];
  for (const item of candidates) {
    if (!item) continue;
    if (typeof item === "string") {
      const trimmed = item.trim();
      if (!trimmed) continue;
      if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("data:image/")
      ) {
        return trimmed;
      }
      const cleanB64 = trimmed.replace(/\s+/g, "");
      if (/^[A-Za-z0-9+/=]{100,}$/.test(cleanB64)) {
        return `data:${mime};base64,${cleanB64}`;
      }
    } else if (typeof item === "object") {
      const nested =
        item.url || item.image_url || item.imageUrl || item.dataUrl || item.base64 || "";
      if (typeof nested === "string" && nested.trim()) {
        return extractImageInput({ image_url: nested.trim(), mimeType: mime });
      }
    }
  }
  return "";
}

function extractMediaUrls(obj) {
  const empty = { imageUrl: "", videoUrl: "", audioUrl: "", url: "" };
  if (!obj || typeof obj !== "object") return empty;

  let imageUrl = "";
  let videoUrl = "";
  let audioUrl = "";

  if (obj.image && typeof obj.image === "object" && typeof obj.image.url === "string") {
    imageUrl = obj.image.url.trim();
  } else if (typeof obj.image === "string" && obj.image.trim()) {
    imageUrl = obj.image.trim();
  } else if (Array.isArray(obj.images) && obj.images.length > 0) {
    const first = obj.images[0];
    if (typeof first === "string" && first.trim()) imageUrl = first.trim();
    else if (first && typeof first.url === "string" && first.url.trim()) imageUrl = first.url.trim();
  }
  if (!imageUrl && typeof obj.imageUrl === "string" && obj.imageUrl.trim()) imageUrl = obj.imageUrl.trim();
  if (!imageUrl && typeof obj.image_url === "string" && obj.image_url.trim()) imageUrl = obj.image_url.trim();

  if (obj.video && typeof obj.video === "object" && typeof obj.video.url === "string") {
    videoUrl = obj.video.url.trim();
  } else if (typeof obj.video === "string" && obj.video.trim()) {
    videoUrl = obj.video.trim();
  } else if (Array.isArray(obj.videos) && obj.videos.length > 0) {
    const firstV = obj.videos[0];
    if (typeof firstV === "string" && firstV.trim()) videoUrl = firstV.trim();
    else if (firstV && typeof firstV.url === "string" && firstV.url.trim()) videoUrl = firstV.url.trim();
  }
  if (!videoUrl && typeof obj.videoUrl === "string" && obj.videoUrl.trim()) videoUrl = obj.videoUrl.trim();
  if (!videoUrl && typeof obj.video_url === "string" && obj.video_url.trim()) videoUrl = obj.video_url.trim();

  if (obj.audio_file && typeof obj.audio_file === "object" && typeof obj.audio_file.url === "string") {
    audioUrl = obj.audio_file.url.trim();
  } else if (obj.audio && typeof obj.audio === "object" && typeof obj.audio.url === "string") {
    audioUrl = obj.audio.url.trim();
  } else if (typeof obj.audio === "string" && obj.audio.trim()) {
    audioUrl = obj.audio.trim();
  }
  if (!audioUrl && typeof obj.audioUrl === "string" && obj.audioUrl.trim()) audioUrl = obj.audioUrl.trim();
  if (!audioUrl && typeof obj.audio_url === "string" && obj.audio_url.trim()) audioUrl = obj.audio_url.trim();

  if (!imageUrl && !videoUrl && !audioUrl) {
    if (obj.result && typeof obj.result === "object") return extractMediaUrls(obj.result);
    if (obj.data && typeof obj.data === "object") return extractMediaUrls(obj.data);
  }

  const fallbackUrl =
    videoUrl ||
    imageUrl ||
    audioUrl ||
    (typeof obj.url === "string" ? obj.url.trim() : "");

  return { imageUrl, videoUrl, audioUrl, url: fallbackUrl };
}

function normalizeFalQueueUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  const s = rawUrl.trim();
  if (!s) return "";
  if (s.startsWith("https://queue.fal.run/")) return s;
  if (s.startsWith("http://queue.fal.run/")) return s.replace("http://", "https://");
  if (s.startsWith("https://fal.run/")) return s.replace("https://fal.run/", "https://queue.fal.run/");
  if (s.startsWith("http://fal.run/")) return s.replace("http://fal.run/", "https://queue.fal.run/");
  if (s.startsWith("/")) return `${FAL_QUEUE_BASE}${s}`;
  return "";
}

function buildQueueUrlFromRequestId(endpoint, requestId) {
  const cleanEp = String(endpoint || "").trim().replace(/^\/+/, "");
  const cleanId = String(requestId || "").trim().replace(/^\/+/, "");
  if (!cleanEp || !cleanId) return "";
  return `${FAL_QUEUE_BASE}/${cleanEp}/requests/${cleanId}/status`;
}

function formatFalError(json, fallback = "Falha na geração fal.ai.") {
  if (!json || typeof json !== "object") return fallback;
  if (typeof json.error === "string" && json.error.trim()) return json.error.trim();
  if (typeof json.detail === "string" && json.detail.trim()) return json.detail.trim();
  if (Array.isArray(json.detail) && json.detail.length > 0) {
    return json.detail
      .map((d) => {
        const loc = Array.isArray(d?.loc) ? d.loc.join(".") : "";
        const msg = d?.msg || JSON.stringify(d);
        return loc ? `${loc}: ${msg}` : msg;
      })
      .join(" | ");
  }
  return fallback;
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// Proxy GET para download seguro de mídia da fal.ai sem erro de CORS no Canvas
export async function onRequestGet(context) {
  const urlObj = new URL(context.request.url);
  const proxyUrl = urlObj.searchParams.get("proxyUrl");
  if (!proxyUrl) {
    return jsonResponse({ error: "Parâmetro proxyUrl ausente." }, 400);
  }
  try {
    const parsed = new URL(proxyUrl);
    const allowedHosts = ["fal.media", "storage.googleapis.com", "queue.fal.run", "fal.run"];
    const okHost = allowedHosts.some(
      (h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`)
    );
    if (!okHost) {
      return jsonResponse({ error: "Host não permitido no proxy." }, 403);
    }
    const resp = await fetch(proxyUrl);
    return new Response(resp.body, {
      status: resp.status,
      headers: {
        "Content-Type": resp.headers.get("Content-Type") || "application/octet-stream",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return jsonResponse({ error: "Erro no proxy de mídia: " + (err?.message || "falha") }, 502);
  }
}

function getBearerToken(request) {
  const authHeader = request.headers.get("Authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return "";
  return authHeader.slice(7).trim();
}

function resolveModelCandidate(body) {
  const raw = body?.model ?? body?.engine ?? body?.endpoint ?? "";
  if (typeof raw === "string") return raw.trim().replace(/^\/+/, "");
  if (raw && typeof raw === "object") {
    return String(raw.id || raw.model || raw.endpoint || raw.slug || "").trim().replace(/^\/+/, "");
  }
  return "";
}

function resolvePromptCandidate(body) {
  return String(
    body?.prompt ??
      body?.imagePrompt ??
      body?.motionPrompt ??
      body?.musicPrompt ??
      body?.text ??
      ""
  ).trim();
}

function resolveAllowedSceneModel(body, hasInputImage) {
  const cleaned = resolveModelCandidate(body);
  if (ALLOWED_SCENE_MODELS.has(cleaned)) return cleaned;
  return hasInputImage ? DEFAULT_SCENE_MODEL_EDIT : DEFAULT_SCENE_MODEL_T2I;
}

function resolveAllowedClipModel(body) {
  const cleaned = resolveModelCandidate(body).toLowerCase();
  if (cleaned === "veo") return "fal-ai/veo3.1/fast/image-to-video";
  if (cleaned === "kling") return "fal-ai/kling-video/v2.6/pro/image-to-video";
  return Object.prototype.hasOwnProperty.call(CLIP_MODEL_TIERS, cleaned)
    ? cleaned
    : DEFAULT_CLIP_MODEL;
}

async function getAuthenticatedUser(env, accessToken) {
  if (!accessToken || !env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return null;
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) return null;
  const user = await res.json();
  return user && user.id ? user : null;
}

async function deductUserCredits(env, userId, amount, task, description) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/deduct_credits`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      p_user_id: userId,
      p_amount: amount,
      p_task: task,
      p_description: description,
      p_reference_id: `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error("Erro ao validar saldo de créditos: " + txt);
  }

  const data = await res.json();
  const row = Array.isArray(data) ? data[0] : data;
  const rawBalance = row?.new_balance ?? row?.remaining_credits ?? row?.credits ?? 0;
  return {
    ok: Boolean(row?.ok),
    newBalance: Number(rawBalance),
  };
}

async function refundUserCredits(env, userId, amount, task, reason) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !userId || amount <= 0) return;
  try {
    const rpcRes = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/add_credits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        p_user_id: userId,
        p_amount: amount,
        p_task: `${task}_refund`,
        p_description: `Estorno automático: ${reason}`,
        p_reference_id: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      }),
    });

    if (!rpcRes.ok) {
      const getRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=credits`,
        {
          headers: {
            apikey: env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
        }
      );
      if (getRes.ok) {
        const rows = await getRes.json();
        const cur = Number(rows?.[0]?.credits ?? 0);
        await fetch(
          `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              apikey: env.SUPABASE_SERVICE_ROLE_KEY,
              Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({ credits: cur + amount }),
          }
        );
      }
    }
  } catch (_) {}
}

async function falFetch(endpointPath, falKey, method = "POST", bodyObj = null) {
  const cleanPath = String(endpointPath || "").replace(/^\/+/, "");
  const url = `${FAL_QUEUE_BASE}/${cleanPath}`;
  const init = {
    method,
    headers: {
      Authorization: `Key ${falKey}`,
      "Content-Type": "application/json",
    },
  };
  if (bodyObj && method !== "GET") {
    init.body = JSON.stringify(bodyObj);
  }
  const resp = await fetch(url, init);
  const text = await resp.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (_) {
    json = { raw: text };
  }
  return { ok: resp.ok, status: resp.status, data: json };
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const falKey = env.FAL_KEY;
    if (!falKey) {
      return jsonResponse({ error: "Chave de geração não configurada no servidor." }, 500);
    }

    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return jsonResponse({ error: "Configuração do banco de dados incompleta no servidor." }, 500);
    }

    const token = getBearerToken(request);
    const user = await getAuthenticatedUser(env, token);
    if (!user) {
      return jsonResponse({ error: "Faça login para gerar imagens, vídeos ou narrações." }, 401);
    }

    const body = await request.json();
    const rawAction = String(body.action || body.mode || body.task || "").trim().toLowerCase();
    const action = ACTION_ALIASES[rawAction] || rawAction;
    const resolvedImageUrl = extractImageInput(body);

    if (action === "poll") {
      if (body.result && typeof body.result === "object") {
        const media = extractMediaUrls(body.result);
        return jsonResponse({
          status: "COMPLETED",
          result: body.result,
          imageUrl: media.imageUrl,
          image_url: media.imageUrl,
          videoUrl: media.videoUrl,
          video_url: media.videoUrl,
          audioUrl: media.audioUrl,
          audio_url: media.audioUrl,
          chunks: body.result?.chunks || null,
          url: media.url,
        });
      }

      const rawStatusCandidates = [
        body.statusUrl,
        body.status_url,
        body.pollUrl,
        body.poll_url,
        body.url,
        body.queued?.statusUrl,
        body.queued?.status_url,
      ];

      let statusUrl = "";
      for (const cand of rawStatusCandidates) {
        const norm = normalizeFalQueueUrl(cand);
        if (norm) {
          statusUrl = norm;
          break;
        }
      }

      if (!statusUrl) {
        const reqId =
          body.requestId ||
          body.request_id ||
          body.queued?.requestId ||
          body.queued?.request_id ||
          "";
        const ep =
          resolveModelCandidate(body) ||
          body.queued?.endpoint ||
          "fal-ai/birefnet";
        statusUrl = buildQueueUrlFromRequestId(ep, reqId);
      }

      const rawResponseCandidates = [
        body.responseUrl,
        body.response_url,
        body.resultUrl,
        body.result_url,
        body.queued?.responseUrl,
        body.queued?.response_url,
      ];
      let responseUrl = "";
      for (const cand of rawResponseCandidates) {
        const norm = normalizeFalQueueUrl(cand);
        if (norm) {
          responseUrl = norm;
          break;
        }
      }

      if (!statusUrl) {
        return jsonResponse({ error: "URL de consulta inválida." }, 400);
      }

      const stResp = await fetch(statusUrl, {
        method: "GET",
        headers: { Authorization: `Key ${falKey}` },
      });
      const stJson = await stResp.json().catch(() => ({}));

      if (!stResp.ok && stResp.status >= 400 && stResp.status < 500) {
        const refundAmt = Number(body.charged ?? body.creditCost ?? 0);
        if (refundAmt > 0) {
          await refundUserCredits(env, user.id, refundAmt, "poll_error", formatFalError(stJson, "Falha ao consultar fila"));
        }
        return jsonResponse({
          error: formatFalError(stJson, "Falha ao consultar fila na IA."),
          refunded: refundAmt > 0,
        }, 400);
      }

      if (stJson?.status === "FAILED") {
        const refundAmt = Number(body.charged ?? body.creditCost ?? 0);
        if (refundAmt > 0) {
          await refundUserCredits(env, user.id, refundAmt, "job_failed", formatFalError(stJson, "Falha no processamento"));
        }
        return jsonResponse({
          status: "FAILED",
          error: formatFalError(stJson, "Falha no processamento da mídia."),
          refunded: refundAmt > 0,
        });
      }

      if (stJson?.status === "COMPLETED") {
        const finalUrl = responseUrl || statusUrl.replace(/\/status\/?$/, "");
        const resResp = await fetch(finalUrl, {
          method: "GET",
          headers: { Authorization: `Key ${falKey}` },
        });
        const resJson = await resResp.json().catch(() => ({}));

        // IMPORTANTE: se a fal.ai retornou erro dentro do resultado (ex.: HTTP 422), reportar como FAILED!
        if (!resResp.ok) {
          const errDetail = formatFalError(resJson, `Erro no resultado da IA (HTTP ${resResp.status})`);
          const refundAmt = Number(body.charged ?? body.creditCost ?? 0);
          if (refundAmt > 0) {
            await refundUserCredits(env, user.id, refundAmt, "job_result_error", errDetail);
          }
          return jsonResponse({
            status: "FAILED",
            error: errDetail,
            refunded: refundAmt > 0,
          });
        }

        const media = extractMediaUrls(resJson);
        return jsonResponse({
          status: "COMPLETED",
          result: resJson,
          imageUrl: media.imageUrl,
          image_url: media.imageUrl,
          videoUrl: media.videoUrl,
          video_url: media.videoUrl,
          audioUrl: media.audioUrl,
          audio_url: media.audioUrl,
          chunks: resJson?.chunks || null,
          customVoiceId: resJson?.custom_voice_id || resJson?.voice_id || null,
          url: media.url,
        });
      }

      return jsonResponse({
        status: stJson?.status || "IN_QUEUE",
        queue_position: stJson?.queue_position ?? 0,
        queuePosition: stJson?.queue_position ?? 0,
      });
    }

    if (action === "remove_bg" && !resolvedImageUrl) {
      return jsonResponse({ error: "Envie a imagem do produto para remover o fundo." }, 400);
    }

    if (action === "submit_tts") {
      const rawText = String(body.text || "");
      if (!rawText.trim()) {
        return jsonResponse({ error: "Digite o texto da narração antes de gerar." }, 400);
      }
      if (rawText.length > 600) {
        return jsonResponse({
          error: `O texto excede o limite de 600 caracteres (${rawText.length}/600). Reduza o roteiro para gerar a voz.`,
        }, 400);
      }
    }

    const resolvedSceneModel = resolveAllowedSceneModel(body, Boolean(resolvedImageUrl));
    const resolvedClipModel = resolveAllowedClipModel(body);
    const promptText = resolvePromptCandidate(body);
    const requestedClipSeconds = Number(body.duration || 5);
    const clipDuration = requestedClipSeconds > 5 ? "10" : "5";

    let creditCost = ACTION_CREDIT_COSTS[action] || 2;
    let actionDesc = ACTION_DESCRIPTIONS[action] || "Geração no estúdio";

    if (action === "submit_clip") {
      const baseClipCost = CLIP_MODEL_TIERS[resolvedClipModel] || 12;
      creditCost = clipDuration === "10" ? baseClipCost * 2 : baseClipCost;
      const tierLabel = baseClipCost <= 6 ? "Econômico" : "Cinema Pro";
      actionDesc = `${ACTION_DESCRIPTIONS.submit_clip} (${tierLabel} ${clipDuration}s)`;
    }

    const debit = await deductUserCredits(env, user.id, creditCost, action, actionDesc);
    if (!debit.ok) {
      return jsonResponse({
        error: "Seus créditos acabaram! Recarregue seu saldo ou assine um plano para continuar gerando.",
        code: "INSUFFICIENT_CREDITS",
        credits: debit.newBalance,
      }, 402);
    }

    let upstream = null;
    let usedEndpoint = "";

    if (action === "submit_scene") {
      usedEndpoint = resolvedSceneModel;
      let inputPayload;

      if (resolvedSceneModel === "fal-ai/nano-banana/edit" && resolvedImageUrl) {
        inputPayload = {
          prompt: promptText || "Ultra-realistic 9:16 commercial product photo",
          image_urls: [resolvedImageUrl],
          aspect_ratio: "9:16",
          num_images: 1,
          output_format: "jpeg",
        };
      } else if (resolvedSceneModel === "fal-ai/flux-pro/kontext" && resolvedImageUrl) {
        inputPayload = {
          prompt: promptText || "Ultra-realistic 9:16 commercial product photo",
          image_url: resolvedImageUrl,
          aspect_ratio: "9:16",
          num_images: 1,
        };
      } else {
        inputPayload = {
          prompt: promptText || "Ultra-realistic 9:16 commercial product photo",
          image_size: "portrait_16_9",
          num_images: 1,
          enable_safety_checker: false,
          ...(resolvedImageUrl ? { image_url: resolvedImageUrl } : {}),
        };
      }
      upstream = await falFetch(usedEndpoint, falKey, "POST", inputPayload);
    } else if (action === "submit_clip") {
      usedEndpoint = resolvedClipModel;
      const isVeo = resolvedClipModel.includes("veo");
      const inputPayload = isVeo
        ? {
            prompt: promptText,
            image_url: resolvedImageUrl,
            aspect_ratio: "9:16",
            duration: "6s",
            generate_audio: false,
          }
        : {
            prompt: promptText,
            image_url: resolvedImageUrl,
            duration: clipDuration,
            aspect_ratio: "9:16",
            cfg_scale: 0.5,
            generate_audio: false,
            ...(body.negativePrompt ? { negative_prompt: String(body.negativePrompt).slice(0, 520) } : {}),
          };
      upstream = await falFetch(usedEndpoint, falKey, "POST", inputPayload);
    } else if (action === "submit_music") {
      usedEndpoint = "fal-ai/stable-audio";
      const prompt = promptText || "upbeat energetic commercial background track";
      const duration = Math.min(45, Math.max(8, Number(body.duration || 15)));
      upstream = await falFetch(usedEndpoint, falKey, "POST", {
        prompt,
        seconds_total: duration,
      });
    } else if (action === "clone_voice") {
      usedEndpoint = "fal-ai/f5-tts";
      const audioUrl = String(body.audio_url || body.audioUrl || "").trim();
      if (!audioUrl) {
        await refundUserCredits(env, user.id, creditCost, action, "Áudio de referência ausente");
        return jsonResponse({ error: "Envie um áudio de referência para clonar a voz." }, 400);
      }
      upstream = await falFetch(usedEndpoint, falKey, "POST", {
        ref_audio_url: audioUrl,
        ref_text: String(body.ref_text || "Olá, confira este lançamento exclusivo com entrega rápida.").trim(),
        gen_text: String(body.gen_text || body.text || "Confira este lançamento agora mesmo.").slice(0, 600),
      });
    } else if (action === "submit_tts") {
      usedEndpoint = "fal-ai/kokoro/pt-br";
      const voiceKey = String(body.voice || body.voiceId || "").trim();
      const gender = String(body.gender || "").toLowerCase();
      const fallbackVoice = gender === "female" ? "pf_ora" : "pm_alex";
      const voiceObj = TTS_VOICE_MAP[voiceKey] || TTS_VOICE_MAP[fallbackVoice] || TTS_VOICE_MAP["pf_dylan"];
      const speed = Math.min(1.35, Math.max(0.75, Number(body.speed || 1.05)));
      const textClean = String(body.text || "").trim().slice(0, 600);

      upstream = await falFetch(usedEndpoint, falKey, "POST", {
        prompt: textClean,
        voice: voiceObj.voice,
        speed,
      });

      if (!upstream.ok) {
        usedEndpoint = "fal-ai/kokoro/american-english";
        upstream = await falFetch(usedEndpoint, falKey, "POST", {
          prompt: textClean,
          voice: voiceObj.voice,
          speed,
        });
      }
    } else if (action === "transcribe_words") {
      usedEndpoint = "fal-ai/whisper";
      const audioUrl = String(body.audio_url || body.audioUrl || "").trim();
      if (!audioUrl) {
        await refundUserCredits(env, user.id, creditCost, action, "Áudio ausente para legendas");
        return jsonResponse({ error: "Áudio não encontrado para gerar legendas." }, 400);
      }
      upstream = await falFetch(usedEndpoint, falKey, "POST", {
        audio_url: audioUrl,
        task: "transcribe",
        chunk_level: "word",
        version: "3",
      });
    } else if (action === "remove_bg") {
      usedEndpoint = "fal-ai/birefnet";
      upstream = await falFetch(usedEndpoint, falKey, "POST", {
        image_url: resolvedImageUrl,
        output_format: "png",
      });
    } else {
      await refundUserCredits(env, user.id, creditCost, action, "Ação desconhecida");
      return jsonResponse({ error: "Ação de geração não reconhecida." }, 400);
    }

    if (!upstream || !upstream.ok) {
      const errMsg = formatFalError(upstream?.data, "Falha ao iniciar geração na IA.");
      await refundUserCredits(env, user.id, creditCost, action, errMsg);
      return jsonResponse({
        error: errMsg,
        credits: debit.newBalance + creditCost,
        refunded: true,
      }, 502);
    }

    const upData = upstream.data || {};
    const statusUrl =
      normalizeFalQueueUrl(upData.status_url || upData.statusUrl) ||
      buildQueueUrlFromRequestId(usedEndpoint, upData.request_id || upData.requestId);

    const responseUrl =
      normalizeFalQueueUrl(upData.response_url || upData.responseUrl) ||
      (statusUrl ? statusUrl.replace(/\/status\/?$/, "") : "");

    const directMedia = extractMediaUrls(upData);

    return jsonResponse({
      ...upData,
      engine: usedEndpoint,
      statusUrl,
      responseUrl,
      ...(directMedia.imageUrl ? { imageUrl: directMedia.imageUrl, image_url: directMedia.imageUrl } : {}),
      ...(directMedia.videoUrl ? { videoUrl: directMedia.videoUrl, video_url: directMedia.videoUrl } : {}),
      ...(directMedia.audioUrl ? { audioUrl: directMedia.audioUrl, audio_url: directMedia.audioUrl } : {}),
      ...(directMedia.url ? { url: directMedia.url } : {}),
      credits: debit.newBalance,
      charged: creditCost,
    });
  } catch (err) {
    return jsonResponse({ error: "Erro no servidor de geração: " + (err?.message || "erro interno") }, 500);
  }
}
