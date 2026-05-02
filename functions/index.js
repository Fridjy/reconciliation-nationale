const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const crypto = require('crypto');

initializeApp();
const db = getFirestore();

/* ============================================================
   Config
   ============================================================ */

const QUESTION_IDS = ['q1', 'q2', 'q3', 'q4', 'q5'];

const LIMITS = {
  name: 100,
  department: 50,
  where: 200,
  answer: 2000,
  phoneMin: 8,
  phoneMax: 15
};

const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 min
  maxPerWindow: 3,     // 3 submits/min/IP
  ttlMs: 24 * 60 * 60 * 1000 // prune entries older than 24h
};

/* ============================================================
   Helpers
   ============================================================ */

function sha256(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

function normalizePhone(raw) {
  if (typeof raw !== 'string') {
    throw new HttpsError('invalid-argument', 'phone must be a string');
  }
  const cleaned = raw.replace(/[\s\-().]/g, '');
  if (!/^\+?[0-9]+$/.test(cleaned)) {
    throw new HttpsError('invalid-argument', 'phone contains invalid characters');
  }
  const digits = cleaned.replace(/^\+/, '');
  if (digits.length < LIMITS.phoneMin || digits.length > LIMITS.phoneMax) {
    throw new HttpsError('invalid-argument', 'phone length out of range');
  }
  return cleaned;
}

function requireString(value, max, field) {
  if (typeof value !== 'string') {
    throw new HttpsError('invalid-argument', `${field} must be a string`);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new HttpsError('invalid-argument', `${field} is required`);
  }
  if (trimmed.length > max) {
    throw new HttpsError('invalid-argument', `${field} exceeds ${max} chars`);
  }
  return trimmed;
}

function optionalString(value, max, field) {
  if (value == null || value === '') return '';
  if (typeof value !== 'string') {
    throw new HttpsError('invalid-argument', `${field} must be a string`);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw new HttpsError('invalid-argument', `${field} exceeds ${max} chars`);
  }
  return trimmed;
}

function parseAnswerValue(val, qId) {
  if (val == null || val === '') return null;

  if (typeof val === 'string') {
    const t = val.trim();
    if (t.length === 0) return null;
    if (t.length > LIMITS.answer) {
      throw new HttpsError('invalid-argument', `${qId} exceeds ${LIMITS.answer} chars`);
    }
    return t;
  }

  if (typeof val === 'object' && !Array.isArray(val)) {
    const out = {};
    for (const lang of ['ht', 'fr', 'en']) {
      const lv = val[lang];
      if (typeof lv === 'string') {
        const t = lv.trim();
        if (t.length > LIMITS.answer) {
          throw new HttpsError('invalid-argument', `${qId}.${lang} exceeds ${LIMITS.answer} chars`);
        }
        if (t.length > 0) out[lang] = t;
      }
    }
    return Object.keys(out).length > 0 ? out : null;
  }

  throw new HttpsError('invalid-argument', `${qId} has invalid type`);
}

function hasPrevAnswer(prev) {
  if (prev == null) return false;
  if (typeof prev === 'string') return prev.trim().length > 0;
  if (typeof prev === 'object') {
    return Object.values(prev).some(v => typeof v === 'string' && v.trim().length > 0);
  }
  return false;
}

function extractIp(request) {
  const raw = request.rawRequest;
  if (!raw) return null;
  const fwd = raw.headers?.['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) {
    return fwd.split(',')[0].trim();
  }
  return raw.ip || null;
}

async function checkRateLimit(ip) {
  if (!ip) return; // fail-open on infra anomalies; log would be added server-side
  const key = sha256(ip).slice(0, 32);
  const ref = db.collection('_ratelimit').doc(key);
  const now = Date.now();
  const cutoff = now - RATE_LIMIT.windowMs;

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const prev = snap.exists ? (snap.data().hits || []) : [];
    const hits = prev.filter(t => typeof t === 'number' && t > cutoff);
    if (hits.length >= RATE_LIMIT.maxPerWindow) {
      throw new HttpsError('resource-exhausted', 'Too many submissions. Wait a moment and try again.');
    }
    hits.push(now);
    tx.set(ref, { hits, updatedAt: now, expiresAt: now + RATE_LIMIT.ttlMs });
  });
}

/* ============================================================
   submitAnswer — callable CF
   Accepts: { name, phone, department, where?, q1..q5 (string | {ht,fr,en}) }
   Behavior:
     - Validates & normalizes all inputs
     - Hashes phone (SHA-256) → phoneHash
     - Looks up existing doc by phoneHash; merges if found, else creates
     - Atomically increments meta/stats for NEW answers only
   Returns: { answerId, isNew, newQuestionCount }
   ============================================================ */

exports.submitAnswer = onCall(
  { region: 'us-central1', maxInstances: 10, cors: true, invoker: 'public' },
  async (request) => {
    const ip = extractIp(request);
    await checkRateLimit(ip);

    const data = request.data || {};

    const phone = normalizePhone(data.phone);
    const phoneHash = sha256(phone);
    const name = requireString(data.name, LIMITS.name, 'name');
    const department = requireString(data.department, LIMITS.department, 'department');
    const where = optionalString(data.where, LIMITS.where, 'where');

    const answers = {};
    for (const qId of QUESTION_IDS) {
      const parsed = parseAnswerValue(data[qId], qId);
      if (parsed !== null) answers[qId] = parsed;
    }
    if (Object.keys(answers).length === 0) {
      throw new HttpsError('invalid-argument', 'At least one answer is required');
    }

    const existingSnap = await db.collection('answers')
      .where('phoneHash', '==', phoneHash)
      .limit(1)
      .get();

    const isNew = existingSnap.empty;
    const docRef = isNew ? db.collection('answers').doc() : existingSnap.docs[0].ref;
    const existing = isNew ? null : existingSnap.docs[0].data();

    const newQuestionIds = [];
    if (isNew) {
      newQuestionIds.push(...Object.keys(answers));
    } else {
      for (const qId of Object.keys(answers)) {
        if (!hasPrevAnswer(existing[qId])) newQuestionIds.push(qId);
      }
    }

    const payload = {
      ...answers,
      name,
      department,
      where,
      phoneHash,
      updatedAt: FieldValue.serverTimestamp()
    };
    if (isNew) payload.createdAt = FieldValue.serverTimestamp();

    await docRef.set(payload, { merge: true });

    const statsUpdate = {};
    if (isNew) {
      statsUpdate.totalParticipants = FieldValue.increment(1);
      statsUpdate.todayCount = FieldValue.increment(1);
      statsUpdate[`perDept.${department}`] = FieldValue.increment(1);
    }
    if (newQuestionIds.length > 0) {
      statsUpdate.totalAnswers = FieldValue.increment(newQuestionIds.length);
      for (const qId of newQuestionIds) {
        statsUpdate[`perQuestion.${qId}`] = FieldValue.increment(1);
      }
    }
    if (Object.keys(statsUpdate).length > 0) {
      // .update() interprets dotted keys as nested paths (perDept.ouest →
      // perDept: { ouest: ... }); .set({merge:true}) would keep them as
      // flat literal field names, which broke per-department counters.
      // The meta/stats doc must exist (initialized once at deploy time).
      const statsRef = db.collection('meta').doc('stats');
      try {
        await statsRef.update(statsUpdate);
      } catch (e) {
        // Fallback: doc missing → create the canonical zero structure
        // and re-apply the increments via update().
        await statsRef.set({
          totalParticipants: 0,
          totalAnswers: 0,
          totalVotes: 0,
          todayCount: 0,
          perQuestion: { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0 },
          perDept: {
            ouest: 0, artibonite: 0, nord: 0, sud: 0, centre: 0,
            'sud-est': 0, 'grand-anse': 0, 'nord-ouest': 0,
            nippes: 0, 'nord-est': 0, diaspora: 0
          }
        }, { merge: true });
        await statsRef.update(statsUpdate);
      }
    }

    return {
      answerId: docRef.id,
      isNew,
      newQuestionCount: newQuestionIds.length
    };
  }
);

/* ============================================================
   resetDailyCounter — fires every day at 00:00 America/Port-au-Prince
   (Haiti local time, DST-aware), zeroes meta/stats.todayCount so the
   homepage "+N aujourd'hui" pill restarts at 0 each Haitian day.
   ============================================================ */
exports.resetDailyCounter = onSchedule(
  { schedule: '0 0 * * *', timeZone: 'America/Port-au-Prince', region: 'us-central1' },
  async () => {
    await db.collection('meta').doc('stats').update({
      todayCount: 0,
      todayResetAt: FieldValue.serverTimestamp()
    });
  }
);
