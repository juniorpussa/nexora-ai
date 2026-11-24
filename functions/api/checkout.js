const PLANS = {
  inicial_60: {
    id: "inicial_60",
    name: "Pacote Inicial",
    title: "NEXORA.AI - Pacote Inicial (60 Creditos)",
    credits: 60,
    price: "40.00",
  },
  criador_180: {
    id: "criador_180",
    name: "Plano Criador Pro",
    title: "NEXORA.AI - Plano Criador Pro (180 Creditos)",
    credits: 180,
    price: "97.00",
  },
  escala_450: {
    id: "escala_450",
    name: "Plano Escala",
    title: "NEXORA.AI - Plano Escala (450 Creditos)",
    credits: 450,
    price: "197.00",
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
    const pagbankToken = String(env.PAGBANK_TOKEN || "").trim();
    const pagbankEmail = String(env.PAGBANK_EMAIL || "comercial@jcaatacadista.com.br").trim();

    if (!pagbankToken) {
      return jsonResponse({ error: "Token do PagBank (PAGBANK_TOKEN) não configurado no servidor." }, 500);
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

    const formParams = new URLSearchParams();
    formParams.append("email", pagbankEmail);
    formParams.append("token", pagbankToken);
    formParams.append("currency", "BRL");
    formParams.append("itemId1", plan.id);
    formParams.append("itemDescription1", plan.title);
    formParams.append("itemAmount1", plan.price);
    formParams.append("itemQuantity1", "1");
    formParams.append("reference", referenceId);
    formParams.append("redirectURL", `${origin}/?pagamento=aprovado`);
    formParams.append("notificationURL", `${origin}/api/webhook`);

    const pbRes = await fetch("https://ws.pagseguro.uol.com.br/v2/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: formParams.toString(),
    });

    const xmlText = await pbRes.text();
    const codeMatch = xmlText.match(/<code>([^<]+)<\/code>/i);
    const checkoutCode = codeMatch ? codeMatch[1].trim() : "";

    if (!pbRes.ok || !checkoutCode) {
      const msgMatch = xmlText.match(/<message>([^<]+)<\/message>/i);
      const detail = msgMatch
        ? `${msgMatch[1]} (Status ${pbRes.status})`
        : `HTTP ${pbRes.status}: ${xmlText.slice(0, 120) || "Unauthorized - confira PAGBANK_EMAIL e PAGBANK_TOKEN"}`;
      return jsonResponse({ error: `PagBank: ${detail}` }, 502);
    }

    const payLink = `https://pagseguro.uol.com.br/v2/checkout/payment.html?code=${encodeURIComponent(checkoutCode)}`;

    return jsonResponse({
      ok: true,
      checkoutId: checkoutCode,
      checkoutUrl: payLink,
      init_point: payLink,
      url: payLink,
      plan: {
        id: plan.id,
        name: plan.name,
        credits: plan.credits,
        price: Number(plan.price),
      },
    });
  } catch (err) {
    return jsonResponse({ error: "Erro ao criar checkout PagBank: " + (err?.message || "erro interno") }, 500);
  }
}
