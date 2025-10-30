"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";

type Product = "one_time" | "flex_pack" | "annual_pass";

export function PurchaseButton({ product }: { product: Product }) {
  const { user } = useAuth();
  const { t } = useLocale();
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


