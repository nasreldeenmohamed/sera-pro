import { NextRequest, NextResponse } from "next/server";
import { getTransactionByReference, updateTransactionWithPaymentData, activateSubscriptionFromTransaction } from "@/firebase/firestore";

/**
 * Process Payment Success API Route
 * 
 * This endpoint is called when payment is successfully completed in the webview.
 * It:
 * 1. Extracts transaction data from the success URL
 * 2. Updates the Firestore transaction with payment completion data
 * 3. Activates the user's subscription
 * 
 * Request Body:
 * {
 *   trxReferenceNumber: string;  // From URL path
 *   paymentData: {
 *     paymentStatus: string;
 *     transactionId?: string;
 *     merchantOrderId?: string;
 *     orderId?: string;
 *     orderReference?: string;
 *     amount?: string;
 *     currency?: string;
 *     maskedCard?: string;
 *     cardBrand?: string;
 *     cardDataToken?: string;
 *     mode?: string;
 *     signature?: string;
 *   };
 *   successUrl: string;  // Full success URL for reference
 * }
 * 
 * Returns: { success: true, transactionId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { trxReferenceNumber, paymentData, successUrl } = body;

    // Validate required fields
    if (!trxReferenceNumber) {
      return NextResponse.json(
        { error: "Transaction reference number is required." },
        { status: 400 }
      );
    }

    if (!paymentData || paymentData.paymentStatus !== "SUCCESS") {
      return NextResponse.json(
        { error: "Payment status must be SUCCESS." },
        { status: 400 }
      );
    }

    // Find transaction by reference number
    let transaction = await getTransactionByReference(trxReferenceNumber);
    
    // If not found by reference, try by transactionId
    if (!transaction && paymentData.transactionId) {
      const { getTransaction } = await import("@/firebase/firestore");
      transaction = await getTransaction(paymentData.transactionId);
    }

    if (!transaction) {
      console.error("[Process Success API] Transaction not found:", {
        trxReferenceNumber,
        transactionId: paymentData.transactionId,
      });
      return NextResponse.json(
        { error: "Transaction not found." },
        { status: 404 }
      );
    }

    // Check if already processed (idempotency)
    if (transaction.paymentStatus === "2") {
      console.log("[Process Success API] Transaction already processed:", transaction.id);
      return NextResponse.json({
        success: true,
        transactionId: transaction.id,
        message: "Transaction already processed.",
      });
    }

    // Map payment data to transaction update format
    const updateData = {
      paymentStatus: "2" as const, // Success
      trxReferenceNumber: trxReferenceNumber,
      transactionAmount: paymentData.amount,
      transactionCurrency: paymentData.currency,
      maskedCard: paymentData.maskedCard,
      cardBrand: paymentData.cardBrand,
      cardDataToken: paymentData.cardDataToken,
      merchantOrderId: paymentData.merchantOrderId,
      orderId: paymentData.orderId || transaction.orderId,
      orderReference: paymentData.orderReference,
      mode: paymentData.mode as "test" | "live" | undefined,
      signature: paymentData.signature,
    };

    // Update transaction with payment data
    await updateTransactionWithPaymentData(transaction.id, updateData);

    // Activate subscription
    await activateSubscriptionFromTransaction(transaction.id);

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
    });
  } catch (error: any) {
    console.error("[Process Success API] Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to process payment success.",
      },
      { status: 500 }
    );
  }
}

