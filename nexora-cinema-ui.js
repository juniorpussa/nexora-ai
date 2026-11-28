/**
 * ============================================================================
 * NEXORA.AI — PAINEL INTELIGENTE DE 1.218 PROMPTS + TRILHAS HÍBRIDAS + PRÉVIA 9:16
 * ============================================================================
 * Versão 2.0 (Design Nota 10 + Correção Definitiva de Trilhas Híbridas)
 *  - Google Veo 3.1 como padrão seguro (Kling v2.6 Pro destravado disponível).
 *  - Google Lyria 2 Pro como padrão da trilha sonora (nunca gera vídeo mudo!).
 *  - Fallback automático inteligente: se escolher MP3 Pronta e o arquivo ainda não
 *    estiver na pasta tracks/, alterna automaticamente para Google Lyria 2 Pro.
 *  - Botão de upload próprio MP3/WAV (0 créditos) integrado direto no painel.
 *  - Memória anti-repetição (localStorage) para nunca repetir o mesmo vídeo.
 * ============================================================================
 */
(function () {
  if (window.__NEXORA_CINEMA_UI_V15__) return;
  window.__NEXORA_CINEMA_UI_V15__ = true;

  const STORAGE_USED_PROMPTS = "nexora_used_prompt_ids_v15";
  const STORAGE_USED_TRACKS = "nexora_used_track_files_v15";

  const FALLBACK_MODELOS = [
    { id: 1, nome: "1. Gancho de Impacto + Demonstração Extrema", foco: "Retenção imediata e prova visual de resistência", previewVideo: "previews/modelo-01-impacto.mp4", dicaExemplo: "Ritmo de impacto e prova visual — seu vídeo será gerado 100% com o seu produto." },
    { id: 2, nome: "2. Problema vs. Solução Visual", foco: "Dor cotidiana e alívio instantâneo com corte seco", previewVideo: "previews/modelo-02-problema-solucao.mp4", dicaExemplo: "Virada visual problema → solução — seu vídeo será gerado com o seu produto." },
    { id: 3, nome: "3. Unboxing Cinematográfico / Reveal de Luxo", foco: "Iluminação dramática e percepção de alto valor", previewVideo: "previews/modelo-03-unboxing-luxo.mp4", dicaExemplo: "Estilo Reveal de Luxo de alto valor — seu vídeo será gerado com o seu produto." },
    { id: 4, nome: "4. POV (Ponto de Vista) / Primeira Pessoa", foco: "Imersão real segurando ou usando o produto", previewVideo: "previews/modelo-04-pov.mp4", dicaExemplo: "Câmera em primeira pessoa (POV) — seu vídeo será gerado com o seu produto." },
    { id: 5, nome: "5. Antes e Depois / Transformação Rápida", foco: "Prova visual imediata de resultado", previewVideo: "previews/modelo-05-antes-depois.mp4", dicaExemplo: "Transformação visual Antes e Depois — seu vídeo será gerado com o seu produto." },
    { id: 6, nome: "6. Vitrine Dinâmica Multi-Ângulos / Hollywood Cut", foco: "Ritmo acelerado de trailer para compra por impulso", previewVideo: "previews/modelo-06-hollywood-cut.mp4", dicaExemplo: "Ritmo acelerado Hollywood Cut — seu vídeo será gerado 100% com o seu produto." },
    { id: 7, nome: "7. UGC Autêntico / Achadinho Real", foco: "Estética natural de comprador real", previewVideo: "previews/modelo-07-ugc-achadinho.mp4", dicaExemplo: "Estilo natural Achadinho Real TikTok Shop — seu vídeo será gerado com o seu produto." },
    { id: 8, nome: "8. ASMR Sensorial / Textura e Detalhe Macro", foco: "Super closes macro hipnóticos em loop", previewVideo: "previews/modelo-08-asmr-macro.mp4", dicaExemplo: "Super closes macro sensoriais — seu vídeo será gerado com o seu produto." },
    { id: 9, nome: "9. Comparativo Direto / O Comum vs. O Nosso", foco: "Superioridade técnica sobre genéricos", previewVideo: "previews/modelo-09-comparativo.mp4", dicaExemplo: "Comparativo de superioridade visual — seu vídeo será gerado com o seu produto." },
    { id: 10, nome: "10. Estilo de Vida / Aspiracional em Movimento", foco: "Status, ambiente de alto padrão e desejo", previewVideo: "previews/modelo-10-lifestyle.mp4", dicaExemplo: "Estilo aspiracional em movimento — seu vídeo será gerado com o seu produto." }
  ];

  const FALLBACK_TRILHAS = [
    { id: "impacto_industrial", nome: "Impacto Industrial & Sub-Bass", descricao: "Drop grave pesado + percussão metálica de trailer", arquivoPreviewMp3: "tracks/impacto-industrial-01.mp3" },
    { id: "hollywood_phonk", nome: "Hollywood Cut & Phonk / Trap Eletrônico", descricao: "Batida acelerada com 808 pulsante e risers", arquivoPreviewMp3: "tracks/hollywood-phonk-01.mp3" },
    { id: "scifi_cyberpunk", nome: "Sci-Fi & Cyberpunk Synth", descricao: "Sintetizadores futuristas largos e pulso grave", arquivoPreviewMp3: "tracks/scifi-cyberpunk-01.mp3" },
    { id: "luxo_asmr", nome: "Luxo Minimalista & ASMR Dark", descricao: "Pads profundos e pulso grave sofisticado", arquivoPreviewMp3: "tracks/luxo-asmr-01.mp3" },
    { id: "lounge_executivo", nome: "Lounge Executivo & Lo-Fi Aspiracional", descricao: "Batida lounge elegante com grave macio", arquivoPreviewMp3: "tracks/lounge-executivo-01.mp3" },
    { id: "epico_cinematografico", nome: "Épico Cinematográfico de Cinema", descricao: "Percussão imponente de superprodução", arquivoPreviewMp3: "tracks/epico-cinematografico-01.mp3" },
    { id: "virada_dinamica", nome: "Virada Dinâmica (Dor → Alívio)", descricao: "Corte seco com sub-bass abrindo batida moderna", arquivoPreviewMp3: "tracks/virada-dinamica-01.mp3" }
  ];

  const state = {
    modelos: FALLBACK_MODELOS,
    trilhas: FALLBACK_TRILHAS,
    totalPrompts: 1218,
    modoModelo: "melhor_opcao",
    modeloManualId: "6",
    modoTrilha: "melhor_opcao",
    trilhaManualId: "hollywood_phonk",
    fonteTrilha: "lyria2", // Padrão seguro: Google Lyria 2 Pro (sempre funciona!)
    ultimaSelecao: null,
    previewAudioEl: null
  };

  window.__NEXORA_CINEMA_STATE__ = state;

  function getUsedList(key) {
    try {
      const raw = localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function pushUsedItem(key, value) {
    if (!value) return;
    try {
      const arr = getUsedList(key);
      if (!arr.includes(value)) arr.push(value);
      localStorage.setItem(key, JSON.stringify(arr.slice(-250)));
    } catch {}
  }

  function getProductInfoFromDOM() {
    const nome =
      (document.getElementById("inlineProductName")?.value || "").trim() ||
      (document.getElementById("productDetailHint")?.value || "").trim().split(",")[0] ||
      "";
    const detalhes = (document.getElementById("productDetailHint")?.value || "").trim();
    const macro = (document.getElementById("macroTarget")?.value || "").trim();
    return { nome, detalhes, macro };
  }

  function getActiveModeloPreferido() {
    return state.modoModelo === "manual" ? Number(state.modeloManualId) : "melhor_opcao";
  }

  function getActiveTrilhaPreferida() {
    return state.modoTrilha === "manual" ? state.trilhaManualId : "melhor_opcao";
  }

  function syncLegacyMusicEngine() {
    const legEng = document.getElementById("nexoraMusicEngine2000");
    if (!legEng) return;
    if (state.fonteTrilha === "instant") legEng.value = "tracks";
    else if (state.fonteTrilha === "fast") legEng.value = "fast";
    else legEng.value = "lyria2";
  }

  function notifySummaryUpdate() {
    if (typeof window.__NEXORA_REFRESH_SUMMARY__ === "function") {
      try { window.__NEXORA_REFRESH_SUMMARY__(); } catch {}
    }
  }

  function injectStyles() {
    if (document.getElementById("nxCinemaUiStyles")) return;
    const style = document.createElement("style");
    style.id = "nxCinemaUiStyles";
    style.textContent = `
      .nx-smart-card {
        background: #0c1322;
        border: 1px solid rgba(148, 163, 184, 0.16);
        border-radius: 18px;
        padding: 20px;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.32);
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .nx-smart-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.12);
      }
      .nx-smart-title {
        font-family: "Plus Jakarta Sans", "Inter", sans-serif;
        font-size: 15px;
        font-weight: 800;
        color: #f8fafc;
        display: flex;
        align-items: center;
        gap: 9px;
      }
      .nx-step-badge {
        width: 26px;
        height: 26px;
        border-radius: 8px;
        background: rgba(34, 197, 94, 0.15);
        border: 1px solid rgba(34, 197, 94, 0.45);
        color: #4ade80;
        font-size: 11.5px;
        font-weight: 900;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .nx-pill-veo {
        font-size: 10.5px;
        font-weight: 800;
        padding: 3px 10px;
        border-radius: 999px;
        background: rgba(34, 197, 94, 0.14);
        border: 1px solid rgba(34, 197, 94, 0.42);
        color: #86efac;
      }
      .nx-two-col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }
      .nx-choice-box {
        background: #0f172a;
        border: 1px solid rgba(148, 163, 184, 0.14);
        border-radius: 14px;
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .nx-choice-box label.nx-lbl {
        font-size: 11px;
        font-weight: 800;
        color: #cbd5e1;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin: 0;
      }
      .nx-mode-pair {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .nx-mode-opt {
        background: #141f35;
        border: 1.5px solid rgba(148, 163, 184, 0.2);
        color: #cbd5e1;
        border-radius: 10px;
        padding: 10px;
        min-height: 42px;
        font-size: 12.5px;
        font-weight: 800;
        cursor: pointer;
        text-align: center;
        transition: all 0.16s ease;
      }
      .nx-mode-opt:hover {
        border-color: rgba(148, 163, 184, 0.45);
        color: #fff;
      }
      .nx-mode-opt.active {
        background: rgba(34, 197, 94, 0.15);
        border-color: #22c55e;
        color: #86efac;
        box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.18);
      }
      .nx-sub-hint {
        font-size: 11.5px;
        color: #94a3b8;
        line-height: 1.45;
      }
      .nx-audio-bar {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }
      .nx-btn-sm {
        background: #162238;
        border: 1px solid rgba(148, 163, 184, 0.24);
        color: #e2e8f0;
        border-radius: 9px;
        padding: 8px 12px;
        min-height: 36px;
        font-size: 11.5px;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        transition: all 0.15s ease;
      }
      .nx-btn-sm:hover { border-color: #22c55e; color: #fff; background: #1a2a44; }
      .nx-btn-sm.nx-upload-ok {
        border-color: rgba(34, 197, 94, 0.55);
        background: rgba(34, 197, 94, 0.14);
        color: #86efac;
      }
      .nx-preview-box {
        background: #080e1a;
        border: 1px solid rgba(148, 163, 184, 0.15);
        border-radius: 14px;
        padding: 14px;
        display: grid;
        grid-template-columns: 122px 1fr;
        gap: 14px;
        align-items: center;
      }
      .nx-preview-video-wrap {
        width: 122px;
        aspect-ratio: 9 / 16;
        border-radius: 12px;
        overflow: hidden;
        background: radial-gradient(circle at 50% 25%, #15233d, #070b13);
        border: 1px solid rgba(148, 163, 184, 0.22);
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .nx-preview-video-wrap video {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .nx-preview-fallback {
        padding: 10px;
        text-align: center;
        font-size: 10.5px;
        color: #94a3b8;
        line-height: 1.35;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
      }
      .nx-preview-info {
        display: flex;
        flex-direction: column;
        gap: 7px;
        min-width: 0;
      }
      .nx-preview-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        width: fit-content;
        font-size: 10px;
        font-weight: 800;
        color: #86efac;
        background: rgba(34, 197, 94, 0.12);
        border: 1px solid rgba(34, 197, 94, 0.35);
        padding: 3px 9px;
        border-radius: 999px;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      .nx-preview-title {
        font-size: 13.5px;
        font-weight: 800;
        color: #f8fafc;
      }
      .nx-preview-meta {
        font-size: 12px;
        color: #cbd5e1;
        line-height: 1.45;
      }
      .nx-preview-meta strong { color: #86efac; }
      @media (max-width: 720px) {
        .nx-smart-card { padding: 15px; }
        .nx-two-col, .nx-preview-box { grid-template-columns: 1fr; }
        .nx-preview-video-wrap { margin: 0 auto; width: 144px; }
      }
    `;
    document.head.appendChild(style);
  }

  function forceVeoDefault() {
    const ve = document.getElementById("videoEngine");
    if (!ve) return;
    const veoOpt = Array.from(ve.options).find((o) => o.value === "veo");
    if (veoOpt) {
      veoOpt.textContent = "⭐ Google Veo 3.1 Cinema (Padrão)";
      ve.value = "veo";
    }
  }

  function buildPanelHTML() {
    return `
      <section class="nx-smart-card" id="nxSmartPromptPanel">
        <div class="nx-smart-head">
          <div class="nx-smart-title">
            <span class="nx-step-badge">02</span>
            <span>Estilo do Vídeo &amp; Trilha Sonora</span>
            <span class="nx-pill-veo">Anti-Repetição Ativo</span>
          </div>
          <span style="font-size:11.5px;color:#94a3b8;font-weight:600;">1.218 variações exclusivas • Escolha automática ou manual</span>
        </div>

        <div class="nx-two-col">
          <!-- MODELO DE VÍDEO -->
          <div class="nx-choice-box">
            <label class="nx-lbl">🎬 Estilo de Comercial (10 Modelos)</label>
            <div class="nx-mode-pair">
              <button type="button" class="nx-mode-opt active" id="nxBtnModeloAuto">⭐ Melhor Opção</button>
              <button type="button" class="nx-mode-opt" id="nxBtnModeloManual">🎯 Escolher Manual</button>
            </div>
            <select id="nxSelectModeloManual" style="display:none;"></select>
            <div class="nx-sub-hint" id="nxModeloHint"><strong>Automático ativo:</strong> a IA escolhe o melhor modelo de conversão para o seu produto sem repetir vídeos.</div>
          </div>

          <!-- TRILHA SONORA UNIFICADA -->
          <div class="nx-choice-box">
            <label class="nx-lbl">🎵 Trilha Sonora (7 Estilos de Agência)</label>
            <div class="nx-mode-pair">
              <button type="button" class="nx-mode-opt active" id="nxBtnTrilhaAuto">⭐ Melhor Opção</button>
              <button type="button" class="nx-mode-opt" id="nxBtnTrilhaManual">🎧 Escolher Estilo</button>
            </div>
            <select id="nxSelectTrilhaManual" style="display:none;"></select>
            <div class="nx-audio-bar">
              <select id="nxSelectFonteTrilha" style="flex:1;min-height:36px;padding:6px 10px;font-size:11.5px;">
                <option value="lyria2" selected>🏆 Trilha Exclusiva IA (Google Lyria 2 • Padrão)</option>
                <option value="fast">⚡ Trilha IA Rápida (Stable Audio • ~12s)</option>
                <option value="instant">💿 Biblioteca MP3 Pronta (0 cr • Fallback Lyria 2)</option>
                <option value="mute">🔇 Sem Música (Somente Voz / Efeitos)</option>
              </select>
            </div>
            <div class="nx-audio-bar">
              <button type="button" class="nx-btn-sm" id="nxBtnOuvirTrilha">🔊 Ouvir Trilha</button>
              <button type="button" class="nx-btn-sm" id="nxBtnUploadMp3Unified">📁 Subir Meu MP3 (0 cr)</button>
              <button type="button" class="nx-btn-sm" id="nxBtnClearMp3Unified" style="display:none;color:#fca5a5;">✕ Remover MP3</button>
            </div>
            <div class="nx-sub-hint" id="nxTrilhaHint">Volume ajustado automaticamente atrás da voz para o locutor ficar cristalino.</div>
          </div>
        </div>

        <!-- PRÉVIA ANTES DA GERAÇÃO (0 CRÉDITOS) -->
        <div class="nx-preview-box" id="nxExamplePreviewBox">
          <div class="nx-preview-video-wrap" id="nxPreviewVideoWrap">
            <video id="nxExampleVideo" muted loop playsinline autoplay></video>
            <div class="nx-preview-fallback" id="nxExampleFallback" style="display:none;">
              <span style="font-size:22px;">🎬</span>
              <strong style="color:#f8fafc;font-size:11px;">Prévia 9:16</strong>
              <span id="nxFallbackText">Estilo pronto para gerar com o seu produto.</span>
            </div>
          </div>
          <div class="nx-preview-info">
            <span class="nx-preview-badge">👁️ Sugestão Inteligente • 0 Créditos</span>
            <div class="nx-preview-title" id="nxPrevModelTitle">Preparando sugestão ideal...</div>
            <div class="nx-preview-meta" id="nxPrevModelDesc">Envie a foto e escreva o nome do produto para a IA escolher o melhor modelo, cenário e trilha.</div>
            <div class="nx-preview-meta" id="nxPrevTrackInfo"></div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:2px;">
              <button type="button" class="nx-btn-sm" id="nxBtnRefreshPreview">🔄 Sortear outra variação</button>
              <button type="button" class="nx-btn-sm" id="nxBtnMuteExample" style="display:none;">🔇 Ativar Som</button>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function populateSelects() {
    const selM = document.getElementById("nxSelectModeloManual");
    const selT = document.getElementById("nxSelectTrilhaManual");
    if (selM) {
      selM.innerHTML = state.modelos
        .map((m) => `<option value="${m.id}">${m.nome}</option>`)
        .join("");
      selM.value = state.modeloManualId;
    }
    if (selT) {
      selT.innerHTML = state.trilhas
        .map((t) => `<option value="${t.id}">${t.nome}</option>`)
        .join("");
      selT.value = state.trilhaManualId;
    }
  }

  function updatePreviewUI(selecao) {
    if (!selecao) return;
    state.ultimaSelecao = selecao;

    const titleEl = document.getElementById("nxPrevModelTitle");
    const descEl = document.getElementById("nxPrevModelDesc");
    const trackEl = document.getElementById("nxPrevTrackInfo");
    const vidEl = document.getElementById("nxExampleVideo");
    const fbEl = document.getElementById("nxExampleFallback");
    const fbTxt = document.getElementById("nxFallbackText");
    const muteBtn = document.getElementById("nxBtnMuteExample");

    if (titleEl) titleEl.textContent = `${selecao.modeloNome} • ${selecao.estiloVisual}`;
    if (descEl) {
      descEl.innerHTML =
        `${selecao.dicaExemplo || "Estilo selecionado automaticamente — seu vídeo será gerado 100% com o seu produto."}<br/>` +
        `Categoria: <strong>${selecao.categoriaDetectada}</strong> • Código único: <strong>${selecao.idPromptUsado}</strong>`;
    }
    if (trackEl && selecao.trilhaRecomendada) {
      const fonteLbl =
        state.fonteTrilha === "mute"
          ? "Sem música"
          : state.fonteTrilha === "instant"
            ? "MP3 Pronta (ou Lyria 2 automático)"
            : state.fonteTrilha === "fast"
              ? "IA Rápida (~12s)"
              : "Google Lyria 2 Pro";
      trackEl.innerHTML = `🎵 Trilha recomendada: <strong>${selecao.trilhaRecomendada.trilhaNome}</strong> (${fonteLbl})`;
    }

    if (vidEl && selecao.previewVideo) {
      const srcPath = `./${selecao.previewVideo.replace(/^\/+/, "")}`;
      if (vidEl.getAttribute("data-src") !== srcPath) {
        vidEl.setAttribute("data-src", srcPath);
        vidEl.style.display = "block";
        if (fbEl) fbEl.style.display = "none";
        vidEl.onloadeddata = () => {
          if (muteBtn) muteBtn.style.display = "inline-flex";
        };
        vidEl.onerror = () => {
          vidEl.style.display = "none";
          if (muteBtn) muteBtn.style.display = "none";
          if (fbEl) fbEl.style.display = "flex";
          if (fbTxt) fbTxt.textContent = "Modelo pronto! Seu vídeo sairá em 9:16 com o seu produto.";
        };
        vidEl.src = srcPath;
        vidEl.load();
        vidEl.play().catch(() => {});
      }
    }
    notifySummaryUpdate();
  }

  let previewDebounce = null;
  async function refreshSmartSelection(immediate = false) {
    if (!immediate) {
      clearTimeout(previewDebounce);
      previewDebounce = setTimeout(() => refreshSmartSelection(true), 320);
      return;
    }
    const prod = getProductInfoFromDOM();
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "select_prompt",
          nomeProduto: prod.nome || "produto comercial premium",
          detalhesProduto: prod.detalhes,
          detalheMacro: prod.macro,
          modeloPreferido: getActiveModeloPreferido(),
          trilhaPreferida: getActiveTrilhaPreferida(),
          idsJaUsados: getUsedList(STORAGE_USED_PROMPTS),
          arquivosTrilhaJaUsados: getUsedList(STORAGE_USED_TRACKS),
          duracaoSegundos: Number(document.getElementById("minDuration")?.value || 10) >= 20 ? 8 : 6
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.selecao) {
          updatePreviewUI(data.selecao);
          return;
        }
      }
    } catch {}
  }

  function bindPanelEvents() {
    const btnMAuto = document.getElementById("nxBtnModeloAuto");
    const btnMMan = document.getElementById("nxBtnModeloManual");
    const selM = document.getElementById("nxSelectModeloManual");
    const hintM = document.getElementById("nxModeloHint");

    const btnTAuto = document.getElementById("nxBtnTrilhaAuto");
    const btnTMan = document.getElementById("nxBtnTrilhaManual");
    const selT = document.getElementById("nxSelectTrilhaManual");
    const selFonte = document.getElementById("nxSelectFonteTrilha");
    const hintT = document.getElementById("nxTrilhaHint");
    const btnOuvir = document.getElementById("nxBtnOuvirTrilha");
    const btnUpMp3 = document.getElementById("nxBtnUploadMp3Unified");
    const btnClrMp3 = document.getElementById("nxBtnClearMp3Unified");
    const btnRef = document.getElementById("nxBtnRefreshPreview");
    const btnMuteEx = document.getElementById("nxBtnMuteExample");
    const legacyMp3Inp = document.getElementById("customAudioFile");
    const legacyMusicSel = document.getElementById("musicPreset");

    btnMAuto?.addEventListener("click", () => {
      state.modoModelo = "melhor_opcao";
      btnMAuto.classList.add("active");
      btnMMan?.classList.remove("active");
      if (selM) selM.style.display = "none";
      if (hintM) hintM.innerHTML = "<strong>Automático ativo:</strong> a IA escolhe o melhor modelo de conversão para o seu produto sem repetir vídeos.";
      refreshSmartSelection(true);
    });

    btnMMan?.addEventListener("click", () => {
      state.modoModelo = "manual";
      btnMMan.classList.add("active");
      btnMAuto?.classList.remove("active");
      if (selM) selM.style.display = "block";
      if (hintM) hintM.textContent = "Escolha manual ativa: o comercial seguirá exatamente o modelo selecionado acima.";
      refreshSmartSelection(true);
    });

    selM?.addEventListener("change", () => {
      state.modeloManualId = selM.value;
      refreshSmartSelection(true);
    });

    btnTAuto?.addEventListener("click", () => {
      state.modoTrilha = "melhor_opcao";
      btnTAuto.classList.add("active");
      btnTMan?.classList.remove("active");
      if (selT) selT.style.display = "none";
      if (hintT) hintT.textContent = "Volume ajustado automaticamente atrás da voz para o locutor ficar cristalino.";
      refreshSmartSelection(true);
    });

    btnTMan?.addEventListener("click", () => {
      state.modoTrilha = "manual";
      btnTMan.classList.add("active");
      btnTAuto?.classList.remove("active");
      if (selT) selT.style.display = "block";
      if (hintT) hintT.textContent = "Estilo manual ativo: o vídeo usará a trilha selecionada acima.";
      refreshSmartSelection(true);
    });

    selT?.addEventListener("change", () => {
      state.trilhaManualId = selT.value;
      refreshSmartSelection(true);
    });

    selFonte?.addEventListener("change", () => {
      state.fonteTrilha = selFonte.value;
      syncLegacyMusicEngine();
      if (legacyMusicSel) {
        if (state.fonteTrilha === "mute") legacyMusicSel.value = "mute";
        else if (legacyMusicSel.value === "mute") legacyMusicSel.value = "hollywood_luxury";
      }
      if (state.ultimaSelecao) updatePreviewUI(state.ultimaSelecao);
      notifySummaryUpdate();
    });

    btnUpMp3?.addEventListener("click", () => {
      legacyMp3Inp?.click();
    });

    legacyMp3Inp?.addEventListener("change", () => {
      const f = legacyMp3Inp.files && legacyMp3Inp.files[0];
      if (f) {
        if (btnUpMp3) {
          btnUpMp3.textContent = `✓ MP3: ${f.name.slice(0, 18)}`;
          btnUpMp3.classList.add("nx-upload-ok");
        }
        if (btnClrMp3) btnClrMp3.style.display = "inline-flex";
        if (hintT) hintT.textContent = `✅ Sua trilha própria "${f.name}" está ativa (0 créditos)!`;
      }
      notifySummaryUpdate();
    });

    btnClrMp3?.addEventListener("click", () => {
      if (legacyMp3Inp) {
        legacyMp3Inp.value = "";
        legacyMp3Inp.dispatchEvent(new Event("change", { bubbles: true }));
      }
      if (legacyMusicSel && legacyMusicSel.value === "custom") {
        legacyMusicSel.value = state.fonteTrilha === "mute" ? "mute" : "hollywood_luxury";
      }
      if (btnUpMp3) {
        btnUpMp3.textContent = "📁 Subir Meu MP3 (0 cr)";
        btnUpMp3.classList.remove("nx-upload-ok");
      }
      if (btnClrMp3) btnClrMp3.style.display = "none";
      if (hintT) hintT.textContent = "Volume ajustado automaticamente atrás da voz para o locutor ficar cristalino.";
      notifySummaryUpdate();
    });

    btnOuvir?.addEventListener("click", async () => {
      if (state.previewAudioEl && !state.previewAudioEl.paused) {
        state.previewAudioEl.pause();
        btnOuvir.textContent = "🔊 Ouvir Trilha";
        return;
      }
      // 1) Se o usuário subiu MP3 próprio, toca na hora!
      const customFile = legacyMp3Inp?.files && legacyMp3Inp.files[0];
      if (customFile && legacyMusicSel?.value === "custom") {
        const u = URL.createObjectURL(customFile);
        if (state.previewAudioEl) { try { state.previewAudioEl.pause(); } catch {} }
        const audio = new Audio(u);
        state.previewAudioEl = audio;
        btnOuvir.textContent = "⏹️ Parar";
        audio.onended = () => { btnOuvir.textContent = "🔊 Ouvir Trilha"; };
        audio.play().catch(() => { btnOuvir.textContent = "🔊 Ouvir Trilha"; });
        return;
      }

      // 2) Tenta MP3 local na pasta tracks/ se existir
      const mp3 = state.ultimaSelecao?.trilhaRecomendada?.arquivoMp3 ||
        (state.trilhas.find((t) => t.id === state.trilhaManualId)?.arquivoPreviewMp3);
      if (mp3) {
        try {
          const check = await fetch(`./${mp3.replace(/^\/+/, "")}`);
          const ct = String(check.headers.get("content-type") || "").toLowerCase();
          if (check.ok && !ct.includes("text/html")) {
            const blobUrl = URL.createObjectURL(await check.blob());
            if (state.previewAudioEl) { try { state.previewAudioEl.pause(); } catch {} }
            const audio = new Audio(blobUrl);
            state.previewAudioEl = audio;
            btnOuvir.textContent = "⏹️ Parar";
            audio.onended = () => { btnOuvir.textContent = "🔊 Ouvir Trilha"; };
            audio.play().catch(() => { btnOuvir.textContent = "🔊 Ouvir Trilha"; });
            return;
          }
        } catch {}
      }

      // 3) Se não houver MP3 local na pasta tracks/, dispara o preview real Lyria 2 / Estúdio!
      const legacyPrevBtn = document.getElementById("btnPreviewMusicSuper");
      if (legacyPrevBtn) {
        if (hintT) hintT.textContent = "⏳ Gerando amostra da trilha IA (fica em cache grátis para o vídeo)...";
        syncLegacyMusicEngine();
        legacyPrevBtn.click();
      } else if (hintT) {
        hintT.textContent = "A trilha será gerada automaticamente com o seu vídeo pelo Google Lyria 2 Pro.";
      }
    });

    btnRef?.addEventListener("click", () => {
      if (state.ultimaSelecao?.idPromptUsado) {
        pushUsedItem(STORAGE_USED_PROMPTS, state.ultimaSelecao.idPromptUsado);
      }
      refreshSmartSelection(true);
    });

    btnMuteEx?.addEventListener("click", () => {
      const v = document.getElementById("nxExampleVideo");
      if (!v) return;
      v.muted = !v.muted;
      btnMuteEx.textContent = v.muted ? "🔇 Ativar Som" : "🔊 Silenciar";
    });

    ["inlineProductName", "productDetailHint", "macroTarget"].forEach((id) => {
      document.getElementById(id)?.addEventListener("input", () => refreshSmartSelection(false));
    });
    document.getElementById("minDuration")?.addEventListener("change", () => refreshSmartSelection(false));
  }

  // Intercepta chamadas a /api/generate com proteção total de fallback nas trilhas
  function installFetchBridge() {
    const origFetch = window.fetch.bind(window);
    window.fetch = async function (input, init) {
      const urlStr = typeof input === "string" ? input : (input && input.url) || "";
      if (urlStr.includes("/api/generate") && init && typeof init.body === "string") {
        try {
          const parsed = JSON.parse(init.body);
          const act = String(parsed.action || parsed.task || parsed.mode || "").toLowerCase();

          if (act === "submit_clip" || act === "generate_video" || act === "video" || act === "clip") {
            const prod = getProductInfoFromDOM();
            parsed.usePromptDatabase = true;
            parsed.engine = document.getElementById("videoEngine")?.value || "veo";
            parsed.nomeProduto = parsed.nomeProduto || prod.nome || "premium commercial product";
            parsed.detalhesProduto = parsed.detalhesProduto || prod.detalhes;
            parsed.detalheMacro = parsed.detalheMacro || prod.macro;
            parsed.modeloPreferido = getActiveModeloPreferido();
            parsed.trilhaPreferida = getActiveTrilhaPreferida();
            parsed.idsJaUsados = getUsedList(STORAGE_USED_PROMPTS);
            parsed.arquivosTrilhaJaUsados = getUsedList(STORAGE_USED_TRACKS);
            init = { ...init, body: JSON.stringify(parsed) };
          } else if (act === "submit_music" || act === "music") {
            const prod = getProductInfoFromDOM();
            let effectiveMusicMode = state.fonteTrilha === "instant" ? "instant" : "lyria2";

            // Se o usuário escolheu MP3 Pronta (instant), verifica antes se o arquivo realmente existe em ./tracks/!
            if (effectiveMusicMode === "instant" && !parsed.__isMusicPreviewDirect) {
              const candMp3 = state.ultimaSelecao?.trilhaRecomendada?.arquivoMp3 ||
                (state.trilhas.find((t) => t.id === state.trilhaManualId)?.arquivoPreviewMp3) || "";
              let mp3OkUrl = "";
              if (candMp3) {
                try {
                  const testRes = await origFetch(`./${candMp3.replace(/^\/+/, "")}`);
                  const ct = String(testRes.headers.get("content-type") || "").toLowerCase();
                  if (testRes.ok && !ct.includes("text/html")) {
                    mp3OkUrl = URL.createObjectURL(await testRes.blob());
                  }
                } catch {}
              }
              if (mp3OkUrl) {
                pushUsedItem(STORAGE_USED_TRACKS, candMp3);
                return new Response(JSON.stringify({
                  status: "COMPLETED",
                  engine: "Biblioteca MP3 Pronta (0 créditos)",
                  audioUrl: mp3OkUrl,
                  audio_url: mp3OkUrl,
                  url: mp3OkUrl,
                  charged: 0
                }), { status: 200, headers: { "Content-Type": "application/json" } });
              }
              // Pasta tracks/ ainda não enviada -> cai automaticamente para Google Lyria 2 Pro sem nunca deixar o vídeo mudo!
              effectiveMusicMode = "lyria2";
            }

            parsed.useMusicDatabase = true;
            parsed.musicMode = effectiveMusicMode;
            if (state.fonteTrilha === "fast" && parsed.engineIndex === 0) {
              parsed.engineIndex = 1; // Stable Audio rápido (~12s)
            }
            parsed.nomeProduto = parsed.nomeProduto || prod.nome;
            parsed.detalhesProduto = parsed.detalhesProduto || prod.detalhes;
            parsed.modeloPreferido = getActiveModeloPreferido();
            parsed.trilhaPreferida = getActiveTrilhaPreferida();
            parsed.arquivosTrilhaJaUsados = getUsedList(STORAGE_USED_TRACKS);
            init = { ...init, body: JSON.stringify(parsed) };
          }

          const resp = await origFetch(input, init);
          if (resp.ok && (act === "submit_clip" || act === "submit_music")) {
            resp.clone().json().then((data) => {
              if (data?.promptMeta?.idPromptUsado) {
                pushUsedItem(STORAGE_USED_PROMPTS, data.promptMeta.idPromptUsado);
              }
              if (data?.trilhaMeta?.arquivoMp3) {
                pushUsedItem(STORAGE_USED_TRACKS, data.trilhaMeta.arquivoMp3);
              }
            }).catch(() => {});
          }
          return resp;
        } catch {}
      }
      return origFetch(input, init);
    };
  }

  async function init() {
    injectStyles();
    forceVeoDefault();
    installFetchBridge();

    const vidSection = document.getElementById("vidCatalogSection");
    if (vidSection && !document.getElementById("nxSmartPromptPanel")) {
      vidSection.insertAdjacentHTML("afterbegin", buildPanelHTML());
      populateSelects();
      bindPanelEvents();
      syncLegacyMusicEngine();
    }

    try {
      const res = await fetch("/api/generate?action=get_options");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.modelos) && data.modelos.length) state.modelos = data.modelos;
        if (Array.isArray(data.trilhas) && data.trilhas.length) state.trilhas = data.trilhas;
        if (data.totalPrompts) state.totalPrompts = data.totalPrompts;
        populateSelects();
      }
    } catch {}

    refreshSmartSelection(true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
