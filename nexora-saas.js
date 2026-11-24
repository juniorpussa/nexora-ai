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
        --nx-glass: rgba(12, 17, 29, 0.78);
        --nx-glass-strong: rgba(15, 22, 38, 0.92);
        --nx-border: rgba(148, 163, 184, 0.14);
        --nx-border-glow: rgba(56, 189, 248, 0.35);
        --nx-gold: #fbbf24;
        --nx-gold-soft: rgba(251, 191, 36, 0.12);
        --nx-cyan: #38bdf8;
        --nx-text-main: #f8fafc;
        --nx-text-muted: #94a3b8;
      }

      /* Atmosfera de fundo sofisticada com iluminação ambiental sutil (Mesh Gradient) */
      body {
        background-color: var(--nx-bg-obsidian) !important;
        background-image:
          radial-gradient(ellipse 80% 50% at 15% -10%, rgba(14, 165, 233, 0.13), transparent 60%),
          radial-gradient(ellipse 65% 45% at 88% -5%, rgba(245, 158, 11, 0.08), transparent 55%),
          radial-gradient(ellipse 70% 50% at 50% 105%, rgba(37, 99, 235, 0.09), transparent 65%) !important;
        background-attachment: fixed !important;
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif !important;
        color: var(--nx-text-main) !important;
        -webkit-font-smoothing: antialiased;
        letter-spacing: -0.01em;
      }

      /* Refinamento de cartões, painéis e inputs nativos do estúdio */
      section, .card, [class*="panel"], [class*="card"], [class*="box"] {
        border-color: var(--nx-border) !important;
      }

      input, select, textarea {
        font-family: 'Plus Jakarta Sans', sans-serif !important;
        transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
      }

      input:focus, select:focus, textarea:focus {
        border-color: rgba(56, 189, 248, 0.55) !important;
        box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.12) !important;
        outline: none !important;
      }

      /* Barra Executiva SaaS encaixada no topo (zero sobreposição) */
      #nxExecTopBar {
        position: sticky;
        top: 0;
        z-index: 9995;
        width: 100%;
        background: rgba(6, 9, 17, 0.84);
        backdrop-filter: blur(18px) saturate(140%);
        -webkit-backdrop-filter: blur(18px) saturate(140%);
        border-bottom: 1px solid rgba(148, 163, 184, 0.14);
        box-shadow: 0 10px 35px rgba(0, 0, 0, 0.45);
      }

      .nx-exec-inner {
        max-width: 1440px;
        margin: 0 auto;
        padding: 10px 20px;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .nx-exec-left, .nx-exec-right {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
      }

      .nx-status-dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: #10b981;
        box-shadow: 0 0 10px #10b981;
      }

      .nx-plan-tag {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 5px 12px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 600;
        color: #e2e8f0;
        background: rgba(30, 41, 59, 0.55);
        border: 1px solid rgba(148, 163, 184, 0.18);
      }

      .nx-credits-pill {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 6px 14px;
        border-radius: 999px;
        font-size: 12.5px;
        font-weight: 700;
        color: #fde68a;
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(217, 119, 6, 0.08));
        border: 1px solid rgba(251, 191, 36, 0.35);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
      }

      .nx-nav-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 7px 14px;
        border-radius: 10px;
        font-size: 12.5px;
        font-weight: 600;
        color: #e2e8f0;
        background: rgba(15, 23, 42, 0.72);
        border: 1px solid rgba(148, 163, 184, 0.18);
        cursor: pointer;
        transition: all 0.18s ease;
      }

      .nx-nav-btn:hover {
        background: rgba(30, 41, 59, 0.92);
        border-color: rgba(56, 189, 248, 0.45);
        color: #ffffff;
        transform: translateY(-1px);
      }

      .nx-nav-btn-primary {
        background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
        border: 1px solid rgba(125, 211, 252, 0.35);
        color: #ffffff;
        font-weight: 700;
        box-shadow: 0 8px 22px rgba(2, 132, 199, 0.32);
      }

      .nx-nav-btn-primary:hover {
        filter: brightness(1.08);
        border-color: rgba(186, 230, 253, 0.6);
      }

      .nx-nav-btn-gold {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(180, 83, 9, 0.16));
        border: 1px solid rgba(251, 191, 36, 0.45);
        color: #fde68a;
        font-weight: 700;
      }

      .nx-user-chip {
        font-size: 12px;
        color: #94a3b8;
        max-width: 190px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        padding: 0 4px;
      }

      /* Modais Executivos Glassmorphism */
      .nx-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: rgba(3, 5, 10, 0.82);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
      }

      .nx-modal-overlay.open {
        display: flex;
        animation: nxFadeIn 0.18s ease-out;
      }

      @keyframes nxFadeIn {
        from { opacity: 0; transform: scale(0.98); }
        to { opacity: 1; transform: scale(1); }
      }

      .nx-modal-card {
        width: 100%;
        max-width: 520px;
        max-height: 88vh;
        overflow-y: auto;
        background: linear-gradient(180deg, rgba(16, 23, 39, 0.96) 0%, rgba(9, 13, 23, 0.98) 100%);
        border: 1px solid rgba(148, 163, 184, 0.22);
        border-radius: 22px;
        padding: 26px;
        color: #f8fafc;
        box-shadow: 0 32px 80px rgba(0, 0, 0, 0.78), inset 0 1px 0 rgba(255, 255, 255, 0.07);
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
        letter-spacing: -0.02em;
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
        border: 1px solid rgba(148, 163, 184, 0.22);
        background: rgba(5, 8, 15, 0.85);
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
        background: rgba(18, 27, 46, 0.72);
        border: 1px solid rgba(148, 163, 184, 0.16);
        margin-bottom: 10px;
        transition: all 0.18s ease;
      }

      .nx-plan-option:hover {
        border-color: rgba(56, 189, 248, 0.45);
        background: rgba(23, 34, 58, 0.88);
      }

      .nx-plan-option.featured {
        border-color: rgba(251, 191, 36, 0.42);
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(245, 158, 11, 0.08));
      }

      .nx-alert-err {
        padding: 10px 12px;
        border-radius: 10px;
        background: rgba(239, 68, 68, 0.12);
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: #fca5a5;
        font-size: 12.5px;
        margin-bottom: 12px;
      }

      .nx-alert-ok {
        padding: 10px 12px;
        border-radius: 10px;
        background: rgba(16, 185, 129, 0.12);
        border: 1px solid rgba(16, 185, 129, 0.3);
        color: #6ee7b7;
        font-size: 12.5px;
        margin-bottom: 12px;
      }

      @media (max-width: 768px) {
        .nx-exec-inner {
          padding: 10px 14px;
          justify-content: center;
        }
        .nx-user-chip {
          display: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureUi() {
    ensureStyles();

    // Remove eventual dock antigo se existir
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
            <button id="nxExecBtnAdmin" type="button" class="nx-nav-btn" style="display:none;border-color:rgba(251,191,36,0.5);color:#fde68a;">Painel Admin</button>
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
