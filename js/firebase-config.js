/* =============================================
   FIREBASE CONFIGURATION

   Replace the config below with your own Firebase
   project credentials from:
   https://console.firebase.google.com → Project Settings

   While the config is not set, the site works
   in offline/local mode using in-memory data.
   ============================================= */

let db = null;

(function initFirebase() {
  // Guard: if Firebase SDK didn't load, skip entirely
  if (typeof firebase === 'undefined') {
    console.log('Firebase SDK not loaded — running in local mode');
    return;
  }

  try {
    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_PROJECT.firebaseapp.com",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_PROJECT.appspot.com",
      messagingSenderId: "000000000000",
      appId: "YOUR_APP_ID"
    };

    // Only initialize if real config is provided
    if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
      firebase.initializeApp(firebaseConfig);
      db = firebase.firestore();
      db.enablePersistence({ synchronizeTabs: true }).catch(function() {});
      console.log('Firebase connected');
    } else {
      console.log('Firebase not configured — running in local mode');
    }
  } catch (e) {
    console.warn('Firebase init failed:', e.message);
  }
})();
