import { NextRequest, NextResponse } from "next/server";
import { getTransaction } from "@/firebase/firestore";

/**
 * Check Transaction Status API Route
 * 
 * This endpoint checks the status of a transaction in Firestore.
 * Used by the payment process page to poll for payment completion.
 * 
 * Query Parameters:
 * - transactionId: Firestore transaction document ID (required)
 * 
 * Returns: {
 *   transactionId: string;
 *   paymentStatus: "1" | "2" | "3" | string;  // "1" = pending, "2" = success, "3" = failed
 *   subscriptionPlanId?: string;
 *   transactionAmount?: string;
 * }
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get("transactionId");

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required." },
        { status: 400 }
      );
    }

    // Get transaction from Firestore
    const transaction = await getTransaction(transactionId);

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found." },
        { status: 404 }
      );
    }

    // Return transaction status
    return NextResponse.json({
      transactionId: transaction.transactionId,
      paymentStatus: transaction.paymentStatus,
      subscriptionPlanId: transaction.subscriptionPlanId,
      transactionAmount: transaction.transactionAmount,
      transactionCurrency: transaction.transactionCurrency,
    });
  } catch (error: any) {
    console.error("[Check Status API] Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to check transaction status.",
      },
      { status: 500 }
    );
  }
}

