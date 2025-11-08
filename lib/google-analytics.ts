/**
 * Google Analytics (GA4) Event Tracking Utilities
 * 
 * This file provides helper functions for firing custom Google Analytics events
 * throughout the application (e.g., purchase, sign_up, etc.).
 * 
 * Usage:
 * - Import the functions you need: `import { trackPurchase, trackSignUp } from '@/lib/google-analytics';`
 * - Call the function after the relevant action: `trackPurchase({ value: 99.99, currency: 'EGP', transaction_id: 'TXN123' })`
 * 
 * Available Events:
 * - purchase: Payment completion
 * - sign_up: User registration/signup
 * - add_to_cart: Add item to cart (if applicable)
 * - begin_checkout: User starts checkout process
 * - view_item: View product/item
 * 
 * Documentation:
 * https://developers.google.com/analytics/devguides/collection/ga4/events
 */

// Type definitions for Google Analytics gtag function
declare global {
  interface Window {
    gtag?: (
      command: "config" | "event" | "set" | "js",
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
  }
}

/**
 * Check if Google Analytics is loaded and available
 */
function isGoogleAnalyticsLoaded(): boolean {
  return typeof window !== "undefined" && typeof window.gtag === "function";
}

/**
 * Track a custom Google Analytics event
 * 
 * @param eventName - The name of the event (e.g., 'purchase', 'sign_up')
 * @param params - Optional parameters for the event (e.g., { value: 99.99, currency: 'EGP' })
 */
export function trackGAEvent(
  eventName: string,
  params?: Record<string, any>
): void {
  if (!isGoogleAnalyticsLoaded()) {
    console.warn(`Google Analytics not loaded. Event "${eventName}" not tracked.`);
    return;
  }

  try {
    window.gtag!("event", eventName, params || {});
  } catch (error) {
    console.error(`Error tracking Google Analytics event "${eventName}":`, error);
  }
}

/**
 * Track purchase event
 * 
 * Call this after a successful payment:
 * ```tsx
 * await processPayment();
 * trackPurchase({ 
 *   value: 99.99, 
 *   currency: 'EGP',
 *   transaction_id: 'TXN123',
 *   items: [{ item_id: 'plan_1', item_name: 'One-Time Purchase', price: 99.99, quantity: 1 }]
 * });
 * ```
 * 
 * @param params - Purchase event parameters
 * @param params.value - The purchase amount
 * @param params.currency - The currency code (e.g., 'EGP', 'USD')
 * @param params.transaction_id - Unique transaction identifier
 * @param params.items - Array of purchased items (optional)
 */
export function trackPurchase(params: {
  value: number;
  currency: string;
  transaction_id: string;
  items?: Array<{
    item_id?: string;
    item_name?: string;
    item_category?: string;
    price?: number;
    quantity?: number;
  }>;
}): void {
  trackGAEvent("purchase", params);
}

/**
 * Track user registration/signup event
 * 
 * Call this after a successful user registration:
 * ```tsx
 * await registerUser();
 * trackSignUp({ method: 'email' });
 * ```
 * 
 * @param method - Registration method (e.g., 'email', 'google')
 */
export function trackSignUp(method?: string): void {
  trackGAEvent("sign_up", method ? { method } : {});
}

/**
 * Track add to cart event
 * 
 * Call this when user adds an item to cart:
 * ```tsx
 * addToCart(product);
 * trackAddToCart({ 
 *   value: 49.99, 
 *   currency: 'EGP',
 *   items: [{ item_id: 'plan_1', item_name: 'One-Time Purchase', price: 49.99, quantity: 1 }]
 * });
 * ```
 */
export function trackAddToCart(params: {
  value: number;
  currency: string;
  items?: Array<{
    item_id?: string;
    item_name?: string;
    item_category?: string;
    price?: number;
    quantity?: number;
  }>;
}): void {
  trackGAEvent("add_to_cart", params);
}

/**
 * Track begin checkout event
 * 
 * Call this when user starts the checkout process:
 * ```tsx
 * navigateToCheckout();
 * trackBeginCheckout({ 
 *   value: 99.99, 
 *   currency: 'EGP',
 *   items: [{ item_id: 'plan_1', item_name: 'One-Time Purchase', price: 99.99, quantity: 1 }]
 * });
 * ```
 */
export function trackBeginCheckout(params: {
  value: number;
  currency: string;
  items?: Array<{
    item_id?: string;
    item_name?: string;
    item_category?: string;
    price?: number;
    quantity?: number;
  }>;
}): void {
  trackGAEvent("begin_checkout", params);
}

/**
 * Track view item event
 * 
 * Call this when user views a product/item:
 * ```tsx
 * viewProduct(product);
 * trackViewItem({ 
 *   value: 99.99, 
 *   currency: 'EGP',
 *   items: [{ item_id: 'plan_1', item_name: 'One-Time Purchase', price: 99.99 }]
 * });
 * ```
 */
export function trackViewItem(params: {
  value: number;
  currency: string;
  items: Array<{
    item_id?: string;
    item_name?: string;
    item_category?: string;
    price?: number;
  }>;
}): void {
  trackGAEvent("view_item", params);
}

/**
 * Track custom event with any parameters
 * 
 * Use this for events not covered by the predefined functions above.
 * 
 * @param eventName - Custom event name
 * @param params - Any parameters for the event
 * 
 * Example:
 * ```tsx
 * trackCustomEvent('custom_event', { custom_param: 'value' });
 * ```
 */
export function trackCustomEvent(
  eventName: string,
  params?: Record<string, any>
): void {
  trackGAEvent(eventName, params);
}

