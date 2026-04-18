/* =============================================
   MODERN INTERACTIONS
   Scroll animations, count-up, ripple effects
   ============================================= */

(function modernInit() {

  /* ----- SCROLL REVEAL (enhanced) ----- */
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        // Don't unobserve so re-entry works if user scrolls back
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  // Observe all reveal elements
  document.querySelectorAll('.reveal, .reveal-stagger, .reveal-left, .reveal-scale').forEach(el => {
    revealObserver.observe(el);
  });

  /* ----- COUNT-UP ANIMATION on stats ----- */
  function animateCountUp(el) {
    const text = el.textContent.replace(/,/g, '');
    const target = parseInt(text, 10);
    if (isNaN(target)) return;

    const duration = 1200;
    const start = performance.now();
    const initial = 0;

    el.classList.add('count-up');

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(initial + (target - initial) * ease);
      el.textContent = current.toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // Observe stats section
  const statsObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.stat-item .n').forEach((n, i) => {
          setTimeout(() => animateCountUp(n), i * 150);
        });
        statsObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });

  const statsEl = document.querySelector('.stats');
  if (statsEl) statsObserver.observe(statsEl);

  /* ----- BUTTON RIPPLE EFFECT ----- */
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn-primary, .btn-ghost');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    btn.style.setProperty('--ripple-x', x + '%');
    btn.style.setProperty('--ripple-y', y + '%');
  });

  /* ----- PAGE TRANSITION (intercept navigation) ----- */
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href$=".html"]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#')) return;
    // Don't intercept if modifier key held
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;

    e.preventDefault();
    document.body.style.opacity = '0';
    document.body.style.transform = 'translateY(8px)';
    document.body.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    setTimeout(() => { window.location.href = href; }, 250);
  });

  /* ----- MOBILE BOTTOM NAV ----- */
  if (window.innerWidth <= 768) {
    buildMobileNav();
  }
  window.addEventListener('resize', () => {
    if (window.innerWidth <= 768 && !document.querySelector('.mobile-nav')) {
      buildMobileNav();
    }
  });

  function buildMobileNav() {
    if (document.querySelector('.mobile-nav')) return;

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const nav = document.createElement('nav');
    nav.className = 'mobile-nav';

    const svgIcon = (path, vb) => `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="${vb || '0 0 24 24'}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;

    const items = [
      { href: 'index.html', icon: svgIcon('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'), label: 'Accueil', i18n: 'nav-home' },
      { href: 'rapport.html', icon: svgIcon('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>'), label: 'Rapport', i18n: 'nav-rapport' },
      { href: 'map.html', icon: svgIcon('<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>'), label: 'Carte', i18n: 'nav-map' },
      { href: 'about.html', icon: svgIcon('<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'), label: '\u00c0 propos', i18n: 'nav-about' },
      { href: 'consulted.html', icon: svgIcon('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'), label: 'Consult.', i18n: 'nav-consulted' }
    ];

    nav.innerHTML = items.map(item => {
      const isActive = currentPage === item.href;
      const label = (typeof i18n !== 'undefined' && typeof currentLang !== 'undefined' && i18n[currentLang] && i18n[currentLang][item.i18n])
        ? i18n[currentLang][item.i18n] : item.label;
      return `
        <a href="${item.href}" class="mobile-nav-link ${isActive ? 'active' : ''}" data-i18n="${item.i18n}">
          <span class="mobile-nav-icon">${item.icon}</span>
          ${label}
        </a>
      `;
    }).join('');

    document.body.appendChild(nav);
  }

  /* ----- SMOOTH SCROLL for anchor links ----- */
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

})();
