/* =============================================
   DATABASE ACCESS LAYER
   All Firestore reads/writes go through here.
   No other file should reference `db` directly.
   ============================================= */

const DB = {
  PAGE_SIZE: 20,

  /* ----- ANSWERS ----- */

  // Fetch one page of answers for a question
  // Returns { answers: [...], hasMore: boolean, lastDoc: snapshot }
  async fetchAnswers(qId, { sortBy = 'votes', page = 1, filterDept = null, searchQuery = '', lastDoc = null } = {}) {
    let query = db.collection('answers').where(qId, '!=', '');

    // Sort
    if (sortBy === 'votes') {
      query = query.orderBy(`votes.${qId}`, 'desc');
    } else if (sortBy === 'newest') {
      query = query.orderBy('createdAt', 'desc');
    } else {
      query = query.orderBy('createdAt', 'asc');
    }

    // Department filter
    if (filterDept) {
      query = query.where('department', '==', filterDept);
    }

    // Cursor pagination
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    query = query.limit(this.PAGE_SIZE + 1); // fetch 1 extra to check hasMore

    const snap = await query.get();
    const docs = snap.docs.slice(0, this.PAGE_SIZE);
    const hasMore = snap.docs.length > this.PAGE_SIZE;

    let results = docs.map(d => ({ id: d.id, ...d.data() }));

    // Client-side search filter (Firestore has no full-text search)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(a => {
        const text = typeof a[qId] === 'object'
          ? Object.values(a[qId]).join(' ')
          : String(a[qId] || '');
        return text.toLowerCase().includes(q)
          || (a.name || '').toLowerCase().includes(q)
          || (a.where || '').toLowerCase().includes(q);
      });
    }

    return {
      answers: results,
      hasMore,
      lastDoc: docs.length > 0 ? docs[docs.length - 1] : null
    };
  },

  // Submit a new answer
  async submitAnswer(entry) {
    const doc = {
      ...entry,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    const ref = await db.collection('answers').add(doc);
    // Update stats
    await this.incrementStats(entry);
    return ref.id;
  },

  // Vote on an answer
  async vote(answerId, qId, delta) {
    const ref = db.collection('answers').doc(answerId);
    await ref.update({
      [`votes.${qId}`]: firebase.firestore.FieldValue.increment(delta)
    });
    // Update global vote count
    await db.collection('meta').doc('stats').update({
      totalVotes: firebase.firestore.FieldValue.increment(delta)
    });
  },

  // Add comment to an answer
  async addComment(answerId, qId, comment) {
    const ref = db.collection('answers').doc(answerId);
    await ref.update({
      [`comments.${qId}`]: firebase.firestore.FieldValue.arrayUnion(comment)
    });
  },

  // Increment stats after new submission
  async incrementStats(entry) {
    const statsRef = db.collection('meta').doc('stats');
    const updates = {
      totalParticipants: firebase.firestore.FieldValue.increment(1)
    };
    QUESTIONS.forEach(q => {
      const val = entry[q.id];
      const text = typeof val === 'object' ? (val && (val.ht || '')) : val;
      if (text && text.trim()) {
        updates.totalAnswers = firebase.firestore.FieldValue.increment(1);
        updates[`perQuestion.${q.id}`] = firebase.firestore.FieldValue.increment(1);
      }
    });
    // Update department count
    if (entry.department) {
      updates[`perDept.${entry.department}`] = firebase.firestore.FieldValue.increment(1);
    }
    await statsRef.set(updates, { merge: true });
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

  /* ----- SEED DATA (run once to populate Firestore) ----- */

  async seedInitialData() {
    // Check if already seeded
    const statsDoc = await db.collection('meta').doc('stats').get();
    if (statsDoc.exists && statsDoc.data().seeded) return;

    const batch = db.batch();

    // Seed answers
    seedAnswers.forEach(a => {
      const ref = db.collection('answers').doc('seed-' + a.id);
      batch.set(ref, {
        ...a,
        department: typeof matchDepartment === 'function' ? matchDepartment(a.where) : null,
        createdAt: firebase.firestore.Timestamp.now()
      });
    });

    // Seed stats
    batch.set(db.collection('meta').doc('stats'), {
      totalParticipants: 1847,
      totalAnswers: 9235,
      totalVotes: 12408,
      perQuestion: { q1: 4, q2: 4, q3: 4, q4: 4, q5: 4 },
      perDept: {},
      seeded: true
    });

    // Seed consulted types
    batch.set(db.collection('meta').doc('consultedTypes'), {
      types: ['Sosyete sivil', 'Iniv��site', 'Medya', 'Dyaspora', 'Relijyon', 'Dwa moun', 'Istoryen', 'Sosyològ', 'Lidè kominotè', 'Jiriskonsilt', 'ONG', 'Sektè prive']
    });

    await batch.commit();
    console.log('Firestore seeded with initial data');
  }
};
