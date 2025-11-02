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
 * Set ENABLE_QA_PAYMENT_BYPASS=true in .env.local to enable payment bypass for QA/testing.
 * When enabled, clicking "Subscribe" will directly update the subscription in Firestore
 * without going through payment gateway.
 * 
 * ⚠️ IMPORTANT: Remove or disable this before production deployment!
 */
const ENABLE_QA_PAYMENT_BYPASS = process.env.NEXT_PUBLIC_ENABLE_QA_PAYMENT_BYPASS === "true";

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

      // PRODUCTION MODE: Normal payment flow through Kashier
      // Request Kashier checkout URL with product and userId
      const planName = product === "one_time" ? "one_time" : product === "flex_pack" ? "flex_pack" : "annual_pass";
      const checkoutUrl = `/api/payments/kashier/checkout?product=${encodeURIComponent(planName)}&userId=${encodeURIComponent(user.uid)}`;
      const res = await fetch(checkoutUrl);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || "Failed to create checkout session");
      }
      const json = await res.json();
      if (!json.url) throw new Error("Invalid checkout response");
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
        {loading ? t("Processing...", "جارٍ المعالجة...") :
          product === "one_time" ? t("Buy Single CV", "شراء سيرة") :
          product === "flex_pack" ? t("Buy Flex Pack", "شراء باقة مرنة") :
          t("Buy Annual Pass", "شراء البطاقة السنوية")}
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


