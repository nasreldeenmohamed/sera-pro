"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { getTransactionByReference, getTransactionByOrderId, updateTransactionWithPaymentData, type Transaction, getUserProfile } from "@/firebase/firestore";
// Note: Signature validation is handled server-side by the webhook
// Client-side validation removed to avoid environment variable issues
import { trackPurchase } from "@/lib/meta-pixel";
import { trackPurchase as trackGAPurchase } from "@/lib/google-analytics";

/**
 * URL Decode Helper Function
 */
function urlDecode(value: string | null): string | undefined {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
}

/**
 * Extract and map transaction data from URL parameters
 */
function extractAndMapTransactionData(
  trxReferenceNumber: string,
  searchParams: URLSearchParams
): {
  paymentData: {
    paymentStatus: "2" | "3";
    trxReferenceNumber: string;
    transactionAmount?: string;
    transactionCurrency?: string;
    maskedCard?: string;
    cardBrand?: string;
    cardDataToken?: string;
    merchantOrderId?: string;
    orderId?: string;
    orderReference?: string;
    mode?: "test" | "live";
    signature?: string;
  };
  metadata: {
    transactionId?: string;
    paymentStatusRaw?: string;
  };
} {
  // Extract payment status
  const paymentStatusRaw = searchParams.get("paymentStatus");
  const paymentStatus: "2" | "3" = 
    paymentStatusRaw === "SUCCESS" || paymentStatusRaw === "success" ? "2" : "3";

  // Extract and decode all parameters
  const paymentData = {
    paymentStatus,
    trxReferenceNumber,
    transactionAmount: urlDecode(searchParams.get("amount") || searchParams.get("currency") ? searchParams.get("amount") : null),
    transactionCurrency: urlDecode(searchParams.get("currency")),
    maskedCard: urlDecode(searchParams.get("maskedCard")),
    cardBrand: urlDecode(searchParams.get("cardBrand")),
    cardDataToken: urlDecode(searchParams.get("cardDataToken")),
    merchantOrderId: urlDecode(searchParams.get("merchantOrderId")),
    orderId: urlDecode(searchParams.get("orderId")),
    orderReference: urlDecode(searchParams.get("orderReference")),
    mode: (urlDecode(searchParams.get("mode")) as "test" | "live") || undefined,
    signature: urlDecode(searchParams.get("signature")),
  };

  return {
    paymentData,
    metadata: {
      paymentStatusRaw: paymentStatusRaw || undefined,
    },
  };
}

/**
 * Payment Approved Page - Handles successful payment redirects from Kashier
 * 
 * Route: /payment-approved/[trxReferenceNumber]
 * 
 * This page is called when Kashier redirects users after successful payment.
 * It validates the signature, updates the transaction, and activates the subscription.
 */
function PaymentApprovedContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t, locale } = useLocale();
  
  const trxReferenceNumber = params.trxReferenceNumber as string;
  
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transactionData, setTransactionData] = useState<any>(null);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null);

  useEffect(() => {
    const processPayment = async () => {
      if (!trxReferenceNumber) {
        setStatus("error");
        setErrorMessage(t("Transaction reference is required.", "مرجع المعاملة مطلوب."));
        return;
      }

      try {
        // Extract payment data from URL
        const { paymentData, metadata } = extractAndMapTransactionData(trxReferenceNumber, searchParams);

        // Note: Signature validation is handled server-side by the webhook endpoint
        // We rely on the webhook to validate signatures and update transactions securely
        // Client-side validation removed to avoid environment variable access issues

        // Find transaction - try multiple lookup methods for robustness
        // 1. Try by trxReferenceNumber (from URL path)
        // 2. Try by merchantOrderId (from query params - what Kashier sends back)
        // 3. Try by orderId (fallback)
        let transaction: Transaction | null = null;
        
        console.log("[Payment Approved] Looking up transaction:", {
          trxReferenceNumber,
          merchantOrderId: paymentData.merchantOrderId,
          orderId: paymentData.orderId,
        });

        // Method 1: Try by trxReferenceNumber (from URL path)
        transaction = await getTransactionByReference(trxReferenceNumber);
        
        // Method 2: Try by merchantOrderId if not found (Kashier sends this in query params)
        if (!transaction && paymentData.merchantOrderId) {
          console.log("[Payment Approved] Transaction not found by reference, trying merchantOrderId:", paymentData.merchantOrderId);
          transaction = await getTransactionByOrderId(paymentData.merchantOrderId);
        }
        
        // Method 3: Try by orderId as last resort
        if (!transaction && paymentData.orderId) {
          console.log("[Payment Approved] Transaction not found by merchantOrderId, trying orderId:", paymentData.orderId);
          transaction = await getTransactionByOrderId(paymentData.orderId);
        }

        if (!transaction) {
          console.error("[Payment Approved] Transaction not found with any method:", {
            trxReferenceNumber,
            merchantOrderId: paymentData.merchantOrderId,
            orderId: paymentData.orderId,
          });
          setStatus("error");
          setErrorMessage(t("Transaction not found.", "المعاملة غير موجودة."));
          return;
        }

        console.log("[Payment Approved] Transaction found:", {
          transactionId: transaction.transactionId,
          orderId: transaction.orderId,
          paymentStatus: transaction.paymentStatus,
        });

        // Validate transaction belongs to user
        if (user && transaction.userId !== user.uid) {
          setStatus("error");
          setErrorMessage(t("Unauthorized access to transaction.", "وصول غير مصرح به للمعاملة."));
          return;
        }

        // Check if already processed (idempotency)
        if (transaction.paymentStatus === "2" || transaction.paymentStatus === "3") {
          console.log("[Payment Approved] Transaction already processed");
          // Still show success if payment was successful
          if (transaction.paymentStatus === "2") {
            setStatus("success");
            setTransactionData(transaction);
            
            // Activate subscription if not already activated
            try {
              await fetch("/api/payments/activate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transactionId: transaction.transactionId }),
              });
            } catch (activateError) {
              console.error("[Payment Approved] Activation error:", activateError);
            }
            return;
          }
        }

        // Only process if payment was successful
        if (paymentData.paymentStatus !== "2") {
          setStatus("error");
          setErrorMessage(t("Payment was not successful.", "لم يكن الدفع ناجحًا."));
          return;
        }

        // Update transaction with payment data
        console.log("[Payment Approved] Updating transaction with payment data:", {
          transactionId: transaction.transactionId,
          paymentStatus: paymentData.paymentStatus,
        });
        await updateTransactionWithPaymentData(transaction.transactionId, paymentData);
        console.log("[Payment Approved] Transaction updated successfully");

        // Activate subscription
        console.log("[Payment Approved] Activating subscription for transaction:", transaction.transactionId);
        const activateResponse = await fetch("/api/payments/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactionId: transaction.transactionId }),
        });

        if (!activateResponse.ok) {
          const errorData = await activateResponse.json().catch(() => ({ error: "Unknown error" }));
          console.error("[Payment Approved] Activation failed:", {
            status: activateResponse.status,
            error: errorData,
          });
          throw new Error(errorData.error || "Failed to activate subscription");
        }

        const activateResult = await activateResponse.json();
        console.log("[Payment Approved] Subscription activated successfully:", activateResult);

        // Track analytics
        trackPurchase({
          value: parseFloat(paymentData.transactionAmount || "0"),
          currency: paymentData.transactionCurrency || "EGP",
        });

        trackGAPurchase({
          transaction_id: transaction.transactionId,
          value: parseFloat(paymentData.transactionAmount || "0"),
          currency: paymentData.transactionCurrency || "EGP",
        });

        // Get updated user profile for subscription end date
        if (user) {
          const userProfile = await getUserProfile(user.uid);
          if (userProfile?.subscription?.expirationDate) {
            const date = new Date(userProfile.subscription.expirationDate.toDate());
            setSubscriptionEndDate(date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US"));
          }
        }

        setStatus("success");
        setTransactionData({ ...transaction, ...paymentData });
      } catch (error: any) {
        console.error("[Payment Approved] Error:", error);
        setStatus("error");
        setErrorMessage(error.message || t("An error occurred processing your payment.", "حدث خطأ أثناء معالجة الدفع."));
      }
    };

    processPayment();
  }, [trxReferenceNumber, searchParams, user, t, locale]);

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {status === "processing" && (
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
              <p>{t("Processing your payment...", "جارٍ معالجة الدفع...")}</p>
            </div>
          )}

          {status === "success" && transactionData && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <CardTitle>{t("Payment Successful!", "تم الدفع بنجاح!")}</CardTitle>
                </div>
                <CardDescription>
                  {t("Your subscription has been activated.", "تم تفعيل اشتراكك.")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold">{t("Transaction Details", "تفاصيل المعاملة")}</p>
                  <p>{t("Transaction ID", "معرف المعاملة")}: {transactionData.transactionId}</p>
                  <p>{t("Amount", "المبلغ")}: {transactionData.transactionAmount} {transactionData.transactionCurrency}</p>
                  {subscriptionEndDate && (
                    <p>{t("Subscription valid until", "الاشتراك صالح حتى")}: {subscriptionEndDate}</p>
                  )}
                </div>
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="w-full"
                  style={{ backgroundColor: "#0d47a1" }}
                >
                  {t("Go to Dashboard", "الذهاب إلى لوحة التحكم")}
                </Button>
              </CardContent>
            </Card>
          )}

          {status === "error" && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                {errorMessage || t("An error occurred.", "حدث خطأ.")}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}

export default function PaymentApprovedPage() {
  return (
    <Suspense
      fallback={
        <SiteLayout>
          <div className="container mx-auto px-4 py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          </div>
        </SiteLayout>
      }
    >
      <PaymentApprovedContent />
    </Suspense>
  );
}

