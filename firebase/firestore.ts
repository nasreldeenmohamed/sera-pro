// Firestore helpers to store user CVs in a collection.
import { getFirebaseApp } from "./client";
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, where, deleteDoc, doc, getDoc, updateDoc, setDoc, orderBy, Timestamp, writeBatch } from "firebase/firestore";

/**
 * Subscription History Entry
 * Tracks each successful payment/activation for audit trail, upgrades, and downgrades
 */
export type SubscriptionHistoryEntry = {
  transactionId: string; // Reference to transaction document
  plan: "one_time" | "flex_pack" | "annual_pass"; // Plan activated
  activatedAt: any; // Firestore Timestamp - when subscription was activated
  validUntil: any; // Firestore Timestamp - when this subscription expires
  amount: string; // Payment amount
  currency: string; // Payment currency
  trxReferenceNumber?: string; // Payment gateway transaction reference
};

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
  subscriptionHistory?: SubscriptionHistoryEntry[]; // Array of subscription activations for audit trail
};

// User profile type with embedded subscription
export type UserProfile = {
  name: string;
  phone?: string;
  email: string;
  createdAt?: any;
  updatedAt?: any;
  subscription?: UserSubscription; // Subscription object nested in profile
  lastTransactionId?: string; // Reference to the most recent successful transaction
};

/**
 * Transaction Entity - Firestore Model for Payment Tracking
 * 
 * Stores all payment transaction data in /transactions/{transactionId} collection.
 * Used for payment tracking, reporting, and audit trails.
 * 
 * Field Mappings from Payment Gateway Callback:
 * - trxReferenceNumber: Extracted from payment gateway callback URL or response (unique payment reference)
 * - merchantOrderId: Payment gateway merchant order ID (from orderId parameter in checkout)
 * - orderId: Internal order ID used when creating checkout
 * - orderReference: Additional reference from payment gateway (if provided)
 * - cardDataToken: Tokenized card data from payment gateway (for recurring payments, if applicable)
 * - maskedCard: Masked card number (e.g., "****1234") from payment gateway response
 * - cardBrand: Card brand (e.g., "VISA", "MASTERCARD") from payment gateway response
 * - signature: Payment signature/hash from payment gateway for verification
 * - mode: "test" or "live" - indicates which payment gateway environment was used
 * 
 * Payment Status Values:
 * - "1" = pending (initial state when transaction is created)
 * - "2" = success (payment completed successfully)
 * - "3" = failed (payment failed or was cancelled)
 * 
 * Collection Structure: /transactions/{transactionId}
 * - transactionId is the unique document ID (auto-generated or custom)
 * - Supports queries by userId, paymentStatus, createdAt, subscriptionPlanId
 */
export type Transaction = {
  // Unique transaction identifier (document ID in Firestore)
  transactionId: string;
  
  // Subscription Plan Information
  subscriptionPlanId: string; // Plan identifier: "one_time", "flex_pack", "annual_pass"
  subscriptionPlanName: string; // Human-readable plan name (e.g., "One-Time Purchase", "Flex Pack")
  subscriptionPlanPrice: string; // Plan price as string (e.g., "49", "149", "299")
  subscriptionPlanDuration: string; // Duration value (e.g., "7", "6", "12")
  subscriptionPlanDurationType: string; // Duration unit: "days", "months", "year"
  subscriptionPlanDescription: string; // Plan description/features
  
  // User Information
  userId: string; // Firebase Auth UID
  userEmail: string; // User's email address
  userName: string; // User's display name
  userPhone?: string; // User's phone number (optional)
  
  // Payment Amount & Currency
  transactionAmount: string; // Amount as string (e.g., "49.00")
  transactionCurrency: string; // Currency code (e.g., "EGP")
  
  // Payment Status
  // Values: "1" = pending, "2" = success, "3" = failed
  paymentStatus: "1" | "2" | "3";
  
  // Language preference
  language: string; // UI language at time of transaction: "ar" or "en"
  
  // Payment Gateway Details (populated from callback)
  trxReferenceNumber: string; // Unique payment gateway transaction reference (from callback URL/response)
  cardDataToken?: string; // Tokenized card data (for recurring payments, if applicable)
  maskedCard?: string; // Masked card number (e.g., "****1234")
  merchantOrderId: string; // Payment gateway merchant order ID (from orderId in checkout)
  orderId: string; // Internal order ID used when creating checkout
  orderReference?: string; // Additional reference from payment gateway (if provided)
  cardBrand?: string; // Card brand: "VISA", "MASTERCARD", "MEEZA", etc.
  mode: "test" | "live"; // Payment environment: "test" (sandbox) or "live" (production)
  signature?: string; // Payment signature/hash from Kashier for verification
  
  // Metadata
  createdBy: string; // Who/what created this transaction (usually userId)
  createdAt: any; // Firestore Timestamp - when transaction was created
  updatedAt: any; // Firestore Timestamp - when transaction was last updated
  completedAt?: any; // Firestore Timestamp - when payment was completed (success or failure)
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
 * Activate user subscription from Transaction data (with atomic batched updates)
 * 
 * This function is called after a successful payment to activate the user's subscription.
 * It uses the Transaction record to copy all subscription details and ensures atomicity
 * with Firestore batched writes.
 * 
 * Updates the user document with:
 * - lastTransactionId: Set to the current Transaction's transactionId
 * - subscriptionPlanId, subscriptionPlanName, etc.: Copied from Transaction
 * - subscriptionValidUntil: Calculated from Transaction plan duration
 * - subscriptionIsActive: Set to true
 * - subscriptionHistory: New entry added for audit trail
 * 
 * Uses Firestore batched writes for atomicity - all updates succeed or fail together.
 * This prevents race conditions and ensures data consistency.
 * 
 * @param transactionId - Transaction document ID to use for activation
 * @returns Promise resolving when activation is complete
 * @throws Error if transaction not found, transaction not successful, or user profile not found
 */
export async function activateSubscriptionFromTransaction(transactionId: string): Promise<void> {
  const db = getFirestore(getFirebaseApp());
  
  // Step 1: Fetch transaction to get all subscription details
  // Edge Case: Transaction not found
  const transactionRef = doc(db, "transactions", transactionId);
  const transactionDoc = await getDoc(transactionRef);
  
  if (!transactionDoc.exists()) {
    throw new Error(`Transaction not found: ${transactionId}`);
  }
  
  const transaction = {
    transactionId: transactionDoc.id,
    ...(transactionDoc.data() as Omit<Transaction, "transactionId">),
  };
  
  // Step 2: Validate payment status indicates success
  // Edge Case: Transaction not successful (should not activate)
  if (transaction.paymentStatus !== "2") {
    throw new Error(
      `Cannot activate subscription: Transaction ${transactionId} has status "${transaction.paymentStatus}" (expected "2" for success)`
    );
  }
  
  // Step 3: Fetch user profile to get existing subscription data
  // Edge Case: User profile not found
  const userId = transaction.userId;
  const profileRef = doc(db, "userProfiles", userId);
  const profileDoc = await getDoc(profileRef);
  
  if (!profileDoc.exists()) {
    throw new Error(`User profile not found for userId: ${userId}`);
  }
  
  const existingProfile = profileDoc.data() as UserProfile;
  const existingSubscription = existingProfile.subscription;
  
  // Step 4: Calculate subscription expiration date from transaction plan duration
  // Parse duration from transaction (e.g., "7" days, "6" months, "12" months)
  const durationValue = parseInt(transaction.subscriptionPlanDuration, 10);
  const durationType = transaction.subscriptionPlanDurationType; // "days", "months", "year"
  const nowMs = Date.now();
  
  let expirationDate: Timestamp;
  let validUntil: Timestamp;
  
  if (durationType === "days") {
    const daysInMs = durationValue * 24 * 60 * 60 * 1000;
    expirationDate = Timestamp.fromMillis(nowMs + daysInMs);
    validUntil = expirationDate;
  } else if (durationType === "months") {
    const monthsInMs = durationValue * 30 * 24 * 60 * 60 * 1000; // Approximate: 30 days per month
    expirationDate = Timestamp.fromMillis(nowMs + monthsInMs);
    validUntil = expirationDate;
  } else if (durationType === "year" || durationType === "years") {
    const yearsInMs = durationValue * 365 * 24 * 60 * 60 * 1000; // Approximate: 365 days per year
    expirationDate = Timestamp.fromMillis(nowMs + yearsInMs);
    validUntil = expirationDate;
  } else {
    // Fallback: Use default duration based on plan type
    const planId = transaction.subscriptionPlanId;
    if (planId === "one_time") {
      expirationDate = Timestamp.fromMillis(nowMs + 7 * 24 * 60 * 60 * 1000); // 7 days
    } else if (planId === "flex_pack") {
      expirationDate = Timestamp.fromMillis(nowMs + 6 * 30 * 24 * 60 * 60 * 1000); // 6 months
    } else if (planId === "annual_pass") {
      expirationDate = Timestamp.fromMillis(nowMs + 365 * 24 * 60 * 60 * 1000); // 1 year
    } else {
      throw new Error(`Unknown plan type: ${planId}`);
    }
    validUntil = expirationDate;
  }
  
  // Step 5: Prepare subscription update with data from Transaction
  const now = serverTimestamp(); // For top-level fields
  const nowTimestamp = Timestamp.now(); // For array elements (serverTimestamp() not allowed in arrays)
  const planId = transaction.subscriptionPlanId as "one_time" | "flex_pack" | "annual_pass";
  
  // Build subscription history entry for audit trail
  // NOTE: Must use Timestamp.now() instead of serverTimestamp() because Firestore
  // doesn't allow serverTimestamp() inside arrays
  const historyEntry: SubscriptionHistoryEntry = {
    transactionId: transaction.transactionId,
    plan: planId,
    activatedAt: nowTimestamp, // Use Timestamp.now() for array elements
    validUntil: expirationDate,
    amount: transaction.transactionAmount,
    currency: transaction.transactionCurrency,
    trxReferenceNumber: transaction.trxReferenceNumber,
  };
  
  // Get existing subscription history or initialize empty array
  const existingHistory = existingSubscription?.subscriptionHistory || [];
  
  // Prepare subscription update
  const subscriptionUpdate: Partial<UserSubscription> = {
    plan: planId,
    status: "active", // subscriptionIsActive = true (via status)
    validUntil: validUntil, // subscriptionValidUntil
    expirationDate: expirationDate,
    lastPaymentDate: now, // serverTimestamp() is OK for top-level fields
    startDate: existingSubscription?.startDate || now, // Preserve original start date if exists
    subscriptionHistory: [...existingHistory, historyEntry], // Add new entry to history (uses Timestamp.now())
  };
  
  // Add plan-specific fields
  if (planId === "flex_pack") {
    subscriptionUpdate.creditsRemaining = 5; // Flex pack gets 5 credits
  }
  
  if (planId === "annual_pass") {
    subscriptionUpdate.renewalDate = expirationDate;
    subscriptionUpdate.nextBillingDate = expirationDate;
  }
  
  // Merge with existing subscription to preserve other fields
  const updatedSubscription: UserSubscription = {
    ...(existingSubscription || {
      plan: "free",
      status: "active",
      startDate: now,
    }),
    ...subscriptionUpdate,
  };
  
  // Clean up undefined values (Firestore doesn't accept undefined)
  const cleanedSubscription: any = {};
  Object.keys(updatedSubscription).forEach((key) => {
    const value = (updatedSubscription as any)[key];
    if (value !== undefined) {
      cleanedSubscription[key] = value;
    }
  });
  
  // Step 6: Use Firestore batched write for atomicity
  // All updates succeed or fail together - prevents race conditions
  const batch = writeBatch(db);
  
  // Update 1: User profile - subscription and lastTransactionId
  batch.update(profileRef, {
    subscription: cleanedSubscription as UserSubscription,
    lastTransactionId: transaction.transactionId, // Set to current transaction ID
    updatedAt: serverTimestamp(),
  });
  
  // Step 7: Commit batched write (atomic operation)
  // Edge Case: Batched write may fail due to:
  // - Network issues
  // - Concurrent updates (Firestore will retry)
  // - Permission errors
  try {
    await batch.commit();
    console.log("[Firestore] Subscription activated from transaction:", {
      userId,
      transactionId,
      plan: planId,
      validUntil: expirationDate.toDate().toISOString(),
      subscriptionPlan: cleanedSubscription.plan,
      subscriptionStatus: cleanedSubscription.status,
    });
  } catch (error: any) {
    console.error("[Firestore] Failed to commit subscription update:", {
      error: error.message,
      code: error.code,
      userId,
      transactionId,
    });
    throw new Error(`Failed to update user profile subscription: ${error.message}`);
  }
}

/**
 * Update user's subscription after payment (Legacy function - use activateSubscriptionFromTransaction for new code)
 * 
 * Updates the subscription object in the user's profile document.
 * Sets plan, credits, and billing information based on purchased product.
 * 
 * @param userId - User's Firebase Auth UID
 * @param product - Product type purchased: "one_time" | "flex_pack" | "annual_pass"
 * @deprecated Use activateSubscriptionFromTransaction() for better atomicity and transaction data integration
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

// ============================================================================
// TRANSACTION FUNCTIONS - Payment Transaction Tracking
// ============================================================================
// Transactions stored at /transactions/{transactionId}
// Each transaction document tracks a payment attempt/result from payment gateway
//
// Firestore Indexes Required:
// - Collection: transactions
//   - Fields: userId (Ascending), createdAt (Descending)
//     Used by: listUserTransactions()
// - Collection: transactions
//   - Fields: userId (Ascending), paymentStatus (Ascending), createdAt (Descending)
//     Used by: getLastSuccessfulTransaction()
// - Collection: transactions
//   - Fields: trxReferenceNumber (Ascending)
//     Used by: getTransactionByReference()
//
// These indexes will be automatically created by Firestore when you first run queries,
// or you can create them manually in the Firebase Console.

/**
 * Plan configuration mapping for transaction creation
 * Maps plan IDs to their metadata (name, price, duration, description)
 */
const PLAN_CONFIG: Record<string, {
  name: { en: string; ar: string };
  price: string;
  duration: string;
  durationType: string;
  description: { en: string; ar: string };
}> = {
  one_time: {
    name: { en: "One-Time Purchase", ar: "شراء لمرة واحدة" },
    price: "49",
    duration: "7",
    durationType: "days",
    description: {
      en: "1 CV, 3 Templates, Unlimited edits for 7 days",
      ar: "سيرة واحدة، 3 قوالب، تعديلات غير محدودة لمدة 7 أيام"
    }
  },
  flex_pack: {
    name: { en: "Flex Pack", ar: "باقة مرنة" },
    price: "149",
    duration: "6",
    durationType: "months",
    description: {
      en: "5 CVs credits (wallet), Valid for 6 months, AI + templates included",
      ar: "رصيد 5 سير (محفظة)، صالحة لمدة 6 أشهر، ذكاء اصطناعي + قوالب"
    }
  },
  annual_pass: {
    name: { en: "Annual Pass", ar: "البطاقة السنوية" },
    price: "299",
    duration: "12",
    durationType: "months",
    description: {
      en: "Unlimited CVs, Cover letter & LinkedIn tools, Access future features",
      ar: "سير غير محدودة، أدوات خطاب التغطية ولينكدإن، الوصول للميزات المستقبلية"
    }
  }
};

/**
 * Create a new pending transaction in Firestore
 * 
 * Called when user initiates a payment (before redirecting to payment gateway).
 * Creates a transaction record with status "1" (pending).
 * 
 * @param input - Transaction creation data
 * @param input.userId - Firebase Auth UID
 * @param input.userEmail - User's email address
 * @param input.userName - User's display name
 * @param input.userPhone - User's phone number (optional)
 * @param input.subscriptionPlanId - Plan identifier: "one_time", "flex_pack", "annual_pass"
 * @param input.orderId - Internal order ID (used when creating payment gateway checkout)
 * @param input.mode - Payment mode: "test" or "live"
 * @param input.language - UI language: "ar" or "en"
 * @param input.trxReferenceNumber - Initial transaction reference (can be updated from callback)
 * @returns Promise resolving with the created transaction document ID
 */
export async function createTransaction(input: {
  userId: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  subscriptionPlanId: "one_time" | "flex_pack" | "annual_pass";
  orderId: string;
  mode: "test" | "live";
  language: "ar" | "en";
  trxReferenceNumber: string;
}): Promise<string> {
  const db = getFirestore(getFirebaseApp());
  const transactionsRef = collection(db, "transactions");
  
  // Get plan configuration
  const planConfig = PLAN_CONFIG[input.subscriptionPlanId];
  if (!planConfig) {
    throw new Error(`Invalid subscription plan ID: ${input.subscriptionPlanId}`);
  }
  
  // Prepare transaction data
  const now = serverTimestamp();
  const transactionData: Omit<Transaction, "transactionId"> = {
    // Subscription Plan Information
    subscriptionPlanId: input.subscriptionPlanId,
    subscriptionPlanName: planConfig.name[input.language],
    subscriptionPlanPrice: planConfig.price,
    subscriptionPlanDuration: planConfig.duration,
    subscriptionPlanDurationType: planConfig.durationType,
    subscriptionPlanDescription: planConfig.description[input.language],
    
    // User Information
    userId: input.userId,
    userEmail: input.userEmail,
    userName: input.userName,
    userPhone: input.userPhone,
    
    // Payment Amount & Currency
    transactionAmount: planConfig.price,
    transactionCurrency: "EGP",
    
    // Payment Status: "1" = pending (initial state)
    paymentStatus: "1",
    
    // Language preference
    language: input.language,
    
    // Payment Gateway Details (initial values, will be updated from callback)
    trxReferenceNumber: input.trxReferenceNumber,
    merchantOrderId: input.orderId, // Initially same as orderId, may be updated by Kashier
    orderId: input.orderId,
    mode: input.mode,
    
    // Metadata
    createdBy: input.userId,
    createdAt: now,
    updatedAt: now,
    // completedAt is not set for pending transactions
  };
  
  // Create transaction document
  const docRef = await addDoc(transactionsRef, transactionData);
  return docRef.id;
}

/**
 * Get a transaction by its document ID
 * 
 * @param transactionId - Transaction document ID
 * @returns Transaction object or null if not found
 */
export async function getTransaction(transactionId: string): Promise<Transaction | null> {
  const db = getFirestore(getFirebaseApp());
  const transactionRef = doc(db, "transactions", transactionId);
  const snapshot = await getDoc(transactionRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  return {
    transactionId: snapshot.id,
    ...(snapshot.data() as Omit<Transaction, "transactionId">)
  };
}

/**
 * Get a transaction by payment gateway reference number
 * 
 * Useful for finding transactions from callback URLs that contain trxReferenceNumber.
 * 
 * @param trxReferenceNumber - Payment gateway transaction reference number
 * @returns Transaction object or null if not found
 */
export async function getTransactionByReference(trxReferenceNumber: string): Promise<Transaction | null> {
  const db = getFirestore(getFirebaseApp());
  const transactionsRef = collection(db, "transactions");
  const q = query(transactionsRef, where("trxReferenceNumber", "==", trxReferenceNumber));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  // Return the first match (should be unique)
  const doc = snapshot.docs[0];
  return {
    transactionId: doc.id,
    ...(doc.data() as Omit<Transaction, "transactionId">)
  };
}

/**
 * Get a transaction by order ID
 * 
 * Useful for finding transactions from webhooks that provide merchantOrderId.
 * 
 * @param orderId - Order ID (merchantOrderId)
 * @returns Transaction object or null if not found
 */
export async function getTransactionByOrderId(orderId: string): Promise<Transaction | null> {
  const db = getFirestore(getFirebaseApp());
  const transactionsRef = collection(db, "transactions");
  
  // Try orderId first (most common)
  let q = query(transactionsRef, where("orderId", "==", orderId));
  let snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return {
      transactionId: doc.id,
      ...(doc.data() as Omit<Transaction, "transactionId">)
    };
  }
  
  // Try merchantOrderId as fallback (Kashier may update this field)
  q = query(transactionsRef, where("merchantOrderId", "==", orderId));
  snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  // Return the first match (should be unique)
  const doc = snapshot.docs[0];
  return {
    transactionId: doc.id,
    ...(doc.data() as Omit<Transaction, "transactionId">)
  };
}

/**
 * Update transaction with payment completion data from Kashier callback
 * 
 * Called when payment is completed (success or failure).
 * Updates transaction status, payment details, and completion timestamp.
 * 
 * This function updates the Transaction document at /transactions/{transactionId} with:
 * - paymentStatus: "2" (success) or "3" (failed)
 * - All provided payment fields from Kashier callback
 * - updatedAt: Current server timestamp (automatically set)
 * - completedAt: Current server timestamp (automatically set)
 * 
 * Field Mappings from Kashier Callback:
 * - trxReferenceNumber: From callback URL path or query param
 * - paymentStatus: "2" (success) or "3" (failed) - determined from callback status
 * - maskedCard: From callback query param (e.g., "****1234")
 * - cardBrand: From callback query param (e.g., "VISA", "MASTERCARD")
 * - cardDataToken: From callback query param (if provided, for recurring payments)
 * - orderReference: From callback query param (if provided)
 * - signature: From callback query param (for verification)
 * - merchantOrderId: May be updated if payment gateway returns a different value
 * 
 * Note: Fields set at transaction creation (transactionAmount, transactionCurrency, orderId, mode)
 * are not updated here as they should remain constant. Only payment completion fields are updated.
 * 
 * Idempotency: This function does not check for duplicate updates. The caller should check
 * if paymentStatus is already "2" or "3" before calling this function to avoid unnecessary updates.
 * 
 * Error Handling:
 * - Throws error if transaction document not found
 * - Throws error if Firestore update fails
 * - Caller should handle errors appropriately
 * 
 * @param transactionId - Transaction document ID to update
 * @param paymentData - Payment completion data from payment gateway callback
 * @param paymentData.paymentStatus - "2" (success) or "3" (failed)
 * @param paymentData.trxReferenceNumber - Updated reference number from callback (if different)
 * @param paymentData.maskedCard - Masked card number (optional)
 * @param paymentData.cardBrand - Card brand (optional)
 * @param paymentData.cardDataToken - Tokenized card data (optional)
 * @param paymentData.orderReference - Additional reference (optional)
 * @param paymentData.signature - Payment signature (optional)
 * @param paymentData.merchantOrderId - Updated merchant order ID (optional)
 * @returns Promise resolving when update is complete
 * @throws Error if transaction not found or update fails
 */
export async function updateTransactionWithPaymentData(
  transactionId: string,
  paymentData: {
    paymentStatus: "2" | "3"; // "2" = success, "3" = failed
    trxReferenceNumber?: string; // Updated reference (if different from initial)
    maskedCard?: string;
    cardBrand?: string;
    cardDataToken?: string;
    orderReference?: string;
    signature?: string;
    merchantOrderId?: string;
  }
): Promise<void> {
  const db = getFirestore(getFirebaseApp());
  const transactionRef = doc(db, "transactions", transactionId);
  
  // Step 1: Verify transaction exists before updating
  // Edge Case: Transaction not found
  const transactionDoc = await getDoc(transactionRef);
  if (!transactionDoc.exists()) {
    throw new Error(`Transaction not found: ${transactionId}`);
  }
  
  // Step 2: Prepare update data with all provided payment fields
  // Only include fields that are provided (undefined fields are omitted)
  const updateData: Partial<Transaction> = {
    // Payment Status: Always updated (required)
    paymentStatus: paymentData.paymentStatus,
    
    // Timestamps: Automatically set to current server time
    updatedAt: serverTimestamp(),
    completedAt: serverTimestamp(), // Mark as completed (success or failure)
  };
  
  // Step 3: Add optional fields if provided
  // These fields are only updated if they exist in paymentData
  if (paymentData.trxReferenceNumber) {
    updateData.trxReferenceNumber = paymentData.trxReferenceNumber;
  }
  if (paymentData.maskedCard) {
    updateData.maskedCard = paymentData.maskedCard;
  }
  if (paymentData.cardBrand) {
    updateData.cardBrand = paymentData.cardBrand;
  }
  if (paymentData.cardDataToken) {
    updateData.cardDataToken = paymentData.cardDataToken;
  }
  if (paymentData.orderReference) {
    updateData.orderReference = paymentData.orderReference;
  }
  if (paymentData.signature) {
    updateData.signature = paymentData.signature;
  }
  if (paymentData.merchantOrderId) {
    updateData.merchantOrderId = paymentData.merchantOrderId;
  }
  
  // Step 4: Update transaction document in Firestore
  // This overwrites the specified fields in the transaction document
  // Edge Case: Firestore update may fail due to network issues, permissions, etc.
  await updateDoc(transactionRef, updateData);
  
  console.log("[Firestore] Transaction updated:", {
    transactionId,
    paymentStatus: paymentData.paymentStatus,
    fieldsUpdated: Object.keys(updateData).length,
  });
}

/**
 * List all transactions for a user
 * 
 * Returns transactions sorted by createdAt (newest first).
 * 
 * @param userId - Firebase Auth UID
 * @returns Array of transactions for the user
 */
export async function listUserTransactions(userId: string): Promise<Transaction[]> {
  const db = getFirestore(getFirebaseApp());
  const transactionsRef = collection(db, "transactions");
  const q = query(
    transactionsRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => ({
    transactionId: doc.id,
    ...(doc.data() as Omit<Transaction, "transactionId">)
  }));
}

/**
 * Get the most recent successful transaction for a user
 * 
 * Used to retrieve the lastTransactionId for user profile updates.
 * 
 * @param userId - Firebase Auth UID
 * @returns Most recent successful transaction or null if none found
 */
export async function getLastSuccessfulTransaction(userId: string): Promise<Transaction | null> {
  const db = getFirestore(getFirebaseApp());
  const transactionsRef = collection(db, "transactions");
  const q = query(
    transactionsRef,
    where("userId", "==", userId),
    where("paymentStatus", "==", "2"), // "2" = success
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  return {
    transactionId: doc.id,
    ...(doc.data() as Omit<Transaction, "transactionId">)
  };
}

/**
 * Update user profile with lastTransactionId after successful payment
 * 
 * Helper function to update user profile with reference to the completed transaction.
 * 
 * @param userId - Firebase Auth UID
 * @param transactionId - Transaction document ID
 */
export async function updateUserLastTransactionId(userId: string, transactionId: string): Promise<void> {
  const db = getFirestore(getFirebaseApp());
  const profileRef = doc(db, "userProfiles", userId);
  await updateDoc(profileRef, {
    lastTransactionId: transactionId,
    updatedAt: serverTimestamp(),
  });
}


