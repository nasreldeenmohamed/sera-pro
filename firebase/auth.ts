// Lightweight Firebase Auth helpers for email/password flows.
import { getFirebaseApp, isFirebaseConfigured } from "./client";
import {
  getAuth,
  type Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";

let authInstance: Auth | null = null;

export function initializeFirebaseAuth(): Auth | null {
  // Guard: return null if Firebase is not configured instead of throwing
  if (!isFirebaseConfigured()) {
    return null;
  }
  if (!authInstance) {
    try {
      const app = getFirebaseApp();
      authInstance = getAuth(app);
    } catch (error) {
      console.warn("[Firebase Auth] Failed to initialize:", error);
      return null;
    }
  }
  return authInstance;
}

export async function signInWithEmailPassword(email: string, password: string) {
  const auth = initializeFirebaseAuth();
  if (!auth) throw new Error("Firebase is not configured. Please check your environment variables.");
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmailPassword(email: string, password: string) {
  const auth = initializeFirebaseAuth();
  if (!auth) throw new Error("Firebase is not configured. Please check your environment variables.");
  return createUserWithEmailAndPassword(auth, email, password);
}

// Sign in/up using Google popup (client-only)
export async function signInWithGoogle() {
  const auth = initializeFirebaseAuth();
  if (!auth) throw new Error("Firebase is not configured. Please check your environment variables.");
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

// Send password reset email
export async function requestPasswordReset(email: string) {
  const auth = initializeFirebaseAuth();
  if (!auth) throw new Error("Firebase is not configured. Please check your environment variables.");
  return sendPasswordResetEmail(auth, email);
}

// Subscribe to auth state changes
export function subscribeToAuthState(callback: (user: User | null) => void) {
  const auth = initializeFirebaseAuth();
  if (!auth) {
    // Return a no-op unsubscribe function if Firebase is not configured
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function signOutUser() {
  const auth = initializeFirebaseAuth();
  if (!auth) throw new Error("Firebase is not configured. Please check your environment variables.");
  return signOut(auth);
}


