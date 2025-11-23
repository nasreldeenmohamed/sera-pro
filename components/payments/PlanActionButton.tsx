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
      // Step 1: Call checkout API to create pending transaction and get iframe configuration
      // Pass user email to ensure profile can be created if it doesn't exist
      const email = user.email || "";
      const checkoutResponse = await fetch(
        `/api/payments/kashier/checkout?product=${encodeURIComponent(product)}&userId=${encodeURIComponent(user.uid)}&email=${encodeURIComponent(email)}`
      );

      if (!checkoutResponse.ok) {
        let errorMessage: string = t("Failed to create checkout session. Please try again.", "فشل إنشاء جلسة الدفع. يرجى المحاولة مرة أخرى.");
        
        // Try to parse error response
        try {
          const error = await checkoutResponse.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch (parseError) {
          // If response is not JSON, use status-specific messages
          if (checkoutResponse.status === 503) {
            errorMessage = t(
              "Payment service is temporarily unavailable. Please try again in a few moments or contact support.",
              "خدمة الدفع غير متاحة مؤقتًا. يرجى المحاولة مرة أخرى بعد قليل أو التواصل مع الدعم."
            );
          } else if (checkoutResponse.status === 500) {
            errorMessage = t(
              "An error occurred while processing your request. Please try again or contact support.",
              "حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى أو التواصل مع الدعم."
            );
          } else if (checkoutResponse.status === 404) {
            errorMessage = t(
              "Payment endpoint not found. Please contact support.",
              "نقطة نهاية الدفع غير موجودة. يرجى التواصل مع الدعم."
            );
          }
        }
        
        console.error("[PlanActionButton] Checkout API error:", {
          status: checkoutResponse.status,
          statusText: checkoutResponse.statusText,
          message: errorMessage,
        });
        
        throw new Error(errorMessage);
      }

      const { config, transactionId } = await checkoutResponse.json();
      
      if (!config || !transactionId) {
        throw new Error(t("Invalid payment response.", "استجابة دفع غير صالحة."));
      }

      // Step 2: Navigate to iframe payment page with configuration
      // Encode config as JSON string in URL parameter
      const configJson = encodeURIComponent(JSON.stringify(config));
      const iframeUrl = `/payments/iframe?config=${configJson}&transactionId=${encodeURIComponent(transactionId)}`;
      
      setRedirecting(true);
      router.push(iframeUrl);
      
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
      onClick={(e) => {
        console.log("[PlanActionButton] Button clicked for product:", product);
        e.preventDefault();
        handleAction();
      }} 
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

