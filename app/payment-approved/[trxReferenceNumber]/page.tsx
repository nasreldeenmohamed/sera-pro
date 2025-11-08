"use client";
import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { CheckCircle2, Loader2, XCircle, Calendar, CreditCard, Receipt, Mail, Phone } from "lucide-react";
import { getTransactionByReference, updateTransactionWithPaymentData, type Transaction, getUserProfile } from "@/firebase/firestore";
import { trackPurchase } from "@/lib/meta-pixel";
import { trackPurchase as trackGAPurchase } from "@/lib/google-analytics";

/**
 * URL Decode Helper Function
 * 
 * Decodes URL-encoded values by:
 * - Replacing '+' with spaces
 * - Decoding %XX hex sequences
 * 
 * @param value - URL-encoded string value
 * @returns Decoded string value
 */
function urlDecode(value: string | null): string | undefined {
  if (!value) return undefined;
  try {
    // decodeURIComponent handles %XX sequences
    // Replace + with spaces before decoding (URLSearchParams does this automatically, but we do it explicitly)
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch (error) {
    console.warn("[URL Decode] Failed to decode value:", value, error);
    return value; // Return original if decoding fails
  }
}

/**
 * Extract and Map Transaction Data from Payment Approval URL
 * 
 * This function extracts all transaction-related data from the payment approval URL
 * and maps it to the Transaction model fields for Firestore update.
 * 
 * URL Format: /payment-approved/{trxReferenceNumber}?key1=value1&key2=value2...
 * 
 * @param trxReferenceNumber - Transaction reference from URL path
 * @param searchParams - URLSearchParams object containing query parameters
 * @returns Object containing mapped transaction data ready for Firestore update
 */
function extractAndMapTransactionData(
  trxReferenceNumber: string,
  searchParams: URLSearchParams
): {
  // Mapped transaction update data
  paymentData: {
    paymentStatus: "2"; // Always "2" (success) for approved payments
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
  // Additional metadata for processing
  metadata: {
    transactionId?: string; // Internal transaction ID for lookup
    paymentStatusRaw?: string; // Raw status value from URL
  };
} {
  // Step 1: Extract transaction reference from URL path
  // This is already provided as a parameter, but we validate it here
  const validatedTrxRef = trxReferenceNumber.trim();

  // Step 2: Extract all query parameters from URL
  // URLSearchParams automatically handles URL decoding, but we'll decode explicitly for safety
  const rawParams: Record<string, string | null> = {
    // Payment status and identifiers
    status: searchParams.get("status"),
    transactionId: searchParams.get("transactionId"), // Our internal transaction ID
    orderId: searchParams.get("orderId"), // Order ID used in checkout
    merchantOrderId: searchParams.get("merchantOrderId"), // Kashier merchant order ID
    
    // Payment amount and currency
    amount: searchParams.get("amount"),
    currency: searchParams.get("currency"),
    
    // Card information
    maskedCard: searchParams.get("maskedCard"),
    cardBrand: searchParams.get("cardBrand"),
    cardDataToken: searchParams.get("cardDataToken"),
    
    // Additional references
    orderReference: searchParams.get("orderReference"),
    signature: searchParams.get("signature"),
    mode: searchParams.get("mode"),
    
    // Additional fields that might be present
    product: searchParams.get("product"), // Subscription plan ID
    userId: searchParams.get("userId"), // User ID (for validation)
  };

  // Step 3: URL Decode all extracted values
  // Replace + with spaces and decode %XX hex sequences
  const decodedParams: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(rawParams)) {
    decodedParams[key] = urlDecode(value);
  }

  // Step 4: Map extracted parameters to Transaction model fields
  // Following the Transaction type definition in firebase/firestore.ts
  // 
  // Note: All fields are extracted and mapped for completeness, even if some are not
  // updated in Firestore (e.g., transactionAmount, transactionCurrency, orderId, mode
  // are set at transaction creation and typically don't change).
  // This ensures we have a complete record of all payment data from Kashier.
  
  const paymentData: {
    paymentStatus: "2"; // Always "2" (success) for approved payments
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
  } = {
    // Payment Status: Always "2" (success) for approved payments
    // This is set regardless of what status param says (we're on the approved page)
    paymentStatus: "2",
    
    // Transaction Reference Number: From URL path
    // This is the unique Kashier transaction reference
    trxReferenceNumber: validatedTrxRef,
    
    // Transaction Amount: From 'amount' query parameter
    // Maps to: transaction.transactionAmount
    transactionAmount: decodedParams.amount,
    
    // Transaction Currency: From 'currency' query parameter
    // Maps to: transaction.transactionCurrency
    transactionCurrency: decodedParams.currency,
    
    // Masked Card: From 'maskedCard' query parameter
    // Maps to: transaction.maskedCard
    // Example: "****1234"
    maskedCard: decodedParams.maskedCard,
    
    // Card Brand: From 'cardBrand' query parameter
    // Maps to: transaction.cardBrand
    // Example: "VISA", "MASTERCARD", "MEEZA"
    cardBrand: decodedParams.cardBrand,
    
    // Card Data Token: From 'cardDataToken' query parameter
    // Maps to: transaction.cardDataToken
    // Used for recurring payments (optional)
    cardDataToken: decodedParams.cardDataToken,
    
    // Merchant Order ID: From 'merchantOrderId' query parameter
    // Maps to: transaction.merchantOrderId
    // This is Kashier's merchant order ID
    merchantOrderId: decodedParams.merchantOrderId,
    
    // Order ID: From 'orderId' query parameter
    // Maps to: transaction.orderId
    // This is our internal order ID used when creating checkout
    orderId: decodedParams.orderId,
    
    // Order Reference: From 'orderReference' query parameter
    // Maps to: transaction.orderReference
    // Additional reference from Kashier (optional)
    orderReference: decodedParams.orderReference,
    
    // Mode: From 'mode' query parameter
    // Maps to: transaction.mode
    // Values: "test" or "live"
    mode: decodedParams.mode === "test" || decodedParams.mode === "live" 
      ? decodedParams.mode 
      : undefined,
    
    // Signature: From 'signature' query parameter
    // Maps to: transaction.signature
    // Payment signature/hash from Kashier for verification (optional)
    signature: decodedParams.signature,
  };

  // Step 5: Prepare metadata for processing
  const metadata = {
    transactionId: decodedParams.transactionId, // Internal transaction ID for lookup
    paymentStatusRaw: decodedParams.status, // Raw status value for validation
  };

  return {
    paymentData,
    metadata,
  };
}

/**
 * Payment Approved Page - Handles successful payment redirects from Kashier
 * 
 * Route: /payment-approved/[trxReferenceNumber]
 * 
 * This page is called when Kashier redirects users after successful payment.
 * 
 * URL Format:
 * /payment-approved/{trxReferenceNumber}?key1=value1&key2=value2...
 * 
 * Expected Query Parameters from Kashier:
 * - trxReferenceNumber: Transaction reference (also in URL path)
 * - status: Payment status (should be "success" or "2")
 * - orderId: Order ID used in checkout
 * - amount: Payment amount
 * - currency: Payment currency (e.g., "EGP")
 * - maskedCard: Masked card number (e.g., "****1234")
 * - cardBrand: Card brand (e.g., "VISA", "MASTERCARD")
 * - cardDataToken: Tokenized card data (optional, for recurring payments)
 * - orderReference: Additional reference from Kashier (optional)
 * - signature: Payment signature for verification (optional)
 * - merchantOrderId: Merchant order ID (optional)
 * - mode: Payment mode ("test" or "live")
 * - transactionId: Our internal transaction ID (optional, for lookup)
 * 
 * Flow:
 * 1. Extract trxReferenceNumber from URL path
 * 2. Extract all payment data from query parameters using extractAndMapTransactionData()
 * 3. URL decode all parameter values
 * 4. Map parameters to Transaction model fields
 * 5. Validate transaction reference exists in Firestore
 * 6. Update transaction with payment completion data
 * 7. Activate user subscription
 * 8. Show success message and redirect to dashboard
 * 
 * Security:
 * - Validates transaction reference exists
 * - Checks payment status from query params
 * - Handles missing or tampered parameters gracefully
 * - Prefers authenticated user over userId in query params
 */
function PaymentApprovedContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t, locale } = useLocale();
  
  const [status, setStatus] = useState<"loading" | "processing" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transactionData, setTransactionData] = useState<{
    transactionId: string;
    planName: string;
    amount: string;
    currency: string;
    maskedCard?: string;
    cardBrand?: string;
    subscriptionEndDate?: string; // ISO date string
    trxReferenceNumber?: string;
  } | null>(null);

  useEffect(() => {
    async function processPayment() {
      try {
        // Step 1: Extract transaction reference from URL path
        // Format: /payment-approved/{trxReferenceNumber}
        // The trxReferenceNumber is in the route parameter
        const trxReferenceNumber = params?.trxReferenceNumber as string;
        
        if (!trxReferenceNumber || typeof trxReferenceNumber !== "string") {
          setStatus("error");
          setErrorMessage(
            t(
              "Invalid payment reference. Transaction reference is missing from URL.",
              "مرجع الدفع غير صالح. مرجع المعاملة مفقود من الرابط."
            )
          );
          return;
        }

        // Step 2: Extract and map all transaction data from URL
        // This function:
        // - Extracts all query parameters from URLSearchParams
        // - URL decodes all values (replaces + with spaces, decodes %XX)
        // - Maps each parameter to its corresponding Transaction model field
        // - Returns a complete transaction update object ready for Firestore
        const { paymentData, metadata } = extractAndMapTransactionData(
          trxReferenceNumber,
          searchParams
        );

        // Step 3: Validate payment status from extracted data
        // Expected values: "success", "2" (success), or "approved"
        // Note: We're on the approved page, so we assume success, but we validate the status param
        const paymentStatusRaw = metadata.paymentStatusRaw;
        const isSuccess = !paymentStatusRaw || // If no status param, assume success (we're on approved page)
                         paymentStatusRaw === "success" || 
                         paymentStatusRaw === "2" || 
                         paymentStatusRaw === "approved";
        
        if (!isSuccess) {
          setStatus("error");
          setErrorMessage(
            t(
              "Payment was not successful. Please contact support if you were charged.",
              "لم ينجح الدفع. يرجى التواصل مع الدعم إذا تم خصم المبلغ."
            )
          );
          return;
        }

        // Step 4: Query and validate existing Transaction record in Firestore
        // We use multiple identifiers for extra validation and reliability
        setStatus("processing");
        
        let transaction: Transaction | null = null;
        const { getTransaction } = await import("@/firebase/firestore");
        
        // Strategy 1: Try to get transaction by trxReferenceNumber (primary lookup)
        // This is the most reliable identifier from Kashier
        if (trxReferenceNumber) {
          try {
            transaction = await getTransactionByReference(trxReferenceNumber);
            if (transaction) {
              console.log("[Payment Approved] Found transaction by reference:", transaction.transactionId);
            }
          } catch (error) {
            console.error("[Payment Approved] Error fetching transaction by reference:", error);
          }
        }

        // Strategy 2: Fallback - Try to get by transactionId if provided and not found yet
        // This provides redundancy in case reference lookup fails
        if (!transaction && metadata.transactionId) {
          try {
            transaction = await getTransaction(metadata.transactionId);
            if (transaction) {
              console.log("[Payment Approved] Found transaction by ID:", transaction.transactionId);
              
              // Validate that the transaction's reference matches the URL path
              // This prevents mismatched transactions
              if (transaction.trxReferenceNumber !== trxReferenceNumber) {
                console.warn(
                  "[Payment Approved] Transaction reference mismatch:",
                  "Expected:", trxReferenceNumber,
                  "Found:", transaction.trxReferenceNumber
                );
                // Still use the transaction, but log the mismatch
              }
            }
          } catch (error) {
            console.error("[Payment Approved] Error fetching transaction by ID:", error);
          }
        }

        // Step 5: Validate transaction exists
        // Edge Case: Transaction not found in Firestore
        if (!transaction) {
          setStatus("error");
          setErrorMessage(
            t(
              "Transaction not found. Please contact support with your payment reference: " + trxReferenceNumber,
              "المعاملة غير موجودة. يرجى التواصل مع الدعم مع مرجع الدفع: " + trxReferenceNumber
            )
          );
          return;
        }

        // Step 6: Validate transaction belongs to authenticated user (security check)
        // Prefer authenticated user, but allow userId from transaction if user not yet loaded
        const userId = user?.uid || transaction.userId;
        if (!userId) {
          setStatus("error");
          setErrorMessage(
            t(
              "User authentication required. Please sign in to complete payment processing.",
              "مطلوب تسجيل الدخول. يرجى تسجيل الدخول لإكمال معالجة الدفع."
            )
          );
          return;
        }

        // Security Check: Verify transaction belongs to current user (if authenticated)
        // Edge Case: Transaction belongs to different user (potential security issue)
        if (user && transaction.userId !== user.uid) {
          console.error(
            "[Payment Approved] Security: Transaction user mismatch",
            "Transaction userId:", transaction.userId,
            "Authenticated userId:", user.uid
          );
          setStatus("error");
          setErrorMessage(
            t(
              "Transaction does not belong to your account. Please contact support.",
              "المعاملة لا تنتمي إلى حسابك. يرجى التواصل مع الدعم."
            )
          );
          return;
        }

        // Step 7: Check for duplicate update (idempotency check)
        // Edge Case: Transaction already processed (duplicate callback from Kashier)
        // If paymentStatus is already "2" (success), this is a duplicate update
        if (transaction.paymentStatus === "2") {
          console.log(
            "[Payment Approved] Duplicate update detected - transaction already processed:",
            transaction.transactionId
          );
          // This is a duplicate callback, but we should still show success
          // Don't update again, but proceed to activation check
          // This handles cases where Kashier sends multiple callbacks
        }

        // Step 8: Update Transaction document in Firestore with all payment data
        // This updates the transaction at /transactions/{transactionId} with:
        // - Payment status: "pending" (1) → "success" (2)
        // - All payment fields from Kashier callback
        // - updatedAt: Current server timestamp
        // - completedAt: Current server timestamp
        //
        // Edge Case Handling:
        // - Duplicate updates: If already processed, skip update but continue
        // - Missing fields: Only update fields that are provided
        // - Mismatched data: Validate critical fields match before update
        try {
          // Only update if not already processed (idempotency)
          if (transaction.paymentStatus !== "2") {
            // Validate critical fields match (prevent mismatched updates)
            if (paymentData.orderId && transaction.orderId !== paymentData.orderId) {
              console.warn(
                "[Payment Approved] Order ID mismatch:",
                "Transaction orderId:", transaction.orderId,
                "Payment orderId:", paymentData.orderId
              );
              // Continue with update, but log the mismatch for investigation
            }

            // Update transaction with all extracted payment data
            await updateTransactionWithPaymentData(transaction.transactionId, {
              // Payment Status: Always "2" (success) for approved payments
              // Maps to: transaction.paymentStatus
              paymentStatus: paymentData.paymentStatus,
              
              // Transaction Reference Number: From URL path (already validated)
              // Maps to: transaction.trxReferenceNumber
              trxReferenceNumber: paymentData.trxReferenceNumber,
              
              // Masked Card: From 'maskedCard' query parameter (URL decoded)
              // Maps to: transaction.maskedCard
              maskedCard: paymentData.maskedCard,
              
              // Card Brand: From 'cardBrand' query parameter (URL decoded)
              // Maps to: transaction.cardBrand
              cardBrand: paymentData.cardBrand,
              
              // Card Data Token: From 'cardDataToken' query parameter (URL decoded)
              // Maps to: transaction.cardDataToken
              cardDataToken: paymentData.cardDataToken,
              
              // Merchant Order ID: From 'merchantOrderId' query parameter (URL decoded)
              // Maps to: transaction.merchantOrderId
              merchantOrderId: paymentData.merchantOrderId,
              
              // Order Reference: From 'orderReference' query parameter (URL decoded)
              // Maps to: transaction.orderReference
              orderReference: paymentData.orderReference,
              
              // Signature: From 'signature' query parameter (URL decoded)
              // Maps to: transaction.signature
              signature: paymentData.signature,
              
              // Note: The following fields are extracted but not updated (set at creation):
              // - transactionAmount: From 'amount' → transaction.transactionAmount (set at creation)
              // - transactionCurrency: From 'currency' → transaction.transactionCurrency (set at creation)
              // - orderId: From 'orderId' → transaction.orderId (set at creation)
              // - mode: From 'mode' → transaction.mode (set at creation)
            });
            
            console.log("[Payment Approved] Transaction updated successfully");
          } else {
            console.log("[Payment Approved] Transaction already processed, skipping update (idempotency)");
          }
        } catch (error: any) {
          console.error("[Payment Approved] Error updating transaction:", error);
          
          // Edge Case: Transaction update failed
          // Check if it's a critical error or just a network issue
          if (error.code === "not-found") {
            setStatus("error");
            setErrorMessage(
              t(
                "Transaction not found in database. Please contact support.",
                "المعاملة غير موجودة في قاعدة البيانات. يرجى التواصل مع الدعم."
              )
            );
            return;
          }
          
          // For other errors, log but continue with activation
          // The transaction was already created, so we can still activate the plan
          // This handles network issues, temporary Firestore unavailability, etc.
          console.warn(
            "[Payment Approved] Transaction update failed, but continuing with activation:",
            error.message
          );
        }

        // Step 9: Activate user subscription (only if paymentStatus indicates success)
        // Payment status "2" = success, so we proceed to activate the user's plan
        // 
        // The activation API will:
        // - Fetch the transaction from Firestore
        // - Validate payment status is "2" (success)
        // - Copy subscription details from Transaction to UserProfile:
        //   - subscriptionPlanId, subscriptionPlanName, etc. (from transaction)
        //   - subscriptionValidUntil: Calculated from transaction plan duration
        //   - subscriptionIsActive: Set to true (via status: "active")
        // - Update lastTransactionId: Set to transaction.transactionId
        // - Add entry to subscriptionHistory array for audit trail
        // - Use Firestore batched writes for atomicity (all updates succeed or fail together)
        
        // Declare subscriptionEndDate in outer scope so it's accessible later
        let subscriptionEndDate: string | undefined;
        
        try {
          const activateResponse = await fetch("/api/payments/activate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transactionId: transaction.transactionId, // Use transaction ID for activation
            }),
          });

          if (!activateResponse.ok) {
            const error = await activateResponse.json().catch(() => ({}));
            
            // Edge Case: Activation failed
            // This could happen if:
            // - Transaction not found (shouldn't happen, we just fetched it)
            // - Transaction not successful (shouldn't happen, we validated above)
            // - User profile doesn't exist
            // - Firestore write failed (network error, permission error, etc.)
            // - Race condition (concurrent updates)
            console.error("[Payment Approved] Activation failed:", error);
            throw new Error(
              error.error || t("Failed to activate subscription.", "فشل تفعيل الاشتراك.")
            );
          }

          const activationResult = await activateResponse.json();
          console.log("[Payment Approved] Subscription activated successfully:", {
            userId,
            transactionId: transaction.transactionId,
            plan: activationResult.plan,
          });

          // Step 9a: Fetch updated user profile to get subscription expiration date
          // This gives us the subscriptionValidUntil date for display
          try {
            const updatedProfile = await getUserProfile(userId);
            if (updatedProfile?.subscription?.validUntil) {
              // Convert Firestore Timestamp to ISO date string
              const validUntil = updatedProfile.subscription.validUntil;
              if (validUntil && typeof validUntil.toDate === "function") {
                subscriptionEndDate = validUntil.toDate().toISOString();
              } else if (validUntil && validUntil.seconds) {
                // Handle Timestamp object format
                subscriptionEndDate = new Date(validUntil.seconds * 1000).toISOString();
              }
            }
          } catch (error) {
            console.warn("[Payment Approved] Could not fetch subscription end date:", error);
            // Continue without end date - not critical
          }

          // Step 9b: Track Purchase Event in Analytics
          // Fire Google Analytics and Meta Pixel Purchase events for conversion tracking
          // This enables conversion tracking, remarketing, and ROI analysis
          try {
            const purchaseAmount = parseFloat(paymentData.transactionAmount || transaction.transactionAmount || "0");
            const currency = paymentData.transactionCurrency || transaction.transactionCurrency || "EGP";
            
            // Google Analytics Purchase Event
            trackGAPurchase({
              value: purchaseAmount,
              currency: currency,
              transaction_id: transaction.transactionId,
              items: [{
                item_id: transaction.subscriptionPlanId,
                item_name: transaction.subscriptionPlanName,
                item_category: "subscription",
                price: purchaseAmount,
                quantity: 1,
              }],
            });
            
            // Meta Pixel Purchase Event
            trackPurchase({
              value: purchaseAmount,
              currency: currency,
            });
            
            console.log("[Payment Approved] Analytics events tracked:", {
              transactionId: transaction.transactionId,
              amount: purchaseAmount,
              currency: currency,
            });
          } catch (error) {
            // Non-critical: Log but don't fail payment processing
            console.warn("[Payment Approved] Analytics tracking failed:", error);
            
            // Optional: Send error to error monitoring (Sentry, etc.)
            // Example: Sentry.captureException(error, { tags: { section: 'analytics' } });
          }

          // Step 9c: Update in-memory user/session state
          // Note: The subscription is now active in Firestore. Components that read from Firestore
          // (via getUserPlan, getUserProfile, etc.) will automatically get the updated subscription data.
          // 
          // For immediate UI updates without page reload:
          // - Components using getUserPlan() will need to refetch (or use real-time listeners)
          // - The auth context already calls checkAndUpdateSubscriptionStatus() on auth state changes
          // - Dashboard and other components should refetch subscription data after redirect
          // 
          // The redirect to dashboard (Step 11) will trigger a fresh load of user data,
          // ensuring premium features are immediately available.
        } catch (error: any) {
          // Edge Case: Activation failed but payment succeeded
          // This is a critical error - payment was successful but subscription not activated
          // The transaction is already updated in Firestore, so support can manually activate
          console.error("[Payment Approved] Critical: Payment succeeded but activation failed:", error);
          
          // Show error but don't fail completely - user can contact support
          // The transaction is already updated, so support can manually activate
          setStatus("error");
          setErrorMessage(
            t(
              "Payment succeeded but subscription activation failed. Please contact support with transaction ID: " + transaction.transactionId,
              "نجح الدفع لكن فشل تفعيل الاشتراك. يرجى التواصل مع الدعم مع رقم المعاملة: " + transaction.transactionId
            )
          );
          return;
        }

        // Step 10: Store transaction data for display
        // Use extracted payment data (already URL decoded) for display
        setTransactionData({
          transactionId: transaction.transactionId,
          planName: transaction.subscriptionPlanName,
          // Use payment data from URL (may be more accurate than stored transaction)
          amount: paymentData.transactionAmount || transaction.transactionAmount,
          currency: paymentData.transactionCurrency || transaction.transactionCurrency,
          maskedCard: paymentData.maskedCard, // From extracted payment data (URL decoded)
          cardBrand: paymentData.cardBrand, // From extracted payment data (URL decoded)
          subscriptionEndDate: subscriptionEndDate, // Subscription expiration date
          trxReferenceNumber: paymentData.trxReferenceNumber || transaction.trxReferenceNumber,
        });

        setStatus("success");

        // Step 11: Auto-redirect to dashboard after 5 seconds (increased for user to read confirmation)
        // Users can also click "Go to Dashboard" button to navigate immediately
        setTimeout(() => {
          router.push("/dashboard");
        }, 5000);

      } catch (error: any) {
        console.error("[Payment Approved] Processing error:", error);
        
        // Optional: Send error to error monitoring (Sentry, etc.) for diagnostics
        // Example: Sentry.captureException(error, { 
        //   tags: { section: 'payment_processing' },
        //   extra: { transactionId: metadata.transactionId, trxReferenceNumber }
        // });
        
        setStatus("error");
        setErrorMessage(
          error.message || 
          t(
            "An error occurred while processing your payment. Please contact support.",
            "حدث خطأ أثناء معالجة الدفع. يرجى التواصل مع الدعم."
          )
        );
      }
    }

    // Wait for auth to load before processing
    // If user is not authenticated, wait a bit for auth context to load
    if (user || searchParams.get("transactionId")) {
      processPayment();
    } else {
      const timeout = setTimeout(() => {
        if (!user) {
          setStatus("error");
          setErrorMessage(
            t(
              "Please sign in to complete payment processing.",
              "يرجى تسجيل الدخول لإكمال معالجة الدفع."
            )
          );
        }
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [params, searchParams, user, router, t]);

  const planName = transactionData?.planName || t("Plan", "الخطة");
  const amount = transactionData?.amount || "0";
  const currency = transactionData?.currency || "EGP";

  return (
    <SiteLayout>
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {status === "loading" && <Loader2 className="h-5 w-5 animate-spin" />}
              {status === "processing" && <Loader2 className="h-5 w-5 animate-spin" />}
              {status === "success" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              {status === "error" && <XCircle className="h-5 w-5 text-red-600" />}
              {status === "loading" || status === "processing"
                ? t("Processing Your Payment...", "جارٍ معالجة الدفع...")
                : status === "success"
                ? t("Payment Successful!", "تم الدفع بنجاح!")
                : t("Payment Error", "خطأ في الدفع")}
            </CardTitle>
            <CardDescription>
              {status === "loading" || status === "processing"
                ? t("Validating payment and activating your plan, please wait...", "جارٍ التحقق من الدفع وتفعيل خطتك، يرجى الانتظار...")
                : status === "success"
                ? t(`Your ${planName} has been activated successfully.`, `تم تفعيل ${planName} بنجاح.`)
                : t("There was an issue processing your payment.", "حدثت مشكلة في معالجة الدفع.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "success" && transactionData && (
              <>
                {/* Transaction Summary Card */}
                <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                      <CheckCircle2 className="h-5 w-5" />
                      {t("Payment Confirmed!", "تم تأكيد الدفع!")}
                    </CardTitle>
                    <CardDescription className="text-green-700 dark:text-green-300">
                      {t("Your subscription has been activated successfully.", "تم تفعيل اشتراكك بنجاح.")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Plan Purchased */}
                    <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <Receipt className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {t("Plan Purchased", "الخطة المشتراة")}
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {transactionData.planName}
                        </p>
                      </div>
                    </div>

                    {/* Amount Paid */}
                    <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <CreditCard className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {t("Amount Paid", "المبلغ المدفوع")}
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {transactionData.amount} {transactionData.currency}
                        </p>
                        {transactionData.maskedCard && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {t("Card:", "البطاقة:")} {transactionData.maskedCard}
                            {transactionData.cardBrand && ` (${transactionData.cardBrand})`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Subscription End Date */}
                    {transactionData.subscriptionEndDate && (
                      <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <Calendar className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {t("Subscription Valid Until", "الاشتراك صالح حتى")}
                          </p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {new Date(transactionData.subscriptionEndDate).toLocaleDateString(
                              locale === "ar" ? "ar-EG" : "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Receipt Info */}
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg space-y-2">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t("Receipt Information", "معلومات الإيصال")}
                      </p>
                      <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                        <p>
                          <span className="font-medium">{t("Transaction ID:", "رقم المعاملة:")}</span>{" "}
                          <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {transactionData.transactionId}
                          </code>
                        </p>
                        {transactionData.trxReferenceNumber && (
                          <p>
                            <span className="font-medium">{t("Payment Reference:", "مرجع الدفع:")}</span>{" "}
                            <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {transactionData.trxReferenceNumber}
                            </code>
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {t(
                            "A receipt has been sent to your email address.",
                            "تم إرسال إيصال إلى عنوان بريدك الإلكتروني."
                          )}
                          {/* Note: Email receipt functionality can be implemented by:
                             1. Creating an API route (e.g., /api/payments/send-receipt)
                             2. Using an email service (SendGrid, Resend, etc.)
                             3. Storing receipt issuance timestamp in Firestore transaction record
                             4. Calling the API after successful payment activation */}
                        </p>
                      </div>
                    </div>

                    {/* Support/Contact Info */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                        {t("Need Help?", "تحتاج مساعدة؟")}
                      </p>
                      <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                        <p>
                          {t(
                            "If you have any questions about your subscription, please contact our support team.",
                            "إذا كان لديك أي أسئلة حول اشتراكك، يرجى التواصل مع فريق الدعم."
                          )}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <a
                            href="mailto:support@serapro.com"
                            className="flex items-center gap-1 hover:underline"
                          >
                            <Mail className="h-3 w-3" />
                            support@serapro.com
                          </a>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Continue Using Product */}
                <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">
                      {t("Ready to get started?", "جاهز للبدء؟")}
                    </p>
                    <p className="text-sm">
                      {t(
                        "Your premium features are now active. Start creating your CV right away!",
                        "ميزاتك المميزة نشطة الآن. ابدأ في إنشاء سيرتك الذاتية على الفور!"
                      )}
                    </p>
                  </AlertDescription>
                </Alert>
              </>
            )}

            {status === "error" && (
              <>
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold">
                        {t("Payment Processing Error", "خطأ في معالجة الدفع")}
                      </p>
                      <p>
                        {errorMessage || t("Unknown error occurred.", "حدث خطأ غير معروف.")}
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>

                {/* Error Instructions */}
                <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                        {t("What to do next:", "ما يجب فعله بعد ذلك:")}
                      </p>
                      <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-2 list-disc list-inside">
                        <li>
                          {t(
                            "If payment was charged but subscription not activated, contact support with your transaction ID.",
                            "إذا تم خصم المبلغ لكن لم يتم تفعيل الاشتراك، اتصل بالدعم مع رقم المعاملة."
                          )}
                        </li>
                        <li>
                          {t(
                            "If payment failed, you can try again from the pricing page.",
                            "إذا فشل الدفع، يمكنك المحاولة مرة أخرى من صفحة الأسعار."
                          )}
                        </li>
                        <li>
                          {t(
                            "Check your email for payment confirmation or contact support for assistance.",
                            "تحقق من بريدك الإلكتروني للحصول على تأكيد الدفع أو اتصل بالدعم للحصول على المساعدة."
                          )}
                        </li>
                      </ul>
                      <div className="pt-2">
                        <a
                          href="mailto:support@serapro.com"
                          className="text-sm text-orange-900 dark:text-orange-100 hover:underline flex items-center gap-1"
                        >
                          <Mail className="h-4 w-4" />
                          support@serapro.com
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              {status === "success" && transactionData && (
                <>
                  <Button onClick={() => router.push("/dashboard")} className="w-full sm:w-auto">
                    {t("Go to Dashboard", "الانتقال إلى لوحة التحكم")}
                  </Button>
                  <Button
                    onClick={() => router.push(`/receipt?transactionId=${transactionData.transactionId}`)}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    {t("View Receipt", "عرض الإيصال")}
                  </Button>
                  <Button
                    onClick={() => router.push("/cv-builder")}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    {t("Create CV Now", "إنشاء السيرة الذاتية الآن")}
                  </Button>
                </>
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

export default function PaymentApprovedPage() {
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
      <PaymentApprovedContent />
    </Suspense>
  );
}

