/**
 * Guest Draft Management Utility
 * 
 * Provides localStorage-based draft saving/loading for unauthenticated users (guest mode).
 * This enables users to explore the CV builder without signing up, while still allowing
 * them to save their progress locally.
 * 
 * When a guest user signs in, their localStorage draft can be automatically migrated
 * to their account via the migrateGuestDraft() function.
 * 
 * Future extensibility:
 * - Add draft expiration (e.g., auto-delete after 30 days)
 * - Add draft encryption for privacy
 * - Add draft versioning
 * - Add cross-device sync via temporary tokens
 */

const GUEST_DRAFT_KEY = "serapro_guest_draft";
const GUEST_DRAFT_TIMESTAMP_KEY = "serapro_guest_draft_timestamp";

export type GuestDraftData = {
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
};

/**
 * Save draft to localStorage (guest mode)
 */
export function saveGuestDraft(data: GuestDraftData): void {
  try {
    localStorage.setItem(GUEST_DRAFT_KEY, JSON.stringify(data));
    localStorage.setItem(GUEST_DRAFT_TIMESTAMP_KEY, new Date().toISOString());
  } catch (error) {
    console.error("Failed to save guest draft:", error);
    throw new Error("Failed to save draft. Your browser may not support localStorage.");
  }
}

/**
 * Load draft from localStorage (guest mode)
 */
export function loadGuestDraft(): GuestDraftData | null {
  try {
    const stored = localStorage.getItem(GUEST_DRAFT_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as GuestDraftData;
  } catch (error) {
    console.error("Failed to load guest draft:", error);
    return null;
  }
}

/**
 * Get the timestamp of the last saved guest draft
 */
export function getGuestDraftTimestamp(): Date | null {
  try {
    const stored = localStorage.getItem(GUEST_DRAFT_TIMESTAMP_KEY);
    if (!stored) return null;
    return new Date(stored);
  } catch (error) {
    console.error("Failed to get guest draft timestamp:", error);
    return null;
  }
}

/**
 * Check if a guest draft exists
 */
export function hasGuestDraft(): boolean {
  return localStorage.getItem(GUEST_DRAFT_KEY) !== null;
}

/**
 * Clear guest draft from localStorage
 */
export function clearGuestDraft(): void {
  try {
    localStorage.removeItem(GUEST_DRAFT_KEY);
    localStorage.removeItem(GUEST_DRAFT_TIMESTAMP_KEY);
  } catch (error) {
    console.error("Failed to clear guest draft:", error);
  }
}

/**
 * Migrate guest draft to user account after authentication
 * This should be called after a guest user successfully signs in
 * 
 * @param userId - The authenticated user's ID
 * @param saveUserDraftFn - Function to save draft to Firestore
 * @returns True if migration was successful, false otherwise
 */
export async function migrateGuestDraft(
  userId: string,
  saveUserDraftFn: (userId: string, data: any) => Promise<void>
): Promise<boolean> {
  try {
    const draft = loadGuestDraft();
    if (!draft) return false;

    // Convert guest draft format to Firestore format
    await saveUserDraftFn(userId, draft);
    
    // Clear guest draft after successful migration
    clearGuestDraft();
    
    return true;
  } catch (error) {
    console.error("Failed to migrate guest draft:", error);
    return false;
  }
}

