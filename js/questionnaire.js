/* =============================================
   QUESTIONNAIRE — Fullscreen question-first flow
   User lands directly on Q1, progresses through Q5,
   then moves to registration phase.
   ============================================= */

/* =============================================
   WELCOME SCREEN
   ============================================= */
function initWelcome() {
  const countEl = document.getElementById('welcome-count');
  if (countEl) countEl.textContent = (1847 + Math.max(0, answers.length - 4)).toLocaleString();

  const quoteEl = document.getElementById('welcome-quote');
  if (quoteEl && typeof ANALYSIS !== 'undefined') {
    const q = ANALYSIS.getRandomQuote(currentLang);
    if (q) {
      quoteEl.innerHTML = `\u00AB ${escapeHtml(q.text)} \u00BB<span class="wq-author">\u2014 ${escapeHtml(q.name)}, ${escapeHtml(q.where)}</span>`;
    }
  }
}

function startQuestionnaire() {
  document.getElementById('welcome-screen').style.display = 'none';
  document.getElementById('q-fullscreen').style.display = 'flex';
  buildFullscreenSlides();
  showStepFS(0);
}

/* =============================================
   ACTIVITY FEED
   ============================================= */
function buildActivityFeed() {
  const el = document.getElementById('activity-feed');
  if (!el) return;

  const recent = answers.slice(0, 6);
  const times = ['3 min', '12 min', '28 min', '1h', '2h', '4h'];
  const actionText = i18n[currentLang]['feed-answered'] || 'vient de r\u00e9pondre';

  el.innerHTML = `<div class="feed-list">${recent.map((a, i) => `
    <div class="feed-item">
      <span class="feed-dot"></span>
      <span class="feed-name">${escapeHtml(a.name)}</span>
      <span class="feed-action">${actionText}</span>
      <span class="feed-time">${times[i] || '5h'}</span>
    </div>
  `).join('')}</div>`;
}

/* =============================================
   SHARE CARD (after submission)
   ============================================= */
function buildShareCard() {
  const thankyouSlide = document.querySelector('.q-slide[data-step="6"] .thankyou');
  if (!thankyouSlide) return;

  const count = (1847 + Math.max(0, answers.length - 4)).toLocaleString();
  const lang = currentLang;
  const siteUrl = window.location.origin + window.location.pathname;

  const cardHtml = `
    <div class="share-card">
      <div class="share-card-num">#${count}</div>
      <div class="share-card-label">${i18n[lang]['share-card-label'] || 'voix dans le mouvement'}</div>
      <div class="share-card-msg">${i18n[lang]['share-card-msg'] || ''}</div>
      <div class="share-card-brand">R\u00e9conciliation Nationale \u00b7 Ayiti 2026</div>
    </div>
    <div class="share-btns">
      <button class="share-btn" onclick="shareWhatsApp()">WhatsApp</button>
      <button class="share-btn" onclick="shareCopyLink()">${i18n[lang]['share-copy'] || 'Copier le lien'}</button>
    </div>
  `;

  // Insert before the existing CTA
  const existingCta = thankyouSlide.querySelector('.thankyou-cta');
  if (existingCta) existingCta.insertAdjacentHTML('beforebegin', cardHtml);
}

function shareWhatsApp() {
  const text = encodeURIComponent(
    (i18n[currentLang]['share-card-msg'] || 'Votre voix compte.') +
    ' ' + window.location.href
  );
  window.open('https://wa.me/?text=' + text, '_blank');
}

function shareCopyLink() {
  navigator.clipboard.writeText(window.location.href);
  showToast(i18n[currentLang]['toast-link-copied'] || 'Lien copi\u00e9');
}

function buildFullscreenSlides() {
  const el = document.getElementById('q-fullscreen');
  el.innerHTML = QUESTIONS.map((q, i) => `
    <div class="q-fs-slide ${i === currentStep ? 'active' : ''}" data-step="${i}">
      <div class="q-fs-step">${String(i + 1).padStart(2, '0')} / 05</div>
      <h2>${i18n[currentLang][q.key].replace(/\?/g, '<span class="accent">?</span>')}</h2>
      <p class="q-fs-hint">${i18n[currentLang][q.hintKey]}</p>
      <textarea class="q-fs-textarea" id="input-${q.id}"
        placeholder="${i18n[currentLang]['q-ph']}"
        oninput="updateCharFS(${i})">${currentDraft[q.id] || ''}</textarea>
      <div class="q-fs-controls">
        <span class="q-fs-char"><span id="char-${i}">${(currentDraft[q.id] || '').length}</span> ${i18n[currentLang]['char-label']}</span>
        <div class="q-fs-nav">
          ${i > 0 ? `<button class="btn-ghost" onclick="goStepFS(${i - 1})">${i18n[currentLang]['nav-prev']}</button>` : ''}
          <button class="btn-primary" onclick="goStepFS(${i + 1})">${i < QUESTIONS.length - 1 ? i18n[currentLang]['nav-next'] : i18n[currentLang]['nav-finish']}</button>
        </div>
      </div>
    </div>
  `).join('');
}

function goStepFS(step) {
  // Save current textarea
  if (currentStep < QUESTIONS.length) {
    const ta = document.getElementById('input-' + QUESTIONS[currentStep].id);
    if (ta) currentDraft[QUESTIONS[currentStep].id] = ta.value;
  }

  // If going past last question → move to registration phase
  if (step >= QUESTIONS.length) {
    goToRegister();
    return;
  }

  currentStep = step;
  showStepFS(step);
}

function showStepFS(step) {
  const slides = document.querySelectorAll('.q-fs-slide');
  slides.forEach(s => s.classList.remove('active'));
  const target = document.querySelector('.q-fs-slide[data-step="' + step + '"]');
  if (target) {
    target.classList.add('active');
    // Focus the textarea
    const ta = target.querySelector('.q-fs-textarea');
    if (ta) setTimeout(() => ta.focus(), 100);
  }
  // Update progress bar
  const pct = ((step + 1) / QUESTIONS.length) * 100;
  document.getElementById('q-progress-fill').style.width = pct + '%';
}

function updateCharFS(i) {
  const ta = document.getElementById('input-' + QUESTIONS[i].id);
  document.getElementById('char-' + i).textContent = ta.value.length;
  currentDraft[QUESTIONS[i].id] = ta.value;
}

/* =============================================
   REGISTRATION PHASE
   ============================================= */
function goToRegister() {
  // Build review of answers
  buildRegisterReview();
  // Switch phase
  setPhase('register');
  // Update placeholders for current lang
  updatePlaceholders();
  // Init anon preview with default state
  updateAnonPreview();
  // Listen for name changes to update preview
  const nameInput = document.getElementById('reg-name');
  if (nameInput) {
    nameInput.addEventListener('input', updateAnonPreview);
  }
}

function buildRegisterReview() {
  const el = document.getElementById('register-review');
  const answeredQuestions = QUESTIONS.filter(q => currentDraft[q.id] && currentDraft[q.id].trim());

  if (answeredQuestions.length === 0) {
    el.innerHTML = '';
    return;
  }

  el.innerHTML = `
    <h4>${i18n[currentLang]['reg-review-h']}</h4>
    ${answeredQuestions.map((q, i) => {
      const idx = QUESTIONS.indexOf(q);
      return `
        <div class="rr-item">
          <div class="rr-q">${String(idx + 1).padStart(2, '0')} \u00B7 ${i18n[currentLang][q.key]}</div>
          <div class="rr-a">${escapeHtml(currentDraft[q.id])}</div>
        </div>
      `;
    }).join('')}
  `;
}

function toggleAnon() {
  updateAnonPreview();
}

function updateAnonPreview() {
  const isAnon = document.getElementById('reg-anon').checked;
  const nameInput = document.getElementById('reg-name');
  const previewName = document.getElementById('anon-preview-name');
  if (!previewName) return;

  if (isAnon) {
    previewName.textContent = i18n[currentLang]['reg-anon-name'] || 'Anonim';
  } else {
    const typed = nameInput ? nameInput.value.trim() : '';
    previewName.textContent = typed || '—';
  }
}

async function handleRegister(e) {
  e.preventDefault();

  const name = document.getElementById('reg-name').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const email = (document.getElementById('reg-email').value || '').trim();
  const address = document.getElementById('reg-address').value.trim();
  const password = document.getElementById('reg-password').value;
  const isAnon = document.getElementById('reg-anon').checked;

  // Check at least one question was answered
  const hasAnything = QUESTIONS.some(q => currentDraft[q.id] && currentDraft[q.id].trim());
  if (!hasAnything) {
    showToast(i18n[currentLang]['toast-needed']);
    return false;
  }

  // The public display name (anonymous or real)
  const publicName = isAnon ? (i18n[currentLang]['reg-anon-name'] || 'Anonim') : name;

  // Save user to localStorage (all info stays private)
  const user = { name, phone, email, address, isAnon, registered: true };
  localStorage.setItem('rn_user', JSON.stringify(user));
  localStorage.setItem('rn_auth', btoa(phone + ':' + password));

  // Build the manifesto entry
  const newEntry = {
    name: publicName,
    where: address,
    department: typeof matchDepartment === 'function' ? matchDepartment(address) : null,
    votes: { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0 },
    comments: { q1: [], q2: [], q3: [], q4: [], q5: [] }
  };
  QUESTIONS.forEach(q => {
    newEntry[q.id] = currentDraft[q.id] ? currentDraft[q.id].trim() : '';
  });

  // Submit to Firestore
  if (typeof DB !== 'undefined' && typeof db !== 'undefined') {
    try {
      const docId = await DB.submitAnswer(newEntry);
      newEntry.id = docId;
    } catch (e) {
      console.warn('Firestore submit error:', e.message);
      newEntry.id = Date.now();
    }
  } else {
    newEntry.id = Date.now();
  }

  // Also keep in local array
  answers.unshift(newEntry);

  // Save user to Firestore
  if (typeof DB !== 'undefined' && typeof db !== 'undefined') {
    try { await DB.saveUser(user); } catch (e) { console.warn('User save error:', e.message); }
  }

  // Reset draft
  currentDraft = { q1: '', q2: '', q3: '', q4: '', q5: '', name: '', where: '' };

  // Go to community (greet with real name, not public name)
  goToCommunity(name);
  showToast(i18n[currentLang]['toast-published']);
  return false;
}

function handleLogin(e) {
  e.preventDefault();
  const phone = document.getElementById('login-phone').value.trim().replace(/\s+/g, '');
  const password = document.getElementById('login-password').value;
  const attempt = btoa(phone + ':' + password);
  const storedAuth = localStorage.getItem('rn_auth');

  // Check against stored account
  if (storedAuth && storedAuth === attempt) {
    const user = JSON.parse(localStorage.getItem('rn_user') || '{}');
    hideLogin();
    goToCommunity(user.name || 'Anonim');
    return false;
  }

  // Check against default account (admin)
  if (attempt === DEFAULT_AUTH) {
    localStorage.setItem('rn_user', JSON.stringify(DEFAULT_ACCOUNT));
    localStorage.setItem('rn_auth', DEFAULT_AUTH);
    hideLogin();
    goToCommunity(DEFAULT_ACCOUNT.name);
    return false;
  }

  // No match
  showToast(i18n[currentLang]['login-error'] || 'Nimewo oswa modpas pa k\u00F2r\u00E8k');
  return false;
}

/* =============================================
   PHASE NAVIGATION
   ============================================= */
function setPhase(phaseName) {
  document.querySelectorAll('.phase').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('phase-' + phaseName);
  if (target) {
    target.classList.add('active');
    window.scrollTo(0, 0);
  }
}

function goToCommunity(userName) {
  setPhase('community');

  // Set up profile button with initials
  try {
    const initials = getInitials(userName);
    const initialsEl = document.getElementById('profile-initials');
    if (initialsEl) initialsEl.textContent = initials;
  } catch (e) { console.warn('Profile initials error:', e); }

  // Build community content — each call is independent, don't let one crash stop the rest
  try { updateStats(); } catch (e) { console.warn('Stats error:', e); }
  try { buildActivityFeed(); } catch (e) { console.warn('Feed error:', e); }
  try { if (typeof buildQuestionButtons === 'function') buildQuestionButtons(); } catch (e) { console.warn('Question buttons error:', e); }
  try { buildTabs(); } catch (e) { console.warn('Tabs error:', e); }
  try { renderAnswers(); } catch (e) { console.warn('Answers error:', e); }
  try { if (typeof attachMapHandlers === 'function') attachMapHandlers(); } catch (e) { console.warn('Map handlers error:', e); }
  try { if (typeof renderMap === 'function') renderMap(); } catch (e) { console.warn('Map error:', e); }
  try { updateDateStamp(); } catch (e) { console.warn('Date error:', e); }

  // Init reveal observer for community
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.12 });
  document.querySelectorAll('#phase-community .reveal').forEach(el => io.observe(el));
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/* =============================================
   OVERLAYS
   ============================================= */
function showAbout() {
  document.getElementById('about-overlay').classList.add('open');
}
function hideAbout() {
  document.getElementById('about-overlay').classList.remove('open');
}
function showLogin() {
  document.getElementById('login-overlay').classList.add('open');
  updatePlaceholders();
}
function hideLogin() {
  document.getElementById('login-overlay').classList.remove('open');
}

function showProfile() {
  const user = getStoredUser();
  if (!user) return;

  const lang = currentLang;
  const initials = getInitials(user.name);

  // Fill avatar + name
  document.getElementById('profile-avatar').textContent = initials;
  document.getElementById('profile-display-name').textContent = user.name;

  // Fill info rows
  const statusText = user.isAnon
    ? (i18n[lang]['profile-status-anon'] || 'Anonim')
    : (i18n[lang]['profile-status-public'] || 'Non vizib');

  document.getElementById('profile-info').innerHTML = `
    <div class="profile-row">
      <span class="profile-row-label">${i18n[lang]['profile-name'] || 'Non'}</span>
      <span class="profile-row-value">${escapeHtml(user.name)}</span>
    </div>
    <div class="profile-row">
      <span class="profile-row-label">${i18n[lang]['profile-phone'] || 'Telef\u00F2n'}</span>
      <span class="profile-row-value">${escapeHtml(user.phone)}</span>
    </div>
    ${user.email ? `<div class="profile-row">
      <span class="profile-row-label">${i18n[lang]['profile-email'] || 'Im\u00E8l'}</span>
      <span class="profile-row-value">${escapeHtml(user.email)}</span>
    </div>` : ''}
    <div class="profile-row">
      <span class="profile-row-label">${i18n[lang]['profile-address'] || 'Kote'}</span>
      <span class="profile-row-value">${escapeHtml(user.address)}</span>
    </div>
    <div class="profile-row">
      <span class="profile-row-label">${i18n[lang]['profile-status'] || 'Estati'}</span>
      <span class="profile-row-value">${statusText}</span>
    </div>
  `;

  document.getElementById('profile-overlay').classList.add('open');
}

function hideProfile() {
  document.getElementById('profile-overlay').classList.remove('open');
}

function handleLogout() {
  localStorage.removeItem('rn_user');
  localStorage.removeItem('rn_auth');
  hideProfile();
  // Reset to questionnaire phase
  currentStep = 0;
  currentDraft = { q1: '', q2: '', q3: '', q4: '', q5: '', name: '', where: '' };
  setPhase('questionnaire');
  buildFullscreenSlides();
  showStepFS(0);
}

function updatePlaceholders() {
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    if (i18n[currentLang][key]) el.placeholder = i18n[currentLang][key];
  });
}

/* =============================================
   SHARE (reused from before)
   ============================================= */
function shareSite() {
  const title = 'Rekonsilyasyon Nasyonal \u00B7 5 Kesyon';
  const text = i18n[currentLang]['about-p1'] || '';
  if (navigator.share) {
    navigator.share({ title, text, url: window.location.href }).catch(() => {});
  } else {
    navigator.clipboard.writeText(title + ' \u2014 ' + window.location.href);
    showToast('Lyen kopye \u00B7 Lien copi\u00E9 \u00B7 Link copied');
  }
}

/* =============================================
   LEGACY STUBS (for community answer cards)
   ============================================= */
function buildQuestionCards() {}
function buildQuestionnaireSlides() {}
