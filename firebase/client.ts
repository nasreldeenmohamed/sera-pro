// Initializes Firebase app on the client using environment variables.
// Ensure you provide values in .env.local based on .env.local.example
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  // Optional analytics
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
} as const;

// Validate presence of required envs so we can avoid runtime crashes in dev
const requiredEnvValues = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
];

export function isFirebaseConfigured(): boolean {
  return requiredEnvValues.every(Boolean);
}

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase env vars are missing. Fill .env.local using ENV_EXAMPLE.txt."
    );
  }
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApps()[0]!;
}

// Optionally expose a helper to get Analytics in the browser only.
export async function getFirebaseAnalytics() {
  if (typeof window === "undefined") return null;
  if (!isFirebaseConfigured()) return null;
  try {
    const { getAnalytics } = await import("firebase/analytics");
    return getAnalytics(getFirebaseApp());
  } catch {
    return null;
  }
}


