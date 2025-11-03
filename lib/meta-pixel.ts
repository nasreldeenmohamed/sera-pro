/**
 * Meta Pixel (Facebook Pixel) Event Tracking Utilities
 * 
 * This file provides helper functions for firing custom Meta Pixel events
 * throughout the application (e.g., SignUp, Purchase, etc.).
 * 
 * Usage:
 * - Import the functions you need: `import { trackSignUp, trackPurchase } from '@/lib/meta-pixel';`
 * - Call the function after the relevant action: `trackSignUp()` or `trackPurchase({ value: 99.99, currency: 'EGP' })`
 * 
 * Available Events:
 * - PageView: Automatically tracked on every page load (handled in app/layout.tsx)
 * - CompleteRegistration: User registration/signup
 * - Purchase: Payment completion
 * - AddToCart: Add item to cart (if applicable)
 * - InitiateCheckout: User starts checkout process
 * - Lead: User submits a form or shows interest
 * 
 * Documentation:
 * https://developers.facebook.com/docs/meta-pixel/reference
 */

// Type definitions for Meta Pixel events
declare global {
  interface Window {
    fbq?: (
      action: string,
      event: string,
      params?: Record<string, any>
    ) => void;
  }
}

/**
 * Check if Meta Pixel is loaded and available
 */
function isMetaPixelLoaded(): boolean {
  return typeof window !== "undefined" && typeof window.fbq === "function";
}

/**
 * Track a custom Meta Pixel event
 * 
 * @param eventName - The name of the event (e.g., 'CompleteRegistration', 'Purchase')
 * @param params - Optional parameters for the event (e.g., { value: 99.99, currency: 'EGP' })
 */
export function trackMetaPixelEvent(
  eventName: string,
  params?: Record<string, any>
): void {
  if (!isMetaPixelLoaded()) {
    console.warn(`Meta Pixel not loaded. Event "${eventName}" not tracked.`);
    return;
  }

  try {
    if (params) {
      window.fbq!("track", eventName, params);
    } else {
      window.fbq!("track", eventName);
    }
  } catch (error) {
    console.error(`Error tracking Meta Pixel event "${eventName}":`, error);
  }
}

/**
 * Track user registration/signup event
 * 
 * Call this after a successful user registration:
 * ```tsx
 * await registerUser();
 * trackSignUp();
 * ```
 */
export function trackSignUp(): void {
  trackMetaPixelEvent("CompleteRegistration");
}

/**
 * Track purchase event
 * 
 * Call this after a successful payment:
 * ```tsx
 * await processPayment();
 * trackPurchase({ value: 99.99, currency: 'EGP' });
 * ```
 * 
 * @param value - The purchase amount
 * @param currency - The currency code (e.g., 'EGP', 'USD')
 */
export function trackPurchase(params: {
  value: number;
  currency: string;
}): void {
  trackMetaPixelEvent("Purchase", params);
}

/**
 * Track add to cart event
 * 
 * Call this when user adds an item to cart:
 * ```tsx
 * addToCart(product);
 * trackAddToCart({ value: 49.99, currency: 'EGP' });
 * ```
 */
export function trackAddToCart(params: {
  value: number;
  currency: string;
}): void {
  trackMetaPixelEvent("AddToCart", params);
}

/**
 * Track initiate checkout event
 * 
 * Call this when user starts the checkout process:
 * ```tsx
 * navigateToCheckout();
 * trackInitiateCheckout({ value: 99.99, currency: 'EGP' });
 * ```
 */
export function trackInitiateCheckout(params: {
  value: number;
  currency: string;
}): void {
  trackMetaPixelEvent("InitiateCheckout", params);
}

/**
 * Track lead event
 * 
 * Call this when user submits a form or shows interest:
 * ```tsx
 * submitContactForm();
 * trackLead();
 * ```
 */
export function trackLead(): void {
  trackMetaPixelEvent("Lead");
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
 * trackCustomEvent('ViewContent', { content_type: 'product', content_ids: ['123'] });
 * ```
 */
export function trackCustomEvent(
  eventName: string,
  params?: Record<string, any>
): void {
  trackMetaPixelEvent(eventName, params);
}

