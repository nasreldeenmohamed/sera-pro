"use client";
import { useEffect, useMemo, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
// Tabs removed - using step-based navigation instead
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { saveUserDraft, getUserDraft, getUserPlan, getUserDraftById, getFirstCvId, type CvDraftData, type UserPlan } from "@/firebase/firestore";
// PDF download functionality removed from builder - only available after payment
// import { ClassicTemplate } from "@/components/pdf/Templates";
// import { downloadPdf } from "@/lib/pdf";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { CheckCircle2, XCircle, Clock, Loader2, ExternalLink, HelpCircle, Info, AlertCircle } from "lucide-react";
// REMOVED: LinkedIn and Upload icons (import feature disabled)
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CV_TIPS, FIELD_HELP, hasMinimumDataForAI, formatValidationMessage, countFormErrors } from "@/lib/cv-helpers";
import { getPersonalLabels, getExperienceLabels, getEducationLabels, getSkillsLabels, getLanguagesLabels, getCertificationsLabels, getProjectsLabels, getSectionHeaders } from "@/lib/cv-language-labels";
import { AuthRequiredModal } from "@/components/auth/AuthRequiredModal";
import {
  saveGuestDraft,
  loadGuestDraft,
  getGuestDraftTimestamp,
  hasGuestDraft,
  migrateGuestDraft,
  type GuestDraftData,
} from "@/lib/guest-drafts";
import { StepIndicator } from "@/components/cv-builder/StepIndicator";
import { TemplateSelector } from "@/components/cv-builder/TemplateSelector";
// REMOVED: CV Import feature temporarily disabled
// import { DataImportStep } from "@/components/cv-builder/DataImportStep";
import { LiveCvPreview } from "@/components/cv-builder/LiveCvPreview";
import { LanguageSelector } from "@/components/cv-builder/LanguageSelector";

// Enhanced CV builder schema with robust validation rules
// All validation messages are bilingual (EN/AR) and support partial data for drafts

// Custom validation: Date format YYYY-MM or YYYY-MM-DD
const dateRegex = /^\d{4}-\d{2}(-\d{2})?$/;
const validateDate = (date: string): boolean => {
  if (!date) return true; // Optional dates
  if (!dateRegex.test(date)) return false;
  const [year, month] = date.split("-").map(Number);
  return year >= 1900 && year <= 2100 && month >= 1 && month <= 12;
};

// Custom validation: Phone number (flexible format)
const phoneRegex = /^[\d\s\-\+\(\)]{7,20}$/;

// Custom validation: URL format
const urlRegex = /^https?:\/\/.+\..+/i;

const experienceSchema = z.object({
  company: z.string()
    .min(2, { message: "Company name must be at least 2 characters / يجب أن يكون اسم الشركة على الأقل حرفين" })
    .max(100, { message: "Company name too long / اسم الشركة طويل جداً" }),
  role: z.string()
    .min(2, { message: "Role must be at least 2 characters / يجب أن يكون المسمى الوظيفي على الأقل حرفين" })
    .max(100, { message: "Role too long / المسمى الوظيفي طويل جداً" }),
  startDate: z.string()
    .min(1, { message: "Start date is required / تاريخ البداية مطلوب" })
    .refine(validateDate, { message: "Invalid date format. Use YYYY-MM / تنسيق تاريخ غير صحيح. استخدم YYYY-MM" }),
  endDate: z.string()
    .optional()
    .refine((val) => !val || validateDate(val), { message: "Invalid date format. Use YYYY-MM / تنسيق تاريخ غير صحيح. استخدم YYYY-MM" }),
  description: z.string()
    .max(1000, { message: "Description too long (max 1000 characters) / الوصف طويل جداً (حد أقصى 1000 حرف)" })
    .optional(),
});

const educationSchema = z.object({
  school: z.string()
    .min(2, { message: "School name must be at least 2 characters / يجب أن يكون اسم المؤسسة على الأقل حرفين" })
    .max(100, { message: "School name too long / اسم المؤسسة طويل جداً" }),
  degree: z.string()
    .min(2, { message: "Degree must be at least 2 characters / يجب أن يكون المؤهل على الأقل حرفين" })
    .max(100, { message: "Degree too long / المؤهل طويل جداً" }),
  startDate: z.string()
    .min(1, { message: "Start date is required / تاريخ البداية مطلوب" })
    .refine(validateDate, { message: "Invalid date format. Use YYYY-MM / تنسيق تاريخ غير صحيح. استخدم YYYY-MM" }),
  endDate: z.string()
    .optional()
    .refine((val) => !val || validateDate(val), { message: "Invalid date format. Use YYYY-MM / تنسيق تاريخ غير صحيح. استخدم YYYY-MM" }),
});

const projectSchema = z.object({
  title: z.string()
    .min(2, { message: "Project title must be at least 2 characters / يجب أن يكون عنوان المشروع على الأقل حرفين" })
    .max(100, { message: "Project title too long / عنوان المشروع طويل جداً" }),
  startDate: z.string()
    .min(1, { message: "Start date is required / تاريخ البداية مطلوب" })
    .refine(validateDate, { message: "Invalid date format. Use YYYY-MM / تنسيق تاريخ غير صحيح. استخدم YYYY-MM" }),
  endDate: z.string()
    .optional()
    .refine((val) => !val || validateDate(val), { message: "Invalid date format. Use YYYY-MM / تنسيق تاريخ غير صحيح. استخدم YYYY-MM" }),
  description: z.string()
    .max(1000, { message: "Description too long (max 1000 characters) / الوصف طويل جداً (حد أقصى 1000 حرف)" })
    .optional(),
});

const schema = z.object({
  fullName: z.string()
    .min(2, { message: "Full name is required (min 2 characters) / الاسم الكامل مطلوب (حد أدنى حرفين)" })
    .max(100, { message: "Name too long (max 100 characters) / الاسم طويل جداً (حد أقصى 100 حرف)" }),
  title: z.string()
    .max(100, { message: "Title too long (max 100 characters) / المسمى المهني طويل جداً (حد أقصى 100 حرف)" })
    .optional(),
  summary: z.string()
    .max(500, { message: "Summary too long (max 500 characters) / الملخص طويل جداً (حد أقصى 500 حرف)" })
    .optional(),
  contact: z.object({
    email: z.string()
      .email({ message: "Invalid email format / تنسيق بريد إلكتروني غير صحيح" })
      .optional()
      .or(z.literal("")),
    phone: z.string()
      .refine((val) => !val || phoneRegex.test(val), { message: "Invalid phone format / تنسيق هاتف غير صحيح" })
      .optional()
      .or(z.literal("")),
    location: z.string()
      .max(100, { message: "Location too long / الموقع طويل جداً" })
      .optional(),
    website: z.string()
      .refine((val) => !val || urlRegex.test(val), { message: "Invalid URL format (must start with http:// or https://) / تنسيق رابط غير صحيح (يجب أن يبدأ بـ http:// أو https://)" })
      .optional()
      .or(z.literal("")),
  }),
  experience: z.array(experienceSchema).default([]),
  projects: z.array(projectSchema).default([]),
  education: z.array(educationSchema).default([]),
  skills: z.array(z.string()
    .min(1, { message: "Skill cannot be empty / لا يمكن أن تكون المهارة فارغة" })
    .max(50, { message: "Skill too long (max 50 characters) / المهارة طويلة جداً (حد أقصى 50 حرف)" })
  ).default([]),
  languages: z.array(z.string()
    .min(1, { message: "Language cannot be empty / لا يمكن أن تكون اللغة فارغة" })
    .max(50, { message: "Language too long (max 50 characters) / اللغة طويلة جداً (حد أقصى 50 حرف)" })
  ).default([]),
  certifications: z.array(z.string()
    .min(1, { message: "Certification cannot be empty / لا يمكن أن تكون الشهادة فارغة" })
    .max(100, { message: "Certification too long (max 100 characters) / الشهادة طويلة جداً (حد أقصى 100 حرف)" })
  ).default([]),
  templateKey: z.string().default("classic"),
  cvLanguage: z.enum(["ar", "en"]).default("en"), // Language of CV content (separate from UI locale)
});

type FormValues = z.infer<typeof schema>;

/**
 * CV Builder Page - Guest Mode Enabled
 * 
 * This page implements a "guest mode" user flow that maximizes conversions by:
 * 1. Allowing unauthenticated users to access and use the CV builder immediately
 * 2. Permitting guests to create/edit CVs and preview without sign-up
 * 3. Requiring authentication only for protected actions:
 *    - Save Draft (persist to cloud)
 *    - Load Draft (from cloud account)
 *    - Download PDF (premium feature / paywall)
 *    - AI Enhancement (premium feature)
 * 4. Using localStorage for guest drafts (automatically migrated to account on sign-in)
 * 
 * When a protected action is triggered, an AuthRequiredModal appears prompting
 * sign-in/sign-up. After successful authentication, the intended action is
 * automatically completed.
 * 
 * Future extensibility:
 * - Add social login buttons directly in auth modal
 * - Add "Continue as guest" option with limitations banner
 * - Add trial mode (e.g., 1 free download for guests)
 * - Add draft expiration warnings
 */
function CreateCvPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const cvId = params?.get("id") || null;
  const { user, loading: authLoading } = useAuth();
  const { isAr, t } = useLocale();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any, // Type compatibility fix for Next.js export
    mode: "onChange",
    defaultValues: {
      fullName: "",
      title: "",
      summary: "",
      contact: { email: "", phone: "", location: "", website: "" },
      experience: [],
      projects: [],
      education: [],
      skills: [],
      languages: [],
      certifications: [],
      templateKey: "classic",
      cvLanguage: "en" as const, // Default to English, user can change
    },
  });

  const expArray = useFieldArray({ control: form.control, name: "experience" });
  const eduArray = useFieldArray({ control: form.control, name: "education" });
  // Note: useFieldArray works with string arrays at runtime, but TypeScript types it only for object arrays
  // Using type assertions to bypass this limitation
  const projectsArray = useFieldArray({ control: form.control, name: "projects" });
  const skillsArray = useFieldArray({ control: form.control, name: "skills" as any });
  const langsArray = useFieldArray({ control: form.control, name: "languages" as any });
  const certsArray = useFieldArray({ control: form.control, name: "certifications" as any });

  // Draft state management (supports both authenticated and guest modes)
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftStatus, setDraftStatus] = useState<"idle" | "success" | "error">("idle");
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const [draftExists, setDraftExists] = useState(false);
  const [draftLastUpdated, setDraftLastUpdated] = useState<Date | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const hasUnsavedChanges = useRef(false);
  const hasLoadedDraft = useRef(false);

  // Auth modal state for protected actions
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalAction, setAuthModalAction] = useState<"save" | "download" | "premium" | "load" | "general">("general");
  const [pendingProtectedAction, setPendingProtectedAction] = useState<(() => void) | null>(null);

  // Step-based wizard state
  // Steps: 1: Language, 2: Template, 3+: Form sections
  // REMOVED: Step 3 (Import) - CV import feature temporarily disabled
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(form.getValues("templateKey") || "classic");
  // REMOVED: dataImported state (import feature disabled)
  
  // CV Language state (controls content language, not UI locale)
  const cvLanguage = form.watch("cvLanguage") || "en";
  const isCvAr = cvLanguage === "ar";
  
  // User plan state for template access control
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  
  // Track "Present" checkbox state for each experience entry
  // Key: experience index, Value: boolean (is present)
  const [presentStates, setPresentStates] = useState<Record<number, boolean>>({});
  
  // Track whether Projects section is included
  const projects = form.watch("projects") || [];
  const [includeProjects, setIncludeProjects] = useState(() => {
    // Initialize based on current projects when component mounts
    return projects.length > 0;
  });
  
  // Sync includeProjects state when projects array changes (but not create infinite loop)
  useEffect(() => {
    const hasProjects = projects.length > 0;
    if (hasProjects !== includeProjects) {
      setIncludeProjects(hasProjects);
    }
  }, [projects.length]); // Only depend on length, not the state itself
  
  // Define steps for the wizard
  // Note: Step labels use site locale (isAr), but form content uses CV language (isCvAr)
  // REMOVED: "import" step - CV import feature temporarily disabled
  const steps = useMemo(() => [
    { key: "language", label: { en: "Language", ar: "اللغة" } },
    { key: "template", label: { en: "Template", ar: "القالب" } },
    { key: "personal", label: { en: "Personal", ar: "بيانات" } },
    { key: "experience", label: { en: "Experience", ar: "خبرات" } },
    { key: "projects", label: { en: "Projects", ar: "مشاريع" } },
    { key: "education", label: { en: "Education", ar: "تعليم" } },
    { key: "skills", label: { en: "Skills", ar: "مهارات" } },
    { key: "languages", label: { en: "Languages", ar: "لغات" } },
    { key: "certs", label: { en: "Certifications", ar: "شهادات" } },
  ], []);

  // Fetch user plan for template access control
  useEffect(() => {
    async function loadUserPlan() {
      if (!user) {
        setUserPlan(null);
        return;
      }

      setPlanLoading(true);
      try {
        const plan = await getUserPlan(user.uid);
        setUserPlan(plan);
      } catch (error) {
        console.error("Failed to load user plan:", error);
        setUserPlan(null);
      } finally {
        setPlanLoading(false);
      }
    }

    if (!authLoading) {
      loadUserPlan();
    }
  }, [user, authLoading]);

  // Handle upgrade prompt when user tries to select locked template
  const handleTemplateUpgrade = () => {
    setAuthModalAction("premium");
    setPendingProtectedAction(() => {
      // After auth, redirect to pricing
      router.push("/pricing");
    });
    setShowAuthModal(true);
  };

  // Watch form values for live preview
  const formValues = form.watch();
  
  // Prepare CV data for preview
  const cvPreviewData: CvDraftData = useMemo(() => ({
    fullName: formValues.fullName || "",
    title: formValues.title || "",
    summary: formValues.summary || "",
    contact: formValues.contact || { email: "", phone: "", location: "", website: "" },
    experience: formValues.experience || [],
    projects: formValues.projects || [],
    education: formValues.education || [],
    skills: formValues.skills || [],
    languages: formValues.languages || [],
    certifications: formValues.certifications || [],
    templateKey: selectedTemplate || "classic",
    cvLanguage: cvLanguage || "en", // Include CV language in preview data
  }), [formValues, selectedTemplate, cvLanguage]);

  // Track form changes for unsaved changes detection (only after initial load)
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      // Only mark as unsaved if we've already loaded data (draft or CV)
      if (hasLoadedDraft.current && name) {
        hasUnsavedChanges.current = true;
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Handle post-authentication callback (execute pending action after user signs in)
  useEffect(() => {
    if (authLoading || !user) return;

    // Check if there's a pending action from authentication
    const checkAuthCallback = () => {
      try {
        const stored = sessionStorage.getItem("authCallback");
        if (!stored) return;

        const callback = JSON.parse(stored);
        if (callback.callback === "pending" && pendingProtectedAction) {
          // Execute the pending action
          pendingProtectedAction();
          setPendingProtectedAction(null);
          sessionStorage.removeItem("authCallback");

          // Also migrate guest draft to user account if exists
          if (hasGuestDraft()) {
            migrateGuestDraft(user.uid, async (uid, data) => {
              /**
               * PLAN-AWARE MIGRATION:
               * Check user plan and reuse first CV for limited plans
               */
              const planForMigration = await getUserPlan(uid);
              const isLimitedForMigration = !planForMigration || planForMigration.planType === "free" || planForMigration.planType === "one_time";
              
              let targetCvIdForMigration: string | null = null;
              if (isLimitedForMigration) {
                // For limited plans, reuse first CV if exists
                targetCvIdForMigration = await getFirstCvId(uid);
              }
              // Otherwise, targetCvIdForMigration stays null (create new CV for unlimited plans)
              
              await saveUserDraft(uid, data as CvDraftData, targetCvIdForMigration);
            }).catch((err) => {
              console.error("Failed to migrate guest draft:", err);
            });
          }
        }
      } catch (error) {
        console.error("Failed to process auth callback:", error);
        sessionStorage.removeItem("authCallback");
      }
    };

    checkAuthCallback();
  }, [user, authLoading, pendingProtectedAction]);

  /**
   * Load existing CV or draft - PLAN-AWARE LOGIC
   * 
   * PLAN-BASED LOADING:
   * - Free/One-Time plans: Always load from first CV (ignore cvId parameter)
   *   - This ensures limited plans always work with a single CV
   *   - Prevents users from accessing multiple CVs via URL manipulation
   * - Flex Pack/Annual Pass plans: Load CV specified by cvId parameter
   *   - If cvId provided, load that specific CV
   *   - If no cvId, auto-load first draft (for backward compatibility)
   */
  useEffect(() => {
    async function loadData() {
      // Get user plan to determine load behavior
      let currentPlan: UserPlan | null = null;
      if (user) {
        try {
          currentPlan = await getUserPlan(user.uid);
        } catch (error) {
          console.error("Failed to load user plan:", error);
          // Default to free plan if plan fetch fails
        }
      }
      
      const isLimitedPlan = !currentPlan || currentPlan.planType === "free" || currentPlan.planType === "one_time";
      
      // If editing a specific CV (authenticated only)
      if (cvId) {
        if (!user) {
          // Redirect to auth if trying to edit CV without auth
          router.push("/auth?redirect=/create-cv&id=" + cvId);
          return;
        }

        try {
          /**
           * PLAN-AWARE LOAD LOGIC:
           * - Limited plans: Always load first CV (ignore cvId in URL)
           * - Unlimited plans: Load CV specified by cvId
           */
          let data: CvDraftData | null = null;
          
          if (isLimitedPlan) {
            /**
             * FREE/ONE-TIME PLANS: Always load first CV
             * 
             * Even if cvId is provided in URL, we ignore it and load the first CV.
             * This ensures users on limited plans always work with their single CV,
             * preventing access to multiple CVs and maintaining plan compliance.
             */
            const firstCvId = await getFirstCvId(user.uid);
            if (firstCvId) {
              data = await getUserDraftById(user.uid, firstCvId);
              // Update URL to reflect the correct CV ID (first CV)
              if (firstCvId !== cvId) {
                router.replace(`/create-cv?id=${firstCvId}`, { scroll: false });
              }
            } else {
              // No CV exists yet - user is creating first CV
              // Don't load anything, let them fill the form
              return;
            }
          } else {
            /**
             * FLEX PACK/ANNUAL PASS PLANS: Load CV specified by cvId
             * 
             * Users on unlimited plans can access multiple CVs, so we respect
             * the cvId parameter and load the specific CV they requested.
             */
            data = await getUserDraftById(user.uid, cvId);
          }
          
          if (data) {
            form.reset({
              fullName: data.fullName || "",
              title: data.title || "",
              summary: data.summary || "",
              contact: data.contact || { email: "", phone: "", location: "", website: "" },
              experience: data.experience || [],
              projects: data.projects || [],
              education: data.education || [],
              skills: data.skills || [],
              languages: data.languages || [],
              certifications: data.certifications || [],
              templateKey: data.templateKey || "classic",
              cvLanguage: data.cvLanguage || "en", // Restore CV language from saved data
            });
            // Set present states for experience entries
            const importedPresentStates: Record<number, boolean> = {};
            (data.experience || []).forEach((exp: any, expIdx: number) => {
              if (!exp.endDate || exp.endDate.trim() === "") {
                importedPresentStates[expIdx] = true;
              }
            });
            setPresentStates(importedPresentStates);
            // Set template and move to Personal Info step (step 3, was step 4 before removing import)
            setSelectedTemplate(data.templateKey || "classic");
            setCurrentStep(3);
            hasLoadedDraft.current = true;
            setDraftExists(true); // Mark draft as existing for edit mode
          }
        } catch (error) {
          console.error("Failed to load CV:", error);
          setDraftStatus("error");
          setDraftMessage(t("Failed to load CV. Please try again.", "فشل تحميل السيرة. يرجى المحاولة مرة أخرى."));
          setTimeout(() => setDraftStatus("idle"), 3000);
        }
        return; // Don't load draft if editing specific CV
      }

      /**
       * For authenticated users: load cloud draft
       * 
       * PLAN-AWARE LOADING:
       * - getUserDraft() already returns the first CV (most recent)
       * - For limited plans, this is the only CV they can access
       * - For unlimited plans, this is their most recent CV (default behavior)
       */
      if (user) {
        setDraftLoading(true);
        try {
          const draft = await getUserDraft(user.uid);
          if (draft) {
            setDraftExists(true);
            if (draft.updatedAt) {
              const timestamp = draft.updatedAt.toDate ? draft.updatedAt.toDate() : new Date(draft.updatedAt.seconds * 1000);
              setDraftLastUpdated(timestamp);
            }
            
            /**
             * For limited plans: Update URL to point to first CV ID
             * This ensures future saves work with the correct CV document
             */
            if (isLimitedPlan) {
              const firstCvId = await getFirstCvId(user.uid);
              if (firstCvId && firstCvId !== cvId) {
                router.replace(`/create-cv?id=${firstCvId}`, { scroll: false });
              }
            }
            
            // Pre-fill form with draft data
            form.reset({
              fullName: draft.fullName || "",
              title: draft.title || "",
              summary: draft.summary || "",
              contact: draft.contact || { email: "", phone: "", location: "", website: "" },
              experience: draft.experience || [],
              education: draft.education || [],
              skills: draft.skills || [],
              languages: draft.languages || [],
              certifications: draft.certifications || [],
              templateKey: draft.templateKey || "classic",
              cvLanguage: draft.cvLanguage || "en", // Restore CV language from draft
            });
            // Set present states for experience entries (empty endDate = present)
            const presentStatesMap: Record<number, boolean> = {};
            (draft.experience || []).forEach((exp, expIdx) => {
              if (!exp.endDate || exp.endDate.trim() === "") {
                presentStatesMap[expIdx] = true;
              }
            });
            setPresentStates(presentStatesMap);
            // Set template and move to Personal Info step (step 3, was step 4 before removing import)
            setSelectedTemplate(draft.templateKey || "classic");
            setCurrentStep(3); // Move to Personal Info step after loading draft
            hasLoadedDraft.current = true;
            setDraftStatus("success");
            setDraftMessage(t("Draft loaded successfully.", "تم تحميل المسودة بنجاح."));
            setTimeout(() => setDraftStatus("idle"), 3000);
          } else {
            setDraftExists(false);
            // Try to load guest draft if no cloud draft exists
            const guestDraft = loadGuestDraft();
            if (guestDraft) {
              form.reset({
                fullName: guestDraft.fullName || "",
                title: guestDraft.title || "",
                summary: guestDraft.summary || "",
                contact: guestDraft.contact || { email: "", phone: "", location: "", website: "" },
                experience: guestDraft.experience || [],
                education: guestDraft.education || [],
                skills: guestDraft.skills || [],
                languages: guestDraft.languages || [],
                certifications: guestDraft.certifications || [],
                templateKey: guestDraft.templateKey || "classic",
                cvLanguage: guestDraft.cvLanguage || "en", // Restore CV language from guest draft
              });
              // Set present states for experience entries
              const guestPresentStates: Record<number, boolean> = {};
              (guestDraft.experience || []).forEach((exp, expIdx) => {
                if (!exp.endDate || exp.endDate.trim() === "") {
                  guestPresentStates[expIdx] = true;
                }
              });
              setPresentStates(guestPresentStates);
              // Set template and move to Personal Info step (step 3, was step 4 before removing import)
              setSelectedTemplate(guestDraft.templateKey || "classic");
              setCurrentStep(3);
              hasLoadedDraft.current = true;
              // Migrate guest draft to cloud
              // For limited plans, this will reuse first CV if it exists, otherwise create new
              await migrateGuestDraft(user.uid, async (uid, data) => {
                // Get user plan to determine save behavior
                const planForMigration = await getUserPlan(uid);
                const isLimitedForMigration = !planForMigration || planForMigration.planType === "free" || planForMigration.planType === "one_time";
                
                let targetCvIdForMigration: string | null = null;
                if (isLimitedForMigration) {
                  // For limited plans, reuse first CV if exists
                  targetCvIdForMigration = await getFirstCvId(uid);
                }
                // Otherwise, targetCvIdForMigration stays null (create new CV)
                
                await saveUserDraft(uid, data as CvDraftData, targetCvIdForMigration);
              });
              setDraftStatus("success");
              setDraftMessage(t("Guest draft migrated to your account.", "تم نقل المسودة الضيف إلى حسابك."));
              setTimeout(() => setDraftStatus("idle"), 3000);
            }
          }
        } catch (error: any) {
          console.error("Failed to load draft:", error);
          setDraftStatus("error");
          setDraftMessage(t("Failed to load draft.", "فشل تحميل المسودة."));
          setTimeout(() => setDraftStatus("idle"), 3000);
        } finally {
          setDraftLoading(false);
        }
      } else {
        // For guest users: load from localStorage
        const guestDraft = loadGuestDraft();
        if (guestDraft) {
          setDraftExists(true);
          const timestamp = getGuestDraftTimestamp();
          if (timestamp) {
            setDraftLastUpdated(timestamp);
          }
          form.reset({
            fullName: guestDraft.fullName || "",
            title: guestDraft.title || "",
            summary: guestDraft.summary || "",
            contact: guestDraft.contact || { email: "", phone: "", location: "", website: "" },
            experience: guestDraft.experience || [],
            education: guestDraft.education || [],
            skills: guestDraft.skills || [],
            languages: guestDraft.languages || [],
            certifications: guestDraft.certifications || [],
            templateKey: guestDraft.templateKey || "classic",
          });
          // Set present states for experience entries
          const guestLoadPresentStates1: Record<number, boolean> = {};
          (guestDraft.experience || []).forEach((exp, expIdx) => {
            if (!exp.endDate || exp.endDate.trim() === "") {
              guestLoadPresentStates1[expIdx] = true;
            }
          });
          setPresentStates(guestLoadPresentStates1);
          // Set template and move to Personal Info step (step 4)
          setSelectedTemplate(guestDraft.templateKey || "classic");
          setCurrentStep(4);
          hasLoadedDraft.current = true;
        } else {
          setDraftExists(false);
        }
      }
    }
    loadData();
  }, [user, cvId, form, t, router]);

  /**
   * Save draft function - supports both authenticated (cloud) and guest (localStorage) modes
   * 
   * PLAN-AWARE LOGIC:
   * - Free/One-Time plans: Always reuse the first CV document (single CV limit)
   *   - If first CV exists, update it
   *   - If no CV exists, create new document
   * - Flex Pack/Annual Pass plans: Allow multiple CVs
   *   - If cvId provided, update that CV
   *   - If no cvId, create new CV document
   * 
   * Returns true if save was successful, false otherwise
   */
  async function handleSaveDraft(): Promise<boolean> {
    const values = form.getValues();
    const draftData: GuestDraftData = {
      fullName: values.fullName || "",
      title: values.title,
      summary: values.summary,
      contact: values.contact || { email: "", phone: "", location: "", website: "" },
      experience: values.experience || [],
      projects: values.projects || [],
      education: values.education || [],
      skills: values.skills || [],
      languages: values.languages || [],
      certifications: values.certifications || [],
      templateKey: values.templateKey || "classic",
      cvLanguage: values.cvLanguage || "en", // Include CV language in draft
    };

    // If authenticated, save to Firestore; otherwise prompt for auth
    if (user) {
      setDraftSaving(true);
      setDraftStatus("idle");
      setDraftMessage(null);

      try {
        /**
         * PLAN-AWARE SAVE LOGIC:
         * Determine which CV ID to use based on user's plan and current state
         */
        let targetCvId: string | null = null;
        
        // Get current user plan (default to free if not loaded yet)
        const currentPlan = userPlan || await getUserPlan(user.uid);
        const isLimitedPlan = !currentPlan || currentPlan.planType === "free" || currentPlan.planType === "one_time";
        
        if (isLimitedPlan) {
          /**
           * FREE/ONE-TIME PLANS: Always reuse first CV document
           * 
           * Logic:
           * 1. If first CV exists, use its ID (will update existing document)
           * 2. If no CV exists, pass null (will create new document)
           * 
           * This ensures users on limited plans always work with a single CV document,
           * preventing Firestore bloat and maintaining plan compliance.
           */
          const firstCvId = await getFirstCvId(user.uid);
          targetCvId = firstCvId;
          
          // Note: If firstCvId is null, targetCvId stays null and a new CV will be created
          // If firstCvId exists, we update that document (reusing it)
        } else {
          /**
           * FLEX PACK/ANNUAL PASS PLANS: Allow multiple CVs
           * 
           * Logic:
           * 1. If cvId is provided (editing existing CV), use it
           * 2. If no cvId (creating new CV), pass null to create new document
           * 
           * These plans allow users to create multiple CV documents within their limits.
           */
          targetCvId = cvId || null;
        }

        // Save with determined cvId (may be null for new CVs)
        const savedCvId = await saveUserDraft(user.uid, draftData as CvDraftData, targetCvId);
        setDraftExists(true);
        setDraftLastUpdated(new Date());
        hasUnsavedChanges.current = false;
        setDraftStatus("success");
        setDraftMessage(t("Draft saved successfully!", "تم حفظ المسودة بنجاح!"));
        
        /**
         * Update URL if:
         * 1. We created a new CV (targetCvId was null but now we have savedCvId)
         * 2. We're on a limited plan and reused first CV (need to update URL to show correct ID)
         */
        if (isLimitedPlan && !targetCvId && savedCvId) {
          // New CV created on limited plan - update URL
          router.replace(`/create-cv?id=${savedCvId}`, { scroll: false });
        } else if (!cvId && savedCvId && !isLimitedPlan) {
          // New CV created on unlimited plan - update URL
          router.replace(`/create-cv?id=${savedCvId}`, { scroll: false });
        } else if (isLimitedPlan && targetCvId && targetCvId !== cvId) {
          // Limited plan: CV was reused but URL doesn't match - update URL
          router.replace(`/create-cv?id=${targetCvId}`, { scroll: false });
        }
        
        setTimeout(() => {
          setDraftStatus("idle");
          setDraftMessage(null);
        }, 3000);
        return true; // Save successful
      } catch (error: any) {
        console.error("Failed to save draft:", error);
        setDraftStatus("error");
        setDraftMessage(
          error?.message || t("Failed to save draft. Please try again.", "فشل حفظ المسودة. يرجى المحاولة مرة أخرى.")
        );
        setTimeout(() => {
          setDraftStatus("idle");
          setDraftMessage(null);
        }, 5000);
        return false; // Save failed
      } finally {
        setDraftSaving(false);
      }
    } else {
      // Guest mode: save to localStorage as fallback
      // Note: Don't show auth modal here - let the caller (e.g., Finish button) handle it
      try {
        saveGuestDraft(draftData);
        setDraftLastUpdated(new Date());
        hasUnsavedChanges.current = false;
        setDraftStatus("success");
        setDraftMessage(t("Draft saved locally.", "تم حفظ المسودة محليًا."));
        setTimeout(() => {
          setDraftStatus("idle");
          setDraftMessage(null);
        }, 3000);
        return true; // localStorage save succeeded
      } catch (error: any) {
        console.error("Failed to save guest draft:", error);
        setDraftStatus("error");
        setDraftMessage(t("Failed to save draft.", "فشل حفظ المسودة."));
        setTimeout(() => setDraftStatus("idle"), 3000);
        return false; // Save failed
      }
    }
  }

  // Load draft function with confirmation if there are unsaved changes
  // Supports both authenticated (cloud) and guest (localStorage) modes
  async function handleLoadDraft(confirmed = false) {
    // Check if there are unsaved changes
    if (!confirmed && hasUnsavedChanges.current) {
      setPendingAction(() => () => handleLoadDraft(true));
      setShowConfirmDialog(true);
      return;
    }

    // For authenticated users: load from cloud
    if (user) {
      setDraftLoading(true);
      setDraftStatus("idle");
      setDraftMessage(null);

      try {
        const draft = await getUserDraft(user.uid);
        if (draft) {
          setDraftExists(true);
          if (draft.updatedAt) {
            const timestamp = draft.updatedAt.toDate ? draft.updatedAt.toDate() : new Date(draft.updatedAt.seconds * 1000);
            setDraftLastUpdated(timestamp);
          }
          form.reset({
            fullName: draft.fullName || "",
            title: draft.title || "",
            summary: draft.summary || "",
            contact: draft.contact || { email: "", phone: "", location: "", website: "" },
            experience: draft.experience || [],
            projects: draft.projects || [],
            education: draft.education || [],
            skills: draft.skills || [],
            languages: draft.languages || [],
            certifications: draft.certifications || [],
            templateKey: draft.templateKey || "classic",
          });
          // Set present states for experience entries
          const loadDraftPresentStates: Record<number, boolean> = {};
          (draft.experience || []).forEach((exp, expIdx) => {
            if (!exp.endDate || exp.endDate.trim() === "") {
              loadDraftPresentStates[expIdx] = true;
            }
          });
          setPresentStates(loadDraftPresentStates);
          hasLoadedDraft.current = true;
          hasUnsavedChanges.current = false; // Reset unsaved changes flag after loading
          setDraftStatus("success");
          setDraftMessage(t("Draft loaded successfully!", "تم تحميل المسودة بنجاح!"));
          setTimeout(() => {
            setDraftStatus("idle");
            setDraftMessage(null);
          }, 3000);
        } else {
          setDraftExists(false);
          setDraftStatus("error");
          setDraftMessage(t("No draft found. Create one first.", "لا توجد مسودة. أنشئ واحدة أولاً."));
          setTimeout(() => {
            setDraftStatus("idle");
            setDraftMessage(null);
          }, 3000);
        }
      } catch (error: any) {
        console.error("Failed to load draft:", error);
        setDraftStatus("error");
        setDraftMessage(
          error?.message || t("Failed to load draft. Please try again.", "فشل تحميل المسودة. يرجى المحاولة مرة أخرى.")
        );
        setTimeout(() => {
          setDraftStatus("idle");
          setDraftMessage(null);
        }, 5000);
      } finally {
        setDraftLoading(false);
      }
    } else {
      // For guest users: load from localStorage
      setDraftLoading(true);
      setDraftStatus("idle");
      setDraftMessage(null);

      try {
        const guestDraft = loadGuestDraft();
        if (guestDraft) {
          setDraftExists(true);
          const timestamp = getGuestDraftTimestamp();
          if (timestamp) {
            setDraftLastUpdated(timestamp);
          }
          form.reset({
            fullName: guestDraft.fullName || "",
            title: guestDraft.title || "",
            summary: guestDraft.summary || "",
            contact: guestDraft.contact || { email: "", phone: "", location: "", website: "" },
            experience: guestDraft.experience || [],
            education: guestDraft.education || [],
            skills: guestDraft.skills || [],
            languages: guestDraft.languages || [],
            certifications: guestDraft.certifications || [],
            templateKey: guestDraft.templateKey || "classic",
          });
          // Set present states for experience entries
          const handleLoadDraftGuestPresentStates2: Record<number, boolean> = {};
          (guestDraft.experience || []).forEach((exp, expIdx) => {
            if (!exp.endDate || exp.endDate.trim() === "") {
              handleLoadDraftGuestPresentStates2[expIdx] = true;
            }
          });
          setPresentStates(handleLoadDraftGuestPresentStates2);
          // Set template and move to Personal Info step (step 4)
          setSelectedTemplate(guestDraft.templateKey || "classic");
          setCurrentStep(4);
          hasLoadedDraft.current = true;
          hasUnsavedChanges.current = false;
          setDraftStatus("success");
          setDraftMessage(t("Guest draft loaded. Sign in to access cloud drafts.", "تم تحميل المسودة الضيف. سجّل الدخول للوصول إلى مسودات السحابة."));
          setTimeout(() => {
            setDraftStatus("idle");
            setDraftMessage(null);
          }, 4000);
        } else {
          setDraftExists(false);
          setDraftStatus("error");
          setDraftMessage(t("No draft found. Create one first.", "لا توجد مسودة. أنشئ واحدة أولاً."));
          setTimeout(() => {
            setDraftStatus("idle");
            setDraftMessage(null);
          }, 3000);
        }
      } catch (error: any) {
        console.error("Failed to load guest draft:", error);
        setDraftStatus("error");
        setDraftMessage(t("Failed to load draft.", "فشل تحميل المسودة."));
        setTimeout(() => {
          setDraftStatus("idle");
          setDraftMessage(null);
        }, 5000);
      } finally {
        setDraftLoading(false);
      }
    }
  }

  // Confirm and execute pending action (for load draft when unsaved changes exist)
  function confirmPendingAction() {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setShowConfirmDialog(false);
  }

  // Template selection handler
  // Language selection handler
  function handleLanguageSelect(language: "ar" | "en") {
    form.setValue("cvLanguage", language);
  }

  function handleTemplateSelect(templateKey: string) {
    setSelectedTemplate(templateKey);
    form.setValue("templateKey", templateKey);
  }

  // REMOVED: Data import handler - CV import feature temporarily disabled
  // function handleDataImport(importedData: any) { ... }

  // Navigation handlers
  function handleNextStep() {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  }

  function handlePreviousStep() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }

  // REMOVED: handleSkipImport - CV import feature temporarily disabled
  // function handleSkipImport() { setCurrentStep(3); }

  // Sync template selection with form
  useEffect(() => {
    form.setValue("templateKey", selectedTemplate);
  }, [selectedTemplate, form]);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // REMOVED: LinkedIn import state - CV import feature temporarily disabled
  // const [linkedInLoading, setLinkedInLoading] = useState(false);
  // const [linkedInError, setLinkedInError] = useState<string | null>(null);
  // const [linkedInSuccess, setLinkedInSuccess] = useState(false);
  // const [showLinkedInImport, setShowLinkedInImport] = useState(false);
  // const [linkedInUrl, setLinkedInUrl] = useState("");
  // const [linkedInInstructions, setLinkedInInstructions] = useState<string[]>([]);

  // Validation check before AI enhancement (premium feature - requires authentication)
  async function enhanceWithAI() {
    // Check authentication first (AI enhancement is a premium feature)
    if (!user) {
      setAuthModalAction("premium");
      setPendingProtectedAction(() => enhanceWithAI);
      setShowAuthModal(true);
      return;
    }

    setAiError(null);
    
    // Check minimum required data
    const data = form.getValues();
    const validation = hasMinimumDataForAI(data);
    
    if (!validation.valid) {
      const missingText = validation.missing.join(", ");
      setAiError(
        t(
          `Please complete the following fields before using AI enhancement: ${missingText}`,
          `يرجى إكمال الحقول التالية قبل استخدام تحسين الذكاء الاصطناعي: ${missingText}`
        )
      );
      return;
    }

    // Validate form before AI enhancement
    const isValid = await form.trigger();
    if (!isValid) {
      setAiError(
        t(
          "Please fix validation errors before using AI enhancement.",
          "يرجى إصلاح أخطاء التحقق قبل استخدام تحسين الذكاء الاصطناعي."
        )
      );
      return;
    }

    setAiLoading(true);
    setAiError(null);
    try {
      const currentValues = form.getValues();
      // Call AI enhancement API endpoint
      const res = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          data: currentValues, 
          locale: cvLanguage || (isAr ? "ar" : "en") 
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData.error || errorData.message || t("AI enhancement failed", "فشل تحسين الذكاء الاصطناعي");
        
        // Special handling for missing API key
        if (errorData.reason === "missing_api_key" || errorMsg.includes("API key")) {
          throw new Error(
            t(
              "Anthropic API key is not configured. Please add ANTHROPIC_API_KEY to your .env.local file.",
              "مفتاح API الخاص بـ Anthropic غير مضبوط. يرجى إضافة ANTHROPIC_API_KEY إلى ملف .env.local الخاص بك."
            )
          );
        }
        
        throw new Error(errorMsg);
      }
      
      const json = await res.json();
      
      console.log("[AI Enhance Client] Response received:", {
        hasData: !!json.data,
        hasError: !!json.error,
        fallback: json.fallback,
        message: json.message,
        titleChanged: json.data?.title !== currentValues.title,
        summaryChanged: json.data?.summary !== currentValues.summary,
      });
      
      // The API returns { data: enhancedCvData }
      if (json.data) {
        // Preserve template and cvLanguage, only update the content fields
        const enhancedData = {
          ...json.data,
          templateKey: currentValues.templateKey || selectedTemplate,
          cvLanguage: currentValues.cvLanguage || cvLanguage || "en",
        };
        
        console.log("[AI Enhance Client] Updating form with enhanced data:", {
          title: enhancedData.title,
          summaryPreview: enhancedData.summary?.substring(0, 50),
          hasExperience: !!enhancedData.experience?.length,
        });
        
        // Update form with enhanced data
        form.reset(enhancedData);
        
        // Set present states for experience entries that have no endDate
        const enhancedPresentStates: Record<number, boolean> = {};
        ((enhancedData.experience || []) as any[]).forEach((exp: any, expIdx: number) => {
          if (!exp.endDate || exp.endDate.trim() === "") {
            enhancedPresentStates[expIdx] = true;
          }
        });
        setPresentStates(enhancedPresentStates);
        
        // Show success message (include fallback warning if applicable)
        const successMsg = json.fallback 
          ? t("CV enhanced (using fallback - API key may be missing)", "تم تحسين السيرة الذاتية (استخدام بديل - قد يكون مفتاح API مفقود)")
          : t("CV enhanced successfully!", "تم تحسين السيرة الذاتية بنجاح!");
        setDraftStatus("success");
        setDraftMessage(successMsg);
        setTimeout(() => {
          setDraftStatus("idle");
          setDraftMessage(null);
        }, 3000);
      } else {
        const errorMsg = json.error || json.message || t("No enhanced data received", "لم يتم استلام بيانات محسنة");
        console.error("[AI Enhance Client] No data in response:", errorMsg);
        throw new Error(errorMsg);
      }
    } catch (e: any) {
      console.error("AI enhancement error:", e);
      setAiError(e?.message || t("AI enhancement error", "خطأ في تحسين الذكاء الاصطناعي"));
      setDraftStatus("error");
      setDraftMessage(e?.message || t("AI enhancement error", "خطأ في تحسين الذكاء الاصطناعي"));
      setTimeout(() => {
        setDraftStatus("idle");
        setDraftMessage(null);
      }, 5000);
    } finally {
      setAiLoading(false);
    }
  }

  async function exportPdf() {
    // PDF download is now gated - only available after payment
    // Redirect to pricing/checkout page instead of showing download button
    // This function is kept for potential future use (e.g., after payment completion)
    if (!user) {
      setAuthModalAction("download");
      setPendingProtectedAction(() => {
        router.push("/pricing");
      });
      setShowAuthModal(true);
      return;
    }

    // Check if user has paid (would check userPlan here in production)
    // For now, redirect to pricing page
    router.push("/pricing");
  }

  // REMOVED: LinkedIn import handlers - CV import feature temporarily disabled
  // async function handleLinkedInImport(file?: File, url?: string) { ... }
  // function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) { ... }
  // function handleToggleLinkedInImport() { ... }

  // Get current step key
  const currentStepKey = steps[currentStep - 1]?.key || "template";

  return (
    <SiteLayout>
      <section className="mx-auto w-full max-w-5xl p-6 sm:p-8 md:p-12" dir={isAr ? "rtl" : "ltr"}>
        {/* Step Indicator - clickable navigation for all steps */}
        <div className="mb-6">
          <StepIndicator
            currentStep={currentStep}
            totalSteps={steps.length}
            steps={steps}
            onStepClick={(stepNum) => {
              // Allow jumping to any step up to current step
              if (stepNum <= currentStep) {
                setCurrentStep(stepNum);
              }
            }}
          />
        </div>

        <header className={`mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${isAr ? "sm:flex-row-reverse" : ""}`}>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{t("CV Builder", "منشئ السيرة")}</h1>
              {!user && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {t("Guest Mode", "وضع الضيف")}
                </span>
              )}
            </div>
            {draftLastUpdated && (
              <p className="mt-1 flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400">
                <Clock className="h-3 w-3" />
                {t("Last saved", "آخر حفظ")}: {draftLastUpdated.toLocaleString(
                  // DEFAULT: Arabic uses Egypt locale (ar-EG) for Egypt-friendly date/time formats
                  isAr ? "ar-EG" : "en-US",
                  {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
                {!user && (
                  <span className="ml-1 text-zinc-400">({t("local", "محلي")})</span>
                )}
              </p>
            )}
            {!user && !draftLastUpdated && (
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {t(
                  "Creating as guest. Sign in to save to cloud and access premium features.",
                  "الإنشاء كضيف. سجّل الدخول للحفظ على السحابة والوصول إلى الميزات المميزة."
                )}
              </p>
            )}
          </div>
          {/* Contextual Actions - Only show after template selection (step 1)
              Reasoning: 
              - Load Draft: Not relevant when no data exists yet (template step is first)
              - Save Draft: No need to save before selecting a template
              - Enhance with AI: Requires actual CV data to enhance, which isn't available until after template selection
              This reduces cognitive load and keeps the interface focused on the current task.
          */}
          {currentStep > 1 && (
            <div className={`flex flex-wrap gap-2 ${isAr ? "flex-row-reverse" : ""}`}>
              {/* Load Draft button - Only relevant after template selection when user has form data */}
              <Button
                variant="outline"
                disabled={draftLoading || draftSaving}
                onClick={() => handleLoadDraft()}
              >
                {draftLoading ? (
                  <>
                    <Loader2 className={`h-4 w-4 animate-spin ${isAr ? "ml-2" : "mr-2"}`} />
                    {t("Loading...", "جارٍ التحميل...")}
                  </>
                ) : (
                  t("Load Draft", "تحميل مسودة")
                )}
              </Button>
              {/* AI Enhance: calls API route - Only available when there's CV content to enhance
                  Disabled for free plan users - premium feature requires paid subscription
                  TODO: refine prompt and handle edge cases */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button 
                        variant="secondary" 
                        disabled={aiLoading || draftSaving || (user && userPlan?.planType === "free") || false} 
                        onClick={enhanceWithAI}
                      >
                        {aiLoading ? t("Enhancing...", "...تحسين") : t("Enhance with AI", "تحسين بالذكاء")}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {user && userPlan?.planType === "free" && (
                    <TooltipContent>
                      <p>{t("AI enhancement is available for paid plans only. Upgrade to unlock this feature.", "تحسين الذكاء الاصطناعي متاح للخطط المدفوعة فقط. قم بالترقية لإلغاء قفل هذه الميزة.")}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              {/* PDF Download removed from builder - only available after payment in checkout */}
              {/* Save Draft button - Only relevant when user has entered data beyond template selection */}
              <Button
                onClick={handleSaveDraft}
                disabled={draftSaving || draftLoading}
                className="text-white"
                style={{ backgroundColor: "#0d47a1" }}
              >
                {draftSaving ? (
                  <>
                    <Loader2 className={`h-4 w-4 animate-spin ${isAr ? "ml-2" : "mr-2"}`} />
                    {t("Saving...", "جارٍ الحفظ...")}
                  </>
                ) : (
                  t("Save Draft", "حفظ مسودة")
                )}
              </Button>
            </div>
          )}
        </header>

        {/* Draft status feedback alerts */}
        {draftStatus === "success" && draftMessage && (
          <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-800 dark:text-green-200">{t("Success", "نجح")}</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">{draftMessage}</AlertDescription>
          </Alert>
        )}
        {draftStatus === "error" && draftMessage && (
          <Alert variant="destructive" className="mb-4">
            <XCircle className="h-4 w-4" />
            <AlertTitle>{t("Error", "خطأ")}</AlertTitle>
            <AlertDescription>{draftMessage}</AlertDescription>
          </Alert>
        )}
        {draftLoading && !draftExists && (
          <Alert className="mb-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>{t("Loading draft...", "جارٍ تحميل المسودة...")}</AlertDescription>
          </Alert>
        )}

        {/* AI Enhancement Error Display */}
        {aiError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("AI Enhancement Error", "خطأ في تحسين الذكاء الاصطناعي")}</AlertTitle>
            <AlertDescription>{aiError}</AlertDescription>
          </Alert>
        )}

        {/* Help & Support Section - only show during form entry */}
        {/* Updated: Now shows from step 3 (Personal Info), which was previously step 4 */}
        {currentStep >= 3 && (
          <div className="mb-6 rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4">
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isAr ? "sm:flex-row-reverse" : ""}`}>
              <div className="flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm mb-1">{t("Need Help?", "تحتاج مساعدة؟")}</h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {t(
                      "Get tips, view FAQs, or contact support for assistance with your CV.",
                      "احصل على نصائح أو شاهد الأسئلة الشائعة أو اتصل بالدعم للحصول على المساعدة في سيرتك الذاتية."
                    )}
                  </p>
                </div>
              </div>
              <div className={`flex flex-wrap gap-2 ${isAr ? "flex-row-reverse" : ""}`}>
                <Button variant="outline" size="sm" asChild className={isAr ? "flex-row-reverse" : ""}>
                  <a href="#faq" target="_blank" rel="noopener noreferrer" className="flex items-center">
                    <Info className={`h-4 w-4 ${isAr ? "ml-2" : "mr-2"}`} />
                    {t("FAQs", "الأسئلة الشائعة")}
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="mailto:contact.serapro@gmail.com?subject=CV Builder Help">
                    {t("Contact Support", "اتصل بالدعم")}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area: Builder + Live Preview (Side-by-side on desktop, stacked on mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left Column: Form Builder */}
          <div className="space-y-6">
            {/* Step 1: Language Selection */}
            {currentStep === 1 && (
              <LanguageSelector
                selectedLanguage={cvLanguage}
                onSelect={handleLanguageSelect}
                onNext={handleNextStep}
              />
            )}

            {/* Step 2: Template Selection */}
            {currentStep === 2 && (
              <TemplateSelector
                selectedTemplate={selectedTemplate}
                onSelect={handleTemplateSelect}
                onNext={handleNextStep}
                userPlan={userPlan}
                onUpgrade={handleTemplateUpgrade}
              />
            )}

            {/* REMOVED: Step 3 (Data Import) - CV import feature temporarily disabled */}
            {/* Steps 3+: Form Sections - Show one section at a time based on currentStep */}
            {/* Updated: Form sections now start at step 3 (Personal Info), previously step 4 */}
            {currentStep >= 3 && (
              <TooltipProvider>
                <Form {...form}>
                  {/* Personal Info Section (Step 3, was Step 4 before removing import) */}
                  {currentStep === 3 && (() => {
                    // Get CV language-specific labels for Personal Info section
                    // These labels use cvLanguage, not UI locale (isAr)
                    const personalLabels = getPersonalLabels(cvLanguage);
                    const sectionHeaders = getSectionHeaders(cvLanguage);
                    
                    return (
                      <div className="space-y-4" dir={isCvAr ? "rtl" : "ltr"}>
                        {/* Section Header */}
                        <h3 className="text-xl font-semibold mb-4">{sectionHeaders.personal}</h3>
                        
                        {/* REMOVED: Import success notification - CV import feature disabled */}
                        {/* Personal Info Form Fields */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <FormField name="fullName" control={form.control} render={({ field }) => {
                            const fieldState = form.getFieldState("fullName");
                            return (
                              <FormItem className="sm:col-span-2">
                                <FormLabel className="flex items-center gap-2">
                                  {personalLabels.fullName.label} <span className="text-red-500">*</span>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <HelpCircle className="h-4 w-4 text-zinc-400 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs" dir={isCvAr ? "rtl" : "ltr"}>
                                      <p>{isCvAr ? FIELD_HELP.fullName.ar : FIELD_HELP.fullName.en}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </FormLabel>
                                <FormControl><Input placeholder={personalLabels.fullName.placeholder} {...field} dir={isCvAr ? "rtl" : "ltr"} /></FormControl>
                                <FormMessage />
                                {fieldState.isTouched && !fieldState.error && field.value && (
                                  <p className="text-xs text-green-600 dark:text-green-400">{isCvAr ? "✓ صحيح" : "✓ Valid"}</p>
                                )}
                              </FormItem>
                            );
                          }} />
                          <FormField name="title" control={form.control} render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                              <FormLabel className="flex items-center gap-2">
                                {personalLabels.title.label}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="h-4 w-4 text-zinc-400 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs" dir={isCvAr ? "rtl" : "ltr"}>
                                    <p>{isCvAr ? FIELD_HELP.title.ar : FIELD_HELP.title.en}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </FormLabel>
                              <FormControl><Input placeholder={personalLabels.title.placeholder} {...field} dir={isCvAr ? "rtl" : "ltr"} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField name="contact.email" control={form.control} render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                {personalLabels.email.label}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="h-4 w-4 text-zinc-400 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs" dir={isCvAr ? "rtl" : "ltr"}>
                                    <p>{isCvAr ? CV_TIPS.email.ar : CV_TIPS.email.en}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </FormLabel>
                              <FormControl><Input type="email" placeholder={personalLabels.email.placeholder} {...field} value={field.value || ""} dir={isCvAr ? "rtl" : "ltr"} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField name="contact.phone" control={form.control} render={({ field }) => (
                            <FormItem>
                              <FormLabel>{personalLabels.phone.label}</FormLabel>
                              <FormControl><Input type="tel" placeholder={personalLabels.phone.placeholder} {...field} value={field.value || ""} dir={isCvAr ? "rtl" : "ltr"} /></FormControl>
                              <FormMessage />
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">{isCvAr ? "التنسيق: 010-000-0000 أو +20 1234567890" : "Format: 010-000-0000 or +20 1234567890"}</p>
                            </FormItem>
                          )} />
                          <FormField name="contact.location" control={form.control} render={({ field }) => (
                            <FormItem>
                              <FormLabel>{personalLabels.location.label}</FormLabel>
                              <FormControl><Input placeholder={personalLabels.location.placeholder} {...field} dir={isCvAr ? "rtl" : "ltr"} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField name="contact.website" control={form.control} render={({ field }) => (
                            <FormItem>
                              <FormLabel>{personalLabels.website.label}</FormLabel>
                              <FormControl><Input type="url" placeholder={personalLabels.website.placeholder} {...field} value={field.value || ""} dir={isCvAr ? "rtl" : "ltr"} /></FormControl>
                              <FormMessage />
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">{isCvAr ? "يجب أن يبدأ بـ http:// أو https://" : "Must start with http:// or https://"}</p>
                            </FormItem>
                          )} />
                          <FormField name="summary" control={form.control} render={({ field }) => {
                            const charCount = (field.value || "").length;
                            const maxChars = 500;
                            return (
                              <FormItem className="sm:col-span-2">
                                <FormLabel className="flex items-center gap-2">
                                  {personalLabels.summary.label}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <HelpCircle className="h-4 w-4 text-zinc-400 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs" dir={isCvAr ? "rtl" : "ltr"}>
                                      <p>{isCvAr ? CV_TIPS.summary.ar : CV_TIPS.summary.en}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </FormLabel>
                                <FormControl>
                                  <textarea 
                                    rows={5} 
                                    className="w-full rounded-md border px-3 py-2 text-sm outline-none" 
                                    placeholder={personalLabels.summary.placeholder} 
                                    {...field as any}
                                    value={field.value || ""}
                                    dir={isCvAr ? "rtl" : "ltr"}
                                  />
                                </FormControl>
                              <div className="flex items-center justify-between">
                                <FormMessage />
                                <p className={`text-xs ${charCount > maxChars ? "text-red-500" : "text-zinc-500 dark:text-zinc-400"}`}>
                                  {charCount}/{maxChars} {t("characters", "حرف")}
                                </p>
                              </div>
                            </FormItem>
                          );
                        }} />
                        {/* Template selection is done in Step 1, but show current selection for reference */}
                        <div className="sm:col-span-2 rounded-md border p-3 bg-zinc-50 dark:bg-zinc-900">
                          <p className="text-sm font-medium mb-1">{t("Selected Template", "القالب المختار")}</p>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            {selectedTemplate === "classic" ? t("Classic", "كلاسيك") :
                             selectedTemplate === "modern" ? t("Modern", "حديث") :
                             selectedTemplate === "elegant" ? t("Elegant", "أنيق") :
                             t("Classic", "كلاسيك")}
                          </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                              {t("To change template, go back to Step 1.", "لتغيير القالب، ارجع إلى الخطوة 1.")}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Experience Section (Step 4, was Step 5 before removing import) */}
                  {currentStep === 4 && (() => {
                    // Get CV language-specific labels for Experience section
                    const expLabels = getExperienceLabels(cvLanguage);
                    const sectionHeaders = getSectionHeaders(cvLanguage);
                    
                    return (
                      <div className="space-y-4" dir={isCvAr ? "rtl" : "ltr"}>
                        {/* Section Header */}
                        <h3 className="text-xl font-semibold mb-4">{sectionHeaders.experience}</h3>
                        
                        {expArray.fields.map((f, idx) => (
                          <div key={f.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-2">
                            <FormField name={`experience.${idx}.company`} control={form.control} render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  {expLabels.company.label} <span className="text-red-500">*</span>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <HelpCircle className="h-4 w-4 text-zinc-400 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs" dir={isCvAr ? "rtl" : "ltr"}>
                                      <p>{isCvAr ? FIELD_HELP.company.ar : FIELD_HELP.company.en}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </FormLabel>
                                <FormControl><Input placeholder={expLabels.company.placeholder} {...field} dir={isCvAr ? "rtl" : "ltr"} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField name={`experience.${idx}.role`} control={form.control} render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  {expLabels.role.label} <span className="text-red-500">*</span>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <HelpCircle className="h-4 w-4 text-zinc-400 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs" dir={isCvAr ? "rtl" : "ltr"}>
                                      <p>{isCvAr ? FIELD_HELP.role.ar : FIELD_HELP.role.en}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </FormLabel>
                                <FormControl><Input placeholder={expLabels.role.placeholder} {...field} dir={isCvAr ? "rtl" : "ltr"} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField name={`experience.${idx}.startDate`} control={form.control} render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  {expLabels.startDate.label} <span className="text-red-500">*</span>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                    <HelpCircle className="h-4 w-4 text-zinc-400 cursor-help" />
                                  </TooltipTrigger>
                                    <TooltipContent className="max-w-xs" dir={isCvAr ? "rtl" : "ltr"}>
                                      <p>{isCvAr ? CV_TIPS.date.ar : CV_TIPS.date.en}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </FormLabel>
                                <FormControl><Input placeholder={expLabels.startDate.placeholder} {...field} dir={isCvAr ? "rtl" : "ltr"} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField name={`experience.${idx}.endDate`} control={form.control} render={({ field }) => {
                              const isPresent = presentStates[idx] || false;
                              
                              return (
                                <FormItem>
                                  <div className="flex items-center justify-between">
                                    <FormLabel className="flex items-center gap-2">
                                      {expLabels.endDate.label}
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <HelpCircle className="h-4 w-4 text-zinc-400 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs" dir={isCvAr ? "rtl" : "ltr"}>
                                          <p>{isCvAr ? "اتركه فارغاً للوظيفة الحالية" : "Leave empty for current position"}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </FormLabel>
                                    <div className="flex items-center gap-2">
                                      <Checkbox
                                        id={`present-${idx}`}
                                        checked={isPresent}
                                        onCheckedChange={(checked) => {
                                          const newState = checked === true;
                                          setPresentStates((prev) => ({ ...prev, [idx]: newState }));
                                          
                                          // Clear end date when "Present" is checked
                                          if (newState) {
                                            field.onChange("");
                                          }
                                        }}
                                      />
                                      <label
                                        htmlFor={`present-${idx}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                      >
                                        {expLabels.present.label}
                                      </label>
                                    </div>
                                  </div>
                                  <FormControl>
                                    <Input
                                      placeholder={isPresent ? expLabels.present.label : expLabels.endDate.placeholder}
                                      {...field}
                                      value={field.value || ""}
                                      disabled={isPresent}
                                      className={isPresent ? "bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed" : ""}
                                      dir={isCvAr ? "rtl" : "ltr"}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              );
                            }} />
                            <FormField name={`experience.${idx}.description`} control={form.control} render={({ field }) => {
                              const charCount = (field.value || "").length;
                              const maxChars = 1000;
                              return (
                                <FormItem className="sm:col-span-2">
                                  <FormLabel className="flex items-center gap-2">
                                    {expLabels.description.label}
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <HelpCircle className="h-4 w-4 text-zinc-400 cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs" dir={isCvAr ? "rtl" : "ltr"}>
                                        <p>{isCvAr ? CV_TIPS.experienceDescription.ar : CV_TIPS.experienceDescription.en}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </FormLabel>
                                  <FormControl>
                                    <textarea 
                                      rows={3} 
                                      className="w-full rounded-md border px-3 py-2 text-sm outline-none" 
                                      placeholder={expLabels.description.placeholder}
                                      {...field} 
                                      value={field.value || ""}
                                      dir={isCvAr ? "rtl" : "ltr"}
                                    />
                                  </FormControl>
                                <div className="flex items-center justify-between">
                                  <FormMessage />
                                  <p className={`text-xs ${charCount > maxChars ? "text-red-500" : "text-zinc-500 dark:text-zinc-400"}`}>
                                    {charCount}/{maxChars}
                                  </p>
                                </div>
                              </FormItem>
                            );
                          }} />
                          <div className="sm:col-span-2 flex justify-end">
                            <Button variant="secondary" type="button" onClick={() => {
                              expArray.remove(idx);
                              // Clean up present state for removed entry
                              setPresentStates((prev) => {
                                const updated = { ...prev };
                                delete updated[idx];
                                // Shift indices for entries after the removed one
                                const shifted: Record<number, boolean> = {};
                                Object.keys(updated).forEach((key) => {
                                  const keyNum = parseInt(key);
                                  if (keyNum > idx) {
                                    shifted[keyNum - 1] = updated[keyNum];
                                  } else if (keyNum < idx) {
                                    shifted[keyNum] = updated[keyNum];
                                  }
                                });
                                return shifted;
                              });
                            }}>{t("Remove", "حذف")}</Button>
                          </div>
                        </div>
                      ))}
                      <Button type="button" onClick={() => {
                        expArray.append({ company: "", role: "", startDate: "" });
                        // Clear present state for new entry
                        const newIdx = expArray.fields.length;
                        setPresentStates((prev) => {
                          const updated = { ...prev };
                          delete updated[newIdx];
                          return updated;
                        });
                      }}>{expLabels.addButton}</Button>
                    </div>
                  );
                  })()}

                  {/* Projects Section (Step 5, was Step 6 before removing import) */}
                  {currentStep === 5 && (() => {
                    // Get CV language-specific labels for Projects section
                    const projLabels = getProjectsLabels(cvLanguage);
                    const sectionHeaders = getSectionHeaders(cvLanguage);
                    
                    return (
                      <div className="space-y-4" dir={isCvAr ? "rtl" : "ltr"}>
                        {/* Section Header with Toggle */}
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-semibold">{sectionHeaders.projects}</h3>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="include-projects"
                              checked={includeProjects}
                              onCheckedChange={(checked) => {
                                const newState = checked === true;
                                setIncludeProjects(newState);
                                // If disabling, clear all projects
                                if (!newState && projects.length > 0) {
                                  projectsArray.remove();
                                  // Remove all projects
                                  while (projectsArray.fields.length > 0) {
                                    projectsArray.remove(0);
                                  }
                                } else if (newState && projects.length === 0) {
                                  // If enabling and no projects exist, add one empty project with all fields defaulted
                                  projectsArray.append({ title: "", startDate: "", endDate: "", description: "" });
                                }
                              }}
                            />
                            <label
                              htmlFor="include-projects"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {t("Include Projects Section", "تضمين قسم المشاريع")}
                            </label>
                          </div>
                        </div>
                        
                        {/* Optional section note */}
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                          {t("Projects are optional. Toggle above to include or skip this section.", "المشاريع اختيارية. استخدم المفتاح أعلاه لتضمين أو تخطي هذا القسم.")}
                        </p>
                        
                        {/* Projects form fields - only show if includeProjects is true */}
                        {includeProjects && (
                          <>
                            {projectsArray.fields.map((f, idx) => (
                              <div key={f.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-2">
                                <FormField name={`projects.${idx}.title`} control={form.control} render={({ field }) => (
                                  <FormItem className="sm:col-span-2">
                                    <FormLabel className="flex items-center gap-2">
                                      {projLabels.title.label} <span className="text-red-500">*</span>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <HelpCircle className="h-4 w-4 text-zinc-400 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs" dir={isCvAr ? "rtl" : "ltr"}>
                                          <p>{isCvAr ? projLabels.title.tooltip.ar : projLabels.title.tooltip.en}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder={projLabels.title.placeholder} 
                                        {...field} 
                                        value={field.value || ""}
                                        dir={isCvAr ? "rtl" : "ltr"} 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                                <FormField name={`projects.${idx}.startDate`} control={form.control} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                      {projLabels.startDate.label} <span className="text-red-500">*</span>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <HelpCircle className="h-4 w-4 text-zinc-400 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs" dir={isCvAr ? "rtl" : "ltr"}>
                                          <p>{isCvAr ? CV_TIPS.date.ar : CV_TIPS.date.en}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder={projLabels.startDate.placeholder} 
                                        {...field} 
                                        value={field.value || ""}
                                        dir={isCvAr ? "rtl" : "ltr"} 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                                <FormField name={`projects.${idx}.endDate`} control={form.control} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                      {projLabels.endDate.label}
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <HelpCircle className="h-4 w-4 text-zinc-400 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs" dir={isCvAr ? "rtl" : "ltr"}>
                                          <p>{isCvAr ? "اتركه فارغاً للمشروع الحالي" : "Leave empty for ongoing project"}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder={projLabels.endDate.placeholder} 
                                        {...field} 
                                        value={field.value || ""}
                                        dir={isCvAr ? "rtl" : "ltr"} 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                                <FormField name={`projects.${idx}.description`} control={form.control} render={({ field }) => {
                                  const charCount = (field.value || "").length;
                                  const maxChars = 1000;
                                  return (
                                    <FormItem className="sm:col-span-2">
                                      <FormLabel className="flex items-center gap-2">
                                        {projLabels.description.label}
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <HelpCircle className="h-4 w-4 text-zinc-400 cursor-help" />
                                          </TooltipTrigger>
                                          <TooltipContent className="max-w-xs" dir={isCvAr ? "rtl" : "ltr"}>
                                            <p>{isCvAr ? projLabels.description.tooltip.ar : projLabels.description.tooltip.en}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </FormLabel>
                                      <FormControl>
                                        <textarea 
                                          rows={3} 
                                          className="w-full rounded-md border px-3 py-2 text-sm outline-none" 
                                          placeholder={projLabels.description.placeholder}
                                          {...field} 
                                          value={field.value || ""}
                                          dir={isCvAr ? "rtl" : "ltr"}
                                        />
                                      </FormControl>
                                      <div className="flex items-center justify-between">
                                        <FormMessage />
                                        <p className={`text-xs ${charCount > maxChars ? "text-red-500" : "text-zinc-500 dark:text-zinc-400"}`}>
                                          {charCount}/{maxChars}
                                        </p>
                                      </div>
                                    </FormItem>
                                  );
                                }} />
                                <div className="sm:col-span-2 flex justify-end">
                                  <Button variant="secondary" type="button" onClick={() => projectsArray.remove(idx)}>
                                    {t("Remove", "حذف")}
                                  </Button>
                                </div>
                              </div>
                            ))}
                            <Button type="button" onClick={() => projectsArray.append({ title: "", startDate: "", endDate: "", description: "" })}>
                              {projLabels.addButton}
                            </Button>
                          </>
                        )}
                      </div>
                    );
                  })()}

                  {/* Education Section (Step 7) */}
                  {/* 
                    NOTE: Education, Skills, Languages, and Certifications sections follow the same pattern:
                    - Wrap in IIFE: {currentStep === X && (() => { ... return (...) })()}
                    - Get CV language labels: const labels = getXXXLabels(cvLanguage);
                    - Get section headers: const headers = getSectionHeaders(cvLanguage);
                    - Apply dir={isCvAr ? "rtl" : "ltr"} to container and inputs
                    - Use labels.label, labels.placeholder for all FormLabel and Input
                    - Use headers.xxx for section headers
                    - Use isCvAr instead of isAr for tooltips and help text
                  */}
                  {/* Education Section (Step 6, was Step 7 before removing import) */}
                  {currentStep === 6 && (() => {
                    const eduLabels = getEducationLabels(cvLanguage);
                    const sectionHeaders = getSectionHeaders(cvLanguage);
                    return (
                      <div className="space-y-4" dir={isCvAr ? "rtl" : "ltr"}>
                        <h3 className="text-xl font-semibold mb-4">{sectionHeaders.education}</h3>
                        <div className="space-y-4">
                          {eduArray.fields.map((f, idx) => (
                            <div key={f.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-2">
                              <FormField name={`education.${idx}.school`} control={form.control} render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-2">
                                    {eduLabels.school.label} <span className="text-red-500">*</span>
                                  </FormLabel>
                                  <FormControl><Input placeholder={eduLabels.school.placeholder} {...field} dir={isCvAr ? "rtl" : "ltr"} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                              <FormField name={`education.${idx}.degree`} control={form.control} render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-2">
                                    {eduLabels.degree.label} <span className="text-red-500">*</span>
                                  </FormLabel>
                                  <FormControl><Input placeholder={eduLabels.degree.placeholder} {...field} dir={isCvAr ? "rtl" : "ltr"} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                              <FormField name={`education.${idx}.startDate`} control={form.control} render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-2">
                                    {eduLabels.startDate.label} <span className="text-red-500">*</span>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <HelpCircle className="h-4 w-4 text-zinc-400 cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs" dir={isCvAr ? "rtl" : "ltr"}>
                                        <p>{isCvAr ? CV_TIPS.date.ar : CV_TIPS.date.en}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </FormLabel>
                                  <FormControl><Input placeholder={eduLabels.startDate.placeholder} {...field} dir={isCvAr ? "rtl" : "ltr"} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                              <FormField name={`education.${idx}.endDate`} control={form.control} render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-2">
                                    {eduLabels.endDate.label}
                                  </FormLabel>
                                  <FormControl><Input placeholder={eduLabels.endDate.placeholder} {...field} value={field.value || ""} dir={isCvAr ? "rtl" : "ltr"} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                              <div className="sm:col-span-2 flex justify-end">
                                <Button variant="secondary" type="button" onClick={() => eduArray.remove(idx)}>{eduLabels.removeButton}</Button>
                              </div>
                            </div>
                          ))}
                          <Button type="button" onClick={() => eduArray.append({ school: "", degree: "", startDate: "" })}>{eduLabels.addButton}</Button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Skills Section (Step 7, was Step 8 before removing import) */}
                  {currentStep === 7 && (() => {
                    const skillsLabels = getSkillsLabels(cvLanguage);
                    const sectionHeaders = getSectionHeaders(cvLanguage);
                    return (
                      <div className="space-y-4" dir={isCvAr ? "rtl" : "ltr"}>
                        <h3 className="text-xl font-semibold mb-4">{sectionHeaders.skills}</h3>
                        <div className="flex items-start gap-2 rounded-lg border bg-blue-50 dark:bg-blue-950 p-3 mb-4">
                          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            {isCvAr ? CV_TIPS.skills.ar : CV_TIPS.skills.en}
                          </p>
                        </div>
                        <div className="space-y-3">
                          {skillsArray.fields.map((f, idx) => (
                            <div key={f.id} className="flex items-center gap-2">
                              <FormField
                                name={`skills.${idx}`}
                                control={form.control}
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormControl>
                                      <Input placeholder={skillsLabels.skill.placeholder} {...field} value={field.value || ""} dir={isCvAr ? "rtl" : "ltr"} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button variant="secondary" type="button" onClick={() => skillsArray.remove(idx)}>{skillsLabels.removeButton}</Button>
                            </div>
                          ))}
                          <Button type="button" onClick={() => skillsArray.append("")}>{skillsLabels.addButton}</Button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Languages Section (Step 8, was Step 9 before removing import) */}
                  {currentStep === 8 && (() => {
                    const langLabels = getLanguagesLabels(cvLanguage);
                    const sectionHeaders = getSectionHeaders(cvLanguage);
                    return (
                      <div className="space-y-3" dir={isCvAr ? "rtl" : "ltr"}>
                        <h3 className="text-xl font-semibold mb-4">{sectionHeaders.languages}</h3>
                        {langsArray.fields.map((f, idx) => (
                          <div key={f.id} className="flex items-center gap-2">
                            <FormField
                              name={`languages.${idx}`}
                              control={form.control}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input placeholder={langLabels.language.placeholder} {...field} value={field.value || ""} dir={isCvAr ? "rtl" : "ltr"} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button variant="secondary" type="button" onClick={() => langsArray.remove(idx)}>{langLabels.removeButton}</Button>
                          </div>
                        ))}
                        <Button type="button" onClick={() => langsArray.append("")}>{langLabels.addButton}</Button>
                      </div>
                    );
                  })()}

                  {/* Certifications Section (Step 9, was Step 10 before removing import) */}
                  {currentStep === 9 && (() => {
                    const certLabels = getCertificationsLabels(cvLanguage);
                    const sectionHeaders = getSectionHeaders(cvLanguage);
                    return (
                      <div className="space-y-3" dir={isCvAr ? "rtl" : "ltr"}>
                        <h3 className="text-xl font-semibold mb-4">{sectionHeaders.certifications}</h3>
                        {certsArray.fields.map((f, idx) => (
                          <div key={f.id} className="flex items-center gap-2">
                            <FormField
                              name={`certifications.${idx}`}
                              control={form.control}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input placeholder={certLabels.certification.placeholder} {...field} value={field.value || ""} dir={isCvAr ? "rtl" : "ltr"} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button variant="secondary" type="button" onClick={() => certsArray.remove(idx)}>{certLabels.removeButton}</Button>
                          </div>
                        ))}
                        <Button type="button" onClick={() => certsArray.append("")}>{certLabels.addButton}</Button>
                      </div>
                    );
                  })()}

                  {/* Navigation Buttons for Form Steps */}
                  {currentStep >= 3 && currentStep < steps.length && (
                    <div className={`flex justify-between gap-3 pt-4 border-t ${isAr ? "flex-row-reverse" : ""}`}>
                      <Button 
                        variant="outline" 
                        onClick={handlePreviousStep}
                        disabled={currentStep <= 3}
                        className={isAr ? "flex-row-reverse" : ""}
                      >
                        {isAr ? (
                          <>→ {t("Back", "رجوع")}</>
                        ) : (
                          <>{t("Back", "رجوع")} ←</>
                        )}
                      </Button>
                      <Button 
                        variant="secondary" 
                        onClick={handleNextStep}
                        disabled={currentStep >= steps.length}
                        className={isAr ? "flex-row-reverse" : ""}
                      >
                        {isAr ? (
                          <>{t("Next", "التالي")} ←</>
                        ) : (
                          <>{t("Next", "التالي")} →</>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Validation Summary & Footer actions - only show on last step */}
                  {currentStep === steps.length && (
                    <div className="mt-6 space-y-4 border-t pt-6">
                      {/* Validation status indicator - shows overall form validation state */}
                      {(() => {
                        const errors = form.formState.errors;
                        const errorCount = countFormErrors(errors);
                        const isValid = form.formState.isValid;
                        const isDirty = form.formState.isDirty;

                        if (errorCount > 0 && isDirty) {
                          return (
                            <Alert variant="destructive" className="mb-4">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>{t("Validation Errors", "أخطاء التحقق")}</AlertTitle>
                              <AlertDescription>
                                {t(
                                  `Please fix ${errorCount} error${errorCount > 1 ? "s" : ""} before proceeding.`,
                                  `يرجى إصلاح ${errorCount} خطأ${errorCount > 1 ? "ات" : ""} قبل المتابعة.`
                                )}
                              </AlertDescription>
                            </Alert>
                          );
                        } else if (isValid && isDirty) {
                          return (
                            <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-950">
                              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                              <AlertDescription className="text-green-700 dark:text-green-300">
                                {t("All fields are valid! ✓", "جميع الحقول صحيحة! ✓")}
                              </AlertDescription>
                            </Alert>
                          );
                        }
                        return null;
                      })()}

                      <div className={`flex flex-col gap-3 sm:flex-row justify-between ${isAr ? "sm:flex-row-reverse" : ""}`}>
                        {/* Save & Finish */}
                        <div className={`flex gap-2 ${isAr ? "flex-row-reverse" : ""}`}>
                          <Button
                            onClick={handleSaveDraft}
                            disabled={draftSaving || draftLoading}
                            className="text-white"
                            style={{ backgroundColor: "#0d47a1" }}
                          >
                            {draftSaving ? (
                              <>
                                <Loader2 className={`h-4 w-4 animate-spin ${isAr ? "ml-2" : "mr-2"}`} />
                                {t("Saving...", "جارٍ الحفظ...")}
                              </>
                            ) : (
                              t("Save Draft", "حفظ مسودة")
                            )}
                          </Button>
                          <Button
                            variant="secondary"
                            disabled={draftSaving || draftLoading}
                            onClick={async () => {
                              // Validate before finishing
                              const isValid = await form.trigger();
                              if (!isValid) {
                                setDraftStatus("error");
                                setDraftMessage(
                                  t(
                                    "Please fix validation errors before finishing.",
                                    "يرجى إصلاح أخطاء التحقق قبل الإنهاء."
                                  )
                                );
                                setTimeout(() => {
                                  setDraftStatus("idle");
                                  setDraftMessage(null);
                                }, 5000);
                                return;
                              }
                              
                              // Save draft first (handles both authenticated and guest modes)
                              // Wait for save to complete successfully before proceeding
                              const saveSuccessful = await handleSaveDraft();
                              
                              if (!saveSuccessful) {
                                // If save failed, don't proceed to dashboard
                                // Error message already shown by handleSaveDraft
                                return;
                              }
                              
                              // For authenticated users: go to dashboard; for guests: prompt to sign in
                              if (user) {
                                // Small delay to ensure Firestore save is fully committed
                                await new Promise(resolve => setTimeout(resolve, 500));
                                // Set flag to indicate navigation from create-cv page
                                if (typeof window !== "undefined") {
                                  sessionStorage.setItem("navigated_from_create_cv", "true");
                                }
                                router.push("/dashboard");
                              } else {
                                // Guest user: prompt to sign in to access dashboard
                                setAuthModalAction("general");
                                setPendingProtectedAction(() => () => {
                                  // Set flag to indicate navigation from create-cv page
                                  if (typeof window !== "undefined") {
                                    sessionStorage.setItem("navigated_from_create_cv", "true");
                                  }
                                  router.push("/dashboard");
                                });
                                setShowAuthModal(true);
                              }
                            }}
                          >
                            {t("Finish", "إنهاء")}
                          </Button>
                        </div>
                        
                        {/* Info about PDF download */}
                        <div className={`text-xs text-zinc-500 dark:text-zinc-400 text-center ${isAr ? "sm:text-right" : "sm:text-left"}`}>
                          {t(
                            "PDF download available after payment",
                            "تنزيل PDF متاح بعد الدفع"
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                </Form>
              </TooltipProvider>
            )}
          </div>

          {/* Right Column: Live Preview (always show on desktop, show on mobile from step 3+) */}
          {/* Updated: Preview shows from step 3 (Personal Info), previously step 4 */}
          <div className={`${currentStep < 3 ? "hidden lg:block" : ""} lg:sticky lg:top-4 lg:self-start`}>
            <LiveCvPreview 
              data={cvPreviewData}
              templateKey={selectedTemplate}
              cvLanguage={cvLanguage}
            />
          </div>
        </div>
      </section>

      {/* Confirmation dialog for overwriting unsaved changes */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Unsaved Changes", "تغييرات غير محفوظة")}</DialogTitle>
            <DialogDescription>
              {t(
                "You have unsaved changes. Do you want to continue? Your current changes will be lost.",
                "لديك تغييرات غير محفوظة. هل تريد المتابعة؟ سيتم فقدان التغييرات الحالية."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              {t("Cancel", "إلغاء")}
            </Button>
            <Button
              onClick={confirmPendingAction}
              className="text-white"
              style={{ backgroundColor: "#0d47a1" }}
            >
              {t("Continue", "متابعة")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auth Required Modal - shown when guest user attempts protected action */}
      <AuthRequiredModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        action={authModalAction}
        onAuthSuccess={pendingProtectedAction || undefined}
      />
    </SiteLayout>
  );
}

export default function CreateCvPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateCvPageContent />
    </Suspense>
  );
}


