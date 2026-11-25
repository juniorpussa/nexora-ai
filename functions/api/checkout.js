const PLANS = {
  inicial_60: {
    id: "inicial_60",
    name: "Pacote Inicial",
    title: "NEXORA.AI - Pacote Inicial (60 Créditos)",
    credits: 60,
    price: 40.0,
    amountCents: 4000,
  },
  criador_180: {
    id: "criador_180",
    name: "Plano Criador Pro",
    title: "NEXORA.AI - Plano Criador Pro (180 Créditos)",
    credits: 180,
    price: 97.0,
    amountCents: 9700,
  },
  escala_450: {
    id: "escala_450",
    name: "Plano Escala",
    title: "NEXORA.AI - Plano Escala (450 Créditos)",
    credits: 450,
    price: 197.0,
    amountCents: 19700,
  },
};

function resolvePlan(rawValue) {
  const key = String(rawValue || "").trim().toLowerCase();
  if (PLANS[key]) return PLANS[key];
  if (key === "inicial" || key === "40" || key === "60") return PLANS.inicial_60;
  if (key === "criador" || key === "pro" || key === "97" || key === "180") return PLANS.criador_180;
  if (key === "escala" || key === "scale" || key === "197" || key === "450") return PLANS.escala_450;
  return null;
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

function getBearerToken(request) {
  const authHeader = request.headers.get("Authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return "";
  return authHeader.slice(7).trim();
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

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const stripeKey = String(env.STRIPE_SECRET_KEY || "").trim();
    if (!stripeKey) {
      return jsonResponse({ error: "Chave da Stripe (STRIPE_SECRET_KEY) não configurada no servidor." }, 500);
    }

    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      return jsonResponse({ error: "Configuração do Supabase incompleta no servidor." }, 500);
    }

    const token = getBearerToken(request);
    const user = await getAuthenticatedUser(env, token);
    if (!user) {
      return jsonResponse({ error: "Faça login na sua conta antes de escolher um plano." }, 401);
    }

    const body = await request.json().catch(() => ({}));
    const rawPlan = body.packageId || body.planId || body.planCode || body.plan || body.id;
    const plan = resolvePlan(rawPlan);

    if (!plan) {
      return jsonResponse({ error: "Plano selecionado inválido." }, 400);
    }

    const origin = new URL(request.url).origin;
    const referenceId = `${user.id}|${plan.id}`;

    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("payment_method_options[card][installments][enabled]", "true");
    form.set("success_url", `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`);
    form.set("cancel_url", `${origin}/?payment=cancelled`);
    form.set("client_reference_id", referenceId);
    if (user.email) {
      form.set("customer_email", user.email);
    }
    form.set("metadata[user_id]", user.id);
    form.set("metadata[plan_id]", plan.id);
    form.set("metadata[credits]", String(plan.credits));

    form.set("line_items[0][price_data][currency]", "brl");
    form.set("line_items[0][price_data][product_data][name]", plan.title);
    form.set(
      "line_items[0][price_data][product_data][description]",
      `Recarga instantânea de ${plan.credits} créditos na plataforma NEXORA.AI`
    );
    form.set("line_items[0][price_data][unit_amount]", String(plan.amountCents));
    form.set("line_items[0][quantity]", "1");

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    const stripeData = await stripeRes.json().catch(() => ({}));

    if (!stripeRes.ok || !stripeData?.url) {
      const detail =
        stripeData?.error?.message ||
        `HTTP ${stripeRes.status}: ${JSON.stringify(stripeData).slice(0, 150)}`;
      return jsonResponse({ error: `Stripe: ${detail}` }, 502);
    }

    return jsonResponse({
      ok: true,
      sessionId: stripeData.id,
      checkoutUrl: stripeData.url,
      init_point: stripeData.url,
      url: stripeData.url,
      plan: {
        id: plan.id,
        name: plan.name,
        credits: plan.credits,
        price: plan.price,
      },
    });
  } catch (err) {
    return jsonResponse({ error: "Erro ao criar checkout Stripe: " + (err?.message || "erro interno") }, 500);
  }
}
