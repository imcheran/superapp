
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDa_6GgQCHWyEQvMH83SivIZwHKgN9wybc",
  authDomain: "habit-tracker-2026-1.firebaseapp.com",
  projectId: "habit-tracker-2026-1",
  storageBucket: "habit-tracker-2026-1.firebasestorage.app",
  messagingSenderId: "1032071604258",
  appId: "1:1032071604258:web:eaaf482977e528cf58027b",
  measurementId: "G-1EXG2QPY5S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export Auth services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
