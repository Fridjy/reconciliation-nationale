/* =============================================
   RAPPORT MOTION — adds reveal classes + count-up
   Pairs with css/rapport-motion.css
   No HTML/copy changes; idempotent; re-runs on
   language switch (which re-renders the rapport).
   ============================================= */
(function rapportMotion() {

  if (!document.getElementById('rapport-questions')) return;

  const REVEAL_SELECTORS = [
    '#rapport-questions > div',
    '#rapport-questions .rapport-card',
    '#rapport-insights .insight-card',
    '#rapport-compare .compare-card',
    '.thematic-map-wrap',
    '.thematic-detail',
    '.ai-report',
    '.page-content > div > h3'
  ];

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('rm-in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  function tagAndObserve() {
    REVEAL_SELECTORS.forEach(sel => {
      const nodes = document.querySelectorAll(sel);
      nodes.forEach((node, i) => {
        if (node.classList.contains('rm-tagged')) return;
        node.classList.add('rm-reveal', 'rm-tagged');
        node.setAttribute('data-rm-i', String(Math.min(i, 7)));
        io.observe(node);
      });
    });

    // Word cloud — assign a per-word index so the float animation desynchronizes
    document.querySelectorAll('.wc-word').forEach((w, i) => {
      w.style.setProperty('--rm-i', String(i % 18));
    });

    // Insight stats — number count-up from 0 once per element
    document.querySelectorAll('.insight-card .ic-stat').forEach(el => {
      if (el.dataset.rmCounted) return;
      const raw = el.textContent.trim();
      const match = raw.match(/^(-?\d+(?:[.,]\d+)?)(.*)$/);
      if (!match) return;
      const target = parseFloat(match[1].replace(',', '.'));
      const suffix = match[2];
      const isInt = Number.isInteger(target);
      el.dataset.rmCounted = '1';
      el.dataset.rmTarget = String(target);
      el.dataset.rmSuffix = suffix;
      const startObserver = new IntersectionObserver((entries) => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          startObserver.unobserve(en.target);
          countUp(en.target, target, suffix, isInt);
        });
      }, { threshold: 0.4 });
      el.textContent = (isInt ? '0' : '0.0') + suffix;
      startObserver.observe(el);
    });
  }

  function countUp(el, target, suffix, isInt) {
    const dur = 1100;
    const t0 = performance.now();
    function frame(now) {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = target * eased;
      el.textContent = (isInt ? Math.round(v) : v.toFixed(1)).toString().replace('.', ',') + suffix;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = (isInt ? Math.round(target) : target.toFixed(1)).toString().replace('.', ',') + suffix;
    }
    requestAnimationFrame(frame);
  }

  // Run after the inline buildRapport() has populated the DOM.
  // buildRapport() runs synchronously on script load, but JS-rendered
  // children may need a microtask. Run twice to cover both timings.
  tagAndObserve();
  setTimeout(tagAndObserve, 50);
  setTimeout(tagAndObserve, 400);

  // Re-tag on language switch — buildRapport() re-renders the cards,
  // wiping our classes. Hook into the existing setLang flow.
  if (typeof window.setLang === 'function') {
    const orig = window.setLang;
    window.setLang = function(lang) {
      const r = orig.apply(this, arguments);
      // After setLang triggers buildRapport in the inline script
      setTimeout(tagAndObserve, 60);
      setTimeout(tagAndObserve, 400);
      return r;
    };
  }

})();
