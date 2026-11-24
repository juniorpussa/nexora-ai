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
    if (document.getElementById("nexoraLuxurySaasStyles")) return;
    const style = document.createElement("style");
    style.id = "nexoraLuxurySaasStyles";
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

      :root {
        --nx-bg-obsidian: #05070c;
        --nx-border: rgba(148, 163, 184, 0.16);
        --nx-gold: #fbbf24;
        --nx-cyan: #38bdf8;
        --nx-text-main: #f8fafc;
        --nx-text-muted: #94a3b8;
      }

      /* Atmosfera Mesh Gradient + Obsidian Dark sofisticada */
      html, body {
        background-color: var(--nx-bg-obsidian) !important;
        background-image:
          radial-gradient(ellipse 85% 50% at 12% -8%, rgba(14, 165, 233, 0.15), transparent 60%),
          radial-gradient(ellipse 65% 45% at 88% -4%, rgba(245, 158, 11, 0.09), transparent 55%),
          radial-gradient(ellipse 75% 50% at 50% 105%, rgba(37, 99, 235, 0.10), transparent 65%) !important;
        background-attachment: fixed !important;
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif !important;
        color: var(--nx-text-main) !important;
        -webkit-font-smoothing: antialiased;
      }

      /* Acabamento Glassmorphism nos painéis do estúdio */
      section, .card, [class*="panel"], [class*="card"], [class*="box"] {
        border-color: var(--nx-border) !important;
        box-shadow: 0 18px 45px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.04) !important;
      }

      input, select, textarea {
        font-family: 'Plus Jakarta Sans', sans-serif !important;
        transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
      }

      input:focus, select:focus, textarea:focus {
        border-color: rgba(56, 189, 248, 0.6) !important;
        box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.14) !important;
        outline: none !important;
      }

      /* Barra Executiva SaaS encaixada no topo (zero sobreposição) */
      #nxExecTopBar {
        position: sticky !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        z-index: 2147483000 !important;
        display: block !important;
        width: 100% !important;
        background: rgba(6, 9, 17, 0.88) !important;
        backdrop-filter: blur(18px) saturate(145%) !important;
        -webkit-backdrop-filter: blur(18px) saturate(145%) !important;
        border-bottom: 1px solid rgba(148, 163, 184, 0.16) !important;
        box-shadow: 0 10px 35px rgba(0, 0, 0, 0.5) !important;
      }

      .nx-exec-inner {
        max-width: 1440px !important;
        margin: 0 auto !important;
        padding: 10px 22px !important;
        display: flex !important;
        flex-wrap: wrap !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 12px !important;
      }

      .nx-exec-left, .nx-exec-right {
        display: flex !important;
        flex-wrap: wrap !important;
        align-items: center !important;
        gap: 10px !important;
      }

      .nx-status-dot {
        width: 8px !important;
        height: 8px !important;
        border-radius: 999px !important;
        background: #10b981 !important;
        box-shadow: 0 0 10px #10b981 !important;
        display: inline-block !important;
      }

      .nx-plan-tag {
        display: inline-flex !important;
        align-items: center !important;
        gap: 8px !important;
        padding: 6px 13px !important;
        border-radius: 999px !important;
        font-size: 12px !important;
        font-weight: 700 !important;
        color: #f1f5f9 !important;
        background: rgba(30, 41, 59, 0.62) !important;
        border: 1px solid rgba(148, 163, 184, 0.2) !important;
      }

      .nx-credits-pill {
        display: inline-flex !important;
        align-items: center !important;
        gap: 7px !important;
        padding: 6px 14px !important;
        border-radius: 999px !important;
        font-size: 12.5px !important;
        font-weight: 800 !important;
        color: #fde68a !important;
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1)) !important;
        border: 1px solid rgba(251, 191, 36, 0.42) !important;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
      }

      .nx-nav-btn {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 6px !important;
        padding: 7px 14px !important;
        border-radius: 10px !important;
        font-size: 12.5px !important;
        font-weight: 700 !important;
        color: #e2e8f0 !important;
        background: rgba(15, 23, 42, 0.8) !important;
        border: 1px solid rgba(148, 163, 184, 0.22) !important;
        cursor: pointer !important;
        transition: all 0.18s ease !important;
      }

      .nx-nav-btn:hover {
        background: rgba(30, 41, 59, 0.96) !important;
        border-color: rgba(56, 189, 248, 0.5) !important;
        color: #ffffff !important;
        transform: translateY(-1px) !important;
      }

      .nx-nav-btn-primary {
        background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%) !important;
        border: 1px solid rgba(125, 211, 252, 0.4) !important;
        color: #ffffff !important;
        box-shadow: 0 8px 22px rgba(2, 132, 199, 0.35) !important;
      }

      .nx-nav-btn-gold {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.24), rgba(180, 83, 9, 0.18)) !important;
        border: 1px solid rgba(251, 191, 36, 0.48) !important;
        color: #fde68a !important;
      }

      .nx-user-chip {
        font-size: 12px !important;
        font-weight: 500 !important;
        color: #94a3b8 !important;
        max-width: 200px !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        padding: 0 4px !important;
      }

      /* Modais Executivos Glassmorphism */
      .nx-modal-overlay {
        position: fixed !important;
        inset: 0 !important;
        z-index: 2147483640 !important;
        display: none;
        align-items: center !important;
        justify-content: center !important;
        padding: 20px !important;
        background: rgba(3, 5, 10, 0.84) !important;
        backdrop-filter: blur(12px) !important;
        -webkit-backdrop-filter: blur(12px) !important;
      }

      .nx-modal-overlay.open {
        display: flex !important;
      }

      .nx-modal-card {
        width: 100%;
        max-width: 520px;
        max-height: 88vh;
        overflow-y: auto;
        background: linear-gradient(180deg, rgba(16, 23, 39, 0.97) 0%, rgba(9, 13, 23, 0.99) 100%);
        border: 1px solid rgba(148, 163, 184, 0.24);
        border-radius: 22px;
        padding: 26px;
        color: #f8fafc;
        box-shadow: 0 32px 80px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.08);
      }

      .nx-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 8px;
      }

      .nx-modal-title {
        margin: 0;
        font-size: 19px;
        font-weight: 800;
        color: #ffffff;
      }

      .nx-modal-subtitle {
        margin: 0 0 18px 0;
        font-size: 13.5px;
        line-height: 1.5;
        color: #94a3b8;
      }

      .nx-input-luxury {
        width: 100%;
        margin-bottom: 12px;
        padding: 12px 14px;
        border-radius: 12px;
        border: 1px solid rgba(148, 163, 184, 0.24);
        background: rgba(5, 8, 15, 0.88);
        color: #f8fafc;
        font-size: 13.5px;
      }

      .nx-plan-option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 15px 16px;
        border-radius: 16px;
        background: rgba(18, 27, 46, 0.76);
        border: 1px solid rgba(148, 163, 184, 0.18);
        margin-bottom: 10px;
      }

      .nx-plan-option.featured {
        border-color: rgba(251, 191, 36, 0.45);
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.88), rgba(245, 158, 11, 0.1));
      }

      .nx-alert-err {
        padding: 10px 12px;
        border-radius: 10px;
        background: rgba(239, 68, 68, 0.14);
        border: 1px solid rgba(239, 68, 68, 0.35);
        color: #fca5a5;
        font-size: 12.5px;
        margin-bottom: 12px;
      }

      .nx-alert-ok {
        padding: 10px 12px;
        border-radius: 10px;
        background: rgba(16, 185, 129, 0.14);
        border: 1px solid rgba(16, 185, 129, 0.35);
        color: #6ee7b7;
        font-size: 12.5px;
        margin-bottom: 12px;
      }

      @media (max-width: 768px) {
        .nx-exec-inner {
          padding: 10px 14px !important;
          justify-content: center !important;
        }
        .nx-user-chip {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureUi() {
    ensureStyles();
    if (!document.body) return;

    const oldDock = document.getElementById("nxProDock");
    if (oldDock) oldDock.remove();

    if (!document.getElementById("nxExecTopBar")) {
      const bar = document.createElement("div");
      bar.id = "nxExecTopBar";
      bar.innerHTML = `
        <div class="nx-exec-inner">
          <div class="nx-exec-left">
            <span class="nx-plan-tag">
              <span class="nx-status-dot"></span>
              <span id="nxExecPlanText">NEXORA.AI Studio</span>
            </span>
            <span id="nxExecCreditsPill" class="nx-credits-pill">✦ Saldo: -- créditos</span>
          </div>
          <div class="nx-exec-right">
            <span id="nxExecUserEmail" class="nx-user-chip"></span>
            <button id="nxExecBtnPlans" type="button" class="nx-nav-btn nx-nav-btn-gold">Planos e Recarga</button>
            <button id="nxExecBtnLedger" type="button" class="nx-nav-btn">Extrato</button>
            <button id="nxExecBtnAdmin" type="button" class="nx-nav-btn" style="display:none;border-color:rgba(251,191,36,0.55);color:#fde68a;">Painel Admin</button>
            <button id="nxExecBtnAuth" type="button" class="nx-nav-btn nx-nav-btn-primary">Entrar / Criar Conta</button>
          </div>
        </div>
      `;
      document.body.insertBefore(bar, document.body.firstChild);
    }

    if (!document.getElementById("nxExecOverlay")) {
      const overlay = document.createElement("div");
      overlay.id = "nxExecOverlay";
      overlay.className = "nx-modal-overlay";
      overlay.innerHTML = `<div id="nxExecModalCard" class="nx-modal-card"></div>`;
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeModal();
      });
      document.body.appendChild(overlay);
    }

    document.getElementById("nxExecBtnAuth").onclick = () => {
      if (state.session) handleLogout();
      else openAuthModal("login");
    };
    document.getElementById("nxExecBtnPlans").onclick = openPlansModal;
    document.getElementById("nxExecBtnLedger").onclick = openLedgerModal;
    document.getElementById("nxExecBtnAdmin").onclick = openAdminModal;
  }

  function closeModal() {
    const overlay = document.getElementById("nxExecOverlay");
    if (overlay) overlay.classList.remove("open");
  }

  function openModal(html) {
    ensureUi();
    const overlay = document.getElementById("nxExecOverlay");
    const card = document.getElementById("nxExecModalCard");
    card.innerHTML = html;
    overlay.classList.add("open");
  }

  function renderTopBar() {
    ensureUi();
    const planText = document.getElementById("nxExecPlanText");
    const creditsPill = document.getElementById("nxExecCreditsPill");
    const emailEl = document.getElementById("nxExecUserEmail");
    const authBtn = document.getElementById("nxExecBtnAuth");
    const adminBtn = document.getElementById("nxExecBtnAdmin");
    if (!planText || !creditsPill || !authBtn || !adminBtn) return;

    if (state.session && state.user) {
      const c = Number.isFinite(state.credits) ? state.credits : 0;
      planText.textContent = state.planName || "Conta Ativa";
      creditsPill.textContent = `✦ ${c} créditos disponíveis`;
      emailEl.textContent = state.user.email || "";
      authBtn.textContent = "Sair";
      authBtn.className = "nx-nav-btn";
      adminBtn.style.display = state.isAdmin ? "inline-flex" : "none";
    } else {
      planText.textContent = "Estúdio Comercial 9:16";
      creditsPill.textContent = "✦ Entre para ver seu saldo";
      emailEl.textContent = "";
      authBtn.textContent = "Entrar / Criar Conta";
      authBtn.className = "nx-nav-btn nx-nav-btn-primary";
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
        renderTopBar();
      }
      return null;
    }
    state.user = data.user || null;
    state.credits = Number(data.user?.credits ?? 0);
    state.planName = data.user?.plan_name || "Conta Ativa";
    state.isAdmin = Boolean(data.user?.is_admin);
    state.ledger = Array.isArray(data.ledger) ? data.ledger : [];
    state.adminUsers = Array.isArray(data.adminUsers) ? data.adminUsers : [];
    if (data.publicConfig) state.publicConfig = data.publicConfig;
    renderTopBar();
    return data;
  }

  function openAuthModal(mode = "login") {
    state.authMode = mode;
    const isRegister = mode === "register";
    openModal(`
      <div class="nx-modal-header">
        <h3 class="nx-modal-title">${isRegister ? "Criar Conta Profissional" : "Acessar NEXORA.AI"}</h3>
        <button type="button" class="nx-nav-btn" onclick="window.NexoraSaas.closeModal()">Fechar</button>
      </div>
      <p class="nx-modal-subtitle">
        ${isRegister
          ? "Crie sua conta agora e receba créditos iniciais para produzir seus primeiros anúncios."
          : "Entre com seu e-mail e senha para carregar seus créditos e criar vídeos e imagens."}
      </p>
      <div id="nxExecAuthFb"></div>
      ${isRegister ? '<input id="nxExecName" type="text" class="nx-input-luxury" placeholder="Seu nome ou nome da loja" />' : ""}
      <input id="nxExecEmail" type="email" class="nx-input-luxury" placeholder="seu@email.com" autocomplete="email" />
      <input id="nxExecPass" type="password" class="nx-input-luxury" placeholder="Sua senha (mínimo 6 caracteres)" autocomplete="current-password" />
      <div style="display:flex;gap:10px;margin-top:6px;">
        <button id="nxExecAuthSubmit" type="button" class="nx-nav-btn nx-nav-btn-primary" style="flex:1;padding:12px;">
          ${isRegister ? "Criar Minha Conta" : "Entrar no Estúdio"}
        </button>
        <button type="button" class="nx-nav-btn" onclick="window.NexoraSaas.openAuthModal('${isRegister ? "login" : "register"}')">
          ${isRegister ? "Já tenho conta" : "Criar conta"}
        </button>
      </div>
    `);

    document.getElementById("nxExecAuthSubmit").onclick = async () => {
      const fb = document.getElementById("nxExecAuthFb");
      const email = (document.getElementById("nxExecEmail")?.value || "").trim();
      const password = document.getElementById("nxExecPass")?.value || "";
      const fullName = (document.getElementById("nxExecName")?.value || "").trim();

      if (!email || !password) {
        fb.innerHTML = `<div class="nx-alert-err">Preencha seu e-mail e sua senha.</div>`;
        return;
      }

      fb.innerHTML = `<div class="nx-alert-ok">Autenticando com segurança...</div>`;
      try {
        const sb = await initSupabaseClient();
        if (!sb) {
          fb.innerHTML = `<div class="nx-alert-err">Servidor de acesso indisponível no momento.</div>`;
          return;
        }
        const authResp = isRegister
          ? await sb.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
          : await sb.auth.signInWithPassword({ email, password });

        if (authResp.error) {
          fb.innerHTML = `<div class="nx-alert-err">${authResp.error.message}</div>`;
          return;
        }
        state.session = authResp.data.session;
        await refreshProfileFromServer();
        closeModal();
      } catch (err) {
        fb.innerHTML = `<div class="nx-alert-err">${err?.message || "Erro ao acessar conta."}</div>`;
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
    renderTopBar();
  }

  function openPlansModal() {
    openModal(`
      <div class="nx-modal-header">
        <h3 class="nx-modal-title">Planos e Recarga de Créditos</h3>
        <button type="button" class="nx-nav-btn" onclick="window.NexoraSaas.closeModal()">Fechar</button>
      </div>
      <p class="nx-modal-subtitle">Escolha o pacote ideal para escalar seus vídeos e fotos de alta conversão.</p>
      <div class="nx-plan-option">
        <div>
          <strong style="font-size:14px;color:#fff;">Pacote Inicial — 60 Créditos</strong><br/>
          <span style="font-size:12px;color:#94a3b8;">Ideal para validar produtos e primeiras campanhas</span>
        </div>
        <strong style="font-size:15px;color:#fde68a;">R$ 40,00</strong>
      </div>
      <div class="nx-plan-option featured">
        <div>
          <strong style="font-size:14px;color:#fff;">Plano Criador Pro — 180 Créditos</strong><br/>
          <span style="font-size:12px;color:#cbd5e1;">Mais escolhido • Rotina diária de vídeos 9:16</span>
        </div>
        <strong style="font-size:15px;color:#fde68a;">R$ 97,00</strong>
      </div>
      <div class="nx-plan-option">
        <div>
          <strong style="font-size:14px;color:#fff;">Plano Escala — 450 Créditos</strong><br/>
          <span style="font-size:12px;color:#94a3b8;">Alta produção para lojas e múltiplas contas</span>
        </div>
        <strong style="font-size:15px;color:#fde68a;">R$ 197,00</strong>
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
            const col = d >= 0 ? "#6ee7b7" : "#fca5a5";
            return `
              <div class="nx-plan-option">
                <div>
                  <strong style="color:#f8fafc;">${item.description || item.task || "Movimentação"}</strong><br/>
                  <span style="font-size:12px;color:#94a3b8;">Saldo após: ${item.balance_after ?? "--"} créditos</span>
                </div>
                <strong style="font-size:14px;color:${col};">${sign}</strong>
              </div>
            `;
          })
          .join("")
      : `<p class="nx-modal-subtitle">Nenhuma movimentação registrada ainda.</p>`;

    openModal(`
      <div class="nx-modal-header">
        <h3 class="nx-modal-title">Extrato de Créditos</h3>
        <button type="button" class="nx-nav-btn" onclick="window.NexoraSaas.closeModal()">Fechar</button>
      </div>
      <p class="nx-modal-subtitle">Saldo atual: <strong style="color:#fde68a;">${state.credits ?? 0} créditos</strong></p>
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
      <div class="nx-modal-header">
        <h3 class="nx-modal-title">Painel Administrativo</h3>
        <button type="button" class="nx-nav-btn" onclick="window.NexoraSaas.closeModal()">Fechar</button>
      </div>
      <p class="nx-modal-subtitle">Adicione ou ajuste créditos de qualquer cliente instantaneamente.</p>
      <div id="nxExecAdminFb"></div>
      <select id="nxExecAdminUser" class="nx-input-luxury">${opts}</select>
      <input id="nxExecAdminAmt" type="number" class="nx-input-luxury" value="60" placeholder="Quantidade de créditos" />
      <input id="nxExecAdminPlan" type="text" class="nx-input-luxury" placeholder="Nome do plano (ex: Plano Criador Pro)" />
      <button id="nxExecAdminSave" type="button" class="nx-nav-btn nx-nav-btn-primary" style="width:100%;padding:12px;">
        Aplicar Créditos Agora
      </button>
    `);

    document.getElementById("nxExecAdminSave").onclick = async () => {
      const fb = document.getElementById("nxExecAdminFb");
      const targetUserId = document.getElementById("nxExecAdminUser")?.value;
      const amount = parseInt(document.getElementById("nxExecAdminAmt")?.value || "0", 10);
      const planName = (document.getElementById("nxExecAdminPlan")?.value || "").trim();

      if (!targetUserId || !amount) {
        fb.innerHTML = `<div class="nx-alert-err">Selecione o cliente e informe a quantidade.</div>`;
        return;
      }

      fb.innerHTML = `<div class="nx-alert-ok">Atualizando saldo...</div>`;
      const res = await fetch("/api/me", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.session.access_token}`,
        },
        body: JSON.stringify({ targetUserId, amount, planName, description: "Liberação pelo Painel Administrativo" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        fb.innerHTML = `<div class="nx-alert-err">${data.error || "Erro ao salvar."}</div>`;
        return;
      }
      await refreshProfileFromServer();
      fb.innerHTML = `<div class="nx-alert-ok">Atualizado com sucesso! Novo saldo: ${data.newBalance} créditos.</div>`;
    };
  }

  function installFetchInterceptor() {
    if (window.__nxExecFetchWrapped) return;
    window.__nxExecFetchWrapped = true;
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
            renderTopBar();
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
        sb.auth.onAuthStateChange(async (_evt, newSess) => {
          state.session = newSess || null;
          if (state.session) await refreshProfileFromServer();
          else {
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
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
