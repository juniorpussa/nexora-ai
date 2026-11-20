<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NEXORA.AI — Fotos e Vídeos Comerciais com IA</title>
  <style>
    :root {
      --bg: #090b10;
      --panel: #11151f;
      --panel-2: #161b28;
      --border: #232a3b;
      --text: #f3f6fc;
      --muted: #9aa4b8;
      --accent: #10b981;
      --accent-hover: #059669;
      --danger: #f87171;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      line-height: 1.45;
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 26px;
      border-bottom: 1px solid var(--border);
      background: rgba(17, 21, 31, 0.9);
      backdrop-filter: blur(8px);
      position: sticky;
      top: 0;
      z-index: 20;
    }

    .brand {
      font-weight: 800;
      letter-spacing: 0.08em;
      font-size: 1.15rem;
      color: var(--text);
    }

    .brand span { color: var(--accent); }

    .credits-box {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--panel-2);
      border: 1px solid var(--border);
      padding: 6px 8px 6px 14px;
      border-radius: 999px;
      font-size: 0.88rem;
    }

    .credits-box strong { color: var(--accent); }

    .btn-recharge {
      background: var(--accent);
      color: #062118;
      border: none;
      font-weight: 700;
      font-size: 0.84rem;
      padding: 7px 14px;
      border-radius: 999px;
      cursor: pointer;
    }

    .btn-recharge:hover { background: var(--accent-hover); color: #ffffff; }

    .hero {
      text-align: center;
      padding: 24px 20px 10px;
      max-width: 820px;
      margin: 0 auto;
    }

    .hero h1 {
      font-size: clamp(1.4rem, 3vw, 2rem);
      font-weight: 800;
      margin-bottom: 6px;
    }

    .hero p { color: var(--muted); font-size: 0.94rem; }

    .mode-switch {
      display: inline-flex;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 4px;
      margin-top: 16px;
      gap: 4px;
    }

    .mode-btn {
      border: none;
      background: transparent;
      color: var(--muted);
      font-weight: 700;
      font-size: 0.88rem;
      padding: 9px 18px;
      border-radius: 999px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .mode-btn.active {
      background: var(--accent);
      color: #052017;
    }

    .container {
      max-width: 1160px;
      margin: 18px auto 48px;
      padding: 0 20px;
      display: grid;
      grid-template-columns: 1.08fr 0.92fr;
      gap: 22px;
      align-items: start;
    }

    @media (max-width: 900px) {
      .container { grid-template-columns: 1fr; }
    }

    .card {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .step-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
      font-size: 0.98rem;
    }

    .step-badge {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.16);
      color: var(--accent);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.82rem;
      font-weight: 800;
    }

    .upload-zone {
      border: 1.5px dashed #334155;
      border-radius: 12px;
      padding: 22px 16px;
      text-align: center;
      cursor: pointer;
      background: var(--panel-2);
      min-height: 175px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .upload-zone:hover { border-color: var(--accent); background: #1a2132; }
    .upload-zone img { max-height: 165px; max-width: 100%; border-radius: 8px; object-fit: contain; }
    .upload-hint { color: var(--muted); font-size: 0.8rem; }

    .cat-label {
      font-size: 0.76rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--accent);
      font-weight: 800;
      margin: 12px 0 6px;
    }

    .styles-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      max-height: 360px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .styles-grid.single-col {
      grid-template-columns: 1fr;
      max-height: none;
    }

    @media (max-width: 600px) {
      .styles-grid { grid-template-columns: 1fr; }
    }

    .style-option {
      width: 100%;
      text-align: left;
      background: var(--panel-2);
      border: 1.5px solid var(--border);
      border-radius: 10px;
      padding: 10px 12px;
      cursor: pointer;
      color: var(--text);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .style-option:hover { border-color: #3b4963; }
    .style-option.active { border-color: var(--accent); background: rgba(16, 185, 129, 0.1); }

    .style-name { font-weight: 700; font-size: 0.86rem; display: block; }
    .style-desc { color: var(--muted); font-size: 0.76rem; display: block; margin-top: 2px; }
    .style-check { color: var(--accent); font-weight: 800; font-size: 0.95rem; opacity: 0; }
    .style-option.active .style-check { opacity: 1; }

    .btn-generate {
      width: 100%;
      background: var(--accent);
      color: #052017;
      border: none;
      border-radius: 11px;
      padding: 14px 18px;
      font-size: 0.96rem;
      font-weight: 800;
      cursor: pointer;
    }

    .btn-generate:hover:not(:disabled) { background: var(--accent-hover); color: #ffffff; }
    .btn-generate:disabled { opacity: 0.55; cursor: not-allowed; }

    .result-box {
      background: #07090e;
      border: 1px solid var(--border);
      border-radius: 12px;
      min-height: 360px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
      text-align: center;
      color: var(--muted);
      font-size: 0.9rem;
      gap: 12px;
    }

    .result-box img {
      max-width: 100%;
      max-height: 410px;
      border-radius: 10px;
      object-fit: contain;
    }

    .blueprint-box {
      width: 100%;
      text-align: left;
      background: var(--panel-2);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px;
      font-size: 0.8rem;
      color: var(--text);
      white-space: pre-line;
    }

    .actions-row {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .error-text { color: var(--danger); font-weight: 600; white-space: pre-wrap; }

    .btn-download {
      width: 100%;
      background: transparent;
      color: var(--accent);
      border: 1.5px solid var(--accent);
      border-radius: 11px;
      padding: 12px 16px;
      font-size: 0.94rem;
      font-weight: 700;
      cursor: pointer;
    }

    .btn-download:hover { background: var(--accent); color: #052017; }

    .btn-secondary {
      width: 100%;
      background: var(--panel-2);
      color: var(--text);
      border: 1px solid var(--border);
      border-radius: 11px;
      padding: 11px 16px;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
    }

    .btn-secondary:hover { border-color: var(--accent); }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.72);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 18px;
      z-index: 50;
    }

    .modal-backdrop.open { display: flex; }

    .modal {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 16px;
      max-width: 470px;
      width: 100%;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .modal-header { display: flex; align-items: center; justify-content: space-between; }
    .modal-header h2 { font-size: 1.08rem; font-weight: 800; }
    .btn-close { background: transparent; border: none; color: var(--muted); font-size: 1.3rem; cursor: pointer; }

    .plan-card {
      background: var(--panel-2);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 13px 15px;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .plan-top { display: flex; justify-content: space-between; align-items: baseline; font-weight: 800; }
    .plan-price { color: var(--accent); font-size: 1.02rem; }

    .btn-wa {
      display: block;
      text-align: center;
      text-decoration: none;
      background: var(--accent);
      color: #052017;
      font-weight: 800;
      padding: 13px 16px;
      border-radius: 11px;
      font-size: 0.92rem;
    }

    .owner-shortcut {
      border-top: 1px solid var(--border);
      padding-top: 12px;
      display: flex;
      gap: 8px;
    }

    .btn-ghost-sm {
      flex: 1;
      background: var(--panel-2);
      border: 1px solid var(--border);
      color: var(--muted);
      border-radius: 9px;
      padding: 8px 10px;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">NEXORA<span>.AI</span></div>
    <div class="credits-box">
      <span>Créditos: <strong id="creditsCount">999 (Livre)</strong></span>
      <button class="btn-recharge" id="openRechargeBtn" type="button">+ Recarregar</button>
    </div>
  </header>

  <section class="hero">
    <h1>Transforme fotos comuns em criativos prontos para vender</h1>
    <p>Escolha entre 14 estilos visuais de impacto ou monte seu pacote de vídeo dinâmico nos 5 estilos (sem narração, com cortes rápidos, zooms, SFX e trilha).</p>

    <div class="mode-switch" role="tablist">
      <button class="mode-btn active" id="tabImageBtn" type="button">📸 Fotos de Impacto (14 estilos)</button>
      <button class="mode-btn" id="tabVideoBtn" type="button">🎬 Vídeos Dinâmicos (5 estilos)</button>
    </div>
  </section>

  <main class="container">
    <section class="card">
      <div>
        <div class="step-title">
          <span class="step-badge">1</span>
          <span>Envie a foto do produto</span>
        </div>
        <input type="file" id="fileInput" accept="image/jpeg,image/png,image/webp" hidden />
        <div class="upload-zone" id="uploadZone">
          <div id="uploadPlaceholder">
            <div style="font-weight: 700; margin-bottom: 4px;">Clique para enviar a foto</div>
            <div class="upload-hint">JPG, PNG ou WEBP (até 10MB)</div>
          </div>
          <img id="previewImg" alt="Prévia do produto" style="display: none;" />
        </div>
      </div>

      <div id="imageStylesSection">
        <div class="step-title">
          <span class="step-badge">2</span>
          <span>Escolha o estilo visual de impacto</span>
        </div>

        <div class="cat-label">Vitrine &amp; Comerciais</div>
        <div class="styles-grid" id="imageStylesGrid">
          <button class="style-option active" type="button" data-style="clean_showcase"
            data-prompt="Clean commercial e-commerce product showcase photography on a bright neutral background with soft contact shadow. Keep the product 100% faithful to the reference image. Strictly no embedded text, no watermarks, no extra logos.">
            <div><span class="style-name">Fundo Limpo Vitrine</span><span class="style-desc">Fundo claro profissional para catálogo</span></div>
            <span class="style-check">✓</span>
          </button>

          <button class="style-option" type="button" data-style="dark_studio"
            data-prompt="Luxury dark studio product photography on a matte dark podium with dramatic rim lighting. Keep the product 100% faithful to the reference image. Strictly no embedded text, no watermarks, no extra logos.">
            <div><span class="style-name">Estúdio Dark Premium</span><span class="style-desc">Superfície escura com luz de destaque</span></div>
            <span class="style-check">✓</span>
          </button>

          <button class="style-option" type="button" data-style="luxury_marble"
            data-prompt="High-end commercial product photography on refined light natural marble with soft diffused sunlight and elegant reflections. Keep the product 100% faithful to the reference image. Strictly no embedded text, no watermarks, no extra logos.">
            <div><span class="style-name">Vitrine Luxo &amp; Mármore</span><span class="style-desc">Pedra marmorizada e acabamento sofisticado</span></div>
            <span class="style-check">✓</span>
          </button>

          <button class="style-option" type="button" data-style="lifestyle_scene"
            data-prompt="Realistic commercial lifestyle photography placing the product in a clean everyday setting with natural daylight and shallow depth of field. Keep the product 100% faithful to the reference image. Strictly no embedded text, no watermarks, no extra logos.">
            <div><span class="style-name">Cena de Uso (Lifestyle)</span><span class="style-desc">Ambientado em uso cotidiano real</span></div>
            <span class="style-check">✓</span>
          </button>

          <button class="style-option" type="button" data-style="studio_pro"
            data-prompt="StudioPro commercial advertising lighting with crisp softbox highlights, balanced contrast, and ultra-sharp product focus. Keep the product 100% faithful to the reference image. Strictly no embedded text, no watermarks, no extra logos.">
            <div><span class="style-name">StudioPro Iluminação</span><span class="style-desc">Luz profissional de estúdio comercial</span></div>
            <span class="style-check">✓</span>
          </button>

          <button class="style-option" type="button" data-style="luxury_ad"
            data-prompt="LuxuryAd high-budget commercial campaign aesthetic with golden specular highlights, rich textures, and prestige atmosphere. Keep the product 100% faithful to the reference image. Strictly no embedded text, no watermarks, no extra logos.">
            <div><span class="style-name">LuxuryAd Comercial</span><span class="style-desc">Estética premium para anúncios de luxo</span></div>
            <span class="style-check">✓</span>
          </button>

          <button class="style-option" type="button" data-style="movie_scene"
            data-prompt="MovieScene cinematic anamorphic product shot with dramatic volumetric light rays, atmospheric depth, and blockbuster color grading. Keep the product 100% faithful to the reference image. Strictly no embedded text, no watermarks, no extra logos.">
            <div><span class="style-name">MovieScene Cinema</span><span class="style-desc">Estética dramática de filme de cinema</span></div>
            <span class="style-check">✓</span>
          </button>

          <button class="style-option" type="button" data-style="neon_city"
            data-prompt="NeonCity urban night cyberpunk commercial backdrop with electric cyan and magenta reflections on wet dark surfaces. Keep the product 100% faithful to the reference image. Strictly no embedded text, no watermarks, no extra logos.">
            <div><span class="style-name">NeonCity Cyberpunk</span><span class="style-desc">Visual urbano noturno com reflexos neon</span></div>
            <span class="style-check">✓</span>
          </button>

          <button class="style-option" type="button" data-style="magazine_editorial"
            data-prompt="Magazine high-fashion editorial product photography with bold sculptural shadows and modern art-direction backdrop. Keep the product 100% faithful to the reference image. Strictly no embedded text, no watermarks, no extra logos.">
            <div><span class="style-name">Editorial Magazine</span><span class="style-desc">Direção de arte estilo capa de revista</span></div>
            <span class="style-check">✓</span>
          </button>

          <button class="style-option" type="button" data-style="old_money"
            data-prompt="OldMoney timeless classic aesthetic featuring warm walnut wood, linen textures, brass accents, and soft afternoon window light. Keep the product 100% faithful to the reference image. Strictly no embedded text, no watermarks, no extra logos.">
            <div><span class="style-name">OldMoney Clássico</span><span class="style-desc">Estética tradicional, nobre e elegante</span></div>
            <span class="style-check">✓</span>
          </button>

          <button class="style-option" type="button" data-style="low_angle_hero"
            data-prompt="LowAngleHero dramatic upward camera perspective making the product look monumental, powerful, and dominant against a clean dramatic backdrop. Keep the product 100% faithful to the reference image. Strictly no embedded text, no watermarks, no extra logos.">
            <div><span class="style-name">LowAngleHero Imponente</span><span class="style-desc">Câmera baixa apontando para cima</span></div>
            <span class="style-check">✓</span>
          </button>

          <button class="style-option" type="button" data-style="mini_world"
            data-prompt="MiniWorld tilt-shift diorama commercial photography placing the product at giant scale inside a miniature architectural world with shallow depth of field. Keep the product 100% faithful to the reference image. Strictly no embedded text, no watermarks, no extra logos.">
            <div><span class="style-name">MiniWorld Diorama</span><span class="style-desc">Efeito miniatura tilt-shift criativo</span></div>
            <span class="style-check">✓</span>
          </button>

          <button class="style-option" type="button" data-style="exploded_view"
            data-prompt="ExplodedView technical commercial showcase revealing floating precision components and internal engineering suspended cleanly around the main product. Keep the main product 100% faithful to the reference image. Strictly no embedded text, no watermarks, no extra logos.">
            <div><span class="style-name">ExplodedView / Teardown</span><span class="style-desc">Vista explodida e componentes no ar</span></div>
            <span class="style-check">✓</span>
          </button>

          <button class="style-option" type="button" data-style="reveal_impact"
            data-prompt="Reveal dynamic emerging product showcase breaking cleanly through energy light waves, mist, or sleek geometric panels with high contrast. Keep the product 100% faithful to the reference image. Strictly no embedded text, no watermarks, no extra logos.">
            <div><span class="style-name">Reveal Surgimento</span><span class="style-desc">Efeito de revelação de alto impacto</span></div>
            <span class="style-check">✓</span>
          </button>
        </div>
      </div>

      <div id="videoStylesSection" style="display: none;">
        <div class="step-title" style="margin-bottom: 10px;">
          <span class="step-badge">2</span>
          <span>Escolha o estilo do vídeo dinâmico (9:16)</span>
        </div>

        <div class="styles-grid single-col" id="videoStylesGrid">
          <button class="style-option active" type="button" data-vstyle="vid_clean"
            data-vprompt="Dynamic vertical 9:16 commercial hero frame on a bright clean showcase studio background with crisp rim light and subtle motion energy. Keep the product 100% faithful to the reference image. Strictly no embedded text, no watermarks, no extra logos."
            data-blueprint="ESTILO: Vídeo 1 — Fundo Limpo Vitrine Dinâmico (9:16, sem narração)\n• Cortes & Zooms: Crash zoom de entrada (0s-1.5s), cortes rápidos a cada 1s-1.5s com zoom punch no produto.\n• Efeitos Visuais: Varredura de brilho limpa + partículas sutis nas transições.\n• SFX & Trilha: Whoosh nítido nos cortes, pop seco no zoom + batida comercial moderna em alta energia.">
            <div><span class="style-name">🎬 Vídeo 1 — Fundo Limpo Vitrine Dinâmico</span><span class="style-desc">Zooms rápidos, cortes ágeis, efeitos sonoros e batida comercial</span></div>
            <span class="style-check">✓</span>
          </button>

          <button class="style-option" type="button" data-vstyle="vid_dark"
            data-vprompt="Dramatic vertical 9:16 commercial hero frame on a matte dark studio podium with intense rim lighting and sleek highlights. Keep the product 100% faithful to the reference image. Strictly no embedded text, no watermarks, no extra logos."
            data-blueprint="ESTILO: Vídeo 2 — Estúdio Dark Premium Turbo (9:16, sem narração)\n• Cortes & Zooms: Zoom rápido agressivo + cortes secos sincronizados no grave.\n• Efeitos Visuais: Flashes de luz lateral + leve blur direcional nos cortes.\n• SFX & Trilha: Impacto grave (sub-bass) nos cortes + trilha eletrônica intensa.">
            <div><span class="style-name">🎬 Vídeo 2 — Estúdio Dark Premium Turbo</span><span class="style-desc">Cortes rápidos, flashes de luz, graves de impacto e trilha intensa</span></div>
            <span class="style-check">✓</span>
          </button>

          <button class="style-option" type="button" data-vstyle="vid_lifestyle"
            data-vprompt="Vibrant vertical 9:16 commercial lifestyle product frame in a modern everyday setting with natural sunlight flares. Keep the product 100% faithful to the reference image. Strictly no embedded text, no watermarks, no extra logos."
            data-blueprint="ESTILO: Vídeo 3 — Cena de Uso (Lifestyle) Acelerado (9:16, sem narração)\n• Cortes & Zooms: Speed-ramp dinâmico + cortes rápidos mostrando uso e detalhe.\n• Efeitos Visuais: Flare natural de luz + transição rápida de movimento.\n• SFX & Trilha: Whoosh de movimento + clique/foley nítido + trilha vibrante.">
            <div><span class="style-name">🎬 Vídeo 3 — Cena de Uso (Lifestyle) Acelerado</span><span class="style-desc">Speed-ramp, transições rápidas, SFX nítidos e trilha vibrante</span></div>
            <span class="style-check">✓</span>
          </button>

          <button class="style-option" type="button" data-vstyle="vid_marble"
            data-vprompt="Upscale vertical 9:16 luxury natural marble showcase product frame with refined golden light reflections. Keep the product 100% faithful to the reference image. Strictly no embedded text, no watermarks, no extra logos."
            data-blueprint="ESTILO: Vídeo 4 — Vitrine Luxo & Mármore (9:16, sem narração)\n• Cortes & Zooms: Zoom rápido do detalhe para enquadramento cheio + cortes firmes.\n• Efeitos Visuais: Feixe dourado deslizante + bokeh suave nas passagens.\n• SFX & Trilha: Whoosh suave + toque de impacto elegante + trilha sofisticada.">
            <div><span class="style-name">🎬 Vídeo 4 — Vitrine Luxo &amp; Mármore</span><span class="style-desc">Zoom macro rápido, varredura de luz dourada e som sofisticado</span></div>
            <span class="style-check">✓</span>
          </button>

          <button class="style-option" type="button" data-vstyle="vid_impact"
            data-vprompt="High-retention vertical 9:16 explosive commercial product frame with energetic light streaks and sharp contrast. Keep the product 100% faithful to the reference image. Strictly no embedded text, no watermarks, no extra logos."
            data-blueprint="ESTILO: Vídeo 5 — Impacto Criativo / Retenção Máxima (9:16, sem narração)\n• Cortes & Zooms: Cortes ultra-rápidos + crash zooms constantes sem respiro.\n• Efeitos Visuais: Raios de luz, zoom punch e flash branco curto nos cortes.\n• SFX & Trilha: Riser curto + impacto forte + trilha de adrenalina.">
            <div><span class="style-name">🎬 Vídeo 5 — Impacto Criativo / Retenção Máxima</span><span class="style-desc">Cortes ultra-rápidos, raios de luz, risers e trilha de alta energia</span></div>
            <span class="style-check">✓</span>
          </button>
        </div>
      </div>

      <button class="btn-generate" id="generateBtn" type="button">
        Gerar Foto Profissional (Modo Teste Livre)
      </button>
    </section>

    <section class="card">
      <div class="step-title">
        <span class="step-badge">3</span>
        <span>Resultado pronto para publicar</span>
      </div>

      <div class="result-box" id="resultBox">
        <span id="resultPlaceholder">O criativo gerado aparecerá aqui pronto para download.</span>
        <img id="resultImg" alt="Resultado gerado" style="display: none;" />
        <div id="blueprintBox" class="blueprint-box" style="display: none;"></div>
        <div id="errorMsg" class="error-text" style="display: none;"></div>
      </div>

      <div class="actions-row">
        <button class="btn-download" id="downloadBtn" type="button" style="display: none;">
          Baixar Imagem em Alta Qualidade
        </button>
        <button class="btn-secondary" id="copyBlueprintBtn" type="button" style="display: none;">
          Copiar Guia de Cortes, Zooms, SFX &amp; Trilha
        </button>
      </div>
    </section>
  </main>

  <div class="modal-backdrop" id="rechargeModal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
    <div class="modal">
      <div class="modal-header">
        <h2 id="modalTitle">Recarregar Créditos — NEXORA.AI</h2>
        <button class="btn-close" id="closeRechargeBtn" type="button" aria-label="Fechar">×</button>
      </div>

      <div class="plan-card">
        <div class="plan-top">
          <span>Plano Mensal PRO (com teste gratuito)</span>
          <span class="plan-price">R$ 40,00/mês</span>
        </div>
        <span class="style-desc">Geração de fotos comerciais e pacotes de vídeo dinâmico + suporte direto no WhatsApp.</span>
      </div>

      <div class="plan-card">
        <div class="plan-top">
          <span>Pacote Avulso via Pix</span>
          <span class="plan-price">10% OFF no Pix</span>
        </div>
        <span class="style-desc">Ideal para lotes rápidos de produtos, catálogo e criativos de anúncios.</span>
      </div>

      <a
        class="btn-wa"
        href="https://wa.me/5511975381981?text=Ol%C3%A1%2C%20quero%20recarregar%20cr%C3%A9ditos%20no%20NEXORA.AI!"
        target="_blank"
        rel="noopener noreferrer"
      >
        Chamar no WhatsApp (11 97538-1981)
      </a>

      <div class="owner-shortcut">
        <button class="btn-ghost-sm" id="add50Btn" type="button">+50 créditos (teste)</button>
        <button class="btn-ghost-sm" id="add200Btn" type="button">+200 créditos (teste)</button>
      </div>
    </div>
  </div>

  <script>
    const FREE_TEST_MODE = true;
    const STORAGE_KEY = "nexora_ai_credits_v4";
    const INITIAL_CREDITS = 999;

    let credits = Number(localStorage.getItem(STORAGE_KEY));
    if (Number.isNaN(credits) || credits < 50) credits = INITIAL_CREDITS;

    let currentMode = "image";
    let selectedBase64 = null;
    let selectedMimeType = "image/jpeg";

    const activeImgBtn = document.querySelector("#imageStylesGrid .style-option.active");
    const activeVidBtn = document.querySelector("#videoStylesGrid .style-option.active");

    let selectedImagePrompt = activeImgBtn.dataset.prompt;
    let selectedImageKey = activeImgBtn.dataset.style;

    let selectedVideoPrompt = activeVidBtn.dataset.vprompt;
    let selectedVideoKey = activeVidBtn.dataset.vstyle;
    let selectedVideoBlueprint = activeVidBtn.dataset.blueprint;

    let generatedDataUrl = null;

    const creditsCountEl = document.getElementById("creditsCount");
    const fileInput = document.getElementById("fileInput");
    const uploadZone = document.getElementById("uploadZone");
    const uploadPlaceholder = document.getElementById("uploadPlaceholder");
    const previewImg = document.getElementById("previewImg");
    const generateBtn = document.getElementById("generateBtn");
    const resultPlaceholder = document.getElementById("resultPlaceholder");
    const resultImg = document.getElementById("resultImg");
    const blueprintBox = document.getElementById("blueprintBox");
    const errorMsg = document.getElementById("errorMsg");
    const downloadBtn = document.getElementById("downloadBtn");
    const copyBlueprintBtn = document.getElementById("copyBlueprintBtn");
    const rechargeModal = document.getElementById("rechargeModal");

    const tabImageBtn = document.getElementById("tabImageBtn");
    const tabVideoBtn = document.getElementById("tabVideoBtn");
    const imageStylesSection = document.getElementById("imageStylesSection");
    const videoStylesSection = document.getElementById("videoStylesSection");

    function renderCredits() {
      creditsCountEl.textContent = FREE_TEST_MODE ? `${credits} (Livre)` : credits;
      localStorage.setItem(STORAGE_KEY, String(credits));
    }

    function updateGenerateButtonLabel() {
      generateBtn.textContent = currentMode === "image"
        ? "Gerar Foto Profissional (Modo Teste Livre)"
        : "Gerar Cena + Guia de Vídeo 9:16 (Modo Teste Livre)";
    }

    function setError(msg) {
      resultImg.style.display = "none";
      blueprintBox.style.display = "none";
      downloadBtn.style.display = "none";
      copyBlueprintBtn.style.display = "none";
      resultPlaceholder.style.display = "none";
      errorMsg.textContent = msg;
      errorMsg.style.display = "block";
    }

    function setGeneratedResult(src, blueprintText) {
      errorMsg.style.display = "none";
      resultPlaceholder.style.display = "none";
      generatedDataUrl = src;

      resultImg.src = src;
      resultImg.style.display = "block";
      downloadBtn.style.display = "block";

      if (blueprintText) {
        blueprintBox.textContent = blueprintText;
        blueprintBox.style.display = "block";
        copyBlueprintBtn.style.display = "block";
      } else {
        blueprintBox.style.display = "none";
        copyBlueprintBtn.style.display = "none";
      }
    }

    renderCredits();

    tabImageBtn.addEventListener("click", () => {
      currentMode = "image";
      tabImageBtn.classList.add("active");
      tabVideoBtn.classList.remove("active");
      imageStylesSection.style.display = "block";
      videoStylesSection.style.display = "none";
      updateGenerateButtonLabel();
    });

    tabVideoBtn.addEventListener("click", () => {
      currentMode = "video";
      tabVideoBtn.classList.add("active");
      tabImageBtn.classList.remove("active");
      imageStylesSection.style.display = "none";
      videoStylesSection.style.display = "block";
      updateGenerateButtonLabel();
    });

    uploadZone.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        setError("A imagem excede o limite de 10MB.");
        return;
      }

      selectedMimeType = file.type || "image/jpeg";
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        previewImg.src = result;
        previewImg.style.display = "block";
        uploadPlaceholder.style.display = "none";
        const parts = result.split(",");
        selectedBase64 = parts.length > 1 ? parts[1] : result;
      };
      reader.readAsDataURL(file);
    });

    document.querySelectorAll("#imageStylesGrid .style-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#imageStylesGrid .style-option").forEach((el) => el.classList.remove("active"));
        btn.classList.add("active");
        selectedImagePrompt = btn.dataset.prompt;
        selectedImageKey = btn.dataset.style;
      });
    });

    document.querySelectorAll("#videoStylesGrid .style-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#videoStylesGrid .style-option").forEach((el) => el.classList.remove("active"));
        btn.classList.add("active");
        selectedVideoPrompt = btn.dataset.vprompt;
        selectedVideoKey = btn.dataset.vstyle;
        selectedVideoBlueprint = btn.dataset.blueprint;
      });
    });

    document.getElementById("openRechargeBtn").addEventListener("click", () => rechargeModal.classList.add("open"));
    document.getElementById("closeRechargeBtn").addEventListener("click", () => rechargeModal.classList.remove("open"));
    rechargeModal.addEventListener("click", (e) => { if (e.target === rechargeModal) rechargeModal.classList.remove("open"); });

    document.getElementById("add50Btn").addEventListener("click", () => {
      credits += 50;
      renderCredits();
      rechargeModal.classList.remove("open");
    });

    document.getElementById("add200Btn").addEventListener("click", () => {
      credits += 200;
      renderCredits();
      rechargeModal.classList.remove("open");
    });

    generateBtn.addEventListener("click", async () => {
      if (!selectedBase64) {
        setError("Envie a foto do produto antes de gerar.");
        return;
      }

      if (!FREE_TEST_MODE && credits <= 0) {
        rechargeModal.classList.add("open");
        setError("Seus créditos acabaram. Clique em + Recarregar para continuar.");
        return;
      }

      const isVideoMode = currentMode === "video";
      generateBtn.disabled = true;
      generateBtn.textContent = isVideoMode
        ? "Gerando cena base + guia de vídeo..."
        : "Gerando imagem de impacto...";

      errorMsg.style.display = "none";
      resultImg.style.display = "none";
      blueprintBox.style.display = "none";
      downloadBtn.style.display = "none";
      copyBlueprintBtn.style.display = "none";
      resultPlaceholder.textContent = "Processando no NEXORA.AI...";
      resultPlaceholder.style.display = "block";

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "image",
            imageBase64: selectedBase64,
            mimeType: selectedMimeType,
            style: isVideoMode ? selectedVideoKey : selectedImageKey,
            prompt: isVideoMode ? selectedVideoPrompt : selectedImagePrompt
          })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.error || `Erro do servidor (HTTP ${res.status})`);
        }

        const imgSrc = data.imageUrl || (data.imageBase64 ? `data:${data.mimeType || "image/png"};base64,${data.imageBase64}` : null);
        if (!imgSrc) throw new Error("A resposta não retornou a imagem.");

        setGeneratedResult(imgSrc, isVideoMode ? selectedVideoBlueprint : null);

        if (!FREE_TEST_MODE) {
          credits = Math.max(0, credits - 1);
          renderCredits();
        }
      } catch (err) {
        setError(err.message || "Falha ao processar solicitação.");
      } finally {
        generateBtn.disabled = false;
        updateGenerateButtonLabel();
      }
    });

    downloadBtn.addEventListener("click", () => {
      if (!generatedDataUrl) return;
      const activeKey = currentMode === "video" ? selectedVideoKey : selectedImageKey;
      const link = document.createElement("a");
      link.href = generatedDataUrl;
      link.download = `nexora-${activeKey}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    copyBlueprintBtn.addEventListener("click", async () => {
      if (!selectedVideoBlueprint) return;
      try {
        await navigator.clipboard.writeText(selectedVideoBlueprint);
        copyBlueprintBtn.textContent = "Guia Copiado!";
        setTimeout(() => {
          copyBlueprintBtn.textContent = "Copiar Guia de Cortes, Zooms, SFX & Trilha";
        }, 1800);
      } catch {
        setError("Não foi possível copiar automaticamente. Selecione o texto do guia.");
      }
    });
  </script>
</body>
</html>
