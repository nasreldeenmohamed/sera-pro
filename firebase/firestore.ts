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

// ============================================================================
// CV DRAFT FUNCTIONS
// ============================================================================
// Single draft per user stored at /drafts/{userId}
// Contains all CV form data including personal details, experience, education,
// skills, languages, certifications, template selection, and timestamps

export type CvDraftData = {
  fullName: string;
  title?: string;
  summary?: string;
  contact: {
    email?: string;
    phone?: string;
    location?: string;
    website?: string;
  };
  experience: Array<{
    company: string;
    role: string;
    startDate: string;
    endDate?: string;
    description?: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    startDate: string;
    endDate?: string;
  }>;
  skills: string[];
  languages: string[];
  certifications: string[];
  templateKey: string;
  updatedAt?: any; // Firestore Timestamp
  createdAt?: any; // Firestore Timestamp
};

/**
 * Saves or updates a single draft per user at /drafts/{userId}
 * Overwrites existing draft if present (single draft per user policy)
 * @param userId - User's Firebase Auth UID
 * @param draftData - Complete CV form data to save
 * @returns Promise resolving when save is complete
 */
export async function saveUserDraft(userId: string, draftData: CvDraftData): Promise<void> {
  const db = getFirestore(getFirebaseApp());
  const ref = doc(db, "drafts", userId);
  
  const existing = await getDoc(ref);
  const isNew = !existing.exists();
  
  await setDoc(ref, {
    ...draftData,
    ...(isNew ? { createdAt: serverTimestamp() } : {}),
    updatedAt: serverTimestamp(),
  }, { merge: false }); // Overwrite completely (single draft per user)
}

/**
 * Retrieves the user's draft from /drafts/{userId}
 * @param userId - User's Firebase Auth UID
 * @returns Draft data or null if no draft exists
 */
export async function getUserDraft(userId: string): Promise<CvDraftData | null> {
  const db = getFirestore(getFirebaseApp());
  const snapshot = await getDoc(doc(db, "drafts", userId));
  if (!snapshot.exists()) return null;
  return snapshot.data() as CvDraftData;
}

/**
 * Deletes the user's draft from /drafts/{userId}
 * @param userId - User's Firebase Auth UID
 */
export async function deleteUserDraft(userId: string): Promise<void> {
  const db = getFirestore(getFirebaseApp());
  await deleteDoc(doc(db, "drafts", userId));
}


