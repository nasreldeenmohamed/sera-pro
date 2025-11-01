"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { listUserCvs, deleteUserCv, getUserPlan, getUserProfile, getUserDraft, getUserCv, type UserCv, type UserPlan, type CvDraftData } from "@/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/locale-context";
import { PlanCards } from "@/components/payments/PlanCards";
import { KashierPaymentModal } from "@/components/payments/KashierPaymentModal";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { CheckCircle2, Zap, Star, Crown, Info, Download } from "lucide-react";
import { ClassicTemplate } from "@/components/pdf/Templates";
import { downloadPdf } from "@/lib/pdf";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { isAr, t, setLocale } = useLocale();

  const [cvs, setCvs] = useState<UserCv[]>([]);
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [userProfile, setUserProfile] = useState<{ email?: string; name?: string } | null>(null);
  const [hasDraft, setHasDraft] = useState<boolean>(false);
  const [cameFromCreateCv, setCameFromCreateCv] = useState<boolean>(false);
  
  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<"one_time" | "flex_pack" | "annual_pass" | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [loading, user, router]);

  // Check if user came from /create-cv page
  useEffect(() => {
    if (typeof window !== "undefined") {
      const referrer = document.referrer;
      const fromCreateCv = referrer.includes("/create-cv");
      setCameFromCreateCv(fromCreateCv);
      
      // Also check sessionStorage for navigation tracking
      const navFromCreateCv = sessionStorage.getItem("navigated_from_create_cv") === "true";
      if (navFromCreateCv) {
        setCameFromCreateCv(true);
        // Clear the flag after reading
        sessionStorage.removeItem("navigated_from_create_cv");
      }
    }
  }, []);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const [items, p, profile, draft] = await Promise.all([
          listUserCvs(user.uid),
          getUserPlan(user.uid),
          getUserProfile(user.uid).catch(() => null), // Profile might not exist
          getUserDraft(user.uid).catch(() => null), // Draft might not exist
        ]);
        setCvs(items);
        setPlan(p);
        setUserProfile(profile || { email: user.email || undefined, name: user.displayName || undefined });
        setHasDraft(!!draft);
      } catch (e) {
        console.error("Failed to load dashboard data:", e);
        // TODO(error): surface error state to user
      }
    }
    load();
  }, [user]);

  // Refresh plan after successful payment
  const handlePaymentSuccess = async () => {
    if (!user) return;
    try {
      const updatedPlan = await getUserPlan(user.uid);
      setPlan(updatedPlan);
    } catch (e) {
      console.error("Failed to refresh plan after payment:", e);
    }
  };

  // Handle plan purchase
  const handlePurchase = (product: "one_time" | "flex_pack" | "annual_pass") => {
    setSelectedProduct(product);
    setPaymentModalOpen(true);
  };

  async function onDelete(cvId: string) {
    if (!user) return;
    setBusy(true);
    try {
      await deleteUserCv(user.uid, cvId);
      setCvs((prev) => prev.filter((c) => c.id !== cvId));
    } finally {
      setBusy(false);
    }
  }

  /**
   * Download CV with watermark for free plan users
   * 
   * Supports downloading from:
   * 1. Saved CVs (cvId provided)
   * 2. Current draft (if exists)
   * 3. Falls back to first CV if available
   */
  async function downloadCvWithWatermark(cvId?: string) {
    if (!user) return;
    setBusy(true);
    try {
      let cvData: CvDraftData | null = null;
      let templateKey = "classic";

      // Priority 1: Try to get draft (most recent work)
      const draft = await getUserDraft(user.uid);
      if (draft) {
        cvData = draft;
        templateKey = draft.templateKey || "classic";
      } else if (cvId) {
        // Priority 2: Get specific CV by ID
        const savedCv = await getUserCv(user.uid, cvId);
        if (savedCv) {
          cvData = savedCv as any;
          templateKey = (savedCv as any).templateKey || "classic";
        }
      } else if (cvs.length > 0) {
        // Priority 3: Use first CV
        const firstCv = await getUserCv(user.uid, cvs[0].id);
        if (firstCv) {
          cvData = firstCv as any;
          templateKey = (firstCv as any).templateKey || "classic";
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

      // Generate PDF with watermark for free plan
      const pdfDoc = ClassicTemplate({ 
        data: pdfData, 
        isAr: isCvAr,
        showWatermark: true, // Always show watermark for free plan downloads
        templateKey: templateKey, // Pass template key for future template support
      });

      const filename = `${cvData.fullName || "CV"}_${isAr ? "سيرة_ذاتية" : "Resume"}_${isAr ? "مع_علامة_مائية" : "Watermarked"}.pdf`;
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

  const canCreate = useMemo(() => {
    if (!plan) return true; // free can create basic/watermarked; gating later
    if (plan.planType === "flex_pack") return (plan.creditsRemaining ?? 0) > 0;
    return true;
  }, [plan]);

  if (loading || !user) {
    return (
      <SiteLayout>
        <section className="mx-auto max-w-6xl p-6 sm:p-8 md:p-12">
          <p className="text-zinc-600 dark:text-zinc-400">{t("Loading...", "جارٍ التحميل...")}</p>
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

        {/* Enhanced Plan Summary */}
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
                  <div className="mt-2 space-y-1">
                    {!plan || plan.planType === "free" ? (
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        <p>• {t("1 basic CV with watermark", "سيرة أساسية واحدة مع علامة مائية")}</p>
                        <p>• {t("Limited templates", "قوالب محدودة")}</p>
                        <p>• {t("Basic features", "ميزات أساسية")}</p>
                      </div>
                    ) : plan.planType === "one_time" ? (
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        <p>• {t("1 AI-enhanced CV", "سيرة واحدة محسّنة بالذكاء الاصطناعي")}</p>
                        <p>• {t("All premium templates", "جميع القوالب المميزة")}</p>
                        <p>• {t("14 days editing access", "الوصول للتعديل لمدة 14 يومًا")}</p>
                        <p>• {t("No watermark PDFs", "ملفات PDF بدون علامة مائية")}</p>
                      </div>
                    ) : plan.planType === "flex_pack" ? (
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        <p>• {t("Credits remaining", "الرصيد المتبقي")}: <strong>{plan.creditsRemaining ?? 0} / 5</strong></p>
                        <p>• {t("All premium templates", "جميع القوالب المميزة")}</p>
                        <p>• {t("AI enhancement included", "التحسين بالذكاء الاصطناعي متضمن")}</p>
                        <p>• {t("Valid for 6 months", "صالح لمدة 6 أشهر")}</p>
                      </div>
                    ) : (
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        <p>• {t("Unlimited CVs", "سير غير محدودة")}</p>
                        <p>• {t("All premium templates + future templates", "جميع القوالب المميزة + القوالب المستقبلية")}</p>
                        <p>• {t("Priority AI enhancement", "أولوية في التحسين بالذكاء الاصطناعي")}</p>
                        <p>• {t("Advanced export options", "خيارات تصدير متقدمة")}</p>
                        <p>• {t("Priority support", "دعم ذو أولوية")}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {(!plan || plan.planType === "free") && (
                <div className={`flex flex-col gap-2 ${isAr ? "items-start" : "items-end"}`}>
                  <Badge variant="outline" className="text-xs">
                    {t("Upgrade to unlock more", "قم بالترقية لفتح المزيد")}
                  </Badge>
                  {/* Download button for free plan users with draft or CVs */}
                  {(hasDraft || cameFromCreateCv || cvs.length > 0) && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        // Download draft (if exists) or first CV with watermark
                        downloadCvWithWatermark();
                      }}
                      disabled={busy}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      {t("Download PDF with Watermark", "تنزيل PDF مع علامة مائية")}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Actions */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <Button 
            disabled={!canCreate} 
            onClick={() => router.push("/create-cv")} 
            className="text-white" 
            style={{ backgroundColor: "#0d47a1" }}
          >
            {t("Create New CV", "إنشاء سيرة جديدة")}
          </Button>
        </div>

        {/* Enhanced Plan Cards with Purchase Options */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t("Upgrade Your Plan", "قم بترقية خطتك")}</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {t("Choose the plan that works best for you", "اختر الخطة التي تناسبك")}
            </p>
          </div>
          <PlanCards currentPlan={plan} onPurchase={handlePurchase} />
        </div>

        {/* Payment Modal */}
        {selectedProduct && user && (
          <KashierPaymentModal
            open={paymentModalOpen}
            onClose={() => {
              setPaymentModalOpen(false);
              setSelectedProduct(null);
            }}
            product={selectedProduct}
            amount={
              selectedProduct === "one_time"
                ? 79
                : selectedProduct === "flex_pack"
                ? 149
                : 299
            }
            userId={user.uid}
            userEmail={userProfile?.email || user.email || undefined}
            userName={userProfile?.name || user.displayName || undefined}
            onSuccess={handlePaymentSuccess}
          />
        )}

        {/* CVs grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cvs.map((cv) => (
            <Card key={cv.id}>
              <CardHeader>
                <CardTitle className="text-base">{cv.fullName || t("Untitled CV", "سيرة بدون عنوان")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">{cv.summary}</p>
                <div className="flex flex-wrap gap-2">
                  {/* TODO(preview): route to preview renderer when available */}
                  <Button size="sm" variant="secondary" onClick={() => router.push(`/create-cv?id=${cv.id}`)}>{t("Edit", "تعديل")}</Button>
                  {/* TODO(download): implement server PDF export */}
                  <Button size="sm" variant="secondary">{t("Download", "تنزيل")}</Button>
                  <Button size="sm" variant="secondary">{t("Preview", "معاينة")}</Button>
                  <Button size="sm" disabled={busy} onClick={() => onDelete(cv.id)}>{t("Delete", "حذف")}</Button>
                </div>
                {/* Feature availability banner by plan */}
                <p className="text-xs text-zinc-500">
                  {/* TODO(gating): derive availability from plan; hide actions if not allowed */}
                  {plan?.planType === "flex_pack" && t("Credits will be deducted on export.", "سيتم خصم رصيد عند التصدير.")}
                  {(!plan || plan?.planType === "free") && t("Free includes watermark and limited templates.", "الخطة المجانية تتضمن علامة مائية وقوالب محدودة.")}
                  {plan?.planType === "one_time" && t("Edits allowed for 14 days from purchase.", "يسمح بالتعديلات لمدة 14 يومًا من تاريخ الشراء.")}
                  {plan?.planType === "annual_pass" && t("Pro tools unlocked for the year.", "تم فتح الأدوات الاحترافية لمدة سنة.")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {cvs.length === 0 && (
          <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">{t("No CVs yet. Create your first CV.", "لا توجد سير بعد. ابدأ بإنشاء سيرتك الأولى.")}</p>
        )}
      </section>
    </SiteLayout>
  );
}


