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

export async function onRequestGet() {
  return jsonResponse({ ok: true, service: "nexora-pagbank-webhook" }, 200);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const supaKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
    if (!env.SUPABASE_URL || !supaKey) {
      return jsonResponse({ error: "Supabase não configurado no servidor." }, 500);
    }

    const rawBody = await request.text();
    const params = new URLSearchParams(rawBody);
    const notificationCode = String(params.get("notificationCode") || "").trim();
    const notificationType = String(params.get("notificationType") || "").trim().toLowerCase();

    if (!notificationCode || notificationType !== "transaction") {
      return jsonResponse({ ok: true, ignored: true }, 200);
    }

    const pagbankEmail = env.PAGBANK_EMAIL || "comercial@jcaatacadista.com.br";
    const consultUrl = `https://ws.pagseguro.uol.com.br/v3/transactions/notifications/${encodeURIComponent(notificationCode)}?email=${encodeURIComponent(pagbankEmail)}&token=${encodeURIComponent(env.PAGBANK_TOKEN)}`;

    const pbRes = await fetch(consultUrl, { method: "GET" });
    const xmlText = await pbRes.text();

    if (!pbRes.ok) {
      return jsonResponse({ error: "Falha ao consultar transação no PagBank." }, 502);
    }

    const statusMatch = xmlText.match(/<status>(\d+)<\/status>/i);
    const statusCode = statusMatch ? statusMatch[1].trim() : "";

    // Status 3 = Paga | Status 4 = Disponível
    if (statusCode !== "3" && statusCode !== "4") {
      return jsonResponse({ ok: true, statusCode, credited: false }, 200);
    }

    const codeMatch = xmlText.match(/<code>([^<]+)<\/code>/i);
    const refMatch = xmlText.match(/<reference>([^<]+)<\/reference>/i);

    const transactionCode = codeMatch ? codeMatch[1].trim() : "";
    const extRef = refMatch ? refMatch[1].trim() : "";
    const [refUserId, refPackageId] = extRef.includes("|") ? extRef.split("|") : ["", ""];
    const plan = resolvePlanByCode(refPackageId);

    if (!refUserId || !plan || !transactionCode) {
      return jsonResponse({ error: "Referência inválida na transação PagBank.", extRef }, 400);
    }

    const referenceId = `pb_${transactionCode}`;

    // Proteção anti-duplicidade
    const checkUrl = `${env.SUPABASE_URL}/rest/v1/credit_ledger?reference_id=eq.${encodeURIComponent(referenceId)}&select=id&limit=1`;
    const checkRes = await fetch(checkUrl, {
      method: "GET",
      headers: supabaseHeaders(supaKey),
    });

    if (checkRes.ok) {
      const existing = await checkRes.json().catch(() => []);
      if (Array.isArray(existing) && existing.length > 0) {
        return jsonResponse({ ok: true, transactionCode, alreadyCredited: true }, 200);
      }
    }

    // Busca saldo atual em profiles
    const profileGetUrl = `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(refUserId)}&select=id,credits&limit=1`;
    const profileGetRes = await fetch(profileGetUrl, {
      method: "GET",
      headers: supabaseHeaders(supaKey),
    });

    const profiles = profileGetRes.ok ? await profileGetRes.json().catch(() => []) : [];
    if (!Array.isArray(profiles) || profiles.length === 0) {
      return jsonResponse({ error: "Perfil não encontrado", userId: refUserId }, 404);
    }

    const currentCredits = Number(profiles[0]?.credits ?? 0);
    const newBalance = currentCredits + plan.credits;

    // Atualiza credits e plan_name em profiles
    const patchRes = await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(refUserId)}`, {
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
        user_id: refUserId,
        amount: plan.credits,
        task: "pagbank_purchase",
        description: `Compra PagBank (${plan.name} #${transactionCode})`,
        reference_id: referenceId,
      }),
    }).catch(() => {});

    return jsonResponse({
      ok: true,
      transactionCode,
      credited: true,
      plan: plan.name,
      previousBalance: currentCredits,
      creditsAdded: plan.credits,
      newBalance,
    }, 200);
  } catch (err) {
    return jsonResponse({ error: "Erro no webhook PagBank: " + (err?.message || "erro interno") }, 500);
  }
}
