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
        existing.addEventListener("error", () => reject(new Error("Falha ao carregar biblioteca de login.")));
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Falha ao carregar biblioteca de login."));
      document.head.appendChild(s);
    });
  }

  function ensureStyles() {
    if (document.getElementById("nexoraSaasStyles")) return;
    const style = document.createElement("style");
    style.id = "nexoraSaasStyles";
    style.textContent = `
      #nexoraTopBar {
        position: sticky;
        top: 0;
        z-index: 9990;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 16px;
        background: rgba(9, 13, 22, 0.92);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        font-family: system-ui, -apple-system, sans-serif;
        color: #f8fafc;
      }
      .nx-bar-group {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }
      .nx-brand {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 800;
        font-size: 14px;
        letter-spacing: 0.4px;
      }
      .nx-badge {
        background: rgba(251, 191, 36, 0.14);
        color: #fde68a;
        border: 1px solid rgba(251, 191, 36, 0.35);
        padding: 5px 11px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
      }
      .nx-btn {
        background: rgba(30, 41, 59, 0.9);
        color: #f8fafc;
        border: 1px solid rgba(148, 163, 184, 0.28);
        padding: 6px 12px;
        border-radius: 9px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
      }
      .nx-btn:hover {
        border-color: #38bdf8;
      }
      .nx-btn-primary {
        background: linear-gradient(135deg, #0284c7, #4f46e5);
        border: none;
        color: #fff;
        font-weight: 700;
      }
      .nx-btn-admin {
        background: rgba(245, 158, 11, 0.18);
        border: 1px solid rgba(245, 158, 11, 0.5);
        color: #fcd34d;
        font-weight: 700;
      }
      .nx-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: rgba(2, 6, 23, 0.78);
        backdrop-filter: blur(6px);
      }
      .nx-modal-backdrop.open {
        display: flex;
      }
      .nx-modal {
        width: 100%;
        max-width: 520px;
        max-height: 88vh;
        overflow-y: auto;
        background: #0f172a;
        border: 1px solid rgba(148, 163, 184, 0.25);
        border-radius: 16px;
        padding: 20px;
        color: #f8fafc;
        font-family: system-ui, -apple-system, sans-serif;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65);
      }
      .nx-modal h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 800;
      }
      .nx-modal p.nx-sub {
        margin: 0 0 14px 0;
        font-size: 13px;
        color: #94a3b8;
      }
      .nx-field {
        width: 100%;
        margin-bottom: 10px;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid rgba(148, 163, 184, 0.28);
        background: #020617;
        color: #f8fafc;
        font-size: 13px;
      }
      .nx-msg-err {
        color: #fca5a5;
        font-size: 12px;
        margin-bottom: 10px;
      }
      .nx-msg-ok {
        color: #86efac;
        font-size: 12px;
        margin-bottom: 10px;
      }
      .nx-list-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        padding: 10px;
        border-radius: 10px;
        background: rgba(15, 23, 42, 0.7);
        border: 1px solid rgba(148, 163, 184, 0.14);
        margin-bottom: 8px;
        font-size: 12px;
      }
    `;
    document.head.appendChild(style);
  }

  function ensureUi() {
    ensureStyles();
    if (!document.getElementById("nexoraTopBar")) {
      const bar = document.createElement("div");
      bar.id = "nexoraTopBar";
      bar.innerHTML = `
        <div class="nx-bar-group">
          <div class="nx-brand">
            <span>NEXORA.AI</span>
          </div>
          <span id="nxCreditsPill" class="nx-badge">Créditos: --</span>
          <span id="nxPlanPill" class="nx-badge" style="background:rgba(56,189,248,0.14);color:#bae6fd;border-color:rgba(56,189,248,0.35);">Conta pendente</span>
        </div>
        <div class="nx-bar-group">
          <button id="nxBtnPlans" type="button" class="nx-btn">Planos</button>
          <button id="nxBtnLedger" type="button" class="nx-btn">Extrato</button>
          <button id="nxBtnAdmin" type="button" class="nx-btn nx-btn-admin" style="display:none;">Painel Admin</button>
          <span id="nxUserEmail" style="font-size:12px;color:#cbd5e1;"></span>
          <button id="nxBtnAuth" type="button" class="nx-btn nx-btn-primary">Entrar / Cadastrar</button>
        </div>
      `;
      document.body.insertBefore(bar, document.body.firstChild);
    }

    if (!document.getElementById("nexoraModalBackdrop")) {
      const backdrop = document.createElement("div");
      backdrop.id = "nexoraModalBackdrop";
      backdrop.className = "nx-modal-backdrop";
      backdrop.innerHTML = `<div id="nexoraModalBox" class="nx-modal"></div>`;
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) closeModal();
      });
      document.body.appendChild(backdrop);
    }

    document.getElementById("nxBtnAuth").onclick = () => {
      if (state.session) {
        handleLogout();
      } else {
        openAuthModal("login");
      }
    };
    document.getElementById("nxBtnPlans").onclick = openPlansModal;
    document.getElementById("nxBtnLedger").onclick = openLedgerModal;
    document.getElementById("nxBtnAdmin").onclick = openAdminModal;
  }

  function closeModal() {
    const backdrop = document.getElementById("nexoraModalBackdrop");
    if (backdrop) backdrop.classList.remove("open");
  }

  function openModal(html) {
    ensureUi();
    const backdrop = document.getElementById("nexoraModalBackdrop");
    const box = document.getElementById("nexoraModalBox");
    box.innerHTML = html;
    backdrop.classList.add("open");
  }

  function renderTopBar() {
    ensureUi();
    const creditsPill = document.getElementById("nxCreditsPill");
    const planPill = document.getElementById("nxPlanPill");
    const userEmailEl = document.getElementById("nxUserEmail");
    const authBtn = document.getElementById("nxBtnAuth");
    const adminBtn = document.getElementById("nxBtnAdmin");

    if (state.session && state.user) {
      const c = Number.isFinite(state.credits) ? state.credits : 0;
      creditsPill.textContent = `Créditos: ${c}`;
      planPill.textContent = state.planName || "Ativo";
      userEmailEl.textContent = state.user.email || "";
      authBtn.textContent = "Sair";
      authBtn.className = "nx-btn";
      adminBtn.style.display = state.isAdmin ? "inline-block" : "none";
    } else {
      creditsPill.textContent = "Créditos: --";
      planPill.textContent = "Faça login";
      userEmailEl.textContent = "";
      authBtn.textContent = "Entrar / Cadastrar";
      authBtn.className = "nx-btn nx-btn-primary";
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
    let url = cfg?.supabaseUrl || "";
    let anonKey = cfg?.supabaseAnonKey || "";

    if (!url || !anonKey) {
      const metaUrl = document.querySelector('meta[name="supabase-url"]')?.content || "";
      const metaKey = document.querySelector('meta[name="supabase-anon-key"]')?.content || "";
      url = url || metaUrl;
      anonKey = anonKey || metaKey;
    }

    if (!url || !anonKey) return null;
    state.sb = window.supabase.createClient(url, anonKey);
    return state.sb;
  }

  async function refreshProfileFromServer() {
    if (!state.session?.access_token) return null;
    const res = await fetch("/api/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${state.session.access_token}`,
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) {
        state.session = null;
        state.user = null;
        state.credits = null;
        renderTopBar();
      }
      return null;
    }

    state.user = data.user || null;
    state.credits = Number(data.user?.credits ?? 0);
    state.planName = data.user?.plan_name || "Ativo";
    state.isAdmin = Boolean(data.user?.is_admin);
    state.ledger = Array.isArray(data.ledger) ? data.ledger : [];
    state.adminUsers = Array.isArray(data.adminUsers) ? data.adminUsers : [];
    if (data.publicConfig) {
      state.publicConfig = data.publicConfig;
    }
    renderTopBar();
    return data;
  }

  function openAuthModal(mode = "login") {
    state.authMode = mode;
    const isRegister = mode === "register";
    openModal(`
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h3>${isRegister ? "Criar Conta no NEXORA.AI" : "Entrar no NEXORA.AI"}</h3>
        <button type="button" class="nx-btn" onclick="window.NexoraSaas.closeModal()">Fechar</button>
      </div>
      <p class="nx-sub">${isRegister ? "Cadastre seu e-mail e senha para começar com seus créditos iniciais." : "Acesse sua conta para ver seus créditos e gerar vídeos e imagens."}</p>
      <div id="nxAuthFeedback"></div>
      ${isRegister ? '<input id="nxFullName" type="text" class="nx-field" placeholder="Seu nome ou loja" />' : ""}
      <input id="nxEmail" type="email" class="nx-field" placeholder="seu@email.com" autocomplete="email" />
      <input id="nxPassword" type="password" class="nx-field" placeholder="Sua senha (mínimo 6 caracteres)" autocomplete="current-password" />
      <div style="display:flex;gap:8px;margin-top:6px;">
        <button id="nxSubmitAuth" type="button" class="nx-btn nx-btn-primary" style="flex:1;padding:10px;">
          ${isRegister ? "Criar Conta" : "Entrar"}
        </button>
        <button type="button" class="nx-btn" onclick="window.NexoraSaas.openAuthModal('${isRegister ? "login" : "register"}')">
          ${isRegister ? "Já tenho conta" : "Criar conta"}
        </button>
      </div>
    `);

    document.getElementById("nxSubmitAuth").onclick = async () => {
      const fb = document.getElementById("nxAuthFeedback");
      const email = (document.getElementById("nxEmail")?.value || "").trim();
      const password = document.getElementById("nxPassword")?.value || "";
      const fullName = (document.getElementById("nxFullName")?.value || "").trim();

      if (!email || !password) {
        fb.innerHTML = `<div class="nx-msg-err">Preencha e-mail e senha.</div>`;
        return;
      }

      fb.innerHTML = `<div class="nx-msg-ok">Conectando...</div>`;
      try {
        const sb = await initSupabaseClient();
        if (!sb) {
          fb.innerHTML = `<div class="nx-msg-err">Configuração de acesso não encontrada. Verifique o painel.</div>`;
          return;
        }

        let authResp;
        if (isRegister) {
          authResp = await sb.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } },
          });
        } else {
          authResp = await sb.auth.signInWithPassword({ email, password });
        }

        if (authResp.error) {
          fb.innerHTML = `<div class="nx-msg-err">${authResp.error.message}</div>`;
          return;
        }

        state.session = authResp.data.session;
        await refreshProfileFromServer();
        closeModal();
      } catch (err) {
        fb.innerHTML = `<div class="nx-msg-err">${err?.message || "Erro ao autenticar."}</div>`;
      }
    };
  }

  async function handleLogout() {
    try {
      if (state.sb) {
        await state.sb.auth.signOut();
      }
    } catch (_) {}
    state.session = null;
    state.user = null;
    state.credits = null;
    state.isAdmin = false;
    state.ledger = [];
    state.adminUsers = [];
    renderTopBar();
  }

  function openPlansModal() {
    openModal(`
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h3>Planos e Recarga de Créditos</h3>
        <button type="button" class="nx-btn" onclick="window.NexoraSaas.closeModal()">Fechar</button>
      </div>
      <p class="nx-sub">Cada imagem ou narração consome 1 crédito; vídeos curtos consomem 2 créditos. Liberação automática após pagamento.</p>
      <div class="nx-list-item">
        <div>
          <strong>Pacote Inicial — 60 Créditos</strong><br/>
          <span style="color:#94a3b8;">Ideal para testar produtos e campanhas rápidas</span>
        </div>
        <strong style="color:#fde68a;">R$ 40,00</strong>
      </div>
      <div class="nx-list-item">
        <div>
          <strong>Plano Criador — 180 Créditos</strong><br/>
          <span style="color:#94a3b8;">Rotina diária de vídeos e fotos comerciais</span>
        </div>
        <strong style="color:#fde68a;">R$ 97,00</strong>
      </div>
      <div class="nx-list-item">
        <div>
          <strong>Plano Escala — 450 Créditos</strong><br/>
          <span style="color:#94a3b8;">Alta produção para lojas e afiliados</span>
        </div>
        <strong style="color:#fde68a;">R$ 197,00</strong>
      </div>
      <p class="nx-sub" style="margin-top:10px;">Precisa liberar créditos agora? Fale com o suporte ou use o Painel Admin se for o administrador.</p>
    `);
  }

  async function openLedgerModal() {
    if (!state.session) {
      openAuthModal("login");
      return;
    }
    await refreshProfileFromServer();
    const rowsHtml = state.ledger.length
      ? state.ledger
          .map((item) => {
            const delta = Number(item.delta || 0);
            const sign = delta > 0 ? `+${delta}` : `${delta}`;
            const color = delta >= 0 ? "#86efac" : "#fca5a5";
            return `
              <div class="nx-list-item">
                <div>
                  <strong>${item.description || item.task || "Movimentação"}</strong><br/>
                  <span style="color:#94a3b8;">Saldo após: ${item.balance_after ?? "--"}</span>
                </div>
                <strong style="color:${color};">${sign}</strong>
              </div>
            `;
          })
          .join("")
      : `<p class="nx-sub">Nenhuma movimentação registrada ainda.</p>`;

    openModal(`
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h3>Extrato de Créditos</h3>
        <button type="button" class="nx-btn" onclick="window.NexoraSaas.closeModal()">Fechar</button>
      </div>
      <p class="nx-sub">Saldo atual: <strong>${state.credits ?? 0}</strong> créditos</p>
      <div class="custom-scroll" style="max-height:55vh;overflow-y:auto;">${rowsHtml}</div>
    `);
  }

  async function openAdminModal() {
    if (!state.session || !state.isAdmin) return;
    await refreshProfileFromServer();

    const optionsHtml = state.adminUsers
      .map(
        (u) =>
          `<option value="${u.id}">${u.email} — Saldo: ${u.credits ?? 0} (${u.plan_name || "Plano"})</option>`
      )
      .join("");

    openModal(`
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h3>Painel do Administrador</h3>
        <button type="button" class="nx-btn" onclick="window.NexoraSaas.closeModal()">Fechar</button>
      </div>
      <p class="nx-sub">Adicione créditos ou atualize o plano de qualquer cliente na hora.</p>
      <div id="nxAdminFeedback"></div>
      <label style="display:block;font-size:12px;margin-bottom:4px;color:#cbd5e1;">Escolha o cliente</label>
      <select id="nxAdminUserSelect" class="nx-field">${optionsHtml}</select>
      <label style="display:block;font-size:12px;margin-bottom:4px;color:#cbd5e1;">Quantidade de créditos (ex: 60 ou -10)</label>
      <input id="nxAdminAmount" type="number" class="nx-field" value="60" />
      <label style="display:block;font-size:12px;margin-bottom:4px;color:#cbd5e1;">Nome do plano (opcional)</label>
      <input id="nxAdminPlan" type="text" class="nx-field" placeholder="Ex: Pacote Inicial" />
      <button id="nxAdminSubmit" type="button" class="nx-btn nx-btn-primary" style="width:100%;padding:10px;">
        Aplicar Créditos Agora
      </button>
    `);

    document.getElementById("nxAdminSubmit").onclick = async () => {
      const fb = document.getElementById("nxAdminFeedback");
      const targetUserId = document.getElementById("nxAdminUserSelect")?.value;
      const amount = parseInt(document.getElementById("nxAdminAmount")?.value || "0", 10);
      const planName = (document.getElementById("nxAdminPlan")?.value || "").trim();

      if (!targetUserId || !amount) {
        fb.innerHTML = `<div class="nx-msg-err">Selecione um cliente e informe a quantidade de créditos.</div>`;
        return;
      }

      fb.innerHTML = `<div class="nx-msg-ok">Atualizando saldo...</div>`;
      const res = await fetch("/api/me", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.session.access_token}`,
        },
        body: JSON.stringify({
          targetUserId,
          amount,
          planName,
          description: "Liberação manual pelo Painel Admin",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        fb.innerHTML = `<div class="nx-msg-err">${data.error || "Erro ao aplicar créditos."}</div>`;
        return;
      }

      await refreshProfileFromServer();
      fb.innerHTML = `<div class="nx-msg-ok">Créditos atualizados com sucesso! Novo saldo do cliente: ${data.newBalance}.</div>`;
    };
  }

  function installFetchInterceptor() {
    if (window.__nexoraFetchWrapped) return;
    window.__nexoraFetchWrapped = true;
    const originalFetch = window.fetch.bind(window);

    window.fetch = async function (input, init = {}) {
      const urlStr = typeof input === "string" ? input : input?.url || "";
      const isApiGenerate = urlStr.includes("/api/generate");
      const isApiMe = urlStr.includes("/api/me");

      if ((isApiGenerate || isApiMe) && state.session?.access_token) {
        const headers = new Headers(init.headers || {});
        if (!headers.has("Authorization")) {
          headers.set("Authorization", `Bearer ${state.session.access_token}`);
        }
        init = { ...init, headers };
      }

      const response = await originalFetch(input, init);

      if (isApiGenerate) {
        const cloned = response.clone();
        cloned
          .json()
          .then((payload) => {
            if (payload && typeof payload.credits === "number") {
              state.credits = payload.credits;
              renderTopBar();
            }
            if (response.status === 401) {
              openAuthModal("login");
            } else if (response.status === 402 || payload?.code === "INSUFFICIENT_CREDITS") {
              openPlansModal();
            }
          })
          .catch(() => {});
      }

      return response;
    };
  }

  async function boot() {
    ensureUi();
    renderTopBar();
    installFetchInterceptor();

    try {
      const sb = await initSupabaseClient();
      if (sb) {
        const { data } = await sb.auth.getSession();
        if (data?.session) {
          state.session = data.session;
          await refreshProfileFromServer();
        }
        sb.auth.onAuthStateChange(async (_event, newSession) => {
          state.session = newSession || null;
          if (state.session) {
            await refreshProfileFromServer();
          } else {
            state.user = null;
            state.credits = null;
            state.isAdmin = false;
            renderTopBar();
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
    getState: () => ({ ...state }),
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
