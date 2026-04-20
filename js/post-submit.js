/* =============================================
   POST-SUBMISSION ENHANCEMENT
   Watches #q-thankyou. When shown, replaces the visible content
   with: (1) emotional red hero, (2) shareable Vox card,
   (3) regional pride leaderboard.
   Original markup (h2/p/actions) is kept in DOM so existing
   onclick handlers still work — only hidden visually.
   ============================================= */

(function postSubmitInit() {

  /* i18n helper (same fallback chain as modern.js) */
  function t(key) {
    try {
      const lang = (typeof currentLang === 'string') ? currentLang : 'fr';
      if (typeof i18n !== 'undefined' && i18n[lang] && i18n[lang][key]) return i18n[lang][key];
      if (typeof i18n !== 'undefined' && i18n.fr && i18n.fr[key]) return i18n.fr[key];
    } catch (e) {}
    return key;
  }

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  /* Site URL (sharing) */
  const SITE_URL = 'https://reconciliation-nationale.web.app';

  /* =============================================
     CANVAS IMAGE GENERATION
     Produces a 1080x1350 PNG of the vox card, drawn natively
     (no external libraries). Used for Save + native Share.
     ============================================= */
  async function generateCardImage(data) {
    // Ensure webfonts are loaded before measuring/drawing text
    try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}

    const W = 1080, H = 1350;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    const RED       = '#D21034';
    const BLUE      = '#00209F';
    const GOLD      = '#F5C518';
    const NIGHT     = '#0A0A14';
    const WHITE     = '#F7F5EE';
    const MUTED     = 'rgba(247,245,238,0.55)';
    const HAIRLINE  = 'rgba(247,245,238,0.12)';

    /* ---------- RED HERO (top 62%) ---------- */
    const RED_H = Math.round(H * 0.62);           // ~837px
    ctx.fillStyle = RED;
    ctx.fillRect(0, 0, W, RED_H);

    // Diagonal hatching overlay
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.045)';
    ctx.lineWidth = 1;
    for (let x = -RED_H; x < W + RED_H; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + RED_H, RED_H);
      ctx.stroke();
    }
    ctx.restore();

    // Flag mark (3 vertical bars) — top left
    const fmX = 72, fmY = 88, barH = 44;
    ctx.fillStyle = BLUE;  roundRect(ctx, fmX,       fmY, 10, barH, 3); ctx.fill();
    ctx.fillStyle = RED;   roundRect(ctx, fmX + 16,  fmY, 10, barH, 3); ctx.fill();
    ctx.fillStyle = GOLD;  roundRect(ctx, fmX + 32,  fmY,  7, barH, 3); ctx.fill();

    // Brand line
    ctx.fillStyle = WHITE;
    ctx.font = '600 22px "DM Mono", "IBM Plex Mono", ui-monospace, monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    const brandTxt = `${t('ty-vox-brand')} #${formatNum(data.voiceN)}`;
    ctx.fillText(brandTxt, fmX + 56, fmY + barH / 2);

    // Quote — centered vertically in the remaining red space
    const quoteX = 72;
    const quoteW = W - 144;
    const quoteText = data.quote && data.quote.trim()
      ? '\u00AB\u00A0' + data.quote + '\u00A0\u00BB'
      : '\u00AB\u00A0' + t('ty-img-quote-placeholder') + '\u00A0\u00BB';

    ctx.fillStyle = WHITE;
    ctx.font = 'italic 400 56px "Playfair Display", "Fraunces", Georgia, serif';
    const lineHeight = 72;
    const lines = wrapText(ctx, quoteText, quoteW);
    const maxLines = 8;
    const shown = lines.slice(0, maxLines);
    if (lines.length > maxLines) {
      shown[maxLines - 1] = shown[maxLines - 1].replace(/[\s\u00A0]+\u00BB\s*$/, '').replace(/[\s\u00A0]+$/, '') + '\u2026\u00A0\u00BB';
    }
    const quoteBlockH = shown.length * lineHeight;
    const quoteTop = Math.max(fmY + barH + 60, (RED_H - quoteBlockH) / 2 + 20);
    ctx.textBaseline = 'alphabetic';
    shown.forEach((line, i) => {
      ctx.fillText(line, quoteX, quoteTop + (i + 1) * lineHeight - 18);
    });

    /* ---------- FLAG DIVIDER (3px-ish stripe) ---------- */
    const fdY = RED_H;
    const stripeH = 5;
    const unit = W / 7; // ratio 3:3:1
    ctx.fillStyle = BLUE;  ctx.fillRect(0,          fdY, unit * 3, stripeH);
    ctx.fillStyle = RED;   ctx.fillRect(unit * 3,   fdY, unit * 3, stripeH);
    ctx.fillStyle = GOLD;  ctx.fillRect(unit * 6,   fdY, unit * 1, stripeH);

    /* ---------- DARK BOTTOM ---------- */
    const DARK_Y = RED_H + stripeH;
    ctx.fillStyle = NIGHT;
    ctx.fillRect(0, DARK_Y, W, H - DARK_Y);

    // VWA / VOIX / VOICE label (top of dark)
    ctx.fillStyle = GOLD;
    ctx.font = '600 22px "DM Mono", "IBM Plex Mono", ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(t('ty-img-voice-label'), 72, DARK_Y + 70);

    // Huge voice number
    ctx.fillStyle = WHITE;
    ctx.font = '700 200px "Space Grotesk", system-ui, sans-serif';
    ctx.textAlign = 'left';
    const voiceStr = '#' + formatNum(data.voiceN);
    ctx.fillText(voiceStr, 72, DARK_Y + 240);

    // Name + where (below the number)
    ctx.fillStyle = WHITE;
    ctx.font = '600 30px "Space Grotesk", system-ui, sans-serif';
    const nameY = DARK_Y + 310;
    ctx.fillText(data.name, 72, nameY);

    if (data.where) {
      ctx.fillStyle = MUTED;
      ctx.font = '500 20px "DM Mono", "IBM Plex Mono", ui-monospace, monospace';
      ctx.fillText(data.where, 72, nameY + 34);
    }

    // Thin hairline above the footer
    ctx.strokeStyle = HAIRLINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(72, H - 96);
    ctx.lineTo(W - 72, H - 96);
    ctx.stroke();

    // URL at bottom
    ctx.fillStyle = GOLD;
    ctx.font = '600 22px "DM Mono", "IBM Plex Mono", ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('reconciliation-nationale.ht', 72, H - 56);

    // Tagline right
    ctx.fillStyle = MUTED;
    ctx.font = '500 18px "DM Mono", "IBM Plex Mono", ui-monospace, monospace';
    ctx.textAlign = 'right';
    ctx.fillText('5 kesyon \u00b7 5 repons \u00b7 yon peyi', W - 72, H - 56);

    // Export
    return await new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/png', 0.95));
  }

  function wrapText(ctx, text, maxWidth) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  /* ---------- Save + Share helpers ---------- */
  async function saveBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
  }

  async function shareBlob(blob, filename, caption) {
    // Web Share API with files (mobile Safari 15+, Chrome Android)
    try {
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: caption, url: SITE_URL });
        return 'shared';
      }
    } catch (e) {
      // user-cancelled → no-op
      if (e && e.name === 'AbortError') return 'cancelled';
    }
    // Fallback: download, then open wa.me with caption
    await saveBlob(blob, filename);
    const waUrl = 'https://wa.me/?text=' + encodeURIComponent(caption);
    try { window.open(waUrl, '_blank', 'noopener'); } catch (e) {}
    return 'downloaded';
  }

  function buildCardData() {
    const user   = (typeof getStoredUser === 'function') ? getStoredUser() : null;
    const name   = (user && !user.isAnon && user.name) ? user.name : t('ty-region-anon');
    const where  = (user && user.address) ? user.address : '';
    const voiceN = currentVoiceNumber();
    const quote  = getLastAnswerText();
    return { name, where, voiceN, quote };
  }

  function fileStem(voiceN) {
    return 'reconciliation-nationale-vox-' + voiceN + '.png';
  }

  /* Static dept rankings for the regional pride block
     (matches MOBILIZATION.departments shape in modern.js) */
  const DEPT_LEADERBOARD = [
    { id: 'ouest',      label: { ht: 'Lw\u00e8s',       fr: 'Ouest',      en: 'West' },       count: 3840 },
    { id: 'sud',        label: { ht: 'Sid',             fr: 'Sud',        en: 'South' },      count: 1922 },
    { id: 'artibonite', label: { ht: 'Latibonit',       fr: 'Artibonite', en: 'Artibonite' }, count: 1506 },
    { id: 'nord',       label: { ht: 'N\u00f2',         fr: 'Nord',       en: 'North' },      count: 1284 },
    { id: 'centre',     label: { ht: 'Sant',            fr: 'Centre',     en: 'Center' },     count:  988 },
    { id: 'grand-anse', label: { ht: 'Grandans',        fr: 'Grand\u2019Anse', en: 'Grand\u2019Anse' }, count: 740 },
    { id: 'nord-est',   label: { ht: 'N\u00f2-\u00c8s', fr: 'Nord-Est',   en: 'North-East' }, count:  620 },
    { id: 'nord-ouest', label: { ht: 'N\u00f2-Lw\u00e8s', fr: 'Nord-Ouest', en: 'North-West' }, count: 555 },
    { id: 'nippes',     label: { ht: 'Nip',             fr: 'Nippes',     en: 'Nippes' },     count:  488 },
    { id: 'sud-est',    label: { ht: 'Sid-\u00c8s',     fr: 'Sud-Est',    en: 'South-East' }, count:  433 }
  ];

  /* Fallback in case matchDepartment / user address can't resolve */
  function resolveUserDept() {
    const u = (typeof getStoredUser === 'function') ? getStoredUser() : null;
    if (!u) return null;
    const addr = u.address || '';
    let id = null;
    if (typeof matchDepartment === 'function') id = matchDepartment(addr);
    if (!id) {
      // Fallback: scan leaderboard labels
      const lower = addr.toLowerCase();
      for (const d of DEPT_LEADERBOARD) {
        const labels = Object.values(d.label).map(s => s.toLowerCase());
        if (labels.some(l => lower.includes(l))) { id = d.id; break; }
      }
    }
    return id;
  }

  function findDept(id) {
    return DEPT_LEADERBOARD.find(d => d.id === id) || null;
  }

  /* Get user's submitted answer. After submitSingleAnswer() runs:
     - answers[0] is the latest entry (unshift-ed)
     - currentQuestionId is the question they answered
     - The text lives at answers[0][currentQuestionId] */
  function getLastAnswerText() {
    try {
      if (typeof answers !== 'undefined' && Array.isArray(answers) && answers.length) {
        const q = (typeof currentQuestionId === 'string') ? currentQuestionId : null;
        const entry = answers[0];
        if (q && entry && typeof entry[q] === 'string' && entry[q].trim()) return entry[q];
        for (const qid of ['q1','q2','q3','q4','q5']) {
          if (entry && typeof entry[qid] === 'string' && entry[qid].trim()) return entry[qid];
        }
      }
    } catch (e) {}
    return '';
  }

  function currentVoiceNumber() {
    // Read from any [data-count-sync] element; fall back to a sensible floor
    const el = document.querySelector('[data-count-sync]');
    if (el) {
      const n = parseInt(String(el.textContent).replace(/[^\d]/g, ''), 10);
      if (isFinite(n) && n > 0) return n;
    }
    return 12840;
  }

  function formatNum(n) {
    return Number(n).toLocaleString((typeof currentLang === 'string' && currentLang === 'en') ? 'en-US' : 'fr-FR');
  }

  /* =============================================
     BUILD — the enhanced thank-you layout
     ============================================= */
  function build(container) {
    const user       = (typeof getStoredUser === 'function') ? getStoredUser() : null;
    const rawName    = user && !user.isAnon ? user.name : '';
    const displayName = rawName || t('ty-region-anon');
    const where      = (user && user.address) || '';
    const deptId     = resolveUserDept();
    const deptData   = findDept(deptId);
    const deptLabel  = deptData ? (deptData.label[currentLang] || deptData.label.fr || deptData.label.ht) : '';
    const voiceN     = currentVoiceNumber();
    const answerText = getLastAnswerText();
    const trimmedAnswer = answerText.length > 120 ? answerText.slice(0, 117).trimEnd() + '\u2026' : answerText;

    /* Regional ranking: sort desc by count, find user's position */
    const sorted = DEPT_LEADERBOARD.slice().sort((a, b) => b.count - a.count);
    const myRank = deptId ? (sorted.findIndex(d => d.id === deptId) + 1) : 0;

    /* Top 5 for display; if user's dept isn't in top 5, append it as 6th row */
    const topN = sorted.slice(0, 5);
    const inTop = deptId ? topN.some(d => d.id === deptId) : false;
    const rows  = inTop || !deptId ? topN : topN.concat([sorted.find(d => d.id === deptId)]);
    const maxCount = sorted[0].count;

    /* Share messages */
    const waMsg  = t('ty-wa-message');
    const waMsgRegion = `${t('ty-region-cta-prefix')} ${deptLabel || t('ty-region-anon')} ${t('ty-region-cta-suffix')} \uD83D\uDC49 ${SITE_URL}`;
    const waHref = 'https://wa.me/?text=' + encodeURIComponent(waMsg);
    const waHrefRegion = 'https://wa.me/?text=' + encodeURIComponent(waMsgRegion);

    /* Build the new inner wrapper */
    const wrap = document.createElement('div');
    wrap.className = 'q-thankyou-inner ps-inner';
    wrap.innerHTML = `
      <!-- HERO (red) -->
      <section class="ps-hero">
        <svg class="ps-check" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle class="ps-check-circle" cx="40" cy="40" r="36"/>
          <polyline class="ps-check-tick" points="24,42 36,54 58,30"/>
        </svg>
        <div class="ps-voice-num">#${formatNum(voiceN)}</div>
        <p class="ps-voice-caption">
          <span data-i18n="ty-voice-prefix">${t('ty-voice-prefix')}</span>
          #${formatNum(voiceN)}
          <span data-i18n="ty-voice-suffix">${t('ty-voice-suffix')}</span>
        </p>
        <div class="ps-live">
          <span class="ps-live-label">
            <span class="live-dot live-dot--gold"></span>
            <span data-i18n="ty-live-label">${t('ty-live-label')}</span>
          </span>
          <div class="ps-live-row">
            <span class="ps-live-num" data-count-sync>${formatNum(voiceN)}</span>
          </div>
        </div>
        <div class="ps-ctas">
          <button type="button" class="ps-cta-primary" data-ps-see-mirror>
            <span data-i18n="ty-see-mirror">${t('ty-see-mirror')}</span>
          </button>
          <button type="button" class="ps-cta-ghost" data-ps-share-voice data-i18n="ty-share-voice">${t('ty-share-voice')}</button>
        </div>
      </section>

      <!-- Flag divider -->
      <div class="flag-divider" aria-hidden="true">
        <span class="fd-blue"></span><span class="fd-red"></span><span class="fd-gold"></span>
      </div>

      <!-- VOX CARD -->
      <section class="ps-dark">
        <div class="vox-card-wrap">
          <div class="vox-card">
            <div class="vox-card-red">
              <div class="vox-card-meta">
                <span class="flag-mark" aria-hidden="true"><span class="fm-blue"></span><span class="fm-red"></span><span class="fm-gold"></span></span>
                <span><span data-i18n="ty-vox-brand">${t('ty-vox-brand')}</span> #${formatNum(voiceN)}</span>
              </div>
              <div class="vox-card-quote">${esc(trimmedAnswer) || '\u2014'}</div>
            </div>
            <div class="vox-card-strip">
              <span class="vox-card-who">
                <span class="vc-name">${esc(displayName)}</span>
                ${where ? `<span class="vc-where"> \u00b7 ${esc(where)}</span>` : ''}
              </span>
              <span class="vox-card-url">reconciliation-nationale.ht</span>
            </div>
          </div>
        </div>

        <div class="vox-share-list" id="ps-share-list">
          <button type="button" class="vox-share-row vsr-save-img" data-ps-save-img>
            <span class="vsr-icon">\u21E9</span>
            <span class="vsr-body">
              <div class="vsr-name" data-i18n="ty-save-img-name">${t('ty-save-img-name')}</div>
              <div class="vsr-sub" data-i18n="ty-save-img-sub">${t('ty-save-img-sub')}</div>
            </span>
            <span class="vsr-arrow">\u2192</span>
          </button>
          <button type="button" class="vox-share-row vsr-share-img" data-ps-share-img>
            <span class="vsr-icon">\u21AA</span>
            <span class="vsr-body">
              <div class="vsr-name" data-i18n="ty-share-img-name">${t('ty-share-img-name')}</div>
              <div class="vsr-sub" data-i18n="ty-share-img-sub">${t('ty-share-img-sub')}</div>
            </span>
            <span class="vsr-arrow">\u2192</span>
          </button>
          <a class="vox-share-row vsr-whatsapp" href="${waHref}" target="_blank" rel="noopener">
            <span class="vsr-icon">W</span>
            <span class="vsr-body">
              <div class="vsr-name" data-i18n="ty-share-wa-name">${t('ty-share-wa-name')}</div>
              <div class="vsr-sub" data-i18n="ty-share-wa-sub">${t('ty-share-wa-sub')}</div>
            </span>
            <span class="vsr-arrow">\u2192</span>
          </a>
          <button type="button" class="vox-share-row vsr-instagram" data-ps-ig data-ig-text="${esc(waMsg)}">
            <span class="vsr-icon">IG</span>
            <span class="vsr-body">
              <div class="vsr-name" data-i18n="ty-share-ig-name">${t('ty-share-ig-name')}</div>
              <div class="vsr-sub" data-i18n="ty-share-ig-sub">${t('ty-share-ig-sub')}</div>
            </span>
            <span class="vsr-arrow">\u2192</span>
          </button>
          <button type="button" class="vox-share-row vsr-copy" data-ps-copy data-copy-url="${SITE_URL}">
            <span class="vsr-icon">\u2398</span>
            <span class="vsr-body">
              <div class="vsr-name" data-i18n="ty-share-copy-name">${t('ty-share-copy-name')}</div>
              <div class="vsr-sub" data-i18n="ty-share-copy-sub">${t('ty-share-copy-sub')}</div>
            </span>
            <span class="vsr-arrow">\u2192</span>
          </button>
        </div>
      </section>

      <!-- REGIONAL PRIDE -->
      <section class="ps-region">
        <div class="ps-region-inner">
          <div class="ps-region-kicker">
            <span class="live-dot live-dot--gold"></span>
            <span>${deptLabel || t('ty-region-anon')}</span>
          </div>
          <h3 class="ps-region-title">
            <span data-i18n="ty-region-title-prefix">${t('ty-region-title-prefix')}</span>
            <span class="prt-highlight">${esc(deptLabel || t('ty-region-anon'))}</span>
            <span data-i18n="ty-region-title-mid">${t('ty-region-title-mid')}</span>
            <span class="prt-highlight">#${myRank || '\u2014'}</span>
            <span data-i18n="ty-region-title-suffix">${t('ty-region-title-suffix')}</span>
          </h3>
          <div class="ps-region-list">
            ${rows.map(d => {
              const isYou = deptId && d.id === deptId;
              const pct = Math.round((d.count / maxCount) * 100);
              const rank = sorted.findIndex(x => x.id === d.id) + 1;
              const lbl = d.label[currentLang] || d.label.fr || d.label.ht;
              return `
                <div class="ps-region-row ${isYou ? 'prr-you' : ''}">
                  <span class="ps-region-pos">${String(rank).padStart(2,'0')}</span>
                  <span class="ps-region-name">${esc(lbl)}</span>
                  <span class="ps-region-bar-wrap"><span class="ps-region-bar" style="width:${pct}%"></span></span>
                  <span class="ps-region-count">${formatNum(d.count)}</span>
                </div>
              `;
            }).join('')}
          </div>
          <div class="ps-region-cta-wrap">
            <div class="ps-region-cta-text">
              <span data-i18n="ty-region-cta-prefix">${t('ty-region-cta-prefix')}</span>
              <strong> ${esc(deptLabel || t('ty-region-anon'))} </strong>
              <span data-i18n="ty-region-cta-suffix">${t('ty-region-cta-suffix')}</span>
            </div>
            <a class="ps-region-wa-btn" href="${waHrefRegion}" target="_blank" rel="noopener" data-i18n="ty-region-wa">${t('ty-region-wa')}</a>
          </div>
        </div>
      </section>
    `;

    container.appendChild(wrap);
    wireActions(wrap);
  }

  /* =============================================
     ACTION WIRING
     Hook up CTAs to existing handlers (don't re-implement routing)
     ============================================= */
  function wireActions(wrap) {
    // "See answers in the Mirror" → calls existing goToCommunityFromQ (safe fallback)
    const mirrorBtn = wrap.querySelector('[data-ps-see-mirror]');
    if (mirrorBtn) {
      mirrorBtn.addEventListener('click', () => {
        if (typeof goToCommunityFromQ === 'function') return goToCommunityFromQ();
        if (typeof setPhase === 'function') return setPhase('community');
        location.href = 'index.html';
      });
    }

    // "Share your voice" → scroll to vox card / share list
    const shareBtn = wrap.querySelector('[data-ps-share-voice]');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        const target = wrap.querySelector('#ps-share-list');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }

    // Instagram: copy text to clipboard with instruction
    const igBtn = wrap.querySelector('[data-ps-ig]');
    if (igBtn) {
      igBtn.addEventListener('click', () => {
        const text = igBtn.getAttribute('data-ig-text') || '';
        copyToClipboard(text).then(() => {
          flashCopied(igBtn, t('ty-share-ig-copied'));
        });
      });
    }

    // Save image (download PNG)
    const saveImgBtn = wrap.querySelector('[data-ps-save-img]');
    if (saveImgBtn) {
      saveImgBtn.addEventListener('click', async () => {
        if (saveImgBtn.dataset.busy === '1') return;
        saveImgBtn.dataset.busy = '1';
        const subEl = saveImgBtn.querySelector('.vsr-sub');
        const origSubKey = subEl && subEl.getAttribute('data-i18n');
        const origSub = subEl && subEl.textContent;
        if (subEl) { subEl.removeAttribute('data-i18n'); subEl.textContent = t('ty-img-generating'); }
        try {
          const data = buildCardData();
          const blob = await generateCardImage(data);
          if (blob) await saveBlob(blob, fileStem(data.voiceN));
          saveImgBtn.classList.add('vsr-copied');
          if (subEl) subEl.textContent = t('ty-img-saved');
        } catch (e) {
          if (subEl && origSubKey) { subEl.setAttribute('data-i18n', origSubKey); subEl.textContent = origSub; }
        }
        setTimeout(() => {
          saveImgBtn.classList.remove('vsr-copied');
          saveImgBtn.dataset.busy = '0';
          if (subEl) {
            if (origSubKey) subEl.setAttribute('data-i18n', origSubKey);
            subEl.textContent = origSub;
          }
        }, 2400);
      });
    }

    // Share image (Web Share API with file, fallback to download + wa.me)
    const shareImgBtn = wrap.querySelector('[data-ps-share-img]');
    if (shareImgBtn) {
      shareImgBtn.addEventListener('click', async () => {
        if (shareImgBtn.dataset.busy === '1') return;
        shareImgBtn.dataset.busy = '1';
        const subEl = shareImgBtn.querySelector('.vsr-sub');
        const origSubKey = subEl && subEl.getAttribute('data-i18n');
        const origSub = subEl && subEl.textContent;
        if (subEl) { subEl.removeAttribute('data-i18n'); subEl.textContent = t('ty-img-generating'); }
        try {
          const data = buildCardData();
          const blob = await generateCardImage(data);
          const caption = t('ty-img-caption');
          const result = blob ? await shareBlob(blob, fileStem(data.voiceN), caption) : null;
          if (result === 'shared' || result === 'downloaded') {
            shareImgBtn.classList.add('vsr-copied');
            if (subEl) subEl.textContent = (result === 'shared') ? t('ty-img-shared') : t('ty-img-saved');
          } else if (subEl) {
            if (origSubKey) subEl.setAttribute('data-i18n', origSubKey);
            subEl.textContent = origSub;
          }
        } catch (e) {
          if (subEl && origSubKey) { subEl.setAttribute('data-i18n', origSubKey); subEl.textContent = origSub; }
        }
        setTimeout(() => {
          shareImgBtn.classList.remove('vsr-copied');
          shareImgBtn.dataset.busy = '0';
          if (subEl) {
            if (origSubKey) subEl.setAttribute('data-i18n', origSubKey);
            subEl.textContent = origSub;
          }
        }, 2400);
      });
    }

    // Copy URL
    const copyBtn = wrap.querySelector('[data-ps-copy]');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const url = copyBtn.getAttribute('data-copy-url') || SITE_URL;
        copyToClipboard(url).then(() => {
          copyBtn.classList.add('vsr-copied');
          const iconEl = copyBtn.querySelector('.vsr-icon');
          if (iconEl) iconEl.textContent = '\u2713';
          const subEl = copyBtn.querySelector('.vsr-sub');
          if (subEl) subEl.textContent = t('ty-share-copied');
          setTimeout(() => {
            copyBtn.classList.remove('vsr-copied');
            if (iconEl) iconEl.textContent = '\u2398';
            if (subEl) {
              subEl.setAttribute('data-i18n', 'ty-share-copy-sub');
              subEl.textContent = t('ty-share-copy-sub');
            }
          }, 2200);
        });
      });
    }
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    // Fallback for older browsers
    return new Promise(resolve => {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly','');
      ta.style.position = 'absolute'; ta.style.left = '-9999px';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      resolve();
    });
  }

  function flashCopied(btn, label) {
    const subEl = btn.querySelector('.vsr-sub');
    const orig = subEl ? subEl.textContent : '';
    const origKey = subEl ? subEl.getAttribute('data-i18n') : null;
    if (subEl) { subEl.removeAttribute('data-i18n'); subEl.textContent = label; }
    btn.classList.add('vsr-copied');
    setTimeout(() => {
      if (subEl) {
        if (origKey) subEl.setAttribute('data-i18n', origKey);
        subEl.textContent = orig;
      }
      btn.classList.remove('vsr-copied');
    }, 2200);
  }

  /* =============================================
     MAIN — watch q-thankyou for visibility
     ============================================= */
  function enhance() {
    const ty = document.getElementById('q-thankyou');
    if (!ty) return;
    if (ty.classList.contains('ps-enhanced')) return; // rebuild below if needed
    ty.classList.add('ps-enhanced');
    build(ty);
  }

  function rebuildIfShown() {
    const ty = document.getElementById('q-thankyou');
    if (!ty) return;
    const visible = ty.style.display && ty.style.display !== 'none';
    if (!visible) return;
    // Remove any previous ps-inner and rebuild fresh (voice number may have changed)
    const prev = ty.querySelector('.ps-inner');
    if (prev) prev.remove();
    ty.classList.add('ps-enhanced');
    build(ty);
  }

  function init() {
    const ty = document.getElementById('q-thankyou');
    if (!ty) return;

    // Watch for the display toggle (questionnaire.js sets style.display='flex' on show)
    const mo = new MutationObserver(rebuildIfShown);
    mo.observe(ty, { attributes: true, attributeFilter: ['style'] });

    // If the page loads already showing the thank-you (unlikely), enhance now
    if (ty.style.display && ty.style.display !== 'none') rebuildIfShown();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
