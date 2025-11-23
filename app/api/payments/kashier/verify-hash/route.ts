import { NextRequest, NextResponse } from "next/server";
import { generateKashierOrderHash, getPaymentCredentials, getPaymentMode, getKashierApiKey } from "@/payments/kashier";

/**
 * Hash Verification Endpoint (Development Only)
 * 
 * This endpoint helps verify hash generation is working correctly.
 * 
 * Query Parameters:
 * - orderId: Test order ID
 * - amount: Test amount (default: 5.00)
 * - currency: Currency (default: EGP)
 * - userId: User ID to determine test/live mode
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "This endpoint is only available in development" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId") || `test_order_${Date.now()}`;
    const amount = searchParams.get("amount") || "5.00";
    const currency = searchParams.get("currency") || "EGP";
    const userId = searchParams.get("userId") || undefined;

    const mode = getPaymentMode(userId);
    const { merchantId } = getPaymentCredentials(mode);
    const apiKey = getKashierApiKey(mode);

    const hashPath = `/?payment=${merchantId}.${orderId}.${amount}.${currency}`;
    const hash = generateKashierOrderHash(
      { merchantId, orderId, amount, currency },
      apiKey
    );

    return NextResponse.json({
      mode,
      merchantId,
      orderId,
      amount,
      currency,
      hashPath,
      generatedHash: hash,
      apiKeyInfo: {
        length: apiKey.length,
        startsWith: apiKey.substring(0, 10) + "...",
        endsWith: "..." + apiKey.substring(apiKey.length - 10),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

