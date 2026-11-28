import {
  selecionarMelhorPrompt,
  selecionarMelhorTrilha,
  gerarPacoteMultiContas,
  listarOpcoesInterface,
  NEGATIVE_PROMPT_PADRAO,
} from "./prompts-database.js";

const FAL_QUEUE_BASE = "https://queue.fal.run";

const ALLOWED_SCENE_MODELS = new Set([
  "fal-ai/nano-banana/edit",
  "fal-ai/nano-banana",
  "fal-ai/flux-pro/v1.1",
  "fal-ai/flux-pro/kontext",
  "fal-ai/flux/dev",
  "fal-ai/flux/schnell",
]);

const CLIP_MODEL_TIERS = {
  "fal-ai/veo3.1/fast/image-to-video": 12,
  "fal-ai/kling-video/v2.6/pro/image-to-video": 12,
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
// PADRÃO CINEMA: Google Veo 3.1 (mesmo motor dos vídeos de referência do Gemini)
const DEFAULT_CLIP_MODEL = "fal-ai/veo3.1/fast/image-to-video";

const ACTION_CREDIT_COSTS = {
  get_options: 0,
  select_prompt: 0,
  submit_scene: 2,
  generate_angle: 1,
  describe_product: 0,
  submit_clip: 12,
  submit_music: 3,
  clone_voice: 3,
  submit_tts: 2,
  transcribe_words: 1,
  remove_bg: 1,
};

const ACTION_DESCRIPTIONS = {
  get_options: "Listagem de modelos de conversão e trilhas",
  select_prompt: "Seleção inteligente de prompt e prévia de exemplo",
  submit_scene: "Geração de cena visual 9:16",
  generate_angle: "Geração de ângulo 3D do produto",
  describe_product: "Descrição visual automática do produto",
  submit_clip: "Geração de clipe de vídeo cinematográfico",
  submit_music: "Geração de trilha sonora cinematográfica (Lyria 2)",
  clone_voice: "Clonagem de voz de referência",
  submit_tts: "Narração de voz (TTS)",
  transcribe_words: "Sincronização de legendas",
  remove_bg: "Remoção de fundo de imagem",
};

const ACTION_ALIASES = {
  get_options: "get_options",
  list_options: "get_options",
  opcoes_interface: "get_options",
  catalog: "get_options",
  select_prompt: "select_prompt",
  preview_prompt: "select_prompt",
  escolher_prompt: "select_prompt",
  gerar_pacote: "select_prompt",
  remove_bg: "remove_bg",
  removebg: "remove_bg",
  remove_background: "remove_bg",
  bg_remove: "remove_bg",
  submit_scene: "submit_scene",
  generate_image: "submit_scene",
  image: "submit_scene",
  scene: "submit_scene",
  generate_angle: "generate_angle",
  describe_product: "describe_product",
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

function normalizeSingleImage(item, fallbackMime = "image/jpeg") {
  if (!item) return "";
  if (typeof item === "string") {
    const trimmed = item.trim();
    if (!trimmed) return "";
    if (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("data:image/")
    ) {
      return trimmed;
    }
    const cleanB64 = trimmed.replace(/\s+/g, "");
    if (/^[A-Za-z0-9+/=]{100,}$/.test(cleanB64)) {
      return `data:${fallbackMime};base64,${cleanB64}`;
    }
    return "";
  }
  if (typeof item === "object") {
    const mime =
      typeof item.mimeType === "string" && item.mimeType.startsWith("image/")
        ? item.mimeType
        : fallbackMime;
    const nested =
      item.url ||
      item.image_url ||
      item.imageUrl ||
      item.dataUrl ||
      item.base64 ||
      "";
    return normalizeSingleImage(nested, mime);
  }
  return "";
}

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
    const norm = normalizeSingleImage(item, mime);
    if (norm) return norm;
  }
  return "";
}

function extractImageInputList(body) {
  const list = [];
  const mime =
    typeof body?.mimeType === "string" && body.mimeType.startsWith("image/")
      ? body.mimeType
      : "image/jpeg";

  const arrCandidates = [body?.referenceImages, body?.imageUrls, body?.image_urls];
  for (const arr of arrCandidates) {
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      const norm = normalizeSingleImage(item, mime);
      if (norm && !list.includes(norm)) list.push(norm);
    }
  }

  const single = extractImageInput(body);
  if (single && !list.includes(single)) {
    list.unshift(single);
  }

  return list.slice(0, 4);
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

function extractTextOutput(obj) {
  if (!obj || typeof obj !== "object") return "";
  if (typeof obj.output === "string" && obj.output.trim()) return obj.output.trim();
  if (typeof obj.results === "string" && obj.results.trim()) return obj.results.trim();
  if (typeof obj.text === "string" && obj.text.trim()) return obj.text.trim();
  if (obj.result && typeof obj.result === "object") return extractTextOutput(obj.result);
  if (obj.data && typeof obj.data === "object") return extractTextOutput(obj.data);
  return "";
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

export async function onRequestGet(context) {
  const urlObj = new URL(context.request.url);
  const actionParam = String(urlObj.searchParams.get("action") || "").trim().toLowerCase();

  // Permite ao index.html carregar os 10 Modelos, vídeos de exemplo e 7 Trilhas sem gastar créditos
  if (actionParam === "get_options" || actionParam === "catalog" || actionParam === "list_options") {
    return jsonResponse({
      ok: true,
      defaultClipModel: DEFAULT_CLIP_MODEL,
      ...listarOpcoesInterface(),
    });
  }

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
  if (!cleaned || cleaned === "auto" || cleaned === "melhor_opcao" || cleaned === "veo" || cleaned === "veo3" || cleaned === "veo3.1") {
    return "fal-ai/veo3.1/fast/image-to-video";
  }
  if (cleaned === "kling") return "fal-ai/kling-video/v2.6/pro/image-to-video";
  return Object.prototype.hasOwnProperty.call(CLIP_MODEL_TIERS, cleaned)
    ? cleaned
    : DEFAULT_CLIP_MODEL;
}

function extractProductSelectionParams(body, fallbackDuration = 6) {
  const nomeProduto = String(
    body?.nomeProduto ?? body?.productName ?? body?.produto ?? ""
  ).trim();
  const detalhesProduto = String(
    body?.detalhesProduto ?? body?.productDetails ?? body?.visualDescription ?? body?.visual_description ?? ""
  ).trim();
  const detalheMacro = String(
    body?.detalheMacro ?? body?.macroDetail ?? body?.macro_detail ?? ""
  ).trim();
  const modeloPreferido =
    body?.modeloPreferido ?? body?.conversionModel ?? body?.modeloConversao ?? null;
  const trilhaPreferida =
    body?.trilhaPreferida ?? body?.soundtrackStyle ?? body?.estiloTrilha ?? null;
  const categoriaForcada = body?.categoriaForcada ?? body?.categoria ?? null;
  const idsJaUsados = Array.isArray(body?.idsJaUsados)
    ? body.idsJaUsados
    : Array.isArray(body?.usedPromptIds)
      ? body.usedPromptIds
      : [];
  const arquivosTrilhaJaUsados = Array.isArray(body?.arquivosTrilhaJaUsados)
    ? body.arquivosTrilhaJaUsados
    : Array.isArray(body?.usedTrackFiles)
      ? body.usedTrackFiles
      : [];
  const apenasAmbienteSeco =
    typeof body?.apenasAmbienteSeco === "boolean"
      ? body.apenasAmbienteSeco
      : typeof body?.dryOnly === "boolean"
        ? body.dryOnly
        : null;
  const priorizarMestres = Boolean(body?.priorizarMestres);
  const duracaoSegundos = Number(body?.duracaoSegundos ?? body?.duration ?? fallbackDuration) || fallbackDuration;

  return {
    nomeProduto: nomeProduto || "premium commercial product",
    detalhesProduto:
      detalhesProduto ||
      "exact physical geometry, textures, colors, and finish strictly identical to the clean reference image",
    detalheMacro:
      detalheMacro ||
      "signature surface textures, sculpted edges, and precision craftsmanship",
    categoriaForcada,
    modeloPreferido,
    trilhaPreferida,
    duracaoSegundos,
    idsJaUsados,
    arquivosTrilhaJaUsados,
    apenasAmbienteSeco,
    priorizarMestres,
  };
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
    const body = await request.json();
    const rawAction = String(body.action || body.mode || body.task || "").trim().toLowerCase();
    const action = ACTION_ALIASES[rawAction] || rawAction;

    // AÇÕES GRATUITAS (0 CRÉDITOS) — Catálogo de modelos/trilhas e seleção de prévia antes de gerar
    if (action === "get_options") {
      return jsonResponse({
        ok: true,
        defaultClipModel: DEFAULT_CLIP_MODEL,
        ...listarOpcoesInterface(),
      });
    }

    if (action === "select_prompt") {
      const opcoes = extractProductSelectionParams(body, 6);
      const quantidade = Math.min(10, Math.max(1, Number(body?.quantidade || 1)));
      if (quantidade > 1) {
        const pacote = gerarPacoteMultiContas(opcoes, quantidade);
        return jsonResponse({
          ok: true,
          defaultClipModel: DEFAULT_CLIP_MODEL,
          pacote,
          selecao: pacote[0],
        });
      }
      const selecao = selecionarMelhorPrompt(opcoes);
      return jsonResponse({
        ok: true,
        defaultClipModel: DEFAULT_CLIP_MODEL,
        selecao,
      });
    }

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

    const resolvedImageList = extractImageInputList(body);
    const resolvedImageUrl = resolvedImageList[0] || "";

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
          textOutput: extractTextOutput(body.result),
          chunks: body.result?.chunks || null,
          customVoiceId: body.result?.custom_voice_id || body.result?.voice_id || null,
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
          textOutput: extractTextOutput(resJson),
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

    if ((action === "remove_bg" || action === "generate_angle" || action === "describe_product") && !resolvedImageUrl) {
      return jsonResponse({ error: "Envie a imagem do produto primeiro." }, 400);
    }

    if (action === "submit_tts") {
      const rawText = String(body.text || "");
      if (!rawText.trim()) {
        return jsonResponse({ error: "Digite o texto da narração antes de gerar." }, 400);
      }
      if (rawText.length > 700) {
        return jsonResponse({
          error: `O texto excede o limite de 700 caracteres (${rawText.length}/700). Reduza um pouco o roteiro.`,
        }, 400);
      }
    }

    // MODO HÍBRIDO INSTANTÂNEO DE TRILHA (0 CRÉDITOS, 0 SEGUNDOS DE ESPERA)
    if (action === "submit_music" && String(body.musicMode || "").toLowerCase() === "instant") {
      const opcoes = extractProductSelectionParams(body, 6);
      const trilhaInstantanea = selecionarMelhorTrilha({
        nomeProduto: opcoes.nomeProduto,
        detalhesProduto: opcoes.detalhesProduto,
        categoriaForcada: opcoes.categoriaForcada,
        modeloId: opcoes.modeloPreferido && Number(opcoes.modeloPreferido) >= 1 ? Number(opcoes.modeloPreferido) : null,
        trilhaPreferida: opcoes.trilhaPreferida,
        arquivosJaUsados: opcoes.arquivosTrilhaJaUsados,
      });
      return jsonResponse({
        status: "COMPLETED",
        engine: "nexora/instant-tracks",
        audioUrl: trilhaInstantanea.arquivoMp3,
        audio_url: trilhaInstantanea.arquivoMp3,
        url: trilhaInstantanea.arquivoMp3,
        trilhaMeta: trilhaInstantanea,
        charged: 0,
      });
    }

    const resolvedSceneModel = resolveAllowedSceneModel(body, resolvedImageList.length > 0);
    const resolvedClipModel = resolveAllowedClipModel(body);
    const isVeoClip = resolvedClipModel.includes("veo");
    const promptText = resolvePromptCandidate(body);

    const requestedClipSeconds = Number(body.duration || (isVeoClip ? 6 : 5));
    const veoDurationStr = requestedClipSeconds >= 8 ? "8s" : "6s";
    const klingDurationStr = requestedClipSeconds > 5 ? "10" : "5";
    const effectiveClipSeconds = isVeoClip ? (requestedClipSeconds >= 8 ? 8 : 6) : (requestedClipSeconds > 5 ? 10 : 5);

    let creditCost = Object.prototype.hasOwnProperty.call(ACTION_CREDIT_COSTS, action)
      ? ACTION_CREDIT_COSTS[action]
      : 2;
    let actionDesc = ACTION_DESCRIPTIONS[action] || "Geração no estúdio";

    if (action === "submit_clip") {
      const baseClipCost = CLIP_MODEL_TIERS[resolvedClipModel] || 12;
      const isExtended = isVeoClip ? requestedClipSeconds >= 8 : klingDurationStr === "10";
      creditCost = isExtended ? baseClipCost * 2 : baseClipCost;
      const tierLabel = isVeoClip ? "Veo 3.1 Cinema" : (baseClipCost <= 6 ? "Econômico" : "Cinema Pro");
      actionDesc = `${ACTION_DESCRIPTIONS.submit_clip} (${tierLabel} ${effectiveClipSeconds}s)`;
    }

    let debit = { ok: true, newBalance: null };
    if (creditCost > 0) {
      debit = await deductUserCredits(env, user.id, creditCost, action, actionDesc);
      if (!debit.ok) {
        return jsonResponse({
          error: "Seus créditos acabaram! Recarregue seu saldo ou assine um plano para continuar gerando.",
          code: "INSUFFICIENT_CREDITS",
          credits: debit.newBalance,
        }, 402);
      }
    }

    let upstream = null;
    let usedEndpoint = "";
    let promptMeta = null;
    let trilhaMeta = null;

    if (action === "submit_scene" || action === "generate_angle") {
      usedEndpoint = action === "generate_angle" ? DEFAULT_SCENE_MODEL_EDIT : resolvedSceneModel;
      // TRAVA OBRIGATÓRIA 9:16 EM TODAS AS IMAGENS E ÂNGULOS 3D (PROIBIDO GERAR EM 1:1 OU OUTRO TAMANHO)
      const outFmt = action === "generate_angle" ? "png" : "jpeg";
      let inputPayload;

      if (usedEndpoint === "fal-ai/nano-banana/edit" && resolvedImageList.length > 0) {
        inputPayload = {
          prompt: promptText || "Ultra-realistic 9:16 vertical commercial studio product photograph",
          image_urls: resolvedImageList,
          aspect_ratio: "9:16",
          num_images: 1,
          output_format: outFmt,
        };
      } else if (usedEndpoint === "fal-ai/flux-pro/kontext" && resolvedImageUrl) {
        inputPayload = {
          prompt: promptText || "Ultra-realistic 9:16 vertical commercial studio product photograph",
          image_url: resolvedImageUrl,
          aspect_ratio: "9:16",
          num_images: 1,
        };
      } else {
        inputPayload = {
          prompt: promptText || "Ultra-realistic 9:16 vertical commercial studio product photograph",
          image_size: "portrait_16_9",
          num_images: 1,
          enable_safety_checker: false,
          ...(resolvedImageUrl ? { image_url: resolvedImageUrl } : {}),
        };
      }
      upstream = await falFetch(usedEndpoint, falKey, "POST", inputPayload);
    } else if (action === "describe_product") {
      const engIdx = Number(body.engineIndex || 0);
      const visionPrompt =
        promptText ||
        "Analyze the exact physical product in this image. Return ONLY valid JSON with three keys in Brazilian Portuguese: " +
          '{"product_name": "short clear commercial name of the product in 2 to 5 words", ' +
          '"visual_description": "concise ultra-faithful physical description of the product type, colors, material finishes, shapes and distinctive details in up to 140 characters", ' +
          '"macro_detail": "3 to 6 words naming the best close-up detail for a 100mm macro shot, e.g. textura metálica, lentes e acabamento"}';

      if (engIdx === 0) {
        usedEndpoint = "fal-ai/any-llm/vision";
        upstream = await falFetch(usedEndpoint, falKey, "POST", {
          model: "google/gemini-2.5-flash",
          image_url: resolvedImageUrl,
          prompt: visionPrompt,
        });
      } else if (engIdx === 1) {
        usedEndpoint = "fal-ai/any-llm/vision";
        upstream = await falFetch(usedEndpoint, falKey, "POST", {
          model: "openai/gpt-4o-mini",
          image_url: resolvedImageUrl,
          prompt: visionPrompt,
        });
      } else {
        usedEndpoint = "fal-ai/florence-2-large/detailed-caption";
        upstream = await falFetch(usedEndpoint, falKey, "POST", {
          image_url: resolvedImageUrl,
        });
      }
    } else if (action === "submit_clip") {
      usedEndpoint = resolvedClipModel;

      // Usa automaticamente o Banco de 1.218 Prompts (Veo 3.1 / Kling calibrado) quando ativado ou quando houver dados do produto
      const deveUsarBanco =
        body.usePromptDatabase === true ||
        Boolean(body.nomeProduto || body.productName || body.modeloPreferido || body.conversionModel) ||
        !promptText;

      const rawCutMotion = String(body.motionPrompt || body.prompt || "").trim();
      const hasMultiCutChoreo =
        rawCutMotion.length > 35 &&
        (Number.isInteger(body.cutIndex) ||
          /continuous high-energy 3d|fpv|orbit|crash-zoom|whip-pan|top-down|180/i.test(rawCutMotion));

      // Reforço de movimento 3D real (câmera FPV rápida, rotação de paralaxe e cenário vivo do 1º ao último frame)
      const DYNAMIC_3D_MOTION_BOOST =
        "High-speed kinetic FPV 3D camera motion, aggressive real-time 3D parallax orbit around the exact product, lively dynamic background elements and fast specular light sweeps continuously from frame 1 through the final frame, zero frozen frames, strictly silent 9:16 commercial footage, zero text, zero subtitles, zero voiceover.";

      let finalClipPrompt = promptText;
      let finalNegativePrompt = String(body.negativePrompt || NEGATIVE_PROMPT_PADRAO).slice(0, 520);

      if (deveUsarBanco) {
        const opcoes = extractProductSelectionParams(body, effectiveClipSeconds);
        const selecao = selecionarMelhorPrompt(opcoes);
        finalNegativePrompt = String(body.negativePrompt || selecao.negativePrompt).slice(0, 520);
        promptMeta = {
          idPromptUsado: selecao.idPromptUsado,
          assinaturaUnica: selecao.assinaturaUnica,
          modoSelecao: selecao.modoSelecao,
          categoriaDetectada: selecao.categoriaDetectada,
          modeloId: selecao.modeloId,
          modeloNome: selecao.modeloNome,
          estiloVisual: selecao.estiloVisual,
          duracaoCalibrada: selecao.duracaoCalibrada,
          previewVideo: selecao.previewVideo,
          trilhaRecomendada: selecao.trilhaRecomendada,
        };

        if (hasMultiCutChoreo) {
          // Modo Superprodução Multi-Cortes: preserva a coreografia 3D FPV exclusiva do corte + injeta estilo/modelo do banco
          finalClipPrompt = `${rawCutMotion} Visual commercial style: ${selecao.estiloVisual} (${selecao.modeloNome}). ${DYNAMIC_3D_MOTION_BOOST}`.slice(0, 2200);
        } else {
          // Modo Clipe Único Veo 3.1 / Kling: usa roteiro completo de 4 cortes calibrado do banco + reforço 3D vivo
          finalClipPrompt = `${selecao.promptFinal} ${DYNAMIC_3D_MOTION_BOOST}`.slice(0, 2200);
        }
      } else {
        finalClipPrompt = `${finalClipPrompt || "High-impact 9:16 commercial product showcase."} ${DYNAMIC_3D_MOTION_BOOST}`.slice(0, 2200);
      }

      // Destrava o movimento 3D real no Kling (cfg_scale 0.38 por padrão em vez de 0.50 rígido, aceitando ajuste fino)
      const rawCfg = Number(body.cfgScale ?? body.cfg_scale);
      const klingCfgScale = Number.isFinite(rawCfg)
        ? Math.min(0.65, Math.max(0.28, rawCfg))
        : 0.38;

      const inputPayload = isVeoClip
        ? {
            prompt: finalClipPrompt,
            image_url: resolvedImageUrl,
            aspect_ratio: "9:16",
            duration: veoDurationStr,
            generate_audio: false,
          }
        : {
            prompt: finalClipPrompt,
            image_url: resolvedImageUrl,
            duration: klingDurationStr,
            aspect_ratio: "9:16",
            cfg_scale: klingCfgScale,
            generate_audio: false,
            ...(finalNegativePrompt ? { negative_prompt: finalNegativePrompt } : {}),
          };
      upstream = await falFetch(usedEndpoint, falKey, "POST", inputPayload);
    } else if (action === "submit_music") {
      // MODO HÍBRIDO (OPÇÃO IA EXCLUSIVA): Google Lyria 2 como motor principal de cinema + prompts pesados do banco
      const engIdx = Number(body.engineIndex || 0);
      const opcoes = extractProductSelectionParams(body, 6);
      const selecaoTrilha = selecionarMelhorTrilha({
        nomeProduto: opcoes.nomeProduto,
        detalhesProduto: opcoes.detalhesProduto,
        categoriaForcada: opcoes.categoriaForcada,
        modeloId: opcoes.modeloPreferido && Number(opcoes.modeloPreferido) >= 1 ? Number(opcoes.modeloPreferido) : null,
        trilhaPreferida: opcoes.trilhaPreferida,
        arquivosJaUsados: opcoes.arquivosTrilhaJaUsados,
      });
      trilhaMeta = selecaoTrilha;

      const usarPromptDoBanco =
        body.useMusicDatabase !== false &&
        (Boolean(body.trilhaPreferida || body.soundtrackStyle || body.nomeProduto || body.productName) ||
          !promptText ||
          promptText.toLowerCase().includes("upbeat energetic commercial background track"));

      const finalMusicPrompt = usarPromptDoBanco ? selecaoTrilha.lyriaPrompt : promptText;
      const finalMusicNegative = String(
        body.musicNegativePrompt || selecaoTrilha.lyriaNegativePrompt || ""
      ).slice(0, 400);
      const duration = Math.min(45, Math.max(8, Number(body.duration || 15)));

      if (engIdx === 1) {
        usedEndpoint = "fal-ai/stable-audio";
        upstream = await falFetch(usedEndpoint, falKey, "POST", {
          prompt: finalMusicPrompt,
          seconds_total: duration,
        });
      } else {
        usedEndpoint = "fal-ai/lyria2";
        upstream = await falFetch(usedEndpoint, falKey, "POST", {
          prompt: finalMusicPrompt,
          ...(finalMusicNegative ? { negative_prompt: finalMusicNegative } : {}),
        });
      }
    } else if (action === "clone_voice") {
      usedEndpoint = "fal-ai/minimax/voice-clone";
      const rawAudioUrl = String(body.audio_url || body.audioUrl || "").trim();
      const rawAudioB64 = String(body.audioBase64 || "").trim();
      const audioMime = String(body.mimeType || "audio/wav").trim();
      const audioDataUrl = rawAudioUrl || (rawAudioB64 ? `data:${audioMime};base64,${rawAudioB64}` : "");
      if (!audioDataUrl) {
        if (creditCost > 0) await refundUserCredits(env, user.id, creditCost, action, "Áudio de referência ausente");
        return jsonResponse({ error: "Envie um áudio de referência para clonar a voz." }, 400);
      }
      upstream = await falFetch(usedEndpoint, falKey, "POST", {
        audio_url: audioDataUrl,
        need_noise_reduction: true,
        need_volume_normalization: true,
      });
    } else if (action === "submit_tts") {
      const textClean = String(body.text || "").trim().slice(0, 700);
      const voiceIdRaw = String(body.voiceId || body.voice || "").trim();
      const customVoiceId = String(body.customVoiceId || "").trim();
      const gender = String(body.gender || "male").toLowerCase();
      const engIdx = Number(body.engineIndex || 0);
      const reqSpeed = Number(body.speed || 1.14);

      const ELEVEN_MAP = {
        roger: "Roger", brian: "Brian", charlie: "Charlie", liam: "Liam",
        will: "Will", eric: "Eric", chris: "Chris", callum: "Callum",
        daniel: "Daniel", george: "George", bill: "Bill",
        aria: "Aria", jessica: "Jessica", sarah: "Sarah", laura: "Laura",
        alice: "Alice", matilda: "Matilda", lily: "Lily", rachel: "Sarah",
        charlotte: "Charlotte",
      };
      const MINIMAX_MAP = {
        m25_mm_grave: "Deep_Voice_Man",
        m26_mm_casual: "Casual_Guy",
        m27_mm_determinado: "Determined_Man",
        m28_mm_elegante: "Elegant_Man",
        m29_mm_imponente: "Imposing_Manner",
        m30_mm_jovem: "Decent_Boy",
        f25_mm_vibrante: "Lively_Girl",
        f26_mm_confiante: "Calm_Woman",
        f27_mm_elegante: "Wise_Woman",
        f28_mm_inspiradora: "Inspirational_girl",
        f29_mm_exuberante: "Exuberant_Girl",
        f30_mm_doce: "Sweet_Girl_2",
      };

      const isMiniMaxChoice = Boolean(customVoiceId) || Boolean(MINIMAX_MAP[voiceIdRaw]);
      let elevenVoice = gender === "female" ? "Aria" : "Roger";
      for (const [k, v] of Object.entries(ELEVEN_MAP)) {
        if (voiceIdRaw.toLowerCase().includes(k)) {
          elevenVoice = v;
          break;
        }
      }
      const miniVoice =
        customVoiceId ||
        MINIMAX_MAP[voiceIdRaw] ||
        (gender === "female" ? "Lively_Girl" : "Deep_Voice_Man");
      const kokoroVoice = gender === "female" ? "pf_dora" : "pm_alex";

      if ((engIdx === 0 && isMiniMaxChoice) || (engIdx === 1 && !isMiniMaxChoice)) {
        usedEndpoint = "fal-ai/minimax/speech-02-hd";
        upstream = await falFetch(usedEndpoint, falKey, "POST", {
          text: textClean,
          voice_setting: {
            voice_id: miniVoice,
            speed: Math.min(1.5, Math.max(0.7, reqSpeed)),
            vol: 1,
            pitch: 0,
          },
          language_boost: "Portuguese",
        });
      } else if (engIdx === 0 || (engIdx === 1 && isMiniMaxChoice)) {
        usedEndpoint = "fal-ai/elevenlabs/tts/multilingual-v2";
        upstream = await falFetch(usedEndpoint, falKey, "POST", {
          text: textClean,
          voice: elevenVoice,
          stability: 0.5,
          similarity_boost: 0.75,
          speed: Math.min(1.2, Math.max(0.7, reqSpeed)),
        });
      } else {
        usedEndpoint = "fal-ai/kokoro/brazilian-portuguese";
        upstream = await falFetch(usedEndpoint, falKey, "POST", {
          prompt: textClean,
          voice: kokoroVoice,
          speed: Math.min(1.35, Math.max(0.75, reqSpeed)),
        });
      }
    } else if (action === "transcribe_words") {
      usedEndpoint = "fal-ai/whisper";
      const audioUrl = String(body.audio_url || body.audioUrl || "").trim();
      if (!audioUrl) {
        if (creditCost > 0) await refundUserCredits(env, user.id, creditCost, action, "Áudio ausente para legendas");
        return jsonResponse({ error: "Áudio não encontrado para gerar legendas." }, 400);
      }
      upstream = await falFetch(usedEndpoint, falKey, "POST", {
        audio_url: audioUrl,
        task: "transcribe",
        language: "pt",
        chunk_level: "word",
        version: "3",
      });
    } else if (action === "remove_bg") {
      const engIdx = Number(body.engineIndex || 0);
      if (engIdx === 1) {
        usedEndpoint = "fal-ai/birefnet/v2";
        upstream = await falFetch(usedEndpoint, falKey, "POST", {
          image_url: resolvedImageUrl,
          output_format: "png",
        });
      } else if (engIdx >= 2) {
        usedEndpoint = "fal-ai/bria/background/remove";
        upstream = await falFetch(usedEndpoint, falKey, "POST", {
          image_url: resolvedImageUrl,
        });
      } else {
        usedEndpoint = "fal-ai/birefnet";
        upstream = await falFetch(usedEndpoint, falKey, "POST", {
          image_url: resolvedImageUrl,
          output_format: "png",
        });
      }
    } else {
      if (creditCost > 0) await refundUserCredits(env, user.id, creditCost, action, "Ação desconhecida");
      return jsonResponse({ error: "Ação de geração não reconhecida." }, 400);
    }

    if (!upstream || !upstream.ok) {
      const errMsg = formatFalError(upstream?.data, "Falha ao iniciar geração na IA.");
      if (creditCost > 0) await refundUserCredits(env, user.id, creditCost, action, errMsg);
      return jsonResponse({
        error: errMsg,
        ...(typeof debit.newBalance === "number" ? { credits: debit.newBalance + creditCost } : {}),
        refunded: creditCost > 0,
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
      ...(promptMeta ? { promptMeta } : {}),
      ...(trilhaMeta ? { trilhaMeta } : {}),
      ...(typeof debit.newBalance === "number" ? { credits: debit.newBalance } : {}),
      charged: creditCost,
    });
  } catch (err) {
    return jsonResponse({ error: "Erro no servidor de geração: " + (err?.message || "erro interno") }, 500);
  }
}
