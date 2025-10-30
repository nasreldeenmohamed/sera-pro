// Firestore helpers to store user CVs in a collection.
import { getFirebaseApp } from "./client";
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, where, deleteDoc, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";

// User profile type
export type UserProfile = {
  name: string;
  phone?: string;
  email: string;
  createdAt?: any;
  updatedAt?: any;
};

// Create or update user profile in Firestore
// Stores profile data in userProfiles/{uid} collection
export async function saveUserProfile(userId: string, profile: { name: string; phone?: string; email: string }) {
  const db = getFirestore(getFirebaseApp());
  const ref = doc(db, "userProfiles", userId);
  
  // Check if profile already exists
  const existing = await getDoc(ref);
  const isNew = !existing.exists();
  
  await setDoc(ref, {
    ...profile,
    ...(isNew ? { createdAt: serverTimestamp() } : {}),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// Get user profile from Firestore
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const db = getFirestore(getFirebaseApp());
  const snapshot = await getDoc(doc(db, "userProfiles", userId));
  if (!snapshot.exists()) return null;
  return snapshot.data() as UserProfile;
}

export async function saveCvDraft(userId: string, payload: { fullName: string; summary: string }) {
  const db = getFirestore(getFirebaseApp());
  const ref = collection(db, "cvDrafts");
  return addDoc(ref, {
    userId,
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export type UserCv = {
  id: string;
  fullName: string;
  summary: string;
  createdAt?: any;
  updatedAt?: any;
};

export async function listUserCvs(userId: string): Promise<UserCv[]> {
  const db = getFirestore(getFirebaseApp());
  const ref = collection(db, "cvDrafts");
  const q = query(ref, where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

export async function deleteUserCv(userId: string, cvId: string) {
  // TODO(authz): ensure cv belongs to user on server-side when adding API endpoints
  const db = getFirestore(getFirebaseApp());
  await deleteDoc(doc(db, "cvDrafts", cvId));
}

export async function getUserCv(userId: string, cvId: string): Promise<UserCv | null> {
  const db = getFirestore(getFirebaseApp());
  const snapshot = await getDoc(doc(db, "cvDrafts", cvId));
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as any;
  if (data.userId !== userId) return null;
  return { id: snapshot.id, ...data } as UserCv;
}

export async function updateCvDraft(userId: string, cvId: string, payload: Partial<UserCv> & Record<string, any>) {
  const db = getFirestore(getFirebaseApp());
  const ref = doc(db, "cvDrafts", cvId);
  // TODO(authz): validate ownership server-side for production
  await updateDoc(ref, { ...payload, userId, updatedAt: serverTimestamp() });
}

// Canonical plan fields written by payment flows (TODO: write after checkout)
export type UserPlan = {
  planType: "free" | "one_time" | "flex_pack" | "annual_pass";
  creditsRemaining?: number; // for flex pack
  validUntil?: any; // Timestamp for time-limited windows (one-time edit period or annual renewal)
  lastPurchaseDate?: any;
};

export async function getUserPlan(userId: string): Promise<UserPlan | null> {
  const db = getFirestore(getFirebaseApp());
  const planDoc = await getDoc(doc(db, "userPlans", userId));
  if (!planDoc.exists()) return null;
  return planDoc.data() as any;
}

// Upserts user's plan after payment. Server-only usage recommended in real flow.
export async function setUserPlanFromProduct(userId: string, product: "one_time" | "flex_pack" | "annual_pass") {
  const db = getFirestore(getFirebaseApp());
  const ref = doc(db, "userPlans", userId);
  const now = serverTimestamp();
  // Simplified rules; TODO(payment): set real validity based on transaction details
  if (product === "flex_pack") {
    await updateDoc(ref, {
      planType: "flex_pack",
      creditsRemaining: 5,
      validUntil: null,
      lastPurchaseDate: now,
    }).catch(async () => {
      await setDoc(ref, { planType: "flex_pack", creditsRemaining: 5, validUntil: null, lastPurchaseDate: now } as any);
    });
  } else if (product === "one_time") {
    // 14-day window placeholder; TODO: server sets exact timestamp
    await updateDoc(ref, {
      planType: "one_time",
      creditsRemaining: null,
      validUntil: null,
      lastPurchaseDate: now,
    }).catch(async () => {
      await setDoc(ref, { planType: "one_time", creditsRemaining: null, validUntil: null, lastPurchaseDate: now } as any);
    });
  } else if (product === "annual_pass") {
    await updateDoc(ref, {
      planType: "annual_pass",
      creditsRemaining: null,
      validUntil: null,
      lastPurchaseDate: now,
    }).catch(async () => {
      await setDoc(ref, { planType: "annual_pass", creditsRemaining: null, validUntil: null, lastPurchaseDate: now } as any);
    });
  }
}


