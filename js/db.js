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
      totalParticipants: 0,
      totalAnswers: 0,
      totalVotes: 0,
      perQuestion: { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0 },
      perDept: {},
      seeded: true
    });

    // Seed consulted types
    batch.set(db.collection('meta').doc('consultedTypes'), {
      types: ['Sosyete sivil', 'Inivèsite', 'Medya', 'Dyaspora', 'Relijyon', 'Dwa moun', 'ONG', 'Sektè prive', 'Politik', 'Kilti', 'Sante', 'Edikasyon', 'Agrikilti', 'Teknoloji']
    });

    // Seed consulted organizations
    const orgs = [
      { name: 'LANS', type: 'Sosyete sivil', category: 'institution', logoInitials: 'LA', website: 'https://lfrancophonie.org', description: 'Leadership Ayisyen pour une Nouvelle Société. Initiateur du projet Réconciliation Nationale.', location: 'Port-au-Prince', order: 0 },
      { name: "Université d'État d'Haïti", type: 'Inivèsite', category: 'institution', logoInitials: 'UEH', website: '', description: "Faculté des Sciences Humaines. Contribution à la rédaction des questions et à l'analyse sociologique.", location: 'Port-au-Prince', order: 1 },
      { name: 'Radio Kiskeya', type: 'Medya', category: 'institution', logoInitials: 'RK', website: '', description: 'Diffusion de la campagne et débats publics sur les 5 questions.', location: 'Port-au-Prince', order: 2 },
      { name: 'Haitian Diaspora Federation', type: 'Dyaspora', category: 'institution', logoInitials: 'HDF', website: '', description: 'Relais de la voix haïtienne en diaspora. Coordination de la participation dans 32 pays.', location: 'New York · Montreal · Paris', order: 3 },
      { name: "Conférence Épiscopale d'Haïti", type: 'Relijyon', category: 'institution', logoInitials: 'CEH', website: '', description: 'Consultation sur les questions de réconciliation, justice et paix.', location: 'Port-au-Prince', order: 4 },
      { name: 'RNDDH', type: 'Dwa moun', category: 'institution', logoInitials: 'RN', website: '', description: "Réseau National de Défense des Droits Humains. Conseil sur l'inclusion et la transparence.", location: 'Port-au-Prince', order: 5 },
      { name: 'Radio Télé Métropole', type: 'Medya', category: 'institution', logoInitials: 'RTM', website: '', description: 'Couverture médiatique nationale de la campagne de consultation.', location: 'Port-au-Prince', order: 6 },
      { name: 'Le Nouvelliste', type: 'Medya', category: 'institution', logoInitials: 'LN', website: '', description: "Publication des résultats et analyses dans le principal quotidien du pays.", location: 'Port-au-Prince', order: 7 },
      { name: 'FOKAL', type: 'ONG', category: 'institution', logoInitials: 'FK', website: '', description: 'Fondation Connaissance et Liberté. Soutien logistique et diffusion culturelle.', location: 'Port-au-Prince', order: 8 },
      { name: "Chambre de Commerce d'Haïti", type: 'Sektè prive', category: 'institution', logoInitials: 'CCH', website: '', description: "Consultation du secteur privé sur les questions économiques et institutionnelles.", location: 'Port-au-Prince', order: 9 },
      { name: 'USIH', type: 'Inivèsite', category: 'institution', logoInitials: 'US', website: '', description: "Université des Sciences et de l'Informatique d'Haïti. Partenaire recherche et données.", location: 'Port-au-Prince', order: 10 },
      { name: 'Médecins du Monde', type: 'Sante', category: 'institution', logoInitials: 'MdM', website: '', description: 'Perspective santé publique dans les questions environnementales et institutionnelles.', location: 'Port-au-Prince', order: 11 },
      { name: 'PAPDA', type: 'ONG', category: 'institution', logoInitials: 'PA', website: '', description: "Plateforme haïtienne de plaidoyer pour un développement alternatif.", location: 'Port-au-Prince', order: 12 },
      { name: 'Kay Fanm', type: 'Dwa moun', category: 'institution', logoInitials: 'KF', website: '', description: "Organisation féministe. Consultation sur l'égalité des genres et la gouvernance.", location: 'Port-au-Prince', order: 13 },
      { name: 'GRAHN', type: 'Dyaspora', category: 'institution', logoInitials: 'GR', website: '', description: "Groupe de réflexion et d'action pour une Haïti nouvelle. Réseau diaspora-Haïti.", location: 'Montreal', order: 14 },
      { name: 'Protestant Federation of Haiti', type: 'Relijyon', category: 'institution', logoInitials: 'FPH', website: '', description: 'Consultation communautaire via le réseau protestant national.', location: 'Port-au-Prince', order: 15 },
      { name: 'CIAT', type: 'Politik', category: 'institution', logoInitials: 'CI', website: '', description: "Comité Interministériel d'Aménagement du Territoire. Expertise en planification.", location: 'Port-au-Prince', order: 16 },
      { name: 'Ayiti Nexus', type: 'Teknoloji', category: 'institution', logoInitials: 'AN', website: '', description: 'Plateforme technologique haïtienne. Support technique du projet.', location: 'Port-au-Prince', order: 17 },
      { name: 'ORE', type: 'Edikasyon', category: 'institution', logoInitials: 'OR', website: '', description: "Organisation pour la Réhabilitation de l'Environnement. Éducation environnementale.", location: 'Camp-Perrin', order: 18 },
      { name: 'VETERIMED', type: 'Agrikilti', category: 'institution', logoInitials: 'VM', website: '', description: "Vétérinaires en mission pour le développement. Voix du monde rural.", location: 'Port-au-Prince', order: 19 },
      { name: 'Jean-Robert Cadet', role: 'Écrivain · Activiste', category: 'personality', expertise: "Droits de l'enfant, éducation, justice sociale", description: "Auteur et défenseur des droits de l'enfant. Contribution sur le leadership et les institutions.", location: 'Haïti · États-Unis', order: 100 },
      { name: 'Marie-Laurence Jocelyn Lassègue', role: 'Ancienne Ministre', category: 'personality', expertise: 'Droits des femmes, communication, politique publique', description: "Ancienne Ministre de la Condition Féminine. Expertise sur les institutions et la participation citoyenne.", location: 'Port-au-Prince', order: 101 },
      { name: 'Patrick Elie', role: 'Activiste · Analyste politique', category: 'personality', expertise: 'Sécurité nationale, démocratie, réconciliation', description: 'Figure du mouvement démocratique. Consultation sur le leadership et la vision nationale.', location: 'Port-au-Prince', order: 102 },
      { name: 'Yanick Lahens', role: 'Écrivaine · Professeure', category: 'personality', expertise: 'Littérature, identité culturelle, sciences sociales', description: "Écrivaine reconnue internationalement. Réflexion sur l'identité haïtienne et l'environnement.", location: 'Port-au-Prince', order: 103 },
      { name: 'Lyonel Trouillot', role: 'Écrivain · Intellectuel', category: 'personality', expertise: 'Littérature, société, engagement citoyen', description: "Romancier et poète. Voix critique sur la société haïtienne et ses aspirations.", location: 'Port-au-Prince', order: 104 },
      { name: 'Michèle Duvivier Pierre-Louis', role: 'Ancienne Première Ministre', category: 'personality', expertise: 'Gouvernance, éducation, développement', description: "Ancienne Première Ministre. Présidente de FOKAL. Expertise en gouvernance et institutions.", location: 'Port-au-Prince', order: 105 },
      { name: 'Raoul Peck', role: 'Cinéaste · Ancien Ministre', category: 'personality', expertise: 'Culture, communication, politique', description: "Cinéaste de renommée mondiale. Ancien Ministre de la Culture. Vision sur l'identité nationale.", location: 'Port-au-Prince · Paris', order: 106 },
      { name: 'Danièle Magloire', role: 'Sociologue · Militante', category: 'personality', expertise: 'Droits humains, genre, société civile', description: "Sociologue et militante des droits des femmes. Consultation sur la société que nous voulons.", location: 'Port-au-Prince', order: 107 },
      { name: 'Jean-Germain Gros', role: 'Politologue', category: 'personality', expertise: 'Sciences politiques, État, institutions', description: "Professeur de sciences politiques. Expertise sur les institutions et la gouvernance.", location: 'États-Unis', order: 108 },
      { name: 'Edwidge Danticat', role: 'Écrivaine', category: 'personality', expertise: 'Littérature, diaspora, identité', description: "Écrivaine haïtiano-américaine. Voix de la diaspora. Réflexion sur le peuple que nous voulons être.", location: 'Miami', order: 109 }
    ];
    orgs.forEach((org, i) => {
      const ref = db.collection('consulted').doc('org-' + i);
      batch.set(ref, { ...org, logo: '' });
    });

    await batch.commit();
    console.log('Firestore seeded with initial data');
  }
};
