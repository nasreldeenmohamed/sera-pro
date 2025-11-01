import { NextRequest, NextResponse } from "next/server";
import { createKashierCheckout } from "@/payments/kashier";

// Checkout endpoint returning a Kashier URL with return URLs for success/cancel
// Query params: product (one_time|flex_pack|annual_pass), userId (optional, can come from auth)
// Optional: customerEmail, customerName (for better payment form initialization)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const product = searchParams.get("product") || searchParams.get("plan") || "one_time";
  const userId = searchParams.get("userId");
  const customerEmail = searchParams.get("customerEmail");
  const customerName = searchParams.get("customerName");

  // Pricing map: product -> EGP amount
  const pricing: Record<string, number> = {
    one_time: 79, // Single CV purchase
    flex_pack: 149, // 5 CVs, 6 months
    annual_pass: 299, // Unlimited CVs, 1 year
    // Legacy plan names (for backward compatibility)
    starter: 0, // Free plan
    pro: 79,
    business: 149,
  };

  const amount = pricing[product] ?? 79;
  if (amount === 0) {
    return NextResponse.json({ error: "Invalid product for paid checkout" }, { status: 400 });
  }

  // Build return URLs with product and userId for activation
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || "http://localhost:3000";
  const successParams = new URLSearchParams({
    status: "success",
    product,
  });
  if (userId) successParams.set("userId", userId);
  const cancelParams = new URLSearchParams({ status: "cancel", product });
  if (userId) cancelParams.set("userId", userId);

  const successUrl = `${baseUrl}/payments/success?${successParams.toString()}`;
  const cancelUrl = `${baseUrl}/payments/cancel?${cancelParams.toString()}`;

  const orderId = `order_${product}_${Date.now()}_${userId || "guest"}`;

  try {
    const result = await createKashierCheckout({
      amount,
      currency: "EGP",
      orderId,
      successUrl, // Kashier will append payment status/orderId
      cancelUrl,
      // Pass customer info if available - helps reduce initialization errors in Kashier form
      ...(customerEmail && { customerEmail }),
      ...(customerName && { customerName }),
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Kashier Checkout API] Error:", error);
    
    // Check if it's a configuration error
    if (error.message?.includes("not configured") || error.message?.includes("credentials")) {
      return NextResponse.json(
        {
          error: "Payment service is not configured. Please contact support or check back later.",
          code: "PAYMENT_NOT_CONFIGURED",
          // In development, provide more details
          ...(process.env.NODE_ENV === "development" && {
            details: "Kashier merchant credentials are missing. Add KASHIER_MERCHANT_ID and KASHIER_SECRET_KEY to .env.local",
          }),
        },
        { status: 503 } // Service Unavailable
      );
    }

    // Generic error
    return NextResponse.json(
      {
        error: error.message || "Failed to initialize payment. Please try again later.",
        code: "CHECKOUT_ERROR",
      },
      { status: 500 }
    );
  }
}


