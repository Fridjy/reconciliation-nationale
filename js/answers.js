/* =============================================
   QUESTION BUTTONS (home page)
   ============================================= */

function buildQuestionButtons() {
  const el = document.getElementById('qb-grid');
  if (!el) return;

  // Count how many people answered each question (1 per person)
  const counts = {};
  QUESTIONS.forEach(q => {
    counts[q.id] = answers.filter(a => {
      const val = a[q.id];
      if (!val) return false;
      const text = typeof val === 'object' ? (val[currentLang] || val.ht || '') : val;
      return text.trim().length > 0;
    }).length;
  });

  el.innerHTML = QUESTIONS.map((q, i) => `
    <a class="qb-btn" onclick="showQuestionAnswers('${q.id}')">
      <span class="qb-num">${i + 1}</span>
      <span class="qb-text">${i18n[currentLang][q.key]}</span>
      <span class="qb-count">${counts[q.id].toLocaleString()} ${i18n[currentLang]['s-ans'].toLowerCase()}</span>
      <span class="qb-arrow">\u2192</span>
    </a>
  `).join('');
}

function showQuestionAnswers(qId) {
  currentTab = qId;
  currentPage = 1;
  lastDocCursor = null;
  document.getElementById('questions-buttons').style.display = 'none';
  document.getElementById('answers').style.display = 'block';
  renderAnswers();
  document.getElementById('answers').scrollIntoView({ behavior: 'smooth' });
}

function hideAnswers() {
  document.getElementById('answers').style.display = 'none';
  document.getElementById('questions-buttons').style.display = 'block';
  document.getElementById('questions-buttons').scrollIntoView({ behavior: 'smooth' });
}

/* =============================================
   FILTER TOOLBAR
   ============================================= */

function buildFilterToolbar() {
  const container = document.getElementById('answers-toolbar');
  if (!container) return;

  container.innerHTML = `
    <div class="toolbar-row">
      <div class="toolbar-group">
        <select id="sort-select" onchange="onSortChange()" class="toolbar-select">
          <option value="votes" ${sortBy === 'votes' ? 'selected' : ''}>${i18n[currentLang]['sort-votes'] || 'Plis sipò'}</option>
          <option value="newest" ${sortBy === 'newest' ? 'selected' : ''}>${i18n[currentLang]['sort-newest'] || 'Pi resan'}</option>
          <option value="oldest" ${sortBy === 'oldest' ? 'selected' : ''}>${i18n[currentLang]['sort-oldest'] || 'Pi ansyen'}</option>
        </select>
        <select id="dept-filter" onchange="onDeptFilterChange()" class="toolbar-select">
          <option value="">${i18n[currentLang]['filter-all-dept'] || 'Tout depatman'}</option>
          ${DEPARTMENTS.map(d => `<option value="${d.id}" ${filterDept === d.id ? 'selected' : ''}>${d.name[currentLang]}</option>`).join('')}
        </select>
      </div>
      <div class="toolbar-search">
        <input type="text" id="search-input" placeholder="${i18n[currentLang]['search-ph'] || 'Chèche...'}" value="${searchQuery}" oninput="onSearchInput(this.value)">
      </div>
    </div>
  `;
}

function onSortChange() {
  sortBy = document.getElementById('sort-select').value;
  currentPage = 1;
  lastDocCursor = null;
  renderAnswers();
}

function onDeptFilterChange() {
  filterDept = document.getElementById('dept-filter').value || null;
  currentPage = 1;
  lastDocCursor = null;
  renderAnswers();
}

let searchTimeout = null;
function onSearchInput(val) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    searchQuery = val.trim();
    currentPage = 1;
    lastDocCursor = null;
    renderAnswers();
  }, 300);
}

/* =============================================
   ANSWERS — Render with pagination
   ============================================= */

function buildTabs() {
  // Tabs replaced by question buttons — stub for compatibility
}

async function renderAnswers() {
  const qIdx = QUESTIONS.findIndex(q => q.id === currentTab);
  document.getElementById('current-q-display').innerHTML = `
    <div class="cq-kicker">${String(qIdx + 1).padStart(2, '0')} / 05</div>
    <h4>${i18n[currentLang][QUESTIONS[qIdx].key]}</h4>
  `;

  buildFilterToolbar();

  const el = document.getElementById('answers-grid');
  el.innerHTML = `<div class="answer-card" style="grid-column:1/-1;text-align:center;padding:40px 20px;">
    <p style="font-style:italic;opacity:0.5;">${i18n[currentLang]['loading'] || 'Ap chaje...'}</p>
  </div>`;

  let list;

  // Try Firestore first, fallback to local array
  if (typeof DB !== 'undefined' && typeof db !== 'undefined') {
    try {
      const result = await DB.fetchAnswers(currentTab, {
        sortBy, page: currentPage, filterDept, searchQuery, lastDoc: lastDocCursor
      });
      list = result.answers;
      lastDocCursor = result.lastDoc;
      renderAnswerCards(el, list, qIdx, result.hasMore);
      return;
    } catch (e) {
      console.warn('Firestore unavailable, using local data:', e.message);
    }
  }

  // Fallback: local array (works without Firebase)
  list = answers
    .filter(a => {
      const val = a[currentTab];
      if (!val) return false;
      const text = typeof val === 'object' ? (val[currentLang] || val.ht || '') : val;
      if (!text.trim()) return false;
      // Department filter
      if (filterDept && typeof matchDepartment === 'function') {
        if (matchDepartment(a.where) !== filterDept) return false;
      }
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!text.toLowerCase().includes(q) && !(a.name || '').toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'votes') return (b.votes[currentTab] || 0) - (a.votes[currentTab] || 0);
      if (sortBy === 'newest') return (b.id || 0) - (a.id || 0);
      return (a.id || 0) - (b.id || 0);
    });

  // Paginate locally (PAGE_SIZE answers per page)
  const PAGE_SIZE = 3;
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageList = list.slice(start, start + PAGE_SIZE);
  const hasMore = list.length > start + PAGE_SIZE;
  const totalPages = Math.ceil(list.length / PAGE_SIZE);

  renderAnswerCards(el, pageList, qIdx, hasMore, totalPages);
}

function renderAnswerCards(el, list, qIdx, hasMore, totalPages) {
  if (list.length === 0) {
    el.innerHTML = `<div class="answer-card" style="grid-column:1/-1;text-align:center;padding:60px 20px;">
      <p style="font-style:italic;font-size:18px;margin-bottom:20px;">${i18n[currentLang]['no-answers']}</p>
    </div>`;
    return;
  }

  let html = list.map(a => {
    const answerText = typeof a[currentTab] === 'object'
      ? (a[currentTab][currentLang] || a[currentTab].ht)
      : a[currentTab];
    const voteKey = (a.id || a.name) + ':' + currentTab;
    const voted = userVotes.has(voteKey);
    const voteCount = (a.votes && a.votes[currentTab]) || 0;
    const comments = (a.comments && a.comments[currentTab]) || [];
    const aId = a.id || 0;

    return `
      <article class="answer-card">
        <div class="answer-meta">
          <span class="who-tag">${escapeHtml(a.name)}</span>
          <span>\u00B7 ${escapeHtml(a.where)}</span>
        </div>
        <div class="answer-text">${escapeHtml(answerText)}</div>
        <div class="answer-actions">
          <button class="vote-inline ${voted ? 'voted' : ''}" onclick="voteAnswer('${aId}', '${currentTab}')">
            <span class="arrow">\u25B2</span>
            <span>${voteCount} ${i18n[currentLang]['vote-label']}</span>
          </button>
          <button class="comment-toggle" onclick="toggleAnswerComments('${aId}', '${currentTab}')">${i18n[currentLang]['comments-label']} (${comments.length})</button>
        </div>
        <div class="answer-discussion" id="ad-${aId}-${currentTab}">
          ${comments.map(c => {
            const ct = typeof c.text === 'object' ? (c.text[currentLang] || c.text.ht) : c.text;
            return `<div class="ad-comment"><div class="who">${escapeHtml(c.who)}</div>${escapeHtml(ct)}</div>`;
          }).join('')}
          <div class="ad-form">
            <input type="text" id="ad-in-${aId}-${currentTab}" placeholder="${i18n[currentLang]['comment-ph']}">
            <button onclick="addAnswerComment('${aId}', '${currentTab}')">${i18n[currentLang]['comment-send']}</button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Pagination controls with numbered buttons: ← 1 2 3 ... 12 →
  if (totalPages && totalPages > 1) {
    html += `<div class="pagination" style="grid-column:1/-1;">
      <div class="pagination-inner">
        ${currentPage > 1
          ? `<button class="pg-arrow" onclick="goPage(${currentPage - 1})">\u2190</button>`
          : `<span class="pg-arrow pg-disabled">\u2190</span>`}
        ${buildPageNumbers(currentPage, totalPages)}
        ${currentPage < totalPages
          ? `<button class="pg-arrow" onclick="goPage(${currentPage + 1})">\u2192</button>`
          : `<span class="pg-arrow pg-disabled">\u2192</span>`}
      </div>
    </div>`;
  }

  el.innerHTML = html;
}

function goPage(page) {
  if (page < 1) return;
  currentPage = page;
  if (page === 1) lastDocCursor = null;
  renderAnswers();
  document.getElementById('answers').scrollIntoView({ behavior: 'smooth' });
}

// Build numbered page buttons: 1 2 3 ... 8 9 10
function buildPageNumbers(current, total) {
  const pages = [];
  const maxVisible = 7; // max buttons to show

  if (total <= maxVisible) {
    // Show all pages: 1 2 3 4 5 6 7
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    // Always show first page
    pages.push(1);

    if (current > 3) pages.push('...');

    // Pages around current
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (current < total - 2) pages.push('...');

    // Always show last page
    pages.push(total);
  }

  return pages.map(p => {
    if (p === '...') {
      return `<span class="pg-dots">\u2026</span>`;
    }
    if (p === current) {
      return `<button class="pg-num pg-active">${p}</button>`;
    }
    return `<button class="pg-num" onclick="goPage(${p})">${p}</button>`;
  }).join('');
}

/* =============================================
   VOTING & COMMENTS
   ============================================= */

async function voteAnswer(answerId, qId) {
  const key = answerId + ':' + qId;
  const delta = userVotes.has(key) ? -1 : 1;

  if (delta === -1) {
    userVotes.delete(key);
  } else {
    userVotes.add(key);
    showToast(i18n[currentLang]['toast-voted']);
  }

  // Persist votes in localStorage
  localStorage.setItem('rn_votes', JSON.stringify([...userVotes]));

  // Try Firestore
  if (typeof DB !== 'undefined' && typeof db !== 'undefined') {
    try {
      await DB.vote(answerId, qId, delta);
    } catch (e) {
      console.warn('Vote Firestore error:', e.message);
    }
  }

  // Also update local array if present
  const local = answers.find(x => String(x.id) === String(answerId));
  if (local) {
    local.votes[qId] = Math.max(0, (local.votes[qId] || 0) + delta);
  }

  renderAnswers();
}

function toggleAnswerComments(answerId, qId) {
  const el = document.getElementById(`ad-${answerId}-${qId}`);
  if (el) el.classList.toggle('open');
}

async function addAnswerComment(answerId, qId) {
  const input = document.getElementById(`ad-in-${answerId}-${qId}`);
  const val = input.value.trim();
  if (!val) return;

  const user = getStoredUser();
  const comment = {
    who: (user ? user.name : 'Anonim') + ' \u00B7 ' + new Date().toLocaleDateString(),
    text: val
  };

  // Try Firestore
  if (typeof DB !== 'undefined' && typeof db !== 'undefined') {
    try {
      await DB.addComment(answerId, qId, comment);
    } catch (e) {
      console.warn('Comment Firestore error:', e.message);
    }
  }

  // Also update local
  const local = answers.find(x => String(x.id) === String(answerId));
  if (local) {
    if (!local.comments[qId]) local.comments[qId] = [];
    local.comments[qId].push(comment);
  }

  input.value = '';
  renderAnswers();
  setTimeout(() => {
    const d = document.getElementById(`ad-${answerId}-${qId}`);
    if (d) d.classList.add('open');
  }, 10);
  showToast(i18n[currentLang]['toast-comment']);
}
