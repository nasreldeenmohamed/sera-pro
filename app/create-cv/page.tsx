"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { saveUserDraft, getUserDraft, type CvDraftData } from "@/firebase/firestore";
import { ClassicTemplate } from "@/components/pdf/Templates";
import { downloadPdf } from "@/lib/pdf";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { CheckCircle2, XCircle, Clock, Loader2, Linkedin, Upload, ExternalLink, HelpCircle, Info, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CV_TIPS, FIELD_HELP, hasMinimumDataForAI, formatValidationMessage, countFormErrors } from "@/lib/cv-helpers";
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
import { DataImportStep } from "@/components/cv-builder/DataImportStep";

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
export default function CreateCvPage() {
  const router = useRouter();
  const params = useSearchParams();
  const cvId = params.get("id");
  const { user, loading: authLoading } = useAuth();
  const { isAr, t } = useLocale();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      title: "",
      summary: "",
      contact: { email: "", phone: "", location: "", website: "" },
      experience: [],
      education: [],
      skills: [],
      languages: [],
      certifications: [],
      templateKey: "classic",
    },
  });

  const expArray = useFieldArray({ control: form.control, name: "experience" });
  const eduArray = useFieldArray({ control: form.control, name: "education" });
  const skillsArray = useFieldArray({ control: form.control, name: "skills" });
  const langsArray = useFieldArray({ control: form.control, name: "languages" });
  const certsArray = useFieldArray({ control: form.control, name: "certifications" });

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
  const [currentStep, setCurrentStep] = useState(1); // 1: Template, 2: Import, 3+: Form sections
  const [selectedTemplate, setSelectedTemplate] = useState<string>(form.getValues("templateKey") || "classic");
  const [dataImported, setDataImported] = useState(false);
  
  // Track "Present" checkbox state for each experience entry
  // Key: experience index, Value: boolean (is present)
  const [presentStates, setPresentStates] = useState<Record<number, boolean>>({});
  
  // Define steps for the wizard
  const steps = useMemo(() => [
    { key: "template", label: { en: "Template", ar: "القالب" } },
    { key: "import", label: { en: "Import", ar: "الاستيراد" } },
    { key: "personal", label: { en: "Personal", ar: "بيانات" } },
    { key: "experience", label: { en: "Experience", ar: "خبرات" } },
    { key: "education", label: { en: "Education", ar: "تعليم" } },
    { key: "skills", label: { en: "Skills", ar: "مهارات" } },
    { key: "languages", label: { en: "Languages", ar: "لغات" } },
    { key: "certs", label: { en: "Certifications", ar: "شهادات" } },
  ], []);

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
              await saveUserDraft(uid, data as CvDraftData);
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

  // Load existing CV if cvId is present, otherwise auto-load draft (authenticated) or guest draft
  useEffect(() => {
    async function loadData() {
      // If editing a specific CV (authenticated only)
      if (cvId) {
        if (!user) {
          // Redirect to auth if trying to edit CV without auth
          router.push("/auth?redirect=/create-cv&id=" + cvId);
          return;
        }

        try {
          // Import getUserCv for editing existing CVs
          const { getUserCv } = await import("@/firebase/firestore");
          const data = await getUserCv(user.uid, cvId);
          if (data) {
            form.reset({
              fullName: (data as any).fullName || "",
              title: (data as any).title || "",
              summary: (data as any).summary || "",
              contact: (data as any).contact || { email: "", phone: "", location: "", website: "" },
              experience: (data as any).experience || [],
              education: (data as any).education || [],
              skills: (data as any).skills || [],
              languages: (data as any).languages || [],
              certifications: (data as any).certifications || [],
              templateKey: (data as any).templateKey || "classic",
            });
            // Set present states for experience entries
            const importedPresentStates: Record<number, boolean> = {};
            ((data as any).experience || []).forEach((exp: any, expIdx: number) => {
              if (!exp.endDate || exp.endDate.trim() === "") {
                importedPresentStates[expIdx] = true;
              }
            });
            setPresentStates(importedPresentStates);
            // Set template and move to form entry
            setSelectedTemplate((data as any).templateKey || "classic");
            setCurrentStep(3);
            hasLoadedDraft.current = true;
          }
        } catch (error) {
          console.error("Failed to load CV:", error);
        }
        return; // Don't load draft if editing specific CV
      }

      // For authenticated users: load cloud draft
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
            });
            // Set present states for experience entries (empty endDate = present)
            const presentStatesMap: Record<number, boolean> = {};
            (draft.experience || []).forEach((exp, expIdx) => {
              if (!exp.endDate || exp.endDate.trim() === "") {
                presentStatesMap[expIdx] = true;
              }
            });
            setPresentStates(presentStatesMap);
            // Set template and move to form entry (step 3+)
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
              });
              // Set present states for experience entries
              const guestPresentStates: Record<number, boolean> = {};
              (guestDraft.experience || []).forEach((exp, expIdx) => {
                if (!exp.endDate || exp.endDate.trim() === "") {
                  guestPresentStates[expIdx] = true;
                }
              });
              setPresentStates(guestPresentStates);
              // Set template and move to form entry
              setSelectedTemplate(guestDraft.templateKey || "classic");
              setCurrentStep(3);
              hasLoadedDraft.current = true;
              // Migrate guest draft to cloud
              await migrateGuestDraft(user.uid, async (uid, data) => {
                await saveUserDraft(uid, data as CvDraftData);
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
          // Set template and move to form entry
          setSelectedTemplate(guestDraft.templateKey || "classic");
          setCurrentStep(3);
          hasLoadedDraft.current = true;
        } else {
          setDraftExists(false);
        }
      }
    }
    loadData();
  }, [user, cvId, form, t, router]);

  // Save draft function - supports both authenticated (cloud) and guest (localStorage) modes
  // Single draft per user policy: each save overwrites the previous draft
  async function handleSaveDraft() {
    const values = form.getValues();
    const draftData: GuestDraftData = {
      fullName: values.fullName || "",
      title: values.title,
      summary: values.summary,
      contact: values.contact || { email: "", phone: "", location: "", website: "" },
      experience: values.experience || [],
      education: values.education || [],
      skills: values.skills || [],
      languages: values.languages || [],
      certifications: values.certifications || [],
      templateKey: values.templateKey || "classic",
    };

    // If authenticated, save to Firestore; otherwise prompt for auth
    if (user) {
      setDraftSaving(true);
      setDraftStatus("idle");
      setDraftMessage(null);

      try {
        await saveUserDraft(user.uid, draftData as CvDraftData);
        setDraftExists(true);
        setDraftLastUpdated(new Date());
        hasUnsavedChanges.current = false;
        setDraftStatus("success");
        setDraftMessage(t("Draft saved successfully!", "تم حفظ المسودة بنجاح!"));
        setTimeout(() => {
          setDraftStatus("idle");
          setDraftMessage(null);
        }, 3000);
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
      } finally {
        setDraftSaving(false);
      }
    } else {
      // Guest mode: save to localStorage as fallback, but prompt for auth to save to cloud
      try {
        saveGuestDraft(draftData);
        setDraftLastUpdated(new Date());
        hasUnsavedChanges.current = false;
        setDraftStatus("success");
        setDraftMessage(t("Draft saved locally. Sign in to save to cloud.", "تم حفظ المسودة محليًا. سجّل الدخول للحفظ على السحابة."));
        setTimeout(() => {
          setDraftStatus("idle");
          setDraftMessage(null);
        }, 4000);

        // Show auth modal for cloud save option
        setAuthModalAction("save");
        setPendingProtectedAction(() => async () => {
          // After auth, this will be called to save to cloud
          if (user) {
            await saveUserDraft(user.uid, draftData as CvDraftData);
            setDraftStatus("success");
            setDraftMessage(t("Draft saved to cloud!", "تم حفظ المسودة على السحابة!"));
            setTimeout(() => {
              setDraftStatus("idle");
              setDraftMessage(null);
            }, 3000);
          }
        });
        setShowAuthModal(true);
      } catch (error: any) {
        console.error("Failed to save guest draft:", error);
        setDraftStatus("error");
        setDraftMessage(t("Failed to save draft.", "فشل حفظ المسودة."));
        setTimeout(() => setDraftStatus("idle"), 3000);
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
          // Set template and move to form entry
          setSelectedTemplate(guestDraft.templateKey || "classic");
          setCurrentStep(3);
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
  function handleTemplateSelect(templateKey: string) {
    setSelectedTemplate(templateKey);
    form.setValue("templateKey", templateKey);
  }

  // Data import handler
  function handleDataImport(importedData: any) {
    // Merge imported data with existing form data
    const existingData = form.getValues();
    const mergedData = {
      ...existingData,
      ...importedData,
      // Merge arrays instead of replacing
      experience: [...(existingData.experience || []), ...(importedData.experience || [])],
      education: [...(existingData.education || []), ...(importedData.education || [])],
      skills: [...(new Set([...(existingData.skills || []), ...(importedData.skills || [])]))],
      languages: [...(new Set([...(existingData.languages || []), ...(importedData.languages || [])]))],
      certifications: [...(new Set([...(existingData.certifications || []), ...(importedData.certifications || [])]))],
    };
    
    form.reset(mergedData);
    hasLoadedDraft.current = true;
    setDataImported(true);
    
    // Show success message
    setDraftStatus("success");
    setDraftMessage(t("Data imported successfully! Please review and edit.", "تم استيراد البيانات بنجاح! يرجى المراجعة والتعديل."));
    setTimeout(() => {
      setDraftStatus("idle");
      setDraftMessage(null);
    }, 5000);
  }

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

  function handleSkipImport() {
    setCurrentStep(3); // Skip to Personal Info step
  }

  // Sync template selection with form
  useEffect(() => {
    form.setValue("templateKey", selectedTemplate);
  }, [selectedTemplate, form]);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // LinkedIn import state
  const [linkedInLoading, setLinkedInLoading] = useState(false);
  const [linkedInError, setLinkedInError] = useState<string | null>(null);
  const [linkedInSuccess, setLinkedInSuccess] = useState(false);
  const [showLinkedInImport, setShowLinkedInImport] = useState(false);
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [linkedInInstructions, setLinkedInInstructions] = useState<string[]>([]);

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
    try {
      const res = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: form.getValues(), locale: isAr ? "ar" : "en" }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || t("AI enhancement failed", "فشل تحسين الذكاء الاصطناعي"));
      }
      const json = await res.json();
      if (json.enhancedData) {
        form.reset(json.enhancedData);
      }
    } catch (e: any) {
      setAiError(e?.message || t("AI enhancement error", "خطأ في تحسين الذكاء الاصطناعي"));
    } finally {
      setAiLoading(false);
    }
  }

  async function exportPdf() {
    // PDF download is a protected action (premium feature / paywall)
    // Require authentication before allowing download
    if (!user) {
      setAuthModalAction("download");
      setPendingProtectedAction(() => exportPdf);
      setShowAuthModal(true);
      return;
    }

    // Validate form before PDF export
    const isValid = await form.trigger();
    if (!isValid) {
      setDraftStatus("error");
      setDraftMessage(
        t(
          "Please fix validation errors before exporting PDF.",
          "يرجى إصلاح أخطاء التحقق قبل تصدير PDF."
        )
      );
      setTimeout(() => {
        setDraftStatus("idle");
        setDraftMessage(null);
      }, 5000);
      return;
    }

    // Check minimum required data
    const data = form.getValues();
    if (!data.fullName || data.fullName.trim().length < 2) {
      setDraftStatus("error");
      setDraftMessage(
        t(
          "Please enter your full name before exporting PDF.",
          "يرجى إدخال اسمك الكامل قبل تصدير PDF."
        )
      );
      setTimeout(() => {
        setDraftStatus("idle");
        setDraftMessage(null);
      }, 5000);
      return;
    }

    // TODO(paywall): Check user plan/credits before allowing download
    // TODO(templates): Switch on templateKey for different designs; add fonts for Arabic
    await downloadPdf(<ClassicTemplate data={data} isAr={isAr} />, `${data.fullName || "cv"}.pdf`);
  }

  // LinkedIn import handler - supports JSON file upload (primary method)
  async function handleLinkedInImport(file?: File, url?: string) {
    if (!file && !url) return;

    setLinkedInLoading(true);
    setLinkedInError(null);
    setLinkedInSuccess(false);
    setLinkedInInstructions([]); // Clear instructions when starting new import

    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      }
      if (url) {
        formData.append("url", url);
      }

      const res = await fetch("/api/linkedin/import", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        // If URL import is not available, show helpful instructions instead of error
        if (json.fallback && json.fallback.steps && Array.isArray(json.fallback.steps)) {
          setLinkedInInstructions(json.fallback.steps);
          setLinkedInError(t(
            "Direct URL import is not available. Please use the JSON file upload method instead.",
            "استيراد الرابط المباشر غير متاح. يرجى استخدام طريقة تحميل ملف JSON بدلاً من ذلك."
          ));
          setLinkedInLoading(false);
          return; // Don't throw, just show instructions
        }
        throw new Error(json.error || t("Failed to import LinkedIn data.", "فشل استيراد بيانات LinkedIn."));
      }

      if (json.success && json.data) {
        // Merge with existing form data (preserve any existing fields)
        const existingData = form.getValues();
        const mergedData = {
          ...existingData,
          ...json.data,
          // Merge arrays instead of replacing
          experience: [...(existingData.experience || []), ...(json.data.experience || [])],
          education: [...(existingData.education || []), ...(json.data.education || [])],
          skills: [...(new Set([...(existingData.skills || []), ...(json.data.skills || [])]))], // Remove duplicates
          languages: [...(new Set([...(existingData.languages || []), ...(json.data.languages || [])]))],
          certifications: [...(new Set([...(existingData.certifications || []), ...(json.data.certifications || [])]))],
        };

        form.reset(mergedData);
        hasLoadedDraft.current = true;
        setLinkedInSuccess(true);
        setShowLinkedInImport(false);
        setLinkedInUrl("");
        
        // Show success message
        setDraftStatus("success");
        setDraftMessage(t("LinkedIn data imported successfully! Please review and edit as needed.", "تم استيراد بيانات LinkedIn بنجاح! يرجى المراجعة والتعديل حسب الحاجة."));
        setTimeout(() => {
          setDraftStatus("idle");
          setDraftMessage(null);
        }, 5000);
      }
    } catch (error: any) {
      console.error("LinkedIn import error:", error);
      setLinkedInError(error.message || t("Failed to import LinkedIn data.", "فشل استيراد بيانات LinkedIn."));
    } finally {
      setLinkedInLoading(false);
    }
  }

  // Handle file upload
  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      // Clear previous errors and instructions
      setLinkedInError(null);
      setLinkedInInstructions([]);
      
      if (file.type !== "application/json" && !file.name.endsWith(".json")) {
        setLinkedInError(t("Please upload a valid JSON file from LinkedIn Data Export.", "يرجى تحميل ملف JSON صالح من تصدير بيانات LinkedIn."));
        return;
      }
      handleLinkedInImport(file);
    }
  }

  // Clear LinkedIn import state when toggling section
  function handleToggleLinkedInImport() {
    setShowLinkedInImport(!showLinkedInImport);
    if (!showLinkedInImport) {
      // Clear state when opening
      setLinkedInError(null);
      setLinkedInInstructions([]);
      setLinkedInSuccess(false);
    }
  }

  // Get current step key
  const currentStepKey = steps[currentStep - 1]?.key || "template";

  return (
    <SiteLayout>
      <section className="mx-auto w-full max-w-5xl p-6 sm:p-8 md:p-12">
        {/* Step Indicator - only show if past template selection */}
        {currentStep > 1 && (
          <div className="mb-6">
            <StepIndicator
              currentStep={currentStep}
              totalSteps={steps.length}
              steps={steps}
            />
          </div>
        )}

        <header className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                {t("Last saved", "آخر حفظ")}: {draftLastUpdated.toLocaleString(isAr ? "ar-EG" : "en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
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
          <div className="flex flex-wrap gap-2">
            {/* Load Draft button */}
            <Button
              variant="outline"
              disabled={draftLoading || draftSaving}
              onClick={() => handleLoadDraft()}
            >
              {draftLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("Loading...", "جارٍ التحميل...")}
                </>
              ) : (
                t("Load Draft", "تحميل مسودة")
              )}
            </Button>
            {/* AI Enhance: calls API route; TODO refine prompt and handle edge cases */}
            <Button variant="secondary" disabled={aiLoading || draftSaving} onClick={enhanceWithAI}>
              {aiLoading ? t("Enhancing...", "...تحسين") : t("Enhance with AI", "تحسين بالذكاء")}
            </Button>
            {/* PDF Export: client-side generation using React-PDF; TODO add more templates and fonts */}
            <Button variant="secondary" disabled={draftSaving} onClick={exportPdf}>
              {t("Download as PDF", "تنزيل كملف PDF")}
            </Button>
            {/* Save Draft button - always saves (overwrites existing draft if present) */}
            <Button
              onClick={handleSaveDraft}
              disabled={draftSaving || draftLoading}
              className="text-white"
              style={{ backgroundColor: "#0d47a1" }}
            >
              {draftSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("Saving...", "جارٍ الحفظ...")}
                </>
              ) : (
                t("Save Draft", "حفظ مسودة")
              )}
            </Button>
          </div>
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
        {currentStep >= 3 && (
          <div className="mb-6 rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href="#faq" target="_blank" rel="noopener noreferrer">
                    <Info className="h-4 w-4 mr-2" />
                    {t("FAQs", "الأسئلة الشائعة")}
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="mailto:support@serapro.app?subject=CV Builder Help">
                    {t("Contact Support", "اتصل بالدعم")}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Template Selection */}
        {currentStep === 1 && (
          <TemplateSelector
            selectedTemplate={selectedTemplate}
            onSelect={handleTemplateSelect}
            onNext={handleNextStep}
          />
        )}

        {/* Step 2: Data Import */}
        {currentStep === 2 && (
          <DataImportStep
            onImport={handleDataImport}
            onNext={handleNextStep}
            onSkip={handleSkipImport}
          />
        )}

        {/* Steps 3+: Form Sections */}
        {currentStep >= 3 && (
          <TooltipProvider>
            <Form {...form}>
              <Tabs value={currentStepKey} onValueChange={(value) => {
                const stepIndex = steps.findIndex((s) => s.key === value);
                if (stepIndex >= 0) {
                  setCurrentStep(stepIndex + 1);
                }
              }} className="w-full">
          <TabsList className="grid grid-cols-3 sm:grid-cols-6">
            {steps.slice(2).map((step) => (
              <TabsTrigger key={step.key} value={step.key}>
                {t(step.label.en, step.label.ar)}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Personal */}
          <TabsContent value="personal" className="mt-4">
            {/* Import success notification */}
            {dataImported && (
              <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-700 dark:text-green-300">
                  {t(
                    "Data imported successfully! Please review and edit the information below.",
                    "تم استيراد البيانات بنجاح! يرجى مراجعة وتعديل المعلومات أدناه."
                  )}
                </AlertDescription>
              </Alert>
            )}
            {/* Personal Info Form Fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField name="fullName" control={form.control} render={({ field }) => {
                  const fieldState = form.getFieldState("fullName");
                  return (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="flex items-center gap-2">
                        {t("Full Name", "الاسم الكامل")} <span className="text-red-500">*</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-zinc-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{isAr ? FIELD_HELP.fullName.ar : FIELD_HELP.fullName.en}</p>
                          </TooltipContent>
                        </Tooltip>
                      </FormLabel>
                      <FormControl><Input placeholder={t("Jane Doe", "فلانة الفلانية")} {...field} /></FormControl>
                      <FormMessage />
                      {fieldState.isTouched && !fieldState.error && field.value && (
                        <p className="text-xs text-green-600 dark:text-green-400">{t("✓ Valid", "✓ صحيح")}</p>
                      )}
                    </FormItem>
                  );
                }} />
                <FormField name="title" control={form.control} render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="flex items-center gap-2">
                      {t("Professional Title", "المسمى المهني")}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-zinc-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>{isAr ? FIELD_HELP.title.ar : FIELD_HELP.title.en}</p>
                        </TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormControl><Input placeholder={t("Software Engineer", "مهندسة برمجيات")} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="contact.email" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      {t("Email", "البريد الإلكتروني")}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-zinc-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>{isAr ? CV_TIPS.email.ar : CV_TIPS.email.en}</p>
                        </TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormControl><Input type="email" placeholder="you@example.com" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="contact.phone" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Phone", "الهاتف")}</FormLabel>
                    <FormControl><Input type="tel" placeholder="010-000-0000" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("Format: 010-000-0000 or +20 1234567890", "التنسيق: 010-000-0000 أو +20 1234567890")}</p>
                  </FormItem>
                )} />
                <FormField name="contact.location" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Location", "الموقع")}</FormLabel>
                    <FormControl><Input placeholder={t("Cairo, Egypt", "القاهرة، مصر")} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="contact.website" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Website", "الموقع الشخصي")}</FormLabel>
                    <FormControl><Input type="url" placeholder="https://..." {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("Must start with http:// or https://", "يجب أن يبدأ بـ http:// أو https://")}</p>
                  </FormItem>
                )} />
                <FormField name="summary" control={form.control} render={({ field }) => {
                  const charCount = (field.value || "").length;
                  const maxChars = 500;
                  return (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="flex items-center gap-2">
                        {t("Summary", "الملخص")}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-zinc-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{isAr ? CV_TIPS.summary.ar : CV_TIPS.summary.en}</p>
                          </TooltipContent>
                        </Tooltip>
                      </FormLabel>
                      <FormControl>
                        <textarea 
                          rows={5} 
                          className="w-full rounded-md border px-3 py-2 text-sm outline-none" 
                          placeholder={t("Short professional summary", "ملخص مهني قصير")} 
                          {...field as any}
                          value={field.value || ""}
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
          </TabsContent>

          {/* Experience */}
          <TabsContent value="experience" className="mt-4">
            <div className="space-y-4">
              {expArray.fields.map((f, idx) => (
                <div key={f.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-2">
                  <FormField name={`experience.${idx}.company`} control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        {t("Company", "الشركة")} <span className="text-red-500">*</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-zinc-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{isAr ? FIELD_HELP.company.ar : FIELD_HELP.company.en}</p>
                          </TooltipContent>
                        </Tooltip>
                      </FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name={`experience.${idx}.role`} control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        {t("Role", "الوظيفة")} <span className="text-red-500">*</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-zinc-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{isAr ? FIELD_HELP.role.ar : FIELD_HELP.role.en}</p>
                          </TooltipContent>
                        </Tooltip>
                      </FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name={`experience.${idx}.startDate`} control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        {t("Start Date", "تاريخ البداية")} <span className="text-red-500">*</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-zinc-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{isAr ? CV_TIPS.date.ar : CV_TIPS.date.en}</p>
                          </TooltipContent>
                        </Tooltip>
                      </FormLabel>
                      <FormControl><Input placeholder="YYYY-MM" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name={`experience.${idx}.endDate`} control={form.control} render={({ field }) => {
                    const isPresent = presentStates[idx] || false;
                    
                    return (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="flex items-center gap-2">
                            {t("End Date", "تاريخ النهاية")}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-zinc-400 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>{t("Leave empty for current position", "اتركه فارغاً للوظيفة الحالية")}</p>
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
                              {t("Present", "حتى الآن")}
                            </label>
                          </div>
                        </div>
                        <FormControl>
                          <Input
                            placeholder={isPresent ? t("Present", "حتى الآن") : t("YYYY-MM", "YYYY-MM")}
                            {...field}
                            value={field.value || ""}
                            disabled={isPresent}
                            className={isPresent ? "bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed" : ""}
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
                          {t("Description", "التفاصيل")}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-zinc-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>{isAr ? CV_TIPS.experienceDescription.ar : CV_TIPS.experienceDescription.en}</p>
                            </TooltipContent>
                          </Tooltip>
                        </FormLabel>
                        <FormControl>
                          <textarea 
                            rows={3} 
                            className="w-full rounded-md border px-3 py-2 text-sm outline-none" 
                            placeholder={t("Use bullet points with action verbs (e.g., 'Developed', 'Managed'). Quantify results.", "استخدم نقاط بفعل العمل (مثل 'طورت'، 'أدرت'). قم بقياس النتائج.")}
                            {...field} 
                            value={field.value || ""} 
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
              }}>{t("Add Experience", "إضافة خبرة")}</Button>
            </div>
          </TabsContent>

          {/* Education */}
          <TabsContent value="education" className="mt-4">
            <div className="space-y-4">
              {eduArray.fields.map((f, idx) => (
                <div key={f.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-2">
                  <FormField name={`education.${idx}.school`} control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        {t("School", "المؤسسة")} <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl><Input placeholder={t("University Name", "اسم الجامعة")} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name={`education.${idx}.degree`} control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        {t("Degree", "المؤهل")} <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl><Input placeholder={t("Bachelor's in Computer Science", "بكالوريوس في علوم الحاسب")} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name={`education.${idx}.startDate`} control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        {t("Start Date", "تاريخ البداية")} <span className="text-red-500">*</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-zinc-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{isAr ? CV_TIPS.date.ar : CV_TIPS.date.en}</p>
                          </TooltipContent>
                        </Tooltip>
                      </FormLabel>
                      <FormControl><Input placeholder="YYYY-MM" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name={`education.${idx}.endDate`} control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        {t("End Date", "تاريخ النهاية")}
                      </FormLabel>
                      <FormControl><Input placeholder="YYYY-MM" {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="sm:col-span-2 flex justify-end">
                    <Button variant="secondary" type="button" onClick={() => eduArray.remove(idx)}>{t("Remove", "حذف")}</Button>
                  </div>
                </div>
              ))}
              <Button type="button" onClick={() => eduArray.append({ school: "", degree: "", startDate: "" })}>{t("Add Education", "إضافة تعليم")}</Button>
            </div>
          </TabsContent>

          {/* Skills */}
          <TabsContent value="skills" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-lg border bg-blue-50 dark:bg-blue-950 p-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {isAr ? CV_TIPS.skills.ar : CV_TIPS.skills.en}
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
                            <Input placeholder={t("e.g., JavaScript, React, Python", "مثل: JavaScript، React، Python")} {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button variant="secondary" type="button" onClick={() => skillsArray.remove(idx)}>{t("Remove", "حذف")}</Button>
                  </div>
                ))}
                <Button type="button" onClick={() => skillsArray.append("")}>{t("Add Skill", "إضافة مهارة")}</Button>
              </div>
            </div>
          </TabsContent>

          {/* Languages */}
          <TabsContent value="languages" className="mt-4">
            <div className="space-y-3">
              {langsArray.fields.map((f, idx) => (
                <div key={f.id} className="flex items-center gap-2">
                  <FormField
                    name={`languages.${idx}`}
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder={t("e.g., Arabic (Native), English (Fluent)", "مثل: العربية (اللغة الأم)، الإنجليزية (طلاقة)")} {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button variant="secondary" type="button" onClick={() => langsArray.remove(idx)}>{t("Remove", "حذف")}</Button>
                </div>
              ))}
              <Button type="button" onClick={() => langsArray.append("")}>{t("Add Language", "إضافة لغة")}</Button>
            </div>
          </TabsContent>

          {/* Certifications */}
          <TabsContent value="certs" className="mt-4">
            <div className="space-y-3">
              {certsArray.fields.map((f, idx) => (
                <div key={f.id} className="flex items-center gap-2">
                  <FormField
                    name={`certifications.${idx}`}
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder={t("e.g., AWS Certified Solutions Architect", "مثل: معتمد AWS Solutions Architect")} {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button variant="secondary" type="button" onClick={() => certsArray.remove(idx)}>{t("Remove", "حذف")}</Button>
                </div>
              ))}
              <Button type="button" onClick={() => certsArray.append("")}>{t("Add Certification", "إضافة شهادة")}</Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Validation Summary & Footer actions */}
        <div className="mt-6 space-y-4">
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

          <div className="flex flex-col gap-3 sm:flex-row justify-between">
            {/* Navigation Buttons */}
            <div className="flex gap-2">
              {currentStep > 3 && (
                <Button variant="outline" onClick={handlePreviousStep}>
                  ← {t("Back", "رجوع")}
                </Button>
              )}
              {currentStep < steps.length && (
                <Button
                  variant="secondary"
                  onClick={handleNextStep}
                >
                  {t("Next", "التالي")} →
                </Button>
              )}
            </div>

            {/* Save & Finish */}
            <div className="flex gap-2">
              <Button
                onClick={handleSaveDraft}
                disabled={draftSaving || draftLoading}
                className="text-white"
                style={{ backgroundColor: "#0d47a1" }}
              >
                {draftSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("Saving...", "جارٍ الحفظ...")}
                  </>
                ) : (
                  t("Save Draft", "حفظ مسودة")
                )}
              </Button>
              {currentStep === steps.length && (
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
                    await handleSaveDraft();
                    
                    // For authenticated users: go to dashboard; for guests: prompt to sign in
                    if (user) {
                      router.push("/dashboard");
                    } else {
                      // Guest user: prompt to sign in to access dashboard
                      setAuthModalAction("general");
                      setPendingProtectedAction(() => () => {
                        router.push("/dashboard");
                      });
                      setShowAuthModal(true);
                    }
                  }}
                >
                  {t("Finish", "إنهاء")}
                </Button>
              )}
            </div>
          </div>
        </div>
        </Form>
        </TooltipProvider>
        )}
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


