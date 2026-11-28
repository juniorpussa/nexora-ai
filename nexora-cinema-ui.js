/**
 * ============================================================================
 * NEXORA.AI — ETAPA 3: PAINEL INTELIGENTE DE 1.218 PROMPTS + TRILHAS + PRÉVIA 9:16
 * ============================================================================
 * Arquivo separado (plug-and-play) para subir na raiz do repositório,
 * ao lado do index.html e do nexora-saas.js.
 *
 * O que este módulo ativa automaticamente sem alterar o código antigo:
 *  1) Define Google Veo 3.1 como motor padrão de vídeo.
 *  2) Adiciona os 2 campos de Modelo de Vídeo ("Melhor Opção" + Escolha Manual 1..10).
 *  3) Adiciona os 2 campos de Trilha Sonora ("Melhor Opção" + Escolha Manual 7 estilos)
 *     em Modo Híbrido (MP3 Instantâneo 0 créditos + Google Lyria 2 Exclusivo).
 *  4) Exibe o Vídeo Curto de Exemplo 9:16 antes da geração (0 créditos).
 *  5) Mantém memória anti-repetição (localStorage) para nunca repetir o mesmo vídeo.
 * ============================================================================
 */
(function () {
  if (window.__NEXORA_CINEMA_UI_V15__) return;
  window.__NEXORA_CINEMA_UI_V15__ = true;

  const STORAGE_USED_PROMPTS = "nexora_used_prompt_ids_v15";
  const STORAGE_USED_TRACKS = "nexora_used_track_files_v15";

  const FALLBACK_MODELOS = [
    { id: 1, nome: "1. Gancho de Impacto + Demonstração Extrema", foco: "Retenção imediata e prova visual de resistência", previewVideo: "previews/modelo-01-impacto.mp4", dicaExemplo: "Exemplo ilustrativo do ritmo de impacto e resistência — seu vídeo será gerado com o seu produto." },
    { id: 2, nome: "2. Problema vs. Solução Visual", foco: "Dor cotidiana e alívio instantâneo com corte seco", previewVideo: "previews/modelo-02-problema-solucao.mp4", dicaExemplo: "Exemplo ilustrativo da virada problema → solução — seu vídeo será gerado com o seu produto." },
    { id: 3, nome: "3. Unboxing Cinematográfico / Reveal de Luxo", foco: "Iluminação dramática e percepção de alto valor", previewVideo: "previews/modelo-03-unboxing-luxo.mp4", dicaExemplo: "Exemplo ilustrativo do estilo Reveal de Luxo — seu vídeo será gerado com o seu produto." },
    { id: 4, nome: "4. POV (Ponto de Vista) / Primeira Pessoa", foco: "Imersão real segurando ou usando o produto", previewVideo: "previews/modelo-04-pov.mp4", dicaExemplo: "Exemplo ilustrativo da câmera em primeira pessoa (POV) — seu vídeo será gerado com o seu produto." },
    { id: 5, nome: "5. Antes e Depois / Transformação Rápida", foco: "Prova visual imediata de resultado", previewVideo: "previews/modelo-05-antes-depois.mp4", dicaExemplo: "Exemplo ilustrativo da transformação Antes e Depois — seu vídeo será gerado com o seu produto." },
    { id: 6, nome: "6. Vitrine Dinâmica Multi-Ângulos / Hollywood Cut", foco: "Ritmo acelerado de trailer para compra por impulso", previewVideo: "previews/modelo-06-hollywood-cut.mp4", dicaExemplo: "Exemplo ilustrativo do ritmo acelerado Hollywood Cut — seu vídeo será gerado com o seu produto." },
    { id: 7, nome: "7. UGC Autêntico / Achadinho Real", foco: "Estética natural de comprador real", previewVideo: "previews/modelo-07-ugc-achadinho.mp4", dicaExemplo: "Exemplo ilustrativo do estilo UGC Achadinho Real — seu vídeo será gerado com o seu produto." },
    { id: 8, nome: "8. ASMR Sensorial / Textura e Detalhe Macro", foco: "Super closes macro hipnóticos em loop", previewVideo: "previews/modelo-08-asmr-macro.mp4", dicaExemplo: "Exemplo ilustrativo do estilo ASMR Sensorial Macro — seu vídeo será gerado com o seu produto." },
    { id: 9, nome: "9. Comparativo Direto / O Comum vs. O Nosso", foco: "Superioridade técnica sobre genéricos", previewVideo: "previews/modelo-09-comparativo.mp4", dicaExemplo: "Exemplo ilustrativo do Comparativo Direto — seu vídeo será gerado com o seu produto." },
    { id: 10, nome: "10. Estilo de Vida / Aspiracional em Movimento", foco: "Status, ambiente de alto padrão e desejo", previewVideo: "previews/modelo-10-lifestyle.mp4", dicaExemplo: "Exemplo ilustrativo do estilo Aspiracional em Movimento — seu vídeo será gerado com o seu produto." }
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
    modoModelo: "melhor_opcao",     // "melhor_opcao" | "manual"
    modeloManualId: "6",
    modoTrilha: "melhor_opcao",     // "melhor_opcao" | "manual"
    trilhaManualId: "hollywood_phonk",
    fonteTrilha: "instant",         // "instant" (MP3 0 créditos) | "lyria2" (IA exclusiva)
    ultimaSelecao: null,
    previewAudioEl: null
  };

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

  function injectStyles() {
    if (document.getElementById("nxCinemaUiStyles")) return;
    const style = document.createElement("style");
    style.id = "nxCinemaUiStyles";
    style.textContent = `
      .nx-smart-card {
        background: linear-gradient(155deg, rgba(13, 24, 42, 0.96), rgba(9, 16, 28, 0.98));
        border: 1.5px solid rgba(34, 197, 94, 0.45);
        border-radius: 18px;
        padding: 18px;
        box-shadow: 0 14px 36px rgba(0, 0, 0, 0.4);
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .nx-smart-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(34, 197, 94, 0.22);
      }
      .nx-smart-title {
        font-family: "Plus Jakarta Sans", "Inter", sans-serif;
        font-size: 14.5px;
        font-weight: 800;
        color: #ffffff;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .nx-pill-veo {
        font-size: 10.5px;
        font-weight: 800;
        padding: 3px 9px;
        border-radius: 999px;
        background: rgba(34, 197, 94, 0.16);
        border: 1px solid rgba(34, 197, 94, 0.5);
        color: #86efac;
      }
      .nx-two-col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .nx-choice-box {
        background: #0c1424;
        border: 1px solid #223556;
        border-radius: 13px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 9px;
      }
      .nx-choice-box label.nx-lbl {
        font-size: 11px;
        font-weight: 800;
        color: #93c5fd;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin: 0;
      }
      .nx-mode-pair {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 7px;
      }
      .nx-mode-opt {
        background: #131f36;
        border: 1.5px solid #283c60;
        color: #cbd5e1;
        border-radius: 9px;
        padding: 9px 10px;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
        text-align: center;
        transition: 0.15s;
      }
      .nx-mode-opt.active {
        background: rgba(34, 197, 94, 0.16);
        border-color: #22c55e;
        color: #86efac;
        box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.2);
      }
      .nx-sub-hint {
        font-size: 11px;
        color: #94a3b8;
        line-height: 1.4;
      }
      .nx-audio-bar {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }
      .nx-btn-sm {
        background: #172744;
        border: 1px solid #2f4b7c;
        color: #e2e8f0;
        border-radius: 8px;
        padding: 7px 11px;
        font-size: 11.5px;
        font-weight: 700;
        cursor: pointer;
        transition: 0.15s;
      }
      .nx-btn-sm:hover { border-color: #38bdf8; color: #fff; }
      .nx-preview-box {
        background: #070d18;
        border: 1px solid #24385c;
        border-radius: 14px;
        padding: 13px;
        display: grid;
        grid-template-columns: 155px 1fr;
        gap: 14px;
        align-items: center;
      }
      .nx-preview-video-wrap {
        width: 155px;
        aspect-ratio: 9 / 16;
        border-radius: 13px;
        overflow: hidden;
        background: radial-gradient(circle at 50% 25%, #162847, #060a12);
        border: 1.5px solid #2d4672;
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
        padding: 12px;
        text-align: center;
        font-size: 11px;
        color: #93c5fd;
        line-height: 1.4;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
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
        font-size: 10.5px;
        font-weight: 800;
        color: #fde047;
        background: rgba(245, 158, 11, 0.14);
        border: 1px solid rgba(245, 158, 11, 0.45);
        padding: 3px 9px;
        border-radius: 999px;
      }
      .nx-preview-title {
        font-size: 13.5px;
        font-weight: 800;
        color: #ffffff;
      }
      .nx-preview-meta {
        font-size: 11.5px;
        color: #cbd5e1;
        line-height: 1.45;
      }
      .nx-preview-meta strong { color: #86efac; }
      @media (max-width: 720px) {
        .nx-two-col, .nx-preview-box { grid-template-columns: 1fr; }
        .nx-preview-video-wrap { margin: 0 auto; width: 175px; }
      }
    `;
    document.head.appendChild(style);
  }

  function forceVeoDefault() {
    const ve = document.getElementById("videoEngine");
    if (!ve) return;
    const veoOpt = Array.from(ve.options).find((o) => o.value === "veo");
    if (veoOpt) {
      veoOpt.textContent = "⭐ Google Veo 3.1 Cinema (Padrão • Igual Gemini)";
      ve.value = "veo";
    }
  }

  function buildPanelHTML() {
    return `
      <section class="nx-smart-card" id="nxSmartPromptPanel">
        <div class="nx-smart-head">
          <div class="nx-smart-title">
            <span>🧠 Motor Cinema 1.218 Prompts + Anti-Repetição</span>
            <span class="nx-pill-veo">Veo 3.1 Padrão</span>
          </div>
          <span style="font-size:11px;color:#86efac;font-weight:700;">Zero legendas/voz vazadas • Adaptado p/ qualquer produto</span>
        </div>

        <div class="nx-two-col">
          <!-- 2 CAMPOS DE MODELO DE VÍDEO -->
          <div class="nx-choice-box">
            <label class="nx-lbl">🎬 Modelo de Vídeo (10 Modelos de Conversão)</label>
            <div class="nx-mode-pair">
              <button type="button" class="nx-mode-opt active" id="nxBtnModeloAuto">⭐ Melhor Opção</button>
              <button type="button" class="nx-mode-opt" id="nxBtnModeloManual">🎯 Escolher Modelo</button>
            </div>
            <select id="nxSelectModeloManual" style="display:none;"></select>
            <div class="nx-sub-hint" id="nxModeloHint">Modo <strong>Melhor Opção</strong> ativo: a IA analisa seu produto e escolhe automaticamente o modelo mais forte entre os 10.</div>
          </div>

          <!-- 2 CAMPOS DE TRILHA SONORA (MODO HÍBRIDO) -->
          <div class="nx-choice-box">
            <label class="nx-lbl">🎵 Trilha Sonora Cinema (Estilo dos Vídeos)</label>
            <div class="nx-mode-pair">
              <button type="button" class="nx-mode-opt active" id="nxBtnTrilhaAuto">⭐ Melhor Opção</button>
              <button type="button" class="nx-mode-opt" id="nxBtnTrilhaManual">🎧 Escolher Trilha</button>
            </div>
            <select id="nxSelectTrilhaManual" style="display:none;"></select>
            <div class="nx-audio-bar">
              <select id="nxSelectFonteTrilha" style="flex:1;min-height:34px;padding:6px 10px;font-size:11.5px;">
                <option value="instant" selected>⚡ Trilha Pronta Cinema MP3 (0 créditos • Instantânea)</option>
                <option value="lyria2">🤖 Gerar Trilha Exclusiva IA (Google Lyria 2 • 3 créditos)</option>
              </select>
              <button type="button" class="nx-btn-sm" id="nxBtnOuvirTrilha">🔊 Ouvir</button>
            </div>
            <div class="nx-sub-hint" id="nxTrilhaHint">Trilha selecionada automaticamente no ritmo do seu produto e modelo de vídeo.</div>
          </div>
        </div>

        <!-- VÍDEO CURTO DE EXEMPLO 9:16 ANTES DA GERAÇÃO (0 CRÉDITOS) -->
        <div class="nx-preview-box" id="nxExamplePreviewBox">
          <div class="nx-preview-video-wrap" id="nxPreviewVideoWrap">
            <video id="nxExampleVideo" muted loop playsinline autoplay></video>
            <div class="nx-preview-fallback" id="nxExampleFallback" style="display:none;">
              <span style="font-size:24px;">🎬</span>
              <strong style="color:#fff;">Exemplo 9:16</strong>
              <span id="nxFallbackText">Suba o vídeo curto em <code>previews/</code> para exibir aqui.</span>
            </div>
          </div>
          <div class="nx-preview-info">
            <span class="nx-preview-badge">👁️ EXEMPLO ANTES DE GERAR (0 CRÉDITOS)</span>
            <div class="nx-preview-title" id="nxPrevModelTitle">Carregando melhor modelo...</div>
            <div class="nx-preview-meta" id="nxPrevModelDesc">Preencha o produto acima para a IA selecionar o melhor modelo, cenário e trilha sonora.</div>
            <div class="nx-preview-meta" id="nxPrevTrackInfo"></div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;">
              <button type="button" class="nx-btn-sm" id="nxBtnRefreshPreview">🔄 Ver outra variação (Anti-Repetição)</button>
              <button type="button" class="nx-btn-sm" id="nxBtnMuteExample">🔇 Ativar Som do Exemplo</button>
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

    if (titleEl) titleEl.textContent = `${selecao.modeloNome} • ${selecao.estiloVisual}`;
    if (descEl) {
      descEl.innerHTML =
        `${selecao.dicaExemplo || "Exemplo ilustrativo do estilo escolhido — seu vídeo será gerado com o seu produto."}<br/>` +
        `Categoria detectada: <strong>${selecao.categoriaDetectada}</strong> • Prompt único: <strong>${selecao.idPromptUsado}</strong>`;
    }
    if (trackEl && selecao.trilhaRecomendada) {
      trackEl.innerHTML = `🎵 Trilha casada: <strong>${selecao.trilhaRecomendada.trilhaNome}</strong> (${state.fonteTrilha === "instant" ? "MP3 Instantâneo • 0 créditos" : "Google Lyria 2 IA"})`;
    }

    if (vidEl && selecao.previewVideo) {
      const srcPath = `./${selecao.previewVideo.replace(/^\/+/, "")}`;
      if (vidEl.getAttribute("data-src") !== srcPath) {
        vidEl.setAttribute("data-src", srcPath);
        vidEl.style.display = "block";
        if (fbEl) fbEl.style.display = "none";
        vidEl.onerror = () => {
          vidEl.style.display = "none";
          if (fbEl) fbEl.style.display = "flex";
          if (fbTxt) fbTxt.innerHTML = `Exemplo ilustrativo pronto para <code>${selecao.previewVideo}</code> (subir MP4 curto na pasta <code>previews/</code>).`;
        };
        vidEl.src = srcPath;
        vidEl.load();
        vidEl.play().catch(() => {});
      }
    }
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
          duracaoSegundos: 6
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
    const btnRef = document.getElementById("nxBtnRefreshPreview");
    const btnMuteEx = document.getElementById("nxBtnMuteExample");

    btnMAuto?.addEventListener("click", () => {
      state.modoModelo = "melhor_opcao";
      btnMAuto.classList.add("active");
      btnMMan?.classList.remove("active");
      if (selM) selM.style.display = "none";
      if (hintM) hintM.innerHTML = "Modo <strong>Melhor Opção</strong> ativo: a IA analisa seu produto e escolhe automaticamente o modelo mais forte entre os 10.";
      refreshSmartSelection(true);
    });

    btnMMan?.addEventListener("click", () => {
      state.modoModelo = "manual";
      btnMMan.classList.add("active");
      btnMAuto?.classList.remove("active");
      if (selM) selM.style.display = "block";
      if (hintM) hintM.textContent = "Escolha manual ativa: o vídeo seguirá exatamente o modelo selecionado acima.";
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
      if (hintT) hintT.textContent = "Trilha selecionada automaticamente no ritmo do seu produto e modelo de vídeo.";
      refreshSmartSelection(true);
    });

    btnTMan?.addEventListener("click", () => {
      state.modoTrilha = "manual";
      btnTMan.classList.add("active");
      btnTAuto?.classList.remove("active");
      if (selT) selT.style.display = "block";
      if (hintT) hintT.textContent = "Trilha manual ativa: o comercial usará o estilo escolhido acima.";
      refreshSmartSelection(true);
    });

    selT?.addEventListener("change", () => {
      state.trilhaManualId = selT.value;
      refreshSmartSelection(true);
    });

    selFonte?.addEventListener("change", () => {
      state.fonteTrilha = selFonte.value;
      if (state.ultimaSelecao) updatePreviewUI(state.ultimaSelecao);
    });

    btnOuvir?.addEventListener("click", () => {
      if (state.previewAudioEl && !state.previewAudioEl.paused) {
        state.previewAudioEl.pause();
        btnOuvir.textContent = "🔊 Ouvir";
        return;
      }
      const mp3 = state.ultimaSelecao?.trilhaRecomendada?.arquivoMp3 ||
        (state.trilhas.find((t) => t.id === state.trilhaManualId)?.arquivoPreviewMp3);
      if (!mp3) return;
      if (state.previewAudioEl) { try { state.previewAudioEl.pause(); } catch {} }
      const audio = new Audio(`./${mp3.replace(/^\/+/, "")}`);
      state.previewAudioEl = audio;
      btnOuvir.textContent = "⏹️ Parar";
      audio.onended = () => { btnOuvir.textContent = "🔊 Ouvir"; };
      audio.onerror = () => {
        btnOuvir.textContent = "🔊 Ouvir";
        if (hintT) hintT.innerHTML = `Suba o arquivo <code>${mp3}</code> na pasta <code>tracks/</code> do GitHub para ouvir na hora.`;
      };
      audio.play().catch(() => { btnOuvir.textContent = "🔊 Ouvir"; });
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
      btnMuteEx.textContent = v.muted ? "🔇 Ativar Som do Exemplo" : "🔊 Silenciar Exemplo";
    });

    // Atualiza o exemplo automaticamente quando o usuário digitar o produto
    ["inlineProductName", "productDetailHint", "macroTarget"].forEach((id) => {
      document.getElementById(id)?.addEventListener("input", () => refreshSmartSelection(false));
    });
  }

  // Intercepta chamadas a /api/generate para injetar o Banco de 1.218 Prompts, Veo 3.1, Trilhas Híbridas e Anti-Repetição
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
            parsed.useMusicDatabase = true;
            parsed.musicMode = state.fonteTrilha; // "instant" ou "lyria2"
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
    }

    // Carrega o catálogo oficial direto do servidor (0 créditos)
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
