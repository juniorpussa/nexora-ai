/**
 * ============================================================================
 * NEXORA.AI — DIRETOR IA ADAPTATIVO POR NICHO + CENÁRIO AUTO + PRÉVIA 4s REAL
 * ============================================================================
 * Versão 5.0 (Nota 1000 — Prévia 4s por Cenário + Produto Grande + 3 Ângulos)
 *  - Diretor IA completo para 12 nichos: trava automaticamente Modelo, Trilha
 *    Sonora E Cenário (105 Universos 3D) com botão "✓ Melhor Opção" apagado.
 *  - Prévia animada de 4 segundos (0 créditos) muda AO VIVO conforme o cenário
 *    escolhido (Eclipse, Plasma, Fumaça/Monolito, Garagem, Água, Estúdio Claro,
 *    Brinquedos, Pet, Moda, Luxo Ouro etc.).
 *  - Auto-recorte de margens transparentes para exibir o produto BEM MAIOR e
 *    com troca dinâmica de 3 ângulos/planos dentro dos 4 segundos!
 * ============================================================================
 */
(function () {
  if (window.__NEXORA_CINEMA_UI_V15__) return;
  window.__NEXORA_CINEMA_UI_V15__ = true;

  const STORAGE_USED_PROMPTS = "nexora_used_prompt_ids_v15";
  const STORAGE_USED_TRACKS = "nexora_used_track_files_v15";

  const FALLBACK_MODELOS = [
    { id: 1, nome: "1. Gancho de Impacto + Demonstração Extrema", foco: "Retenção imediata e prova visual de resistência", previewVideo: "previews/modelo-01-impacto.mp4", dicaExemplo: "Ritmo de impacto e prova visual — 100% fiel ao seu produto." },
    { id: 2, nome: "2. Problema vs. Solução Visual", foco: "Dor cotidiana e alívio instantâneo em cena real", previewVideo: "previews/modelo-02-problema-solucao.mp4", dicaExemplo: "Virada visual problema → solução — 100% fiel ao seu produto." },
    { id: 3, nome: "3. Unboxing Cinematográfico / Reveal de Luxo", foco: "Iluminação sofisticada e percepção de alto valor", previewVideo: "previews/modelo-03-unboxing-luxo.mp4", dicaExemplo: "Estilo Reveal de Luxo — 100% fiel ao seu produto." },
    { id: 4, nome: "4. POV (Ponto de Vista) / Primeira Pessoa", foco: "Imersão real segurando ou usando o produto", previewVideo: "previews/modelo-04-pov.mp4", dicaExemplo: "Câmera em primeira pessoa (POV) — 100% fiel ao seu produto." },
    { id: 5, nome: "5. Antes e Depois / Transformação Rápida", foco: "Prova visual imediata de resultado", previewVideo: "previews/modelo-05-antes-depois.mp4", dicaExemplo: "Transformação visual Antes e Depois — 100% fiel ao seu produto." },
    { id: 6, nome: "6. Vitrine Dinâmica Multi-Ângulos / Hollywood Cut", foco: "Cortes cadenciados de alto impacto para conversão", previewVideo: "previews/modelo-06-hollywood-cut.mp4", dicaExemplo: "Ritmo cinematográfico multi-ângulos — 100% fiel ao seu produto." },
    { id: 7, nome: "7. UGC Autêntico / Achadinho Real", foco: "Estética natural, leve e confiável de comprador real", previewVideo: "previews/modelo-07-ugc-achadinho.mp4", dicaExemplo: "Estilo natural Achadinho Real TikTok Shop — 100% fiel ao seu produto." },
    { id: 8, nome: "8. ASMR Sensorial / Textura e Detalhe Macro", foco: "Closes suaves e sensoriais em detalhes reais", previewVideo: "previews/modelo-08-asmr-macro.mp4", dicaExemplo: "Closes macro sensoriais — 100% fiel ao seu produto." },
    { id: 9, nome: "9. Comparativo Direto / O Comum vs. O Nosso", foco: "Superioridade técnica sobre genéricos", previewVideo: "previews/modelo-09-comparativo.mp4", dicaExemplo: "Comparativo de superioridade visual — 100% fiel ao seu produto." },
    { id: 10, nome: "10. Estilo de Vida / Editorial Natural", foco: "Ambiente acolhedor, caimento real e desejo", previewVideo: "previews/modelo-10-lifestyle.mp4", dicaExemplo: "Editorial natural e fluido — 100% fiel ao seu produto." }
  ];

  const FALLBACK_TRILHAS = [
    { id: "moda_editorial",        nome: "👗 Moda & Editorial Natural (Leve & Sofisticada)",        descricao: "Pop editorial leve, natural e chic para roupas e estilo",       arquivoPreviewMp3: "tracks/moda-editorial-01.mp3" },
    { id: "brinquedos_alegre",     nome: "🧸 Brinquedos & Infantil (Alegre & Empolgante)",          descricao: "Batida divertida, vibrante e cheia de energia positiva",      arquivoPreviewMp3: "tracks/brinquedos-alegre-01.mp3" },
    { id: "pet_carinhoso",         nome: "🐾 Pet Shop & Família (Acolhedora & Feliz)",              descricao: "Pop acústico carinhoso, leve e caloroso para pets",           arquivoPreviewMp3: "tracks/pet-carinhoso-01.mp3" },
    { id: "luxo_asmr",             nome: "✨ Beleza, Perfumes & Luxo Sensorial",                    descricao: "Groove sedoso, luminoso e sofisticado",                       arquivoPreviewMp3: "tracks/luxo-asmr-01.mp3" },
    { id: "hollywood_phonk",       nome: "💎 Relógios, Joias & Luxo Dark Bass",                     descricao: "Grave limpo 808 e pulso elegante de alta joalheria",          arquivoPreviewMp3: "tracks/hollywood-phonk-01.mp3" },
    { id: "scifi_cyberpunk",       nome: "🚀 Tech, Gadgets & Futuro Eletrônico",                    descricao: "Sintetizadores modernos e pulso eletrônico limpo",            arquivoPreviewMp3: "tracks/scifi-cyberpunk-01.mp3" },
    { id: "impacto_industrial",    nome: "🔥 Esporte, Fitness & Impacto Dinâmico",                  descricao: "Percussão enérgica e sub-bass firme de alta retenção",        arquivoPreviewMp3: "tracks/impacto-industrial-01.mp3" },
    { id: "virada_dinamica",       nome: "🏠 Casa, Cozinha & Varejo TV (Pop Limpo)",                descricao: "Batida comercial alegre, limpa e confiável",                  arquivoPreviewMp3: "tracks/virada-dinamica-01.mp3" },
    { id: "lounge_executivo",      nome: "🕶️ Lifestyle & Lounge Moderno",                           descricao: "Groove moderno solar e descontraído",                         arquivoPreviewMp3: "tracks/lounge-executivo-01.mp3" },
    { id: "epico_cinematografico", nome: "🎬 Épico Cinematográfico de Superprodução",               descricao: "Percussão imponente de cinema para grandes lançamentos",      arquivoPreviewMp3: "tracks/epico-cinematografico-01.mp3" }
  ];

  // =========================================================================
  // DIRETOR CRIATIVO IA POR NICHO (CADA PRODUTO TEM SEU PRÓPRIO UNIVERSO!)
  // =========================================================================
  const NICHE_PROFILES = {
    moda_feminina: {
      id: "moda_feminina",
      nome: "Moda Feminina",
      badge: "👗 Moda Feminina • Editorial Suave",
      modeloId: 10,
      trilhaId: "moda_editorial",
      cenarioId: 38,
      cenarioNome: "#38 Estúdio Off-White Clean",
      pacing: "gentle",
      cutsMap: { 10: 5, 15: 8, 20: 11, 30: 16 },
      zoomPower: 0.52,
      sfxScale: 0.45,
      lightTheme: true,
      voiceGender: "female",
      voiceStyleId: "f13_lily_boutique",
      summaryHint: "5 cortes fluidos (~2,0s) • Luz natural editorial • Trilha leve",
      lyriaPrompt: "IMMEDIATE WARM CHIC EDITORIAL GROOVE AT 0:00, ZERO DARK TONE, ZERO HEAVY TRAP. Light natural modern fashion commercial pop-house soundtrack, airy warm Rhodes chords, soft crisp snap percussion, breezy smooth bassline, feminine boutique runway elegance, bright uplifting feel-good mastering, strictly instrumental, no vocals."
    },
    brinquedos: {
      id: "brinquedos",
      nome: "Brinquedos & Infantil",
      badge: "🧸 Brinquedos • Alegre & Empolgante",
      modeloId: 7,
      trilhaId: "brinquedos_alegre",
      cenarioId: 51,
      cenarioNome: "#51 UGC Review na Janela (Colorido & Alegre)",
      pacing: "balanced",
      cutsMap: { 10: 6, 15: 9, 20: 13, 30: 19 },
      zoomPower: 0.72,
      sfxScale: 0.62,
      lightTheme: true,
      voiceGender: "female",
      voiceStyleId: "f02_jessica_energia",
      summaryHint: "6 cortes alegres (~1,6s) • Cenário colorido • Trilha divertida",
      lyriaPrompt: "IMMEDIATE HAPPY PLAYFUL UPBEAT DROP AT 0:00, ZERO DARK OR AGGRESSIVE SOUND. Exciting joyful family and kids toy commercial soundtrack, bright marimba and sparkly cheerful synth melody, bouncy fun pop drums, playful energetic clapping rhythm, colorful magical excitement for children and parents, crisp bright TV commercial mastering, strictly instrumental, no vocals."
    },
    pet: {
      id: "pet",
      nome: "Pet Shop (Cães & Gatos)",
      badge: "🐾 Pet Shop • Carinhoso & Acolhedor",
      modeloId: 7,
      trilhaId: "pet_carinhoso",
      cenarioId: 60,
      cenarioNome: "#60 Quarto Minimalista & Luz Natural",
      pacing: "gentle",
      cutsMap: { 10: 5, 15: 8, 20: 11, 30: 16 },
      zoomPower: 0.50,
      sfxScale: 0.42,
      lightTheme: true,
      voiceGender: "female",
      voiceStyleId: "f20_laura_review",
      summaryHint: "5 cortes carinhosos (~2,0s) • Ambiente acolhedor • Trilha leve",
      lyriaPrompt: "IMMEDIATE HEARTWARMING FEEL-GOOD GROOVE AT 0:00, ZERO DARK OR HARSH SOUND. Warm cheerful pet-care commercial acoustic-pop soundtrack, bright friendly acoustic guitar strums, gentle bouncy light percussion, soft warm bass, cozy loving joyful family atmosphere, crisp clean TV mastering, strictly instrumental, no vocals."
    },
    beleza: {
      id: "beleza",
      nome: "Beleza & Skincare",
      badge: "💄 Beleza • Sensorial & Luminoso",
      modeloId: 8,
      trilhaId: "luxo_asmr",
      cenarioId: 96,
      cenarioNome: "#96 Penteadeira Carrara Clean",
      pacing: "gentle",
      cutsMap: { 10: 5, 15: 8, 20: 11, 30: 16 },
      zoomPower: 0.55,
      sfxScale: 0.48,
      lightTheme: true,
      voiceGender: "female",
      voiceStyleId: "f16_matilda_beauty",
      summaryHint: "5 cortes suaves (~2,0s) • Mármore claro & macro • Trilha sensorial",
      lyriaPrompt: "IMMEDIATE SILKY LUMINOUS BEAUTY GROOVE AT 0:00. Upscale modern skincare and cosmetics commercial soundtrack, lush airy synth pads, soft crisp modern beat, silky warm sub-bass, sparkling delicate chimes, clean spa-luxury radiance, glossy ad-agency mastering, strictly instrumental, no vocals."
    },
    perfumes: {
      id: "perfumes",
      nome: "Perfumaria & Fragrâncias",
      badge: "🌸 Perfumaria • Luxo Sensorial",
      modeloId: 3,
      trilhaId: "luxo_asmr",
      cenarioId: 21,
      cenarioNome: "#21 Mármore Nero & Ouro",
      pacing: "gentle",
      cutsMap: { 10: 5, 15: 8, 20: 11, 30: 16 },
      zoomPower: 0.58,
      sfxScale: 0.55,
      lightTheme: false,
      voiceGender: "female",
      voiceStyleId: "f11_charlotte_luxo",
      summaryHint: "5 cortes envolventes (~2,0s) • Brilho & névoa fina • Trilha luxo",
      lyriaPrompt: "IMMEDIATE SENSUAL LUXURY PERFUME GROOVE AT 0:00. High-fashion Parisian fragrance commercial soundtrack, deep velvet warm sub-bass, sleek sensual slow-burn house pulse, shimmering golden atmospheric chords, captivating elegance, pristine theatrical mastering, strictly instrumental, no vocals."
    },
    relogios: {
      id: "relogios",
      nome: "Relógios & Joalheria",
      badge: "⌚ Relógios & Luxo • Alta Precisão",
      modeloId: 6,
      trilhaId: "hollywood_phonk",
      cenarioId: 101,
      cenarioNome: "#101 Eclipse Vulcânico & Faíscas Ouro",
      pacing: "balanced",
      cutsMap: { 10: 6, 15: 9, 20: 13, 30: 19 },
      zoomPower: 0.78,
      sfxScale: 0.85,
      lightTheme: false,
      voiceGender: "male",
      voiceStyleId: "m11_daniel_luxo",
      summaryHint: "6 cortes precisos (~1,6s) • Joalheria & eclipse ouro • Bass luxo",
      lyriaPrompt: "IMMEDIATE SLEEK LUXURY WATCH COMMERCIAL DROP AT 0:00. High-end luxury timepiece and jewelry advertisement soundtrack, deep clean punchy 808 sub-bass pulse, razor-crisp minimalist hi-hats, confident dark-chrome synth stabs, authoritative refined energy, pristine broadcast mastering, strictly instrumental, no vocals."
    },
    oculos: {
      id: "oculos",
      nome: "Óculos & Estilo Solar",
      badge: "🕶️ Óculos • Solar & Lifestyle",
      modeloId: 10,
      trilhaId: "lounge_executivo",
      cenarioId: 59,
      cenarioNome: "#59 Varanda Golden Hour",
      pacing: "balanced",
      cutsMap: { 10: 6, 15: 9, 20: 13, 30: 19 },
      zoomPower: 0.68,
      sfxScale: 0.68,
      lightTheme: true,
      voiceGender: "male",
      voiceStyleId: "m03_charlie_tiktok",
      summaryHint: "6 cortes estilosos (~1,6s) • Luz dourada solar • Lounge moderno",
      lyriaPrompt: "IMMEDIATE STYLISH SUNSET LOUNGE-HOUSE DROP AT 0:00. Cool modern eyewear and summer fashion commercial track, groovy rubbery warm bassline, crisp upbeat house rhythm, sunlit stylish synth chords, confident cosmopolitan vibe, clean radio mastering, strictly instrumental, no vocals."
    },
    calcados: {
      id: "calcados",
      nome: "Calçados & Esporte",
      badge: "👟 Calçados • Energia & Ritmo",
      modeloId: 1,
      trilhaId: "impacto_industrial",
      cenarioId: 31,
      cenarioNome: "#31 Arena Fitness & Energia",
      pacing: "balanced",
      cutsMap: { 10: 6, 15: 9, 20: 13, 30: 19 },
      zoomPower: 0.80,
      sfxScale: 0.88,
      lightTheme: false,
      voiceGender: "male",
      voiceStyleId: "m22_callum_fitness",
      summaryHint: "6 cortes esportivos (~1,6s) • Cenário urbano/arena • Impacto",
      lyriaPrompt: "IMMEDIATE ATHLETIC SPORTSWEAR COMMERCIAL DROP AT 0:00. High-energy sneaker and sports advertisement soundtrack, punchy driving electronic kick and snare, heavy athletic sub-bass bounce, crisp energetic percussion, unstoppable momentum, pristine ad-agency mastering, strictly instrumental, no vocals."
    },
    eletronicos: {
      id: "eletronicos",
      nome: "Tech & Eletrônicos",
      badge: "🚀 Tech & Gadgets • Inovação 3D",
      modeloId: 6,
      trilhaId: "scifi_cyberpunk",
      cenarioId: 102,
      cenarioNome: "#102 Reator Plasma Sci-Fi & Energia",
      pacing: "balanced",
      cutsMap: { 10: 6, 15: 9, 20: 13, 30: 19 },
      zoomPower: 0.78,
      sfxScale: 0.85,
      lightTheme: false,
      voiceGender: "male",
      voiceStyleId: "m23_will_tech",
      summaryHint: "6 cortes tech (~1,6s) • Reator plasma & neon • Eletrônica",
      lyriaPrompt: "IMMEDIATE MODERN TECH-LAUNCH ELECTRONIC DROP AT 0:00. Sleek futuristic gadget commercial soundtrack, driving clean analog synth bass pulse, punchy tight electronic percussion, sparkling hi-tech arpeggios, crisp modern innovation energy, ultra-clean mastering, strictly instrumental, no vocals."
    },
    suplementos: {
      id: "suplementos",
      nome: "Suplementos & Saúde",
      badge: "💪 Suplementos • Energia & Foco",
      modeloId: 1,
      trilhaId: "impacto_industrial",
      cenarioId: 31,
      cenarioNome: "#31 Arena Fitness & Energia",
      pacing: "balanced",
      cutsMap: { 10: 6, 15: 9, 20: 13, 30: 19 },
      zoomPower: 0.76,
      sfxScale: 0.80,
      lightTheme: false,
      voiceGender: "male",
      voiceStyleId: "m22_callum_fitness",
      summaryHint: "6 cortes fortes (~1,6s) • Arena fitness • Batida motivacional",
      lyriaPrompt: "IMMEDIATE ENERGETIC FITNESS COMMERCIAL DROP AT 0:00. Powerful modern athletic nutrition advertisement beat, tight punchy drums, deep motivating bassline, crisp uplifting electronic stabs, confident vitality, broadcast mastering, strictly instrumental, no vocals."
    },
    casa: {
      id: "casa",
      nome: "Casa, Cozinha & Utilidades",
      badge: "🏠 Casa & Utilidades • Claro & Prático",
      modeloId: 2,
      trilhaId: "virada_dinamica",
      cenarioId: 58,
      cenarioNome: "#58 Cozinha Manhã & Luz Natural",
      pacing: "balanced",
      cutsMap: { 10: 6, 15: 9, 20: 13, 30: 19 },
      zoomPower: 0.62,
      sfxScale: 0.58,
      lightTheme: true,
      voiceGender: "female",
      voiceStyleId: "f03_sarah_comercial",
      summaryHint: "6 cortes claros (~1,6s) • Ambiente iluminado • Pop varejo",
      lyriaPrompt: "IMMEDIATE UPBEAT MODERN HOME COMMERCIAL GROOVE AT 0:00. Clean cheerful retail TV advertisement pop-funk soundtrack, bright crisp percussion, friendly groovy bassline, positive modern chords, high-trust welcoming vibe, pristine broadcast mastering, strictly instrumental, no vocals."
    },
    universal: {
      id: "universal",
      nome: "Comercial Universal Pro",
      badge: "✨ Universal Pro • Alta Conversão",
      modeloId: 6,
      trilhaId: "hollywood_phonk",
      cenarioId: 101,
      cenarioNome: "#101 Eclipse Vulcânico & Faíscas Ouro",
      pacing: "balanced",
      cutsMap: { 10: 6, 15: 9, 20: 13, 30: 19 },
      zoomPower: 0.72,
      sfxScale: 0.78,
      lightTheme: false,
      voiceGender: "male",
      voiceStyleId: "m01_roger_viral",
      summaryHint: "6 cortes equilibrados (~1,6s) • Vitrine cinema • Trilha viral",
      lyriaPrompt: "IMMEDIATE MODERN COMMERCIAL ELECTRONIC DROP AT 0:00. Sleek flagship e-commerce advertisement soundtrack, punchy deep sub-bass groove, tight crisp drums, confident stylish synth hook, wide clean broadcast mastering, strictly instrumental, no vocals."
    }
  };

  window.NEXORA_NICHE_PROFILES = NICHE_PROFILES;

  function detectNicheFromText(nome, detalhes) {
    const s = `${nome || ""} ${detalhes || ""}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    if (/\b(pet|cachorro|cao|caes|gato|gatos|felino|canino|coleira|peitoral|guia\s*pet|caminha\s*(pet|para\s*cao|cachorro|gato)|arranhador|comedouro|bebedouro\s*pet|racao|petisco|areia\s*higienica|tapete\s*higienico)\b/.test(s)) {
      return "pet";
    }
    if (/\b(brinquedo|boneca|boneco|carrinho\s*infantil|controle\s*remoto|lego|pelucia|urso\s*de\s*pelucia|infantil|crianca|bebe|baby|chocalho|quebra.?cabeca|montar|slime|massinha|patinete|bicicleta\s*infantil|jogo\s*educativo|pistola\s*de\s*agua|bolha\s*de\s*sabao)\b/.test(s)) {
      return "brinquedos";
    }
    if (/\b(vestido|saia|blusa|cropped|lingerie|biquini|maio|body\s*feminino|macacao\s*feminino|calca\s*legging|legging|conjuntinho|moda\s*feminina|roupa\s*feminina|salto\s*alto|sandalia\s*feminina|scarpin|bolsa\s*feminina|clutch|kimono|cardigan|tricot|sutia|calcinha)\b/.test(s)) {
      return "moda_feminina";
    }
    if (/\b(relogio|smartwatch|cronografo|watch|tonneau|pulseira\s*de\s*aco|joia|alianca|colar|corrente|anel|brinco|pingente)\b/.test(s)) {
      return "relogios";
    }
    if (/\b(perfume|colonia|fragrancia|body\s*splash|parfum|eau\s*de|arabe|sabah|essencia)\b/.test(s)) {
      return "perfumes";
    }
    if (/\b(serum|skincare|creme|hidratante|maquiagem|batom|base\s*facial|rimel|mascara\s*facial|shampoo|condicionador|escova\s*(alisadora|rotativa|secadora)|chapinha|secador|protetor\s*solar|cosmetico|gloss|blush|esfoliante)\b/.test(s)) {
      return "beleza";
    }
    if (/\b(vr|headset|realidade\s*virtual|fone|earbud|airpod|headphone|mouse|teclado|caixa\s*de\s*som|carregador|power\s*bank|camera|drone|celular|smartphone|gamer|microfone|lapela|projetor|led|gadget|eletronico|console)\b/.test(s)) {
      return "eletronicos";
    }
    if (/\b(tenis|sapato|bota|chuteira|sneaker|corrida|calcado|chinelo|sapatenis|sapatilha)\b/.test(s)) {
      return "calcados";
    }
    if (/\b(oculos|armacao|lente\s*solar|polarizad|aviador|wayfarer)\b/.test(s)) {
      return "oculos";
    }
    if (/\b(whey|creatina|suplemento|vitamina|proteina|pre.?treino|colageno|magnesio|omega|bcaa|melatonina)\b/.test(s)) {
      return "suplementos";
    }
    if (/\b(cozinha|garrafa|copo\s*termico|stanley|cafeteira|panela|frigideira|airfryer|liquidificador|aspirador|mop|ferramenta|parafusadeira|automotivo|carro|organizador|luminaria|travesseiro|lencol|toalha)\b/.test(s)) {
      return "casa";
    }
    if (/\b(camiseta|camisa|jaqueta|moletom|calca|bermuda|short|roupa|bolsa|mochila|carteira)\b/.test(s)) {
      return "moda_feminina";
    }
    return "universal";
  }

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
    modoCenario: "melhor_opcao", // NOVO: Melhor Opção também para o Cenário (105 Universos)!
    cenarioAutoTravadoId: 101,
    cenarioManualObj: null,
    fonteTrilha: "lyria2",
    ultimaCategoria: "universal",
    userTouchedVoice: false,
    previewAudioEl: null,
    synthCtx: null,
    synthTimer: null,
    synthPlaying: false,
    previewRafId: 0,
    trimmedPreviewCache: new Map(), // src -> offscreen cropped canvas (produto grande!)
    previewAngleSlots: { front: null, side: null, top: null },
    lastThumbSrc: "",
    lastKitSig: ""
  };

  window.__NEXORA_CINEMA_STATE__ = state;
  window.NEXORA_GET_NICHE_PROFILE = function () {
    return NICHE_PROFILES[state.ultimaCategoria] || NICHE_PROFILES.universal;
  };
  window.NEXORA_DETECT_NICHE = detectNicheFromText;
  window.NEXORA_IS_MANUAL_SCENARIO = function () {
    return state.modoCenario === "manual";
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
    return state.modoModelo === "manual" ? Number(state.modeloManualId) : Number(state.modeloAutoTravadoId || 6);
  }

  function getActiveTrilhaPreferida() {
    return state.modoTrilha === "manual" ? state.trilhaManualId : (state.trilhaAutoTravadaId || "hollywood_phonk");
  }

  function getActiveScenarioObj() {
    if (typeof window.__NEXORA_GET_SELECTED_VIDEO_MODEL__ === "function") {
      try {
        const m = window.__NEXORA_GET_SELECTED_VIDEO_MODEL__();
        if (m) return m;
      } catch {}
    }
    const prof = window.NEXORA_GET_NICHE_PROFILE();
    return { id: prof.cenarioId || 101, name: prof.cenarioNome || "#101 Eclipse Vulcânico & Faíscas Ouro", cat: "Master10" };
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
  // PRÉVIA MUSICAL INSTANTÂNEA EM WEBAUDIO (0 SEGUNDOS • 0 CRÉDITOS • 10 ESTILOS)
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
      moda_editorial:        { bpm: 112, bass: [65.4, 73.4, 82.4, 73.4], lead: [329.6, 392, 493.9, 392, 329.6, 392, 440, 392], wave: "sine",     hat: true,  kickPunch: 88,  soft: true },
      brinquedos_alegre:     { bpm: 128, bass: [130.8, 146.8, 164.8, 196], lead: [523.3, 659.3, 784, 659.3, 587.3, 659.3, 784, 1046.5], wave: "triangle", hat: true,  kickPunch: 112, soft: true },
      pet_carinhoso:         { bpm: 110, bass: [98, 110, 130.8, 98],     lead: [392, 440, 493.9, 587.3, 493.9, 440, 392, 329.6], wave: "sine",     hat: false, kickPunch: 82,  soft: true },
      impacto_industrial:    { bpm: 128, bass: [55, 55, 65.4, 49],       lead: [220, 0, 261.6, 220, 196, 0, 220, 293.7], wave: "sawtooth", hat: true,  kickPunch: 150, soft: false },
      hollywood_phonk:       { bpm: 130, bass: [49, 49, 58.3, 43.7],     lead: [392, 466.2, 392, 349.2, 392, 0, 523.3, 466.2], wave: "triangle", hat: true,  kickPunch: 135, soft: false },
      scifi_cyberpunk:       { bpm: 124, bass: [65.4, 65.4, 73.4, 61.7], lead: [261.6, 329.6, 392, 523.3, 493.9, 392, 329.6, 293.7], wave: "sawtooth", hat: true,  kickPunch: 120, soft: false },
      luxo_asmr:             { bpm: 106, bass: [55, 55, 49, 43.7],       lead: [220, 0, 329.6, 0, 293.7, 0, 246.9, 0], wave: "sine",     hat: false, kickPunch: 90,  soft: true },
      lounge_executivo:      { bpm: 114, bass: [65.4, 58.3, 55, 49],     lead: [329.6, 392, 440, 392, 329.6, 293.7, 261.6, 293.7], wave: "sine",     hat: true,  kickPunch: 98,  soft: true },
      epico_cinematografico: { bpm: 120, bass: [43.7, 43.7, 49, 55],     lead: [174.6, 220, 261.6, 349.2, 329.6, 261.6, 220, 293.7], wave: "sawtooth", hat: false, kickPunch: 158, soft: false },
      virada_dinamica:       { bpm: 122, bass: [65.4, 73.4, 82.4, 98],   lead: [329.6, 392, 440, 523.3, 440, 392, 329.6, 392], wave: "triangle", hat: true,  kickPunch: 115, soft: true }
    };
    const p = PROFILES[trackId] || PROFILES.hollywood_phonk;
    const ac = new AC();
    state.synthCtx = ac;
    state.synthPlaying = true;

    const master = ac.createGain();
    master.gain.value = p.soft ? 0.45 : 0.54;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -12; comp.ratio.value = 4;
    master.connect(comp);
    comp.connect(ac.destination);

    const nLen = Math.floor(ac.sampleRate * 0.08);
    const nBuf = ac.createBuffer(1, nLen, ac.sampleRate);
    const nd = nBuf.getChannelData(0);
    for (let i = 0; i < nLen; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / nLen);

    const stepSec = 60 / p.bpm / 2;
    const totalSteps = 32;
    const t0 = ac.currentTime + 0.04;

    for (let s = 0; s < totalSteps; s++) {
      const t = t0 + s * stepSec;
      if (s % 4 === 0 || (!p.soft && p.hat && s % 8 === 6)) {
        const osc = ac.createOscillator();
        const g = ac.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(p.kickPunch, t);
        osc.frequency.exponentialRampToValueAtTime(p.soft ? 46 : 36, t + 0.14);
        g.gain.setValueAtTime(p.soft ? 0.55 : 0.85, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.20);
        osc.connect(g); g.connect(master);
        osc.start(t); osc.stop(t + 0.22);
      }
      if (s % 4 === 0) {
        const bFreq = p.bass[Math.floor(s / 8) % p.bass.length];
        const bOsc = ac.createOscillator();
        const bLp = ac.createBiquadFilter();
        bLp.type = "lowpass"; bLp.frequency.value = p.soft ? 320 : 210;
        const bg = ac.createGain();
        bOsc.type = p.soft ? "sine" : "triangle";
        bOsc.frequency.setValueAtTime(bFreq, t);
        bg.gain.setValueAtTime(0.001, t);
        bg.gain.linearRampToValueAtTime(p.soft ? 0.36 : 0.55, t + 0.03);
        bg.gain.exponentialRampToValueAtTime(0.001, t + stepSec * 3.8);
        bOsc.connect(bLp); bLp.connect(bg); bg.connect(master);
        bOsc.start(t); bOsc.stop(t + stepSec * 3.9);
      }
      if (s % 8 === 4) {
        const sn = ac.createBufferSource();
        sn.buffer = nBuf;
        const bp = ac.createBiquadFilter();
        bp.type = "bandpass"; bp.frequency.value = p.soft ? 2400 : 1800; bp.Q.value = 0.9;
        const sg = ac.createGain();
        sg.gain.setValueAtTime(p.soft ? 0.20 : 0.32, t);
        sg.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        sn.connect(bp); bp.connect(sg); sg.connect(master);
        sn.start(t); sn.stop(t + 0.09);
      }
      if (p.hat && s % 2 === 1) {
        const hh = ac.createBufferSource();
        hh.buffer = nBuf;
        const hp = ac.createBiquadFilter();
        hp.type = "highpass"; hp.frequency.value = 7200;
        const hg = ac.createGain();
        hg.gain.setValueAtTime(p.soft ? 0.09 : 0.14, t);
        hg.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
        hh.connect(hp); hp.connect(hg); hg.connect(master);
        hh.start(t); hh.stop(t + 0.055);
      }
      const note = p.lead[s % p.lead.length];
      if (note > 0) {
        const lOsc = ac.createOscillator();
        const lp = ac.createBiquadFilter();
        lp.type = "lowpass"; lp.frequency.value = p.wave === "sawtooth" ? 1350 : 2800;
        const lg = ac.createGain();
        lOsc.type = p.wave;
        lOsc.frequency.setValueAtTime(note, t);
        lg.gain.setValueAtTime(0.001, t);
        lg.gain.linearRampToValueAtTime(p.soft ? 0.22 : 0.18, t + 0.015);
        lg.gain.exponentialRampToValueAtTime(0.001, t + stepSec * 1.45);
        lOsc.connect(lp); lp.connect(lg); lg.connect(master);
        lOsc.start(t); lOsc.stop(t + stepSec * 1.55);
      }
    }

    const totalMs = Math.round(totalSteps * stepSec * 1000) + 250;
    state.synthTimer = setTimeout(() => {
      stopAnyTrackPreview();
      if (onEnd) onEnd();
    }, totalMs);
    return true;
  }

  // =========================================================================
  // AUTO-RECORTE DE MARGENS TRANSPARENTES (DEIXA O PRODUTO BEM GRANDE NA PRÉVIA!)
  // =========================================================================
  function createTightCroppedCanvas(img) {
    try {
      const sw = img.naturalWidth || img.width || 0;
      const sh = img.naturalHeight || img.height || 0;
      if (!sw || !sh) return img;
      const scanW = Math.min(240, sw);
      const scanH = Math.min(420, sh);
      const sc = document.createElement("canvas");
      sc.width = scanW; sc.height = scanH;
      const sx = sc.getContext("2d", { willReadFrequently: true });
      sx.drawImage(img, 0, 0, scanW, scanH);
      const data = sx.getImageData(0, 0, scanW, scanH).data;

      let minX = scanW, minY = scanH, maxX = 0, maxY = 0;
      let hasTransparency = false;
      for (let i = 3; i < data.length; i += 16) {
        if (data[i] < 200) { hasTransparency = true; break; }
      }
      for (let y = 0; y < scanH; y += 2) {
        for (let x = 0; x < scanW; x += 2) {
          const p = (y * scanW + x) * 4;
          const a = data[p + 3];
          const isContent = hasTransparency
            ? a > 24
            : !(data[p] > 242 && data[p + 1] > 242 && data[p + 2] > 242);
          if (isContent) {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (maxX <= minX + 4 || maxY <= minY + 4) return img;
      const padX = Math.round((maxX - minX) * 0.05);
      const padY = Math.round((maxY - minY) * 0.05);
      const rx = Math.max(0, Math.floor(((minX - padX) / scanW) * sw));
      const ry = Math.max(0, Math.floor(((minY - padY) / scanH) * sh));
      const rw = Math.min(sw - rx, Math.ceil(((maxX - minX + padX * 2) / scanW) * sw));
      const rh = Math.min(sh - ry, Math.ceil(((maxY - minY + padY * 2) / scanH) * sh));
      if (rw < 16 || rh < 16) return img;

      const out = document.createElement("canvas");
      const maxOut = 480;
      const scaleOut = Math.min(1, maxOut / Math.max(rw, rh));
      out.width = Math.max(16, Math.round(rw * scaleOut));
      out.height = Math.max(16, Math.round(rh * scaleOut));
      out.getContext("2d").drawImage(img, rx, ry, rw, rh, 0, 0, out.width, out.height);
      return out;
    } catch {
      return img;
    }
  }

  function loadTrimmedAngleSrc(src, slotName) {
    if (!src) return;
    if (state.trimmedPreviewCache.has(src)) {
      state.previewAngleSlots[slotName] = state.trimmedPreviewCache.get(src);
      return;
    }
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => {
      const tight = createTightCroppedCanvas(im);
      state.trimmedPreviewCache.set(src, tight);
      state.previewAngleSlots[slotName] = tight;
    };
    im.onerror = () => {
      const im2 = new Image();
      im2.onload = () => {
        state.trimmedPreviewCache.set(src, im2);
        state.previewAngleSlots[slotName] = im2;
      };
      im2.src = src;
    };
    im.src = src;
  }

  function syncPreviewProductAngles() {
    const thumb = document.getElementById("thumbPreview");
    const thumbSrc = thumb && thumb.getAttribute("src") ? thumb.getAttribute("src") : "";
    if (thumbSrc && thumbSrc !== state.lastThumbSrc) {
      state.lastThumbSrc = thumbSrc;
      state.previewAngleSlots.front = null;
      state.previewAngleSlots.side = null;
      state.previewAngleSlots.top = null;
      loadTrimmedAngleSrc(thumbSrc, "front");
    }

    // Se o usuário já gerou o Kit 6 Ângulos, puxa os ângulos reais automaticamente na prévia de 4s!
    const kit = Array.isArray(window.nexora3Angles) ? window.nexora3Angles : [];
    const sig = kit.map((k) => `${k.key}:${k.url}`).join("|");
    if (sig && sig !== state.lastKitSig) {
      state.lastKitSig = sig;
      const byK = new Map(kit.map((k) => [k.key || k.angle, k.dataUrl || k.url]));
      const fSrc = byK.get("frontal") || thumbSrc;
      const sSrc = byK.get("right_45") || byK.get("bottom_up") || byK.get("left_60") || "";
      const tSrc = byK.get("top_down") || byK.get("bottom_up") || byK.get("right_45") || "";
      if (fSrc) loadTrimmedAngleSrc(fSrc, "front");
      if (sSrc) loadTrimmedAngleSrc(sSrc, "side");
      if (tSrc) loadTrimmedAngleSrc(tSrc, "top");
    }
  }

  // =========================================================================
  // MOTOR VISUAL DE CENÁRIOS NA PRÉVIA 4s (MUDA AO VIVO CONFORME O CENÁRIO!)
  // =========================================================================
  function getScenarioVisualTheme(scenObj, nicheProf) {
    const id = Number(scenObj?.id) || 101;
    const txt = `${scenObj?.name || ""} ${scenObj?.desc || ""} ${scenObj?.lighting || ""} ${scenObj?.surface || ""} ${scenObj?.cat || ""}`
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    if (state.modoCenario === "melhor_opcao") {
      if (nicheProf.id === "brinquedos") {
        return { kind: "toys", bg1: "#233966", bg2: "#3b1d5a", accent: "#fbbf24", glow: "#38bdf8", lightText: false, tag: "Brinquedos Alegre" };
      }
      if (nicheProf.id === "pet") {
        return { kind: "warm_home", bg1: "#3d3324", bg2: "#1f1912", accent: "#fb923c", glow: "#fde68a", lightText: false, tag: "Casa Acolhedora" };
      }
      if (nicheProf.id === "moda_feminina") {
        return { kind: "white_studio", bg1: "#f5efe6", bg2: "#dfd4c5", accent: "#d97706", glow: "#ffffff", lightText: true, tag: "Editorial Boutique" };
      }
    }

    if (id === 101 || id === 1 || /\b(eclipse|vulcan|brasa|forja)\b/.test(txt)) {
      return { kind: "eclipse", bg1: "#1f1407", bg2: "#070609", accent: "#f59e0b", glow: "#fef08a", lightText: false, tag: "Eclipse & Faíscas" };
    }
    if (id === 102 || id === 6 || id === 9 || id === 35 || /\b(plasma|reator|cyberpunk|sci.?fi|neon|orbital)\b/.test(txt)) {
      return { kind: "plasma", bg1: "#082238", bg2: "#050914", accent: "#38bdf8", glow: "#22d3ee", lightText: false, tag: "Plasma Sci-Fi" };
    }
    if (id === 104 || /\b(ring.?light|monolito)\b/.test(txt)) {
      return { kind: "noir_ring", bg1: "#161b26", bg2: "#05070c", accent: "#e2e8f0", glow: "#93c5fd", lightText: false, tag: "Monolito & Ring" };
    }
    if (id === 103 || id === 18 || id === 16 || id === 40 || /\b(fumaca|ardosia|vapor|holofote|noir|imax)\b/.test(txt)) {
      return { kind: "smoke_spot", bg1: "#1a202c", bg2: "#06080d", accent: "#cbd5e1", glow: "#fbbf24", lightText: false, tag: "Holofote & Fumaça" };
    }
    if (id === 105 || id === 5 || id === 44 || id === 97 || id === 32 || /\b(garagem|supercarro|cockpit|pit.?lane|halo vermelho)\b/.test(txt)) {
      return { kind: "garage", bg1: "#240d12", bg2: "#08090e", accent: "#ef4444", glow: "#f59e0b", lightText: false, tag: "Garagem Dark LED" };
    }
    if (id === 14 || id === 90 || id === 92 || id === 12 || id === 11 || id === 28 || /\b(agua|praia|gelo|cristal|neve|subzero)\b/.test(txt)) {
      return { kind: "water_ice", bg1: "#0d293b", bg2: "#06111c", accent: "#38bdf8", glow: "#e0f2fe", lightText: false, tag: "Água & Cristal" };
    }
    if (id === 38 || id === 88 || id === 96 || id === 57 || id === 29 || /\b(off.?white|branco|carrara|travertino|penteadeira)\b/.test(txt)) {
      return { kind: "white_studio", bg1: "#f1f5f9", bg2: "#cbd5e1", accent: "#0ea5e9", glow: "#ffffff", lightText: true, tag: "Estúdio Claro" };
    }
    if (/\b(ugc|janela|cozinha|varanda|cafe|quarto|sol|manha|dunas|golden|montanha|rooftop|hall)\b/.test(txt)) {
      return { kind: "warm_home", bg1: "#3a2e1d", bg2: "#16120c", accent: "#fbbf24", glow: "#fde68a", lightText: false, tag: "Luz Solar Natural" };
    }
    if (id === 31 || id === 42 || id === 56 || id === 79 || /\b(arena|fitness|academia|treino)\b/.test(txt)) {
      return { kind: "arena", bg1: "#0f291c", bg2: "#060b0f", accent: "#22c55e", glow: "#86efac", lightText: false, tag: "Arena & Energia" };
    }
    return { kind: "luxury_gold", bg1: "#1f180b", bg2: "#07080d", accent: "#eab308", glow: "#fef08a", lightText: false, tag: "Luxo & Brilho" };
  }

  function renderScenarioBackdrop(g, W, H, elapsed, cutIdx, p, theme, particles) {
    // 1) Base gradiente do cenário escolhido
    const bg = g.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, cutIdx === 1 ? theme.bg2 : theme.bg1);
    bg.addColorStop(1, cutIdx === 1 ? theme.bg1 : theme.bg2);
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);

    // 2) Elementos arquitetônicos/visuais reais de cada tipo de cenário
    g.save();
    if (theme.kind === "eclipse") {
      // Eclipse solar dourado brilhando atrás do produto
      const cx = W * 0.5, cy = H * 0.36;
      const rGlow = g.createRadialGradient(cx, cy, W * 0.16, cx, cy, W * 0.55);
      rGlow.addColorStop(0, "rgba(254,240,138,0.85)");
      rGlow.addColorStop(0.28, "rgba(245,158,11,0.45)");
      rGlow.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = rGlow;
      g.fillRect(0, 0, W, H);
      g.fillStyle = "#080609";
      g.beginPath(); g.arc(cx, cy, W * 0.21, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "#fde047";
      g.lineWidth = 2.2;
      g.beginPath(); g.arc(cx, cy, W * 0.215, 0, Math.PI * 2); g.stroke();
    } else if (theme.kind === "plasma") {
      // Anéis concêntricos de plasma ciano pulsando em túnel 3D
      const cx = W * 0.5, cy = H * 0.42;
      for (let k = 0; k < 4; k++) {
        const rr = ((k * 0.25 + elapsed * 0.35) % 1) * W * 0.68 + 14;
        g.strokeStyle = `rgba(56,189,248,${(1 - rr / (W * 0.72)).toFixed(2)})`;
        g.lineWidth = 2;
        g.beginPath(); g.arc(cx, cy, rr, 0, Math.PI * 2); g.stroke();
      }
    } else if (theme.kind === "noir_ring" || theme.kind === "smoke_spot") {
      // Feixe de holofote superior + anel suspenso / nuvens de fumaça
      const beam = g.createLinearGradient(W * 0.5, 0, W * 0.5, H * 0.78);
      beam.addColorStop(0, "rgba(255,255,255,0.28)");
      beam.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = beam;
      g.beginPath();
      g.moveTo(W * 0.32, 0); g.lineTo(W * 0.68, 0);
      g.lineTo(W * 0.98, H * 0.82); g.lineTo(W * 0.02, H * 0.82);
      g.closePath(); g.fill();
      if (theme.kind === "noir_ring") {
        g.strokeStyle = "rgba(241,245,249,0.75)";
        g.lineWidth = 2.5;
        g.beginPath(); g.ellipse(W * 0.5, H * 0.16, W * 0.26, 9, 0, 0, Math.PI * 2); g.stroke();
      } else {
        for (let k = 0; k < 4; k++) {
          const sx = W * (0.2 + 0.6 * ((k * 0.31 + elapsed * 0.08) % 1));
          const sy = H * (0.35 + k * 0.11);
          const sm = g.createRadialGradient(sx, sy, 4, sx, sy, 48);
          sm.addColorStop(0, "rgba(203,213,225,0.18)");
          sm.addColorStop(1, "rgba(0,0,0,0)");
          g.fillStyle = sm;
          g.fillRect(0, 0, W, H);
        }
      }
    } else if (theme.kind === "garage") {
      // Faróis/LEDs vermelhos e âmbar desfocados atrás + reflexo no chão
      const l1 = g.createRadialGradient(W * 0.22, H * 0.44, 4, W * 0.22, H * 0.44, 44);
      l1.addColorStop(0, "rgba(239,68,68,0.65)"); l1.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = l1; g.fillRect(0, 0, W, H);
      const l2 = g.createRadialGradient(W * 0.78, H * 0.44, 4, W * 0.78, H * 0.44, 44);
      l2.addColorStop(0, "rgba(245,158,11,0.55)"); l2.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = l2; g.fillRect(0, 0, W, H);
    } else if (theme.kind === "water_ice") {
      // Ondas e reflexos de água na parte inferior
      for (let k = 0; k < 4; k++) {
        const ry = H * 0.66 + k * 14 + Math.sin(elapsed * 3 + k) * 3;
        g.strokeStyle = `rgba(125,211,252,${(0.32 - k * 0.06).toFixed(2)})`;
        g.lineWidth = 1.6;
        g.beginPath(); g.ellipse(W * 0.5, ry, W * (0.28 + k * 0.11), 6, 0, 0, Math.PI * 2); g.stroke();
      }
    } else if (theme.kind === "white_studio" || theme.kind === "warm_home") {
      // Raios solares diagonais suaves de janela / estúdio editorial
      const sun = g.createLinearGradient(0, 0, W, H * 0.75);
      sun.addColorStop(0, theme.lightText ? "rgba(255,255,255,0.65)" : "rgba(253,230,138,0.34)");
      sun.addColorStop(0.55, "rgba(255,255,255,0.06)");
      sun.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = sun;
      g.fillRect(0, 0, W, H);
    } else {
      // Halo radial luxo / arena / brinquedos
      const rad = g.createRadialGradient(W * 0.5, H * 0.43, 8, W * 0.5, H * 0.43, W * 0.78);
      rad.addColorStop(0, theme.accent + "55");
      rad.addColorStop(0.58, theme.glow + "1a");
      rad.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = rad;
      g.fillRect(0, 0, W, H);
    }
    g.restore();

    // 3) Pedestal / superfície sutil embaixo do produto
    g.save();
    const ped = g.createRadialGradient(W * 0.5, H * 0.73, 6, W * 0.5, H * 0.73, W * 0.45);
    ped.addColorStop(0, theme.lightText ? "rgba(15,23,42,0.16)" : "rgba(255,255,255,0.12)");
    ped.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = ped;
    g.beginPath(); g.ellipse(W * 0.5, H * 0.73, W * 0.42, 16, 0, 0, Math.PI * 2); g.fill();
    g.restore();

    // 4) Partículas vivas adaptadas ao cenário
    g.save();
    for (const pt of particles) {
      const px = ((pt.x + Math.sin(elapsed * 0.95 + pt.ph) * 0.06 + 1) % 1) * W;
      const py = ((pt.y - elapsed * pt.sp + 2) % 1) * H;
      g.globalAlpha = (theme.lightText ? 0.28 : 0.35) + 0.42 * Math.abs(Math.sin(elapsed * 2.2 + pt.ph));
      if (theme.kind === "toys") {
        const cols = ["#fbbf24", "#38bdf8", "#f472b6", "#4ade80"];
        g.fillStyle = cols[Math.floor(pt.ph) % cols.length];
        g.fillRect(px, py, pt.r * 2.2, pt.r * 1.4);
      } else {
        g.fillStyle = pt.ph % 2 > 1 ? theme.glow : theme.accent;
        g.beginPath();
        g.arc(px, py, theme.kind === "white_studio" ? pt.r * 2.0 : pt.r, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.restore();
  }

  function startAnimated4sPreview() {
    const c = document.getElementById("nxLive4sCanvas");
    if (!c) return;
    if (state.previewRafId) cancelAnimationFrame(state.previewRafId);

    const g = c.getContext("2d");
    const W = c.width;
    const H = c.height;
    const LOOP_SEC = 4.0;
    const tStart = performance.now();

    const particles = Array.from({ length: 18 }, (_, i) => ({
      x: ((i * 73) % 100) / 100,
      y: ((i * 41) % 100) / 100,
      r: 1.5 + (i % 4) * 1.0,
      sp: 0.14 + (i % 5) * 0.05,
      ph: i * 1.3
    }));

    const drawFrame = () => {
      const nowEl = document.getElementById("nxLive4sCanvas");
      if (!nowEl) return;
      syncPreviewProductAngles();

      const elapsed = ((performance.now() - tStart) / 1000) % LOOP_SEC;
      const profile = window.NEXORA_GET_NICHE_PROFILE();
      const scenObj = getActiveScenarioObj();
      const theme = getScenarioVisualTheme(scenObj, profile);

      // 3 ÂNGULOS / PLANOS DINÂMICOS DENTRO DOS 4 SEGUNDOS:
      // 0.00–1.33s: Plano 1 (Hero Frontal Grande)
      // 1.33–2.66s: Plano 2 (Ângulo Lateral / Super Macro)
      // 2.66–4.00s: Plano 3 (Ângulo Superior / Perspectiva 3D Final)
      const cutCount = 3;
      const cutDur = LOOP_SEC / cutCount;
      const cutIdx = Math.min(cutCount - 1, Math.floor(elapsed / cutDur));
      const localT = elapsed - cutIdx * cutDur;
      const p = Math.min(1, localT / cutDur);

      renderScenarioBackdrop(g, W, H, elapsed, cutIdx, p, theme, particles);

      const ease = 1 - Math.pow(1 - p, 3);
      const smooth = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

      // Escolhe a foto certa para o plano atual (usa ângulos reais do Kit 6 se existirem!)
      let drawImg = state.previewAngleSlots.front;
      let usedRealAltAngle = false;
      if (cutIdx === 1 && state.previewAngleSlots.side) {
        drawImg = state.previewAngleSlots.side;
        usedRealAltAngle = true;
      } else if (cutIdx === 2 && state.previewAngleSlots.top) {
        drawImg = state.previewAngleSlots.top;
        usedRealAltAngle = true;
      }

      // Movimento 3D + troca de ângulo + PRODUTO BEM MAIOR (preenche ~82% da largura!)
      let scX = 1.0, scY = 1.0, ox = 0, oy = 0, rot = 0, skewX = 0;
      let planTag = "1/3 HERO";

      if (cutIdx === 0) {
        // Plano 1: Hero Frontal Grande com aproximação firme
        planTag = "1/3 HERO";
        const sc = 0.96 + ease * 0.14;
        scX = sc; scY = sc;
        oy = (0.45 - ease) * 8;
        rot = Math.sin(p * Math.PI) * 0.03;
      } else if (cutIdx === 1) {
        // Plano 2: Ângulo Lateral ou Super Macro inclinado com pan lateral
        planTag = usedRealAltAngle ? "2/3 LATERAL" : "2/3 MACRO";
        if (usedRealAltAngle) {
          const sc = 1.02 + smooth * 0.14;
          scX = sc; scY = sc;
          ox = (smooth - 0.5) * 14;
          rot = -0.04 + smooth * 0.06;
        } else {
          const sc = 1.24 + smooth * 0.16;
          scX = sc * 0.96; scY = sc;
          ox = (0.5 - smooth) * 18;
          oy = (smooth - 0.5) * 10;
          rot = -0.09 + smooth * 0.08;
          skewX = -0.07;
        }
      } else {
        // Plano 3: Perspectiva Superior / Final Hero 3D
        planTag = usedRealAltAngle ? "3/3 TOPO 3D" : "3/3 FINAL 3D";
        if (usedRealAltAngle) {
          const sc = 1.08 - ease * 0.08;
          scX = sc; scY = sc;
          oy = (ease - 0.5) * 8;
          rot = 0.05 - ease * 0.05;
        } else {
          const sc = 1.08 - ease * 0.07;
          scX = sc * (0.94 + ease * 0.06);
          scY = sc * (0.96 + ease * 0.04);
          ox = (ease - 0.5) * 12;
          rot = 0.07 * (1 - ease);
          skewX = 0.06 * (1 - ease);
        }
      }

      g.save();
      g.translate(W * 0.5 + ox, H * 0.44 + oy);
      if (rot) g.rotate(rot);
      if (skewX) g.transform(1, 0, skewX, 1, 0, 0);
      g.scale(scX, scY);

      if (drawImg && (drawImg.width || drawImg.naturalWidth)) {
        const iw = drawImg.width || drawImg.naturalWidth;
        const ih = drawImg.height || drawImg.naturalHeight;
        // PRODUTO BEM MAIOR: ocupa até 82% da largura e 64% da altura do quadro 9:16!
        const maxW = W * 0.82, maxH = H * 0.64;
        const ratio = Math.min(maxW / iw, maxH / ih);
        const dw = iw * ratio;
        const dh = ih * ratio;
        g.shadowColor = theme.lightText ? "rgba(15,23,42,0.28)" : "rgba(0,0,0,0.58)";
        g.shadowBlur = 16;
        g.shadowOffsetY = 6;
        g.drawImage(drawImg, -dw / 2, -dh / 2, dw, dh);
      } else {
        g.fillStyle = theme.lightText ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.09)";
        g.strokeStyle = theme.accent;
        g.lineWidth = 2.2;
        g.beginPath();
        g.roundRect(-42, -56, 84, 112, 16);
        g.fill();
        g.stroke();
        g.fillStyle = theme.lightText ? "#0f172a" : "#f8fafc";
        g.font = "800 11px Inter, sans-serif";
        g.textAlign = "center";
        g.fillText("SEU", 0, -5);
        g.fillText("PRODUTO", 0, 11);
      }
      g.restore();

      // Feixe de brilho correndo suavemente
      g.save();
      g.globalCompositeOperation = "screen";
      g.globalAlpha = (theme.lightText ? 0.14 : 0.22) * Math.sin(p * Math.PI);
      const lx = (p - 0.3) * W * 1.8;
      const lg = g.createLinearGradient(lx - 26, 0, lx + 26, H);
      lg.addColorStop(0, "rgba(255,255,255,0)");
      lg.addColorStop(0.5, "#ffffff");
      lg.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = lg;
      g.fillRect(0, 0, W, H);
      g.restore();

      // Flash limpo apenas nas trocas de ângulo (nunca no frame 0!)
      if (cutIdx > 0 && localT < 0.11) {
        const fp = 1 - localT / 0.11;
        g.save();
        g.globalCompositeOperation = "screen";
        g.fillStyle = `rgba(255,255,255,${(fp * fp * (profile.pacing === "gentle" ? 0.14 : 0.24)).toFixed(2)})`;
        g.fillRect(0, 0, W, H);
        g.restore();
      }

      // Badge discreta no topo indicando o clima do cenário ativo
      g.fillStyle = "rgba(5,8,15,0.62)";
      g.fillRect(0, 0, W, 20);
      g.fillStyle = "#e2e8f0";
      g.font = "700 8.5px Inter, sans-serif";
      g.textAlign = "center";
      g.fillText(theme.tag.toUpperCase(), W * 0.5, 13);

      // Rodapé com indicador de ângulo + barra de 4s
      g.fillStyle = "rgba(5,8,15,0.78)";
      g.fillRect(0, H - 28, W, 28);
      g.fillStyle = "#f8fafc";
      g.font = "800 8.8px Inter, sans-serif";
      g.textAlign = "left";
      g.fillText(`▶ ${planTag}`, 7, H - 11);
      g.fillStyle = "#94a3b8";
      g.textAlign = "right";
      g.fillText(`${elapsed.toFixed(1)}s/4.0s`, W - 7, H - 11);
      g.fillStyle = "rgba(148,163,184,0.28)";
      g.fillRect(0, H - 3, W, 3);
      g.fillStyle = theme.accent;
      g.fillRect(0, H - 3, (elapsed / LOOP_SEC) * W, 3);

      state.previewRafId = requestAnimationFrame(drawFrame);
    };

    state.previewRafId = requestAnimationFrame(drawFrame);
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
        gap: 15px;
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
        flex-wrap: wrap;
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
      .nx-niche-banner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.10), rgba(56, 189, 248, 0.08));
        border: 1px solid rgba(34, 197, 94, 0.34);
        border-radius: 12px;
        padding: 10px 14px;
        font-size: 12px;
        color: #e2e8f0;
      }
      .nx-niche-banner strong { color: #86efac; }
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
        grid-template-columns: 144px 1fr;
        gap: 16px;
        align-items: center;
      }
      .nx-preview-video-wrap {
        width: 144px;
        aspect-ratio: 9 / 16;
        border-radius: 13px;
        overflow: hidden;
        background: #070b13;
        border: 1.5px solid rgba(34, 197, 94, 0.42);
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.48);
      }
      .nx-preview-video-wrap video,
      .nx-preview-video-wrap canvas {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
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
        .nx-preview-video-wrap { margin: 0 auto; width: 158px; }
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
            <span>Diretor IA: Estilo, Cenário &amp; Trilha Sonora</span>
            <span class="nx-pill-veo">Adaptação por Nicho Ativa</span>
          </div>
          <span style="font-size:11.5px;color:#94a3b8;font-weight:600;">Cenário, ritmo, cortes e música moldados ao seu produto</span>
        </div>

        <div class="nx-niche-banner" id="nxNicheBanner">
          <span>🎯 Diretor IA: <strong id="nxNicheBadgeTxt">✨ Universal Pro • Alta Conversão</strong></span>
          <span id="nxNichePaceTxt" style="font-size:11.5px;color:#cbd5e1;">6 cortes equilibrados (~1,6s) • Vitrine cinema • Trilha viral</span>
        </div>

        <div class="nx-two-col">
          <!-- 1) MODELO DE VÍDEO -->
          <div class="nx-choice-box">
            <label class="nx-lbl">🎬 Estilo de Comercial (10 Modelos)</label>
            <div class="nx-mode-pair">
              <button type="button" class="nx-mode-opt locked-auto" id="nxBtnModeloAuto" disabled>✓ Melhor Opção</button>
              <button type="button" class="nx-mode-opt" id="nxBtnModeloManual">🎯 Escolher Manual</button>
            </div>
            <div class="nx-locked-choice-pill" id="nxModeloAutoPill"><span>✓ IA escolheu:</span> 6. Vitrine Dinâmica Multi-Ângulos / Hollywood Cut</div>
            <select id="nxSelectModeloManual" style="display:none;"></select>
            <div class="nx-sub-hint" id="nxModeloHint">Escolha travada pela IA conforme o nicho do seu produto.</div>
          </div>

          <!-- 2) TRILHA SONORA UNIFICADA -->
          <div class="nx-choice-box">
            <label class="nx-lbl">🎵 Trilha Sonora (10 Estilos por Nicho)</label>
            <div class="nx-mode-pair">
              <button type="button" class="nx-mode-opt locked-auto" id="nxBtnTrilhaAuto" disabled>✓ Melhor Opção</button>
              <button type="button" class="nx-mode-opt" id="nxBtnTrilhaManual">🎧 Escolher Estilo</button>
            </div>
            <div class="nx-locked-choice-pill" id="nxTrilhaAutoPill"><span>✓ IA escolheu:</span> Relógios, Joias &amp; Luxo Dark Bass</div>
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
            <div class="nx-sub-hint" id="nxTrilhaHint">Clique em "🔊 Ouvir Trilha" para testar o ritmo em 0 segundos (0 créditos).</div>
          </div>
        </div>

        <!-- 3) CENÁRIO / UNIVERSO 3D (COM MELHOR OPÇÃO TRAVADA + MANUAL 105 UNIVERSOS!) -->
        <div class="nx-choice-box" id="nxScenarioChoiceBox">
          <label class="nx-lbl">🌍 Cenário do Vídeo (105 Universos 3D • Muda a Prévia 4s ao vivo)</label>
          <div class="nx-mode-pair">
            <button type="button" class="nx-mode-opt locked-auto" id="nxBtnCenarioAuto" disabled>✓ Melhor Opção</button>
            <button type="button" class="nx-mode-opt" id="nxBtnCenarioManual">🎨 Escolher Cenário (105)</button>
          </div>
          <div class="nx-locked-choice-pill" id="nxCenarioAutoPill"><span>✓ IA escolheu:</span> #101 Eclipse Vulcânico &amp; Faíscas Ouro</div>
          <div class="nx-sub-hint" id="nxCenarioHint">A IA escolheu o cenário ideal para o seu produto. Clique em "Escolher Cenário (105)" para testar outros universos na prévia abaixo.</div>
        </div>

        <!-- PRÉVIA ANIMADA DE 4 SEGUNDOS (0 CRÉDITOS • 3 ÂNGULOS + PRODUTO GRANDE + CENÁRIO AO VIVO!) -->
        <div class="nx-preview-box" id="nxExamplePreviewBox">
          <div class="nx-preview-video-wrap" id="nxPreviewVideoWrap">
            <canvas id="nxLive4sCanvas" width="180" height="320"></canvas>
            <video id="nxExampleVideo" muted loop playsinline autoplay style="display:none;"></video>
          </div>
          <div class="nx-preview-info">
            <span class="nx-preview-badge">▶ Prévia Animada 4s • 3 Ângulos • 0 Créditos</span>
            <div class="nx-preview-title" id="nxPrevModelTitle">6. Vitrine Dinâmica Multi-Ângulos / Hollywood Cut</div>
            <div class="nx-preview-meta" id="nxPrevScenarioLine">🌍 Cenário na prévia: <strong>#101 Eclipse Vulcânico &amp; Faíscas Ouro</strong></div>
            <div class="nx-preview-meta" id="nxPrevModelDesc">Troca de ângulos em tempo real com o seu produto em destaque — mude o cenário acima para ver a prévia se adaptar na hora!</div>
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

  function applySuggestedVoiceForNiche(profile) {
    if (state.userTouchedVoice || !profile) return;
    const gSel = document.getElementById("inlineVoiceGender");
    const vSel = document.getElementById("inlineVoiceStyle");
    if (!gSel || !vSel) return;
    if (profile.voiceGender && gSel.value !== profile.voiceGender) {
      gSel.value = profile.voiceGender;
      gSel.dispatchEvent(new Event("change", { bubbles: true }));
    }
    setTimeout(() => {
      if (state.userTouchedVoice) return;
      if (profile.voiceStyleId && Array.from(vSel.options).some((o) => o.value === profile.voiceStyleId)) {
        vSel.value = profile.voiceStyleId;
      }
    }, 30);
  }

  function updateDurationPillsForNiche(profile) {
    const cutsMap = (profile && profile.cutsMap) || { 10: 6, 15: 9, 20: 13, 30: 19 };
    const paceLbl = profile && profile.pacing === "gentle" ? "Suaves" : "Cinema";
    document.querySelectorAll(".nx-dur-pill").forEach((pill) => {
      const d = Number(pill.dataset.dur);
      const span = pill.querySelector("span");
      if (span && cutsMap[d]) {
        span.textContent = `${cutsMap[d]} cortes • ${paceLbl}`;
      }
    });
    const minDurSel = document.getElementById("minDuration");
    if (minDurSel) {
      Array.from(minDurSel.options).forEach((opt) => {
        const d = Number(opt.value);
        if (cutsMap[d]) {
          opt.textContent = `${d}s — ${cutsMap[d]} Cortes ${paceLbl}`;
        }
      });
    }
    if (typeof window.__NEXORA_REFRESH_BTN__ === "function") {
      try { window.__NEXORA_REFRESH_BTN__(); } catch {}
    }
  }

  function applyLockedUIState() {
    const profile = window.NEXORA_GET_NICHE_PROFILE();
    const scenObj = getActiveScenarioObj();

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

    const btnCAuto = document.getElementById("nxBtnCenarioAuto");
    const btnCMan = document.getElementById("nxBtnCenarioManual");
    const pillC = document.getElementById("nxCenarioAutoPill");
    const hintC = document.getElementById("nxCenarioHint");

    const badgeTxt = document.getElementById("nxNicheBadgeTxt");
    const paceTxt = document.getElementById("nxNichePaceTxt");
    if (badgeTxt) badgeTxt.textContent = profile.badge;
    if (paceTxt) paceTxt.textContent = profile.summaryHint;

    const activeModObj = state.modelos.find((m) => Number(m.id) === Number(getActiveModeloPreferido())) || state.modelos[5] || state.modelos[0];
    const activeTrkObj = state.trilhas.find((t) => t.id === getActiveTrilhaPreferida()) || state.trilhas[0];

    // 1) Modelo
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
        pillM.innerHTML = `<span>✓ IA escolheu (${profile.nome}):</span> ${activeModObj.nome}`;
      }
      if (hintM) hintM.textContent = "Escolha travada pela IA (não gera outras sozinha). Clique em \"Escolher Manual\" só se quiser trocar.";
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

    // 2) Trilha
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
        pillT.innerHTML = `<span>✓ IA escolheu (${profile.nome}):</span> ${activeTrkObj.nome}`;
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

    // 3) Cenário (105 Universos)
    if (state.modoCenario === "melhor_opcao") {
      if (btnCAuto) {
        btnCAuto.disabled = true;
        btnCAuto.classList.add("locked-auto");
        btnCAuto.classList.remove("active");
        btnCAuto.textContent = "✓ Melhor Opção";
      }
      if (btnCMan) btnCMan.classList.remove("active");
      if (pillC) {
        pillC.style.display = "block";
        pillC.innerHTML = `<span>✓ IA escolheu (${profile.nome}):</span> ${scenObj.name || profile.cenarioNome}`;
      }
      if (hintC) hintC.textContent = "Cenário travado pela IA para o nicho do produto. Clique em \"Escolher Cenário (105)\" se quiser testar outros universos na prévia.";
    } else {
      if (btnCAuto) {
        btnCAuto.disabled = false;
        btnCAuto.classList.remove("locked-auto");
        btnCAuto.textContent = "⭐ Melhor Opção";
      }
      if (btnCMan) btnCMan.classList.add("active");
      if (pillC) {
        pillC.style.display = "block";
        pillC.innerHTML = `<span>🎨 Cenário manual ativo:</span> ${scenObj.name}`;
      }
      if (hintC) hintC.textContent = "Escolha qualquer um dos 105 Universos na lista logo abaixo — a prévia de 4 segundos muda ao vivo!";
    }

    // 4) Bloco da Prévia 4s
    const titleEl = document.getElementById("nxPrevModelTitle");
    const scenEl = document.getElementById("nxPrevScenarioLine");
    const descEl = document.getElementById("nxPrevModelDesc");
    const trackEl = document.getElementById("nxPrevTrackInfo");

    if (titleEl) titleEl.textContent = `${activeModObj.nome}`;
    if (scenEl) {
      const modoC = state.modoCenario === "manual" ? "Manual" : "Melhor Opção IA";
      scenEl.innerHTML = `🌍 Cenário na prévia (${modoC}): <strong>${scenObj.name}</strong>`;
    }
    if (descEl) {
      descEl.innerHTML =
        `Nicho: <strong>${profile.badge}</strong> • Ritmo: <strong>${profile.pacing === "gentle" ? "Suave & Natural (~1,9s/corte)" : "Dinâmico & Cadenciado (~1,6s/corte)"}</strong>.<br/>` +
        `Animação de 3 ângulos com o seu produto em destaque (<strong>0 créditos</strong>) — 100% fiel no vídeo final.`;
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
      trackEl.innerHTML = `🎵 Trilha adaptada: <strong>${activeTrkObj.nome}</strong> (${fonteLbl})`;
    }

    updateDurationPillsForNiche(profile);

    if (hintT && !state.synthPlaying && !state.previewAudioEl) {
      hintT.textContent = "Clique em \"🔊 Ouvir Trilha\" para testar o ritmo em 0 segundos (0 créditos).";
    }
    notifySummaryUpdate();
  }

  function syncAutoScenarioToCatalog(profile) {
    if (!profile || state.modoCenario !== "melhor_opcao") return;
    state.cenarioAutoTravadoId = profile.cenarioId || 101;
    if (typeof window.__NEXORA_SET_VIDEO_MODEL_BY_ID__ === "function") {
      try { window.__NEXORA_SET_VIDEO_MODEL_BY_ID__(state.cenarioAutoTravadoId, true); } catch {}
    }
  }

  function updateCategoryAutoLockIfChanged(forceUpdate = false) {
    const prod = getProductInfoFromDOM();
    const cat = detectNicheFromText(prod.nome, prod.detalhes);
    if (!forceUpdate && cat === state.ultimaCategoria) return;
    state.ultimaCategoria = cat;
    const profile = NICHE_PROFILES[cat] || NICHE_PROFILES.universal;
    state.modeloAutoTravadoId = profile.modeloId;
    state.trilhaAutoTravadaId = profile.trilhaId;
    syncAutoScenarioToCatalog(profile);
    applySuggestedVoiceForNiche(profile);
    applyLockedUIState();
  }

  window.__NEXORA_APPLY_NICHE__ = () => updateCategoryAutoLockIfChanged(true);

  // Chamado pelo index.html toda vez que o usuário escolhe um dos 105 cenários manualmente!
  window.__NEXORA_ON_SCENARIO_CHANGE__ = (vidModel, isFromAuto = false) => {
    if (!isFromAuto) {
      state.modoCenario = "manual";
      state.cenarioManualObj = vidModel;
    }
    applyLockedUIState();
  };

  function bindPanelEvents() {
    const btnMAuto = document.getElementById("nxBtnModeloAuto");
    const btnMMan = document.getElementById("nxBtnModeloManual");
    const selM = document.getElementById("nxSelectModeloManual");

    const btnTAuto = document.getElementById("nxBtnTrilhaAuto");
    const btnTMan = document.getElementById("nxBtnTrilhaManual");
    const selT = document.getElementById("nxSelectTrilhaManual");
    const selFonte = document.getElementById("nxSelectFonteTrilha");

    const btnCAuto = document.getElementById("nxBtnCenarioAuto");
    const btnCMan = document.getElementById("nxBtnCenarioManual");
    const catDetails = document.getElementById("nxManualCatalogDetails");

    const hintT = document.getElementById("nxTrilhaHint");
    const btnOuvir = document.getElementById("nxBtnOuvirTrilha");
    const btnUpMp3 = document.getElementById("nxBtnUploadMp3Unified");
    const btnClrMp3 = document.getElementById("nxBtnClearMp3Unified");
    const legacyMp3Inp = document.getElementById("customAudioFile");
    const legacyMusicSel = document.getElementById("musicPreset");

    ["inlineVoiceGender", "inlineVoiceStyle"].forEach((id) => {
      document.getElementById(id)?.addEventListener("mousedown", () => { state.userTouchedVoice = true; });
      document.getElementById(id)?.addEventListener("touchstart", () => { state.userTouchedVoice = true; }, { passive: true });
    });

    btnMAuto?.addEventListener("click", () => {
      if (state.modoModelo === "melhor_opcao") return;
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
      if (state.modoTrilha === "melhor_opcao") return;
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

    btnCAuto?.addEventListener("click", () => {
      if (state.modoCenario === "melhor_opcao") return;
      state.modoCenario = "melhor_opcao";
      const prof = window.NEXORA_GET_NICHE_PROFILE();
      syncAutoScenarioToCatalog(prof);
      if (catDetails) catDetails.open = false;
      applyLockedUIState();
    });

    btnCMan?.addEventListener("click", () => {
      state.modoCenario = "manual";
      if (catDetails) {
        catDetails.open = true;
        catDetails.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
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

    btnOuvir?.addEventListener("click", async () => {
      if (state.synthPlaying || (state.previewAudioEl && !state.previewAudioEl.paused)) {
        stopAnyTrackPreview();
        if (hintT) hintT.textContent = "Prévia pausada. Clique em \"🔊 Ouvir Trilha\" para testar novamente (0 créditos).";
        return;
      }

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

      btnOuvir.textContent = "⏹️ Parar Prévia";
      btnOuvir.classList.add("nx-playing-now");
      if (hintT) {
        hintT.textContent = `🔊 Prévia instantânea: ${trkObj.nome} (0s • 0 créditos). A trilha completa Lyria 2 entra no vídeo final!`;
      }
      playInstantStyleSynth(activeId, () => {
        if (hintT) hintT.textContent = `✓ Estilo "${trkObj.nome}" selecionado. Trilha completa Lyria 2 será gerada com o vídeo.`;
      });
    });

    let catTimer = null;
    ["inlineProductName", "productDetailHint"].forEach((id) => {
      document.getElementById(id)?.addEventListener("input", () => {
        clearTimeout(catTimer);
        catTimer = setTimeout(() => updateCategoryAutoLockIfChanged(false), 320);
      });
      document.getElementById(id)?.addEventListener("change", () => {
        updateCategoryAutoLockIfChanged(false);
      });
    });
  }

  function installFetchBridge() {
    const origFetch = window.fetch.bind(window);
    window.fetch = async function (input, init) {
      const urlStr = typeof input === "string" ? input : (input && input.url) || "";
      if (urlStr.includes("/api/generate") && init && typeof init.body === "string") {
        try {
          const parsed = JSON.parse(init.body);
          const act = String(parsed.action || parsed.task || parsed.mode || "").toLowerCase();
          const nicheProf = window.NEXORA_GET_NICHE_PROFILE();

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
            const activeTrkId = getActiveTrilhaPreferida();

            if (effectiveMusicMode === "instant" && !parsed.__isMusicPreviewDirect) {
              const candMp3 = state.trilhas.find((t) => t.id === activeTrkId)?.arquivoPreviewMp3 || "";
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

            const customTrkPrompts = {
              moda_editorial: NICHE_PROFILES.moda_feminina.lyriaPrompt,
              brinquedos_alegre: NICHE_PROFILES.brinquedos.lyriaPrompt,
              pet_carinhoso: NICHE_PROFILES.pet.lyriaPrompt,
              luxo_asmr: NICHE_PROFILES.beleza.lyriaPrompt,
              hollywood_phonk: NICHE_PROFILES.relogios.lyriaPrompt,
              scifi_cyberpunk: NICHE_PROFILES.eletronicos.lyriaPrompt,
              impacto_industrial: NICHE_PROFILES.calcados.lyriaPrompt,
              virada_dinamica: NICHE_PROFILES.casa.lyriaPrompt,
              lounge_executivo: NICHE_PROFILES.oculos.lyriaPrompt,
              epico_cinematografico: "IMMEDIATE HOLLYWOOD BLOCKBUSTER COMMERCIAL SCORE AT 0:00, ZERO SLOW INTRO. Monumental percussion, heroic modern brass and clean sub-bass, pure instrumental, strictly no vocals."
            };
            const chosenPrompt = (state.modoTrilha === "melhor_opcao" && nicheProf.lyriaPrompt)
              ? nicheProf.lyriaPrompt
              : (customTrkPrompts[activeTrkId] || nicheProf.lyriaPrompt);

            if (chosenPrompt) {
              parsed.musicPrompt = chosenPrompt;
              parsed.prompt = chosenPrompt;
              parsed.useMusicDatabase = false;
            } else {
              parsed.useMusicDatabase = true;
            }
            parsed.musicMode = effectiveMusicMode;
            if (state.fonteTrilha === "fast" && parsed.engineIndex === 0) {
              parsed.engineIndex = 1;
            }
            parsed.nomeProduto = parsed.nomeProduto || prod.nome;
            parsed.detalhesProduto = parsed.detalhesProduto || prod.detalhes;
            parsed.modeloPreferido = getActiveModeloPreferido();
            parsed.trilhaPreferida = activeTrkId;
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
      startAnimated4sPreview();
    }

    try {
      const res = await fetch("/api/generate?action=get_options");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.modelos) && data.modelos.length) state.modelos = data.modelos;
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
