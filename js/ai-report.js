/* =============================================
   AI REPORT — Claude API Integration
   Generates thematic analysis reports using
   the Anthropic Claude API.

   Set your API key in AI_CONFIG.apiKey
   ============================================= */

const AI_CONFIG = {
  apiKey: '', // Set your Anthropic API key here
  model: 'claude-sonnet-4-20250514',
  maxTokens: 2000
};

const AI_REPORT = {
  // Check if API is configured
  isConfigured() {
    return AI_CONFIG.apiKey && AI_CONFIG.apiKey.length > 10;
  },

  // Generate a thematic report for a specific question
  async generateQuestionReport(qId, lang) {
    if (!this.isConfigured()) return null;

    const qIdx = QUESTIONS.findIndex(q => q.id === qId);
    const questionText = i18n[lang][QUESTIONS[qIdx].key];

    // Collect all answers for this question
    const allAnswers = answers
      .map(a => {
        const val = a[qId];
        return typeof val === 'object' ? (val[lang] || val.ht || '') : (val || '');
      })
      .filter(t => t.trim())
      .slice(0, 100); // Limit to 100 for API cost

    const prompt = `Analyse les réponses suivantes à la question "${questionText}" dans le cadre d'une consultation citoyenne en Haïti (Réconciliation Nationale).

Réponses:
${allAnswers.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Génère un rapport structuré en français avec:
1. **Thèmes principaux** (les 5 grands thèmes qui émergent, avec le % approximatif de réponses qui les mentionnent)
2. **Points de consensus** (ce sur quoi la majorité s'accorde)
3. **Points de divergence** (là où les opinions diffèrent)
4. **Citations marquantes** (3 citations représentatives, citées textuellement)
5. **Synthèse** (2-3 phrases résumant le message principal)

Sois factuel et respectueux du contexte haïtien.`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': AI_CONFIG.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: AI_CONFIG.model,
          max_tokens: AI_CONFIG.maxTokens,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      return data.content[0].text;
    } catch (e) {
      console.error('AI Report error:', e);
      return null;
    }
  },

  // Generate a full report across all questions
  async generateFullReport(lang) {
    if (!this.isConfigured()) return null;

    const allData = QUESTIONS.map((q, i) => {
      const texts = answers
        .map(a => {
          const val = a[q.id];
          return typeof val === 'object' ? (val[lang] || val.ht || '') : (val || '');
        })
        .filter(t => t.trim())
        .slice(0, 50);
      return `\nQUESTION ${i + 1}: ${i18n[lang][q.key]}\n${texts.map(t => `- ${t}`).join('\n')}`;
    }).join('\n');

    const prompt = `Tu es un analyste pour le projet "Réconciliation Nationale" en Haïti. Voici les réponses citoyennes à 5 questions fondamentales.

${allData}

Génère un RAPPORT CITOYEN complet en français:

## Vue d'ensemble
(3-4 phrases sur le message global qui émerge)

## Par question
Pour chaque question:
- Top 3 thèmes
- Le point de consensus principal
- La citation la plus puissante

## Recommandations
5 recommandations concrètes basées sur ce que les citoyens demandent.

## Conclusion
Un paragraphe de synthèse.

Ton: respectueux, factuel, ancré dans la réalité haïtienne.`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': AI_CONFIG.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: AI_CONFIG.model,
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      return data.content[0].text;
    } catch (e) {
      console.error('AI Full Report error:', e);
      return null;
    }
  },

  // Simple markdown to HTML converter
  markdownToHtml(md) {
    return md
      .replace(/^## (.+)$/gm, '<h4>$1</h4>')
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[hup])/gm, '<p>')
      .replace(/(?<![>])$/gm, '</p>')
      .replace(/<p><\/p>/g, '')
      .replace(/<p>(<[hul])/g, '$1')
      .replace(/(<\/[hul].*?>)<\/p>/g, '$1');
  }
};
