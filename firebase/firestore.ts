// Firestore helpers to store user CVs in a collection.
import { getFirebaseApp } from "./client";
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, where, deleteDoc, doc, getDoc, updateDoc, setDoc, orderBy, Timestamp } from "firebase/firestore";

/**
 * Subscription object embedded in user profile
 * Tracks user's plan, status, and billing information
 */
export type UserSubscription = {
  plan: "free" | "one_time" | "flex_pack" | "annual_pass";
  status: "active" | "inactive" | "cancelled" | "expired";
  startDate: any; // Firestore Timestamp
  expirationDate?: any; // Firestore Timestamp - when subscription expires (not set for free plan - never expires)
  renewalDate?: any; // Firestore Timestamp (for recurring plans)
  paymentMethod?: string; // Payment method identifier
  lastPaymentDate?: any; // Firestore Timestamp
  nextBillingDate?: any; // Firestore Timestamp (for recurring plans)
  creditsRemaining?: number; // For flex_pack plans
  validUntil?: any; // Firestore Timestamp (for time-limited plans)
};

// User profile type with embedded subscription
export type UserProfile = {
  name: string;
  phone?: string;
  email: string;
  createdAt?: any;
  updatedAt?: any;
  subscription?: UserSubscription; // Subscription object nested in profile
};

/**
 * Create or update user profile in Firestore
 * 
 * Stores profile data in /userProfiles/{uid} collection.
 * On first creation, initializes a default "free" subscription.
 * Subsequent updates preserve existing subscription data (unless explicitly provided).
 * 
 * @param userId - User's Firebase Auth UID
 * @param profile - Profile data to save (name, phone, email)
 * @param subscription - Optional subscription data (if provided, updates subscription)
 */
export async function saveUserProfile(
  userId: string, 
  profile: { name: string; phone?: string; email: string },
  subscription?: Partial<UserSubscription>
) {
  const db = getFirestore(getFirebaseApp());
  const ref = doc(db, "userProfiles", userId);
  
  // Check if profile already exists
  const existing = await getDoc(ref);
  const isNew = !existing.exists();
  
  // Get existing subscription if profile exists, or create default subscription for new users
  let subscriptionData: UserSubscription;
  
  if (isNew) {
    // Initialize default "free" subscription for new users
    // Free plan: Never expires (no expirationDate)
    subscriptionData = {
      plan: "free",
      status: "active",
      startDate: serverTimestamp(),
      // expirationDate is not set for free plans - they never expire
    };
  } else {
    // Preserve existing subscription or merge with provided updates
    const existingData = existing.data() as UserProfile;
    const existingSubscription = existingData.subscription;
    
    if (subscription) {
      // Update subscription with provided data
      const planType = subscription.plan || existingSubscription?.plan || "free";
      
      subscriptionData = {
        plan: planType,
        status: subscription.status || existingSubscription?.status || "active",
        startDate: subscription.startDate || existingSubscription?.startDate || serverTimestamp(),
        // Free plan never expires - don't set expirationDate
        // Other plans use provided expirationDate or existing one
        expirationDate: planType === "free" 
          ? undefined // Free plan never expires
          : (subscription.expirationDate ?? existingSubscription?.expirationDate),
        renewalDate: subscription.renewalDate ?? existingSubscription?.renewalDate,
        paymentMethod: subscription.paymentMethod ?? existingSubscription?.paymentMethod,
        lastPaymentDate: subscription.lastPaymentDate ?? existingSubscription?.lastPaymentDate,
        nextBillingDate: subscription.nextBillingDate ?? existingSubscription?.nextBillingDate,
        creditsRemaining: subscription.creditsRemaining ?? existingSubscription?.creditsRemaining,
        validUntil: subscription.validUntil ?? existingSubscription?.validUntil,
      };
    } else {
      // Keep existing subscription unchanged
      subscriptionData = existingSubscription || {
        plan: "free",
        status: "active",
        startDate: existingData.createdAt || serverTimestamp(),
        // Free plan never expires - no expirationDate
      };
    }
  }
  
  await setDoc(ref, {
    ...profile,
    subscription: subscriptionData,
    ...(isNew ? { createdAt: serverTimestamp() } : {}),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Get user profile from Firestore
 * 
 * @param userId - User's Firebase Auth UID
 * @returns UserProfile or null if not found
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const db = getFirestore(getFirebaseApp());
  const snapshot = await getDoc(doc(db, "userProfiles", userId));
  if (!snapshot.exists()) return null;
  return snapshot.data() as UserProfile;
}

/**
 * Check and update subscription status based on expiration date
 * 
 * Compares current date/time against subscription.expirationDate:
 * - Free plan: Never expires, always returns "active"
 * - Other plans: If now ≤ expirationDate: Set status as "active"
 * - Other plans: If now > expirationDate: Set status to "expired"
 * 
 * Updates Firestore document if status needs to change.
 * 
 * @param userId - User's Firebase Auth UID
 * @returns Updated subscription status ("active" | "expired")
 */
export async function checkAndUpdateSubscriptionStatus(userId: string): Promise<"active" | "expired"> {
  const profile = await getUserProfile(userId);
  if (!profile || !profile.subscription) {
    return "active"; // Default to active if no subscription
  }

  const subscription = profile.subscription;
  
  // Free plan never expires - always return active
  if (subscription.plan === "free") {
    // Ensure status is active for free plans (in case it was incorrectly set)
    if (subscription.status !== "active") {
      const db = getFirestore(getFirebaseApp());
      const profileRef = doc(db, "userProfiles", userId);
      await updateDoc(profileRef, {
        "subscription.status": "active",
        updatedAt: serverTimestamp(),
      });
      console.log(`[Subscription] Fixed free plan status for user ${userId}: ${subscription.status} -> active`);
    }
    return "active";
  }
  
  // For paid plans, check expiration date
  if (!subscription.expirationDate) {
    // No expiration date for paid plan means it doesn't expire (active)
    return "active";
  }

  const now = new Date();
  
  // Convert Firestore Timestamp to JavaScript Date if needed
  let expirationDate: Date;
  if (subscription.expirationDate.toDate) {
    // Firestore Timestamp
    expirationDate = subscription.expirationDate.toDate();
  } else if (subscription.expirationDate instanceof Date) {
    expirationDate = subscription.expirationDate;
  } else if (typeof subscription.expirationDate === "string") {
    expirationDate = new Date(subscription.expirationDate);
  } else if (subscription.expirationDate.seconds) {
    // Firestore Timestamp format { seconds, nanoseconds }
    expirationDate = new Date(subscription.expirationDate.seconds * 1000);
  } else {
    // Fallback: assume it's valid (active)
    return "active";
  }

  // Compare dates
  const isExpired = now > expirationDate;
  const newStatus = isExpired ? "expired" : "active";

  // Update Firestore if status changed
  if (subscription.status !== newStatus) {
    const db = getFirestore(getFirebaseApp());
    const profileRef = doc(db, "userProfiles", userId);
    
    await updateDoc(profileRef, {
      "subscription.status": newStatus,
      updatedAt: serverTimestamp(),
    });
    
    console.log(`[Subscription] Updated status for user ${userId}: ${subscription.status} -> ${newStatus}`);
  }

  return newStatus;
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

/**
 * UserCv type - Represents a CV stored in Firestore
 * 
 * Structure: /drafts/{userId}/cvs/{cvId}
 * Each user can have multiple CVs stored as sub-documents
 */
export type UserCv = {
  id: string;
  fullName: string;
  summary: string;
  title?: string;
  templateKey?: string;
  cvLanguage?: "ar" | "en";
  createdAt?: any;
  updatedAt?: any;
       // Include all CvDraftData fields for compatibility
       contact?: {
         email?: string;
         phone?: string;
         location?: string;
         website?: string;
       };
       experience?: Array<{
         company: string;
         role: string;
         startDate: string;
         endDate?: string;
         description?: string;
       }>;
       projects?: Array<{
         title: string;
         startDate: string;
         endDate?: string;
         description?: string;
       }>;
       education?: Array<{
         school: string;
         degree: string;
         startDate: string;
         endDate?: string;
       }>;
       skills?: string[];
       languages?: string[];
       certifications?: string[];
     };

/**
 * List all CVs for a user from /drafts/{userId}/ sub-collection
 * 
 * @param userId - User's Firebase Auth UID
 * @returns Array of CV documents sorted by updatedAt (newest first)
 */
export async function listUserCvs(userId: string): Promise<UserCv[]> {
  const db = getFirestore(getFirebaseApp());
  // Query sub-collection: /drafts/{userId}/
  const ref = collection(db, "drafts", userId, "cvs");
  // Order by updatedAt descending (most recently updated first)
  const q = query(ref, orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ 
    id: d.id, 
    ...(d.data() as any) 
  }));
}

/**
 * Get the first (most recent) CV ID for a user
 * 
 * Used for free/one_time plans where users can only have one CV.
 * CVs are sorted by updatedAt descending, so this returns the most recently updated CV ID.
 * 
 * @param userId - User's Firebase Auth UID
 * @returns First CV ID or null if no CVs exist
 */
export async function getFirstCvId(userId: string): Promise<string | null> {
  const cvs = await listUserCvs(userId);
  if (cvs.length === 0) return null;
  return cvs[0].id;
}

/**
 * Delete a CV from /drafts/{userId}/{cvId}
 * 
 * @param userId - User's Firebase Auth UID
 * @param cvId - CV document ID to delete
 */
export async function deleteUserCv(userId: string, cvId: string) {
  // TODO(authz): ensure cv belongs to user on server-side when adding API endpoints
  const db = getFirestore(getFirebaseApp());
  // Delete from sub-collection: /drafts/{userId}/cvs/{cvId}
  await deleteDoc(doc(db, "drafts", userId, "cvs", cvId));
}

/**
 * Get a specific CV from /drafts/{userId}/cvs/{cvId}
 * 
 * @param userId - User's Firebase Auth UID
 * @param cvId - CV document ID
 * @returns CV data or null if not found
 */
export async function getUserCv(userId: string, cvId: string): Promise<UserCv | null> {
  const db = getFirestore(getFirebaseApp());
  // Fetch from sub-collection: /drafts/{userId}/cvs/{cvId}
  const snapshot = await getDoc(doc(db, "drafts", userId, "cvs", cvId));
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as any;
  // No need to check userId since path already enforces ownership
  return { id: snapshot.id, ...data } as UserCv;
}

/**
 * Update an existing CV in /drafts/{userId}/cvs/{cvId}
 * 
 * @param userId - User's Firebase Auth UID
 * @param cvId - CV document ID to update
 * @param payload - Partial CV data to update
 */
export async function updateCvDraft(userId: string, cvId: string, payload: Partial<CvDraftData> & Record<string, any>) {
  const db = getFirestore(getFirebaseApp());
  // Update in sub-collection: /drafts/{userId}/cvs/{cvId}
  const ref = doc(db, "drafts", userId, "cvs", cvId);
  // TODO(authz): validate ownership server-side for production
  await updateDoc(ref, { 
    ...payload, 
    updatedAt: serverTimestamp() 
  });
}

/**
 * UserPlan type - Legacy compatibility type
 * 
 * Now reads from subscription object in user profile.
 * This type is maintained for backward compatibility with existing code.
 */
export type UserPlan = {
  planType: "free" | "one_time" | "flex_pack" | "annual_pass";
  creditsRemaining?: number; // for flex pack
  validUntil?: any; // Timestamp for time-limited windows (one-time edit period or annual renewal)
  lastPurchaseDate?: any;
};

/**
 * Get user's plan information
 * 
 * Reads from subscription object in user profile document.
 * Falls back to "free" plan if no subscription exists.
 * 
 * @param userId - User's Firebase Auth UID
 * @returns UserPlan object or null if profile doesn't exist
 */
export async function getUserPlan(userId: string): Promise<UserPlan | null> {
  const profile = await getUserProfile(userId);
  if (!profile) return null;
  
  // Read from subscription object in profile
  const subscription = profile.subscription;
  if (!subscription) {
    // Return default free plan if no subscription exists
    return {
      planType: "free",
      creditsRemaining: undefined,
      validUntil: undefined,
      lastPurchaseDate: undefined,
    };
  }
  
  // Convert subscription to UserPlan format for backward compatibility
  return {
    planType: subscription.plan,
    creditsRemaining: subscription.creditsRemaining,
    validUntil: subscription.validUntil,
    lastPurchaseDate: subscription.lastPaymentDate,
  };
}

/**
 * Update user's subscription after payment
 * 
 * Updates the subscription object in the user's profile document.
 * Sets plan, credits, and billing information based on purchased product.
 * 
 * @param userId - User's Firebase Auth UID
 * @param product - Product type purchased: "one_time" | "flex_pack" | "annual_pass"
 */
export async function setUserPlanFromProduct(userId: string, product: "one_time" | "flex_pack" | "annual_pass") {
  const db = getFirestore(getFirebaseApp());
  const profileRef = doc(db, "userProfiles", userId);
  const now = serverTimestamp();
  
  // Get existing profile to preserve other fields
  const existing = await getDoc(profileRef);
  const existingData = existing.exists() ? (existing.data() as UserProfile) : null;
  const existingSubscription = existingData?.subscription;
  
  // Prepare subscription update based on product type
  let subscriptionUpdate: Partial<UserSubscription>;
  
  const nowMs = Date.now();
  
  if (product === "flex_pack") {
    // Flex Pack: 6 months validity
    const sixMonthsInMs = 6 * 30 * 24 * 60 * 60 * 1000;
    const expirationDate = Timestamp.fromMillis(nowMs + sixMonthsInMs);
    
    subscriptionUpdate = {
      plan: "flex_pack",
      status: "active",
      creditsRemaining: 5,
      lastPaymentDate: now,
      startDate: existingSubscription?.startDate || now,
      expirationDate: expirationDate,
    };
  } else if (product === "one_time") {
    // One-time purchase: 7-day validity period
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const expirationDate = Timestamp.fromMillis(nowMs + sevenDaysInMs);
    
    subscriptionUpdate = {
      plan: "one_time",
      status: "active",
      // Omit creditsRemaining - only flex_pack uses credits
      validUntil: expirationDate,
      lastPaymentDate: now,
      startDate: existingSubscription?.startDate || now,
      expirationDate: expirationDate,
    };
  } else if (product === "annual_pass") {
    // Annual Pass: 1 year validity
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    const expirationDate = Timestamp.fromMillis(nowMs + oneYearInMs);
    const renewalDate = Timestamp.fromMillis(nowMs + oneYearInMs);
    const nextBillingDate = Timestamp.fromMillis(nowMs + oneYearInMs);
    
    subscriptionUpdate = {
      plan: "annual_pass",
      status: "active",
      // Omit creditsRemaining - only flex_pack uses credits
      lastPaymentDate: now,
      renewalDate: renewalDate,
      nextBillingDate: nextBillingDate,
      startDate: existingSubscription?.startDate || now,
      expirationDate: expirationDate,
    };
  } else {
    throw new Error(`Invalid product type: ${product}`);
  }
  
  // Merge subscription update with existing subscription
  // Remove any undefined values before updating Firestore
  const updatedSubscription: UserSubscription = {
    ...(existingSubscription || {
      plan: "free",
      status: "active",
      startDate: now,
    }),
    ...subscriptionUpdate,
  };
  
  // Clean up undefined values from subscription object (Firestore doesn't accept undefined)
  const cleanedSubscription: any = {};
  Object.keys(updatedSubscription).forEach((key) => {
    const value = (updatedSubscription as any)[key];
    if (value !== undefined) {
      cleanedSubscription[key] = value;
    }
  });
  
  // Update profile with new subscription (use cleaned subscription without undefined values)
  await updateDoc(profileRef, {
    subscription: cleanedSubscription as UserSubscription,
    updatedAt: serverTimestamp(),
  }).catch(async () => {
    // If profile doesn't exist, create it (shouldn't happen but handle gracefully)
    if (!existingData) {
      throw new Error(`User profile not found for userId: ${userId}. Please ensure profile is created during registration.`);
    }
    // Retry with setDoc if updateDoc fails
    await setDoc(profileRef, {
      ...existingData,
      subscription: cleanedSubscription as UserSubscription,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });
}

// ============================================================================
// CV DRAFT FUNCTIONS - Multiple CVs per user structure
// ============================================================================
// Multiple CVs per user stored at /drafts/{userId}/cvs/{cvId}
// Each CV is a separate document with auto-generated ID
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
  projects?: Array<{
    title: string;
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
  cvLanguage: "ar" | "en"; // Language of the CV content (not the UI locale)
  updatedAt?: any; // Firestore Timestamp
  createdAt?: any; // Firestore Timestamp
};

/**
 * Clean undefined values and empty strings from optional fields recursively
 * Firestore doesn't accept undefined values - they must be omitted
 * For optional fields (endDate, description), empty strings are treated as undefined and omitted
 * 
 * @param obj - Data object to clean
 * @returns Cleaned object with undefined values and empty optional strings removed
 */
function cleanUndefinedValues(obj: any): any {
  if (obj === null) {
    return null;
  }
  
  if (obj === undefined) {
    return undefined; // Will be skipped in object processing
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefinedValues(item));
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        // Skip undefined values entirely
        if (value === undefined) {
          continue;
        }
        
        // For optional fields in projects/experience/education, skip empty strings
        const optionalFields = ['endDate', 'description'];
        if (optionalFields.includes(key) && value === '') {
          continue; // Omit empty optional fields
        }
        
        const cleanedValue = cleanUndefinedValues(value);
        // Only add if cleaned value is not undefined
        if (cleanedValue !== undefined) {
          cleaned[key] = cleanedValue;
        }
      }
    }
    return cleaned;
  }
  
  return obj;
}

/**
 * Save or update a CV draft in /drafts/{userId}/cvs/{cvId}
 * 
 * PLAN-AWARE SAVING:
 * This function is called with plan-aware logic from the create-cv page:
 * - For free/one_time plans: cvId should be set to the first CV ID (if exists) to reuse the document
 * - For flex_pack/annual_pass plans: cvId can be null (create new) or specific ID (update existing)
 * 
 * PLAN TRANSITIONS:
 * When a user upgrades/downgrades their plan:
 * - Downgrade to free/one_time: Subsequent saves will reuse the first CV document
 * - Upgrade to flex_pack/annual_pass: Users can create new CV documents (up to plan limits)
 * 
 * Note: Plan checking is handled by the caller (create-cv page), not this function.
 * This function simply saves/updates based on the provided cvId.
 * 
 * @param userId - User's Firebase Auth UID
 * @param draftData - Complete CV form data to save
 * @param cvId - Optional CV ID. If provided, updates existing CV. If null/undefined, creates new CV.
 * @returns Promise resolving with the CV document ID
 */
export async function saveUserDraft(userId: string, draftData: CvDraftData, cvId?: string | null): Promise<string> {
  const db = getFirestore(getFirebaseApp());
  
  // Clean undefined values before saving (Firestore doesn't accept undefined)
  const cleanedData = cleanUndefinedValues(draftData);
  
  if (cvId) {
    // Update existing CV in sub-collection: /drafts/{userId}/cvs/{cvId}
    const ref = doc(db, "drafts", userId, "cvs", cvId);
    await updateDoc(ref, {
      ...cleanedData,
      updatedAt: serverTimestamp(),
    });
    return cvId;
  } else {
    // Create new CV in sub-collection: /drafts/{userId}/cvs/{autoId}
    const ref = collection(db, "drafts", userId, "cvs");
    const newDoc = await addDoc(ref, {
      ...cleanedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return newDoc.id;
  }
}

/**
 * Retrieves the first/only CV draft for a user (legacy compatibility)
 * Used for free/single CV plans to get their one allowed CV
 * 
 * @param userId - User's Firebase Auth UID
 * @returns First CV draft data or null if no CV exists
 */
export async function getUserDraft(userId: string): Promise<CvDraftData | null> {
  const cvs = await listUserCvs(userId);
  if (cvs.length === 0) return null;
  // Return the first (most recently updated) CV
  const firstCv = cvs[0];
  // Convert UserCv to CvDraftData format
  return {
    fullName: firstCv.fullName || "",
    title: firstCv.title,
    summary: firstCv.summary || "",
    contact: firstCv.contact || { email: "", phone: "", location: "", website: "" },
    experience: firstCv.experience || [],
    projects: firstCv.projects || [],
    education: firstCv.education || [],
    skills: firstCv.skills || [],
    languages: firstCv.languages || [],
    certifications: firstCv.certifications || [],
    templateKey: firstCv.templateKey || "classic",
    cvLanguage: firstCv.cvLanguage || "en",
    createdAt: firstCv.createdAt,
    updatedAt: firstCv.updatedAt,
  };
}

/**
 * Get a specific CV draft by ID from /drafts/{userId}/cvs/{cvId}
 * 
 * @param userId - User's Firebase Auth UID
 * @param cvId - CV document ID
 * @returns CV draft data or null if not found
 */
export async function getUserDraftById(userId: string, cvId: string): Promise<CvDraftData | null> {
  const cv = await getUserCv(userId, cvId);
  if (!cv) return null;
  
  // Convert UserCv to CvDraftData format
  return {
    fullName: cv.fullName || "",
    title: cv.title,
    summary: cv.summary || "",
    contact: cv.contact || { email: "", phone: "", location: "", website: "" },
    experience: cv.experience || [],
    projects: cv.projects || [],
    education: cv.education || [],
    skills: cv.skills || [],
    languages: cv.languages || [],
    certifications: cv.certifications || [],
    templateKey: cv.templateKey || "classic",
    cvLanguage: cv.cvLanguage || "en",
    createdAt: cv.createdAt,
    updatedAt: cv.updatedAt,
  };
}

/**
 * Deletes the user's first/only draft (legacy compatibility)
 * For free/single CV plans
 * 
 * @param userId - User's Firebase Auth UID
 */
export async function deleteUserDraft(userId: string): Promise<void> {
  const cvs = await listUserCvs(userId);
  if (cvs.length > 0) {
    await deleteUserCv(userId, cvs[0].id);
  }
}


