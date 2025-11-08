// Minimal Kashier API wrapper (server-side) for creating a checkout link/session.
// Docs: https://docs.kashier.io/
// Provide env vars in .env.local (see example) and keep secrets server-only.

/**
 * Test User ID for Sandbox Mode
 * 
 * When userId matches this value, the payment system will use test/sandbox keys
 * instead of production keys. This allows testing with sandbox credentials while
 * all other users use production payment gateway.
 */
const TEST_USER_ID = "JgGmhphtIsVyGO2nTnQde9ZOaKD2";

type CreateCheckoutInput = {
  amount: number;
  currency: string; // e.g., "EGP"
  orderId: string;
  successUrl?: string; // Return URL after successful payment
  cancelUrl?: string; // Return URL if user cancels
  customerEmail?: string;
  customerName?: string;
  userId?: string; // Firebase user ID - used to determine test vs prod keys
  subscriptionPlanId?: "one_time" | "flex_pack" | "annual_pass"; // Plan ID for ppLink selection
  // additional fields can be added per Kashier API
};

/**
 * Get Kashier Payment Page Link (ppLink) based on subscription plan and mode
 * 
 * Payment Page Links are stored as environment variables for security:
 * - Production ppLinks: KASHIER_PPLINK_ONETIME, KASHIER_PPLINK_FLEXPACK, KASHIER_PPLINK_ANNUALPASS
 * - Test ppLinks: KASHIER_PPLINK_ONETIME_TEST, KASHIER_PPLINK_FLEXPACK_TEST, KASHIER_PPLINK_ANNUALPASS_TEST
 * 
 * @param subscriptionPlanId - Plan identifier: "one_time", "flex_pack", or "annual_pass"
 * @param mode - Payment mode: "test" or "live"
 * @returns Payment Page Link ID (e.g., "PP-XXXXX")
 */
function getPaymentPageLink(subscriptionPlanId: "one_time" | "flex_pack" | "annual_pass", mode: "test" | "live"): string {
  // In test mode, use plan-specific test ppLinks
  if (mode === "test") {
    const testPpLinkMap: Record<string, string | undefined> = {
      one_time: process.env.KASHIER_PPLINK_ONETIME_TEST,
      flex_pack: process.env.KASHIER_PPLINK_FLEXPACK_TEST,
      annual_pass: process.env.KASHIER_PPLINK_ANNUALPASS_TEST,
    };

    const testPpLink = testPpLinkMap[subscriptionPlanId];
    if (!testPpLink) {
      throw new Error(
        `Kashier test Payment Page Link for plan "${subscriptionPlanId}" is not configured. ` +
        `Add KASHIER_PPLINK_${subscriptionPlanId.toUpperCase().replace("_", "")}_TEST to environment variables.`
      );
    }
    return testPpLink;
  }

  // In live/production mode, use plan-specific production ppLinks
  const ppLinkMap: Record<string, string | undefined> = {
    one_time: process.env.KASHIER_PPLINK_ONETIME,
    flex_pack: process.env.KASHIER_PPLINK_FLEXPACK,
    annual_pass: process.env.KASHIER_PPLINK_ANNUALPASS,
  };

  const ppLink = ppLinkMap[subscriptionPlanId];
  if (!ppLink) {
    throw new Error(
      `Kashier Payment Page Link for plan "${subscriptionPlanId}" is not configured. ` +
      `Add KASHIER_PPLINK_${subscriptionPlanId.toUpperCase().replace("_", "")} to environment variables.`
    );
  }

  return ppLink;
}

/**
 * Get payment gateway credentials based on user ID
 * 
 * - If userId is TEST_USER_ID: Uses test/sandbox keys (KASHIER_TEST_MERCHANT_ID, KASHIER_TEST_SECRET_KEY)
 * - For all other users: Uses production keys (KASHIER_MERCHANT_ID, KASHIER_SECRET_KEY)
 * 
 * @param userId - Firebase user ID (optional)
 * @returns Object with merchantId, secretKey, and mode
 */
function getPaymentCredentials(userId?: string) {
  const isTestUser = userId === TEST_USER_ID;
  
  if (isTestUser) {
    // Test user: Use sandbox/test credentials
    const merchantId = process.env.KASHIER_TEST_MERCHANT_ID;
    const secretKey = process.env.KASHIER_TEST_SECRET_KEY;
    const mode = "test"; // Always use test mode for test user
    
    if (!merchantId || !secretKey) {
      throw new Error(
        "Kashier test credentials are not configured. " +
        "Add KASHIER_TEST_MERCHANT_ID and KASHIER_TEST_SECRET_KEY to environment variables."
      );
    }
    
    return { merchantId, secretKey, mode };
  } else {
    // Production user: Use live/production credentials
    const merchantId = process.env.KASHIER_MERCHANT_ID;
    const secretKey = process.env.KASHIER_SECRET_KEY;
    const mode = process.env.KASHIER_MODE || "live"; // Default to live for production
    
    if (!merchantId || !secretKey) {
      throw new Error(
        "Kashier production credentials are not configured. " +
        "Add KASHIER_MERCHANT_ID and KASHIER_SECRET_KEY to environment variables."
      );
    }
    
    return { merchantId, secretKey, mode };
  }
}

/**
 * Create Kashier Payment Page checkout URL
 * 
 * Uses Payment Page Links (ppLink) stored as environment variables for security.
 * URL format: https://checkouts.kashier.io/en/paymentpage?ppLink={ppLink},{mode}
 * 
 * The ppLink is selected based on:
 * - Subscription plan (one_time, flex_pack, annual_pass)
 * - Payment mode (test or live)
 * 
 * @param input - Checkout input parameters
 * @returns Object with payment URL
 */
export async function createKashierCheckout(input: CreateCheckoutInput) {
  // Get payment credentials based on user ID (test vs production)
  const { merchantId, secretKey, mode } = getPaymentCredentials(input.userId);

  // Validate subscriptionPlanId is provided (required for ppLink selection)
  if (!input.subscriptionPlanId) {
    throw new Error(
      "subscriptionPlanId is required to determine the correct Payment Page Link. " +
      "Provide 'one_time', 'flex_pack', or 'annual_pass'."
    );
  }

  // Get the appropriate Payment Page Link based on plan and mode
  const ppLink = getPaymentPageLink(input.subscriptionPlanId, mode);

  // Build Kashier Payment Page URL
  // Format: https://checkouts.kashier.io/en/paymentpage?ppLink={ppLink},{mode}
  // The ppLink and mode are combined in the ppLink parameter: "PP-XXXXX,test" or "PP-XXXXX,live"
  const paymentUrl = `https://checkouts.kashier.io/en/paymentpage?ppLink=${ppLink},${mode}`;

  // Note: Additional parameters (orderId, successUrl, cancelUrl, etc.) may need to be
  // configured in the Kashier dashboard for the Payment Page Link, or passed via
  // query parameters if supported by Kashier API.
  // 
  // If Kashier requires additional query parameters, uncomment and modify below:
  // const params = new URLSearchParams({
  //   ppLink: `${ppLink},${mode}`,
  //   orderId: input.orderId,
  // });
  // if (input.successUrl) params.set("successUrl", input.successUrl);
  // if (input.cancelUrl) params.set("cancelUrl", input.cancelUrl);
  // const paymentUrl = `https://checkouts.kashier.io/en/paymentpage?${params.toString()}`;

  return { url: paymentUrl };
}


