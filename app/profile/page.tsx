"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  getUserProfile, 
  getUserPlan, 
  listUserCvs, 
  checkAndUpdateSubscriptionStatus,
  type UserProfile,
  type UserPlan 
} from "@/firebase/firestore";
import { requestPasswordReset } from "@/firebase/auth";
import { 
  User, 
  Mail, 
  Calendar, 
  CreditCard, 
  FileText, 
  Lock, 
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Crown,
  Settings,
  LogOut
} from "lucide-react";
import Link from "next/link";

/**
 * Profile Page - User Account Management
 * 
 * Displays user's profile information, subscription details, and account management options.
 * 
 * Features:
 * - User profile info (name, email, avatar)
 * - Current subscription plan details (plan name, status, renewal date, benefits)
 * - Usage statistics (CVs generated, templates unlocked)
 * - Password change section (via password reset email)
 * - Subscription management (upgrade options, cancel info)
 * - Mobile-responsive layout
 * - Fully bilingual (Arabic/English) with RTL support
 * 
 * Access: Requires authentication (redirects to login if not authenticated)
 * DEFAULT BEHAVIOR: Arabic (ar) with RTL layout
 */
export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAr, t } = useLocale();

  // State management
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [cvCount, setCvCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [passwordResetLoading, setPasswordResetLoading] = useState<boolean>(false);
  const [passwordResetSent, setPasswordResetSent] = useState<boolean>(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/profile");
    }
  }, [authLoading, user, router]);

  // Fetch user data when authenticated
  useEffect(() => {
    async function fetchUserData() {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch profile, plan, and CV count in parallel
        const [profileData, planData, cvs] = await Promise.all([
          getUserProfile(user.uid),
          getUserPlan(user.uid),
          listUserCvs(user.uid),
        ]);

        setProfile(profileData);
        setPlan(planData);
        setCvCount(cvs.length);

        // Check and update subscription status
        if (planData) {
          await checkAndUpdateSubscriptionStatus(user.uid);
          // Refetch plan after status update
          const updatedPlan = await getUserPlan(user.uid);
          setPlan(updatedPlan);
        }
      } catch (error) {
        console.error("[Profile] Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchUserData();
    }
  }, [user]);

  // Handle password reset request
  async function handlePasswordReset() {
    if (!user?.email) return;

    setPasswordResetLoading(true);
    setPasswordResetSent(false);
    try {
      await requestPasswordReset(user.email);
      setPasswordResetSent(true);
    } catch (error: any) {
      console.error("[Profile] Password reset error:", error);
      alert(t(
        "Failed to send password reset email. Please try again.",
        "فشل إرسال بريد إعادة تعيين كلمة المرور. يرجى المحاولة مرة أخرى."
      ));
    } finally {
      setPasswordResetLoading(false);
    }
  }

  // Plan display information
  const planInfo = {
    free: {
      name: { en: "Free", ar: "مجانية" },
      icon: User,
      color: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
      benefits: [
        { en: "1 basic CV", ar: "سيرة أساسية واحدة" },
        { en: "3 templates", ar: "3 قوالب" },
        { en: "Watermarked PDF", ar: "ملف PDF بعلامة مائية" },
      ],
    },
    one_time: {
      name: { en: "One-Time Purchase", ar: "شراء لمرة واحدة" },
      icon: FileText,
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      benefits: [
        { en: "1 CV", ar: "سيرة واحدة" },
        { en: "3 templates", ar: "3 قوالب" },
        { en: "7 days unlimited edits", ar: "7 أيام من التعديلات غير المحدودة" },
      ],
    },
    flex_pack: {
      name: { en: "Flex Pack", ar: "باقة مرنة" },
      icon: Zap,
      color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      benefits: [
        { en: "5 CV credits", ar: "رصيد 5 سير" },
        { en: "All templates", ar: "جميع القوالب" },
        { en: "6 months validity", ar: "صالح لمدة 6 أشهر" },
        { en: "No watermark", ar: "بدون علامة مائية" },
      ],
    },
    annual_pass: {
      name: { en: "Annual Pass", ar: "البطاقة السنوية" },
      icon: Crown,
      color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      benefits: [
        { en: "Unlimited CVs", ar: "سير غير محدودة" },
        { en: "All templates", ar: "جميع القوالب" },
        { en: "Cover letter tools", ar: "أدوات خطاب التغطية" },
        { en: "Future features", ar: "الميزات المستقبلية" },
      ],
    },
  };

  // Get plan info for current plan
  const currentPlanInfo = plan ? planInfo[plan.planType] : planInfo.free;
  const PlanIcon = currentPlanInfo.icon;

  // Format date helper
  function formatDate(timestamp: any, isAr: boolean): string {
    if (!timestamp) return t("Never", "أبدًا");
    
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString(isAr ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return t("Invalid date", "تاريخ غير صحيح");
    }
  }

  // Loading state
  if (authLoading || loading) {
    return (
      <SiteLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d47a1] mx-auto mb-4"></div>
            <p className="text-zinc-600 dark:text-zinc-400">
              {t("Loading...", "جاري التحميل...")}
            </p>
          </div>
        </div>
      </SiteLayout>
    );
  }

  // Not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <SiteLayout>
      <section className="px-4 py-10 sm:px-6 md:px-10" dir={isAr ? "rtl" : "ltr"}>
        <div className="mx-auto max-w-4xl">
          {/* Page Header with Breadcrumbs */}
          <div className="mb-8">
            <nav className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              <Link href="/" className="hover:text-[#0d47a1] transition-colors">
                {t("Home", "الرئيسية")}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-zinc-900 dark:text-zinc-100">
                {t("My Profile", "ملفي الشخصي")}
              </span>
            </nav>
            <h1 className="text-3xl font-semibold">{t("My Profile", "ملفي الشخصي")}</h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              {t("Manage your account settings and subscription", "إدارة إعدادات حسابك واشتراكك")}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Profile Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Card */}
              <Card>
                <CardHeader className="text-center">
                  {/* Avatar */}
                  <div className="flex justify-center mb-4">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || user.email || "User"}
                        className="h-24 w-24 rounded-full border-4 border-[#0d47a1]"
                      />
                    ) : (
                      <div className="h-24 w-24 rounded-full bg-[#0d47a1] flex items-center justify-center">
                        <User className="h-12 w-12 text-white" />
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-xl">
                    {profile?.name || user.displayName || user.email?.split("@")[0] || t("User", "مستخدم")}
                  </CardTitle>
                  <CardDescription className="flex items-center justify-center gap-2 mt-2">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Usage Stats */}
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold mb-3">
                      {t("Usage Statistics", "إحصائيات الاستخدام")}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {t("CVs Created", "السير المُنشأة")}
                        </span>
                        <span className="font-semibold">{cvCount}</span>
                      </div>
                      {/* Templates unlocked based on plan */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          {t("Templates Unlocked", "القوالب المفتوحة")}
                        </span>
                        <span className="font-semibold">
                          {plan?.planType === "flex_pack" || plan?.planType === "annual_pass" 
                            ? t("All", "الكل")
                            : "3"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("Quick Actions", "إجراءات سريعة")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/dashboard">
                      <FileText className="h-4 w-4 mr-2" />
                      {t("My CVs", "سيري الذاتية")}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/create-cv">
                      <FileText className="h-4 w-4 mr-2" />
                      {t("Create New CV", "إنشاء سيرة جديدة")}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Subscription & Settings */}
            <div className="lg:col-span-2 space-y-6">
              {/* Subscription Plan Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <PlanIcon className="h-6 w-6" />
                        {t(currentPlanInfo.name.en, currentPlanInfo.name.ar)}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {plan?.planType === "free"
                          ? t("Basic plan with limited features", "خطة أساسية بميزات محدودة")
                          : plan?.planType === "one_time"
                          ? t("One-time purchase with 7 days validity", "شراء لمرة واحدة صالح لـ 7 أيام")
                          : plan?.planType === "flex_pack"
                          ? t("Flexible pack with wallet credits", "باقة مرنة برصيد محفظة")
                          : t("Annual subscription with all features", "اشتراك سنوي بجميع الميزات")}
                      </CardDescription>
                    </div>
                    <Badge className={currentPlanInfo.color}>
                      {plan?.planType === "free"
                        ? t("Free", "مجاني")
                        : plan?.planType === "one_time"
                        ? t("Paid", "مدفوع")
                        : plan?.planType === "flex_pack"
                        ? t("Active", "نشط")
                        : t("Active", "نشط")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Plan Benefits */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3">
                      {t("Plan Benefits", "مميزات الخطة")}
                    </h3>
                    <ul className="space-y-2">
                      {currentPlanInfo.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span>{t(benefit.en, benefit.ar)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Plan Details */}
                  <div className="border-t pt-4 space-y-3">
                    {plan?.validUntil && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {t("Valid Until", "صالح حتى")}
                        </span>
                        <span className="font-medium">{formatDate(plan.validUntil, isAr)}</span>
                      </div>
                    )}
                    {plan?.creditsRemaining !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          {t("Credits Remaining", "الرصيد المتبقي")}
                        </span>
                        <span className="font-medium">{plan.creditsRemaining}</span>
                      </div>
                    )}
                    {plan?.lastPurchaseDate && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {t("Last Purchase", "آخر شراء")}
                        </span>
                        <span className="font-medium">{formatDate(plan.lastPurchaseDate, isAr)}</span>
                      </div>
                    )}
                  </div>

                  {/* Upgrade/Manage Actions */}
                  <div className="border-t pt-4">
                    {plan?.planType === "free" || plan?.planType === "one_time" ? (
                      <Button asChild className="w-full" style={{ backgroundColor: "#0d47a1" }}>
                        <Link href="/pricing" className="flex items-center gap-2">
                          <ArrowUpRight className="h-4 w-4" />
                          {t("Upgrade Plan", "ترقية الخطة")}
                        </Link>
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Button asChild variant="outline" className="w-full">
                          <Link href="/pricing" className="flex items-center gap-2">
                            {t("Manage Subscription", "إدارة الاشتراك")}
                          </Link>
                        </Button>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                          {t(
                            "For cancellations or changes, please contact support.",
                            "لإلغاء أو تغيير الاشتراك، يرجى التواصل مع الدعم."
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Account Settings Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">{t("Account Settings", "إعدادات الحساب")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Password Change Section */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          {t("Password", "كلمة المرور")}
                        </h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                          {t(
                            "Change your password via email reset link",
                            "غير كلمة المرور عبر رابط إعادة التعيين بالبريد"
                          )}
                        </p>
                      </div>
                    </div>
                    {passwordResetSent ? (
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>
                          {t(
                            "Password reset email sent! Check your inbox.",
                            "تم إرسال بريد إعادة تعيين كلمة المرور! تحقق من بريدك."
                          )}
                        </span>
                      </div>
                    ) : (
                      <Button
                        onClick={handlePasswordReset}
                        disabled={passwordResetLoading}
                        variant="outline"
                        className="w-full"
                      >
                        {passwordResetLoading
                          ? t("Sending...", "جاري الإرسال...")
                          : t("Send Password Reset Email", "إرسال بريد إعادة التعيين")}
                      </Button>
                    )}
                  </div>

                  {/* Email Info (read-only) */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {t("Email Address", "عنوان البريد الإلكتروني")}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {user.email}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
                      {t(
                        "Email cannot be changed. Contact support if needed.",
                        "لا يمكن تغيير البريد الإلكتروني. تواصل مع الدعم إذا لزم الأمر."
                      )}
                    </p>
                  </div>

                  {/* Sign Out Section */}
                  <div className="border rounded-lg p-4 border-red-200 dark:border-red-800">
                    <div className="mb-4">
                      <h3 className="font-semibold mb-2 flex items-center gap-2 text-red-600 dark:text-red-400">
                        <LogOut className="h-4 w-4" />
                        {t("Sign Out", "تسجيل الخروج")}
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {t(
                          "Sign out of your account. You can sign back in anytime.",
                          "تسجيل الخروج من حسابك. يمكنك تسجيل الدخول مرة أخرى في أي وقت."
                        )}
                      </p>
                    </div>
                    <Button
                      onClick={async () => {
                        try {
                          await signOut();
                          router.push("/");
                        } catch (error) {
                          console.error("[Profile] Sign out error:", error);
                          alert(t(
                            "Failed to sign out. Please try again.",
                            "فشل تسجيل الخروج. يرجى المحاولة مرة أخرى."
                          ));
                        }
                      }}
                      variant="outline"
                      className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300 flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      {t("Sign Out", "تسجيل الخروج")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

