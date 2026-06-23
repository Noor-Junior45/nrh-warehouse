import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDbiP3m08nZu1yXVVczD4j9d11Gw5p3feU",
  authDomain: "noorwaerhouse.firebaseapp.com",
  projectId: "noorwaerhouse",
  storageBucket: "noorwaerhouse.firebasestorage.app",
  messagingSenderId: "926801990682",
  appId: "1:926801990682:web:076c80b7be963a96966da3",
  measurementId: "G-6E2E2D3QSX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth and Firestore if needed by other components
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics is only supported in browser environment and sometimes disabled in frames
export let analytics: any = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch((err) => {
  console.warn("Firebase Analytics not supported in this environment:", err);
});

export default app;
