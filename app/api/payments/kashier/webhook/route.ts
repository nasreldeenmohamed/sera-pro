import { NextRequest, NextResponse } from "next/server";
import { getTransactionByReference, getTransactionByOrderId, updateTransactionWithPaymentData } from "@/firebase/firestore";
import { activateSubscriptionFromTransaction } from "@/firebase/firestore";
import { getPaymentCredentials } from "@/payments/kashier";
import crypto from "crypto";

/**
 * Kashier Webhook Endpoint
 * 
 * Receives payment notifications from Kashier when payment is completed.
 * This is called server-to-server by Kashier, not by the user's browser.
 * 
 * Security:
 * - Validates webhook signature from Kashier
 * - Validates transaction exists
 * - Checks for duplicate processing (idempotency)
 * 
 * Webhook Configuration:
 * Set data-serverWebhook in the iframe configuration to point to this endpoint.
 */
export async function POST(req: NextRequest) {
  try {
    // Get webhook payload from Kashier
    const body = await req.json();
    
    console.log("[Kashier Webhook] Received webhook:", JSON.stringify(body, null, 2));
    
    // Extract payment data
    const {
      paymentStatus, // "SUCCESS" or "FAILURE"
      orderId, // Kashier's order ID
      merchantOrderId, // Your order ID
      amount,
      currency,
      maskedCard,
      cardBrand,
      cardDataToken,
      orderReference,
      signature,
      mode, // "test" or "live"
      transactionId: kashierTransactionId,
    } = body;

    // Validate signature
    if (signature && mode) {
      try {
        const { secretKey } = getPaymentCredentials(mode as "test" | "live");
        
        // Build query string from body (excluding signature and mode)
        let queryString = "";
        for (const key in body) {
          if (key === "signature" || key === "mode") {
            continue;
          }
          queryString += `&${key}=${body[key]}`;
        }
        const finalUrl = queryString.substring(1);
        
        // Generate expected signature
        const crypto = require("crypto");
        const expectedSignature = crypto
          .createHmac("sha256", secretKey)
          .update(finalUrl)
          .digest("hex");
        
        if (expectedSignature !== signature) {
          console.error("[Kashier Webhook] Invalid signature");
          return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }
      } catch (sigError) {
        console.error("[Kashier Webhook] Signature validation error:", sigError);
        return NextResponse.json({ error: "Signature validation failed" }, { status: 401 });
      }
    }

    if (!merchantOrderId) {
      return NextResponse.json(
        { error: "Merchant order ID is required" },
        { status: 400 }
      );
    }

    // Find transaction by orderId (merchantOrderId)
    // Webhook provides merchantOrderId which is our orderId
    const transaction = await getTransactionByOrderId(merchantOrderId);
    
    if (!transaction) {
      console.error("[Kashier Webhook] Transaction not found for orderId:", merchantOrderId);
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Check if already processed
    if (transaction.paymentStatus === "2" || transaction.paymentStatus === "3") {
      console.log("[Kashier Webhook] Transaction already processed:", transaction.transactionId);
      return NextResponse.json({
        ok: true,
        message: "Transaction already processed",
        transactionId: transaction.transactionId,
      });
    }

    // Map payment status
    const firestoreStatus: "2" | "3" = 
      paymentStatus === "SUCCESS" || paymentStatus === "success" ? "2" : "3";

    // Update transaction
    await updateTransactionWithPaymentData(transaction.transactionId, {
      paymentStatus: firestoreStatus,
      trxReferenceNumber: kashierTransactionId || merchantOrderId,
      maskedCard,
      cardBrand,
      cardDataToken,
      orderReference,
      signature,
      merchantOrderId,
    });

    console.log("[Kashier Webhook] Transaction updated:", transaction.transactionId);

    // If payment successful, activate subscription
    if (firestoreStatus === "2") {
      await activateSubscriptionFromTransaction(transaction.transactionId);
      console.log("[Kashier Webhook] Subscription activated:", transaction.transactionId);
    }

    return NextResponse.json({
      ok: true,
      message: "Webhook processed successfully",
      transactionId: transaction.transactionId,
      paymentStatus: firestoreStatus,
    });
  } catch (error: any) {
    console.error("[Kashier Webhook] Error:", error);
    return NextResponse.json(
      { error: error.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for webhook verification
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: "Kashier webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
}

