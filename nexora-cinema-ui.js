/**
 * ============================================================================
 * NEXORA.AI — DIRETOR IA ADAPTATIVO POR NICHO + PRÉVIA 4s (0 CRÉDITOS)
 * ============================================================================
 * Versão 4.0 (Nota 1000 — Adaptação Total por Nicho + Fidelidade Blindada)
 *  - Diretor IA completo para 12 nichos (Moda Feminina, Brinquedos, Pet Shop,
 *    Beleza, Perfumes, Relógios/Joias, Óculos, Calçados, Eletrônicos,
 *    Suplementos, Casa/Cozinha e Universal).
 *  - Adapta automaticamente: Cenários, Ritmo/Qtd de Cortes (1.4s–2.0s),
 *    Trilha Sonora (Lyria 2 + Prévia 0s), Intensidade de Zoom/SFX e Locutor!
 *  - Botão "Melhor Opção" trava/apaga após a IA escolher (só reabilita ao
 *    trocar para Manual).
 *  - Prévia animada REAL de 4 segundos em loop (0 créditos!) usando a própria
 *    foto do produto enviado pelo cliente no quadro 9:16.
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
      pacing: "gentle",
      cutsMap: { 10: 5, 15: 8, 20: 11, 30: 16 },
      zoomPower: 0.52,
      sfxScale: 0.45,
      lightTheme: true,
      voiceGender: "female",
      voiceStyleId: "f13_lily_boutique",
      summaryHint: "5 cortes fluidos (~2,0s) • Luz natural editorial • Trilha leve",
      previewPalette: { bg1: "#2a1f28", bg2: "#16111a", accent: "#f472b6", glow: "#fde68a", particle: "soft", cuts: 2 },
      lyriaPrompt: "IMMEDIATE WARM CHIC EDITORIAL GROOVE AT 0:00, ZERO DARK TONE, ZERO HEAVY TRAP. Light natural modern fashion commercial pop-house soundtrack, airy warm Rhodes chords, soft crisp snap percussion, breezy smooth bassline, feminine boutique runway elegance, bright uplifting feel-good mastering, strictly instrumental, no vocals."
    },
    brinquedos: {
      id: "brinquedos",
      nome: "Brinquedos & Infantil",
      badge: "🧸 Brinquedos • Alegre & Empolgante",
      modeloId: 7,
      trilhaId: "brinquedos_alegre",
      pacing: "balanced",
      cutsMap: { 10: 6, 15: 9, 20: 13, 30: 19 },
      zoomPower: 0.72,
      sfxScale: 0.62,
      lightTheme: true,
      voiceGender: "female",
      voiceStyleId: "f02_jessica_energia",
      summaryHint: "6 cortes alegres (~1,6s) • Cenário colorido • Trilha divertida",
      previewPalette: { bg1: "#1a2b4c", bg2: "#1d1438", accent: "#fbbf24", glow: "#38bdf8", particle: "confetti", cuts: 3 },
      lyriaPrompt: "IMMEDIATE HAPPY PLAYFUL UPBEAT DROP AT 0:00, ZERO DARK OR AGGRESSIVE SOUND. Exciting joyful family and kids toy commercial soundtrack, bright marimba and sparkly cheerful synth melody, bouncy fun pop drums, playful energetic clapping rhythm, colorful magical excitement for children and parents, crisp bright TV commercial mastering, strictly instrumental, no vocals."
    },
    pet: {
      id: "pet",
      nome: "Pet Shop (Cães & Gatos)",
      badge: "🐾 Pet Shop • Carinhoso & Acolhedor",
      modeloId: 7,
      trilhaId: "pet_carinhoso",
      pacing: "gentle",
      cutsMap: { 10: 5, 15: 8, 20: 11, 30: 16 },
      zoomPower: 0.50,
      sfxScale: 0.42,
      lightTheme: true,
      voiceGender: "female",
      voiceStyleId: "f20_laura_review",
      summaryHint: "5 cortes carinhosos (~2,0s) • Ambiente acolhedor • Trilha leve",
      previewPalette: { bg1: "#272219", bg2: "#14120e", accent: "#fb923c", glow: "#fde047", particle: "warm", cuts: 2 },
      lyriaPrompt: "IMMEDIATE HEARTWARMING FEEL-GOOD GROOVE AT 0:00, ZERO DARK OR HARSH SOUND. Warm cheerful pet-care commercial acoustic-pop soundtrack, bright friendly acoustic guitar strums, gentle bouncy light percussion, soft warm bass, cozy loving joyful family atmosphere, crisp clean TV mastering, strictly instrumental, no vocals."
    },
    beleza: {
      id: "beleza",
      nome: "Beleza & Skincare",
      badge: "💄 Beleza • Sensorial & Luminoso",
      modeloId: 8,
      trilhaId: "luxo_asmr",
      pacing: "gentle",
      cutsMap: { 10: 5, 15: 8, 20: 11, 30: 16 },
      zoomPower: 0.55,
      sfxScale: 0.48,
      lightTheme: true,
      voiceGender: "female",
      voiceStyleId: "f16_matilda_beauty",
      summaryHint: "5 cortes suaves (~2,0s) • Mármore claro & macro • Trilha sensorial",
      previewPalette: { bg1: "#231e2c", bg2: "#111019", accent: "#e879f9", glow: "#fbcfe8", particle: "soft", cuts: 2 },
      lyriaPrompt: "IMMEDIATE SILKY LUMINOUS BEAUTY GROOVE AT 0:00. Upscale modern skincare and cosmetics commercial soundtrack, lush airy synth pads, soft crisp modern beat, silky warm sub-bass, sparkling delicate chimes, clean spa-luxury radiance, glossy ad-agency mastering, strictly instrumental, no vocals."
    },
    perfumes: {
      id: "perfumes",
      nome: "Perfumaria & Fragrâncias",
      badge: "🌸 Perfumaria • Luxo Sensorial",
      modeloId: 3,
      trilhaId: "luxo_asmr",
      pacing: "gentle",
      cutsMap: { 10: 5, 15: 8, 20: 11, 30: 16 },
      zoomPower: 0.58,
      sfxScale: 0.55,
      lightTheme: false,
      voiceGender: "female",
      voiceStyleId: "f11_charlotte_luxo",
      summaryHint: "5 cortes envolventes (~2,0s) • Brilho & névoa fina • Trilha luxo",
      previewPalette: { bg1: "#231810", bg2: "#0d0a08", accent: "#f59e0b", glow: "#fef08a", particle: "embers", cuts: 2 },
      lyriaPrompt: "IMMEDIATE SENSUAL LUXURY PERFUME GROOVE AT 0:00. High-fashion Parisian fragrance commercial soundtrack, deep velvet warm sub-bass, sleek sensual slow-burn house pulse, shimmering golden atmospheric chords, captivating elegance, pristine theatrical mastering, strictly instrumental, no vocals."
    },
    relogios: {
      id: "relogios",
      nome: "Relógios & Joalheria",
      badge: "⌚ Relógios & Luxo • Alta Precisão",
      modeloId: 6,
      trilhaId: "hollywood_phonk",
      pacing: "balanced",
      cutsMap: { 10: 6, 15: 9, 20: 13, 30: 19 },
      zoomPower: 0.78,
      sfxScale: 0.85,
      lightTheme: false,
      voiceGender: "male",
      voiceStyleId: "m11_daniel_luxo",
      summaryHint: "6 cortes precisos (~1,6s) • Joalheria & mármore • Bass luxo",
      previewPalette: { bg1: "#1a1408", bg2: "#07090f", accent: "#eab308", glow: "#fef08a", particle: "embers", cuts: 3 },
      lyriaPrompt: "IMMEDIATE SLEEK LUXURY WATCH COMMERCIAL DROP AT 0:00. High-end luxury timepiece and jewelry advertisement soundtrack, deep clean punchy 808 sub-bass pulse, razor-crisp minimalist hi-hats, confident dark-chrome synth stabs, authoritative refined energy, pristine broadcast mastering, strictly instrumental, no vocals."
    },
    oculos: {
      id: "oculos",
      nome: "Óculos & Estilo Solar",
      badge: "🕶️ Óculos • Solar & Lifestyle",
      modeloId: 10,
      trilhaId: "lounge_executivo",
      pacing: "balanced",
      cutsMap: { 10: 6, 15: 9, 20: 13, 30: 19 },
      zoomPower: 0.68,
      sfxScale: 0.68,
      lightTheme: true,
      voiceGender: "male",
      voiceStyleId: "m03_charlie_tiktok",
      summaryHint: "6 cortes estilosos (~1,6s) • Luz dourada solar • Lounge moderno",
      previewPalette: { bg1: "#1e293b", bg2: "#0f172a", accent: "#f59e0b", glow: "#38bdf8", particle: "warm", cuts: 3 },
      lyriaPrompt: "IMMEDIATE STYLISH SUNSET LOUNGE-HOUSE DROP AT 0:00. Cool modern eyewear and summer fashion commercial track, groovy rubbery warm bassline, crisp upbeat house rhythm, sunlit stylish synth chords, confident cosmopolitan vibe, clean radio mastering, strictly instrumental, no vocals."
    },
    calcados: {
      id: "calcados",
      nome: "Calçados & Esporte",
      badge: "👟 Calçados • Energia & Ritmo",
      modeloId: 1,
      trilhaId: "impacto_industrial",
      pacing: "balanced",
      cutsMap: { 10: 6, 15: 9, 20: 13, 30: 19 },
      zoomPower: 0.80,
      sfxScale: 0.88,
      lightTheme: false,
      voiceGender: "male",
      voiceStyleId: "m22_callum_fitness",
      summaryHint: "6 cortes esportivos (~1,6s) • Cenário urbano/arena • Impacto",
      previewPalette: { bg1: "#0f2419", bg2: "#070b12", accent: "#22c55e", glow: "#38bdf8", particle: "sparks", cuts: 3 },
      lyriaPrompt: "IMMEDIATE ATHLETIC SPORTSWEAR COMMERCIAL DROP AT 0:00. High-energy sneaker and sports advertisement soundtrack, punchy driving electronic kick and snare, heavy athletic sub-bass bounce, crisp energetic percussion, unstoppable momentum, pristine ad-agency mastering, strictly instrumental, no vocals."
    },
    eletronicos: {
      id: "eletronicos",
      nome: "Tech & Eletrônicos",
      badge: "🚀 Tech & Gadgets • Inovação 3D",
      modeloId: 6,
      trilhaId: "scifi_cyberpunk",
      pacing: "balanced",
      cutsMap: { 10: 6, 15: 9, 20: 13, 30: 19 },
      zoomPower: 0.78,
      sfxScale: 0.85,
      lightTheme: false,
      voiceGender: "male",
      voiceStyleId: "m23_will_tech",
      summaryHint: "6 cortes tech (~1,6s) • Setup moderno & luz neon • Eletrônica",
      previewPalette: { bg1: "#0c2238", bg2: "#060b14", accent: "#38bdf8", glow: "#818cf8", particle: "sparks", cuts: 3 },
      lyriaPrompt: "IMMEDIATE MODERN TECH-LAUNCH ELECTRONIC DROP AT 0:00. Sleek futuristic gadget commercial soundtrack, driving clean analog synth bass pulse, punchy tight electronic percussion, sparkling hi-tech arpeggios, crisp modern innovation energy, ultra-clean mastering, strictly instrumental, no vocals."
    },
    suplementos: {
      id: "suplementos",
      nome: "Suplementos & Saúde",
      badge: "💪 Suplementos • Energia & Foco",
      modeloId: 1,
      trilhaId: "impacto_industrial",
      pacing: "balanced",
      cutsMap: { 10: 6, 15: 9, 20: 13, 30: 19 },
      zoomPower: 0.76,
      sfxScale: 0.80,
      lightTheme: false,
      voiceGender: "male",
      voiceStyleId: "m22_callum_fitness",
      summaryHint: "6 cortes fortes (~1,6s) • Arena fitness • Batida motivacional",
      previewPalette: { bg1: "#1d140c", bg2: "#0a0c12", accent: "#f97316", glow: "#22c55e", particle: "sparks", cuts: 3 },
      lyriaPrompt: "IMMEDIATE ENERGETIC FITNESS COMMERCIAL DROP AT 0:00. Powerful modern athletic nutrition advertisement beat, tight punchy drums, deep motivating bassline, crisp uplifting electronic stabs, confident vitality, broadcast mastering, strictly instrumental, no vocals."
    },
    casa: {
      id: "casa",
      nome: "Casa, Cozinha & Utilidades",
      badge: "🏠 Casa & Utilidades • Claro & Prático",
      modeloId: 2,
      trilhaId: "virada_dinamica",
      pacing: "balanced",
      cutsMap: { 10: 6, 15: 9, 20: 13, 30: 19 },
      zoomPower: 0.62,
      sfxScale: 0.58,
      lightTheme: true,
      voiceGender: "female",
      voiceStyleId: "f03_sarah_comercial",
      summaryHint: "6 cortes claros (~1,6s) • Ambiente iluminado • Pop varejo",
      previewPalette: { bg1: "#18292e", bg2: "#0d151b", accent: "#34d399", glow: "#fde68a", particle: "warm", cuts: 3 },
      lyriaPrompt: "IMMEDIATE UPBEAT MODERN HOME COMMERCIAL GROOVE AT 0:00. Clean cheerful retail TV advertisement pop-funk soundtrack, bright crisp percussion, friendly groovy bassline, positive modern chords, high-trust welcoming vibe, pristine broadcast mastering, strictly instrumental, no vocals."
    },
    universal: {
      id: "universal",
      nome: "Comercial Universal Pro",
      badge: "✨ Universal Pro • Alta Conversão",
      modeloId: 6,
      trilhaId: "hollywood_phonk",
      pacing: "balanced",
      cutsMap: { 10: 6, 15: 9, 20: 13, 30: 19 },
      zoomPower: 0.72,
      sfxScale: 0.78,
      lightTheme: false,
      voiceGender: "male",
      voiceStyleId: "m01_roger_viral",
      summaryHint: "6 cortes equilibrados (~1,6s) • Vitrine cinema • Trilha viral",
      previewPalette: { bg1: "#111e33", bg2: "#070b14", accent: "#22c55e", glow: "#38bdf8", particle: "embers", cuts: 3 },
      lyriaPrompt: "IMMEDIATE MODERN COMMERCIAL ELECTRONIC DROP AT 0:00. Sleek flagship e-commerce advertisement soundtrack, punchy deep sub-bass groove, tight crisp drums, confident stylish synth hook, wide clean broadcast mastering, strictly instrumental, no vocals."
    }
  };

  window.NEXORA_NICHE_PROFILES = NICHE_PROFILES;

  function detectNicheFromText(nome, detalhes) {
    const s = `${nome || ""} ${detalhes || ""}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    // Pet Shop (prioridade antes de brinquedo/casa p/ pegar "brinquedo pet" e "cama cachorro")
    if (/\b(pet|cachorro|cao|caes|gato|gatos|felino|canino|coleira|peitoral|guia\s*pet|caminha\s*(pet|para\s*cao|cachorro|gato)|arranhador|comedouro|bebedouro\s*pet|racao|petisco|areia\s*higienica|tapete\s*higienico)\b/.test(s)) {
      return "pet";
    }
    // Brinquedos & Infantil
    if (/\b(brinquedo|boneca|boneco|carrinho\s*infantil|controle\s*remoto|lego|pelucia|urso\s*de\s*pelucia|infantil|crianca|bebe|baby|chocalho|quebra.?cabeca|montar|slime|massinha|patinete|bicicleta\s*infantil|jogo\s*educativo|pistola\s*de\s*agua|bolha\s*de\s*sabao)\b/.test(s)) {
      return "brinquedos";
    }
    // Moda Feminina (vestidos, saias, blusas, lingerie, biquíni, salto, moda feminina)
    if (/\b(vestido|saia|blusa|cropped|lingerie|biquini|maio|body\s*feminino|macacao\s*feminino|calca\s*legging|legging|conjuntinho|moda\s*feminina|roupa\s*feminina|salto\s*alto|sandalia\s*feminina|scarpin|bolsa\s*feminina|clutch|kimono|cardigan|tricot|sutia|calcinha)\b/.test(s)) {
      return "moda_feminina";
    }
    // Relógios & Joalheria
    if (/\b(relogio|smartwatch|cronografo|watch|tonneau|pulseira\s*de\s*aco|joia|alianca|colar|corrente|anel|brinco|pingente)\b/.test(s)) {
      return "relogios";
    }
    // Perfumes
    if (/\b(perfume|colonia|fragrancia|body\s*splash|parfum|eau\s*de|arabe|sabah|essencia)\b/.test(s)) {
      return "perfumes";
    }
    // Beleza & Skincare
    if (/\b(serum|skincare|creme|hidratante|maquiagem|batom|base\s*facial|rimel|mascara\s*facial|shampoo|condicionador|escova\s*(alisadora|rotativa|secadora)|chapinha|secador|protetor\s*solar|cosmetico|gloss|blush|esfoliante)\b/.test(s)) {
      return "beleza";
    }
    // Eletrônicos & VR
    if (/\b(vr|headset|realidade\s*virtual|fone|earbud|airpod|headphone|mouse|teclado|caixa\s*de\s*som|carregador|power\s*bank|camera|drone|celular|smartphone|gamer|microfone|lapela|projetor|led|gadget|eletronico|console)\b/.test(s)) {
      return "eletronicos";
    }
    // Calçados & Esporte
    if (/\b(tenis|sapato|bota|chuteira|sneaker|corrida|calcado|chinelo|sapatenis|sapatilha)\b/.test(s)) {
      return "calcados";
    }
    // Óculos
    if (/\b(oculos|armacao|lente\s*solar|polarizad|aviador|wayfarer)\b/.test(s)) {
      return "oculos";
    }
    // Suplementos
    if (/\b(whey|creatina|suplemento|vitamina|proteina|pre.?treino|colageno|magnesio|omega|bcaa|melatonina)\b/.test(s)) {
      return "suplementos";
    }
    // Casa, Cozinha & Auto
    if (/\b(cozinha|garrafa|copo\s*termico|stanley|cafeteira|panela|frigideira|airfryer|liquidificador|aspirador|mop|ferramenta|parafusadeira|automotivo|carro|organizador|luminaria|travesseiro|lencol|toalha)\b/.test(s)) {
      return "casa";
    }
    // Moda geral / acessórios masculinos ou unissex -> moda_feminina editorial leve se roupa
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
    fonteTrilha: "lyria2",
    ultimaCategoria: "universal",
    userTouchedVoice: false,
    previewAudioEl: null,
    synthCtx: null,
    synthTimer: null,
    synthPlaying: false,
    previewRafId: 0,
    previewImgObj: null,
    previewImgSrc: ""
  };

  window.__NEXORA_CINEMA_STATE__ = state;
  window.NEXORA_GET_NICHE_PROFILE = function () {
    return NICHE_PROFILES[state.ultimaCategoria] || NICHE_PROFILES.universal;
  };
  window.NEXORA_DETECT_NICHE = detectNicheFromText;

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
  // PRÉVIA ANIMADA DE 4 SEGUNDOS EM LOOP (9:16 • 0 CRÉDITOS • USA A FOTO REAL!)
  // =========================================================================
  function syncPreviewProductImage() {
    const thumb = document.getElementById("thumbPreview");
    const src = thumb && thumb.getAttribute("src") ? thumb.getAttribute("src") : "";
    if (!src || src === state.previewImgSrc) return;
    state.previewImgSrc = src;
    const im = new Image();
    im.onload = () => { state.previewImgObj = im; };
    im.src = src;
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
      r: 1.5 + (i % 4) * 1.1,
      sp: 0.14 + (i % 5) * 0.05,
      ph: i * 1.3
    }));

    const drawFrame = () => {
      const nowEl = document.getElementById("nxLive4sCanvas");
      if (!nowEl) return;
      syncPreviewProductImage();

      const elapsed = ((performance.now() - tStart) / 1000) % LOOP_SEC;
      const profile = window.NEXORA_GET_NICHE_PROFILE();
      const pal = profile.previewPalette || NICHE_PROFILES.universal.previewPalette;
      const cutCount = pal.cuts || 3;
      const cutDur = LOOP_SEC / cutCount;
      const cutIdx = Math.min(cutCount - 1, Math.floor(elapsed / cutDur));
      const localT = elapsed - cutIdx * cutDur;
      const p = Math.min(1, localT / cutDur);

      // 1) Fundo dinâmico adaptado ao nicho
      const bg = g.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, cutIdx % 2 === 0 ? pal.bg1 : pal.bg2);
      bg.addColorStop(1, cutIdx % 2 === 0 ? pal.bg2 : pal.bg1);
      g.fillStyle = bg;
      g.fillRect(0, 0, W, H);

      // Halo luminoso atrás do produto
      const rad = g.createRadialGradient(W * 0.5, H * 0.44, 8, W * 0.5, H * 0.44, W * 0.78);
      rad.addColorStop(0, pal.accent + "55");
      rad.addColorStop(0.55, pal.glow + "18");
      rad.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = rad;
      g.fillRect(0, 0, W, H);

      // 2) Partículas vivas do nicho
      g.save();
      for (const pt of particles) {
        const px = ((pt.x + Math.sin(elapsed * 0.9 + pt.ph) * 0.06 + 1) % 1) * W;
        const py = ((pt.y - elapsed * pt.sp + 2) % 1) * H;
        g.globalAlpha = 0.25 + 0.45 * Math.abs(Math.sin(elapsed * 2.2 + pt.ph));
        if (pal.particle === "confetti") {
          const cols = ["#fbbf24", "#38bdf8", "#f472b6", "#4ade80"];
          g.fillStyle = cols[Math.floor(pt.ph) % cols.length];
          g.fillRect(px, py, pt.r * 2.1, pt.r * 1.4);
        } else {
          g.fillStyle = pt.ph % 2 > 1 ? pal.glow : pal.accent;
          g.beginPath();
          g.arc(px, py, pal.particle === "soft" ? pt.r * 1.9 : pt.r, 0, Math.PI * 2);
          g.fill();
        }
      }
      g.restore();

      // 3) Movimento e Zoom do Produto (simula o ritmo real do nicho!)
      const ease = 1 - Math.pow(1 - p, 3);
      let sc = 1.0, ox = 0, oy = 0, rot = 0;
      if (profile.pacing === "gentle") {
        // Suave e elegante (Moda Feminina, Pet, Beleza, Perfumes)
        sc = cutIdx === 0 ? (0.94 + ease * 0.14) : (1.10 - ease * 0.12);
        ox = Math.sin(p * Math.PI) * (cutIdx === 0 ? 5 : -5);
        oy = (0.5 - ease) * 5;
      } else {
        // Cadenciado e firme (Relógios, Tech, Brinquedos, Esporte)
        if (cutIdx === 0) { sc = 0.92 + ease * 0.22; oy = (0.5 - ease) * 6; }
        else if (cutIdx === 1) { sc = 1.16 + ease * 0.16; ox = (ease - 0.5) * 12; }
        else { sc = 1.18 - ease * 0.16; rot = Math.sin(p * Math.PI) * 0.025; }
      }

      g.save();
      g.translate(W * 0.5 + ox, H * 0.44 + oy);
      if (rot) g.rotate(rot);
      g.scale(sc, sc);

      if (state.previewImgObj && state.previewImgObj.naturalWidth > 0) {
        const im = state.previewImgObj;
        const maxW = W * 0.72, maxH = H * 0.56;
        const ratio = Math.min(maxW / im.naturalWidth, maxH / im.naturalHeight);
        const dw = im.naturalWidth * ratio;
        const dh = im.naturalHeight * ratio;
        g.shadowColor = "rgba(0,0,0,0.45)";
        g.shadowBlur = 14;
        g.drawImage(im, -dw / 2, -dh / 2, dw, dh);
      } else {
        // Demo visual elegante enquanto o usuário ainda não enviou foto
        g.fillStyle = "rgba(255,255,255,0.08)";
        g.strokeStyle = pal.accent;
        g.lineWidth = 2;
        g.beginPath();
        g.roundRect(-34, -46, 68, 92, 14);
        g.fill();
        g.stroke();
        g.fillStyle = "#f8fafc";
        g.font = "800 10px Inter, sans-serif";
        g.textAlign = "center";
        g.fillText("SEU", 0, -4);
        g.fillText("PRODUTO", 0, 10);
      }
      g.restore();

      // 4) Feixe de luz correndo suavemente
      g.save();
      g.globalCompositeOperation = "screen";
      g.globalAlpha = 0.18 * Math.sin(p * Math.PI);
      const lx = (p - 0.3) * W * 1.8;
      const lg = g.createLinearGradient(lx - 26, 0, lx + 26, H);
      lg.addColorStop(0, "rgba(255,255,255,0)");
      lg.addColorStop(0.5, "#ffffff");
      lg.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = lg;
      g.fillRect(0, 0, W, H);
      g.restore();

      // 5) Flash limpo apenas na troca de corte (nunca no frame 0!)
      if (cutIdx > 0 && localT < 0.12) {
        const fp = 1 - localT / 0.12;
        g.save();
        g.globalCompositeOperation = "screen";
        g.fillStyle = `rgba(255,255,255,${(fp * fp * (profile.pacing === "gentle" ? 0.14 : 0.24)).toFixed(2)})`;
        g.fillRect(0, 0, W, H);
        g.restore();
      }

      // 6) Selo discreto + barra de progresso de 4s
      g.fillStyle = "rgba(5,8,15,0.72)";
      g.fillRect(0, H - 28, W, 28);
      g.fillStyle = "#e2e8f0";
      g.font = "700 9.5px Inter, sans-serif";
      g.textAlign = "left";
      g.fillText(`▶ PRÉVIA ${elapsed.toFixed(1)}s / 4.0s`, 8, H - 11);
      g.fillStyle = "rgba(148,163,184,0.28)";
      g.fillRect(0, H - 3, W, 3);
      g.fillStyle = pal.accent;
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
        grid-template-columns: 126px 1fr;
        gap: 15px;
        align-items: center;
      }
      .nx-preview-video-wrap {
        width: 126px;
        aspect-ratio: 9 / 16;
        border-radius: 12px;
        overflow: hidden;
        background: #070b13;
        border: 1.5px solid rgba(34, 197, 94, 0.35);
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 10px 26px rgba(0, 0, 0, 0.42);
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
        .nx-preview-video-wrap { margin: 0 auto; width: 146px; }
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
            <span>Diretor IA: Estilo do Vídeo &amp; Trilha Sonora</span>
            <span class="nx-pill-veo">Adaptação por Nicho Ativa</span>
          </div>
          <span style="font-size:11.5px;color:#94a3b8;font-weight:600;">Cenário, ritmo, cortes e música moldados ao seu produto</span>
        </div>

        <div class="nx-niche-banner" id="nxNicheBanner">
          <span>🎯 Diretor IA: <strong id="nxNicheBadgeTxt">✨ Universal Pro • Alta Conversão</strong></span>
          <span id="nxNichePaceTxt" style="font-size:11.5px;color:#cbd5e1;">6 cortes equilibrados (~1,6s) • Vitrine cinema • Trilha viral</span>
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
            <div class="nx-sub-hint" id="nxModeloHint">Escolha travada pela IA conforme o nicho do seu produto. Clique em "Escolher Manual" só se quiser trocar.</div>
          </div>

          <!-- TRILHA SONORA UNIFICADA -->
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

        <!-- PRÉVIA ANIMADA DE 4 SEGUNDOS (0 CRÉDITOS • USA A FOTO DO SEU PRODUTO!) -->
        <div class="nx-preview-box" id="nxExamplePreviewBox">
          <div class="nx-preview-video-wrap" id="nxPreviewVideoWrap">
            <canvas id="nxLive4sCanvas" width="162" height="288"></canvas>
            <video id="nxExampleVideo" muted loop playsinline autoplay style="display:none;"></video>
          </div>
          <div class="nx-preview-info">
            <span class="nx-preview-badge">▶ Prévia Animada 4s • 0 Créditos</span>
            <div class="nx-preview-title" id="nxPrevModelTitle">6. Vitrine Dinâmica Multi-Ângulos / Hollywood Cut</div>
            <div class="nx-preview-meta" id="nxPrevModelDesc">Simulação em tempo real do ritmo, cortes e clima do nicho escolhido — seu vídeo final sai 100% fiel ao seu produto.</div>
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

    const badgeTxt = document.getElementById("nxNicheBadgeTxt");
    const paceTxt = document.getElementById("nxNichePaceTxt");
    if (badgeTxt) badgeTxt.textContent = profile.badge;
    if (paceTxt) paceTxt.textContent = profile.summaryHint;

    const activeModObj = state.modelos.find((m) => Number(m.id) === Number(getActiveModeloPreferido())) || state.modelos[5] || state.modelos[0];
    const activeTrkObj = state.trilhas.find((t) => t.id === getActiveTrilhaPreferida()) || state.trilhas[0];

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

    const titleEl = document.getElementById("nxPrevModelTitle");
    const descEl = document.getElementById("nxPrevModelDesc");
    const trackEl = document.getElementById("nxPrevTrackInfo");
    const vidEl = document.getElementById("nxExampleVideo");
    const canvasEl = document.getElementById("nxLive4sCanvas");
    const muteBtn = document.getElementById("nxBtnMuteExample");

    if (titleEl) titleEl.textContent = `${activeModObj.nome}`;
    if (descEl) {
      descEl.innerHTML =
        `Nicho: <strong>${profile.badge}</strong> • Ritmo: <strong>${profile.pacing === "gentle" ? "Suave & Natural (~1,9s/corte)" : "Dinâmico & Cadenciado (~1,6s/corte)"}</strong>.<br/>` +
        `Prévia de 4 segundos rodando ao lado com <strong>0 créditos</strong> — seu vídeo final mantém <strong>100% de fidelidade</strong> ao produto.`;
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

    // Se o MP4 real existir em previews/, toca ele; caso contrário exibe nossa Prévia Animada 4s em Canvas (0 créditos!)
    if (vidEl && canvasEl && activeModObj.previewVideo) {
      const srcPath = `./${activeModObj.previewVideo.replace(/^\/+/, "")}`;
      if (vidEl.getAttribute("data-src") !== srcPath) {
        vidEl.setAttribute("data-src", srcPath);
        vidEl.onloadeddata = () => {
          vidEl.style.display = "block";
          canvasEl.style.display = "none";
          if (muteBtn) muteBtn.style.display = "inline-flex";
        };
        vidEl.onerror = () => {
          vidEl.style.display = "none";
          canvasEl.style.display = "block";
          if (muteBtn) muteBtn.style.display = "none";
        };
        vidEl.src = srcPath;
        vidEl.load();
        vidEl.play().catch(() => {});
      }
    }

    updateDurationPillsForNiche(profile);

    if (hintT && !state.synthPlaying && !state.previewAudioEl) {
      hintT.textContent = "Clique em \"🔊 Ouvir Trilha\" para testar o ritmo em 0 segundos (0 créditos).";
    }
    notifySummaryUpdate();
  }

  function updateCategoryAutoLockIfChanged(forceUpdate = false) {
    const prod = getProductInfoFromDOM();
    const cat = detectNicheFromText(prod.nome, prod.detalhes);
    if (!forceUpdate && cat === state.ultimaCategoria) return;
    state.ultimaCategoria = cat;
    const profile = NICHE_PROFILES[cat] || NICHE_PROFILES.universal;
    state.modeloAutoTravadoId = profile.modeloId;
    state.trilhaAutoTravadaId = profile.trilhaId;
    applySuggestedVoiceForNiche(profile);
    applyLockedUIState();
  }

  window.__NEXORA_APPLY_NICHE__ = () => updateCategoryAutoLockIfChanged(true);

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

    // Se o usuário escolher voz manualmente, respeita a escolha dele
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

    btnMuteEx?.addEventListener("click", () => {
      const v = document.getElementById("nxExampleVideo");
      if (!v) return;
      v.muted = !v.muted;
      btnMuteEx.textContent = v.muted ? "🔇 Ativar Som" : "🔊 Silenciar";
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

  // Intercepta chamadas a /api/generate com trilha 100% adaptada ao nicho!
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

            // Envia prompt musical exato do nicho/estilo (ex: Brinquedos Alegre, Pet Carinhoso, Moda Editorial!)
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
              parsed.useMusicDatabase = false; // Usa exatamente o prompt sob medida do nicho!
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
