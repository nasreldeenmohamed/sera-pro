import { NextRequest, NextResponse } from "next/server";
import { activateSubscriptionFromTransaction, getUserProfile, getTransaction, type Transaction } from "@/firebase/firestore";

/**
 * Payment Activation API Route
 * 
 * Activates a user's subscription plan after successful payment.
 * 
 * Request Body:
 * - transactionId: string (required) - Transaction document ID to use for activation
 * 
 * This endpoint:
 * 1. Validates the request parameters
 * 2. Fetches transaction from Firestore
 * 3. Validates transaction payment status is "2" (success)
 * 4. Activates subscription using transaction data (atomic batched write)
 * 5. Updates user profile with:
 *    - lastTransactionId: Set to transaction.transactionId
 *    - subscription: Updated with plan details from transaction
 *    - subscriptionHistory: New entry added for audit trail
 * 6. Returns success response
 * 
 * Uses activateSubscriptionFromTransaction() which:
 * - Copies subscription details from Transaction to UserProfile
 * - Calculates subscriptionValidUntil from transaction plan duration
 * - Sets subscriptionIsActive = true (via status: "active")
 * - Uses Firestore batched writes for atomicity
 * - Adds entry to subscriptionHistory array
 * 
 * Security:
 * - Validates transaction exists and belongs to user
 * - Validates payment status is "2" (success) before activation
 * - Uses atomic batched writes to prevent race conditions
 * 
 * Error Cases:
 * - 400: Invalid request (missing transactionId)
 * - 404: Transaction not found or user profile not found
 * - 400: Transaction not successful (paymentStatus !== "2")
 * - 500: Activation failed (Firestore error, etc.)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transactionId } = body as {
      transactionId: string;
    };

    // Step 1: Validate required parameters
    // Edge Case: Missing transactionId
    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    // Step 2: Fetch transaction to validate it exists and get user details
    // Edge Case: Transaction not found
    let transaction: Transaction | null = null;
    try {
      transaction = await getTransaction(transactionId);
    } catch (error: any) {
      console.error("[Payments Activate] Error fetching transaction:", error);
      return NextResponse.json(
        { error: `Transaction not found: ${transactionId}` },
        { status: 404 }
      );
    }

    // Step 2a: Validate transaction was successfully fetched
    // Edge Case: Transaction is null or undefined
    if (!transaction) {
      return NextResponse.json(
        { error: `Transaction not found: ${transactionId}` },
        { status: 404 }
      );
    }

    // Step 3: Validate payment status indicates success
    // Edge Case: Transaction not successful (should not activate)
    if (transaction.paymentStatus !== "2") {
      return NextResponse.json(
        {
          error: `Cannot activate subscription: Transaction has status "${transaction.paymentStatus}" (expected "2" for success)`,
          code: "TRANSACTION_NOT_SUCCESSFUL",
        },
        { status: 400 }
      );
    }

    // Step 4: Verify user profile exists
    // Edge Case: User profile not found
    const userId = transaction.userId;
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found. Please complete your profile first." },
        { status: 404 }
      );
    }

    // Step 5: Activate subscription from transaction data
    // This function:
    // - Copies subscription details from Transaction to UserProfile
    // - Calculates subscriptionValidUntil from transaction plan duration
    // - Sets subscriptionIsActive = true (via status: "active")
    // - Updates lastTransactionId in user profile
    // - Adds entry to subscriptionHistory array
    // - Uses Firestore batched writes for atomicity (all updates succeed or fail together)
    try {
      await activateSubscriptionFromTransaction(transactionId);
      console.log("[Payments Activate] Subscription activated from transaction:", {
        userId,
        transactionId,
        plan: transaction.subscriptionPlanId,
      });
    } catch (error: any) {
      console.error("[Payments Activate] Error activating subscription:", error);
      
      // Edge Case: Activation failed
      // This could happen if:
      // - Transaction not found (already checked above)
      // - Transaction not successful (already checked above)
      // - User profile not found (already checked above)
      // - Firestore write failed (network error, permission error, etc.)
      // - Race condition (concurrent updates)
      return NextResponse.json(
        {
          error: error.message || "Failed to activate subscription",
          code: "ACTIVATION_FAILED",
        },
        { status: 500 }
      );
    }

    // Step 6: Return success response
    // The subscription is now active and all fields are synchronized
    return NextResponse.json({
      ok: true,
      message: "Subscription activated successfully",
      transactionId,
      userId,
      plan: transaction.subscriptionPlanId,
    });
  } catch (e: any) {
    console.error("[Payments Activate] Unexpected error:", e?.message || e);
    
    // Edge Case: Unexpected error (malformed request, network error, etc.)
    return NextResponse.json(
      {
        error: e.message || "Activation failed",
        code: "UNEXPECTED_ERROR",
      },
      { status: 500 }
    );
  }
}


