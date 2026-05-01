/* =============================================
   DATABASE ACCESS LAYER
   All Firestore reads/writes go through here.
   No other file should reference `db` directly.
   ============================================= */

const DB = {
  PAGE_SIZE: 500,   // show all answers — effectively no pagination until we scale

  /* ----- ANSWERS ----- */

  // Fetch one page of answers for a question
  // Returns { answers: [...], hasMore: boolean, lastDoc: snapshot }
  async fetchAnswers(qId, { sortBy = 'votes', page = 1, filterDept = null, searchQuery = '', lastDoc = null } = {}) {
    // Strategy: pull up to 500 docs with a single orderBy (no composite index
    // required), then filter / sort / paginate client-side.
    // Previous Firestore .where(qId, '!=', '') + orderBy threw silently because
    // Firestore requires the first orderBy to match the inequality field.
    let query = db.collection('answers').orderBy('createdAt', 'desc').limit(500);

    let snap;
    try { snap = await query.get(); }
    catch (e) {
      // Fallback: no sort (unseeded or missing createdAt)
      snap = await db.collection('answers').limit(500).get();
    }

    let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Filter 1 — only docs that actually have a non-empty answer for qId
    results = results.filter(a => {
      const val = a[qId];
      const text = (typeof val === 'object' && val !== null)
        ? (val.ht || val.fr || val.en || '')
        : val;
      return text && String(text).trim();
    });

    // Filter 2 — department
    if (filterDept) {
      results = results.filter(a => a.department === filterDept);
    }

    // Filter 3 — full-text search (name, location, answer text)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(a => {
        const text = (typeof a[qId] === 'object' && a[qId] !== null)
          ? Object.values(a[qId]).join(' ')
          : String(a[qId] || '');
        return text.toLowerCase().includes(q)
          || (a.name || '').toLowerCase().includes(q)
          || (a.where || '').toLowerCase().includes(q);
      });
    }

    // Sort
    const tsOf = a => (a.createdAt && typeof a.createdAt.toMillis === 'function')
      ? a.createdAt.toMillis()
      : (a.createdAt && a.createdAt.seconds ? a.createdAt.seconds * 1000 : 0);
    if (sortBy === 'votes') {
      results.sort((a, b) => (((b.votes && b.votes[qId]) || 0) - ((a.votes && a.votes[qId]) || 0)));
    } else if (sortBy === 'newest') {
      results.sort((a, b) => tsOf(b) - tsOf(a));
    } else {
      results.sort((a, b) => tsOf(a) - tsOf(b));
    }

    // Paginate client-side
    const pageNum = Math.max(1, page || 1);
    const start = (pageNum - 1) * this.PAGE_SIZE;
    const end = start + this.PAGE_SIZE;
    const pageItems = results.slice(start, end);
    const hasMore = results.length > end;

    return {
      answers: pageItems,
      hasMore,
      lastDoc: null   // no cursor — client-side pagination
    };
  },

  // Submit a new answer — goes through the submitAnswer Cloud Function.
  // The CF validates, hashes the phone (SHA-256), merges by phoneHash,
  // and increments meta/stats. Client never writes answers/ or meta/ directly.
  async submitAnswer(entry) {
    if (typeof functions === 'undefined' || !functions) {
      throw new Error('Cloud Functions SDK not initialized');
    }

    const payload = {
      name: entry.name,
      phone: entry._userId || entry.phone,
      department: entry.department,
      where: entry.where || ''
    };
    ['q1', 'q2', 'q3', 'q4', 'q5'].forEach(qId => {
      if (entry[qId] != null && entry[qId] !== '') {
        payload[qId] = entry[qId];
      }
    });

    const call = functions.httpsCallable('submitAnswer');
    const res = await call(payload);
    return res.data.answerId;
  },

  // Vote on an answer.
  // Firestore rules allow only the votes/comments subset to be updated
  // on /answers; meta/stats is admin-only, so the global counter is
  // not updated client-side anymore (the rapport reads /answers
  // aggregates instead).
  async vote(answerId, qId, delta) {
    const ref = db.collection('answers').doc(answerId);
    await ref.update({
      [`votes.${qId}`]: firebase.firestore.FieldValue.increment(delta)
    });
  },

  // Add comment to an answer
  async addComment(answerId, qId, comment) {
    const ref = db.collection('answers').doc(answerId);
    await ref.update({
      [`comments.${qId}`]: firebase.firestore.FieldValue.arrayUnion(comment)
    });
  },

  /* ----- STATS ----- */

  async fetchStats() {
    const doc = await db.collection('meta').doc('stats').get();
    return doc.exists ? doc.data() : {
      totalParticipants: 0, totalAnswers: 0, totalVotes: 0,
      perQuestion: {}, perDept: {}
    };
  },

  /* ----- CONSULTED ORGANIZATIONS ----- */

  async fetchConsulted({ category = null, type = null, search = '', lastDoc = null, pageSize = 30 } = {}) {
    let query = db.collection('consulted').orderBy('order', 'asc');

    if (category) {
      query = query.where('category', '==', category);
    }
    if (type) {
      query = query.where('type', '==', type);
    }
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    query = query.limit(pageSize + 1);
    const snap = await query.get();
    const docs = snap.docs.slice(0, pageSize);
    const hasMore = snap.docs.length > pageSize;

    let results = docs.map(d => ({ id: d.id, ...d.data() }));

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(o =>
        (o.name || '').toLowerCase().includes(q)
        || (o.location || '').toLowerCase().includes(q)
      );
    }

    return {
      items: results,
      hasMore,
      lastDoc: docs.length > 0 ? docs[docs.length - 1] : null
    };
  },

  // Get all unique types for filter tabs
  async fetchConsultedTypes() {
    // Read from a meta doc that lists all types
    const doc = await db.collection('meta').doc('consultedTypes').get();
    return doc.exists ? doc.data().types || [] : [];
  },

  /* ----- USERS ----- */

  async saveUser(userData) {
    const id = this.hashPhone(userData.phone);
    await db.collection('users').doc(id).set({
      ...userData,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  },

  async getUser(phone) {
    const id = this.hashPhone(phone);
    const doc = await db.collection('users').doc(id).get();
    return doc.exists ? doc.data() : null;
  },

  hashPhone(phone) {
    // Simple hash for document ID (not cryptographic)
    let hash = 0;
    const s = phone.replace(/\s+/g, '');
    for (let i = 0; i < s.length; i++) {
      hash = ((hash << 5) - hash) + s.charCodeAt(i);
      hash |= 0;
    }
    return 'u' + Math.abs(hash).toString(36);
  },

  /* Seed data is managed server-side / in Firestore directly;
     no seeding from the public client. */
};
