const PLANS = {
  inicial_60: {
    id: "inicial_60",
    name: "Pacote Inicial",
    title: "NEXORA.AI - Pacote Inicial (60 Creditos)",
    credits: 60,
    price: 40.0,
    amountCents: 4000,
  },
  criador_180: {
    id: "criador_180",
    name: "Plano Criador Pro",
    title: "NEXORA.AI - Plano Criador Pro (180 Creditos)",
    credits: 180,
    price: 97.0,
    amountCents: 9700,
  },
  escala_450: {
    id: "escala_450",
    name: "Plano Escala",
    title: "NEXORA.AI - Plano Escala (450 Creditos)",
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
    const pagbankToken = String(env.PAGBANK_TOKEN || "").trim();
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
    const expirationDate = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const orderPayload = {
      reference_id: referenceId,
      customer: {
        name: user.user_metadata?.full_name || "Cliente Nexora",
        email: user.email,
        tax_id: "12345678909",
      },
      items: [
        {
          reference_id: plan.id,
          name: plan.title,
          quantity: 1,
          unit_amount: plan.amountCents,
        },
      ],
      qr_codes: [
        {
          amount: {
            value: plan.amountCents,
          },
          expiration_date: expirationDate,
        },
      ],
      notification_urls: [`${origin}/api/webhook`],
    };

    const pbRes = await fetch("https://api.pagseguro.com/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pagbankToken}`,
      },
      body: JSON.stringify(orderPayload),
    });

    const pbData = await pbRes.json().catch(() => ({}));
    const qrCodeObj = Array.isArray(pbData?.qr_codes) ? pbData.qr_codes[0] : null;
    const qrPngLink = Array.isArray(qrCodeObj?.links)
      ? qrCodeObj.links.find((l) => l.rel === "QRCODE.PNG")?.href
      : null;

    if (!pbRes.ok || !qrCodeObj?.text) {
      const detail =
        pbData?.error_messages?.[0]?.description ||
        pbData?.message ||
        `HTTP ${pbRes.status}: ${JSON.stringify(pbData).slice(0, 150)}`;
      return jsonResponse({ error: `PagBank: ${detail}` }, 502);
    }

    const payUrl = qrPngLink || `${origin}/?pix_code=${encodeURIComponent(qrCodeObj.text)}`;

    return jsonResponse({
      ok: true,
      orderId: pbData.id,
      pixText: qrCodeObj.text,
      qrCodeUrl: qrPngLink,
      checkoutUrl: payUrl,
      init_point: payUrl,
      url: payUrl,
      plan: {
        id: plan.id,
        name: plan.name,
        credits: plan.credits,
        price: plan.price,
      },
    });
  } catch (err) {
    return jsonResponse({ error: "Erro ao criar pedido Pix PagBank: " + (err?.message || "erro interno") }, 500);
  }
}
