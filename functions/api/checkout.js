const PLANS = {
  inicial_60: {
    id: "inicial_60",
    name: "Pacote Inicial",
    title: "NEXORA.AI — Pacote Inicial (60 Créditos)",
    description: "60 créditos para gerar vídeos 9:16, imagens e narrações no NEXORA.AI",
    credits: 60,
    price: 40.0,
  },
  criador_180: {
    id: "criador_180",
    name: "Plano Criador Pro",
    title: "NEXORA.AI — Plano Criador Pro (180 Créditos)",
    description: "180 créditos para rotina diária de vídeos 9:16 no NEXORA.AI",
    credits: 180,
    price: 97.0,
  },
  escala_450: {
    id: "escala_450",
    name: "Plano Escala",
    title: "NEXORA.AI — Plano Escala (450 Créditos)",
    description: "450 créditos para alta produção em múltiplas contas no NEXORA.AI",
    credits: 450,
    price: 197.0,
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
    if (!env.MP_ACCESS_TOKEN) {
      return jsonResponse({ error: "Chave do Mercado Pago (MP_ACCESS_TOKEN) não configurada no servidor." }, 500);
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

    const preferencePayload = {
      items: [
        {
          id: plan.id,
          title: plan.title,
          description: plan.description,
          quantity: 1,
          currency_id: "BRL",
          unit_price: plan.price,
        },
      ],
      payer: {
        email: user.email,
      },
      external_reference: `${user.id}|${plan.id}`,
      metadata: {
        user_id: user.id,
        user_email: user.email,
        package_id: plan.id,
        plan_name: plan.name,
        credits: plan.credits,
      },
      notification_url: `${origin}/api/webhook`,
      back_urls: {
        success: `${origin}/?pagamento=aprovado`,
        pending: `${origin}/?pagamento=pendente`,
        failure: `${origin}/?pagamento=cancelado`,
      },
      statement_descriptor: "NEXORA.AI",
    };

    if (origin.startsWith("https://")) {
      preferencePayload.auto_return = "approved";
    }

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preferencePayload),
    });

    const mpData = await mpRes.json().catch(() => ({}));

    if (!mpRes.ok || !mpData.init_point) {
      const detail = mpData?.message || mpData?.error || "Não foi possível gerar o link de pagamento.";
      return jsonResponse({ error: `Erro no Mercado Pago: ${detail}` }, 502);
    }

    return jsonResponse({
      ok: true,
      preferenceId: mpData.id,
      checkoutUrl: mpData.init_point,
      init_point: mpData.init_point,
      url: mpData.init_point,
      plan: {
        id: plan.id,
        name: plan.name,
        credits: plan.credits,
        price: plan.price,
      },
    });
  } catch (err) {
    return jsonResponse({ error: "Erro ao criar checkout: " + (err?.message || "erro interno") }, 500);
  }
}
