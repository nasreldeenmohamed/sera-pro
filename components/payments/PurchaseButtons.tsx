"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import { setUserPlanFromProduct } from "@/firebase/firestore";
import { useRouter } from "next/navigation";

type Product = "one_time" | "flex_pack" | "annual_pass";

/**
 * QA/Testing Mode: Bypass Payment
 * 
 * DISABLED: This bypass feature has been disabled in favor of user-based payment key selection.
 * The payment system now uses different API keys based on the authenticated user:
 * - Test user (JgGmhphtIsVyGO2nTnQde9ZOaKD2): Uses test/sandbox keys
 * - All other users: Uses production/live keys
 * 
 * If you need to restore this bypass feature, uncomment the code below and set:
 * NEXT_PUBLIC_ENABLE_QA_PAYMENT_BYPASS=true in .env.local
 * 
 * ⚠️ IMPORTANT: This bypass should NOT be enabled in production!
 */
// const ENABLE_QA_PAYMENT_BYPASS = process.env.NEXT_PUBLIC_ENABLE_QA_PAYMENT_BYPASS === "true";

export function PurchaseButton({ product }: { product: Product }) {
  const { user } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setError(null);
    setLoading(true);
    try {
      if (!user) {
        setError(t("Please sign in first.", "يرجى تسجيل الدخول أولاً."));
        setLoading(false);
        return;
      }

      // QA/TESTING MODE: Bypass payment and directly activate plan
      // DISABLED: Payment bypass removed. All users now go through payment gateway.
      // Test user (JgGmhphtIsVyGO2nTnQde9ZOaKD2) uses test/sandbox keys automatically.
      // To restore bypass functionality, uncomment the code below and enable ENABLE_QA_PAYMENT_BYPASS.
      /*
      if (ENABLE_QA_PAYMENT_BYPASS) {
        console.warn("[QA MODE] Payment bypass enabled - directly activating plan:", product);
        try {
          // Directly update subscription in Firestore (bypasses payment)
          await setUserPlanFromProduct(user.uid, product);
          console.log("[QA MODE] Plan activated successfully:", product);
          
          // Refresh the page to show updated plan features
          router.refresh();
          
          // Show success message (you could use a toast here)
          alert(t(
            `QA Mode: ${product} plan activated successfully!`,
            `وضع QA: تم تفعيل خطة ${product} بنجاح!`
          ));
        } catch (qaError: any) {
          console.error("[QA MODE] Failed to activate plan:", qaError);
          setError(t("Failed to activate plan.", "فشل تفعيل الخطة."));
        } finally {
          setLoading(false);
        }
        return;
      }
      */

      // PRODUCTION MODE: Normal payment flow through Kashier
      // Payment keys are automatically selected based on user ID:
      // - Test user: Uses test/sandbox keys
      // - All other users: Uses production/live keys
      
      // Step 1: Request checkout URL from API
      // The API endpoint will:
      // - Create a pending Transaction record in Firestore
      // - Generate Kashier payment URL using secure environment variables (ppLink)
      // - Return both the payment URL and transactionId
      const planName = product === "one_time" ? "one_time" : product === "flex_pack" ? "flex_pack" : "annual_pass";
      const checkoutUrl = `/api/payments/kashier/checkout?product=${encodeURIComponent(planName)}&userId=${encodeURIComponent(user.uid)}`;
      
      const res = await fetch(checkoutUrl);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        
        // Handle service unavailable (payment not configured)
        if (res.status === 503 || json.code === "PAYMENT_NOT_CONFIGURED") {
          throw new Error(
            t(
              "Payment service is temporarily unavailable. Please contact support.",
              "خدمة الدفع غير متاحة مؤقتًا. يرجى التواصل مع الدعم."
            )
          );
        }
        
        throw new Error(json?.error || t("Failed to create checkout session", "فشل إنشاء جلسة الدفع"));
      }
      
      const json = await res.json();
      if (!json.url) {
        throw new Error(t("Invalid checkout response", "استجابة دفع غير صالحة"));
      }

      // Step 2: Redirect user to Kashier payment page
      // This is a full-page redirect to Kashier's secure payment page
      // The payment URL is generated server-side using secure environment variables
      // After payment completion, Kashier will redirect back to our success/cancel URLs
      // Note: The transaction has already been created in Firestore with status "pending"
      window.location.href = json.url;
    } catch (e: any) {
      setError(e?.message || t("Payment error", "خطأ في الدفع"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button disabled={loading || !user} onClick={startCheckout} className="w-full">
        {loading 
          ? t("Redirecting to secure payment...", "جارٍ إعادة التوجيه إلى الدفع الآمن...")
          : product === "one_time" 
          ? t("Buy Single CV", "شراء سيرة") 
          : product === "flex_pack" 
          ? t("Buy Flex Pack", "شراء باقة مرنة") 
          : t("Buy Annual Pass", "شراء البطاقة السنوية")
        }
      </Button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {!user ? <p className="text-xs text-zinc-500">{t("Sign in to purchase.", "سجل الدخول لإتمام الشراء.")}</p> : null}
    </div>
  );
}

export function ActivationTester({ product }: { product: Product }) {
  const { user } = useAuth();
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function activate() {
    if (!user) return;
    setLoading(true);
    setMessage(null);
    try {
      // In production, this is called by a verified webhook/callback after success
      const res = await fetch("/api/payments/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, product }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Activation failed");
      setMessage(t("Plan activated.", "تم تفعيل الخطة."));
    } catch (e: any) {
      setMessage(t("Activation failed.", "فشل التفعيل."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button disabled={loading || !user} onClick={activate} variant="secondary" className="w-full">
        {loading ? t("Activating...", "...تفعيل") : t("Activate (Test)", "تفعيل (تجربة)")}
      </Button>
      {message ? <p className="text-xs text-zinc-600 dark:text-zinc-400">{message}</p> : null}
    </div>
  );
}


