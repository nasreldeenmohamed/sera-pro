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
import { XCircle, Loader2 } from "lucide-react";
import { getTransaction, updateTransactionWithPaymentData } from "@/firebase/firestore";

/**
 * Payment Failed Page - Handles failed or cancelled payment redirects from Kashier
 * 
 * Route: /payment-failed
 * 
 * This page is called when Kashier redirects users after payment failure or cancellation.
 * 
 * URL Format:
 * /payment-failed?key1=value1&key2=value2...
 * 
 * Expected Query Parameters from Kashier:
 * - status: Payment status (should be "failed", "3", "cancelled", or "cancel")
 * - transactionId: Our internal transaction ID (optional)
 * - trxReferenceNumber: Transaction reference from Kashier (optional)
 * - orderId: Order ID used in checkout (optional)
 * - reason: Failure reason (optional)
 * - error: Error message (optional)
 * 
 * Flow:
 * 1. Extract payment failure data from query parameters
 * 2. Find transaction in Firestore (if transactionId or trxReferenceNumber provided)
 * 3. Update transaction status to "failed" (3)
 * 4. Show failure message with retry options
 * 
 * Security:
 * - Validates transaction belongs to authenticated user
 * - Handles missing parameters gracefully
 * - Prevents unauthorized transaction updates
 */
function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLocale();
  
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [failureReason, setFailureReason] = useState<string | null>(null);

  useEffect(() => {
    async function processFailure() {
      try {
        // Step 1: Extract payment failure data from URL query string
        // All parameters are URL decoded automatically by URLSearchParams
        const paymentStatus = searchParams.get("status");
        const trxId = searchParams.get("transactionId");
        const trxReferenceNumber = searchParams.get("trxReferenceNumber");
        const orderId = searchParams.get("orderId");
        const reason = searchParams.get("reason");
        const error = searchParams.get("error");

        // Store failure reason for display (URL decoded)
        if (reason) {
          setFailureReason(decodeURIComponent(reason.replace(/\+/g, " ")));
        } else if (error) {
          setFailureReason(decodeURIComponent(error.replace(/\+/g, " ")));
        } else if (paymentStatus === "cancelled" || paymentStatus === "cancel") {
          setFailureReason(t("Payment was cancelled by user.", "تم إلغاء الدفع من قبل المستخدم."));
        } else {
          setFailureReason(t("Payment failed. Please try again.", "فشل الدفع. يرجى المحاولة مرة أخرى."));
        }

        // Step 2: Query and update Transaction record in Firestore
        // We try multiple lookup strategies for reliability
        let transaction = null;
        
        // Strategy 1: Lookup by transactionId (if provided)
        if (trxId && user) {
          try {
            transaction = await getTransaction(trxId);
            
            // Security: Verify transaction belongs to authenticated user
            if (transaction && transaction.userId === user.uid) {
              // Edge Case: Check if already marked as failed (idempotency)
              if (transaction.paymentStatus !== "3") {
                // Update transaction status to "failed" (3)
                await updateTransactionWithPaymentData(trxId, {
                  paymentStatus: "3", // "3" = failed
                  trxReferenceNumber: trxReferenceNumber || transaction.trxReferenceNumber,
                });
                console.log("[Payment Failed] Transaction updated to failed:", trxId);
              } else {
                console.log("[Payment Failed] Transaction already marked as failed (idempotency)");
              }
              setTransactionId(trxId);
            } else if (transaction && transaction.userId !== user.uid) {
              console.warn("[Payment Failed] Security: Transaction belongs to different user");
            }
          } catch (error: any) {
            console.error("[Payment Failed] Error updating transaction:", error);
            // Continue even if transaction update fails
            // Edge Case: Transaction not found or update failed
          }
        }
        
        // Strategy 2: Fallback - Lookup by trxReferenceNumber (if transactionId not found)
        if (!transaction && trxReferenceNumber && user) {
          try {
            const { getTransactionByReference } = await import("@/firebase/firestore");
            const foundTransaction = await getTransactionByReference(trxReferenceNumber);
            
            if (foundTransaction && foundTransaction.userId === user.uid) {
              // Edge Case: Check if already marked as failed (idempotency)
              if (foundTransaction.paymentStatus !== "3") {
                await updateTransactionWithPaymentData(foundTransaction.transactionId, {
                  paymentStatus: "3", // "3" = failed
                });
                console.log("[Payment Failed] Transaction updated to failed by reference:", foundTransaction.transactionId);
              } else {
                console.log("[Payment Failed] Transaction already marked as failed (idempotency)");
              }
              setTransactionId(foundTransaction.transactionId);
            }
          } catch (error: any) {
            console.error("[Payment Failed] Error updating transaction by reference:", error);
            // Continue even if transaction update fails
            // Edge Case: Transaction not found or update failed
          }
        }

        // Note: If no transaction is found or user is not authenticated,
        // we still show the failure page. This handles cases where:
        // - User cancelled before transaction was created
        // - Transaction was created but lookup failed
        // - User is not authenticated (guest payment attempt)

        setStatus("ready");
      } catch (error: any) {
        console.error("[Payment Failed] Processing error:", error);
        setStatus("ready"); // Show page even if processing fails
        // Edge Case: Unexpected error - still show failure page to user
      }
    }

    // Process failure data
    processFailure();
  }, [searchParams, user, t]);

  return (
    <SiteLayout>
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {status === "loading" && <Loader2 className="h-5 w-5 animate-spin" />}
              {status === "ready" && <XCircle className="h-5 w-5 text-orange-600" />}
              {status === "loading"
                ? t("Processing...", "جارٍ المعالجة...")
                : t("Payment Failed or Cancelled", "فشل أو تم إلغاء الدفع")}
            </CardTitle>
            <CardDescription>
              {status === "loading"
                ? t("Updating payment status, please wait...", "جارٍ تحديث حالة الدفع، يرجى الانتظار...")
                : t("Your payment was not completed. No charges were made.", "لم يتم إتمام الدفع. لم يتم خصم أي مبالغ.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "ready" && (
              <>
                <Alert>
                  <XCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold">
                        {t("Payment Not Completed", "لم يتم إتمام الدفع")}
                      </p>
                      {failureReason && (
                        <p className="text-sm">
                          {failureReason}
                        </p>
                      )}
                      <p className="text-sm">
                        {t(
                          "No charges were made to your account. You can try again or contact support if you need assistance.",
                          "لم يتم خصم أي مبالغ من حسابك. يمكنك المحاولة مرة أخرى أو التواصل مع الدعم إذا كنت تحتاج إلى مساعدة."
                        )}
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>

                {transactionId && (
                  <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
                    <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
                      {t("Transaction ID:", "رقم المعاملة:")} {transactionId}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={() => router.push("/pricing")} className="w-full sm:w-auto">
                {t("Try Again", "المحاولة مرة أخرى")}
              </Button>
              <Button onClick={() => router.push("/dashboard")} variant="outline" className="w-full sm:w-auto">
                {t("Go to Dashboard", "الانتقال إلى لوحة التحكم")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </SiteLayout>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={
      <SiteLayout>
        <div className="container mx-auto max-w-2xl px-4 py-12">
          <Card>
            <CardContent className="py-12">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </SiteLayout>
    }>
      <PaymentFailedContent />
    </Suspense>
  );
}

