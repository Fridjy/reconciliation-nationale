/* =============================================
   ANALYSIS ENGINE
   Extracts themes, word frequency, consensus
   from the answers data. Works locally without API.
   ============================================= */

const ANALYSIS = {
  // Common stop words to exclude (FR/HT/EN)
  STOP_WORDS: new Set([
    // French
    'le','la','les','un','une','des','de','du','et','en','à','au','aux','ce','ces','qui','que','quoi',
    'pour','par','sur','dans','avec','sans','pas','ne','nous','vous','ils','elles','on','se','son',
    'sa','ses','leur','leurs','mon','ma','mes','ton','ta','tes','tout','tous','toute','toutes',
    'plus','moins','très','bien','être','avoir','faire','dit','comme','mais','ou','où','donc','car',
    'est','sont','a','ont','été','fait','peut','doit','faut',
    // Kreyòl
    'yon','nan','pou','ki','ak','pa','ka','yo','li','nou','mwen','ou','se','sa','gen','te','ap',
    'men','kote','jan','tout','pi','fè','bay',
    // English
    'the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','is','are',
    'was','were','be','been','have','has','had','do','does','did','not','no','that','this','who',
    'what','which','where','when','how','all','each','every','can','will','should','would','could'
  ]),

  // Extract words from text, filter stop words
  extractWords(text) {
    if (!text) return [];
    return text.toLowerCase()
      .replace(/[^\w\sàâäéèêëïîôùûüçœæ'-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !this.STOP_WORDS.has(w));
  },

  // Get word frequency for a question
  wordFrequency(qId, lang) {
    const freq = {};
    answers.forEach(a => {
      const val = a[qId];
      const text = typeof val === 'object' ? (val[lang] || val.ht || val.fr || '') : (val || '');
      this.extractWords(text).forEach(w => {
        freq[w] = (freq[w] || 0) + 1;
      });
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 40);
  },

  // Get top themes (grouped keywords) for a question
  topThemes(qId, lang) {
    const words = this.wordFrequency(qId, lang);
    // Top 8 most frequent words as theme proxies
    return words.slice(0, 8).map(([word, count]) => ({
      word,
      count,
      pct: Math.round((count / Math.max(answers.length, 1)) * 100)
    }));
  },

  // Find consensus — themes mentioned by high % of respondents
  consensus(qId, lang) {
    const total = answers.filter(a => {
      const val = a[qId];
      const text = typeof val === 'object' ? (val[lang] || val.ht || '') : (val || '');
      return text && text.trim();
    }).length;
    if (total === 0) return [];

    const themes = this.topThemes(qId, lang);
    return themes
      .filter(t => t.pct >= 20)
      .map(t => ({ ...t, pct: Math.min(t.pct, 100) }));
  },

  // Compare departments — top theme per department for a question
  departmentComparison(qId, lang) {
    const deptWords = {};

    answers.forEach(a => {
      const dept = typeof matchDepartment === 'function' ? matchDepartment(a.where) : null;
      if (!dept) return;
      const val = a[qId];
      const text = typeof val === 'object' ? (val[lang] || val.ht || '') : (val || '');
      if (!text || !text.trim()) return;

      if (!deptWords[dept]) deptWords[dept] = {};
      this.extractWords(text).forEach(w => {
        deptWords[dept][w] = (deptWords[dept][w] || 0) + 1;
      });
    });

    const result = {};
    Object.keys(deptWords).forEach(dept => {
      const sorted = Object.entries(deptWords[dept]).sort((a, b) => b[1] - a[1]);
      result[dept] = sorted.slice(0, 5).map(([word, count]) => ({ word, count }));
    });
    return result;
  },

  // Generate insight statements
  generateInsights(lang) {
    const insights = [];
    const total = answers.length;
    if (total === 0) return insights;

    QUESTIONS.forEach((q, idx) => {
      const themes = this.topThemes(q.id, lang);
      if (themes.length > 0) {
        const top = themes[0];
        insights.push({
          stat: top.pct + '%',
          text: `${i18n[lang]['insight-mention'] || 'des répondants mentionnent'} "${top.word}" ${i18n[lang]['insight-for'] || 'pour la question'} ${idx + 1}`,
          source: `${total} ${i18n[lang]['s-ans'] || 'réponses'} · Q${idx + 1}`
        });
      }
    });

    // Department insight
    const deptCounts = {};
    answers.forEach(a => {
      const dept = typeof matchDepartment === 'function' ? matchDepartment(a.where) : null;
      if (dept && dept !== 'diaspora') deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });
    const topDept = Object.entries(deptCounts).sort((a, b) => b[1] - a[1])[0];
    if (topDept) {
      const d = DEPARTMENTS.find(d => d.id === topDept[0]);
      if (d) {
        insights.push({
          stat: topDept[1].toString(),
          text: `${i18n[lang]['insight-dept'] || 'réponses viennent de'} ${d.name[lang]}`,
          source: i18n[lang]['insight-top-dept'] || 'Département le plus actif'
        });
      }
    }

    return insights;
  },

  // Get a random powerful quote from answers
  getRandomQuote(lang) {
    const good = [];
    answers.forEach(a => {
      QUESTIONS.forEach(q => {
        const val = a[q.id];
        const text = typeof val === 'object' ? (val[lang] || val.ht || '') : (val || '');
        if (text && text.length > 40 && text.length < 200) {
          good.push({ text, name: a.name, where: a.where });
        }
      });
    });
    if (good.length === 0) return null;
    return good[Math.floor(Math.random() * good.length)];
  }
};
