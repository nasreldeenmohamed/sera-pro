"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { setUserPlanFromProduct } from "@/firebase/firestore";

/**
 * Plan Action Button Component
 * 
 * Unified button component for pricing plan actions with authentication handling.
 * Used consistently across Home page and Pricing page for maintainability.
 * 
 * Features:
 * - Authentication check: Redirects to login if user is not authenticated
 * - Plan-specific actions:
 *   - Free: Navigate to CV builder (no auth required)
 *   - One-Time: Purchase CV flow (requires auth, then payment)
 *   - Flex Pack: Purchase pack workflow (requires auth, then payment)
 *   - Annual Pass: Purchase subscription workflow (requires auth, then payment)
 * - QA mode support: Bypass payment for testing when enabled
 * - Consistent styling and behavior across pages
 * 
 * Props:
 * - product: The plan product type ("free" | "one_time" | "flex_pack" | "annual_pass")
 * - buttonText: Optional custom button text (defaults to plan-specific text)
 * - className: Additional CSS classes
 * - style: Additional inline styles
 */

type PlanProduct = "free" | "one_time" | "flex_pack" | "annual_pass";

type PlanActionButtonProps = {
  product: PlanProduct;
  buttonText?: string;
  className?: string;
  style?: React.CSSProperties;
  returnUrl?: string; // URL to return to after login (defaults to current page)
};

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

export function PlanActionButton({
  product,
  buttonText,
  className = "mt-6 w-full text-white",
  style = { backgroundColor: "#0d47a1" },
  returnUrl,
}: PlanActionButtonProps) {
  const { user } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  /**
   * Handle plan action click
   * 
   * Flow:
   * 1. Free plan: Navigate to CV builder (no auth required)
   * 2. Paid plans: Check authentication
   *    - If not logged in: Redirect to auth page with return URL
   *    - If logged in: Create transaction, get payment URL, then redirect to Kashier
   */
  const handleAction = async () => {
    // Free plan: Navigate to CV builder directly (no authentication required)
    if (product === "free") {
      router.push("/create-cv");
      return;
    }

    // Paid plans require authentication
    if (!user) {
      // Redirect to login with return URL to come back after authentication
      const redirectUrl = returnUrl || "/pricing";
      router.push(`/auth?redirect=${encodeURIComponent(redirectUrl)}`);
      return;
    }

    // User is authenticated, proceed with purchase flow
    setLoading(true);
    
    try {
      // Step 1: Call checkout API to create pending transaction and get payment URL
      // The API endpoint:
      // - Creates a pending Transaction record in Firestore
      // - Generates Kashier payment URL using secure environment variables
      // - Returns both the payment URL and transactionId
      const checkoutResponse = await fetch(
        `/api/payments/kashier/checkout?product=${encodeURIComponent(product)}&userId=${encodeURIComponent(user.uid)}`
      );

      if (!checkoutResponse.ok) {
        const error = await checkoutResponse.json().catch(() => ({}));
        
        // Handle service unavailable (payment not configured)
        if (checkoutResponse.status === 503 || error.code === "PAYMENT_NOT_CONFIGURED") {
          alert(t(
            "Payment service is temporarily unavailable. Please contact support.",
            "خدمة الدفع غير متاحة مؤقتًا. يرجى التواصل مع الدعم."
          ));
          setLoading(false);
          return;
        }

        throw new Error(
          error.error || t("Failed to create checkout session. Please try again.", "فشل إنشاء جلسة الدفع. يرجى المحاولة مرة أخرى.")
        );
      }

      const { url, transactionId } = await checkoutResponse.json();
      
      if (!url) {
        throw new Error(t("Invalid payment response.", "استجابة دفع غير صالحة."));
      }

      // Step 2: Show redirecting message to user
      // This provides feedback that the transaction was created and redirect is happening
      setRedirecting(true);
      
      // Optional: Show a brief message before redirect (enhances UX)
      // The message appears for a very short time before redirect happens
      setTimeout(() => {
        // Step 3: Redirect user to Kashier payment page
        // This is a full-page redirect to Kashier's secure payment page
        // The payment URL is generated server-side using secure environment variables
        // After payment completion, Kashier will redirect back to our success/cancel URLs
        window.location.href = url;
      }, 500); // Small delay to show "Redirecting..." message
      
    } catch (error: any) {
      console.error("[PlanActionButton] Payment checkout error:", error);
      alert(error.message || t("Payment error. Please try again.", "خطأ في الدفع. يرجى المحاولة مرة أخرى."));
      setLoading(false);
      setRedirecting(false);
    }
  };

  // Default button text based on product type
  const defaultButtonText = {
    free: t("Create Free CV", "أنشئ سيرة مجانية"),
    one_time: t("Buy CV", "شراء سيرة"),
    flex_pack: t("Get Flex Pack", "شراء الباقة المرنة"),
    annual_pass: t("Get Annual Pass", "الحصول على البطاقة السنوية"),
  };

  const displayText = buttonText || defaultButtonText[product];

  // Free plan uses Link (direct navigation, no auth needed)
  // Paid plans use Button with onClick (requires auth check)
  if (product === "free") {
    return (
      <Button asChild className={className} style={style}>
        <Link href="/create-cv">{displayText}</Link>
      </Button>
    );
  }

  // Paid plans: Use button with onClick handler for auth check and payment redirect
  return (
    <Button 
      onClick={handleAction} 
      className={className} 
      style={style}
      disabled={loading || redirecting}
    >
      {redirecting 
        ? t("Redirecting to secure payment...", "جارٍ إعادة التوجيه إلى الدفع الآمن...")
        : loading 
        ? t("Processing...", "جارٍ المعالجة...")
        : displayText
      }
    </Button>
  );
}

