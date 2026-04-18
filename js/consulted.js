/* =============================================
   CONSULTED PAGE — Dynamic rendering with
   categories, search, and load-more pagination
   ============================================= */

let consultedCategory = null;
let consultedType = null;
let consultedSearch = '';
let consultedLastDoc = null;
let consultedItems = [];

async function initConsultedPage() {
  buildConsultedFilters();
  await loadConsulted(true);
}

async function buildConsultedFilters() {
  const bar = document.getElementById('consulted-filters');
  if (!bar) return;

  let types = [];

  // Try Firestore
  if (typeof DB !== 'undefined' && typeof db !== 'undefined') {
    try {
      types = await DB.fetchConsultedTypes();
    } catch (e) {
      types = ['Sosyete sivil', 'Inivèsite', 'Medya', 'Dyaspora', 'Relijyon', 'Dwa moun', 'ONG', 'Sektè prive'];
    }
  } else {
    types = ['Sosyete sivil', 'Inivèsite', 'Medya', 'Dyaspora', 'Relijyon', 'Dwa moun', 'ONG', 'Sektè prive'];
  }

  bar.innerHTML = `
    <div class="toolbar-row">
      <div class="consulted-tabs" id="consulted-tabs">
        <button class="c-tab ${!consultedCategory ? 'active' : ''}" onclick="filterConsulted(null, null)">Tout</button>
        <button class="c-tab ${consultedCategory === 'institution' ? 'active' : ''}" onclick="filterConsulted('institution', null)">${i18n[currentLang]['cat-institution'] || 'Enstitisyon'}</button>
        <button class="c-tab ${consultedCategory === 'personality' ? 'active' : ''}" onclick="filterConsulted('personality', null)">${i18n[currentLang]['cat-personality'] || 'Pèsonalite'}</button>
      </div>
      <div class="toolbar-search">
        <input type="text" id="consulted-search" placeholder="${i18n[currentLang]['search-ph'] || 'Chèche...'}" value="${consultedSearch}" oninput="onConsultedSearch(this.value)">
      </div>
    </div>
    <div class="consulted-type-bar" id="consulted-type-bar">
      <button class="ct-chip ${!consultedType ? 'active' : ''}" onclick="filterConsultedType(null)">Tout</button>
      ${types.map(t => `<button class="ct-chip ${consultedType === t ? 'active' : ''}" onclick="filterConsultedType('${t}')">${t}</button>`).join('')}
    </div>
  `;
}

function filterConsulted(category, type) {
  consultedCategory = category;
  consultedType = type;
  consultedLastDoc = null;
  consultedItems = [];
  buildConsultedFilters();
  loadConsulted(true);
}

function filterConsultedType(type) {
  consultedType = type;
  consultedLastDoc = null;
  consultedItems = [];
  buildConsultedFilters();
  loadConsulted(true);
}

let consultedSearchTimeout = null;
function onConsultedSearch(val) {
  clearTimeout(consultedSearchTimeout);
  consultedSearchTimeout = setTimeout(() => {
    consultedSearch = val.trim();
    consultedLastDoc = null;
    consultedItems = [];
    loadConsulted(true);
  }, 300);
}

async function loadConsulted(reset) {
  const grid = document.getElementById('consulted-grid');
  if (!grid) return;

  if (reset) {
    grid.innerHTML = `<div class="consult-card" style="grid-column:1/-1;text-align:center;padding:40px;">
      <p style="font-style:italic;opacity:0.5;">${i18n[currentLang]['loading'] || 'Ap chaje...'}</p>
    </div>`;
  }

  let items = [];
  let hasMore = false;

  // Try Firestore
  if (typeof DB !== 'undefined' && typeof db !== 'undefined') {
    try {
      const result = await DB.fetchConsulted({
        category: consultedCategory,
        type: consultedType,
        search: consultedSearch,
        lastDoc: consultedLastDoc
      });
      items = result.items;
      hasMore = result.hasMore;
      consultedLastDoc = result.lastDoc;
    } catch (e) {
      console.warn('Consulted Firestore error:', e.message);
      items = [];
    }
  }

  // Fallback: use hardcoded items from page (if Firestore empty or unavailable)
  if (items.length === 0 && reset && typeof CONSULTED_SEED !== 'undefined') {
    items = CONSULTED_SEED.filter(o => {
      if (consultedCategory && o.category !== consultedCategory) return false;
      if (consultedType && o.type !== consultedType) return false;
      if (consultedSearch && !o.name.toLowerCase().includes(consultedSearch.toLowerCase())) return false;
      return true;
    });
  }

  if (reset) consultedItems = items;
  else consultedItems = consultedItems.concat(items);

  renderConsultedCards(grid, consultedItems, hasMore);
}

function renderConsultedCards(grid, items, hasMore) {
  if (items.length === 0) {
    grid.innerHTML = `<div class="consult-card" style="grid-column:1/-1;text-align:center;padding:60px;">
      <p style="font-style:italic;font-size:17px;">${i18n[currentLang]['no-results'] || 'Pa gen rezilta.'}</p>
    </div>`;
    return;
  }

  const lang = currentLang;
  let html = items.map(o => {
    const desc = typeof o.description === 'object'
      ? (o.description[lang] || o.description.ht || '')
      : (o.description || '');

    // PERSONALITY card
    if (o.category === 'personality') {
      return `
        <div class="person-card">
          <div class="person-top">
            <div class="person-role">${escapeHtml(o.role || o.type || '')}</div>
            <div class="person-name">${escapeHtml(o.name)}</div>
            ${o.expertise ? `<div class="person-expertise">${escapeHtml(o.expertise)}</div>` : ''}
          </div>
          <div class="person-body">
            <p class="card-desc">${escapeHtml(desc)}</p>
            <span class="card-location">${escapeHtml(o.location || '')}</span>
          </div>
        </div>
      `;
    }

    // INSTITUTION card (with logo)
    const logoHtml = o.logo
      ? `<img src="${escapeHtml(o.logo)}" alt="${escapeHtml(o.name)}">`
      : `<span class="card-logo-placeholder">${escapeHtml(o.logoInitials || o.name.slice(0, 2).toUpperCase())}</span>`;

    const websiteHtml = o.website
      ? `<div class="card-website"><a href="${escapeHtml(o.website)}" target="_blank" rel="noopener">${o.website.replace(/^https?:\/\//, '')}</a></div>`
      : '';

    return `
      <div class="consult-card">
        <div class="card-header">
          <div class="card-logo">${logoHtml}</div>
          <div class="card-header-text">
            <span class="card-type">${escapeHtml(o.type || '')}</span>
            <h4>${escapeHtml(o.name)}</h4>
          </div>
        </div>
        <p class="card-desc">${escapeHtml(desc)}</p>
        ${websiteHtml}
        <span class="card-location">${escapeHtml(o.location || '')}</span>
      </div>
    `;
  }).join('');

  if (hasMore) {
    html += `<div style="grid-column:1/-1;text-align:center;padding:24px;">
      <button class="btn-ghost" onclick="loadConsulted(false)">${i18n[currentLang]['load-more'] || 'Wè plis \u2192'}</button>
    </div>`;
  }

  // Show count
  html = `<div style="grid-column:1/-1;padding:0 0 8px;">
    <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(10,8,6,0.5);">${items.length} ${i18n[currentLang]['results'] || 'rezilta'}</span>
  </div>` + html;

  grid.innerHTML = html;
}
