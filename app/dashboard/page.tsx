"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { listUserCvs, deleteUserCv, getUserPlan, getUserDraft, getUserCv, checkAndUpdateSubscriptionStatus, type UserCv, type UserPlan, type CvDraftData } from "@/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/locale-context";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Zap, Star, Crown, FileText, Lock } from "lucide-react";
import { ClassicTemplate } from "@/components/pdf/Templates";
import { downloadPdf } from "@/lib/pdf";
import { CvPreviewCard } from "@/components/dashboard/CvPreviewCard";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

/**
 * Dashboard Page - CV Management
 * 
 * Displays user's CVs with plan-based access control:
 * - Free/One-Time plans: First CV enabled, others locked (1 CV limit)
 * - Flex Pack plan: First 5 CVs enabled, others locked (5 CV limit)
 * - Annual Pass plan: All CVs enabled (unlimited)
 * 
 * Features:
 * - "Create New CV" button conditionally enabled/disabled based on plan and CV count
 * - CV preview cards show enabled/disabled state with visual indicators
 * - Disabled CVs show lock overlay, "Upgrade" button, and tooltips
 * - Clicking disabled CVs redirects to pricing page for upgrade
 * - Download button per CV (watermarked or not based on plan)
 * - Delete functionality available for all CVs
 * - Simplified plan summary (no pricing section - moved to /pricing)
 * - Conditional watermark based on user plan
 * - Downgrade handling: When plan changes, only most recent N CVs remain enabled
 * 
 * DEFAULT BEHAVIOR: Arabic (ar) with RTL layout
 */
export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { isAr, t } = useLocale();

  // CV data state - fetched from Firestore on page load
  const [cvs, setCvs] = useState<UserCv[]>([]);
  const [cvsLoading, setCvsLoading] = useState<boolean>(true);
  const [cvsError, setCvsError] = useState<string | null>(null);
  
  // Plan and user profile state
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [planLoading, setPlanLoading] = useState<boolean>(true);
  
  // UI state
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [loading, user, router]);

  /**
   * Asynchronously fetch all CVs from Firestore for the authenticated user
   * Called on page load, when user changes, and when page becomes visible
   * Ensures data is always up-to-date, even after editing from other devices
   * 
   * Uses authenticated user's ID as the Firestore query key
   */
  const fetchCvs = useCallback(async () => {
    if (!user) {
      setCvsLoading(false);
      return;
    }

    setCvsLoading(true);
    setCvsError(null);

    try {
      // Fetch CVs using authenticated user's ID as query key
      // Firestore query: collection("cvDrafts").where("userId", "==", user.uid)
      const items = await listUserCvs(user.uid);
      setCvs(items);
    } catch (error: any) {
      console.error("[Dashboard] Failed to fetch CVs from Firestore:", error);
      const errorMessage = error?.message || t(
        "Failed to load CVs. Please refresh the page.",
        "فشل تحميل السير. يرجى تحديث الصفحة."
      );
      setCvsError(errorMessage);
    } finally {
      setCvsLoading(false);
    }
  }, [user, t]);

  // Fetch CVs on page load and when user changes
  useEffect(() => {
    fetchCvs();
  }, [fetchCvs]);

  // Refresh CVs when page becomes visible (user returns from another tab/page)
  // Ensures data stays synchronized across devices and browser tabs
  useEffect(() => {
    if (typeof window === "undefined" || !user) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && user) {
        // Refetch when page becomes visible to ensure data is fresh
        fetchCvs();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, fetchCvs]);

         /**
          * Asynchronously fetch user plan from Firestore
          * Separate from CV fetch to allow independent loading states
          * Also checks and updates subscription status on dashboard load
          */
         useEffect(() => {
           async function fetchPlan() {
             if (!user) {
               setPlanLoading(false);
               return;
             }

             setPlanLoading(true);
             try {
               // Check and update subscription status first
               await checkAndUpdateSubscriptionStatus(user.uid);
               
               // Then fetch the plan (which reads from subscription)
               const p = await getUserPlan(user.uid);
               setPlan(p);
             } catch (error: any) {
               console.error("[Dashboard] Failed to fetch plan:", error);
               // Plan fetch failure is non-critical - user can still use dashboard
               setPlan(null);
             } finally {
               setPlanLoading(false);
             }
           }

           fetchPlan();
         }, [user]);

  // Determine if user should see watermark on downloads
  // Free plan: requires watermark
  // One-time plan: NO watermark (paid feature)
  // Flex pack and annual pass: NO watermark (paid features)
  const requiresWatermark = useMemo(() => {
    return !plan || plan.planType === "free";
  }, [plan]);

  /**
   * Calculate the maximum number of CVs allowed based on user's plan
   * 
   * Plan limits:
   * - Free/One-Time: 1 CV maximum
   * - Flex Pack: 5 CVs maximum
   * - Annual Pass: Unlimited (returns null)
   * 
   * @returns Maximum CV count or null for unlimited
   */
  const maxCvLimit = useMemo(() => {
    if (!plan) return 1; // Default to free plan limit
    switch (plan.planType) {
      case "free":
      case "one_time":
        return 1;
      case "flex_pack":
        return 5;
      case "annual_pass":
        return null; // Unlimited
      default:
        return 1;
    }
  }, [plan]);

  /**
   * Determine which CVs are enabled based on plan limits
   * 
   * CVs are sorted by updatedAt descending (newest first)
   * When downgrading, we keep only the most recent N CVs enabled
   * 
   * Returns array with enabled status for each CV
   */
  const cvsWithStatus = useMemo(() => {
    if (!maxCvLimit) {
      // Annual Pass: All CVs are enabled (unlimited)
      return cvs.map(cv => ({ cv, enabled: true }));
    }
    
    // For limited plans: First N CVs are enabled, rest are disabled
    return cvs.map((cv, index) => ({
      cv,
      enabled: index < maxCvLimit,
    }));
  }, [cvs, maxCvLimit]);

  /**
   * Check if user can create a new CV based on their plan and current CV count
   * 
   * Rules:
   * - Free/One-Time: Can create only if they have 0 CVs
   * - Flex Pack: Can create if they have less than 5 CVs
   * - Annual Pass: Always allowed (unlimited)
   */
  const canCreateNewCv = useMemo(() => {
    if (!maxCvLimit) return true; // Annual Pass: unlimited
    return cvs.length < maxCvLimit;
  }, [cvs.length, maxCvLimit]);

  /**
   * Get tooltip message for disabled "Create New CV" button
   * 
   * Different messages based on plan type and limit reason
   */
  const createCvTooltip = useMemo(() => {
    if (canCreateNewCv) return "";
    
    if (!plan || plan.planType === "free" || plan.planType === "one_time") {
      return t(
        "Upgrade your plan to create more CVs",
        "قم بترقية خطتك لإنشاء المزيد من السير"
      );
    }
    
    if (plan.planType === "flex_pack") {
      return t(
        "You've reached your Flex Pack CV limit—upgrade for more",
        "لقد وصلت إلى حد سير باقة Flex Pack—قم بالترقية للحصول على المزيد"
      );
    }
    
    return "";
  }, [canCreateNewCv, plan, t]);

  /**
   * Delete a CV and refresh the list from Firestore
   * After deletion, refetch to ensure data consistency across devices
   * Note: Confirmation is handled by CvPreviewCard component
   */
  async function onDelete(cvId: string) {
    if (!user) return;

    setBusy(true);
    try {
      await deleteUserCv(user.uid, cvId);
      // Refetch CVs from Firestore to ensure data consistency
      await fetchCvs();
    } catch (error: any) {
      console.error("[Dashboard] Failed to delete CV:", error);
      alert(t("Failed to delete CV. Please try again.", "فشل حذف السيرة. يرجى المحاولة مرة أخرى."));
    } finally {
      setBusy(false);
    }
  }

  /**
   * Download CV with optional watermark based on user plan
   * 
   * Supports downloading from:
   * 1. Saved CVs (cvId provided)
   * 2. Current draft (if exists)
   * 3. Falls back to first CV if available
   * 
   * @param cvId - Optional CV ID to download specific CV
   * @param showWatermark - Whether to show watermark (defaults based on plan)
   */
  async function downloadCv(cvId?: string, showWatermark?: boolean) {
    if (!user) return;
    setBusy(true);
    try {
      let cvData: CvDraftData | null = null;
      let templateKey = "classic";

      // Priority 1: If cvId is provided, use that specific CV
      if (cvId) {
        const savedCv = await getUserCv(user.uid, cvId);
        if (savedCv) {
          cvData = savedCv as any;
          templateKey = (savedCv as any).templateKey || "classic";
        }
      } else if (cvs.length > 0) {
        // Priority 2: Use first CV if no ID provided
        const firstCv = await getUserCv(user.uid, cvs[0].id);
        if (firstCv) {
          cvData = firstCv as any;
          templateKey = (firstCv as any).templateKey || "classic";
        }
      } else {
        // Priority 3: Fallback to draft if no CVs exist
        const draft = await getUserDraft(user.uid);
        if (draft) {
          cvData = draft;
          templateKey = draft.templateKey || "classic";
        }
      }

      if (!cvData) {
        alert(t("No CV data found. Please create or save a CV first.", "لم يتم العثور على بيانات السيرة. يرجى إنشاء أو حفظ سيرة أولاً."));
        return;
      }

      // Prepare data for PDF template
      const pdfData = {
        fullName: cvData.fullName || "",
        title: cvData.title || "",
        summary: cvData.summary || "",
        contact: {
          email: cvData.contact?.email || "",
          phone: cvData.contact?.phone || "",
          location: cvData.contact?.location || "",
          website: cvData.contact?.website || "",
        },
        experience: Array.isArray(cvData.experience) ? cvData.experience : [],
        education: Array.isArray(cvData.education) ? cvData.education : [],
        skills: Array.isArray(cvData.skills) ? cvData.skills : [],
        languages: Array.isArray(cvData.languages) ? cvData.languages : [],
        certifications: Array.isArray(cvData.certifications) ? cvData.certifications : [],
        templateKey: templateKey,
      };

      // Determine if CV is in Arabic
      const isCvAr = cvData.cvLanguage === "ar" || (cvData.cvLanguage !== "en" && isAr);

      // Determine if watermark should be shown (based on plan or explicit parameter)
      const shouldShowWatermark = showWatermark !== undefined ? showWatermark : requiresWatermark;

      // Generate PDF with optional watermark
      const pdfDoc = ClassicTemplate({ 
        data: pdfData, 
        isAr: isCvAr,
        showWatermark: shouldShowWatermark,
        templateKey: templateKey, // Pass template key for future template support
      });

      const watermarkSuffix = shouldShowWatermark 
        ? (isAr ? "_مع_علامة_مائية" : "_Watermarked")
        : "";
      const filename = `${cvData.fullName || "CV"}_${isAr ? "سيرة_ذاتية" : "Resume"}${watermarkSuffix}.pdf`;
      await downloadPdf(pdfDoc, filename);
    } catch (error) {
      console.error("Failed to download CV:", error);
      alert(t("Failed to download CV. Please try again.", "فشل تنزيل السيرة. يرجى المحاولة مرة أخرى."));
    } finally {
      setBusy(false);
    }
  }

  const planBadge = useMemo(() => {
    if (!plan) return t("Free", "مجانية");
    switch (plan.planType) {
      case "one_time":
        return t("One-Time", "شراء لمرة واحدة");
      case "flex_pack":
        return t("Flex Pack", "باقة مرنة");
      case "annual_pass":
        return t("Annual Pass", "البطاقة السنوية");
      default:
        return t("Free", "مجانية");
    }
  }, [plan, isAr]);


  // Show loading state while authenticating
  if (loading || !user) {
    return (
      <SiteLayout>
        <section className="mx-auto max-w-6xl p-6 sm:p-8 md:p-12">
          <div className="flex items-center justify-center py-12">
            <p className="text-zinc-600 dark:text-zinc-400">{t("Loading...", "جارٍ التحميل...")}</p>
          </div>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl p-6 sm:p-8 md:p-12">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">{t("Your Dashboard", "لوحتك")}</h1>
        </header>

        {/* Plan Summary - Simplified */}
        <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                {plan?.planType === "free" && <Zap className="h-5 w-5 text-zinc-600" />}
                {plan?.planType === "one_time" && <Star className="h-5 w-5 text-blue-600" />}
                {plan?.planType === "flex_pack" && <Star className="h-5 w-5 text-yellow-600" />}
                {plan?.planType === "annual_pass" && <Crown className="h-5 w-5 text-purple-600" />}
                <div>
                  <CardTitle className="text-lg">
                    {t("Current Plan", "الخطة الحالية")}: <Badge variant="secondary">{planBadge}</Badge>
                  </CardTitle>
                  {plan?.planType === "flex_pack" && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                      {t("Credits remaining", "الرصيد المتبقي")}: <strong>{plan.creditsRemaining ?? 0} / 5</strong>
                    </p>
                  )}
                </div>
              </div>
              {!plan || plan.planType === "free" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push("/pricing")}
                >
                  {t("Upgrade Plan", "ترقية الخطة")}
                </Button>
              ) : null}
            </div>
          </CardHeader>
        </Card>


        {/* CVs List - Fetched from Firestore, filtered by plan */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t("Your CVs", "سيرك الذاتية")}</h2>
            {!cvsLoading && !cvsError && cvs.length > 0 && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {cvs.length === 1 
                  ? t("1 CV", "سيرة واحدة")
                  : t(`${cvs.length} CVs`, `${cvs.length} سيرة`)
                }
                {maxCvLimit !== null && (
                  <span className="ml-2">
                    ({t("Limit", "الحد")}: {maxCvLimit === 1 ? "1" : `${cvsWithStatus.filter(c => c.enabled).length}/${maxCvLimit}`})
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Loading State */}
          {cvsLoading && (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-600 dark:border-zinc-700 dark:border-t-zinc-400" />
                <p className="text-zinc-600 dark:text-zinc-400">
                  {t("Loading your CVs...", "جارٍ تحميل سيرك...")}
                </p>
              </div>
            </Card>
          )}

          {/* Error State */}
          {!cvsLoading && cvsError && (
            <Card className="p-8 text-center border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
              <p className="text-red-600 dark:text-red-400 mb-4">
                {cvsError}
              </p>
              <Button
                onClick={fetchCvs}
                variant="outline"
              >
                {t("Retry", "إعادة المحاولة")}
              </Button>
            </Card>
          )}


          {/* CVs List - Success State */}
          {!cvsLoading && !cvsError && cvs.length > 0 && (
            <>
              {/* Create New CV Button - Conditionally enabled/disabled */}
              <div className="mb-6 flex justify-end">
                {canCreateNewCv ? (
                  <Button
                    onClick={() => router.push("/create-cv")}
                    className="text-white"
                    style={{ backgroundColor: "#0d47a1" }}
                  >
                    {t("Create New CV", "إنشاء سيرة جديدة")}
                  </Button>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Button
                          onClick={() => router.push("/pricing")}
                          disabled={true}
                          variant="outline"
                          className="opacity-60 cursor-not-allowed"
                        >
                          <Lock className={`h-4 w-4 ${isAr ? "ml-2" : "mr-2"}`} />
                          {t("Create New CV", "إنشاء سيرة جديدة")}
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{createCvTooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* CV Cards Grid - All CVs shown, some disabled */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {cvsWithStatus.map(({ cv, enabled }) => (
                  <CvPreviewCard
                    key={cv.id}
                    cv={cv}
                    requiresWatermark={requiresWatermark}
                    enabled={enabled}
                    maxCvLimit={maxCvLimit}
                    planType={plan?.planType}
                    onEdit={(cvId) => {
                      if (enabled) {
                        router.push(`/create-cv?id=${cvId}`);
                      } else {
                        router.push("/pricing");
                      }
                    }}
                    onDownload={downloadCv}
                    onDelete={onDelete}
                    busy={busy}
                    isAr={isAr}
                    t={t}
                  />
                ))}
              </div>
            </>
          )}

          {/* Empty State - Show Create New CV button even when no CVs exist */}
          {!cvsLoading && !cvsError && cvs.length === 0 && (
            <Card className="p-8 text-center">
              <div className="max-w-md mx-auto space-y-4">
                <div className="h-16 w-16 mx-auto rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-zinc-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {t("No CVs yet", "لا توجد سير بعد")}
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                    {t(
                      "Create your first professional CV and start your job search journey.",
                      "أنشئ سيرتك الذاتية الأولى وابدأ رحلتك في البحث عن وظيفة."
                    )}
                  </p>
                </div>
                <Button 
                  onClick={() => router.push("/create-cv")} 
                  className="text-white"
                  style={{ backgroundColor: "#0d47a1" }}
                  size="lg"
                >
                  {t("Create Your First CV", "إنشاء سيرتك الأولى")}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}


