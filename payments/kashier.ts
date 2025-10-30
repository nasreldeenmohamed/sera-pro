// Minimal Kashier API wrapper (server-side) for creating a checkout link/session.
// Docs: https://docs.kashier.io/
// Provide env vars in .env.local (see example) and keep secrets server-only.

type CreateCheckoutInput = {
  amount: number;
  currency: string; // e.g., "EGP"
  orderId: string;
  successUrl?: string; // Return URL after successful payment
  cancelUrl?: string; // Return URL if user cancels
  customerEmail?: string;
  customerName?: string;
  // additional fields can be added per Kashier API
};

export async function createKashierCheckout(input: CreateCheckoutInput) {
  const merchantId = process.env.KASHIER_MERCHANT_ID;
  const secretKey = process.env.KASHIER_SECRET_KEY;
  const mode = process.env.KASHIER_MODE || "test"; // "test" | "live"

  if (!merchantId || !secretKey) {
    throw new Error("Kashier merchant credentials are not configured");
  }

  // Build checkout URL with return URLs
  // NOTE: Real implementation would sign payloads using secret key as per Kashier docs.
  // Here we return a placeholder URL to keep the flow wired without exposing secrets.
  const params = new URLSearchParams({
    merchantId,
    amount: input.amount.toString(),
    currency: input.currency,
    orderId: input.orderId,
    mode,
  });

  if (input.successUrl) {
    params.set("successUrl", input.successUrl);
  }
  if (input.cancelUrl) {
    params.set("cancelUrl", input.cancelUrl);
  }
  if (input.customerEmail) {
    params.set("customerEmail", input.customerEmail);
  }
  if (input.customerName) {
    params.set("customerName", input.customerName);
  }

  const checkoutUrl = `https://checkout.kashier.io/?${params.toString()}`;
  return { url: checkoutUrl };
}


