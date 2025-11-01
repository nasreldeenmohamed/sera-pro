"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

type Product = "one_time" | "flex_pack" | "annual_pass";

function PaymentSuccessPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLocale();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function activatePlan() {
      // Extract params from Kashier redirect
      // Typical params: status, orderId, product, userId (optional, prefer auth context)
      const productParam = searchParams.get("product");
      const userIdParam = searchParams.get("userId");
      const paymentStatus = searchParams.get("status");
      const orderId = searchParams.get("orderId");

      // Validate required params
      if (!productParam || !["one_time", "flex_pack", "annual_pass"].includes(productParam)) {
        setStatus("error");
        setErrorMessage(t("Invalid payment product.", "منتج الدفع غير صالح."));
        return;
      }

      // Prefer authenticated user, fallback to userId param (if trusted)
      const userId = user?.uid || userIdParam;
      if (!userId) {
        setStatus("error");
        setErrorMessage(t("User not found. Please sign in.", "المستخدم غير موجود. يرجى تسجيل الدخول."));
        return;
      }

      // TODO(security): Verify paymentStatus === "success" and validate signature/orderId with Kashier API
      // For now, we assume success page only loads on successful payment

      try {
        const res = await fetch("/api/payments/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, product: productParam as Product }),
        });

        const json = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(json?.error || t("Activation failed.", "فشل التفعيل."));
        }

        setStatus("success");
        // Auto-redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      } catch (e: any) {
        console.error("[Payment Success] Activation error:", e);
        setStatus("error");
        setErrorMessage(e?.message || t("Failed to activate plan.", "فشل تفعيل الخطة."));
      }
    }

    if (user || searchParams.get("userId")) {
      activatePlan();
    } else {
      // Wait a bit for auth to load, then retry or show error
      const timeout = setTimeout(() => {
        if (!user) {
          setStatus("error");
          setErrorMessage(t("Please sign in to complete activation.", "يرجى تسجيل الدخول لإكمال التفعيل."));
        }
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [searchParams, user, router, t]);

  const productName = (() => {
    const p = searchParams.get("product");
    if (p === "one_time") return t("Single CV", "سيرة واحدة");
    if (p === "flex_pack") return t("Flex Pack", "الباقة المرنة");
    if (p === "annual_pass") return t("Annual Pass", "البطاقة السنوية");
    return t("Plan", "الخطة");
  })();

  return (
    <SiteLayout>
      <div className="container mx-auto max-w-2xl px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === "loading" && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === "success" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            {status === "error" && <XCircle className="h-5 w-5 text-red-600" />}
            {status === "loading"
              ? t("Processing Payment...", "جارٍ معالجة الدفع...")
              : status === "success"
              ? t("Payment Successful!", "تم الدفع بنجاح!")
              : t("Payment Error", "خطأ في الدفع")}
          </CardTitle>
          <CardDescription>
            {status === "loading"
              ? t("Activating your plan, please wait...", "جارٍ تفعيل خطتك، يرجى الانتظار...")
              : status === "success"
              ? t(`Your ${productName} has been activated successfully.`, `تم تفعيل ${productName} بنجاح.`)
              : t("There was an issue processing your payment.", "حدثت مشكلة في معالجة الدفع.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "success" && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                {t("Redirecting to dashboard...", "جارٍ التوجيه إلى لوحة التحكم...")}
              </AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage || t("Unknown error occurred.", "حدث خطأ غير معروف.")}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            {status === "success" && (
              <Button onClick={() => router.push("/dashboard")} className="w-full sm:w-auto">
                {t("Go to Dashboard", "الانتقال إلى لوحة التحكم")}
              </Button>
            )}
            {status === "error" && (
              <>
                <Button onClick={() => router.push("/pricing")} className="w-full sm:w-auto">
                  {t("Try Again", "المحاولة مرة أخرى")}
                </Button>
                <Button onClick={() => router.push("/dashboard")} variant="outline" className="w-full sm:w-auto">
                  {t("Go to Dashboard", "الانتقال إلى لوحة التحكم")}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </SiteLayout>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessPageContent />
    </Suspense>
  );
}

