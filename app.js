/**
 * Main Application Controller (English Default + Spanish Toggle)
 * Coordinates Entry Animation, Top 4 CAD Stage, Animated Impact Counters, 8 Service Verticals,
 * 8-Pack Resource Vault + KaTeX Equations, Structured Checkout Modal, 5-Mode Simulators,
 * Social Proof Reviews, and Hardened Quote Builder.
 */
(function () {
  'use strict';

  const CONFIG = window.STUDIO_CONFIG;
  const I18N = window.STUDIO_I18N;
  const {
    DoublePendulumSim,
    FourierEpicyclesSim,
    BeamSolverSim,
    CfdVortexSim,
    SeismicTmdSim,
  } = window.StudioSims;
  const CadVault = window.CadVault;

  const SIM_EQUATIONS = Object.freeze({
    beam: 'EI\\,\\frac{d^4 v}{dx^4} = q(x), \\qquad R_A = \\frac{P\\,b}{L}, \\qquad M_{\\max} = \\frac{P\\,a\\,b}{L}',
    cfd: '\\frac{\\partial \\mathbf{u}}{\\partial t} + (\\mathbf{u}\\cdot\\nabla)\\mathbf{u} = -\\frac{1}{\\rho}\\nabla p + \\nu\\nabla^2\\mathbf{u}, \\qquad St = \\frac{f\\,D}{U_\\infty}',
    tmd: 'm_1\\ddot{x}_1 + c_1\\dot{x}_1 + k_1 x_1 = c_d\\dot{u} + k_d u - m_1\\ddot{x}_g, \\qquad f_{\\mathrm{opt}} = \\frac{1}{1+\\mu}',
    fourier: 'z(t) = \\sum_{k=-N}^{N} c_k\\,e^{i k \\omega t}, \\qquad c_k = \\frac{1}{M}\\sum_{n=0}^{M-1} z_n\\,e^{-i\\frac{2\\pi k n}{M}}',
    chaos: '\\frac{d}{dt}\\!\\begin{bmatrix}\\theta_1\\\\\\theta_2\\end{bmatrix} \\;\\Longrightarrow\\; \\|\\Delta\\theta(t)\\| \\approx \\delta_0\\,e^{\\lambda t}',
  });

  const SVG_NS = 'http://www.w3.org/2000/svg';

  const SOLVE_ICON_SHAPES = Object.freeze({
    cad: [
      ['path', { d: 'M12 2L2 7l10 5 10-5-10-5z' }],
      ['path', { d: 'M2 17l10 5 10-5' }],
      ['path', { d: 'M2 12l10 5 10-5' }],
    ],
    paper: [
      ['path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }],
      ['polyline', { points: '14 2 14 8 20 8' }],
      ['line', { x1: '16', y1: '13', x2: '8', y2: '13' }],
      ['line', { x1: '16', y1: '17', x2: '8', y2: '17' }],
    ],
    cae: [['path', { d: 'M3 12h4l3-8 4 16 3-8h4' }]],
    cfd: [['path', { d: 'M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2' }]],
    code: [
      ['polyline', { points: '16 18 22 12 16 6' }],
      ['polyline', { points: '8 6 2 12 8 18' }],
    ],
    latex: [
      ['path', { d: 'M4 7V4h16v3' }],
      ['path', { d: 'M9 20h6' }],
      ['path', { d: 'M12 4v16' }],
    ],
    mech: [
      ['circle', { cx: '12', cy: '12', r: '3' }],
      ['path', { d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.77 1.02 1.41 1.11H21a2 2 0 0 1 0 4h-.09c-.64.09-1.15.51-1.51 1.11z' }],
    ],
    bolt: [['polygon', { points: '13 2 3 14 12 14 11 22 21 10 12 10 13 2' }]],
  });

  let currentLang = 'en';
  let activeModelId = CONFIG.cadModels[0].id;
  let activeSimTab = 'beam';
  let activeModalPack = null;
  let activeCheckoutOrder = null;
  let activePaymentMethod = 'card_paypal';
  let cadVault = null;
  let simCanvas = null;
  let simCtx = null;
  let beamSim = null;
  let cfdSim = null;
  let tmdSim = null;
  let fourierSim = null;
  let chaosSim = null;
  let lastFrameTime = performance.now();
  let revealObserver = null;

  function t(key) {
    return (I18N[currentLang] && I18N[currentLang][key]) || (I18N.en && I18N.en[key]) || key;
  }

  function sanitizeText(raw, maxLen = 500) {
    if (typeof raw !== 'string') return '';
    return raw
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
      .replace(/[<>]/g, '')
      .trim()
      .slice(0, maxLen);
  }

  function isSafeRelativeUrl(url) {
    return typeof url === 'string' && /^\.\/[a-zA-Z0-9_.\-\/]+$/.test(url) && !url.includes('..');
  }

  function buildSafeWhatsAppUrl(text) {
    const phoneDigits = String(CONFIG.brand.whatsappNumber || '').replace(/[^0-9]/g, '');
    if (!/^[0-9]{8,15}$/.test(phoneDigits)) return '#quote';
    const cleanText = sanitizeText(text, 750);
    return cleanText
      ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(cleanText)}`
      : `https://wa.me/${phoneDigits}`;
  }

  function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined && text !== null) el.textContent = String(text);
    return el;
  }

  function createSolveIconSvg(key) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.9');
    svg.setAttribute('aria-hidden', 'true');
    const shapes = SOLVE_ICON_SHAPES[key] || SOLVE_ICON_SHAPES.cad;
    shapes.forEach(([tag, attrs]) => {
      const node = document.createElementNS(SVG_NS, tag);
      Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
      svg.appendChild(node);
    });
    return svg;
  }

  function createStarSvg() {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', '13');
    svg.setAttribute('height', '13');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('aria-hidden', 'true');
    const poly = document.createElementNS(SVG_NS, 'polygon');
    poly.setAttribute('points', '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2');
    svg.appendChild(poly);
    return svg;
  }

  function renderTex(el, tex, displayMode = false) {
    if (!el) return;
    if (window.katex && typeof window.katex.render === 'function') {
      try {
        window.katex.render(tex, el, { throwOnError: false, displayMode });
        return;
      } catch (err) {
        // Fallback below
      }
    }
    el.textContent = tex;
  }

  function renderMathInNode(el, texMaybeDelimited) {
    if (!el) return;
    if (typeof texMaybeDelimited === 'string') {
      if (el.dataset.lastTex === texMaybeDelimited) return;
      el.dataset.lastTex = texMaybeDelimited;
      const trimmed = texMaybeDelimited.trim();
      if (trimmed.startsWith('\\(') && trimmed.endsWith('\\)')) {
        renderTex(el, trimmed.slice(2, -2), false);
        return;
      }
      el.textContent = texMaybeDelimited;
    }
    if (typeof window.renderMathInElement === 'function') {
      try {
        window.renderMathInElement(el, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '\\(', right: '\\)', display: false },
          ],
          throwOnError: false,
        });
      } catch (err) {
        // Non-blocking fallback
      }
    }
  }

  function observeReveals(root = document) {
    const items = root.querySelectorAll('.reveal:not(.in-view)');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('in-view'));
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in-view');
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.06, rootMargin: '0px 0px -20px 0px' }
      );
    }
    items.forEach((el) => revealObserver.observe(el));
  }

  function initSpotlights() {
    document.addEventListener('pointermove', (e) => {
      const card = e.target.closest('.spotlight-card');
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      card.style.setProperty('--my', `${e.clientY - rect.top}px`);
    });
  }

  function initEntryIntro() {
    const intro = document.getElementById('entryIntro');
    if (!intro) return;

    const dismiss = (immediate = false) => {
      if (intro.dataset.dismissed === '1') return;
      intro.dataset.dismissed = '1';
      intro.setAttribute('aria-hidden', 'true');
      intro.classList.add('intro-exit');
      if (immediate) {
        intro.remove();
        return;
      }
      window.setTimeout(() => {
        if (intro.parentNode) intro.remove();
      }, 360);
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      dismiss(true);
      return;
    }

    const timer = window.setTimeout(() => dismiss(false), 620);
    const skipHandler = () => {
      window.clearTimeout(timer);
      dismiss(false);
    };

    intro.addEventListener('click', skipHandler, { once: true });
    window.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
          skipHandler();
        }
      },
      { once: true }
    );
  }

  function applyTranslations() {
    document.documentElement.lang = currentLang;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (el.id === 'cadSpinBtn' && cadVault) {
        el.textContent = cadVault.autoRotate ? t('view_spin_pause') : t('view_spin_play');
        return;
      }
      el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
      const key = el.getAttribute('data-i18n-ph');
      el.setAttribute('placeholder', t(key));
    });
    const toggle = document.getElementById('langToggle');
    if (toggle) {
      toggle.textContent = currentLang === 'en' ? 'EN | ES' : 'ES | EN';
    }
    renderCadModelSelector();
    renderImpactStats();
    renderSolveGrid();
    renderPacksGrid();
    renderReviewsGrid();
    updateSimEquationBanner();
    updateQuoteEstimator();
    if (activeModalPack && document.getElementById('packPreviewModal')?.classList.contains('open')) {
      openPackModal(activeModalPack);
    }
    if (activeCheckoutOrder && document.getElementById('checkoutModal')?.classList.contains('open')) {
      syncCheckoutModalView();
    }
  }

  /* -------------------------------------------------------------------------
   * Top 4 Flagship 3D CAD Stage
   * ---------------------------------------------------------------------- */
  function renderCadModelSelector() {
    const dock = document.getElementById('cadModelSelector');
    if (!dock) return;
    dock.replaceChildren();

    CONFIG.cadModels.forEach((m) => {
      const tagText = currentLang === 'es' ? m.tag.replace('parts', 'piezas') : m.tag;
      const btn = createEl('button', `cad-model-btn ${m.id === activeModelId ? 'active' : ''}`);
      btn.type = 'button';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', m.id === activeModelId ? 'true' : 'false');
      btn.dataset.modelId = m.id;

      const topRow = createEl('div', 'cad-btn-top');
      topRow.appendChild(createEl('span', 'cad-btn-tag', tagText));
      topRow.appendChild(createEl('span', 'cad-btn-std', m.standard));

      btn.appendChild(topRow);
      btn.appendChild(createEl('span', 'cad-btn-title', t(`model_${m.id}_name`)));
      btn.appendChild(createEl('span', 'cad-btn-sub', t(`model_${m.id}_sub`)));
      btn.addEventListener('click', () => selectCadModel(m.id));
      dock.appendChild(btn);
    });

    const activeNameEl = document.getElementById('cadActiveName');
    if (activeNameEl) activeNameEl.textContent = t(`model_${activeModelId}_name`);
  }

  function selectCadModel(modelId) {
    activeModelId = modelId;
    document.querySelectorAll('#cadModelSelector .cad-model-btn').forEach((btn) => {
      const isMatch = btn.dataset.modelId === modelId;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });
    const activeNameEl = document.getElementById('cadActiveName');
    if (activeNameEl) activeNameEl.textContent = t(`model_${modelId}_name`);
    if (cadVault) cadVault.loadModel(modelId);
  }

  function initCadVault() {
    const container = document.getElementById('cadVaultContainer');
    const overlay = document.getElementById('cadLoadingOverlay');
    const pEl = document.getElementById('cadTeleParts');
    const tEl = document.getElementById('cadTeleTris');
    const sEl = document.getElementById('cadTeleStd');
    const iEl = document.getElementById('cadTeleIntf');

    cadVault = new CadVault({
      container,
      onLoadStateChange: (loading) => {
        if (overlay) overlay.classList.toggle('visible', Boolean(loading));
      },
      onStatsChange: (stats) => {
        if (pEl) pEl.textContent = `${stats.parts}`;
        if (tEl) tEl.textContent = Number(stats.triangles).toLocaleString();
        if (sEl) sEl.textContent = stats.standard;
        if (iEl) iEl.textContent = stats.status;
      },
    });

    document.querySelectorAll('[data-cad-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-cad-mode');
        document.querySelectorAll('[data-cad-mode]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        cadVault.setRenderMode(mode);
      });
    });

    document.querySelectorAll('[data-cad-cam]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cam = btn.getAttribute('data-cad-cam');
        document.querySelectorAll('[data-cad-cam]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        cadVault.setCameraPreset(cam);
      });
    });

    const spinBtn = document.getElementById('cadSpinBtn');
    if (spinBtn) {
      spinBtn.classList.toggle('active', cadVault.autoRotate);
      spinBtn.textContent = cadVault.autoRotate ? t('view_spin_pause') : t('view_spin_play');
      spinBtn.addEventListener('click', () => {
        const spinning = cadVault.toggleAutoRotate();
        spinBtn.classList.toggle('active', spinning);
        spinBtn.textContent = spinning ? t('view_spin_pause') : t('view_spin_play');
      });
    }

    selectCadModel(activeModelId);
  }

  /* -------------------------------------------------------------------------
   * Credibility Impact Ribbon
   * ---------------------------------------------------------------------- */
  function renderImpactStats() {
    const ribbon = document.getElementById('impactStatsGrid');
    if (!ribbon) return;
    ribbon.replaceChildren();

    CONFIG.impactStats.forEach((st) => {
      const card = createEl('div', 'impact-stat');
      const valueStr =
        st.text !== undefined
          ? st.text
          : `${Number(st.target).toFixed(st.decimals || 0)}${st.suffix || ''}`;
      card.appendChild(createEl('span', 'impact-val', valueStr));
      card.appendChild(createEl('span', 'impact-lbl', t(`${st.id}_label`)));
      ribbon.appendChild(card);
    });
  }

  /* -------------------------------------------------------------------------
   * Expanded Solutions Grid (8 Verticals)
   * ---------------------------------------------------------------------- */
  function renderSolveGrid() {
    const grid = document.getElementById('solveGrid');
    if (!grid) return;
    grid.replaceChildren();

    CONFIG.services.forEach((srv) => {
      const title = t(`srv_${srv.id}_title`);
      const desc = t(`srv_${srv.id}_desc`);
      const wsMsg =
        currentLang === 'es'
          ? `Hola, necesito ayuda con: ${title}. ¿Podemos revisar los detalles?`
          : `Hi, I need assistance with: ${title}. Can we review scope and timeline?`;

      const card = createEl('article', 'solve-card spotlight-card reveal');
      const top = document.createElement('div');
      const iconBox = createEl('div', 'solve-icon');
      iconBox.appendChild(createSolveIconSvg(srv.icon));
      top.appendChild(iconBox);
      top.appendChild(createEl('h3', '', title));
      top.appendChild(createEl('p', '', desc));

      const foot = createEl('div', 'solve-foot');
      foot.appendChild(createEl('span', 'solve-price', `${t('srv_from_prefix')} $${srv.fromUsd} USD`));

      const link = createEl('a', 'btn btn-secondary btn-sm', t('srv_cta'));
      link.href = buildSafeWhatsAppUrl(wsMsg);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      foot.appendChild(link);

      card.appendChild(top);
      card.appendChild(foot);
      grid.appendChild(card);
    });

    observeReveals(grid);
  }

  /* -------------------------------------------------------------------------
   * Resource Vault (8 Cards + KaTeX Equations + Modal Inspector + Checkout)
   * ---------------------------------------------------------------------- */
  function createPriceEl(priceUsd) {
    const wrap = createEl('div', 'pack-price');
    wrap.appendChild(document.createTextNode(`$${Number(priceUsd)}`));
    wrap.appendChild(createEl('small', '', 'USD'));
    return wrap;
  }

  function renderPacksGrid() {
    const grid = document.getElementById('packsGrid');
    if (!grid) return;
    grid.replaceChildren();

    const unitLabel = currentLang === 'es' ? 'archivos' : 'files';

    CONFIG.products.forEach((pack) => {
      const card = createEl('article', `pack-card spotlight-card reveal ${pack.featured ? 'featured' : ''}`);
      const chipText = pack.featured ? t('badge_popular') : t('badge_student');
      const title = t(`pack_${pack.id}_title`);
      const tag = t(`pack_${pack.id}_tag`);
      const desc = t(`pack_${pack.id}_desc`);

      const topMeta = createEl('div', 'pack-top-meta');
      topMeta.appendChild(createEl('span', 'pack-tag', tag));
      topMeta.appendChild(createEl('span', 'pack-badge-chip', chipText));

      const thumbWrap = createEl('div', 'pack-thumb-wrap');
      const thumbImg = createEl('img', 'pack-thumb');
      thumbImg.src = isSafeRelativeUrl(pack.previewImage) ? pack.previewImage : '';
      thumbImg.alt = title;
      thumbImg.loading = 'lazy';
      thumbWrap.appendChild(thumbImg);

      const eqBar = createEl('div', 'pack-eq-bar');
      renderTex(eqBar, pack.equationTex, false);

      const body = createEl('div', 'pack-body');
      body.appendChild(createEl('h3', 'pack-title', title));
      body.appendChild(createEl('p', 'pack-desc', desc));

      const metaRow = createEl('div', 'pack-meta-row');
      metaRow.appendChild(createPriceEl(pack.priceUsd));
      metaRow.appendChild(createEl('span', 'pack-file-count', `${pack.totalFiles} ${unitLabel}`));

      const actions = createEl('div', 'pack-actions');
      const inspectBtn = createEl('button', 'btn btn-secondary btn-sm', t('btn_inspect'));
      inspectBtn.type = 'button';
      inspectBtn.dataset.openPack = pack.id;
      inspectBtn.addEventListener('click', () => openPackModal(pack));

      const buyBtn = createEl('button', 'btn btn-primary btn-sm', t('btn_buy_pack'));
      buyBtn.type = 'button';
      buyBtn.dataset.buyPack = pack.id;
      buyBtn.addEventListener('click', () => openPackCheckout(pack));

      actions.appendChild(inspectBtn);
      actions.appendChild(buyBtn);

      body.appendChild(metaRow);
      body.appendChild(actions);

      card.appendChild(topMeta);
      card.appendChild(thumbWrap);
      card.appendChild(eqBar);
      card.appendChild(body);
      grid.appendChild(card);
    });

    observeReveals(grid);
  }

  function openPackModal(pack) {
    const modal = document.getElementById('packPreviewModal');
    if (!modal || !pack) return;
    activeModalPack = pack;

    const title = t(`pack_${pack.id}_title`);
    document.getElementById('modalPackTitle').textContent = `${t('modal_title_prefix')} · ${title}`;
    const imgEl = document.getElementById('modalPreviewImg');
    imgEl.src = isSafeRelativeUrl(pack.previewImage) ? pack.previewImage : '';
    imgEl.alt = title;

    renderTex(document.getElementById('modalEqBox'), pack.equationTex, true);

    document.getElementById('modalPackDesc').textContent = t(`pack_${pack.id}_desc`);
    document.getElementById('modalCodeLabel').textContent = `${t('modal_code_title')} (${pack.sampleFile})`;
    document.getElementById('modalCodeSnippet').textContent = pack.sampleCode;

    const modalPriceEl = document.getElementById('modalPackPrice');
    modalPriceEl.replaceChildren(document.createTextNode(`$${Number(pack.priceUsd)} `), createEl('small', '', 'USD'));

    const filesList = document.getElementById('modalFilesList');
    filesList.replaceChildren();
    pack.files.forEach((f) => {
      filesList.appendChild(createEl('li', '', f));
    });

    const dlBtn = document.getElementById('modalDownloadBtn');
    if (dlBtn) {
      dlBtn.setAttribute('href', isSafeRelativeUrl(pack.downloadUrl) ? pack.downloadUrl : '#');
    }

    const wsText =
      currentLang === 'es'
        ? `Hola, quiero consultar sobre el paquete "${title}" ($${pack.priceUsd} USD).`
        : `Hi, I would like to inquire about "${title}" ($${pack.priceUsd} USD).`;
    const wsBtn = document.getElementById('modalWsBtn');
    if (wsBtn) {
      wsBtn.setAttribute('href', buildSafeWhatsAppUrl(wsText));
      wsBtn.setAttribute('rel', 'noopener noreferrer');
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModalById(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function initModal() {
    const previewModal = document.getElementById('packPreviewModal');
    const closeBtn = document.getElementById('modalCloseBtn');
    const modalPayBtn = document.getElementById('modalCheckoutBtn');

    if (closeBtn) closeBtn.addEventListener('click', () => closeModalById('packPreviewModal'));
    if (modalPayBtn) {
      modalPayBtn.addEventListener('click', () => {
        if (!activeModalPack) return;
        closeModalById('packPreviewModal');
        openPackCheckout(activeModalPack);
      });
    }
    if (previewModal) {
      previewModal.addEventListener('click', (e) => {
        if (e.target === previewModal) closeModalById('packPreviewModal');
      });
    }

    initCheckoutModal();

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModalById('packPreviewModal');
        closeModalById('checkoutModal');
      }
    });
  }

  /* -------------------------------------------------------------------------
   * Structured Payment & Checkout Modal
   * ---------------------------------------------------------------------- */
  function openPackCheckout(pack) {
    if (!pack) return;
    const unitLabel = currentLang === 'es' ? 'archivos verificados' : 'verified files';
    openCheckoutModal({
      type: 'pack',
      id: pack.id,
      priceUsd: pack.priceUsd,
      downloadUrl: pack.downloadUrl,
      getTitle: () => t(`pack_${pack.id}_title`),
      getMeta: () => `${t(`pack_${pack.id}_tag`)} · ${pack.totalFiles} ${unitLabel}`,
    });
  }

  function openCheckoutModal(order) {
    activeCheckoutOrder = order;
    const modal = document.getElementById('checkoutModal');
    if (!modal) return;
    syncCheckoutModalView();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function syncCheckoutModalView() {
    if (!activeCheckoutOrder) return;
    const titleEl = document.getElementById('checkoutItemTitle');
    const metaEl = document.getElementById('checkoutItemMeta');
    const priceEl = document.getElementById('checkoutPrice');
    const methodTitleEl = document.getElementById('checkoutMethodTitle');
    const methodDescEl = document.getElementById('checkoutMethodDesc');
    const methodStepsEl = document.getElementById('checkoutMethodSteps');
    const refIn = document.getElementById('checkoutRefInput');
    const wsConfirmBtn = document.getElementById('checkoutConfirmWsBtn');
    const directZipBtn = document.getElementById('checkoutDirectZipBtn');

    const title = activeCheckoutOrder.getTitle ? activeCheckoutOrder.getTitle() : activeCheckoutOrder.title;
    const meta = activeCheckoutOrder.getMeta ? activeCheckoutOrder.getMeta() : activeCheckoutOrder.meta;
    const price = Number(activeCheckoutOrder.priceUsd || 0);

    if (titleEl) titleEl.textContent = title;
    if (metaEl) metaEl.textContent = meta;
    if (priceEl) priceEl.replaceChildren(document.createTextNode(`$${price} `), createEl('small', '', 'USD'));

    const methodKey =
      activePaymentMethod === 'bank_ecuador'
        ? 'ec'
        : activePaymentMethod === 'whatsapp_direct'
        ? 'ws'
        : 'card';

    if (methodTitleEl) methodTitleEl.textContent = t(`pay_${methodKey}_title`);
    if (methodDescEl) methodDescEl.textContent = t(`pay_${methodKey}_desc`);
    if (methodStepsEl) methodStepsEl.textContent = t(`pay_${methodKey}_steps`);

    document.querySelectorAll('.pay-tab[data-pay-method]').forEach((tab) => {
      const isActive = tab.getAttribute('data-pay-method') === activePaymentMethod;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    const refClean = sanitizeText(refIn ? refIn.value : '', 120);
    const methodLabel = t(`pay_${methodKey}_tab`);
    const wsOrderText =
      currentLang === 'es'
        ? `Hola, quiero completar mi pedido:\n• Ítem: ${title}\n• Total: $${price} USD\n• Método: ${methodLabel}${refClean ? `\n• Ref / Correo: ${refClean}` : ''}`
        : `Hi, I want to complete my checkout order:\n• Item: ${title}\n• Total: $${price} USD\n• Payment method: ${methodLabel}${refClean ? `\n• Ref / Email: ${refClean}` : ''}`;

    if (wsConfirmBtn) {
      wsConfirmBtn.setAttribute('href', buildSafeWhatsAppUrl(wsOrderText));
      wsConfirmBtn.setAttribute('rel', 'noopener noreferrer');
    }

    if (directZipBtn) {
      const hasZip = activeCheckoutOrder.type === 'pack' && isSafeRelativeUrl(activeCheckoutOrder.downloadUrl);
      directZipBtn.classList.toggle('hidden', !hasZip);
      if (hasZip) directZipBtn.setAttribute('href', activeCheckoutOrder.downloadUrl);
    }
  }

  function initCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    const closeBtn = document.getElementById('checkoutCloseBtn');
    const refIn = document.getElementById('checkoutRefInput');

    if (closeBtn) closeBtn.addEventListener('click', () => closeModalById('checkoutModal'));
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModalById('checkoutModal');
      });
    }

    document.querySelectorAll('.pay-tab[data-pay-method]').forEach((tab) => {
      tab.addEventListener('click', () => {
        const nextMethod = tab.getAttribute('data-pay-method');
        if (!['card_paypal', 'bank_ecuador', 'whatsapp_direct'].includes(nextMethod)) return;
        activePaymentMethod = nextMethod;
        syncCheckoutModalView();
      });
    });

    if (refIn) {
      refIn.addEventListener('input', syncCheckoutModalView);
    }
  }

  /* -------------------------------------------------------------------------
   * Social Proof Reviews Grid (6 Verified Outcomes)
   * ---------------------------------------------------------------------- */
  function renderReviewsGrid() {
    const grid = document.getElementById('reviewsGrid');
    if (!grid) return;
    grid.replaceChildren();

    const verifiedTxt = currentLang === 'es' ? '✓ Entrega Verificada' : '✓ Verified Deliverable';

    CONFIG.socialProof.forEach((item) => {
      const card = createEl('article', 'review-card spotlight-card reveal');

      const bodyWrap = document.createElement('div');
      const top = createEl('div', 'review-top');
      top.appendChild(createEl('span', 'review-tag', t(`${item.id}_tag`)));

      const stars = createEl('span', 'review-stars');
      stars.setAttribute('aria-label', '5 out of 5 stars');
      for (let i = 0; i < 5; i++) stars.appendChild(createStarSvg());
      top.appendChild(stars);

      const quote = createEl('p', 'review-quote', `“${t(`${item.id}_quote`)}”`);
      quote.style.marginTop = '14px';
      bodyWrap.appendChild(top);
      bodyWrap.appendChild(quote);

      const authorRow = createEl('div', 'review-author-row');
      const authorMeta = document.createElement('div');
      authorMeta.appendChild(createEl('span', 'review-author', t(`${item.id}_author`)));
      authorMeta.appendChild(createEl('span', 'review-role', t(`${item.id}_role`)));

      authorRow.appendChild(authorMeta);
      authorRow.appendChild(createEl('span', 'verified-chip', verifiedTxt));

      card.appendChild(bodyWrap);
      card.appendChild(authorRow);
      grid.appendChild(card);
    });

    observeReveals(grid);
  }

  /* -------------------------------------------------------------------------
   * Live 5-Mode Multi-Physics Simulators + Compiled KaTeX Banner
   * ---------------------------------------------------------------------- */
  function updateSimEquationBanner() {
    const banner = document.getElementById('simEqBanner');
    if (!banner) return;
    renderTex(banner, SIM_EQUATIONS[activeSimTab] || SIM_EQUATIONS.beam, true);
  }

  function resizeSimCanvas() {
    if (!simCanvas || !simCanvas.parentElement) return { w: 720, h: 390 };
    const rect = simCanvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(Math.round(rect.width), 320);
    const h = Math.max(Math.round(rect.height), 260);
    if (simCanvas.width !== w * dpr || simCanvas.height !== h * dpr) {
      simCanvas.width = w * dpr;
      simCanvas.height = h * dpr;
      simCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    return { w, h };
  }

  function initSimulators() {
    simCanvas = document.getElementById('simCanvas');
    if (!simCanvas) return;
    simCtx = simCanvas.getContext('2d');

    beamSim = new BeamSolverSim();
    cfdSim = new CfdVortexSim();
    tmdSim = new SeismicTmdSim();
    fourierSim = new FourierEpicyclesSim();
    chaosSim = new DoublePendulumSim();

    const kEls = [
      document.getElementById('teleK1'),
      document.getElementById('teleK2'),
      document.getElementById('teleK3'),
    ];
    const vEls = [
      document.getElementById('teleV1'),
      document.getElementById('teleV2'),
      document.getElementById('teleV3'),
    ];

    const panels = {
      beam: document.getElementById('ctrlBeam'),
      cfd: document.getElementById('ctrlCfd'),
      tmd: document.getElementById('ctrlTmd'),
      fourier: document.getElementById('ctrlFourier'),
      chaos: document.getElementById('ctrlChaos'),
    };

    document.querySelectorAll('.wb-tab[data-sim]').forEach((tab) => {
      tab.addEventListener('click', () => {
        activeSimTab = tab.getAttribute('data-sim');
        document.querySelectorAll('.wb-tab').forEach((b) => b.classList.remove('active'));
        tab.classList.add('active');
        Object.keys(panels).forEach((k) => {
          if (panels[k]) panels[k].classList.toggle('hidden', k !== activeSimTab);
        });
        updateSimEquationBanner();
      });
    });

    // 1) Beam controls
    const pIn = document.getElementById('beamPInput');
    const posIn = document.getElementById('beamPosInput');
    const lIn = document.getElementById('beamLInput');
    pIn.addEventListener('input', () => {
      const val = Number(pIn.value);
      document.getElementById('beamPVal').textContent = `${val} kN`;
      beamSim.setParams({ P: val });
    });
    posIn.addEventListener('input', () => {
      const val = Number(posIn.value);
      document.getElementById('beamPosVal').textContent = val.toFixed(2);
      beamSim.setParams({ ratio: val });
    });
    lIn.addEventListener('input', () => {
      const val = Number(lIn.value);
      document.getElementById('beamLVal').textContent = `${val.toFixed(1)} m`;
      beamSim.setParams({ L: val });
    });

    // 2) CFD controls
    const cfdReIn = document.getElementById('cfdReInput');
    const cfdSpeedIn = document.getElementById('cfdSpeedInput');
    cfdReIn.addEventListener('input', () => {
      const val = Number(cfdReIn.value);
      document.getElementById('cfdReVal').textContent = `${val}`;
      cfdSim.setParams({ re: val });
    });
    cfdSpeedIn.addEventListener('input', () => {
      const val = Number(cfdSpeedIn.value);
      document.getElementById('cfdSpeedVal').textContent = `${val.toFixed(2)} m/s`;
      cfdSim.setParams({ speed: val });
    });

    // 3) Seismic TMD controls
    const tmdMuIn = document.getElementById('tmdMuInput');
    const tmdFreqIn = document.getElementById('tmdFreqInput');
    tmdMuIn.addEventListener('input', () => {
      const val = Number(tmdMuIn.value);
      document.getElementById('tmdMuVal').textContent = val.toFixed(3);
      tmdSim.setParams({ mu: val });
    });
    tmdFreqIn.addEventListener('input', () => {
      const val = Number(tmdFreqIn.value);
      document.getElementById('tmdFreqVal').textContent = val.toFixed(2);
      tmdSim.setParams({ freqRatio: val });
    });

    // 4) Fourier controls
    const nIn = document.getElementById('fourierNInput');
    nIn.addEventListener('input', () => {
      const val = Number(nIn.value);
      document.getElementById('fourierNVal').textContent = `${val}`;
      fourierSim.setHarmonics(val);
    });
    document.querySelectorAll('.preset-btn[data-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        fourierSim.loadPreset(btn.getAttribute('data-preset'));
      });
    });

    // 5) Chaos controls
    const dIn = document.getElementById('chaosDeltaInput');
    dIn.addEventListener('input', () => {
      const val = Number(dIn.value);
      document.getElementById('chaosDeltaVal').textContent = `${val.toFixed(3)} rad`;
      chaosSim.setDelta(val);
    });

    // Canvas pointer interactions across modes
    let pointerDown = false;
    simCanvas.addEventListener('pointerdown', (e) => {
      pointerDown = true;
      simCanvas.setPointerCapture(e.pointerId);
      const rect = simCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (activeSimTab === 'beam') {
        const ratio = beamSim.updateDrag(x, rect.width);
        posIn.value = ratio.toFixed(2);
        document.getElementById('beamPosVal').textContent = ratio.toFixed(2);
      } else if (activeSimTab === 'cfd') {
        cfdSim.setCylinderY(y, rect.height);
      } else if (activeSimTab === 'tmd') {
        tmdSim.impulse();
      } else if (activeSimTab === 'fourier') {
        fourierSim.startDraw(x, y, rect.width, rect.height);
      }
    });

    simCanvas.addEventListener('pointermove', (e) => {
      if (!pointerDown) return;
      const rect = simCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (activeSimTab === 'beam') {
        const ratio = beamSim.updateDrag(x, rect.width);
        posIn.value = ratio.toFixed(2);
        document.getElementById('beamPosVal').textContent = ratio.toFixed(2);
      } else if (activeSimTab === 'cfd') {
        cfdSim.setCylinderY(y, rect.height);
      } else if (activeSimTab === 'fourier') {
        fourierSim.moveDraw(x, y, rect.width, rect.height);
      }
    });

    const endPointer = () => {
      if (!pointerDown) return;
      pointerDown = false;
      if (activeSimTab === 'fourier') fourierSim.endDraw();
    };
    simCanvas.addEventListener('pointerup', endPointer);
    simCanvas.addEventListener('pointercancel', endPointer);

    // Reset button per active tab
    document.getElementById('wbResetBtn').addEventListener('click', () => {
      if (activeSimTab === 'beam') {
        beamSim.setParams({ P: 24, L: 6.0, ratio: 0.4 });
        pIn.value = '24';
        posIn.value = '0.40';
        lIn.value = '6.0';
        document.getElementById('beamPVal').textContent = '24 kN';
        document.getElementById('beamPosVal').textContent = '0.40';
        document.getElementById('beamLVal').textContent = '6.0 m';
      } else if (activeSimTab === 'cfd') {
        cfdSim.reset();
        cfdReIn.value = '180';
        cfdSpeedIn.value = '1.35';
        document.getElementById('cfdReVal').textContent = '180';
        document.getElementById('cfdSpeedVal').textContent = '1.35 m/s';
      } else if (activeSimTab === 'tmd') {
        tmdSim.setParams({ mu: 0.04, freqRatio: 1.0 });
        tmdSim.reset();
        tmdMuIn.value = '0.04';
        tmdFreqIn.value = '1.00';
        document.getElementById('tmdMuVal').textContent = '0.040';
        document.getElementById('tmdFreqVal').textContent = '1.00';
      } else if (activeSimTab === 'fourier') {
        nIn.value = '42';
        document.getElementById('fourierNVal').textContent = '42';
        fourierSim.setHarmonics(42);
        fourierSim.loadPreset('gear');
        document.querySelectorAll('.preset-btn').forEach((b) => {
          b.classList.toggle('active', b.getAttribute('data-preset') === 'gear');
        });
      } else {
        dIn.value = '0.005';
        document.getElementById('chaosDeltaVal').textContent = '0.005 rad';
        chaosSim.setDelta(0.005);
      }
    });

    updateSimEquationBanner();

    function tick(now) {
      const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
      lastFrameTime = now;
      const { w, h } = resizeSimCanvas();

      let tele;
      if (activeSimTab === 'beam') {
        tele = beamSim.stepAndDraw(simCtx, w, h);
      } else if (activeSimTab === 'cfd') {
        tele = cfdSim.stepAndDraw(simCtx, w, h, dt);
      } else if (activeSimTab === 'tmd') {
        tele = tmdSim.stepAndDraw(simCtx, w, h, dt);
      } else if (activeSimTab === 'fourier') {
        tele = fourierSim.stepAndDraw(simCtx, w, h, dt);
      } else {
        tele = chaosSim.stepAndDraw(simCtx, w, h, dt);
      }

      if (tele) {
        renderMathInNode(kEls[0], tele.m1Label);
        renderMathInNode(kEls[1], tele.m2Label);
        renderMathInNode(kEls[2], tele.m3Label);
        if (vEls[0]) vEls[0].textContent = tele.m1Val;
        if (vEls[1]) vEls[1].textContent = tele.m2Val;
        if (vEls[2]) vEls[2].textContent = tele.m3Val;
      }

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  /* -------------------------------------------------------------------------
   * Quote Estimator + Structured Payment Checkout + Direct WhatsApp
   * ---------------------------------------------------------------------- */
  let latestQuoteState = null;

  function updateQuoteEstimator() {
    const srvSel = document.getElementById('quoteService');
    const tierSel = document.getElementById('quoteTier');
    const rushIn = document.getElementById('quoteRush');
    const notesIn = document.getElementById('quoteNotes');
    const priceEl = document.getElementById('quotePrice');
    const etaEl = document.getElementById('quoteEta');
    const previewEl = document.getElementById('quotePreview');
    const wsBtn = document.getElementById('whatsappQuoteBtn');
    if (!srvSel || !tierSel) return;

    const srv = Object.prototype.hasOwnProperty.call(CONFIG.pricing.baseUsd, srvSel.value)
      ? srvSel.value
      : 'cad';
    const tier = Object.prototype.hasOwnProperty.call(CONFIG.pricing.complexityMultiplier, tierSel.value)
      ? tierSel.value
      : 'standard';
    const rush = Boolean(rushIn && rushIn.checked);
    const base = CONFIG.pricing.baseUsd[srv];
    const mult = CONFIG.pricing.complexityMultiplier[tier];
    const total = Math.round(base * mult * (rush ? CONFIG.pricing.rushMultiplier : 1.0));

    const tierIdx = tier === 'standard' ? 0 : tier === 'advanced' ? 1 : 2;
    const daysArr = CONFIG.pricing.deliveryDays[srv] || [2, 4, 6];
    let days = daysArr[tierIdx];
    if (rush) days = Math.max(1, Math.min(2, days - 1));

    const srvLabel = srvSel.options[srvSel.selectedIndex].text;
    const tierLabel = tierSel.options[tierSel.selectedIndex].text;
    const rawNotes = notesIn ? sanitizeText(notesIn.value, 500) : '';
    const notesText =
      rawNotes || (currentLang === 'es' ? 'Por definir por WhatsApp' : 'To finalize via WhatsApp');

    if (priceEl) priceEl.textContent = `$${total} USD`;
    if (etaEl) etaEl.textContent = `${t('quote_delivery_prefix')} ${days} ${t('quote_days_unit')}`;

    const briefLines =
      currentLang === 'es'
        ? [
            `Servicio: ${srvLabel}`,
            `Nivel: ${tierLabel}`,
            `Urgente 24h-48h: ${rush ? 'Sí' : 'No'}`,
            `Estimado referencial: $${total} USD (${days} ${t('quote_days_unit')})`,
            `Detalle: ${notesText}`,
            `Contacto directo: ${CONFIG.brand.phoneIntl}`,
          ]
        : [
            `Service: ${srvLabel}`,
            `Tier: ${tierLabel}`,
            `24h-48h Rush: ${rush ? 'Yes' : 'No'}`,
            `Estimated quote: $${total} USD (${days} ${t('quote_days_unit')})`,
            `Scope: ${notesText}`,
            `Direct line: ${CONFIG.brand.phoneIntl}`,
          ];

    const brief = briefLines.join('\n');
    if (previewEl) previewEl.textContent = brief;
    if (wsBtn) {
      wsBtn.setAttribute('href', buildSafeWhatsAppUrl(brief));
      wsBtn.setAttribute('rel', 'noopener noreferrer');
    }

    latestQuoteState = {
      srvLabel,
      tierLabel,
      days,
      total,
    };
  }

  function initQuoteEstimator() {
    ['quoteService', 'quoteTier', 'quoteRush', 'quoteNotes'].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', updateQuoteEstimator);
      el.addEventListener('input', updateQuoteEstimator);
    });

    const payBtn = document.getElementById('quoteCheckoutBtn');
    if (payBtn) {
      payBtn.addEventListener('click', () => {
        updateQuoteEstimator();
        const st = latestQuoteState || { srvLabel: 'Custom Engineering', tierLabel: 'Standard', days: 2, total: 10 };
        openCheckoutModal({
          type: 'quote',
          id: 'custom_quote',
          priceUsd: st.total,
          getTitle: () => (latestQuoteState ? latestQuoteState.srvLabel : st.srvLabel),
          getMeta: () =>
            latestQuoteState
              ? `${latestQuoteState.tierLabel} · ${latestQuoteState.days} ${t('quote_days_unit')}`
              : `${st.tierLabel}`,
        });
      });
    }

    const copyBtn = document.getElementById('copyBriefBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const preview = document.getElementById('quotePreview');
        if (!preview) return;
        try {
          await navigator.clipboard.writeText(preview.textContent);
          copyBtn.textContent = t('quote_copied');
          setTimeout(() => {
            copyBtn.textContent = t('quote_copy');
          }, 1800);
        } catch (err) {
          copyBtn.textContent = t('quote_copied');
        }
      });
    }

    updateQuoteEstimator();
  }

  /* -------------------------------------------------------------------------
   * Boot
   * ---------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initEntryIntro();
    initSpotlights();
    initModal();
    initCadVault();
    initSimulators();
    initQuoteEstimator();
    applyTranslations();
    observeReveals(document);

    document.querySelectorAll('a[target="_blank"]').forEach((anchor) => {
      anchor.setAttribute('rel', 'noopener noreferrer');
    });

    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
      langToggle.addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'es' : 'en';
        applyTranslations();
      });
    }

    const floatingWs = document.querySelector('.floating-ws-cta');
    if (floatingWs) {
      const syncFloatingCta = () => {
        floatingWs.classList.toggle('visible', window.scrollY > 480);
      };
      window.addEventListener('scroll', syncFloatingCta, { passive: true });
      syncFloatingCta();
    }
  });
})();
