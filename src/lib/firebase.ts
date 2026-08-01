import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration from firebase-applet-config.json
const firebaseConfig = {
  projectId: "effective-racer-t3kpg",
  appId: "1:971678095923:web:438b37085aee07d5ce6146",
  apiKey: "AIzaSyA7yoLk7Ui_2H3LkPoSVNmh6DLdPzL8fP8",
  authDomain: "effective-racer-t3kpg.firebaseapp.com",
  storageBucket: "effective-racer-t3kpg.firebasestorage.app",
  messagingSenderId: "971678095923"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, "ai-studio-adec457a-8583-4ada-84c2-6aaf4e3a1b70");
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Configure provider to prompt for account selection
googleProvider.setCustomParameters({
  prompt: "select_account"
});

export {
  auth,
  db,
  storage,
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged
};

