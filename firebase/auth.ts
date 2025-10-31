// Lightweight Firebase Auth helpers for email/password flows.
import { getFirebaseApp, isFirebaseConfigured } from "./client";
import {
  getAuth,
  type Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
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

// Sign in/up using Google redirect (client-only)
// Google authentication is enabled in Firebase Console
// This function handles both new user registration and existing user sign-in
// Uses redirect instead of popup to avoid Cross-Origin-Opener-Policy (COOP) issues
// After redirect, use getGoogleRedirectResult() to get the UserCredential
export async function signInWithGoogle() {
  // Only run in browser
  if (typeof window === "undefined") {
    throw new Error("signInWithGoogle can only be called in the browser");
  }
  
  // Check Firebase configuration first
  if (!isFirebaseConfigured()) {
    const missingVars = [
      !process.env.NEXT_PUBLIC_FIREBASE_API_KEY && "NEXT_PUBLIC_FIREBASE_API_KEY",
      !process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN && "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
      !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
      !process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET && "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
      !process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID && "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
      !process.env.NEXT_PUBLIC_FIREBASE_APP_ID && "NEXT_PUBLIC_FIREBASE_APP_ID",
    ].filter(Boolean);
    
    throw new Error(
      `Firebase is not configured. Missing environment variables: ${missingVars.join(", ")}. ` +
      `Please add these to your .env.local file. See ENV_EXAMPLE.txt for reference.`
    );
  }
  
  let auth = initializeFirebaseAuth();
  if (!auth) {
    // This shouldn't happen if isFirebaseConfigured() is true, but handle gracefully
    // Try to initialize directly if the cached instance is missing
    try {
      const app = getFirebaseApp();
      authInstance = getAuth(app);
      auth = authInstance;
    } catch (error: any) {
      throw new Error(
        `Failed to initialize Firebase Auth: ${error?.message || "Unknown error"}. ` +
        `Please check your Firebase configuration in .env.local.`
      );
    }
  }
  const provider = new GoogleAuthProvider();
  // Optional: Add additional scopes if needed (e.g., profile, email)
  // provider.addScope('profile');
  // provider.addScope('email');
  // Use redirect instead of popup to avoid COOP issues
  console.log("[Firebase Auth] Initiating Google sign-in redirect...");
  console.log("[Firebase Auth] Current URL:", window.location.href);
  await signInWithRedirect(auth, provider);
  // Note: After this call, the page will redirect to Google's sign-in page
  // The user will be redirected back to the same page after authentication
  // Use getGoogleRedirectResult() in a useEffect to handle the result
}

// Get the result after Google redirect authentication
// Call this after the page redirects back from Google sign-in
// Returns UserCredential if successful, null if no redirect result
export async function getGoogleRedirectResult() {
  // Only run in browser
  if (typeof window === "undefined") {
    console.warn("[Firebase Auth] getGoogleRedirectResult called on server, returning null");
    return null;
  }
  
  const auth = initializeFirebaseAuth();
  if (!auth) {
    console.warn("[Firebase Auth] Auth not initialized, cannot get redirect result");
    return null;
  }
  try {
    console.log("[Firebase Auth] Calling getRedirectResult...");
    console.log("[Firebase Auth] Auth instance:", auth ? "initialized" : "null");
    console.log("[Firebase Auth] Current user before getRedirectResult:", auth.currentUser?.uid || "none");
    
    const result = await getRedirectResult(auth);
    
    if (result) {
      console.log("[Firebase Auth] ✅ Redirect result received:", {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        isNewUser: result.user.metadata.creationTime === result.user.metadata.lastSignInTime,
      });
      console.log("[Firebase Auth] User metadata:", {
        creationTime: result.user.metadata.creationTime,
        lastSignInTime: result.user.metadata.lastSignInTime,
      });
    } else {
      console.log("[Firebase Auth] ℹ️ No redirect result found (normal if not returning from redirect)");
      console.log("[Firebase Auth] Current user after getRedirectResult:", auth.currentUser?.uid || "none");
    }
    return result;
  } catch (error: any) {
    console.error("[Firebase Auth] ❌ Redirect result error:", error);
    console.error("[Firebase Auth] Error code:", error?.code);
    console.error("[Firebase Auth] Error message:", error?.message);
    console.error("[Firebase Auth] Error stack:", error?.stack);
    // Re-throw to allow callers to handle errors
    throw error;
  }
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


