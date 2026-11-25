const FAL_QUEUE_BASE = "https://queue.fal.run";

// Mapa oficial de vozes PT-BR / EN (Kokoro + ElevenLabs)
const TTS_VOICE_MAP = {
  // Masculinas
  "pf_dylan": { voice: "pf_dylan", label: "Dylan (PT-BR Masculino)", gender: "male" },
  "pm_alex": { voice: "pm_alex", label: "Alex (PT-BR Masculino)", gender: "male" },
  "pm_santa": { voice: "pm_santa", label: "Santa (PT-BR Masculino)", gender: "male" },
  "am_adam": { voice: "am_adam", label: "Adam (EN Commercial Male)", gender: "male" },
  "am_michael": { voice: "am_michael", label: "Michael (EN Deep Male)", gender: "male" },
  "am_eric": { voice: "am_eric", label: "Eric (EN Energetic Male)", gender: "male" },
  "bm_george": { voice: "bm_george", label: "George (UK Male)", gender: "male" },
  "bm_lewis": { voice: "bm_lewis", label: "Lewis (UK Narrator Male)", gender: "male" },
  // Femininas
  "pf_ora": { voice: "pf_ora", label: "Ora (PT-BR Feminino)", gender: "female" },
  "af_bella": { voice: "af_bella", label: "Bella (EN Commercial Female)", gender: "female" },
  "af_sarah": { voice: "af_sarah", label: "Sarah (EN Bright Female)", gender: "female" },
  "af_nova": { voice: "af_nova", label: "Nova (EN Modern Female)", gender: "female" },
  "af_nicole": { voice: "af_nicole", label: "Nicole (EN Warm Female)", gender: "female" },
  "bf_emma": { voice: "bf_emma", label: "Emma (UK Female)", gender: "female" },
  "bf_isabella": { voice: "bf_isabella", label: "Isabella (UK Expressive Female)", gender: "female" },
};

// Lista fechada de modelos de imagem autorizados (bloqueia burla de custo)
const ALLOWED_SCENE_MODELS = new Set([
  "fal-ai/nano-banana/edit",
  "fal-ai/nano-banana",
  "fal-ai/flux-pro/v1.1",
  "fal-ai/flux-pro/kontext",
  "fal-ai/flux/dev",
  "fal-ai/flux/schnell",
]);

// Lista fechada de modelos de vídeo autorizados e seu custo base (5s) em créditos
// Modo Híbrido: Econômico (6 cr/5s) e Cinema Pro (12 cr/5s) — 10s dobra automaticamente
const CLIP_MODEL_TIERS = {
  // Faixa Cinema Pro (12 créditos / 5s)
  "fal-ai/kling-video/v2.6/pro/image-to-video": 12,
  "fal-ai/veo3.1/fast/image-to-video": 12,
  "fal-ai/kling-video/v2.1/pro/image-to-video": 12,
  "fal-ai/kling-video/v1.6/pro/image-to-video": 12,
  // Faixa Econômica (6 créditos / 5s)
  "fal-ai/kling-video/v2.1/standard/image-to-video": 6,
  "fal-ai/kling-video/v1.6/standard/image-to-video": 6,
  "fal-ai/wan-i2v": 6,
  "fal-ai/wan/v2.1/1.3b/image-to-video": 6,
  "fal-ai/wan-2.1/image-to-video": 6,
  "fal-ai/wan-2.2/image-to-video": 6,
};

const DEFAULT_SCENE_MODEL = "fal-ai/flux-pro/v1.1";
const DEFAULT_CLIP_MODEL = "fal-ai/kling-video/v2.6/pro/image-to-video";

// Custos de créditos por operação no servidor (blindado contra prejuízo)
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
};

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

function getBearerToken(request) {
  const authHeader = request.headers.get("Authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return "";
  return authHeader.slice(7).trim();
}

function resolveAllowedSceneModel(rawModel) {
  const cleaned = String(rawModel || "").trim().replace(/^\/+/, "");
  return ALLOWED_SCENE_MODELS.has(cleaned) ? cleaned : DEFAULT_SCENE_MODEL;
}

function resolveAllowedClipModel(rawModel) {
  const cleaned = String(rawModel || "").trim().replace(/^\/+/, "");
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
  const rawBalance = row?.new_balance ?? row?.remaining_credits ?? 0;
  return {
    ok: Boolean(row?.ok),
    newBalance: Number(rawBalance),
  };
}

async function refundUserCredits(env, userId, amount, task, reason) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !userId || amount <= 0) return;
  try {
    await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/add_credits`, {
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
  } catch (_) {
    // Evita mascarar erro original
  }
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

    // Consulta de status de fila (poll) não consome créditos extras
    if (action === "poll") {
      const statusUrl = String(body.statusUrl || "").trim();
      const responseUrl = String(body.responseUrl || "").trim();
      if (!statusUrl || !statusUrl.startsWith("https://queue.fal.run/")) {
        return jsonResponse({ error: "URL de consulta inválida." }, 400);
      }

      const stResp = await fetch(statusUrl, {
        method: "GET",
        headers: { Authorization: `Key ${falKey}` },
      });
      const stJson = await stResp.json().catch(() => ({}));

      if (stJson?.status === "FAILED") {
        return jsonResponse({
          status: "FAILED",
          error: stJson?.error || "Falha no processamento da mídia.",
        });
      }

      if (stJson?.status === "COMPLETED") {
        const finalUrl = responseUrl || statusUrl.replace(/\/status\/?$/, "");
        const resResp = await fetch(finalUrl, {
          method: "GET",
          headers: { Authorization: `Key ${falKey}` },
        });
        const resJson = await resResp.json().catch(() => ({}));
        return jsonResponse({
          status: "COMPLETED",
          result: resJson,
        });
      }

      return jsonResponse({
        status: stJson?.status || "IN_QUEUE",
        queue_position: stJson?.queue_position,
      });
    }

    // Validação do modelo e duração proporcional (5s vs 10s)
    const resolvedSceneModel = resolveAllowedSceneModel(body.model);
    const resolvedClipModel = resolveAllowedClipModel(body.model);
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

    // Trava de segurança de 600 caracteres para TTS
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

    // Desconta créditos atomicamente ANTES de enviar para o fal.ai
    const debit = await deductUserCredits(env, user.id, creditCost, action, actionDesc);
    if (!debit.ok) {
      return jsonResponse({
        error: "Seus créditos acabaram! Recarregue seu saldo ou assine um plano para continuar gerando.",
        code: "INSUFFICIENT_CREDITS",
        credits: debit.newBalance,
      }, 402);
    }

    let upstream = null;

    if (action === "submit_scene") {
      const inputPayload = {
        prompt: String(body.prompt || "").trim(),
        image_size: "portrait_16_9",
        num_images: 1,
        enable_safety_checker: false,
        ...(body.image_url ? { image_url: body.image_url } : {}),
      };
      upstream = await falFetch(resolvedSceneModel, falKey, "POST", inputPayload);
    } else if (action === "submit_clip") {
      const inputPayload = {
        prompt: String(body.prompt || "").trim(),
        image_url: String(body.image_url || "").trim(),
        duration: clipDuration,
        aspect_ratio: "9:16",
        cfg_scale: 0.5,
        generate_audio: false,
      };
      upstream = await falFetch(resolvedClipModel, falKey, "POST", inputPayload);
    } else if (action === "submit_music") {
      const prompt = String(body.prompt || "upbeat energetic commercial background track").trim();
      const duration = Math.min(45, Math.max(8, Number(body.duration || 15)));
      upstream = await falFetch("fal-ai/stable-audio", falKey, "POST", {
        prompt,
        seconds_total: duration,
      });
    } else if (action === "clone_voice") {
      const audioUrl = String(body.audio_url || "").trim();
      if (!audioUrl) {
        await refundUserCredits(env, user.id, creditCost, action, "Áudio de referência ausente");
        return jsonResponse({ error: "Envie um áudio de referência para clonar a voz." }, 400);
      }
      upstream = await falFetch("fal-ai/f5-tts", falKey, "POST", {
        ref_audio_url: audioUrl,
        ref_text: String(body.ref_text || "Olá, confira este lançamento exclusivo com entrega rápida.").trim(),
        gen_text: String(body.gen_text || body.text || "Confira este lançamento agora mesmo.").slice(0, 600),
      });
    } else if (action === "submit_tts") {
      const voiceKey = String(body.voice || "pf_dylan").trim();
      const voiceObj = TTS_VOICE_MAP[voiceKey] || TTS_VOICE_MAP["pf_dylan"];
      const speed = Math.min(1.35, Math.max(0.75, Number(body.speed || 1.05)));
      const textClean = String(body.text || "").trim().slice(0, 600);

      upstream = await falFetch("fal-ai/kokoro/pt-br", falKey, "POST", {
        prompt: textClean,
        voice: voiceObj.voice,
        speed,
      });

      if (!upstream.ok) {
        upstream = await falFetch("fal-ai/kokoro/american-english", falKey, "POST", {
          prompt: textClean,
          voice: voiceObj.voice,
          speed,
        });
      }
    } else if (action === "transcribe_words") {
      const audioUrl = String(body.audio_url || "").trim();
      if (!audioUrl) {
        await refundUserCredits(env, user.id, creditCost, action, "Áudio ausente para legendas");
        return jsonResponse({ error: "Áudio não encontrado para gerar legendas." }, 400);
      }
      upstream = await falFetch("fal-ai/whisper", falKey, "POST", {
        audio_url: audioUrl,
        task: "transcribe",
        chunk_level: "segment",
        version: "3",
      });
    } else if (action === "remove_bg") {
      const imageUrl = String(body.image_url || "").trim();
      if (!imageUrl) {
        await refundUserCredits(env, user.id, creditCost, action, "Imagem ausente para remover fundo");
        return jsonResponse({ error: "Envie a imagem do produto para remover o fundo." }, 400);
      }
      upstream = await falFetch("fal-ai/birefnet", falKey, "POST", {
        image_url: imageUrl,
        model: "General Use (Light)",
        operating_resolution: "1024x1024",
        output_format: "png",
      });
    } else {
      await refundUserCredits(env, user.id, creditCost, action, "Ação desconhecida");
      return jsonResponse({ error: "Ação de geração não reconhecida." }, 400);
    }

    if (!upstream || !upstream.ok) {
      const errMsg = upstream?.data?.error || upstream?.data?.detail || "Falha ao iniciar geração na IA.";
      await refundUserCredits(env, user.id, creditCost, action, errMsg);
      return jsonResponse({
        error: errMsg,
        credits: debit.newBalance + creditCost,
        refunded: true,
      }, 502);
    }

    return jsonResponse({
      ...upstream.data,
      credits: debit.newBalance,
      charged: creditCost,
    });
  } catch (err) {
    return jsonResponse({ error: "Erro no servidor de geração: " + (err?.message || "erro interno") }, 500);
  }
}
