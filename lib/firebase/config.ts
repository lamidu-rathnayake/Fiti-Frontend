import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, browserSessionPersistence, setPersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Use sessionStorage persistence so Brave/Edge tracking prevention
// doesn't block Firebase's default IndexedDB-based auth state.
// Users stay logged in for the browser session (tab/window lifetime).
// On production with a real domain, IndexedDB works and this can be changed
// back to browserLocalPersistence for "stay logged in" behavior.
if (typeof window !== "undefined") {
  setPersistence(auth, browserSessionPersistence).catch(() => {
    // Silently fail — auth still works, it just won't persist across sessions
  });
}

export { app, auth, storage, googleProvider };
