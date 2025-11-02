"use client";

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
 * Set NEXT_PUBLIC_ENABLE_QA_PAYMENT_BYPASS=true in .env.local to enable payment bypass for QA/testing.
 * When enabled, clicking purchase buttons will directly update the subscription in Firestore
 * without going through payment gateway.
 * 
 * ⚠️ IMPORTANT: Remove or disable this before production deployment!
 */
const ENABLE_QA_PAYMENT_BYPASS = process.env.NEXT_PUBLIC_ENABLE_QA_PAYMENT_BYPASS === "true";

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

  /**
   * Handle plan action click
   * 
   * Flow:
   * 1. Free plan: Navigate to CV builder (no auth required)
   * 2. Paid plans: Check authentication
   *    - If not logged in: Redirect to auth page with return URL
   *    - If logged in: Proceed with purchase (QA bypass or payment checkout)
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
    
    // QA/TESTING MODE: Bypass payment and directly activate plan
    if (ENABLE_QA_PAYMENT_BYPASS) {
      try {
        console.warn("[QA MODE] Payment bypass enabled - directly activating plan:", product);
        await setUserPlanFromProduct(user.uid, product);
        console.log("[QA MODE] Plan activated successfully:", product);
        
        // Refresh to show updated plan
        router.refresh();
        
        // Show success message
        alert(t(
          `QA Mode: ${product} plan activated successfully!`,
          `وضع QA: تم تفعيل خطة ${product} بنجاح!`
        ));
      } catch (error: any) {
        console.error("[QA MODE] Failed to activate plan:", error);
        alert(t("Failed to activate plan. Please try again.", "فشل تفعيل الخطة. يرجى المحاولة مرة أخرى."));
      }
      return;
    }

    // PRODUCTION MODE: Redirect to payment checkout
    router.push(`/api/payments/kashier/checkout?product=${product}&userId=${user.uid}`);
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

  // Paid plans: Use button with onClick handler for auth check
  return (
    <Button onClick={handleAction} className={className} style={style}>
      {displayText}
    </Button>
  );
}

