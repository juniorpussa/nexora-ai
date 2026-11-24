(function () {
  const SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

  const state = {
    sb: null,
    session: null,
    user: null,
    credits: null,
    planName: "",
    isAdmin: false,
    ledger: [],
    adminUsers: [],
    publicConfig: null,
    authMode: "login",
    ready: false,
  };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (window.supabase && typeof window.supabase.createClient === "function") {
        return resolve();
      }
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("Falha ao carregar autenticação.")));
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Falha ao carregar autenticação."));
      document.head.appendChild(s);
    });
  }

  function ensureStyles() {
    if (document.getElementById("nexoraSaasStableStyles")) return;
    const style = document.createElement("style");
    style.id = "nexoraSaasStableStyles";
    style.textContent = `
      #nxProDock {
        position: fixed !important;
        top: 10px !important;
        right: 14px !important;
        z-index: 2147483000 !important;
        display: flex !important;
        flex-wrap: wrap !important;
        align-items: center !important;
        gap: 6px !important;
        padding: 6px 10px !important;
        border-radius: 999px !important;
        background: rgba(10, 15, 28, 0.94) !important;
        border: 1px solid rgba(148, 163, 184, 0.28) !important;
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.6) !important;
        backdrop-filter: blur(10px) !important;
        font-family: system-ui, -apple-system, sans-serif !important;
      }
      .nx-pro-chip {
        display: inline-flex !important;
        align-items: center !important;
        gap: 5px !important;
        padding: 5px 10px !important;
        border-radius: 999px !important;
        font-size: 12px !important;
        font-weight: 700 !important;
        background: rgba(245, 158, 11, 0.16) !important;
        color: #fbbf24 !important;
        border: 1px solid rgba(245, 158, 11, 0.38) !important;
      }
      .nx-pro-btn {
        padding: 5px 11px !important;
        border-radius: 999px !important;
        font-size: 12px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
        border: 1px solid rgba(148, 163, 184, 0.28) !important;
        background: rgba(20, 30, 48, 0.95) !important;
        color: #f8fafc !important;
      }
      .nx-pro-btn:hover {
        border-color: #38bdf8 !important;
      }
      .nx-pro-btn-cta {
        background: linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%) !important;
        border: none !important;
        color: #ffffff !important;
      }
      .nx-pro-btn-admin {
        background: rgba(245, 158, 11, 0.22) !important;
        border: 1px solid rgba(251, 191, 36, 0.55) !important;
        color: #fde68a !important;
      }
      .nx-pro-backdrop {
        position: fixed !important;
        inset: 0 !important;
        z-index: 2147483640 !important;
        display: none;
        align-items: center !important;
        justify-content: center !important;
        padding: 16px !important;
        background: rgba(2, 6, 23, 0.8) !important;
        backdrop-filter: blur(6px) !important;
      }
      .nx-pro-backdrop.open {
        display: flex !important;
      }
      .nx-pro-modal {
        width: 100%;
        max-width: 500px;
        max-height: 88vh;
        overflow-y: auto;
        background: #0d1322;
        border: 1px solid rgba(148, 163, 184, 0.25);
        border-radius: 18px;
        padding: 20px;
        color: #f8fafc;
        font-family: system-ui, -apple-system, sans-serif;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7);
      }
      .nx-pro-modal h3 {
        margin: 0 0 6px 0;
        font-size: 18px;
        font-weight: 800;
      }
      .nx-pro-sub {
        margin: 0 0 14px 0;
        font-size: 13px;
        color: #94a3b8;
      }
      .nx-pro-input {
        width: 100%;
        margin-bottom: 10px;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid rgba(148, 163, 184, 0.25);
        background: #070b14;
        color: #f8fafc;
        font-size: 13px;
      }
      .nx-pro-err {
        color: #fca5a5;
        font-size: 12px;
        margin-bottom: 10px;
      }
      .nx-pro-ok {
        color: #86efac;
        font-size: 12px;
        margin-bottom: 10px;
      }
      .nx-pro-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-radius: 12px;
        background: rgba(18, 27, 45, 0.85);
        border: 1px solid rgba(148, 163, 184, 0.15);
        margin-bottom: 8px;
        font-size: 12px;
      }
    `;
    document.head.appendChild(style);
  }

  function ensureUi() {
    ensureStyles();
    if (!document.body) return;

    const oldExec = document.getElementById("nxExecTopBar");
    if (oldExec) oldExec.remove();

    if (!document.getElementById("nxProDock")) {
      const dock = document.createElement("div");
      dock.id = "nxProDock";
      dock.innerHTML = `
        <span id="nxProCredits" class="nx-pro-chip">✦ Créditos: --</span>
        <button id="nxProBtnPlans" type="button" class="nx-pro-btn">Planos</button>
        <button id="nxProBtnLedger" type="button" class="nx-pro-btn">Extrato</button>
        <button id="nxProBtnAdmin" type="button" class="nx-pro-btn nx-pro-btn-admin" style="display:none;">Painel Admin</button>
        <button id="nxProBtnAuth" type="button" class="nx-pro-btn nx-pro-btn-cta">Entrar / Cadastrar</button>
      `;
      document.body.appendChild(dock);
    }

    if (!document.getElementById("nxProBackdrop")) {
      const backdrop = document.createElement("div");
      backdrop.id = "nxProBackdrop";
      backdrop.className = "nx-pro-backdrop";
      backdrop.innerHTML = `<div id="nxProModalBox" class="nx-pro-modal"></div>`;
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) closeModal();
      });
      document.body.appendChild(backdrop);
    }

    document.getElementById("nxProBtnAuth").onclick = () => {
      if (state.session) handleLogout();
      else openAuthModal("login");
    };
    document.getElementById("nxProBtnPlans").onclick = openPlansModal;
    document.getElementById("nxProBtnLedger").onclick = openLedgerModal;
    document.getElementById("nxProBtnAdmin").onclick = openAdminModal;
  }

  function closeModal() {
    const backdrop = document.getElementById("nxProBackdrop");
    if (backdrop) backdrop.classList.remove("open");
  }

  function openModal(html) {
    ensureUi();
    const backdrop = document.getElementById("nxProBackdrop");
    const box = document.getElementById("nxProModalBox");
    box.innerHTML = html;
    backdrop.classList.add("open");
  }

  function renderDock() {
    ensureUi();
    const creditsEl = document.getElementById("nxProCredits");
    const authBtn = document.getElementById("nxProBtnAuth");
    const adminBtn = document.getElementById("nxProBtnAdmin");
    if (!creditsEl || !authBtn || !adminBtn) return;

    if (state.session && state.user) {
      const c = Number.isFinite(state.credits) ? state.credits : 0;
      creditsEl.textContent = `✦ ${c} créditos`;
      authBtn.textContent = "Sair";
      authBtn.className = "nx-pro-btn";
      adminBtn.style.display = state.isAdmin ? "inline-block" : "none";
    } else {
      creditsEl.textContent = "✦ Créditos: --";
      authBtn.textContent = "Entrar / Cadastrar";
      authBtn.className = "nx-pro-btn nx-pro-btn-cta";
      adminBtn.style.display = "none";
    }
  }

  async function fetchPublicConfig() {
    if (state.publicConfig?.supabaseUrl && state.publicConfig?.supabaseAnonKey) {
      return state.publicConfig;
    }
    try {
      const res = await fetch("/api/me", { method: "GET" });
      const data = await res.json().catch(() => ({}));
      if (data?.publicConfig?.supabaseUrl && data?.publicConfig?.supabaseAnonKey) {
        state.publicConfig = data.publicConfig;
        return state.publicConfig;
      }
    } catch (_) {}
    return null;
  }

  async function initSupabaseClient() {
    if (state.sb) return state.sb;
    await loadScript(SUPABASE_CDN);
    const cfg = await fetchPublicConfig();
    if (!cfg?.supabaseUrl || !cfg?.supabaseAnonKey) return null;
    state.sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    return state.sb;
  }

  async function refreshProfileFromServer() {
    if (!state.session?.access_token) return null;
    const res = await fetch("/api/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${state.session.access_token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) {
        state.session = null;
        state.user = null;
        state.credits = null;
        renderDock();
      }
      return null;
    }
    state.user = data.user || null;
    state.credits = Number(data.user?.credits ?? 0);
    state.planName = data.user?.plan_name || "Ativo";
    state.isAdmin = Boolean(data.user?.is_admin);
    state.ledger = Array.isArray(data.ledger) ? data.ledger : [];
    state.adminUsers = Array.isArray(data.adminUsers) ? data.adminUsers : [];
    if (data.publicConfig) state.publicConfig = data.publicConfig;
    renderDock();
    return data;
  }

  function openAuthModal(mode = "login") {
    state.authMode = mode;
    const isRegister = mode === "register";
    openModal(`
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h3>${isRegister ? "Criar Conta — NEXORA.AI" : "Entrar — NEXORA.AI"}</h3>
        <button type="button" class="nx-pro-btn" onclick="window.NexoraSaas.closeModal()">Fechar</button>
      </div>
      <p class="nx-pro-sub">${isRegister ? "Crie sua conta para acessar o estúdio e gerenciar seus créditos." : "Entre com seu e-mail e senha para usar o estúdio."}</p>
      <div id="nxProAuthFb"></div>
      ${isRegister ? '<input id="nxProName" type="text" class="nx-pro-input" placeholder="Seu nome ou loja" />' : ""}
      <input id="nxProEmail" type="email" class="nx-pro-input" placeholder="seu@email.com" autocomplete="email" />
      <input id="nxProPass" type="password" class="nx-pro-input" placeholder="Sua senha (mínimo 6 caracteres)" autocomplete="current-password" />
      <div style="display:flex;gap:8px;margin-top:6px;">
        <button id="nxProAuthSubmit" type="button" class="nx-pro-btn nx-pro-btn-cta" style="flex:1;padding:10px;">
          ${isRegister ? "Criar Conta" : "Entrar"}
        </button>
        <button type="button" class="nx-pro-btn" onclick="window.NexoraSaas.openAuthModal('${isRegister ? "login" : "register"}')">
          ${isRegister ? "Já tenho conta" : "Criar conta"}
        </button>
      </div>
    `);

    document.getElementById("nxProAuthSubmit").onclick = async () => {
      const fb = document.getElementById("nxProAuthFb");
      const email = (document.getElementById("nxProEmail")?.value || "").trim();
      const password = document.getElementById("nxProPass")?.value || "";
      const fullName = (document.getElementById("nxProName")?.value || "").trim();

      if (!email || !password) {
        fb.innerHTML = `<div class="nx-pro-err">Informe e-mail e senha.</div>`;
        return;
      }

      fb.innerHTML = `<div class="nx-pro-ok">Conectando...</div>`;
      try {
        const sb = await initSupabaseClient();
        if (!sb) {
          fb.innerHTML = `<div class="nx-pro-err">Não foi possível conectar ao servidor de acesso.</div>`;
          return;
        }
        const authResp = isRegister
          ? await sb.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
          : await sb.auth.signInWithPassword({ email, password });

        if (authResp.error) {
          fb.innerHTML = `<div class="nx-pro-err">${authResp.error.message}</div>`;
          return;
        }
        state.session = authResp.data.session;
        await refreshProfileFromServer();
        closeModal();
      } catch (err) {
        fb.innerHTML = `<div class="nx-pro-err">${err?.message || "Erro ao entrar."}</div>`;
      }
    };
  }

  async function handleLogout() {
    try {
      if (state.sb) await state.sb.auth.signOut();
    } catch (_) {}
    state.session = null;
    state.user = null;
    state.credits = null;
    state.isAdmin = false;
    state.ledger = [];
    state.adminUsers = [];
    renderDock();
  }

  function openPlansModal() {
    openModal(`
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h3>Planos e Créditos</h3>
        <button type="button" class="nx-pro-btn" onclick="window.NexoraSaas.closeModal()">Fechar</button>
      </div>
      <p class="nx-pro-sub">Escolha o pacote ideal para produzir vídeos e imagens comerciais 9:16.</p>
      <div class="nx-pro-card">
        <div><strong>Inicial — 60 Créditos</strong><br/><span style="color:#94a3b8;">Testes e campanhas rápidas</span></div>
        <strong style="color:#fbbf24;">R$ 40,00</strong>
      </div>
      <div class="nx-pro-card">
        <div><strong>Criador — 180 Créditos</strong><br/><span style="color:#94a3b8;">Produção diária para afiliados e lojas</span></div>
        <strong style="color:#fbbf24;">R$ 97,00</strong>
      </div>
      <div class="nx-pro-card">
        <div><strong>Escala — 450 Créditos</strong><br/><span style="color:#94a3b8;">Alto volume de vídeos e fotos</span></div>
        <strong style="color:#fbbf24;">R$ 197,00</strong>
      </div>
    `);
  }

  async function openLedgerModal() {
    if (!state.session) {
      openAuthModal("login");
      return;
    }
    await refreshProfileFromServer();
    const items = state.ledger.length
      ? state.ledger
          .map((item) => {
            const d = Number(item.delta || 0);
            const sign = d > 0 ? `+${d}` : `${d}`;
            const col = d >= 0 ? "#86efac" : "#fca5a5";
            return `
              <div class="nx-pro-card">
                <div><strong>${item.description || item.task || "Movimentação"}</strong><br/><span style="color:#94a3b8;">Saldo após: ${item.balance_after ?? "--"}</span></div>
                <strong style="color:${col};">${sign}</strong>
              </div>
            `;
          })
          .join("")
      : `<p class="nx-pro-sub">Nenhuma movimentação ainda.</p>`;

    openModal(`
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h3>Extrato de Créditos</h3>
        <button type="button" class="nx-pro-btn" onclick="window.NexoraSaas.closeModal()">Fechar</button>
      </div>
      <p class="nx-pro-sub">Saldo atual: <strong>${state.credits ?? 0}</strong> créditos</p>
      <div style="max-height:55vh;overflow-y:auto;">${items}</div>
    `);
  }

  async function openAdminModal() {
    if (!state.session || !state.isAdmin) return;
    await refreshProfileFromServer();
    const opts = state.adminUsers
      .map((u) => `<option value="${u.id}">${u.email} — ${u.credits ?? 0} créditos (${u.plan_name || "Plano"})</option>`)
      .join("");

    openModal(`
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h3>Painel Admin</h3>
        <button type="button" class="nx-pro-btn" onclick="window.NexoraSaas.closeModal()">Fechar</button>
      </div>
      <p class="nx-pro-sub">Liberar ou ajustar créditos de clientes na hora.</p>
      <div id="nxProAdminFb"></div>
      <select id="nxProAdminUser" class="nx-pro-input">${opts}</select>
      <input id="nxProAdminAmt" type="number" class="nx-pro-input" value="60" placeholder="Quantidade de créditos" />
      <input id="nxProAdminPlan" type="text" class="nx-pro-input" placeholder="Nome do plano (opcional)" />
      <button id="nxProAdminSave" type="button" class="nx-pro-btn nx-pro-btn-cta" style="width:100%;padding:11px;">
        Salvar Créditos
      </button>
    `);

    document.getElementById("nxProAdminSave").onclick = async () => {
      const fb = document.getElementById("nxProAdminFb");
      const targetUserId = document.getElementById("nxProAdminUser")?.value;
      const amount = parseInt(document.getElementById("nxProAdminAmt")?.value || "0", 10);
      const planName = (document.getElementById("nxProAdminPlan")?.value || "").trim();

      if (!targetUserId || !amount) {
        fb.innerHTML = `<div class="nx-pro-err">Escolha o cliente e informe a quantidade.</div>`;
        return;
      }

      fb.innerHTML = `<div class="nx-pro-ok">Atualizando...</div>`;
      const res = await fetch("/api/me", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.session.access_token}`,
        },
        body: JSON.stringify({ targetUserId, amount, planName, description: "Liberação pelo Painel Admin" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        fb.innerHTML = `<div class="nx-pro-err">${data.error || "Erro ao salvar."}</div>`;
        return;
      }
      await refreshProfileFromServer();
      fb.innerHTML = `<div class="nx-pro-ok">Pronto! Novo saldo: ${data.newBalance} créditos.</div>`;
    };
  }

  function installFetchInterceptor() {
    if (window.__nxProFetchWrapped) return;
    window.__nxProFetchWrapped = true;
    const origFetch = window.fetch.bind(window);

    window.fetch = async function (input, init = {}) {
      const urlStr = typeof input === "string" ? input : input?.url || "";
      const isGen = urlStr.includes("/api/generate");
      const isMe = urlStr.includes("/api/me");

      if ((isGen || isMe) && state.session?.access_token) {
        const headers = new Headers(init.headers || {});
        if (!headers.has("Authorization")) {
          headers.set("Authorization", `Bearer ${state.session.access_token}`);
        }
        init = { ...init, headers };
      }

      const resp = await origFetch(input, init);
      if (isGen) {
        resp.clone().json().then((payload) => {
          if (payload && typeof payload.credits === "number") {
            state.credits = payload.credits;
            renderDock();
          }
          if (resp.status === 401) openAuthModal("login");
          else if (resp.status === 402 || payload?.code === "INSUFFICIENT_CREDITS") openPlansModal();
        }).catch(() => {});
      }
      return resp;
    };
  }

  async function boot() {
    ensureUi();
    renderDock();
    installFetchInterceptor();
    try {
      const sb = await initSupabaseClient();
      if (sb) {
        const { data } = await sb.auth.getSession();
        if (data?.session) {
          state.session = data.session;
          await refreshProfileFromServer();
        }
        sb.auth.onAuthStateChange(async (_evt, newSess) => {
          state.session = newSess || null;
          if (state.session) await refreshProfileFromServer();
          else {
            state.user = null;
            state.credits = null;
            state.isAdmin = false;
            renderDock();
          }
        });
      }
    } catch (_) {}
    state.ready = true;
  }

  window.NexoraSaas = {
    openAuthModal,
    openPlansModal,
    openLedgerModal,
    openAdminModal,
    closeModal,
    refreshProfileFromServer,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
