import { NextRequest, NextResponse } from "next/server";
import { createKashierCheckout } from "@/payments/kashier";
import { getUserProfile, createTransaction } from "@/firebase/firestore";
import { cookies } from "next/headers";

/**
 * Kashier Payment Checkout API Route
 * 
 * This endpoint:
 * 1. Creates a pending Transaction record in Firestore
 * 2. Generates a Kashier payment checkout session URL
 * 3. Returns the payment URL (client handles redirect)
 * 
 * Query Parameters:
 * - product: "one_time" | "flex_pack" | "annual_pass" (required)
 * - userId: Firebase user ID (required for paid plans)
 * - language: "ar" | "en" (optional, defaults to "ar")
 * 
 * Returns: { 
 *   url: string,           // Kashier checkout URL
 *   transactionId: string  // Firestore transaction document ID
 * }
 * 
 * Error Cases:
 * - 400: Invalid product or missing userId
 * - 401: User not authenticated (userId not provided)
 * - 404: User profile not found
 * - 500: Transaction creation or payment URL generation failed
 * 
 * Environment Variables Required:
 * 
 * Production Keys (for all users except test user):
 * - KASHIER_MERCHANT_ID: Your Kashier production merchant ID
 * - KASHIER_SECRET_KEY: Your Kashier production secret key
 * - KASHIER_MODE: "live" (defaults to "live" for production)
 * 
 * Test/Sandbox Keys (for test user: JgGmhphtIsVyGO2nTnQde9ZOaKD2):
 * - KASHIER_TEST_MERCHANT_ID: Your Kashier test/sandbox merchant ID
 * - KASHIER_TEST_SECRET_KEY: Your Kashier test/sandbox secret key
 * 
 * Note: Keys are automatically selected based on userId - no manual configuration needed.
 * 
 * Pricing (in EGP):
 * - one_time: 49 EGP (Single CV purchase: 1 CV, 3 templates, 7 days edits)
 * - flex_pack: 149 EGP (5 CVs, 6 months)
 * - annual_pass: 299 EGP (Unlimited CVs, 1 year)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const product = searchParams.get("product") || searchParams.get("plan") || "one_time";
  const userId = searchParams.get("userId");
  const languageParam = searchParams.get("language");
  
  // Validate product
  if (product === "free") {
    return NextResponse.json(
      { error: "Free plan does not require payment checkout" },
      { status: 400 }
    );
  }

  // Validate userId (required for paid plans)
  if (!userId) {
    return NextResponse.json(
      { error: "User ID is required for payment checkout. Please sign in first." },
      { status: 401 }
    );
  }

  // Validate product type
  const validProducts = ["one_time", "flex_pack", "annual_pass"];
  if (!validProducts.includes(product)) {
    return NextResponse.json(
      { error: `Invalid product: ${product}. Must be one of: ${validProducts.join(", ")}` },
      { status: 400 }
    );
  }

  // Determine language (default to Arabic)
  let language: "ar" | "en" = "ar";
  try {
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get("locale")?.value;
    if (localeCookie === "en" || languageParam === "en") {
      language = "en";
    }
  } catch (error) {
    // Fallback to Arabic if cookie cannot be read
    language = "ar";
  }

  try {
    // Step 1: Get user profile data (name, email, phone)
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found. Please complete your profile first." },
        { status: 404 }
      );
    }

    // Extract user information
    const userEmail = userProfile.email;
    const userName = userProfile.name || "User";
    const userPhone = userProfile.phone;

    // Step 2: Determine payment mode (test vs live) based on userId
    // This matches the logic in payments/kashier.ts
    const TEST_USER_ID = "JgGmhphtIsVyGO2nTnQde9ZOaKD2";
    const mode: "test" | "live" = userId === TEST_USER_ID ? "test" : "live";

    // Step 3: Generate order ID and transaction reference
    // Order ID format: order_{product}_{timestamp}_{userId}
    const orderId = `order_${product}_${Date.now()}_${userId}`;
    // Initial transaction reference (will be updated from Kashier callback)
    // Format: trx_{product}_{timestamp}_{userId}
    const trxReferenceNumber = `trx_${product}_${Date.now()}_${userId}`;

    // Step 4: Create pending Transaction record in Firestore
    // This must be done BEFORE generating the payment URL so we have a record
    // even if payment URL generation fails
    let transactionId: string;
    try {
      transactionId = await createTransaction({
        userId,
        userEmail,
        userName,
        userPhone,
        subscriptionPlanId: product as "one_time" | "flex_pack" | "annual_pass",
        orderId,
        mode,
        language,
        trxReferenceNumber,
      });
    } catch (transactionError: any) {
      console.error("[Checkout API] Failed to create transaction:", transactionError);
      return NextResponse.json(
        {
          error: "Failed to create transaction record. Please try again.",
          code: "TRANSACTION_CREATION_FAILED",
          details: process.env.NODE_ENV === "development" ? transactionError.message : undefined,
        },
        { status: 500 }
      );
    }

    // Step 5: Build return URLs for Kashier callback
    // These URLs will receive payment status and transaction reference from Kashier
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    process.env.VERCEL_URL || 
                    "http://localhost:3000";
    
    // Success URL: Uses dynamic route with trxReferenceNumber in path
    // Format: /payment-approved/{trxReferenceNumber}?status=success&transactionId={id}&...
    // Note: The trxReferenceNumber will be appended by Kashier or we can include it in the URL
    // For now, we'll use a placeholder that Kashier will replace, or include it in query params
    // The actual trxReferenceNumber from Kashier will be in the redirect URL path
    const successParams = new URLSearchParams({
      status: "success",
      product,
      transactionId, // Include transactionId for easy lookup
      orderId, // Include orderId for reference
    });
    // Note: Kashier will redirect to /payment-approved/{actualTrxReferenceNumber} with query params
    // We use a placeholder that Kashier will replace, or we construct it with our initial reference
    const successUrl = `${baseUrl}/payment-approved/${trxReferenceNumber}?${successParams.toString()}`;
    
    // Cancel/Failed URL: User cancelled or payment failed
    // Format: /payment-failed?status=cancel&transactionId={id}&...
    const cancelParams = new URLSearchParams({
      status: "cancel",
      product,
      transactionId,
      orderId,
    });
    const cancelUrl = `${baseUrl}/payment-failed?${cancelParams.toString()}`;

    // Step 6: Generate Kashier payment URL
    // Pricing map: product -> EGP amount
    const pricing: Record<string, number> = {
      one_time: 49, // Single CV purchase: 1 CV, 3 templates, 7 days unlimited edits
      flex_pack: 149, // 5 CVs, 6 months
      annual_pass: 299, // Unlimited CVs, 1 year
    };

    const amount = pricing[product] ?? 49;
    if (amount === 0) {
      return NextResponse.json(
        { error: "Invalid product for paid checkout" },
        { status: 400 }
      );
    }

    let checkoutResult: { url: string };
    try {
      checkoutResult = await createKashierCheckout({
        amount,
        currency: "EGP",
        orderId,
        successUrl,
        cancelUrl,
        userId, // Used to determine test vs production keys
        subscriptionPlanId: product as "one_time" | "flex_pack" | "annual_pass", // Required for ppLink selection
        customerEmail: userEmail,
        customerName: userName,
      });
    } catch (kashierError: any) {
      console.error("[Checkout API] Failed to create Kashier checkout:", kashierError);
      
      // Check if it's a configuration error
      if (kashierError.message?.includes("not configured") || kashierError.message?.includes("credentials")) {
        return NextResponse.json(
          {
            error: "Payment service is not configured. Please contact support or check back later.",
            code: "PAYMENT_NOT_CONFIGURED",
            transactionId, // Return transactionId even on error so client can track it
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
          error: kashierError.message || "Failed to initialize payment. Please try again later.",
          code: "CHECKOUT_ERROR",
          transactionId, // Return transactionId even on error
        },
        { status: 500 }
      );
    }

    // Step 7: Return payment URL and transaction ID
    // Client will handle redirect to the payment URL
    return NextResponse.json({
      url: checkoutResult.url,
      transactionId, // Include transactionId for client-side tracking
    });
  } catch (error: any) {
    console.error("[Checkout API] Unexpected error:", error);
    return NextResponse.json(
      {
        error: error.message || "An unexpected error occurred. Please try again later.",
        code: "UNEXPECTED_ERROR",
      },
      { status: 500 }
    );
  }
}

