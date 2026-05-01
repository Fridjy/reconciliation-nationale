/* =============================================
   MODERN INTERACTIONS
   - Scroll reveal (IntersectionObserver)
   - Live counter + goal progress + counter bump
   - Ticker, leaderboard, challenge, share sections (Mode 2)
   - Flag-mark injection into nav/header
   - Counter pill in nav center
   - Mobile bottom nav, smooth scroll, ripple
   ============================================= */

(function modernInit() {

  /* ============================================================
     1. CONFIG — campaign state (front-end only; real data can override)
     ============================================================ */
  const MOBILIZATION = {
    baseCount: 0,             // shown before Firestore responds
    goalTotal: 50000,         // goal for "Ayiti Pale"
    todayDelta: 0,            // "+N jodi a" (live from Firestore when available)
    // departments + diaspora counts come live from cachedStats.perDept
    // Ticker uses anonymous markers — no hardcoded names.
    // Cities are geographic context; actions are translatable activity verbs.
    tickerPool: [
      { city: 'Port-au-Prince',  actionKey: 'tick-q3' },
      { city: 'Cap-Ha\u00eftien', actionKey: 'tick-register' },
      { city: 'Miami',           actionKey: 'tick-share12' },
      { city: 'Les Cayes',       actionKey: 'tick-q5all' },
      { city: 'Montr\u00e9al',    actionKey: 'tick-voted' },
      { city: 'Gona\u00efves',    actionKey: 'tick-q1' },
      { city: 'Hinche',          actionKey: 'tick-comment' },
      { city: 'Santiago',        actionKey: 'tick-diaspora' },
      { city: 'Paris',           actionKey: 'tick-share-wa' },
      { city: 'J\u00e9r\u00e9mie', actionKey: 'tick-q4' },
      { city: 'Jacmel',          actionKey: 'tick-vote3' },
      { city: 'Brooklyn',        actionKey: 'tick-share-tg' }
    ],
    challenge: {
      pct: 26,
      hashtag: '#AyitiPale'
    }
  };

  /* i18n helper: falls back through fr → ht → en if a key is missing */
  function t(key) {
    try {
      const lang = (typeof currentLang === 'string') ? currentLang : 'fr';
      if (typeof i18n !== 'undefined' && i18n[lang] && i18n[lang][key]) return i18n[lang][key];
      if (typeof i18n !== 'undefined' && i18n.fr && i18n.fr[key]) return i18n.fr[key];
    } catch (e) {}
    return key;
  }

  /* shared state */
  let currentCount = MOBILIZATION.baseCount;
  let countHandles = [];   // elements that must all update on tick
  let lastDateMs = Date.now();

  /* ============================================================
     2. SCROLL REVEAL
     ============================================================ */
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  function observeReveals(root) {
    (root || document).querySelectorAll('.reveal, .reveal-stagger, .reveal-left, .reveal-scale')
      .forEach(el => revealObserver.observe(el));
  }
  observeReveals();

  /* ============================================================
     3. FLAG MARK + COUNTER PILL INJECTION
     ============================================================ */
  function flagMarkHTML() {
    return `<span class="flag-mark" aria-hidden="true"><span class="fm-blue"></span><span class="fm-red"></span><span class="fm-gold"></span></span>`;
  }

  function rnLogoHTML() {
    return `<img src="logo.png" alt="R\u00e9conciliation Nationale" class="brand-logo">`;
  }

  function counterPillHTML() {
    return `
      <a class="counter-pill" href="index.html" aria-label="Live count">
        <span class="live-dot live-dot--red"></span>
        <span class="cp-num" data-count-sync>0</span>
        <span class="cp-label" data-i18n="mob-counter-label">${t('mob-counter-label')}</span>
      </a>`;
  }

  function brandLockupHTML() {
    return `
      <a class="brand-lockup" href="index.html">
        ${rnLogoHTML()}
        <span class="brand-lockup-name">R\u00e9conciliation Nationale</span>
      </a>`;
  }

  // Enhance community topbar (index.html community phase, about, rapport, map, consulted)
  document.querySelectorAll('.topbar .topbar-inner').forEach(inner => {
    // Wrap existing ticker (left), add counter-pill center, keep right actions
    const ticker = inner.querySelector('.ticker');
    const right  = inner.querySelector('.topbar-right-community, .topbar-right');

    if (ticker) {
      // Replace the simple ticker label with brand + flag mark on the left
      const leftWrap = document.createElement('div');
      leftWrap.className = 'topbar-left';
      leftWrap.innerHTML = brandLockupHTML();
      inner.insertBefore(leftWrap, ticker);
      ticker.remove();
    }
    // Insert counter pill in center if not present
    if (!inner.querySelector('.counter-pill')) {
      const pill = document.createElement('div');
      pill.innerHTML = counterPillHTML();
      const pillNode = pill.firstElementChild;
      if (right) inner.insertBefore(pillNode, right);
      else inner.appendChild(pillNode);
    }
  });

  // q-topbar already has <img class="q-brand-logo"> in HTML; CSS un-hides it.

  /* ============================================================
     4. WELCOME HERO — RED mobilization hero
     Only runs if .welcome-screen exists (landing)
     ============================================================ */
  function enhanceWelcome() {
    const screen = document.querySelector('.welcome-screen');
    if (!screen) return;

    const inner = screen.querySelector('.welcome-inner');
    if (!inner) return;

    const title     = inner.querySelector('.welcome-title');
    const counterEl = inner.querySelector('.welcome-counter');
    const cta       = inner.querySelector('.welcome-cta');
    const aboutLink = inner.querySelector('.welcome-about');

    // 1. Eyebrow: "— MOUVMAN SITWAYEN · AYITI 2026 · LANS —"
    //    Keep 'brand-kicker' in its own span so setLang can retranslate it
    //    while preserving the LANS suffix.
    if (!inner.querySelector('.welcome-kicker')) {
      const kicker = document.createElement('div');
      kicker.className = 'welcome-kicker';
      kicker.innerHTML = `<span data-i18n="brand-kicker">${t('brand-kicker')}</span>`;
      const anchor = title || counterEl || inner.firstElementChild;
      inner.insertBefore(kicker, anchor);
    }

    // 2. Rebuild the counter block with label + huge count + delta + goal bar
    if (counterEl && !counterEl.dataset.enhanced) {
      counterEl.dataset.enhanced = '1';
      const existingLabel = counterEl.querySelector('.welcome-count-label');
      const labelKey = (existingLabel && existingLabel.getAttribute('data-i18n')) || 'welcome-count-label';
      const labelText = (existingLabel && existingLabel.textContent) || t('welcome-count-label');

      counterEl.innerHTML = `
        <span class="welcome-count-label" data-i18n="${labelKey}">${labelText}</span>
        <span class="welcome-count" id="welcome-count" data-count-sync>${currentCount.toLocaleString('fr-FR')}</span>
        <div class="welcome-delta">
          <span class="wd-dot"></span>
          <span class="wd-num" data-today-delta>+${MOBILIZATION.todayDelta}</span>
          <span class="wd-text" data-i18n="mob-today-delta">${t('mob-today-delta')}</span>
        </div>
      `;

      // Goal progress bar — placed after the counter, not inside it
      if (!inner.querySelector('.welcome-goal')) {
        const goal = document.createElement('div');
        goal.className = 'welcome-goal';
        goal.innerHTML = `
          <div class="welcome-goal-labels">
            <span class="wg-left">0</span>
            <span class="wg-center">
              <span data-goal-pct>0%</span>
              <span data-i18n="hero-goal-label"> ${t('hero-goal-label')}</span>
            </span>
            <span class="wg-right">${MOBILIZATION.goalTotal.toLocaleString('fr-FR')}</span>
          </div>
          <div class="welcome-goal-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${MOBILIZATION.goalTotal}">
            <div class="welcome-goal-fill" data-goal-fill style="width:0%"></div>
          </div>
        `;
        counterEl.insertAdjacentElement('afterend', goal);
      }
    }

    // 3. Wrap CTA buttons in a row
    if (cta && aboutLink && !cta.parentElement.classList.contains('welcome-cta-block')) {
      const block = document.createElement('div');
      block.className = 'welcome-cta-block';
      cta.parentNode.insertBefore(block, cta);
      block.appendChild(cta);
      block.appendChild(aboutLink);
    }

    // 4. Inject 4-column stats band at the bottom of the hero
    if (!screen.querySelector('.welcome-stats')) {
      const stats = document.createElement('div');
      stats.className = 'welcome-stats';
      stats.innerHTML = welcomeStatsHTML();
      screen.appendChild(stats);
    }

    // 5. Append mobilization sections AFTER welcome-screen (ticker, leaderboard, CTA banner, share)
    if (!document.querySelector('.mobilization-sections')) {
      const sections = document.createElement('div');
      sections.className = 'mobilization-sections';
      sections.innerHTML = `
        ${tickerBarHTML()}
        ${leaderboardSectionHTML()}
        ${ctaBannerHTML()}
        ${shareSectionHTML()}
      `;
      const phase = screen.parentElement;
      phase.insertBefore(sections, screen.nextSibling);

      const ticker = sections.querySelector('.live-ticker-inner');
      if (ticker) ticker.innerHTML = ticker.innerHTML + ticker.innerHTML;

      observeReveals(sections);

      const syncMobilizationVisibility = () => {
        const visible = screen.style.display !== 'none';
        sections.style.display = visible ? '' : 'none';
      };
      const mo = new MutationObserver(syncMobilizationVisibility);
      mo.observe(screen, { attributes: true, attributeFilter: ['style'] });
      syncMobilizationVisibility();
    }
  }

  /* 4-column stats band inside the red hero — all numbers live from Firestore */
  function welcomeStatsHTML() {
    const vwa   = currentCount.toLocaleString('fr-FR');
    const perDept = (typeof cachedStats !== 'undefined' && cachedStats && cachedStats.perDept) || {};
    const activeDepts = Object.keys(perDept).filter(k => k !== 'diaspora' && (Number(perDept[k]) || 0) > 0).length;
    const diasporaCount = Number(perDept.diaspora) || 0;
    const delta = '+' + MOBILIZATION.todayDelta;
    return `
      <div class="ws-item">
        <span class="ws-num" data-count-sync>${vwa}</span>
        <span class="ws-label" data-i18n="hero-stat-vwa">${t('hero-stat-vwa')}</span>
      </div>
      <div class="ws-item">
        <span class="ws-num gold" data-ws-dias>${diasporaCount}</span>
        <span class="ws-label" data-i18n="hero-stat-peyi-dias">${t('hero-stat-peyi-dias')}</span>
      </div>
      <div class="ws-item">
        <span class="ws-num" data-ws-dept>${activeDepts}</span>
        <span class="ws-label" data-i18n="hero-stat-depatman">${t('hero-stat-depatman')}</span>
      </div>
      <div class="ws-item">
        <span class="ws-num gold" data-today-delta-sign>${delta}</span>
        <span class="ws-label" data-i18n="hero-stat-jodi-a">${t('hero-stat-jodi-a')}</span>
      </div>
    `;
  }

  /* Live-refresh the welcome-stats band's dept + diaspora numbers */
  function refreshWelcomeStats() {
    const perDept = (typeof cachedStats !== 'undefined' && cachedStats && cachedStats.perDept) || {};
    const activeDepts = Object.keys(perDept).filter(k => k !== 'diaspora' && (Number(perDept[k]) || 0) > 0).length;
    const diasporaCount = Number(perDept.diaspora) || 0;
    document.querySelectorAll('[data-ws-dept]').forEach(el => { el.textContent = activeDepts; });
    document.querySelectorAll('[data-ws-dias]').forEach(el => { el.textContent = diasporaCount; });
  }

  /* Enhance questions header with a second column body text */
  function enhanceQuestionsHeader() {
    const head = document.querySelector('.questions-buttons .qb-head');
    if (!head || head.querySelector('.qb-head-body')) return;
    const body = document.createElement('div');
    body.className = 'qb-head-body';
    body.setAttribute('data-i18n', 'qb-head-body');
    body.textContent = t('qb-head-body');
    head.appendChild(body);
  }

  function tickerBarHTML() {
    const anon = (typeof t === 'function') ? (t('ticker-anon') || '·') : '·';
    const items = MOBILIZATION.tickerPool.map(it => `
      <span class="live-ticker-item">
        <span class="lt-dot"></span>
        <span class="lt-city">${it.city}</span>
        <span class="lt-action" data-i18n="${it.actionKey}">${t(it.actionKey)}</span>
      </span>
    `).join('');
    return `
      <div class="live-ticker-bar" aria-hidden="true">
        <span class="live-ticker-badge">KOUNYE A</span>
        <div class="live-ticker-inner">${items}</div>
      </div>
    `;
  }

  /* Build leaderboard rows from live Firestore perDept data */
  function leaderboardRowsHTML(list) {
    if (!list || !list.length) {
      return `<div class="lb-row" style="opacity:0.45;"><span class="lb-pos">\u2014</span><span class="lb-name" style="grid-column: span 3;">${t('loading') || '...'}</span></div>`;
    }
    const top = Math.max(1, ...list.map(d => d.count));
    return list.map((d, i) => {
      const pct = Math.round((d.count / top) * 100);
      return `
        <div class="lb-row">
          <span class="lb-pos">${String(i + 1).padStart(2, '0')}</span>
          <span class="lb-name">${esc(d.name)}</span>
          <span class="lb-bar-wrap"><span class="lb-bar" style="width:${pct}%"></span></span>
          <span class="lb-count">${d.count.toLocaleString('fr-FR')}</span>
        </div>
      `;
    }).join('');
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[c]);
  }

  function getDeptLeaderboard() {
    if (typeof cachedStats === 'undefined' || !cachedStats || !cachedStats.perDept) return [];
    if (typeof DEPARTMENTS === 'undefined') return [];
    const lang = typeof currentLang === 'string' ? currentLang : 'fr';
    return DEPARTMENTS
      .map(d => ({
        name: (d.name && (d.name[lang] || d.name.fr)) || d.id,
        count: Number(cachedStats.perDept[d.id]) || 0
      }))
      .filter(d => d.count > 0)
      .sort((a, b) => b.count - a.count);
  }

  function getDiasporaLeaderboard() {
    if (typeof cachedStats === 'undefined' || !cachedStats || !cachedStats.perDept) return [];
    const n = Number(cachedStats.perDept.diaspora) || 0;
    if (n <= 0) return [];
    const lang = typeof currentLang === 'string' ? currentLang : 'fr';
    const label = (typeof DIASPORA_LABEL !== 'undefined' && DIASPORA_LABEL[lang]) || 'Diaspora';
    return [{ name: label, count: n }];
  }

  function leaderboardSectionHTML() {
    return `
      <section class="leaderboard-section reveal" data-leaderboard-root>
        <div class="leaderboard-grid">
          <div class="leaderboard-card">
            <h4>${flagMarkHTML()} <span data-i18n="mob-lb-dept">${t('mob-lb-dept')}</span></h4>
            <div class="leaderboard-list" data-lb-dept>
              ${leaderboardRowsHTML(getDeptLeaderboard())}
            </div>
          </div>
          <div class="leaderboard-card">
            <h4>${flagMarkHTML()} <span data-i18n="mob-lb-dias">${t('mob-lb-dias')}</span></h4>
            <div class="leaderboard-list" data-lb-dias>
              ${leaderboardRowsHTML(getDiasporaLeaderboard())}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function refreshLeaderboard() {
    const dept = document.querySelector('[data-lb-dept]');
    const dias = document.querySelector('[data-lb-dias]');
    if (dept) dept.innerHTML = leaderboardRowsHTML(getDeptLeaderboard());
    if (dias) dias.innerHTML = leaderboardRowsHTML(getDiasporaLeaderboard());
  }

  function ctaBannerHTML() {
    return `
      <section class="cta-banner reveal">
        <div class="cta-banner-inner">
          <div class="cta-banner-text">
            <h3 class="cta-banner-title" data-i18n="cta-banner-title">${t('cta-banner-title')}</h3>
            <p class="cta-banner-sub" data-i18n="cta-banner-sub">${t('cta-banner-sub')}</p>
          </div>
          <div class="cta-banner-actions">
            <button class="cta-banner-btn" onclick="if(typeof startQuestionnaire==='function')startQuestionnaire()">
              <span data-i18n="cta-banner-btn">${t('cta-banner-btn')}</span>
            </button>
            <div class="cta-banner-tags" data-i18n="cta-banner-tags">${t('cta-banner-tags')}</div>
          </div>
        </div>
      </section>
    `;
  }

  function shareSectionHTML() {
    const msg = encodeURIComponent('https://reconciliation-nationale.ht');
    return `
      <section class="share-section reveal">
        <div class="share-inner">
          <div class="share-head">
            <div class="share-kicker" data-i18n="mob-share-kicker">${t('mob-share-kicker')}</div>
            <h3 class="share-title">
              <span data-i18n="mob-share-title-before">${t('mob-share-title-before')}</span><em class="rn-gradient-text" data-i18n="mob-share-people">${t('mob-share-people')}</em><span data-i18n="mob-share-title-after">${t('mob-share-title-after')}</span>
            </h3>
          </div>
          <div class="share-list">
            <a class="share-row sr-whatsapp" href="https://wa.me/?text=${msg}" target="_blank" rel="noopener">
              <span class="sr-icon">W</span>
              <span class="sr-body">
                <div class="sr-name">WhatsApp</div>
                <div class="sr-sub" data-i18n="mob-share-wa-sub">${t('mob-share-wa-sub')}</div>
              </span>
              <span class="sr-arrow">\u2192</span>
            </a>
            <a class="share-row sr-telegram" href="https://t.me/share/url?url=https://reconciliation-nationale.ht" target="_blank" rel="noopener">
              <span class="sr-icon">T</span>
              <span class="sr-body">
                <div class="sr-name">Telegram</div>
                <div class="sr-sub" data-i18n="mob-share-tg-sub">${t('mob-share-tg-sub')}</div>
              </span>
              <span class="sr-arrow">\u2192</span>
            </a>
            <a class="share-row sr-instagram" href="#" onclick="navigator.clipboard && navigator.clipboard.writeText('https://reconciliation-nationale.ht'); return false;">
              <span class="sr-icon">IG</span>
              <span class="sr-body">
                <div class="sr-name">Instagram</div>
                <div class="sr-sub" data-i18n="mob-share-ig-sub">${t('mob-share-ig-sub')}</div>
              </span>
              <span class="sr-arrow">\u2192</span>
            </a>
            <a class="share-row sr-sms" href="sms:?body=${msg}">
              <span class="sr-icon">SMS</span>
              <span class="sr-body">
                <div class="sr-name">SMS</div>
                <div class="sr-sub" data-i18n="mob-share-sms-sub">${t('mob-share-sms-sub')}</div>
              </span>
              <span class="sr-arrow">\u2192</span>
            </a>
          </div>
        </div>
      </section>
    `;
  }

  /* ============================================================
     5. LIVE COUNTER — syncs every element with [data-count-sync]
     ============================================================ */
  function syncCounters() {
    countHandles = Array.from(document.querySelectorAll('[data-count-sync]'));
  }

  function paintCount(value) {
    const str = value.toLocaleString('fr-FR');
    countHandles.forEach(el => { el.textContent = str; });

    const pct = Math.min(100, Math.round((value / MOBILIZATION.goalTotal) * 100));
    document.querySelectorAll('[data-goal-fill]').forEach(el => { el.style.width = pct + '%'; });
    document.querySelectorAll('[data-goal-pct]').forEach(el => { el.textContent = pct + '%'; });
    document.querySelectorAll('[data-goal-pct-banner]').forEach(el => { el.textContent = pct + '% ' + t('mob-goal-pct-complete'); });
  }

  function bumpCount() {
    document.querySelectorAll('.welcome-count, .counter-pill, .footer-count-num').forEach(el => {
      el.classList.add('bump');
      setTimeout(() => el.classList.remove('bump'), 150);
    });
  }

  /* =============================================
     LIVE FIRESTORE SUBSCRIPTION
     Sets currentCount from meta/stats.totalParticipants
     and keeps it live via onSnapshot. Falls back to 0
     if Firestore is unavailable.
     ============================================= */
  function paintTodayDelta() {
    const text = '+' + MOBILIZATION.todayDelta;
    document.querySelectorAll('[data-today-delta], [data-today-delta-sign]').forEach(el => {
      el.textContent = text;
    });
  }

  function subscribeToStats() {
    if (typeof db === 'undefined' || !db) {
      console.log('Counter: Firestore not available, staying at 0');
      return;
    }
    try {
      db.collection('meta').doc('stats').onSnapshot(
        (snap) => {
          if (!snap.exists) return;
          const data = snap.data() || {};
          // Expose to other modules (map.js uses cachedStats)
          if (typeof window !== 'undefined') window.cachedStats = data;
          try { cachedStats = data; } catch (e) {}

          const newCount = Number(data.totalParticipants) || 0;
          // Strict UTC-day count: server-incremented on each new
          // participant, reset to 0 by the resetDailyCounter scheduled CF
          // every day at 00:00 UTC.
          const todayN = Number(data.todayCount) || 0;
          if (todayN !== MOBILIZATION.todayDelta) {
            MOBILIZATION.todayDelta = todayN;
            paintTodayDelta();
          }
          const delta = newCount - currentCount;
          if (delta !== 0) {
            currentCount = newCount;
            paintCount(currentCount);
            if (delta > 0) bumpCount();
          }
          // Redraw leaderboard + stats band labels with fresh per-dept data
          refreshLeaderboard();
          refreshWelcomeStats();
          // Community stats band (#stat-dept, #stat-dias) from the same snapshot
          if (typeof paintCommunityStats === 'function') {
            try { paintCommunityStats(data); } catch (e) {}
          }
          // Question list counts on the community hub ("0 réponses" → live)
          if (typeof buildQuestionButtons === 'function' && document.getElementById('qb-grid')) {
            try { buildQuestionButtons(); } catch (e) {}
          }
          // Re-render the national map if it's the visible page so dept
          // counts stay in sync with meta/stats.perDept on every tick.
          if (typeof renderMap === 'function' && document.querySelector('.map-svg')) {
            try { renderMap(); } catch (e) {}
          }
          // Map page: re-render with the live perDept baseline
          if (typeof renderMap === 'function' && document.querySelector('.map-svg')) {
            try { renderMap(); } catch (e) {}
          }
          // Rapport page: rebuild analysis sections with the live data
          if (typeof buildRapport === 'function' && document.getElementById('rapport-questions')) {
            try { buildRapport(); } catch (e) {}
          }
        },
        (err) => console.warn('Counter subscription error:', err && err.message)
      );
    } catch (e) {
      console.warn('Counter subscribe failed:', e && e.message);
    }
  }

  /* ============================================================
     6. FOOTER COUNT LINE
     ============================================================ */
  function enhanceFooter() {
    document.querySelectorAll('footer .footer-brand').forEach(brand => {
      if (brand.querySelector('.footer-count')) return;
      const title = brand.querySelector('h5');
      if (title && !brand.querySelector('.footer-brand-lockup')) {
        const lockup = document.createElement('div');
        lockup.className = 'footer-brand-lockup';
        lockup.innerHTML = flagMarkHTML(false);
        lockup.appendChild(title.cloneNode(true));
        title.replaceWith(lockup);
      }
      const count = document.createElement('div');
      count.className = 'footer-count';
      count.innerHTML = `<span class="live-dot live-dot--gold"></span><span class="footer-count-num" data-count-sync>0</span><span data-i18n="mob-counter-label">${t('mob-counter-label')}</span>`;
      brand.appendChild(count);
    });
  }

  /* ============================================================
     7. COUNT-UP for STATS (.stats n)
     ============================================================ */
  function animateCountUp(el) {
    const text = String(el.textContent).replace(/[^\d]/g, '');
    const target = parseInt(text, 10);
    if (!isFinite(target) || target <= 0) return;
    const duration = 1100;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('fr-FR');
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  const statsObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.stat-item .n').forEach((n, i) => {
          setTimeout(() => animateCountUp(n), i * 140);
        });
        statsObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.stats').forEach(el => statsObserver.observe(el));

  /* ============================================================
     8. BUTTON RIPPLE — track click coords
     ============================================================ */
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn-primary, .btn-ghost, .welcome-cta, .btn-gold');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    btn.style.setProperty('--ripple-x', (((e.clientX - rect.left) / rect.width) * 100) + '%');
    btn.style.setProperty('--ripple-y', (((e.clientY - rect.top)  / rect.height) * 100) + '%');
  });

  /* ============================================================
     9. PAGE TRANSITION (intercept navigation)
     ============================================================ */
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href$=".html"]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#')) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    document.body.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
    document.body.style.opacity = '0';
    document.body.style.transform = 'translateY(6px)';
    setTimeout(() => { window.location.href = href; }, 220);
  });

  /* ============================================================
    10. MOBILE BOTTOM NAV
     ============================================================ */
  function buildMobileNav() {
    if (document.querySelector('.mobile-nav')) return;
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const nav = document.createElement('nav');
    nav.className = 'mobile-nav';
    const svgIcon = (path, vb) => `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="${vb || '0 0 24 24'}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
    const items = [
      { href: 'index.html',     label: 'Akèy',      i18n: 'nav-home',      icon: svgIcon('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>') },
      { href: 'rapport.html',   label: 'Rapport',   i18n: 'nav-rapport',   icon: svgIcon('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>') },
      { href: 'map.html',       label: 'Kat',       i18n: 'nav-map',       icon: svgIcon('<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>') },
      { href: 'about.html',     label: 'Poukisa',   i18n: 'nav-about',     icon: svgIcon('<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>') },
      { href: 'consulted.html', label: 'Konsilte',  i18n: 'nav-consulted', icon: svgIcon('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>') }
    ];
    nav.innerHTML = items.map(item => {
      const isActive = currentPage === item.href;
      const label = (typeof i18n !== 'undefined' && typeof currentLang !== 'undefined' && i18n[currentLang] && i18n[currentLang][item.i18n])
        ? i18n[currentLang][item.i18n] : item.label;
      return `<a href="${item.href}" class="mobile-nav-link ${isActive ? 'active' : ''}" data-i18n="${item.i18n}"><span class="mobile-nav-icon">${item.icon}</span>${label}</a>`;
    }).join('');
    document.body.appendChild(nav);
  }
  if (window.innerWidth <= 768) buildMobileNav();
  window.addEventListener('resize', () => {
    if (window.innerWidth <= 768 && !document.querySelector('.mobile-nav')) buildMobileNav();
  });

  /* ============================================================
    11. SMOOTH SCROLL
     ============================================================ */
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  /* ============================================================
    12. LANGUAGE CHANGE HOOK
    After setLang runs (which updates all [data-i18n] nodes),
    we re-paint interpolated strings like "X% complété" which
    combine a number with a translated suffix.
     ============================================================ */
  if (typeof window.setLang === 'function') {
    const origSetLang = window.setLang;
    window.setLang = function(lang) {
      origSetLang(lang);
      paintCount(currentCount);
    };
  }

  /* ============================================================
    13. WELCOME TOAST — shown once per session on the landing
     ============================================================ */
  function maybeShowWelcomeToast() {
    if (!document.querySelector('.welcome-screen')) return;         // landing only
    try { if (sessionStorage.getItem('rn_welcomed')) return; } catch (e) {}
    if (typeof showToast !== 'function') return;
    setTimeout(() => {
      showToast(t('welcome-toast'), 6500);
      try { sessionStorage.setItem('rn_welcomed', '1'); } catch (e) {}
    }, 1400);
  }

  /* ============================================================
    14. BOOT SEQUENCE
     ============================================================ */
  enhanceWelcome();
  enhanceQuestionsHeader();
  enhanceFooter();
  syncCounters();
  paintCount(currentCount);
  observeReveals();
  maybeShowWelcomeToast();

  // Subscribe to real Firestore participant count (live updates on submit)
  if (countHandles.length > 0) {
    subscribeToStats();
  }

  // Re-sync after phase switches or other deferred DOM builds.
  // Watch ONLY class-attribute changes on .phase containers (phase toggling),
  // plus feed/grid containers that JS may populate — avoids a textContent loop.
  const phaseObserver = new MutationObserver(entries => {
    let shouldResync = false;
    for (const m of entries) {
      if (m.type === 'attributes' && m.attributeName === 'class') { shouldResync = true; break; }
      if (m.type === 'childList' && (m.addedNodes.length || m.removedNodes.length)) {
        // Only re-scan if the mutation adds/removes element nodes (not text updates)
        for (const n of m.addedNodes) if (n.nodeType === 1) { shouldResync = true; break; }
        if (shouldResync) break;
      }
    }
    if (!shouldResync) return;
    syncCounters();
    paintCount(currentCount);
    observeReveals();
  });
  document.querySelectorAll('.phase').forEach(phase => {
    phaseObserver.observe(phase, { attributes: true, attributeFilter: ['class'] });
  });
  ['#activity-feed', '#qb-grid', '#answers-grid', '#consulted-grid', '#ranking-list'].forEach(sel => {
    const el = document.querySelector(sel);
    if (el) phaseObserver.observe(el, { childList: true });
  });

})();
