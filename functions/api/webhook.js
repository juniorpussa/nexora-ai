const PLAN_CREDITS = {
  inicial_60: { name: "Pacote Inicial", credits: 60 },
  criador_180: { name: "Plano Criador Pro", credits: 180 },
  escala_450: { name: "Plano Escala", credits: 450 },
};

function resolvePlanByCode(rawCode) {
  const code = String(rawCode || "").trim().toLowerCase();
  if (PLAN_CREDITS[code]) return { id: code, ...PLAN_CREDITS[code] };
  if (code === "inicial" || code === "60") return { id: "inicial_60", ...PLAN_CREDITS.inicial_60 };
  if (code === "criador" || code === "pro" || code === "180") return { id: "criador_180", ...PLAN_CREDITS.criador_180 };
  if (code === "escala" || code === "scale" || code === "450") return { id: "escala_450", ...PLAN_CREDITS.escala_450 };
  return null;
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function supabaseHeaders(key, extra = {}) {
  return {
    "Content-Type": "application/json",
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...extra,
  };
}

function timingSafeEqualHex(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function verifyStripeSignature(rawBody, signatureHeader, webhookSecret) {
  if (!signatureHeader || !webhookSecret) return false;

  const parts = signatureHeader.split(",").map((part) => part.trim());
  let timestamp = "";
  const signatures = [];

  for (const part of parts) {
    const [k, v] = part.split("=");
    if (k === "t" && v) timestamp = v;
    if (k === "v1" && v) signatures.push(v);
  }

  if (!timestamp || signatures.length === 0) return false;

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - Number(timestamp)) > 300) {
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signedPayload = `${timestamp}.${rawBody}`;
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  const expectedHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return signatures.some((sig) => timingSafeEqualHex(sig.toLowerCase(), expectedHex));
}

export async function onRequestGet() {
  return jsonResponse({ ok: true, service: "nexora-stripe-webhook" }, 200);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const serviceKey = String(env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
    const anonKey = String(env.SUPABASE_ANON_KEY || "").trim();
    const supaKey = serviceKey || anonKey;

    if (!env.SUPABASE_URL || !supaKey) {
      return jsonResponse({ error: "Supabase não configurado no servidor." }, 500);
    }

    const webhookSecret = String(env.STRIPE_WEBHOOK_SECRET || "").trim();
    if (!webhookSecret) {
      return jsonResponse({ error: "STRIPE_WEBHOOK_SECRET não configurado no servidor." }, 500);
    }

    const rawBody = await request.text();
    const signatureHeader = request.headers.get("Stripe-Signature") || "";

    const isValid = await verifyStripeSignature(rawBody, signatureHeader, webhookSecret);
    if (!isValid) {
      return jsonResponse({ error: "Assinatura Stripe inválida." }, 400);
    }

    const event = JSON.parse(rawBody);

    if (event.type !== "checkout.session.completed") {
      return jsonResponse({ ok: true, ignored: true, type: event.type }, 200);
    }

    const session = event.data?.object || {};

    if (session.payment_status !== "paid") {
      return jsonResponse({ ok: true, paymentStatus: session.payment_status, credited: false }, 200);
    }

    const extRef = String(session.client_reference_id || "").trim();
    const [refUserIdFromRef, refPlanIdFromRef] = extRef.includes("|") ? extRef.split("|") : ["", ""];

    const userId = String(session.metadata?.user_id || refUserIdFromRef || "").trim();
    const planId = String(session.metadata?.plan_id || refPlanIdFromRef || "").trim();
    const customerEmail = String(session.customer_details?.email || session.customer_email || "").trim().toLowerCase();
    const plan = resolvePlanByCode(planId);
    const sessionId = String(session.id || "").trim();

    if ((!userId && !customerEmail) || !plan || !sessionId) {
      return jsonResponse({ error: "Dados incompletos na sessão Stripe.", extRef, customerEmail }, 400);
    }

    const referenceId = `stripe_${sessionId}`;

    // Proteção anti-duplicidade
    const checkUrl = `${env.SUPABASE_URL}/rest/v1/credit_ledger?reference_id=eq.${encodeURIComponent(referenceId)}&select=id&limit=1`;
    const checkRes = await fetch(checkUrl, {
      method: "GET",
      headers: supabaseHeaders(supaKey),
    });

    if (checkRes.ok) {
      const existing = await checkRes.json().catch(() => []);
      if (Array.isArray(existing) && existing.length > 0) {
        return jsonResponse({ ok: true, sessionId, alreadyCredited: true }, 200);
      }
    }

    // 1) Tenta buscar o perfil pelo ID
    let profiles = [];
    if (userId) {
      const byIdUrl = `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id,credits,email&limit=1`;
      const byIdRes = await fetch(byIdUrl, {
        method: "GET",
        headers: supabaseHeaders(supaKey),
      });
      if (byIdRes.ok) {
        profiles = await byIdRes.json().catch(() => []);
      }
    }

    // 2) Se não achou pelo ID, tenta buscar pelo e-mail
    if ((!Array.isArray(profiles) || profiles.length === 0) && customerEmail) {
      const byEmailUrl = `${env.SUPABASE_URL}/rest/v1/profiles?email=ilike.${encodeURIComponent(customerEmail)}&select=id,credits,email&limit=1`;
      const byEmailRes = await fetch(byEmailUrl, {
        method: "GET",
        headers: supabaseHeaders(supaKey),
      });
      if (byEmailRes.ok) {
        profiles = await byEmailRes.json().catch(() => []);
      }
    }

    if (!Array.isArray(profiles) || profiles.length === 0) {
      return jsonResponse({
        error: "Perfil não encontrado no Supabase (verifique se SUPABASE_SERVICE_ROLE_KEY na Cloudflare está com a chave service_role correta).",
        hasServiceRoleKey: Boolean(serviceKey),
        userId,
        customerEmail,
      }, 422);
    }

    const targetProfile = profiles[0];
    const targetUserId = targetProfile.id;
    const currentCredits = Number(targetProfile?.credits ?? 0);
    const newBalance = currentCredits + plan.credits;

    // Atualiza credits e plan_name em profiles
    const patchRes = await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(targetUserId)}`, {
      method: "PATCH",
      headers: supabaseHeaders(supaKey, { Prefer: "return=representation" }),
      body: JSON.stringify({
        credits: newBalance,
        plan_name: plan.name,
      }),
    });

    if (!patchRes.ok) {
      const errTxt = await patchRes.text();
      return jsonResponse({ error: "Erro PATCH profiles: " + errTxt }, 500);
    }

    // Grava histórico
    await fetch(`${env.SUPABASE_URL}/rest/v1/credit_ledger`, {
      method: "POST",
      headers: supabaseHeaders(supaKey, { Prefer: "return=minimal" }),
      body: JSON.stringify({
        user_id: targetUserId,
        amount: plan.credits,
        task: "stripe_purchase",
        description: `Compra Stripe (${plan.name} #${sessionId})`,
        reference_id: referenceId,
      }),
    }).catch(() => {});

    return jsonResponse({
      ok: true,
      sessionId,
      credited: true,
      plan: plan.name,
      previousBalance: currentCredits,
      creditsAdded: plan.credits,
      newBalance,
    }, 200);
  } catch (err) {
    return jsonResponse({ error: "Erro no webhook Stripe: " + (err?.message || "erro interno") }, 500);
  }
}
