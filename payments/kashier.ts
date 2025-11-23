// Kashier Payment Gateway Integration - Iframe Payment UI
// Documentation: https://developers.kashier.io/payment/payment-ui#i-frame

import crypto from "crypto";

/**
 * Test User ID for Sandbox Mode
 * 
 * When userId matches this value, the payment system will use test mode
 * and select test API keys (KASHIER_TEST_MERCHANT_ID, KASHIER_TEST_SECRET_KEY).
 * All other users use live mode and production API keys.
 */
const TEST_USER_ID = "JgGmhphtIsVyGO2nTnQde9ZOaKD2";

/**
 * Determine payment mode based on user ID
 * 
 * - If userId is TEST_USER_ID: Uses "test" mode
 * - For all other users: Uses "live" mode (or from KASHIER_MODE env var)
 * 
 * @param userId - Firebase user ID (optional)
 * @returns Payment mode: "test" or "live"
 */
export function getPaymentMode(userId?: string): "test" | "live" {
  const isTestUser = userId === TEST_USER_ID;
  
  if (isTestUser) {
    return "test";
  }
  
  // For production users, check KASHIER_MODE env var, default to "live"
  const mode = process.env.KASHIER_MODE || "live";
  return mode === "test" ? "test" : "live";
}

/**
 * Get Kashier API Key for hash generation based on payment mode
 * 
 * The API key is used specifically for generating the order hash.
 * Different from the secret key used for webhook validation.
 * 
 * @param mode - Payment mode: "test" or "live"
 * @returns API key string
 */
export function getKashierApiKey(mode: "test" | "live"): string {
  const apiKey = mode === "test"
    ? process.env.KASHIER_DEFAULT_API_TEST_KEY
    : process.env.KASHIER_DEFAULT_API_KEY;
  
  if (!apiKey) {
    const keyName = mode === "test"
      ? "KASHIER_DEFAULT_API_TEST_KEY"
      : "KASHIER_DEFAULT_API_KEY";
    throw new Error(
      `Kashier ${mode} API key is not configured. ` +
      `Please set ${keyName} in environment variables.`
    );
  }
  
  // Trim whitespace from API key (common issue with env vars)
  const trimmedKey = apiKey.trim();
  
  console.log(`[Kashier] Using ${mode} mode API key for hash generation:`, {
    apiKeyLength: trimmedKey.length,
    apiKeyPrefix: trimmedKey.substring(0, 10) + "...",
    hasWhitespace: /\s/.test(apiKey),
  });
  
  return trimmedKey;
}

/**
 * Get Kashier API credentials based on payment mode
 * 
 * Note: Merchant ID is the same for both test and production modes.
 * Only the secret key differs between test and production.
 * 
 * @param mode - Payment mode: "test" or "live"
 * @returns Object with merchantId and secretKey
 */
export function getPaymentCredentials(mode: "test" | "live"): {
  merchantId: string;
  secretKey: string;
} {
  // Merchant ID is the same for both test and production
  const merchantId = process.env.KASHIER_MERCHANT_ID;
  
  if (!merchantId) {
    throw new Error(
      "Kashier merchant ID is not configured. " +
      "Please set KASHIER_MERCHANT_ID in environment variables."
    );
  }
  
  // Secret key differs based on mode
  let secretKey = mode === "test" 
    ? process.env.KASHIER_TEST_SECRET_KEY
    : process.env.KASHIER_SECRET_KEY;
  
  if (!secretKey) {
    const keyName = mode === "test" 
      ? "KASHIER_TEST_SECRET_KEY" 
      : "KASHIER_SECRET_KEY";
    throw new Error(
      `Kashier ${mode} secret key is not configured. ` +
      `Please set ${keyName} in environment variables.`
    );
  }
  
  // Trim whitespace from secret key (common issue with env vars)
  secretKey = secretKey.trim();
  
  // Validate secret key format (should be a long hex string)
  if (secretKey.length < 50) {
    console.warn(`[Kashier] Secret key seems too short (${secretKey.length} chars). Expected ~100+ characters.`);
  }
  
  // Log secret key info (without exposing the actual key)
  console.log(`[Kashier] Using ${mode} mode credentials:`, {
    merchantId,
    secretKeyLength: secretKey.length,
    secretKeyStartsWith: secretKey.substring(0, 10) + "...",
    secretKeyEndsWith: "..." + secretKey.substring(secretKey.length - 10),
    hasWhitespace: /\s/.test(secretKey),
  });
  
  return { merchantId, secretKey };
}

/**
 * Generate Kashier Order Hash
 * 
 * Uses HMAC SHA256 to generate a hash for order validation.
 * Hash format: /?payment={mid}.{orderId}.{amount}.{currency}{customerReference?}
 * 
 * According to Kashier documentation, the hash should be generated using the API key
 * (KASHIER_DEFAULT_API_KEY or KASHIER_DEFAULT_API_TEST_KEY), not the secret key.
 * 
 * @param order - Order details
 * @param apiKey - Kashier API key (KASHIER_DEFAULT_API_KEY or KASHIER_DEFAULT_API_TEST_KEY)
 * @param customerReference - Optional customer reference for saving cards
 * @returns Hexadecimal hash string
 */
export function generateKashierOrderHash(
  order: {
    merchantId: string;
    orderId: string;
    amount: string;
    currency: string;
  },
  apiKey: string,
  customerReference?: string
): string {
  const { merchantId, orderId, amount, currency } = order;
  
  // Build hash path: /?payment={mid}.{orderId}.{amount}.{currency}{customerReference?}
  // IMPORTANT: No spaces, exact format as per Kashier documentation
  // If customerReference is provided, it should be appended with a dot: .{customerReference}
  let path = `/?payment=${merchantId}.${orderId}.${amount}.${currency}`;
  
  // Add customer reference if provided (for saving cards)
  // Format: .{customerReference} (with leading dot)
  if (customerReference) {
    path += `.${customerReference}`;
  }
  
  // Log the exact path being hashed (for debugging)
  console.log("[Kashier Hash] Hash path:", path);
  console.log("[Kashier Hash] Using API key (first 10 chars):", apiKey.substring(0, 10) + "...");
  
  // Generate HMAC SHA256 hash using the API key
  const hash = crypto
    .createHmac("sha256", apiKey)
    .update(path)
    .digest("hex");
  
  console.log("[Kashier Hash] Generated hash:", hash);
  
  return hash;
}

/**
 * Validate Kashier Payment Signature
 * 
 * Validates the signature from payment redirect to ensure the response
 * hasn't been tampered with.
 * 
 * @param queryParams - Query parameters from redirect URL (excluding signature and mode)
 * @param signature - Signature from redirect URL
 * @param secretKey - Kashier API secret key
 * @returns true if signature is valid, false otherwise
 */
export function validateKashierSignature(
  queryParams: Record<string, string>,
  signature: string,
  secretKey: string
): boolean {
  // Build query string from all parameters except signature and mode
  let queryString = "";
  
  for (const key in queryParams) {
    if (key === "signature" || key === "mode") {
      continue;
    }
    queryString += `&${key}=${queryParams[key]}`;
  }
  
  // Remove leading &
  const finalUrl = queryString.substring(1);
  
  // Generate signature
  const expectedSignature = crypto
    .createHmac("sha256", secretKey)
    .update(finalUrl)
    .digest("hex");
  
  return expectedSignature === signature;
}

/**
 * Iframe Payment Configuration
 * 
 * Configuration object for initializing Kashier iframe payment UI
 */
export type KashierIframeConfig = {
  amount: string;
  currency: string;
  orderId: string;
  merchantId: string;
  hash: string;
  mode: "test" | "live";
  merchantRedirect: string; // URI encoded redirect URL
  display: "ar" | "en"; // Language
  type?: string; // Default: "external"
  description?: string; // Order description (max 120 chars)
  serverWebhook?: string; // Optional webhook URL
  failureRedirect?: string; // "TRUE" or "FALSE" (default: "TRUE")
  redirectMethod?: "get" | "post"; // Default: "get"
  allowedMethods?: string; // e.g., "card,bank_installments,wallet,fawry"
  defaultMethod?: string; // e.g., "bank_installments" or "bank_installments,NBE"
  metaData?: string; // JSON string encoded with JSON.stringify() and encodeURIComponent()
  brandColor?: string; // Hex or rgba color
  manualCapture?: "TRUE" | "FALSE"; // Default: "FALSE"
  customer?: string; // JSON string for saving customer card
  saveCard?: "optional" | "forced";
  interactionSource?: "MOTO" | "ECOMMERCE";
  enable3DS?: "true" | "false";
  paymentRequestId?: string;
  connectedAccount?: string;
};

/**
 * Create Kashier Iframe Payment Configuration
 * 
 * Generates hash and returns configuration for iframe payment UI
 * 
 * @param input - Payment input parameters
 * @returns Iframe configuration object
 */
export async function createKashierIframeConfig(input: {
  amount: number;
  currency: string; // e.g., "EGP"
  orderId: string;
  userId?: string; // Firebase user ID - used to determine test vs live mode
  language?: "ar" | "en"; // UI language
  description?: string;
  merchantRedirect: string; // Success redirect URL (will be URI encoded)
  serverWebhook?: string; // Optional webhook URL
  failureRedirect?: string; // Optional failure redirect URL
  customerReference?: string; // For saving cards
}): Promise<KashierIframeConfig> {
  // Determine payment mode
  const mode = getPaymentMode(input.userId);
  
  // Get API credentials (merchantId and secretKey for webhook validation)
  const { merchantId } = getPaymentCredentials(mode);
  
  // Get API key for hash generation (different from secret key)
  const apiKey = getKashierApiKey(mode);
  
  // Format amount to 2 decimal places (required by Kashier)
  const formattedAmount = input.amount.toFixed(2);
  
  // Build hash path for logging
  const hashPath = `/?payment=${merchantId}.${input.orderId}.${formattedAmount}.${input.currency}`;
  console.log("[Kashier] Hash generation details:", {
    mode,
    merchantId,
    orderId: input.orderId,
    amount: formattedAmount,
    currency: input.currency,
    hashPath,
    hasApiKey: !!apiKey,
  });
  
  // Generate order hash using API key (not secret key)
  const hash = generateKashierOrderHash(
    {
      merchantId,
      orderId: input.orderId,
      amount: formattedAmount,
      currency: input.currency,
    },
    apiKey,
    input.customerReference
  );
  
  console.log("[Kashier] Generated hash:", hash);
  
  // Build configuration
  const config: KashierIframeConfig = {
    amount: formattedAmount,
    currency: input.currency,
    orderId: input.orderId,
    merchantId,
    hash,
    mode,
    merchantRedirect: encodeURIComponent(input.merchantRedirect),
    display: input.language || "ar",
    type: "external",
  };
  
  // Add optional fields
  if (input.description) {
    config.description = input.description.substring(0, 120); // Max 120 chars
  }
  
  if (input.serverWebhook) {
    config.serverWebhook = encodeURIComponent(input.serverWebhook);
  }
  
  if (input.failureRedirect) {
    config.failureRedirect = encodeURIComponent(input.failureRedirect);
  }
  
  return config;
}

