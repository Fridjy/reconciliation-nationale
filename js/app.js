/* =============================================
   APP INIT — Boot sequence

   Flow:
   1. If user is already registered → go straight to community
   2. Otherwise → show Q1 immediately (fullscreen)
   ============================================= */

// Language switcher (all instances across all phases)
document.querySelectorAll('.lang-switch button').forEach(b => {
  b.addEventListener('click', () => setLang(b.dataset.lang));
});

// Close overlays with Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const about = document.getElementById('about-overlay');
    const login = document.getElementById('login-overlay');
    const profile = document.getElementById('profile-overlay');
    if (about && about.classList.contains('open')) hideAbout();
    if (login && login.classList.contains('open')) hideLogin();
    if (profile && profile.classList.contains('open')) hideProfile();
  }
});

// Boot
(function init() {
  try {
    // Seed data lives in Firestore; no client-side seeding.
    const user = getStoredUser();

    if (user && user.registered) {
      // Returning user → skip to community
      setPhase('community');
      setLang(currentLang);
      goToCommunity(user.name);
    } else {
      // New user → show welcome screen
      setLang(currentLang);
      initWelcome();
    }
  } catch (e) {
    console.error('Boot error:', e);
    // Fallback: show questionnaire
    setLang(currentLang);
    buildFullscreenSlides();
    showStepFS(0);
  }
})();
