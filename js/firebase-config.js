/* =============================================
   FIREBASE CONFIGURATION
   ============================================= */

let db = null;
let functions = null;

(function initFirebase() {
  if (typeof firebase === 'undefined') {
    console.log('Firebase SDK not loaded — running in local mode');
    return;
  }

  try {
    const firebaseConfig = {
      apiKey: "AIzaSyCK1YOXevEWpRuZ3fzRFooHmw5wWUuwpvg",
      authDomain: "reconciliation-nationale.firebaseapp.com",
      projectId: "reconciliation-nationale",
      storageBucket: "reconciliation-nationale.firebasestorage.app",
      messagingSenderId: "321426413379",
      appId: "1:321426413379:web:93fbc48712ecb0cc55c1f6"
    };

    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    db.enablePersistence({ synchronizeTabs: true }).catch(function() {});

    try {
      // v10 compat: get the default app first, then ask it for the
      // regional functions instance. firebase.functions(region) used to
      // work in v8 but is unreliable in v10.
      const app = firebase.app();
      if (app && typeof app.functions === 'function') {
        functions = app.functions('us-central1');
      } else if (typeof firebase.functions === 'function') {
        functions = firebase.functions('us-central1');
      }
      if (!functions) {
        console.warn('Firebase Functions SDK could not be initialized');
      }
    } catch (e) {
      console.warn('Functions init error:', e && e.message);
    }
    console.log('Firebase connected', { db: !!db, functions: !!functions });
  } catch (e) {
    console.warn('Firebase init failed:', e.message);
  }
})();
