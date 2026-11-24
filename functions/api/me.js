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
  if (!accessToken) return null;
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

function supabaseServiceHeaders(env, extra = {}) {
  return {
    "Content-Type": "application/json",
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    ...extra,
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return jsonResponse({ error: "Configuração do servidor incompleta." }, 500);
    }

    const token = getBearerToken(request);
    const user = await getAuthenticatedUser(env, token);
    if (!user) {
      return jsonResponse({ error: "Sessão expirada. Faça login novamente." }, 401);
    }

    const adminEmail = String(env.ADMIN_EMAIL || "").trim().toLowerCase();
    const userEmail = String(user.email || "").trim().toLowerCase();
    const isAdminEnv = Boolean(adminEmail && userEmail && adminEmail === userEmail);

    // Busca perfil do usuário
    const profileUrl = `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=*`;
    const profRes = await fetch(profileUrl, {
      method: "GET",
      headers: supabaseServiceHeaders(env),
    });

    let profiles = profRes.ok ? await profRes.json() : [];
    let profile = Array.isArray(profiles) && profiles.length > 0 ? profiles[0] : null;

    // Garante criação do perfil caso ainda não exista
    if (!profile) {
      const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/profiles`, {
        method: "POST",
        headers: supabaseServiceHeaders(env, { Prefer: "return=representation" }),
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || userEmail.split("@")[0],
          credits: 15,
          plan_name: isAdminEnv ? "Administrador" : "Teste Grátis",
          is_admin: isAdminEnv,
        }),
      });
      const inserted = insertRes.ok ? await insertRes.json() : [];
      profile = Array.isArray(inserted) && inserted[0] ? inserted[0] : {
        id: user.id,
        email: user.email,
        credits: 15,
        plan_name: isAdminEnv ? "Administrador" : "Teste Grátis",
        is_admin: isAdminEnv,
      };
    }

    // Sincroniza flag is_admin se o e-mail bater com ADMIN_EMAIL
    if (isAdminEnv && !profile.is_admin) {
      await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}`, {
        method: "PATCH",
        headers: supabaseServiceHeaders(env),
        body: JSON.stringify({ is_admin: true, plan_name: "Administrador" }),
      });
      profile.is_admin = true;
      profile.plan_name = "Administrador";
    }

    // Busca últimas 30 movimentações de créditos
    const ledgerUrl = `${env.SUPABASE_URL}/rest/v1/credit_ledger?user_id=eq.${encodeURIComponent(user.id)}&select=id,delta,balance_after,task,description,created_at&order=created_at.desc&limit=30`;
    const ledgerRes = await fetch(ledgerUrl, {
      method: "GET",
      headers: supabaseServiceHeaders(env),
    });
    const ledger = ledgerRes.ok ? await ledgerRes.json() : [];

    // Se for administrador, também retorna lista resumida de clientes para gestão
    let usersList = [];
    if (profile.is_admin) {
      const allUsersUrl = `${env.SUPABASE_URL}/rest/v1/profiles?select=id,email,full_name,credits,plan_name,is_admin,created_at&order=created_at.desc&limit=100`;
      const allRes = await fetch(allUsersUrl, {
        method: "GET",
        headers: supabaseServiceHeaders(env),
      });
      if (allRes.ok) {
        usersList = await allRes.json();
      }
    }

    return jsonResponse({
      user: {
        id: user.id,
        email: user.email,
        full_name: profile.full_name || userEmail.split("@")[0],
        credits: Number(profile.credits ?? 0),
        plan_name: profile.plan_name || "Teste Grátis",
        is_admin: Boolean(profile.is_admin),
      },
      publicConfig: {
        supabaseUrl: env.SUPABASE_URL,
        supabaseAnonKey: env.SUPABASE_ANON_KEY,
      },
      ledger: Array.isArray(ledger) ? ledger : [],
      adminUsers: Array.isArray(usersList) ? usersList : [],
    });
  } catch (err) {
    return jsonResponse({ error: "Falha ao carregar conta: " + (err?.message || "erro interno") }, 500);
  }
}

// Endpoint exclusivo do Administrador para adicionar ou ajustar créditos de clientes
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const token = getBearerToken(request);
    const user = await getAuthenticatedUser(env, token);
    if (!user) {
      return jsonResponse({ error: "Não autorizado." }, 401);
    }

    const adminEmail = String(env.ADMIN_EMAIL || "").trim().toLowerCase();
    const userEmail = String(user.email || "").trim().toLowerCase();
    let isAdmin = Boolean(adminEmail && userEmail && adminEmail === userEmail);

    if (!isAdmin) {
      const checkRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=is_admin`,
        { method: "GET", headers: supabaseServiceHeaders(env) }
      );
      const rows = checkRes.ok ? await checkRes.json() : [];
      isAdmin = Boolean(rows?.[0]?.is_admin);
    }

    if (!isAdmin) {
      return jsonResponse({ error: "Acesso restrito ao administrador." }, 403);
    }

    const body = await request.json();
    const targetUserId = String(body.targetUserId || "").trim();
    const amount = parseInt(body.amount, 10);
    const planName = String(body.planName || "").trim();
    const description = String(body.description || "Ajuste administrativo de créditos").trim();

    if (!targetUserId || !Number.isFinite(amount) || amount === 0) {
      return jsonResponse({ error: "Informe o cliente e uma quantidade válida de créditos." }, 400);
    }

    const rpcRes = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/add_credits`, {
      method: "POST",
      headers: supabaseServiceHeaders(env),
      body: JSON.stringify({
        p_user_id: targetUserId,
        p_amount: amount,
        p_task: "admin_adjust",
        p_description: description,
        p_reference_id: `admin_${Date.now()}`,
      }),
    });

    if (!rpcRes.ok) {
      const errTxt = await rpcRes.text();
      return jsonResponse({ error: "Erro ao atualizar créditos: " + errTxt }, 500);
    }

    if (planName) {
      await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(targetUserId)}`, {
        method: "PATCH",
        headers: supabaseServiceHeaders(env),
        body: JSON.stringify({ plan_name: planName }),
      });
    }

    const result = await rpcRes.json();
    const row = Array.isArray(result) ? result[0] : result;

    return jsonResponse({
      ok: true,
      newBalance: Number(row?.new_balance ?? 0),
    });
  } catch (err) {
    return jsonResponse({ error: "Erro no ajuste administrativo: " + (err?.message || "erro interno") }, 500);
  }
}
