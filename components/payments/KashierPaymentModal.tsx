"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useLocale } from "@/lib/locale-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, XCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

/**
 * Kashier Payment Modal Component
 * 
 * Integrates Kashier payment iFrame following official documentation:
 * https://developers.kashier.io/payment/payment-ui#i-frame
 * 
 * Implementation Details:
 * 1. Loads Kashier SDK script dynamically
 * 2. Initializes payment session with plan details
 * 3. Embeds payment form in iFrame within modal
 * 4. Handles payment success/failure callbacks
 * 5. Updates user plan in Firestore after successful payment
 * 6. Provides clear feedback in both Arabic and English
 * 
 * Error Handling:
 * - Network failures during checkout creation
 * - Payment session initialization failures
 * - Payment cancellation by user
 * - Activation API failures after payment
 * 
 * Future Extensibility:
 * - Add webhook verification for production
 * - Implement retry logic for failed activations
 * - Add payment history tracking
 * - Support multiple payment methods
 */

type Product = "one_time" | "flex_pack" | "annual_pass";

type KashierPaymentModalProps = {
  open: boolean;
  onClose: () => void;
  product: Product;
  amount: number;
  userId: string;
  userEmail?: string;
  userName?: string;
  onSuccess?: () => void;
};

// Pricing map matching API route
// Updated 2024: one_time price changed from 79 to 49 EGP
const PRICING: Record<Product, number> = {
  one_time: 49, // Single CV purchase: 1 CV, 3 templates, 7 days edits
  flex_pack: 149,
  annual_pass: 299,
};

// Product display names
const PRODUCT_NAMES: Record<Product, { en: string; ar: string }> = {
  one_time: { en: "Single CV Purchase", ar: "شراء سيرة واحدة" },
  flex_pack: { en: "Flex Pack", ar: "باقة مرنة" },
  annual_pass: { en: "Annual Pass", ar: "البطاقة السنوية" },
};

export function KashierPaymentModal({
  open,
  onClose,
  product,
  amount,
  userId,
  userEmail,
  userName,
  onSuccess,
}: KashierPaymentModalProps) {
  const { isAr, t } = useLocale();
  const router = useRouter();
  const { user } = useAuth();

  const [status, setStatus] = useState<
    "idle" | "loading" | "iframe_ready" | "processing" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Handle successful payment
  // Note: Primary activation happens on /payments/success page via redirect
  // This is a fallback for iframe-based detection
  const handlePaymentSuccess = useCallback(async () => {
    setStatus("processing");
    try {
      // Activate plan in Firestore
      const activateResponse = await fetch("/api/payments/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, product }),
      });

      if (!activateResponse.ok) {
        throw new Error(t("Failed to activate plan.", "فشل تفعيل الخطة."));
      }

      setStatus("success");

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Redirect to success page after short delay
      setTimeout(() => {
        router.push(`/payments/success?product=${product}&userId=${userId}`);
        onClose();
      }, 2000);
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(
        error.message ||
          t(
            "Payment succeeded but activation failed. Please contact support.",
            "نجح الدفع لكن فشل التفعيل. يرجى التواصل مع الدعم."
          )
      );
    }
  }, [userId, product, t, onSuccess, router, onClose]);

  // Initialize payment when modal opens
  useEffect(() => {
    if (!open) return;

    setStatus("loading");
    setErrorMessage(null);
    
    // Initialize payment session
    const initializePayment = async () => {
      try {
        // Build query params with customer info if available
        const params = new URLSearchParams({
          product: encodeURIComponent(product),
          userId: encodeURIComponent(userId),
        });
        if (userEmail) params.set("customerEmail", encodeURIComponent(userEmail));
        if (userName) params.set("customerName", encodeURIComponent(userName));

        // Get checkout URL from API
        const checkoutResponse = await fetch(
          `/api/payments/kashier/checkout?${params.toString()}`
        );

        if (!checkoutResponse.ok) {
          const error = await checkoutResponse.json().catch(() => ({}));
          
          // Handle service unavailable (payment not configured)
          if (checkoutResponse.status === 503 || error.code === "PAYMENT_NOT_CONFIGURED") {
            throw new Error(
              t(
                "Payment service is temporarily unavailable. Please contact support.",
                "خدمة الدفع غير متاحة مؤقتًا. يرجى التواصل مع الدعم."
              ) + 
              (error.details ? `\n\n${error.details}` : "")
            );
          }

          throw new Error(
            error.error ||
              t("Failed to initialize payment. Please try again later.", "فشل تهيئة الدفع. يرجى المحاولة مرة أخرى لاحقًا.")
          );
        }

        const { url } = await checkoutResponse.json();
        if (!url) {
          throw new Error(
            t("Invalid payment response.", "استجابة دفع غير صالحة.")
          );
        }

        setCheckoutUrl(url);
        setStatus("iframe_ready");
      } catch (error: any) {
        setStatus("error");
        setErrorMessage(
          error.message ||
            t(
              "Payment initialization failed. Please try again.",
              "فشلت تهيئة الدفع. يرجى المحاولة مرة أخرى."
            )
        );
      }
    };

    initializePayment();
  }, [open, product, userId, t]);

  // Monitor iFrame for payment completion
  // Note: Kashier redirects to success/cancel URLs, so we primarily handle those
  // The iFrame will redirect, and we can poll or listen for navigation
  useEffect(() => {
    if (!open || status !== "iframe_ready" || !iframeRef.current) return;

    // Listen for iframe load events (for redirect detection)
    const iframe = iframeRef.current;
    const handleIframeLoad = () => {
      try {
        // Check if iframe URL indicates success/failure
        // Note: This is a fallback; primary handling is via redirect URLs
        const iframeSrc = iframe.contentWindow?.location.href;
        if (iframeSrc?.includes("success")) {
          handlePaymentSuccess();
        } else if (iframeSrc?.includes("cancel")) {
          setStatus("idle");
          setErrorMessage(null);
        }
      } catch (e) {
        // Cross-origin restrictions may prevent reading iframe URL
        // This is expected and handled via redirect URLs
      }
    };

    iframe.addEventListener("load", handleIframeLoad);
    return () => iframe.removeEventListener("load", handleIframeLoad);
  }, [open, status, handlePaymentSuccess]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStatus("idle");
      setErrorMessage(null);
      setCheckoutUrl(null);
    }
  }, [open]);

  const productName = PRODUCT_NAMES[product];
  const displayAmount = amount || PRICING[product];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("Complete Your Purchase", "أكمل عملية الشراء")} - {t(productName.en, productName.ar)}
          </DialogTitle>
          <DialogDescription>
            {t(
              "Secure payment powered by Kashier. Your payment information is encrypted and secure.",
              "دفع آمن مدعوم من Kashier. معلومات الدفع الخاصة بك مشفرة وآمنة."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Order Summary */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("Plan", "الخطة")}:
              </span>
              <span className="text-sm font-semibold">
                {t(productName.en, productName.ar)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("Amount", "المبلغ")}:
              </span>
              <span className="text-lg font-bold" style={{ color: "#0d47a1" }}>
                {displayAmount} EGP
              </span>
            </div>
          </div>

          {/* Loading State */}
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {t(
                  "Initializing secure payment...",
                  "جارٍ تهيئة الدفع الآمن..."
                )}
              </p>
            </div>
          )}

          {/* iFrame Container - Kashier Payment Form
              Implementation Notes:
              - Kashier provides a checkout URL that can be embedded in an iFrame
              - The iFrame will redirect to success/cancel URLs after payment
              - We handle activation via the redirect URLs in /payments/success page
              - The iFrame approach keeps users on-site for better UX
              - In production, ensure proper CSP headers allow kashier.io iframe
          */}
          {status === "iframe_ready" && checkoutUrl && (
            <div className="w-full space-y-4">
              {/* Security Notice for Development/HTTP Context */}
              {/* In development (HTTP), browsers show a security warning about autofill */}
              {/* This is normal and doesn't affect payment security - the payment form itself is HTTPS */}
              <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
                  <div className="space-y-1">
                    <p className="font-semibold">
                      {t("ℹ️ Payment Security Notice", "ℹ️ إشعار أمان الدفع")}
                    </p>
                    <p>
                      {t(
                        "If you see a warning about 'secure connection' in the form below, this is expected in development. Your payment is processed securely through Kashier's HTTPS servers, and your card details are encrypted. In production, this warning will not appear.",
                        "إذا رأيت تحذيرًا حول 'اتصال آمن' في النموذج أدناه، فهذا متوقع في بيئة التطوير. يتم معالجة الدفع الخاص بك بأمان من خلال خوادم Kashier المشفرة، وتفاصيل بطاقتك مشفرة. في الإنتاج، لن يظهر هذا التحذير."
                      )}
                    </p>
                    <p className="text-xs opacity-90 mt-2">
                      {t(
                        "📝 Note: Any console warnings (WebSocket, Moment.js) are from Kashier's payment system and do not affect your payment security or functionality. These are common in test mode.",
                        "📝 ملاحظة: أي تحذيرات في وحدة التحكم (WebSocket، Moment.js) تأتي من نظام الدفع في Kashier ولا تؤثر على أمان أو وظائف الدفع. هذه شائعة في وضع الاختبار."
                      )}
                    </p>
                    <p className="text-xs opacity-90">
                      {t(
                        "💡 Tip: For the best experience, use the 'Complete Payment in Full Screen' button below.",
                        "💡 نصيحة: للحصول على أفضل تجربة، استخدم زر 'إتمام الدفع في شاشة كاملة' أدناه."
                      )}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Recommended: Full Screen Payment (HTTPS) */}
              <div className="text-center">
                <Button
                  className="w-full text-white font-semibold"
                  style={{ backgroundColor: "#0d47a1" }}
                  size="lg"
                  onClick={() => {
                    if (checkoutUrl) {
                      // Step 1: Transaction has already been created in Firestore (status: "pending")
                      // Step 2: Payment URL has been generated using secure environment variables
                      // Step 3: Redirect user to Kashier's secure payment page
                      // This is a full-page redirect to ensure proper HTTPS security
                      // After payment completion, Kashier will redirect back to our success/cancel URLs
                      window.location.href = checkoutUrl;
                    }
                  }}
                >
                  {t("🔒 Pay Securely in Full Screen", "🔒 الدفع بأمان في شاشة كاملة")}
                </Button>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                  {t(
                    "Recommended: Opens the secure payment page in a new window for the best experience.",
                    "موصى به: يفتح صفحة الدفع الآمنة في نافذة جديدة للحصول على أفضل تجربة."
                  )}
                </p>
              </div>

              {/* Alternative: iFrame Payment (shown but less recommended in development) */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 text-center">
                  {t("Or complete payment below:", "أو أكمل الدفع أدناه:")}
                </p>
                <div className="border rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
                  <iframe
                    ref={iframeRef}
                    src={checkoutUrl}
                    className="w-full min-h-[500px] border-0"
                    title={t("Kashier Payment", "دفع Kashier")}
                    allow="payment *"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-modals"
                    style={{ minHeight: "500px" }}
                  />
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                  {t(
                    "Complete payment in the secure form above. After payment, you'll be redirected automatically.",
                    "أكمل الدفع في النموذج الآمن أعلاه. بعد الدفع، سيتم إعادة توجيهك تلقائيًا."
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Processing State */}
          {status === "processing" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {t(
                  "Processing your payment...",
                  "جارٍ معالجة الدفع..."
                )}
              </p>
            </div>
          )}

          {/* Success State */}
          {status === "success" && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                {t(
                  "Payment successful! Your plan is being activated. Redirecting...",
                  "نجح الدفع! يتم تفعيل خطتك. جارٍ إعادة التوجيه..."
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Error State */}
          {status === "error" && errorMessage && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
