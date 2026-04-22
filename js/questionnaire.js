/* =============================================
   QUESTIONNAIRE — Individual question flow
   Each question can be answered independently.
   A user can answer 1, 2, or all 5 questions.
   Supports ?q=3 URL parameter for promotion.
   ============================================= */

// Track which questions the current user has answered
let answeredQuestions = JSON.parse(localStorage.getItem('rn_answered') || '[]');
let currentQuestionId = null;
let fullFormMode = false; // true = sequential Q1→Q5, false = single question
let fullFormStep = 0;     // current step in full form mode (0-4)

/* =============================================
   WELCOME SCREEN
   ============================================= */
function initWelcome() {
  const countEl = document.getElementById('welcome-count');
  if (countEl) countEl.textContent = answers.length.toLocaleString();

  const quoteEl = document.getElementById('welcome-quote');
  if (quoteEl && typeof ANALYSIS !== 'undefined') {
    const q = ANALYSIS.getRandomQuote(currentLang);
    if (q) {
      quoteEl.innerHTML = `\u00AB ${escapeHtml(q.text)} \u00BB<span class="wq-author">\u2014 ${escapeHtml(q.name)}, ${escapeHtml(q.where)}</span>`;
    }
  }

  // Check URL parameters
  const params = new URLSearchParams(window.location.search);
  const qParam = params.get('q');
  const mode = params.get('mode');

  if (qParam && qParam >= 1 && qParam <= 5) {
    // ?q=3 → skip welcome, go directly to that single question
    document.getElementById('welcome-screen').style.display = 'none';
    fullFormMode = false;
    openQuestion('q' + qParam);
  } else if (mode === 'full') {
    // ?mode=full → skip welcome, start full sequential form
    document.getElementById('welcome-screen').style.display = 'none';
    startFullForm();
  }
}

function startQuestionnaire() {
  document.getElementById('welcome-screen').style.display = 'none';
  showQuestionPicker();
}

/* =============================================
   QUESTION PICKER — Choose which question to answer
   ============================================= */
function showQuestionPicker() {
  hideAllQScreens();
  document.getElementById('q-picker').style.display = 'flex';
  buildPickerCards();
}

function buildPickerCards() {
  const el = document.getElementById('q-picker-grid');
  if (!el) return;
  const lang = currentLang;

  let html = QUESTIONS.map((q, i) => {
    const isAnswered = answeredQuestions.includes(q.id);
    const badgeText = isAnswered
      ? (i18n[lang]['picker-done'] || 'R\u00e9pondu')
      : (i18n[lang]['picker-answer'] || 'R\u00e9pondre');
    return `
      <div class="qp-card ${isAnswered ? 'qp-answered' : ''}" data-q="${i + 1}" onclick="openQuestion('${q.id}')">
        <span class="qp-num">${i + 1}</span>
        <span class="qp-text">${i18n[lang][q.key]}</span>
        <div class="qp-right">
          <span class="qp-badge">${badgeText}</span>
          <span class="qp-arrow">\u2192</span>
        </div>
      </div>
    `;
  }).join('');

  // "Answer all 5" button
  html += `
    <div class="qp-all" onclick="startFullForm()">
      <span class="qp-all-icon">\u2630</span>
      <span class="qp-all-text">${i18n[lang]['picker-all'] || 'R\u00e9pondre aux 5 questions'}</span>
      <span class="qp-arrow">\u2192</span>
    </div>
  `;

  el.innerHTML = html;
}

/* =============================================
   FULL FORM MODE — Q1 → Q2 → Q3 → Q4 → Q5 → register → submit all
   ============================================= */
function startFullForm() {
  fullFormMode = true;
  fullFormStep = 0;
  openQuestion(QUESTIONS[0].id);
}

function nextFullFormStep() {
  // Save current answer
  const ta = document.getElementById('input-' + currentQuestionId);
  if (ta) currentDraft[currentQuestionId] = ta.value;

  fullFormStep++;
  if (fullFormStep < QUESTIONS.length) {
    // Next question
    openQuestion(QUESTIONS[fullFormStep].id);
  } else {
    // All 5 done → register (if needed) then submit all
    submitFullForm();
  }
}

function prevFullFormStep() {
  const ta = document.getElementById('input-' + currentQuestionId);
  if (ta) currentDraft[currentQuestionId] = ta.value;

  if (fullFormStep > 0) {
    fullFormStep--;
    openQuestion(QUESTIONS[fullFormStep].id);
  } else {
    showQuestionPicker();
  }
}

async function submitFullForm() {
  // Check at least one question answered
  const hasAnything = QUESTIONS.some(q => currentDraft[q.id] && currentDraft[q.id].trim());
  if (!hasAnything) {
    showToast(i18n[currentLang]['toast-needed'] || 'R\u00e9pondez \u00e0 au moins une question');
    return;
  }

  const user = getStoredUser();
  if (!user || !user.registered) {
    goToRegister();
    return;
  }

  await doSubmitFullForm(user);
}

async function doSubmitFullForm(user) {
  const publicName = user.isAnon ? (i18n[currentLang]['reg-anon-name'] || 'Anonyme') : user.name;

  const newEntry = {
    name: publicName,
    where: user.address,
    department: user.department || (typeof matchDepartment === 'function' ? matchDepartment(user.address) : null),
    votes: { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0 },
    comments: { q1: [], q2: [], q3: [], q4: [], q5: [] },
    _userId: user.phone
  };
  QUESTIONS.forEach(q => {
    newEntry[q.id] = currentDraft[q.id] ? currentDraft[q.id].trim() : '';
  });

  if (typeof DB !== 'undefined' && db) {
    try { const docId = await DB.submitAnswer(newEntry); newEntry.id = docId; } catch (e) { newEntry.id = Date.now(); }
  } else {
    newEntry.id = Date.now();
  }
  answers.unshift(newEntry);

  // Mark all answered questions
  QUESTIONS.forEach(q => {
    if (currentDraft[q.id] && currentDraft[q.id].trim() && !answeredQuestions.includes(q.id)) {
      answeredQuestions.push(q.id);
    }
  });
  localStorage.setItem('rn_answered', JSON.stringify(answeredQuestions));

  // Clear drafts
  currentDraft = { q1: '', q2: '', q3: '', q4: '', q5: '', name: '', where: '' };
  fullFormMode = false;

  showThankYou();
  showToast(i18n[currentLang]['toast-published'] || 'R\u00e9ponses publi\u00e9es \u2014 merci');
}

/* =============================================
   SINGLE QUESTION — Fullscreen answer
   ============================================= */
function openQuestion(qId) {
  currentQuestionId = qId;
  const idx = QUESTIONS.findIndex(q => q.id === qId);
  const q = QUESTIONS[idx];
  const lang = currentLang;

  hideAllQScreens();
  const el = document.getElementById('q-fullscreen');
  el.style.display = 'flex';

  // Update progress bar
  const pct = ((idx + 1) / QUESTIONS.length) * 100;
  const progEl = document.getElementById('q-progress-fill');
  if (progEl) progEl.style.width = pct + '%';

  // Build navigation buttons based on mode
  let navHtml = '';
  if (fullFormMode) {
    // Sequential mode: Prev / Next or Finish
    const prevBtn = fullFormStep > 0
      ? `<button class="btn-ghost" onclick="prevFullFormStep()">${i18n[lang]['nav-prev'] || '\u2190 Pr\u00e9c\u00e9dent'}</button>`
      : `<button class="btn-ghost" onclick="showQuestionPicker()">${i18n[lang]['back-questions'] || '\u2190 Retour'}</button>`;
    const nextBtn = fullFormStep < QUESTIONS.length - 1
      ? `<button class="btn-primary" onclick="nextFullFormStep()">${i18n[lang]['nav-next'] || 'Suivant \u2192'}</button>`
      : `<button class="btn-primary" onclick="nextFullFormStep()">${i18n[lang]['nav-finish'] || 'Terminer \u2192'}</button>`;
    navHtml = prevBtn + nextBtn;
  } else {
    // Single question mode: Back / Submit
    navHtml = `
      <button class="btn-ghost" onclick="showQuestionPicker()">${i18n[lang]['back-questions'] || '\u2190 Retour'}</button>
      <button class="btn-primary" onclick="submitSingleAnswer()">${i18n[lang]['submit-answer'] || 'Envoyer'}</button>
    `;
  }

  el.innerHTML = `
    <div class="q-fs-slide active">
      <div class="q-fs-step">${fullFormMode ? String(fullFormStep + 1).padStart(2, '0') + ' / 05' : String(idx + 1).padStart(2, '0') + ' / 05'}</div>
      <h2>${i18n[lang][q.key].replace(/\?/g, '<span class="accent">?</span>')}</h2>
      <p class="q-fs-hint">${i18n[lang][q.hintKey]}</p>
      <textarea class="q-fs-textarea" id="input-${q.id}"
        placeholder="${i18n[lang]['q-ph'] || '\u00c9crivez ici...'}"
        oninput="updateSingleChar()">${currentDraft[q.id] || ''}</textarea>
      <div class="q-fs-controls">
        <span class="q-fs-char"><span id="single-char-count">${(currentDraft[q.id] || '').length}</span> ${i18n[lang]['char-label'] || 'caract\u00e8res'}</span>
        <div class="q-fs-nav">${navHtml}</div>
      </div>
    </div>
  `;

  // Focus textarea
  const ta = document.getElementById('input-' + q.id);
  if (ta) setTimeout(() => ta.focus(), 100);
}

function updateSingleChar() {
  const ta = document.getElementById('input-' + currentQuestionId);
  const countEl = document.getElementById('single-char-count');
  if (ta && countEl) {
    countEl.textContent = ta.value.length;
    currentDraft[currentQuestionId] = ta.value;
  }
}

/* =============================================
   SUBMIT SINGLE ANSWER
   ============================================= */
async function submitSingleAnswer() {
  const ta = document.getElementById('input-' + currentQuestionId);
  if (!ta || !ta.value.trim()) {
    showToast(i18n[currentLang]['toast-needed'] || 'Veuillez \u00e9crire une r\u00e9ponse');
    return;
  }

  currentDraft[currentQuestionId] = ta.value.trim();

  // Check if user is registered
  const user = getStoredUser();
  if (!user || !user.registered) {
    // Go to registration first, then come back to submit
    goToRegister();
    return;
  }

  // User is registered — submit this answer
  await doSubmitSingleAnswer(user);
}

async function doSubmitSingleAnswer(user) {
  const publicName = user.isAnon ? (i18n[currentLang]['reg-anon-name'] || 'Anonyme') : user.name;
  const newText = currentDraft[currentQuestionId];

  // Delegate merge/create decision to the CF (keyed by phoneHash server-side).
  const entry = {
    name: publicName,
    phone: user.phone,
    where: user.address,
    department: user.department || (typeof matchDepartment === 'function' ? matchDepartment(user.address) : null),
    [currentQuestionId]: newText
  };

  let docId = null;
  if (typeof DB !== 'undefined' && typeof functions !== 'undefined' && functions) {
    try { docId = await DB.submitAnswer(entry); }
    catch (e) { console.warn('submitAnswer failed:', e.message); }
  }

  // Sync local UI state so the answer appears immediately without a refetch.
  const existingEntry = answers.find(a => a._userId === user.phone);
  if (existingEntry) {
    existingEntry[currentQuestionId] = newText;
    if (docId) existingEntry.id = docId;
  } else {
    const newEntry = {
      id: docId || Date.now(),
      name: publicName,
      where: user.address,
      department: entry.department,
      votes: { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0 },
      comments: { q1: [], q2: [], q3: [], q4: [], q5: [] },
      _userId: user.phone
    };
    QUESTIONS.forEach(q => {
      newEntry[q.id] = q.id === currentQuestionId ? newText : '';
    });
    answers.unshift(newEntry);
  }

  // Mark question as answered
  if (!answeredQuestions.includes(currentQuestionId)) {
    answeredQuestions.push(currentQuestionId);
    localStorage.setItem('rn_answered', JSON.stringify(answeredQuestions));
  }

  // Clear draft for this question
  currentDraft[currentQuestionId] = '';

  // Show thank you
  showThankYou();
  showToast(i18n[currentLang]['toast-published'] || 'R\u00e9ponse publi\u00e9e \u2014 merci');
}

/* =============================================
   THANK YOU (after single answer)
   ============================================= */
function showThankYou() {
  hideAllQScreens();
  document.getElementById('q-thankyou').style.display = 'flex';
}

function backToPicker() {
  showQuestionPicker();
}

function goToCommunityFromQ() {
  const user = getStoredUser();
  if (user && user.registered) {
    setPhase('community');
    goToCommunity(user.name);
  }
}

/* =============================================
   REGISTRATION PHASE
   ============================================= */
function goToRegister() {
  buildRegisterReview();
  setPhase('register');
  updatePlaceholders();
  updateAnonPreview();
  populateCountrySelects();
  const nameInput = document.getElementById('reg-name');
  if (nameInput) {
    nameInput.addEventListener('input', updateAnonPreview);
  }
}

/* =============================================
   COUNTRY & PHONE SELECTORS
   ============================================= */
function populateCountrySelects() {
  // Phone country selector (flag only)
  const phoneSelect = document.getElementById('reg-phone-country');
  if (phoneSelect && phoneSelect.options.length <= 1) {
    phoneSelect.innerHTML = COUNTRIES.map(c => {
      if (c.code === '---') return `<option disabled>───</option>`;
      return `<option value="${c.code}" ${c.code === 'HT' ? 'selected' : ''}>${c.flag}</option>`;
    }).join('');
    updatePhoneCode();
  }

  // Country selector (flag + name)
  const countrySelect = document.getElementById('reg-country');
  if (countrySelect && countrySelect.options.length <= 1) {
    countrySelect.innerHTML = `<option value="" disabled>-- ${i18n[currentLang]['reg-country-ph'] || 'Choisir un pays'} --</option>` +
      COUNTRIES.map(c => {
        if (c.code === '---') return `<option disabled>───────────</option>`;
        return `<option value="${c.code}" ${c.code === 'HT' ? 'selected' : ''}>${c.flag}  ${c.name}</option>`;
      }).join('');
    // Trigger Haiti location by default
    onCountryChange();
  }
}

function updatePhoneCode() {
  const select = document.getElementById('reg-phone-country');
  const codeEl = document.getElementById('reg-phone-code');
  if (!select || !codeEl) return;
  const country = COUNTRIES.find(c => c.code === select.value);
  if (country) codeEl.textContent = country.phone;
}

function onCountryChange() {
  const countryCode = document.getElementById('reg-country').value;
  const haitiLoc = document.getElementById('haiti-location');
  const otherLoc = document.getElementById('other-location');

  if (countryCode === 'HT') {
    // Show department + commune dropdowns
    haitiLoc.style.display = 'block';
    otherLoc.style.display = 'none';
    // Make Haiti fields required, city not
    const deptEl = document.getElementById('reg-dept');
    const communeEl = document.getElementById('reg-commune');
    const cityEl = document.getElementById('reg-city');
    if (deptEl) deptEl.required = true;
    if (communeEl) communeEl.required = true;
    if (cityEl) cityEl.required = false;
    // Populate departments
    populateDepartments();
  } else {
    // Show free text city
    haitiLoc.style.display = 'none';
    otherLoc.style.display = 'block';
    const deptEl = document.getElementById('reg-dept');
    const communeEl = document.getElementById('reg-commune');
    const cityEl = document.getElementById('reg-city');
    if (deptEl) deptEl.required = false;
    if (communeEl) communeEl.required = false;
    if (cityEl) cityEl.required = true;
  }
}

function populateDepartments() {
  const el = document.getElementById('reg-dept');
  if (!el || el.options.length > 1) return;
  el.innerHTML = `<option value="">-- ${i18n[currentLang]['reg-dept-ph'] || 'Choisir un d\u00e9partement'} --</option>` +
    Object.keys(HAITI_COMMUNES).map(dept =>
      `<option value="${dept}">${dept}</option>`
    ).join('');
}

function onDeptChange() {
  const dept = document.getElementById('reg-dept').value;
  const communeEl = document.getElementById('reg-commune');
  if (!communeEl) return;

  if (!dept) {
    communeEl.innerHTML = '<option value="">--</option>';
    return;
  }

  const communes = HAITI_COMMUNES[dept] || [];
  communeEl.innerHTML = `<option value="">-- ${i18n[currentLang]['reg-commune-ph'] || 'Choisir une commune'} --</option>` +
    communes.map(c => `<option value="${c}">${c}</option>`).join('');
}

function buildRegisterReview() {
  const el = document.getElementById('register-review');
  if (!el) return;

  if (fullFormMode) {
    // Show all answered questions
    const answered = QUESTIONS.filter(q => currentDraft[q.id] && currentDraft[q.id].trim());
    if (answered.length > 0) {
      el.innerHTML = `
        <h4>${i18n[currentLang]['reg-review-h'] || 'Vos r\u00e9ponses'}</h4>
        ${answered.map(q => {
          const idx = QUESTIONS.indexOf(q);
          return `<div class="rr-item">
            <div class="rr-q">${String(idx + 1).padStart(2, '0')} \u00B7 ${i18n[currentLang][q.key]}</div>
            <div class="rr-a">${escapeHtml(currentDraft[q.id])}</div>
          </div>`;
        }).join('')}
      `;
    } else {
      el.innerHTML = '';
    }
  } else if (currentQuestionId && currentDraft[currentQuestionId]) {
    // Show only the single question
    const idx = QUESTIONS.findIndex(q => q.id === currentQuestionId);
    el.innerHTML = `
      <h4>${i18n[currentLang]['reg-review-h'] || 'Votre r\u00e9ponse'}</h4>
      <div class="rr-item">
        <div class="rr-q">${String(idx + 1).padStart(2, '0')} \u00B7 ${i18n[currentLang][QUESTIONS[idx].key]}</div>
        <div class="rr-a">${escapeHtml(currentDraft[currentQuestionId])}</div>
      </div>
    `;
  } else {
    el.innerHTML = '';
  }
}

function toggleAnon() {
  updateAnonPreview();
}

function updateAnonPreview() {
  const isAnon = document.getElementById('reg-anon');
  const nameInput = document.getElementById('reg-name');
  const previewName = document.getElementById('anon-preview-name');
  if (!previewName || !isAnon) return;

  if (isAnon.checked) {
    previewName.textContent = i18n[currentLang]['reg-anon-name'] || 'Anonyme';
  } else {
    const typed = nameInput ? nameInput.value.trim() : '';
    previewName.textContent = typed || '\u2014';
  }
}

/* Map HAITI_COMMUNES dept keys (capitalized FR names) to DEPARTMENTS[].id */
const HAITI_DEPT_NAME_TO_ID = {
  "Ouest": "ouest",
  "Nord": "nord",
  "Artibonite": "artibonite",
  "Sud": "sud",
  "Sud-Est": "sud-est",
  "Nord-Est": "nord-est",
  "Nord-Ouest": "nord-ouest",
  "Centre": "centre",
  "Grand'Anse": "grand-anse",
  "Grande'Anse": "grand-anse",
  "Nippes": "nippes"
};

async function handleRegister(e) {
  e.preventDefault();

  const name = document.getElementById('reg-name').value.trim();
  // Combine phone code + number
  const phoneCode = document.getElementById('reg-phone-code').textContent.trim();
  const phoneNum = document.getElementById('reg-phone').value.trim();
  const phone = phoneCode + phoneNum;
  const email = (document.getElementById('reg-email').value || '').trim();
  // Build address from country + city/commune + resolve department id
  const countryCode = document.getElementById('reg-country').value;
  const country = COUNTRIES.find(c => c.code === countryCode);
  const countryName = country ? country.name : '';
  let address = '';
  let department = null;
  if (countryCode === 'HT') {
    const commune = document.getElementById('reg-commune').value;
    const deptName = document.getElementById('reg-dept').value;
    address = commune + (deptName ? ', ' + deptName : '') + ', Ha\u00efti';
    department = HAITI_DEPT_NAME_TO_ID[deptName] || null;
  } else {
    const city = document.getElementById('reg-city').value.trim();
    address = city + (countryName ? ', ' + countryName : '');
    department = 'diaspora';
  }
  const password = document.getElementById('reg-password').value;
  const isAnon = document.getElementById('reg-anon').checked;

  // Save user (department stored explicitly so submission won't need to re-parse)
  const user = { name, phone, email, address, department, isAnon, registered: true };
  localStorage.setItem('rn_user', JSON.stringify(user));
  if (password) localStorage.setItem('rn_auth', btoa(phone.replace(/\s+/g, '') + ':' + password));

  // Save to Firestore
  if (typeof DB !== 'undefined' && db) {
    try { await DB.saveUser(user); } catch (e) { console.warn('User save error:', e.message); }
  }

  // Submit pending answer(s)
  if (fullFormMode) {
    await doSubmitFullForm(user);
  } else if (currentQuestionId && currentDraft[currentQuestionId]) {
    await doSubmitSingleAnswer(user);
  }

  // Go back to questionnaire phase (thank you screen is showing)
  setPhase('questionnaire');
  return false;
}

function handleLogin(e) {
  e.preventDefault();
  const phone = document.getElementById('login-phone').value.trim().replace(/\s+/g, '');
  const password = document.getElementById('login-password').value;
  const attempt = btoa(phone + ':' + password);
  const storedAuth = localStorage.getItem('rn_auth');

  // Check stored account
  if (storedAuth && storedAuth === attempt) {
    const user = JSON.parse(localStorage.getItem('rn_user') || '{}');
    hideLogin();
    setPhase('community');
    goToCommunity(user.name || 'Anonyme');
    return false;
  }

  // Check default account
  if (attempt === DEFAULT_AUTH) {
    localStorage.setItem('rn_user', JSON.stringify(DEFAULT_ACCOUNT));
    localStorage.setItem('rn_auth', DEFAULT_AUTH);
    hideLogin();
    setPhase('community');
    goToCommunity(DEFAULT_ACCOUNT.name);
    return false;
  }

  showToast(i18n[currentLang]['login-error'] || 'Num\u00e9ro ou mot de passe incorrect');
  return false;
}

/* =============================================
   HELPERS
   ============================================= */
function hideAllQScreens() {
  ['welcome-screen', 'q-picker', 'q-fullscreen', 'q-thankyou'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

function setPhase(phaseName) {
  document.querySelectorAll('.phase').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('phase-' + phaseName);
  if (target) {
    target.classList.add('active');
    window.scrollTo(0, 0);
  }
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function goToCommunity(userName) {
  setPhase('community');

  try {
    const initials = getInitials(userName);
    const initialsEl = document.getElementById('profile-initials');
    if (initialsEl) initialsEl.textContent = initials;
  } catch (e) { console.warn('Profile initials error:', e); }

  try { updateStats(); } catch (e) { console.warn('Stats error:', e); }
  try { buildActivityFeed(); } catch (e) { console.warn('Feed error:', e); }
  try { if (typeof buildQuestionButtons === 'function') buildQuestionButtons(); } catch (e) { console.warn('Question buttons error:', e); }
  try { buildTabs(); } catch (e) { console.warn('Tabs error:', e); }
  try { renderAnswers(); } catch (e) { console.warn('Answers error:', e); }
  try { if (typeof attachMapHandlers === 'function') attachMapHandlers(); } catch (e) {}
  try { if (typeof renderMap === 'function') renderMap(); } catch (e) {}
  try { updateDateStamp(); } catch (e) {}

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.12 });
  document.querySelectorAll('#phase-community .reveal').forEach(el => io.observe(el));
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
   SHARE
   ============================================= */
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

function shareSite() {
  const title = 'R\u00e9conciliation Nationale \u00B7 5 Questions';
  const text = i18n[currentLang]['about-p1'] || '';
  if (navigator.share) {
    navigator.share({ title, text, url: window.location.href }).catch(() => {});
  } else {
    shareCopyLink();
  }
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

  document.getElementById('profile-avatar').textContent = initials;
  document.getElementById('profile-display-name').textContent = user.name;

  const statusText = user.isAnon
    ? (i18n[lang]['profile-status-anon'] || 'Anonyme')
    : (i18n[lang]['profile-status-public'] || 'Nom visible');

  document.getElementById('profile-info').innerHTML = `
    <div class="profile-row">
      <span class="profile-row-label">${i18n[lang]['profile-name'] || 'Nom'}</span>
      <span class="profile-row-value">${escapeHtml(user.name)}</span>
    </div>
    <div class="profile-row">
      <span class="profile-row-label">${i18n[lang]['profile-phone'] || 'T\u00e9l\u00e9phone'}</span>
      <span class="profile-row-value">${escapeHtml(user.phone)}</span>
    </div>
    ${user.email ? `<div class="profile-row">
      <span class="profile-row-label">${i18n[lang]['profile-email'] || 'Email'}</span>
      <span class="profile-row-value">${escapeHtml(user.email)}</span>
    </div>` : ''}
    <div class="profile-row">
      <span class="profile-row-label">${i18n[lang]['profile-address'] || 'Lieu'}</span>
      <span class="profile-row-value">${escapeHtml(user.address)}</span>
    </div>
    <div class="profile-row">
      <span class="profile-row-label">${i18n[lang]['profile-status'] || 'Statut'}</span>
      <span class="profile-row-value">${statusText}</span>
    </div>
    <div class="profile-row">
      <span class="profile-row-label">${i18n[lang]['profile-answered'] || 'R\u00e9pondu'}</span>
      <span class="profile-row-value">${answeredQuestions.length} / 5</span>
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
  localStorage.removeItem('rn_answered');
  answeredQuestions = [];
  fullFormMode = false;
  currentQuestionId = null;
  currentDraft = { q1: '', q2: '', q3: '', q4: '', q5: '', name: '', where: '' };
  hideProfile();
  hideAllQScreens();
  setPhase('questionnaire');
  document.getElementById('welcome-screen').style.display = 'flex';
  initWelcome();
  window.scrollTo(0, 0);
}

function updatePlaceholders() {
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    if (i18n[currentLang][key]) el.placeholder = i18n[currentLang][key];
  });
}

/* =============================================
   LEGACY STUBS
   ============================================= */
function buildQuestionCards() {}
function buildQuestionnaireSlides() {}
function buildFullscreenSlides() {}
function showStepFS() {}
