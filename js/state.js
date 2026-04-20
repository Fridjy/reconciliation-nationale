/* =============================================
   APPLICATION STATE
   Central state shared across all modules.
   ============================================= */
let currentLang = 'fr';
let currentStep = 0;
let currentDraft = { q1: '', q2: '', q3: '', q4: '', q5: '', name: '', where: '' };
let answers = [];
let userVotes = new Set(JSON.parse(localStorage.getItem('rn_votes') || '[]'));
let currentTab = 'q1';
let selectedDept = null;

// Pagination & filter state
let currentPage = 1;
let sortBy = 'votes';
let filterDept = null;
let searchQuery = '';
let lastDocCursor = null;
let cachedStats = null;

/* =============================================
   UTILITIES
   ============================================= */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function showToast(msg, duration) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration || 2400);
}

function updateDateStamp() {
  const el = document.getElementById('date-stamp');
  if (!el) return;
  const d = new Date();
  const months = {
    ht: ['Janvye','Fevriye','Mas','Avril','Me','Jen','Jiyè','Out','Septanm','Oktòb','Novanm','Desanm'],
    fr: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
    en: ['January','February','March','April','May','June','July','August','September','October','November','December']
  };
  el.textContent = `${d.getDate()} ${months[currentLang][d.getMonth()]} ${d.getFullYear()}`;
}

async function updateStats() {
  const partEl = document.getElementById('stat-participants');
  if (!partEl) return;

  // Try Firestore
  if (typeof DB !== 'undefined' && typeof db !== 'undefined') {
    try {
      cachedStats = await DB.fetchStats();
      paintCommunityStats(cachedStats);
      return;
    } catch (e) {
      console.warn('Stats Firestore error, using local:', e.message);
    }
  }

  // Fallback: local — count 1 per person (form), not per question
  let manifests = 0, votes = 0;
  answers.forEach(a => {
    const hasAny = QUESTIONS.some(q => {
      const val = a[q.id];
      const text = typeof val === 'object' ? (val && (val.ht || '')) : val;
      return text && text.trim();
    });
    if (hasAny) manifests++;
    QUESTIONS.forEach(q => { votes += (a.votes && a.votes[q.id]) || 0; });
  });
  paintCommunityStats({ totalParticipants: manifests, totalAnswers: manifests, totalVotes: votes, perDept: {} });
}

/* Paint the community stats band from a stats object. No padding, no hardcoded
   geography — every number reflects actual Firestore / local data. */
function paintCommunityStats(stats) {
  const s = stats || {};
  const set = (id, n) => {
    const el = document.getElementById(id);
    if (el) el.textContent = Number(n || 0).toLocaleString();
  };
  set('stat-participants', s.totalParticipants);
  set('stat-answers',       s.totalAnswers);
  set('stat-votes',         s.totalVotes);

  const perDept = s.perDept || {};
  const activeDepts = Object.keys(perDept).filter(k => k !== 'diaspora' && (perDept[k] || 0) > 0).length;
  const diasporaCount = Number(perDept.diaspora || 0);
  set('stat-dept',  activeDepts);
  set('stat-dias',  diasporaCount);
}

/* =============================================
   CHECK IF USER IS ALREADY REGISTERED
   ============================================= */
function getStoredUser() {
  try {
    const raw = localStorage.getItem('rn_user');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

/* =============================================
   LANGUAGE SWITCHING
   ============================================= */
function setLang(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;

  // Update all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[lang][key]) el.innerHTML = i18n[lang][key];
  });

  // Update all lang switch buttons across all topbars
  document.querySelectorAll('.lang-switch button').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });

  // Update placeholders
  if (typeof updatePlaceholders === 'function') updatePlaceholders();

  // Determine which phase is active and rebuild its content
  const activePhase = document.querySelector('.phase.active');
  if (activePhase) {
    const phaseId = activePhase.id;
    if (phaseId === 'phase-questionnaire') {
      // Rebuild whichever questionnaire screen is visible
      if (document.getElementById('q-picker') && document.getElementById('q-picker').style.display !== 'none') {
        buildPickerCards();
      }
      if (document.getElementById('q-fullscreen') && document.getElementById('q-fullscreen').style.display !== 'none' && currentQuestionId) {
        openQuestion(currentQuestionId);
      }
    } else if (phaseId === 'phase-register') {
      buildRegisterReview();
    } else if (phaseId === 'phase-community') {
      if (typeof buildQuestionButtons === 'function') buildQuestionButtons();
      buildTabs();
      renderAnswers();
      if (typeof renderMap === 'function') renderMap();
      updateDateStamp();
      // Update profile button initials
      const user = getStoredUser();
      if (user) {
        const initialsEl = document.getElementById('profile-initials');
        if (initialsEl && typeof getInitials === 'function') {
          initialsEl.textContent = getInitials(user.name);
        }
      }
    }
  }
}
