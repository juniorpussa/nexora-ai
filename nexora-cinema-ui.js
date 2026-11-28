/**
 * ============================================================================
 * NEXORA.AI — PAINEL INTELIGENTE DE 1.218 PROMPTS + TRILHAS INSTANTÂNEAS 0 CRÉDITOS
 * ============================================================================
 * Versão 3.0 (Estabilidade Total + Melhor Opção Travada + Preview 0s/0cr)
 *  - Botão "Melhor Opção" escolhe UMA única melhor opção para o produto e fica
 *    desabilitado/apagado (nunca fica clicável gerando outras variações!).
 *  - Só reabilita se o usuário clicar em "Escolher Manual" / "Escolher Estilo".
 *  - Botão "Ouvir Trilha" toca em 0 segundos e 0 créditos (MP3 próprio -> tracks/
 *    -> prévia musical instantânea em WebAudio no navegador, sem chamar Lyria 2!).
 *  - Google Lyria 2 Pro roda na geração final do vídeo em paralelo com os cortes.
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

  // Mapeamento determinístico: garante que "Melhor Opção" trave UMA escolha estável por categoria
  const CATEGORY_BEST_MAP = {
    relogios: { modeloId: 6, trilhaId: "hollywood_phonk" },
    perfumes: { modeloId: 3, trilhaId: "luxo_asmr" },
    beleza: { modeloId: 8, trilhaId: "luxo_asmr" },
    eletronicos: { modeloId: 6, trilhaId: "scifi_cyberpunk" },
    calcados: { modeloId: 1, trilhaId: "impacto_industrial" },
    oculos: { modeloId: 10, trilhaId: "lounge_executivo" },
    moda: { modeloId: 10, trilhaId: "lounge_executivo" },
    casa: { modeloId: 2, trilhaId: "virada_dinamica" },
    suplementos: { modeloId: 1, trilhaId: "impacto_industrial" },
    universal: { modeloId: 6, trilhaId: "hollywood_phonk" }
  };

  const state = {
    modelos: FALLBACK_MODELOS,
    trilhas: FALLBACK_TRILHAS,
    totalPrompts: 1218,
    modoModelo: "melhor_opcao",
    modeloManualId: "6",
    modeloAutoTravadoId: 6,
    modoTrilha: "melhor_opcao",
    trilhaManualId: "hollywood_phonk",
    trilhaAutoTravadaId: "hollywood_phonk",
    fonteTrilha: "lyria2",
    ultimaCategoria: "universal",
    ultimaSelecao: null,
    previewAudioEl: null,
    synthCtx: null,
    synthTimer: null,
    synthPlaying: false
  };

  window.__NEXORA_CINEMA_STATE__ = state;

  function detectCategoryLocal(nome, detalhes) {
    const s = `${nome || ""} ${detalhes || ""}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    if (/(relogio|smartwatch|cronografo|watch|tonneau|pulseira.*aco)/.test(s)) return "relogios";
    if (/(perfume|colonia|fragrancia|body\s*splash|parfum|arabe|essencia)/.test(s)) return "perfumes";
    if (/(serum|creme|maquiagem|batom|shampoo|skincare|cosmetico|hidratante)/.test(s)) return "beleza";
    if (/(vr|headset|fone|mouse|teclado|caixa\s*de\s*som|carregador|camera|drone|celular|gamer|tech|eletronico)/.test(s)) return "eletronicos";
    if (/(tenis|sapato|bota|sandalia|chinelo|sneaker|chuteira|calcado)/.test(s)) return "calcados";
    if (/(oculos|armacao|lente\s*solar|polarizad|aviador|wayfarer)/.test(s)) return "oculos";
    if (/(camisa|camiseta|jaqueta|vestido|calca|bolsa|carteira|mochila|joia|colar|anel|corrente)/.test(s)) return "moda";
    if (/(whey|creatina|suplemento|vitamina|proteina|colageno|magnesio)/.test(s)) return "suplementos";
    if (/(cozinha|garrafa|copo|cafeteira|panela|ferramenta|aspirador|carro|automotivo|organizador)/.test(s)) return "casa";
    return "universal";
  }

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
    return state.modoModelo === "manual" ? Number(state.modeloManualId) : Number(state.modeloAutoTravadoId || 6);
  }

  function getActiveTrilhaPreferida() {
    return state.modoTrilha === "manual" ? state.trilhaManualId : (state.trilhaAutoTravadaId || "hollywood_phonk");
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

  // =========================================================================
  // PRÉVIA MUSICAL INSTANTÂNEA EM WEBAUDIO (0 SEGUNDOS • 0 CRÉDITOS)
  // Permite testar cada um dos 7 estilos na hora, sem aguardar fila da IA!
  // =========================================================================
  function stopAnyTrackPreview() {
    if (state.previewAudioEl) {
      try { state.previewAudioEl.pause(); state.previewAudioEl.currentTime = 0; } catch {}
      state.previewAudioEl = null;
    }
    if (state.synthTimer) {
      clearTimeout(state.synthTimer);
      state.synthTimer = null;
    }
    if (state.synthCtx) {
      try { state.synthCtx.close(); } catch {}
      state.synthCtx = null;
    }
    state.synthPlaying = false;
    const btnOuvir = document.getElementById("nxBtnOuvirTrilha");
    if (btnOuvir) {
      btnOuvir.textContent = "🔊 Ouvir Trilha";
      btnOuvir.classList.remove("nx-playing-now");
    }
  }

  function playInstantStyleSynth(trackId, onEnd) {
    stopAnyTrackPreview();
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { if (onEnd) onEnd(); return false; }

    const PROFILES = {
      impacto_industrial:    { bpm: 128, bass: [55, 55, 65.4, 49],    lead: [220, 0, 261.6, 220, 196, 0, 220, 293.7], wave: "sawtooth", hat: true,  kickPunch: 150 },
      hollywood_phonk:       { bpm: 132, bass: [49, 49, 58.3, 43.7],  lead: [392, 466.2, 392, 349.2, 392, 0, 523.3, 466.2], wave: "triangle", hat: true,  kickPunch: 135 },
      scifi_cyberpunk:       { bpm: 124, bass: [65.4, 65.4, 73.4, 61.7], lead: [261.6, 329.6, 392, 523.3, 493.9, 392, 329.6, 293.7], wave: "sawtooth", hat: true,  kickPunch: 120 },
      luxo_asmr:             { bpm: 108, bass: [55, 55, 49, 43.7],    lead: [220, 0, 329.6, 0, 293.7, 0, 246.9, 0], wave: "sine",     hat: false, kickPunch: 95 },
      lounge_executivo:      { bpm: 114, bass: [65.4, 58.3, 55, 49],  lead: [329.6, 392, 440, 392, 329.6, 293.7, 261.6, 293.7], wave: "sine",     hat: true,  kickPunch: 100 },
      epico_cinematografico: { bpm: 120, bass: [43.7, 43.7, 49, 55],  lead: [174.6, 220, 261.6, 349.2, 329.6, 261.6, 220, 293.7], wave: "sawtooth", hat: false, kickPunch: 160 },
      virada_dinamica:       { bpm: 126, bass: [58.3, 58.3, 65.4, 73.4], lead: [293.7, 349.2, 440, 0, 392, 349.2, 329.6, 440], wave: "triangle", hat: true,  kickPunch: 140 }
    };
    const p = PROFILES[trackId] || PROFILES.hollywood_phonk;
    const ac = new AC();
    state.synthCtx = ac;
    state.synthPlaying = true;

    const master = ac.createGain();
    master.gain.value = 0.55;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -12; comp.ratio.value = 4;
    master.connect(comp);
    comp.connect(ac.destination);

    // Ruído curto para chimbal (hi-hat)
    const nLen = Math.floor(ac.sampleRate * 0.08);
    const nBuf = ac.createBuffer(1, nLen, ac.sampleRate);
    const nd = nBuf.getChannelData(0);
    for (let i = 0; i < nLen; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / nLen);

    const stepSec = 60 / p.bpm / 2; // colcheia
    const totalSteps = 32; // ~7.5 segundos de amostra limpa
    const t0 = ac.currentTime + 0.04;

    for (let s = 0; s < totalSteps; s++) {
      const t = t0 + s * stepSec;

      // Kick nos tempos fortes (0, 4, 8, 12...) + contratempo Phonk/Trap
      if (s % 4 === 0 || (p.hat && s % 8 === 6)) {
        const osc = ac.createOscillator();
        const g = ac.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(p.kickPunch, t);
        osc.frequency.exponentialRampToValueAtTime(36, t + 0.14);
        g.gain.setValueAtTime(0.85, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.connect(g); g.connect(master);
        osc.start(t); osc.stop(t + 0.24);
      }

      // Sub-Bass 808 contínuo
      if (s % 4 === 0) {
        const bFreq = p.bass[Math.floor(s / 8) % p.bass.length];
        const bOsc = ac.createOscillator();
        const bLp = ac.createBiquadFilter();
        bLp.type = "lowpass"; bLp.frequency.value = 210;
        const bg = ac.createGain();
        bOsc.type = "triangle";
        bOsc.frequency.setValueAtTime(bFreq, t);
        bg.gain.setValueAtTime(0.001, t);
        bg.gain.linearRampToValueAtTime(0.55, t + 0.03);
        bg.gain.exponentialRampToValueAtTime(0.001, t + stepSec * 3.8);
        bOsc.connect(bLp); bLp.connect(bg); bg.connect(master);
        bOsc.start(t); bOsc.stop(t + stepSec * 3.9);
      }

      // Snare / Clap no tempo 4 e 12
      if (s % 8 === 4) {
        const sn = ac.createBufferSource();
        sn.buffer = nBuf;
        const bp = ac.createBiquadFilter();
        bp.type = "bandpass"; bp.frequency.value = 1800; bp.Q.value = 0.8;
        const sg = ac.createGain();
        sg.gain.setValueAtTime(0.32, t);
        sg.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        sn.connect(bp); bp.connect(sg); sg.connect(master);
        sn.start(t); sn.stop(t + 0.10);
      }

      // Hi-hat rápido
      if (p.hat && s % 2 === 1) {
        const hh = ac.createBufferSource();
        hh.buffer = nBuf;
        const hp = ac.createBiquadFilter();
        hp.type = "highpass"; hp.frequency.value = 7200;
        const hg = ac.createGain();
        hg.gain.setValueAtTime(0.14, t);
        hg.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        hh.connect(hp); hp.connect(hg); hg.connect(master);
        hh.start(t); hh.stop(t + 0.06);
      }

      // Synth / Motivo melódico do estilo
      const note = p.lead[s % p.lead.length];
      if (note > 0) {
        const lOsc = ac.createOscillator();
        const lp = ac.createBiquadFilter();
        lp.type = "lowpass"; lp.frequency.value = p.wave === "sawtooth" ? 1350 : 2200;
        const lg = ac.createGain();
        lOsc.type = p.wave;
        lOsc.frequency.setValueAtTime(note, t);
        lg.gain.setValueAtTime(0.001, t);
        lg.gain.linearRampToValueAtTime(0.18, t + 0.015);
        lg.gain.exponentialRampToValueAtTime(0.001, t + stepSec * 1.4);
        lOsc.connect(lp); lp.connect(lg); lg.connect(master);
        lOsc.start(t); lOsc.stop(t + stepSec * 1.5);
      }
    }

    const totalMs = Math.round(totalSteps * stepSec * 1000) + 250;
    state.synthTimer = setTimeout(() => {
      stopAnyTrackPreview();
      if (onEnd) onEnd();
    }, totalMs);
    return true;
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
        border: 1.5px solid rgba(148, 163, 184, 0.22);
        color: #cbd5e1;
        border-radius: 10px;
        padding: 10px;
        min-height: 42px;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
        text-align: center;
        transition: all 0.16s ease;
      }
      .nx-mode-opt:hover:not(:disabled) {
        border-color: rgba(148, 163, 184, 0.48);
        color: #fff;
      }
      .nx-mode-opt.active {
        background: rgba(34, 197, 94, 0.16);
        border-color: #22c55e;
        color: #86efac;
        box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.18);
      }
      /* Botão Melhor Opção travado/apagado após a IA definir a escolha! */
      .nx-mode-opt.locked-auto,
      .nx-mode-opt:disabled {
        background: rgba(34, 197, 94, 0.07) !important;
        border-color: rgba(34, 197, 94, 0.30) !important;
        color: rgba(134, 239, 172, 0.65) !important;
        opacity: 0.62 !important;
        cursor: not-allowed !important;
        box-shadow: none !important;
      }
      .nx-locked-choice-pill {
        background: rgba(34, 197, 94, 0.09);
        border: 1px solid rgba(34, 197, 94, 0.30);
        border-radius: 10px;
        padding: 8px 11px;
        font-size: 11.5px;
        color: #dcfce7;
        font-weight: 700;
        line-height: 1.38;
      }
      .nx-locked-choice-pill span {
        color: #4ade80;
        font-weight: 900;
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
      .nx-btn-sm.nx-playing-now {
        background: rgba(220, 38, 38, 0.22);
        border-color: #ef4444;
        color: #fecaca;
      }
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
          <span style="font-size:11.5px;color:#94a3b8;font-weight:600;">1.218 variações exclusivas • Escolha travada sem surpresas</span>
        </div>

        <div class="nx-two-col">
          <!-- MODELO DE VÍDEO -->
          <div class="nx-choice-box">
            <label class="nx-lbl">🎬 Estilo de Comercial (10 Modelos)</label>
            <div class="nx-mode-pair">
              <button type="button" class="nx-mode-opt locked-auto" id="nxBtnModeloAuto" disabled>✓ Melhor Opção</button>
              <button type="button" class="nx-mode-opt" id="nxBtnModeloManual">🎯 Escolher Manual</button>
            </div>
            <div class="nx-locked-choice-pill" id="nxModeloAutoPill"><span>✓ IA escolheu:</span> 6. Vitrine Dinâmica Multi-Ângulos / Hollywood Cut</div>
            <select id="nxSelectModeloManual" style="display:none;"></select>
            <div class="nx-sub-hint" id="nxModeloHint">Opção travada pela IA para o seu produto. Clique em "Escolher Manual" só se quiser trocar.</div>
          </div>

          <!-- TRILHA SONORA UNIFICADA -->
          <div class="nx-choice-box">
            <label class="nx-lbl">🎵 Trilha Sonora (7 Estilos de Agência)</label>
            <div class="nx-mode-pair">
              <button type="button" class="nx-mode-opt locked-auto" id="nxBtnTrilhaAuto" disabled>✓ Melhor Opção</button>
              <button type="button" class="nx-mode-opt" id="nxBtnTrilhaManual">🎧 Escolher Estilo</button>
            </div>
            <div class="nx-locked-choice-pill" id="nxTrilhaAutoPill"><span>✓ IA escolheu:</span> Hollywood Cut &amp; Phonk / Trap Eletrônico</div>
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
            <div class="nx-sub-hint" id="nxTrilhaHint">Clique em "Ouvir Trilha" para testar o ritmo na hora (0 segundos • 0 créditos).</div>
          </div>
        </div>

        <!-- RESUMO TRAVADO DA ESCOLHA (0 CRÉDITOS) -->
        <div class="nx-preview-box" id="nxExamplePreviewBox">
          <div class="nx-preview-video-wrap" id="nxPreviewVideoWrap">
            <video id="nxExampleVideo" muted loop playsinline autoplay></video>
            <div class="nx-preview-fallback" id="nxExampleFallback" style="display:none;">
              <span style="font-size:22px;">🎬</span>
              <strong style="color:#f8fafc;font-size:11px;">Prévia 9:16</strong>
              <span id="nxFallbackText">Estilo definido e pronto para gerar com o seu produto.</span>
            </div>
          </div>
          <div class="nx-preview-info">
            <span class="nx-preview-badge">✓ Configuração Definida • 0 Créditos</span>
            <div class="nx-preview-title" id="nxPrevModelTitle">6. Vitrine Dinâmica Multi-Ângulos / Hollywood Cut</div>
            <div class="nx-preview-meta" id="nxPrevModelDesc">A IA travou a melhor combinação para o seu produto — pronta para gerar em 9:16.</div>
            <div class="nx-preview-meta" id="nxPrevTrackInfo"></div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:2px;">
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

  function applyLockedUIState() {
    const btnMAuto = document.getElementById("nxBtnModeloAuto");
    const btnMMan = document.getElementById("nxBtnModeloManual");
    const selM = document.getElementById("nxSelectModeloManual");
    const pillM = document.getElementById("nxModeloAutoPill");
    const hintM = document.getElementById("nxModeloHint");

    const btnTAuto = document.getElementById("nxBtnTrilhaAuto");
    const btnTMan = document.getElementById("nxBtnTrilhaManual");
    const selT = document.getElementById("nxSelectTrilhaManual");
    const pillT = document.getElementById("nxTrilhaAutoPill");
    const hintT = document.getElementById("nxTrilhaHint");

    const activeModObj = state.modelos.find((m) => Number(m.id) === Number(getActiveModeloPreferido())) || state.modelos[5] || state.modelos[0];
    const activeTrkObj = state.trilhas.find((t) => t.id === getActiveTrilhaPreferida()) || state.trilhas[1] || state.trilhas[0];

    if (state.modoModelo === "melhor_opcao") {
      if (btnMAuto) {
        btnMAuto.disabled = true;
        btnMAuto.classList.add("locked-auto");
        btnMAuto.classList.remove("active");
        btnMAuto.textContent = "✓ Melhor Opção";
      }
      if (btnMMan) btnMMan.classList.remove("active");
      if (selM) selM.style.display = "none";
      if (pillM) {
        pillM.style.display = "block";
        pillM.innerHTML = `<span>✓ IA escolheu:</span> ${activeModObj.nome}`;
      }
      if (hintM) hintM.textContent = "Escolha travada pela IA (não gera outras sozinha). Clique em \"Escolher Manual\" para trocar.";
    } else {
      if (btnMAuto) {
        btnMAuto.disabled = false;
        btnMAuto.classList.remove("locked-auto");
        btnMAuto.textContent = "⭐ Melhor Opção";
      }
      if (btnMMan) btnMMan.classList.add("active");
      if (selM) selM.style.display = "block";
      if (pillM) pillM.style.display = "none";
      if (hintM) hintM.textContent = "Modo manual ativo: o vídeo seguirá exatamente o modelo selecionado acima.";
    }

    if (state.modoTrilha === "melhor_opcao") {
      if (btnTAuto) {
        btnTAuto.disabled = true;
        btnTAuto.classList.add("locked-auto");
        btnTAuto.classList.remove("active");
        btnTAuto.textContent = "✓ Melhor Opção";
      }
      if (btnTMan) btnTMan.classList.remove("active");
      if (selT) selT.style.display = "none";
      if (pillT) {
        pillT.style.display = "block";
        pillT.innerHTML = `<span>✓ IA escolheu:</span> ${activeTrkObj.nome}`;
      }
    } else {
      if (btnTAuto) {
        btnTAuto.disabled = false;
        btnTAuto.classList.remove("locked-auto");
        btnTAuto.textContent = "⭐ Melhor Opção";
      }
      if (btnTMan) btnTMan.classList.add("active");
      if (selT) selT.style.display = "block";
      if (pillT) pillT.style.display = "none";
    }

    const titleEl = document.getElementById("nxPrevModelTitle");
    const descEl = document.getElementById("nxPrevModelDesc");
    const trackEl = document.getElementById("nxPrevTrackInfo");
    const vidEl = document.getElementById("nxExampleVideo");
    const fbEl = document.getElementById("nxExampleFallback");
    const fbTxt = document.getElementById("nxFallbackText");
    const muteBtn = document.getElementById("nxBtnMuteExample");

    if (titleEl) titleEl.textContent = activeModObj.nome;
    if (descEl) {
      descEl.innerHTML =
        `${activeModObj.dicaExemplo || "Estilo definido — seu vídeo será gerado 100% com o seu produto."}<br/>` +
        `Categoria detectada: <strong>${state.ultimaCategoria}</strong> • Foco: <strong>${activeModObj.foco || "Alta Conversão"}</strong>`;
    }
    if (trackEl) {
      const fonteLbl =
        state.fonteTrilha === "mute"
          ? "Sem música"
          : state.fonteTrilha === "instant"
            ? "MP3 Pronta (ou Lyria 2 automático)"
            : state.fonteTrilha === "fast"
              ? "IA Rápida (~12s)"
              : "Google Lyria 2 Pro";
      trackEl.innerHTML = `🎵 Trilha travada: <strong>${activeTrkObj.nome}</strong> (${fonteLbl})`;
    }

    if (vidEl && activeModObj.previewVideo) {
      const srcPath = `./${activeModObj.previewVideo.replace(/^\/+/, "")}`;
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
          if (fbTxt) fbTxt.textContent = "Modelo definido! Seu vídeo sairá em 9:16 com o seu produto.";
        };
        vidEl.src = srcPath;
        vidEl.load();
        vidEl.play().catch(() => {});
      }
    }

    if (hintT && !state.synthPlaying && !state.previewAudioEl) {
      hintT.textContent = "Clique em \"🔊 Ouvir Trilha\" para testar o ritmo em 0 segundos (0 créditos).";
    }
    notifySummaryUpdate();
  }

  function updateCategoryAutoLockIfChanged(forceUpdate = false) {
    const prod = getProductInfoFromDOM();
    const cat = detectCategoryLocal(prod.nome, prod.detalhes);
    if (!forceUpdate && cat === state.ultimaCategoria) return;
    state.ultimaCategoria = cat;
    const best = CATEGORY_BEST_MAP[cat] || CATEGORY_BEST_MAP.universal;
    state.modeloAutoTravadoId = best.modeloId;
    state.trilhaAutoTravadaId = best.trilhaId;
    applyLockedUIState();
  }

  function bindPanelEvents() {
    const btnMAuto = document.getElementById("nxBtnModeloAuto");
    const btnMMan = document.getElementById("nxBtnModeloManual");
    const selM = document.getElementById("nxSelectModeloManual");

    const btnTAuto = document.getElementById("nxBtnTrilhaAuto");
    const btnTMan = document.getElementById("nxBtnTrilhaManual");
    const selT = document.getElementById("nxSelectTrilhaManual");
    const selFonte = document.getElementById("nxSelectFonteTrilha");
    const hintT = document.getElementById("nxTrilhaHint");
    const btnOuvir = document.getElementById("nxBtnOuvirTrilha");
    const btnUpMp3 = document.getElementById("nxBtnUploadMp3Unified");
    const btnClrMp3 = document.getElementById("nxBtnClearMp3Unified");
    const btnMuteEx = document.getElementById("nxBtnMuteExample");
    const legacyMp3Inp = document.getElementById("customAudioFile");
    const legacyMusicSel = document.getElementById("musicPreset");

    btnMAuto?.addEventListener("click", () => {
      if (state.modoModelo === "melhor_opcao") return; // Já travado!
      state.modoModelo = "melhor_opcao";
      updateCategoryAutoLockIfChanged(true);
    });

    btnMMan?.addEventListener("click", () => {
      state.modoModelo = "manual";
      applyLockedUIState();
    });

    selM?.addEventListener("change", () => {
      state.modeloManualId = selM.value;
      applyLockedUIState();
    });

    btnTAuto?.addEventListener("click", () => {
      if (state.modoTrilha === "melhor_opcao") return; // Já travado!
      stopAnyTrackPreview();
      state.modoTrilha = "melhor_opcao";
      updateCategoryAutoLockIfChanged(true);
    });

    btnTMan?.addEventListener("click", () => {
      stopAnyTrackPreview();
      state.modoTrilha = "manual";
      applyLockedUIState();
    });

    selT?.addEventListener("change", () => {
      stopAnyTrackPreview();
      state.trilhaManualId = selT.value;
      applyLockedUIState();
    });

    selFonte?.addEventListener("change", () => {
      stopAnyTrackPreview();
      state.fonteTrilha = selFonte.value;
      syncLegacyMusicEngine();
      if (legacyMusicSel) {
        if (state.fonteTrilha === "mute") legacyMusicSel.value = "mute";
        else if (legacyMusicSel.value === "mute") legacyMusicSel.value = "hollywood_luxury";
      }
      applyLockedUIState();
    });

    btnUpMp3?.addEventListener("click", () => {
      legacyMp3Inp?.click();
    });

    legacyMp3Inp?.addEventListener("change", () => {
      stopAnyTrackPreview();
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
      stopAnyTrackPreview();
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
      applyLockedUIState();
    });

    // PREVIEW 100% INSTANTÂNEO (0 SEGUNDOS • 0 CRÉDITOS • NUNCA TRAVA CHAMANDO LYRIA 2!)
    btnOuvir?.addEventListener("click", async () => {
      if (state.synthPlaying || (state.previewAudioEl && !state.previewAudioEl.paused)) {
        stopAnyTrackPreview();
        if (hintT) hintT.textContent = "Prévia pausada. Clique em \"🔊 Ouvir Trilha\" para testar novamente (0 créditos).";
        return;
      }

      // 1) MP3 próprio subido pelo usuário
      const customFile = legacyMp3Inp?.files && legacyMp3Inp.files[0];
      if (customFile && legacyMusicSel?.value === "custom") {
        const u = URL.createObjectURL(customFile);
        const audio = new Audio(u);
        state.previewAudioEl = audio;
        btnOuvir.textContent = "⏹️ Parar Trilha";
        btnOuvir.classList.add("nx-playing-now");
        if (hintT) hintT.textContent = `🔊 Ouvindo seu MP3: ${customFile.name} (0 créditos)`;
        audio.onended = () => stopAnyTrackPreview();
        audio.play().catch(() => stopAnyTrackPreview());
        return;
      }

      // 2) Tenta MP3 local na pasta tracks/ se já existir no GitHub (resposta imediata)
      const activeId = getActiveTrilhaPreferida();
      const trkObj = state.trilhas.find((t) => t.id === activeId) || state.trilhas[0];
      const mp3 = trkObj?.arquivoPreviewMp3 || "";
      if (mp3) {
        try {
          const check = await fetch(`./${mp3.replace(/^\/+/, "")}`);
          const ct = String(check.headers.get("content-type") || "").toLowerCase();
          if (check.ok && !ct.includes("text/html")) {
            const blobUrl = URL.createObjectURL(await check.blob());
            const audio = new Audio(blobUrl);
            state.previewAudioEl = audio;
            btnOuvir.textContent = "⏹️ Parar Trilha";
            btnOuvir.classList.add("nx-playing-now");
            if (hintT) hintT.textContent = `🔊 Ouvindo MP3 pronto: ${trkObj.nome} (0 créditos)`;
            audio.onended = () => stopAnyTrackPreview();
            audio.play().catch(() => stopAnyTrackPreview());
            return;
          }
        } catch {}
      }

      // 3) Prévia rítmica instantânea do estilo em WebAudio (0 segundos, 0 créditos!)
      btnOuvir.textContent = "⏹️ Parar Prévia";
      btnOuvir.classList.add("nx-playing-now");
      if (hintT) {
        hintT.textContent = `🔊 Prévia instantânea: ${trkObj.nome} (0s • 0 créditos). A trilha completa Lyria 2 entra no vídeo final!`;
      }
      playInstantStyleSynth(activeId, () => {
        if (hintT) hintT.textContent = `✓ Estilo "${trkObj.nome}" selecionado. Trilha completa Lyria 2 será gerada com o vídeo.`;
      });
    });

    btnMuteEx?.addEventListener("click", () => {
      const v = document.getElementById("nxExampleVideo");
      if (!v) return;
      v.muted = !v.muted;
      btnMuteEx.textContent = v.muted ? "🔇 Ativar Som" : "🔊 Silenciar";
    });

    // Atualiza a categoria APENAS se mudar de categoria (nunca re-sorteia aleatoriamente!)
    let catTimer = null;
    ["inlineProductName", "productDetailHint"].forEach((id) => {
      document.getElementById(id)?.addEventListener("input", () => {
        clearTimeout(catTimer);
        catTimer = setTimeout(() => updateCategoryAutoLockIfChanged(false), 350);
      });
      document.getElementById(id)?.addEventListener("change", () => {
        updateCategoryAutoLockIfChanged(false);
      });
    });
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

            if (effectiveMusicMode === "instant" && !parsed.__isMusicPreviewDirect) {
              const activeId = getActiveTrilhaPreferida();
              const candMp3 = state.trilhas.find((t) => t.id === activeId)?.arquivoPreviewMp3 || "";
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
              effectiveMusicMode = "lyria2";
            }

            parsed.useMusicDatabase = true;
            parsed.musicMode = effectiveMusicMode;
            if (state.fonteTrilha === "fast" && parsed.engineIndex === 0) {
              parsed.engineIndex = 1;
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
      updateCategoryAutoLockIfChanged(true);
    }

    try {
      const res = await fetch("/api/generate?action=get_options");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.modelos) && data.modelos.length) state.modelos = data.modelos;
        if (Array.isArray(data.trilhas) && data.trilhas.length) state.trilhas = data.trilhas;
        if (data.totalPrompts) state.totalPrompts = data.totalPrompts;
        populateSelects();
        applyLockedUIState();
      }
    } catch {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
