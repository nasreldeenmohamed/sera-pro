"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { listUserCvs, deleteUserCv, getUserPlan, type UserCv, type UserPlan } from "@/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useLocale } from "@/lib/locale-context";
import { PurchaseButton } from "@/components/payments/PurchaseButtons";
import { SiteLayout } from "@/components/layout/SiteLayout";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { isAr, t, setLocale } = useLocale();

  const [cvs, setCvs] = useState<UserCv[]>([]);
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [loading, user, router]);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const [items, p] = await Promise.all([listUserCvs(user.uid), getUserPlan(user.uid)]);
        setCvs(items);
        setPlan(p);
      } catch (e) {
        // TODO(error): surface error state
      }
    }
    load();
  }, [user]);

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

        {/* Plan summary */}
        <Alert className="mb-6">
          <AlertTitle>{t("Current Plan", "الخطة الحالية")}: {planBadge}</AlertTitle>
          <AlertDescription>
            {/* TODO(access): Populate from Firestore plan doc once payment flows write these fields */}
            {plan?.planType === "flex_pack" && (
              <span>{t("Credits left", "الرصيد المتبقي")}: {plan.credits ?? 0} {t("of", "من")} {plan.creditsTotal ?? 5}</span>
            )}
            {plan?.planType === "one_time" && plan.oneTimeExpiresAt && (
              <span className="block">{t("Editing window ends", "تنتهي مهلة التعديل")}: {/* timestamp formatting later */} </span>
            )}
            {plan?.planType === "annual_pass" && plan.annualRenewsAt && (
              <span className="block">{t("Renews on", "تجديد في")}: {/* date formatting later */}</span>
            )}
          </AlertDescription>
        </Alert>

        {/* Actions */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          {/* TODO(gating): Disable when user lacks credits/access */}
          <Button disabled={!canCreate} onClick={() => router.push("/create-cv")} className="text-white" style={{ backgroundColor: "#0d47a1" }}>{t("Create New CV", "إنشاء سيرة جديدة")}</Button>
          {/* TODO(payment): Open pricing modal or go to pricing page */}
          <Button variant="secondary" onClick={() => router.push("/pricing")}>{t("Buy Packages", "شراء باقات")}</Button>
        </div>

        {/* Quick purchase options */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <PurchaseButton product="one_time" />
          <PurchaseButton product="flex_pack" />
          <PurchaseButton product="annual_pass" />
        </div>

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


