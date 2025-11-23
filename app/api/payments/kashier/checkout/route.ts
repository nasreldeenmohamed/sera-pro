import { NextRequest, NextResponse } from "next/server";
import { createKashierIframeConfig, getPaymentMode } from "@/payments/kashier";
import { getUserProfile, createTransaction, saveUserProfile } from "@/firebase/firestore";

/**
 * Kashier Iframe Payment Checkout API Route
 * 
 * This endpoint:
 * 1. Creates a pending Transaction record in Firestore
 * 2. Generates Kashier iframe payment configuration (including hash)
 * 3. Returns the configuration for client-side iframe initialization
 * 
 * Query Parameters:
 * - product: "one_time" | "flex_pack" | "annual_pass" (required)
 * - userId: Firebase user ID (required for paid plans)
 * - language: "ar" | "en" (optional, defaults to "ar")
 * 
 * Returns: { 
 *   config: KashierIframeConfig,  // Configuration for iframe
 *   transactionId: string          // Firestore transaction document ID
 * }
 * 
 * Pricing (in EGP):
 * - one_time: 49 EGP (Single CV purchase: 1 CV, 3 templates, 7 days edits)
 * - flex_pack: 149 EGP (5 CVs, 6 months)
 * - annual_pass: 299 EGP (Unlimited CVs, 1 year)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const product = searchParams.get("product");
    const userId = searchParams.get("userId");
    const language = searchParams.get("language") || "ar";

    console.log("[Checkout API] Request received:", { product, userId, language });

    // Validate required parameters
    if (!product || !userId) {
      console.error("[Checkout API] Missing required parameters:", { product, userId });
      return NextResponse.json(
        { error: "Product and userId are required." },
        { status: 400 }
      );
    }

    // Validate product type
    const validProducts = ["one_time", "flex_pack", "annual_pass"];
    if (!validProducts.includes(product)) {
      console.error("[Checkout API] Invalid product:", product);
      return NextResponse.json(
        { error: `Invalid product. Must be one of: ${validProducts.join(", ")}` },
        { status: 400 }
      );
    }

    // Get user email from query params (fallback if profile doesn't exist)
    const userEmail = searchParams.get("email") || "";
    
    // Get user profile, create if it doesn't exist
    console.log("[Checkout API] Fetching user profile for userId:", userId);
    let userProfile = await getUserProfile(userId);
    
    if (!userProfile) {
      console.log("[Checkout API] User profile not found, creating new profile...");
      
      // Create a minimal profile if it doesn't exist
      if (!userEmail) {
        console.error("[Checkout API] Cannot create profile: email is required but not provided");
        return NextResponse.json(
          { error: "User profile not found and email is required to create one." },
          { status: 400 }
        );
      }
      
      try {
        await saveUserProfile(userId, {
          name: userEmail.split("@")[0] || "User",
          email: userEmail,
          phone: undefined,
        });
        console.log("[Checkout API] ✅ User profile created successfully");
        
        // Fetch the newly created profile
        userProfile = await getUserProfile(userId);
        if (!userProfile) {
          throw new Error("Failed to retrieve newly created profile");
        }
      } catch (profileError: any) {
        console.error("[Checkout API] Failed to create user profile:", profileError);
        return NextResponse.json(
          {
            error: "Failed to create user profile. Please try again.",
            code: "PROFILE_CREATION_FAILED",
            details: process.env.NODE_ENV === "development" ? profileError.message : undefined,
          },
          { status: 500 }
        );
      }
    }
    
    console.log("[Checkout API] User profile retrieved:", { email: userProfile.email, name: userProfile.name });

    // Define plan pricing and details
    const planDetails = {
      one_time: {
        price: 49,
        currency: "EGP",
        name: "One-Time Purchase",
        duration: "7",
        durationType: "days",
        description: "1 CV, 3 Templates, Unlimited edits for 7 days",
      },
      flex_pack: {
        price: 149,
        currency: "EGP",
        name: "Flex Pack",
        duration: "6",
        durationType: "months",
        description: "5 CVs credits (wallet), Valid for 6 months",
      },
      annual_pass: {
        price: 299,
        currency: "EGP",
        name: "Annual Pass",
        duration: "12",
        durationType: "months",
        description: "Unlimited CVs, Valid for 1 year",
      },
    };

    const plan = planDetails[product as keyof typeof planDetails];

    // Generate order ID and transaction reference
    const timestamp = Date.now();
    const orderId = `order_${product}_${timestamp}_${userId}`;
    const trxReferenceNumber = `trx_${product}_${timestamp}_${userId}`;

    // Get base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                    "http://localhost:3000";

    // Determine payment mode using centralized function
    const paymentMode = getPaymentMode(userId);
    console.log("[Checkout API] Payment mode determined:", paymentMode, { userId, KASHIER_MODE: process.env.KASHIER_MODE });

    // Create transaction in Firestore (before generating payment config)
    console.log("[Checkout API] Creating transaction in Firestore...");
    let transactionId: string;
    try {
      transactionId = await createTransaction({
        userId,
        userEmail: userProfile.email,
        userName: userProfile.name || "",
        userPhone: userProfile.phone,
        subscriptionPlanId: product as "one_time" | "flex_pack" | "annual_pass",
        orderId,
        mode: paymentMode,
        language: language as "ar" | "en",
        trxReferenceNumber,
      });
      console.log("[Checkout API] Transaction created successfully:", transactionId);
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

    // Build redirect URLs
    const successUrl = `${baseUrl}/payment-approved/${trxReferenceNumber}`;
    const failureUrl = `${baseUrl}/payment-failed?transactionId=${transactionId}`;

    // Generate Kashier iframe configuration
    console.log("[Checkout API] Generating Kashier iframe configuration...");
    try {
      // Check environment variables before attempting to create config
      const merchantId = process.env.KASHIER_MERCHANT_ID;
      const secretKey = paymentMode === "test" 
        ? process.env.KASHIER_TEST_SECRET_KEY 
        : process.env.KASHIER_SECRET_KEY;
      
      console.log("[Checkout API] Environment check:", {
        mode: paymentMode,
        hasMerchantId: !!merchantId,
        hasSecretKey: !!secretKey,
        merchantIdLength: merchantId?.length || 0,
        secretKeyLength: secretKey?.length || 0,
      });
      
      if (!merchantId) {
        console.error("[Checkout API] Missing KASHIER_MERCHANT_ID");
        throw new Error("KASHIER_MERCHANT_ID environment variable is not set.");
      }
      if (!secretKey) {
        const missingKey = paymentMode === "test" ? "KASHIER_TEST_SECRET_KEY" : "KASHIER_SECRET_KEY";
        console.error(`[Checkout API] Missing ${missingKey} for ${paymentMode} mode`);
        throw new Error(`${missingKey} environment variable is not set.`);
      }
      
      const config = await createKashierIframeConfig({
        amount: plan.price,
        currency: plan.currency,
        orderId,
        userId,
        language: language as "ar" | "en",
        description: plan.description,
        merchantRedirect: successUrl,
        serverWebhook: `${baseUrl}/api/payments/kashier/webhook`,
        failureRedirect: failureUrl,
      });

      console.log("[Checkout API] Configuration generated successfully");
      return NextResponse.json({
        config,
        transactionId,
      });
    } catch (configError: any) {
      console.error("[Checkout API] Failed to generate payment config:", configError);
      console.error("[Checkout API] Error details:", {
        message: configError.message,
        stack: configError.stack,
      });
      return NextResponse.json(
        {
          error: configError.message || "Failed to generate payment configuration.",
          code: "PAYMENT_CONFIG_FAILED",
          details: process.env.NODE_ENV === "development" ? configError.message : undefined,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[Checkout API] Unexpected error:", error);
    console.error("[Checkout API] Error stack:", error.stack);
    return NextResponse.json(
      {
        error: error.message || "An unexpected error occurred. Please try again later.",
        code: "UNEXPECTED_ERROR",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

