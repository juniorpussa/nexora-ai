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
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function supabaseServiceHeaders(env, extra = {}) {
  return {
    "Content-Type": "application/json",
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    ...extra,
  };
}

export async function onRequestGet() {
  return jsonResponse({ ok: true, service: "nexora-mercadopago-webhook" }, 200);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    if (!env.MP_ACCESS_TOKEN) {
      return jsonResponse({ error: "MP_ACCESS_TOKEN não configurado." }, 500);
    }
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return jsonResponse({ error: "Supabase não configurado no servidor." }, 500);
    }

    const url = new URL(request.url);
    let body = {};
    try {
      body = await request.json();
    } catch (_) {
      body = {};
    }

    const topic = String(
      body.type || body.topic || url.searchParams.get("type") || url.searchParams.get("topic") || ""
    )
      .trim()
      .toLowerCase();

    const paymentId = String(
      body?.data?.id ||
        body?.id ||
        url.searchParams.get("data.id") ||
        url.searchParams.get("id") ||
        ""
    ).trim();

    if (!paymentId) {
      return jsonResponse({ ok: true, ignored: "Sem paymentId na notificação" }, 200);
    }

    if (topic && topic !== "payment") {
      return jsonResponse({ ok: true, ignored: `Evento ${topic}` }, 200);
    }

    // 1. Consulta o pagamento oficial direto na API do Mercado Pago
    const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`,
      },
    });

    if (!mpResp.ok) {
      return jsonResponse({ error: "Falha ao consultar pagamento no Mercado Pago." }, 502);
    }

    const payment = await mpResp.json();
    const status = String(payment?.status || "").toLowerCase();

    if (status !== "approved") {
      return jsonResponse({ ok: true, paymentId, status, credited: false }, 200);
    }

    // 2. Identifica o usuário e o plano comprado
    const extRef = String(payment?.external_reference || "").trim();
    const [refUserId, refPackageId] = extRef.includes("|") ? extRef.split("|") : ["", ""];

    const userId = String(payment?.metadata?.user_id || refUserId || "").trim();
    const rawPackageId = String(payment?.metadata?.package_id || refPackageId || "").trim();
    const plan = resolvePlanByCode(rawPackageId);

    if (!userId || !plan) {
      return jsonResponse({
        error: "Pagamento aprovado, mas userId ou plano não identificado na referência.",
        paymentId,
      }, 400);
    }

    const referenceId = `mp_${paymentId}`;

    // 3. Proteção anti-duplicidade no credit_ledger
    const checkUrl = `${env.SUPABASE_URL}/rest/v1/credit_ledger?reference_id=eq.${encodeURIComponent(referenceId)}&select=id&limit=1`;
    const checkRes = await fetch(checkUrl, {
      method: "GET",
      headers: supabaseServiceHeaders(env),
    });

    if (checkRes.ok) {
      const existing = await checkRes.json().catch(() => []);
      if (Array.isArray(existing) && existing.length > 0) {
        return jsonResponse({
          ok: true,
          paymentId,
          alreadyCredited: true,
          creditsAdded: plan.credits,
        }, 200);
      }
    }

    // 4. Busca o saldo atual do usuário na tabela profiles
    const profileGetUrl = `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id,credits&limit=1`;
    const profileGetRes = await fetch(profileGetUrl, {
      method: "GET",
      headers: supabaseServiceHeaders(env),
    });

    if (!profileGetRes.ok) {
      const errTxt = await profileGetRes.text();
      return jsonResponse({ error: "Erro ao buscar perfil no Supabase: " + errTxt }, 500);
    }

    const profiles = await profileGetRes.json().catch(() => []);
    if (!Array.isArray(profiles) || profiles.length === 0) {
      return jsonResponse({ error: "Perfil do usuário não encontrado no Supabase.", userId }, 404);
    }

    const currentCredits = Number(profiles[0]?.credits ?? 0);
    const newBalance = currentCredits + plan.credits;

    // 5. Atualiza diretamente os créditos e o nome do plano na tabela profiles
    const patchRes = await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
      method: "PATCH",
      headers: supabaseServiceHeaders(env, { Prefer: "return=representation" }),
      body: JSON.stringify({
        credits: newBalance,
        plan_name: plan.name,
      }),
    });

    if (!patchRes.ok) {
      const errTxt = await patchRes.text();
      return jsonResponse({ error: "Erro ao atualizar créditos em profiles: " + errTxt }, 500);
    }

    // 6. Registra no histórico credit_ledger (opcional, não bloqueia se alguma coluna diferir)
    await fetch(`${env.SUPABASE_URL}/rest/v1/credit_ledger`, {
      method: "POST",
      headers: supabaseServiceHeaders(env, { Prefer: "return=minimal" }),
      body: JSON.stringify({
        user_id: userId,
        amount: plan.credits,
        task: "mercadopago_purchase",
        description: `Compra Mercado Pago (${plan.name} #${paymentId})`,
        reference_id: referenceId,
      }),
    }).catch(() => {});

    return jsonResponse({
      ok: true,
      paymentId,
      credited: true,
      plan: plan.name,
      previousBalance: currentCredits,
      creditsAdded: plan.credits,
      newBalance,
    }, 200);
  } catch (err) {
    return jsonResponse({ error: "Erro no webhook do Mercado Pago: " + (err?.message || "erro interno") }, 500);
  }
}
