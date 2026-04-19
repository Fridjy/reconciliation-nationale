/* =============================================
   FIREBASE CONFIGURATION
   ============================================= */

let db = null;

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
    console.log('Firebase connected');
  } catch (e) {
    console.warn('Firebase init failed:', e.message);
  }
})();
