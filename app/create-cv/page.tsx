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

export default function CreateCvPage() {
  const router = useRouter();
  const params = useSearchParams();
  const cvId = params.get("id");
  const { user } = useAuth();
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

  // Draft state management
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

  // Load existing CV if cvId is present, otherwise auto-load draft
  useEffect(() => {
    async function loadData() {
      if (!user) return;

      // If editing a specific CV, load that instead of draft
      if (cvId) {
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
            hasLoadedDraft.current = true;
          }
        } catch (error) {
          console.error("Failed to load CV:", error);
        }
        return; // Don't load draft if editing specific CV
      }

      // Otherwise, auto-load draft on mount
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
          hasLoadedDraft.current = true;
          setDraftStatus("success");
          setDraftMessage(t("Draft loaded successfully.", "تم تحميل المسودة بنجاح."));
          setTimeout(() => setDraftStatus("idle"), 3000);
        } else {
          setDraftExists(false);
        }
      } catch (error: any) {
        console.error("Failed to load draft:", error);
        setDraftStatus("error");
        setDraftMessage(t("Failed to load draft.", "فشل تحميل المسودة."));
        setTimeout(() => setDraftStatus("idle"), 3000);
      } finally {
        setDraftLoading(false);
      }
    }
    loadData();
  }, [user, cvId, form, t]);

  // Save draft function - always saves (overwrites existing draft if present)
  // Single draft per user policy: each save overwrites the previous draft
  async function handleSaveDraft() {
    if (!user) {
      setDraftStatus("error");
      setDraftMessage(t("Please sign in to save drafts.", "يرجى تسجيل الدخول لحفظ المسودات."));
      setTimeout(() => setDraftStatus("idle"), 3000);
      return;
    }

    setDraftSaving(true);
    setDraftStatus("idle");
    setDraftMessage(null);

    try {
      const values = form.getValues();
      // Allow saving drafts with partial/incomplete data (bypass form validation)
      // This enables users to save work-in-progress CVs without completing all required fields
      const draftData: CvDraftData = {
        fullName: values.fullName || "", // Allow empty for drafts (will be validated on final submission)
        title: values.title,
        summary: values.summary,
        contact: values.contact,
        experience: values.experience || [],
        education: values.education || [],
        skills: values.skills || [],
        languages: values.languages || [],
        certifications: values.certifications || [],
        templateKey: values.templateKey || "classic",
      };

      await saveUserDraft(user.uid, draftData);
      
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
  }

  // Load draft function with confirmation if there are unsaved changes
  async function handleLoadDraft(confirmed = false) {
    if (!user) {
      setDraftStatus("error");
      setDraftMessage(t("Please sign in to load drafts.", "يرجى تسجيل الدخول لتحميل المسودات."));
      setTimeout(() => setDraftStatus("idle"), 3000);
      return;
    }

    // Check if there are unsaved changes
    if (!confirmed && hasUnsavedChanges.current) {
      setPendingAction(() => () => handleLoadDraft(true));
      setShowConfirmDialog(true);
      return;
    }

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
  }

  // Confirm and execute pending action (for load draft when unsaved changes exist)
  function confirmPendingAction() {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setShowConfirmDialog(false);
  }

  // Simple template dropdown for MVP
  const templates = useMemo(() => [
    { key: "classic", name: t("Classic", "كلاسيك") },
    { key: "modern", name: t("Modern", "حديث") },
    { key: "elegant", name: t("Elegant", "أنيق") },
  ], [t]);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // LinkedIn import state
  const [linkedInLoading, setLinkedInLoading] = useState(false);
  const [linkedInError, setLinkedInError] = useState<string | null>(null);
  const [linkedInSuccess, setLinkedInSuccess] = useState(false);
  const [showLinkedInImport, setShowLinkedInImport] = useState(false);
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [linkedInInstructions, setLinkedInInstructions] = useState<string[]>([]);

  // Validation check before AI enhancement
  async function enhanceWithAI() {
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

  return (
    <SiteLayout>
      <section className="mx-auto w-full max-w-5xl p-6 sm:p-8 md:p-12">
        <header className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{t("CV Builder", "منشئ السيرة")}</h1>
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

        {/* Help & Support Section */}
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

        {/* Multi-step via Tabs for MVP (wrap everything in Form provider so FormField has context) */}
        {/* TooltipProvider wraps entire form to enable tooltips throughout */}
        <TooltipProvider>
        <Form {...form}>
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid grid-cols-3 sm:grid-cols-6">
            <TabsTrigger value="personal">{t("Personal", "بيانات")}</TabsTrigger>
            <TabsTrigger value="experience">{t("Experience", "خبرات")}</TabsTrigger>
            <TabsTrigger value="education">{t("Education", "تعليم")}</TabsTrigger>
            <TabsTrigger value="skills">{t("Skills", "مهارات")}</TabsTrigger>
            <TabsTrigger value="languages">{t("Languages", "لغات")}</TabsTrigger>
            <TabsTrigger value="certs">{t("Certs", "شهادات")}</TabsTrigger>
          </TabsList>

          {/* Personal */}
          <TabsContent value="personal" className="mt-4">
            {/* LinkedIn Import Section */}
            <div className="mb-6 rounded-lg border bg-zinc-50 dark:bg-zinc-900 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Linkedin className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-sm">{t("Import from LinkedIn", "استيراد من LinkedIn")}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleLinkedInImport}
                >
                  {showLinkedInImport ? t("Hide", "إخفاء") : t("Show", "إظهار")}
                </Button>
              </div>

              {showLinkedInImport && (
                <div className="space-y-4">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {t(
                      "Import your LinkedIn profile data to quickly fill your CV. We only access data you export and share with us.",
                      "استورد بيانات ملفك الشخصي على LinkedIn لملء سيرتك الذاتية بسرعة. نحن نصل فقط إلى البيانات التي تصدرها وتشاركها معنا."
                    )}
                  </p>

                  {/* Method 1: JSON File Upload (Primary) */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("Upload LinkedIn Data Export (JSON)", "تحميل تصدير بيانات LinkedIn (JSON)")}</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept=".json,application/json"
                          onChange={handleFileUpload}
                          disabled={linkedInLoading}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          className="w-full"
                          disabled={linkedInLoading}
                          asChild
                        >
                          <span>
                            <Upload className="h-4 w-4 mr-2" />
                            {linkedInLoading ? t("Importing...", "جارٍ الاستيراد...") : t("Choose JSON File", "اختر ملف JSON")}
                          </span>
                        </Button>
                      </label>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {t(
                        "How to export: LinkedIn Settings → Data Privacy → Get a copy of your data → Select Profile & Positions → Request archive",
                        "كيفية التصدير: إعدادات LinkedIn → خصوصية البيانات → احصل على نسخة من بياناتك → حدد الملف الشخصي والوظائف → طلب الأرشيف"
                      )}
                    </p>
                  </div>

                  {/* Method 2: URL (Fallback with instructions) */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("LinkedIn Profile URL (Limited)", "رابط ملف LinkedIn الشخصي (محدود)")}</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        type="url"
                        placeholder={t("https://www.linkedin.com/in/username", "https://www.linkedin.com/in/username")}
                        value={linkedInUrl}
                        onChange={(e) => setLinkedInUrl(e.target.value)}
                        disabled={linkedInLoading}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => {
                          if (linkedInUrl) {
                            handleLinkedInImport(undefined, linkedInUrl);
                          }
                        }}
                        disabled={linkedInLoading || !linkedInUrl}
                        variant="secondary"
                      >
                        {linkedInLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t("Importing...", "جارٍ الاستيراد...")}
                          </>
                        ) : (
                          t("Import from URL", "استيراد من الرابط")
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {t(
                        "Note: URL import may be limited due to LinkedIn restrictions. Uploading a JSON file is more reliable.",
                        "ملاحظة: قد يكون استيراد الرابط محدودًا بسبب قيود LinkedIn. تحميل ملف JSON أكثر موثوقية."
                      )}
                    </p>
                  </div>

                  {/* Help Link */}
                  <div className="flex items-center gap-2 text-xs">
                    <ExternalLink className="h-3 w-3" />
                    <a
                      href="https://www.linkedin.com/help/linkedin/answer/a554590/download-your-linkedin-data"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {t("Learn how to export your LinkedIn data", "تعرف على كيفية تصدير بيانات LinkedIn الخاصة بك")}
                    </a>
                  </div>

                  {/* Error/Success Feedback */}
                  {linkedInError && (
                    <Alert variant="destructive" className="mt-2">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{linkedInError}</AlertDescription>
                    </Alert>
                  )}
                  {/* Instructions when URL import is not available */}
                  {linkedInInstructions.length > 0 && (
                    <Alert className="mt-2 border-blue-500 bg-blue-50 dark:bg-blue-950">
                      <ExternalLink className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertTitle className="text-blue-800 dark:text-blue-200 text-sm font-semibold">
                        {t("How to export LinkedIn data:", "كيفية تصدير بيانات LinkedIn:")}
                      </AlertTitle>
                      <AlertDescription className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                        <ol className="list-decimal list-inside space-y-1">
                          {linkedInInstructions.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ol>
                      </AlertDescription>
                    </Alert>
                  )}
                  {linkedInSuccess && (
                    <Alert className="mt-2 border-green-500 bg-green-50 dark:bg-green-950">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription className="text-sm text-green-700 dark:text-green-300">
                        {t("LinkedIn data imported successfully! Please review the fields below.", "تم استيراد بيانات LinkedIn بنجاح! يرجى مراجعة الحقول أدناه.")}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>

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
                <FormField name="templateKey" control={form.control} render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{t("Template", "القالب")}</FormLabel>
                    <FormControl>
                      <select className="w-full rounded-md border px-3 py-2 text-sm outline-none" {...field}>
                        {templates.map((tpl) => (<option key={tpl.key} value={tpl.key}>{tpl.name}</option>))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
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
                  <FormField name={`experience.${idx}.endDate`} control={form.control} render={({ field }) => (
                    <FormItem>
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
                      <FormControl><Input placeholder={t("Present or YYYY-MM", "حتى الآن أو YYYY-MM")} {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
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
                    <Button variant="secondary" type="button" onClick={() => expArray.remove(idx)}>{t("Remove", "حذف")}</Button>
                  </div>
                </div>
              ))}
              <Button type="button" onClick={() => expArray.append({ company: "", role: "", startDate: "" })}>{t("Add Experience", "إضافة خبرة")}</Button>
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
        </Form>
        </TooltipProvider>

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

          <div className="flex flex-col gap-3 sm:flex-row">
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
                await handleSaveDraft();
                router.push("/dashboard");
              }}
            >
              {t("Finish", "إنهاء")}
            </Button>
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
    </SiteLayout>
  );
}


