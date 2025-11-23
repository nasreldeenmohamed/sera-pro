"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useLocale } from "@/lib/locale-context";
import { Loader2 } from "lucide-react";

/**
 * Kashier Iframe Payment Page
 * 
 * This page displays the Kashier payment iframe using the Payment UI script.
 * According to Kashier documentation, the script tag with id="kashier-iFrame"
 * and data attributes automatically creates the iframe when loaded.
 * 
 * URL Parameters:
 * - config: Base64 encoded JSON string of iframe configuration (from checkout API)
 * 
 * Flow:
 * 1. Page receives iframe configuration (from checkout API response)
 * 2. Creates script tag with id="kashier-iFrame" and all data attributes
 * 3. Kashier script automatically creates the iframe
 * 4. User completes payment in iframe
 * 5. Redirects to success/failure page based on payment result
 */
function KashierIframeContent() {
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const configJson = searchParams.get("config");
  const transactionId = searchParams.get("transactionId");
  const [scriptLoaded, setScriptLoaded] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!configJson) {
      console.error("[Kashier Iframe] Configuration is required");
      return;
    }

    // Prevent multiple initializations
    if (scriptLoaded) {
      return;
    }

    try {
      // Decode configuration from URL
      const config = JSON.parse(decodeURIComponent(configJson));
      console.log("[Kashier Iframe] Decoded config:", config);

      // Remove any existing script
      const existingScript = document.getElementById("kashier-iFrame");
      if (existingScript) {
        console.log("[Kashier Iframe] Removing existing script");
        existingScript.remove();
      }

      // Create script element with Kashier iframe configuration
      // According to documentation, the script with id="kashier-iFrame" 
      // automatically creates the iframe when loaded
      const script = document.createElement("script");
      script.id = "kashier-iFrame";
      script.src = "https://payments.kashier.io/kashier-checkout.js";
      
      // Set required data attributes
      script.setAttribute("data-amount", config.amount);
      script.setAttribute("data-hash", config.hash);
      script.setAttribute("data-currency", config.currency);
      script.setAttribute("data-orderId", config.orderId);
      script.setAttribute("data-merchantId", config.merchantId);
      // Note: merchantRedirect, serverWebhook, and failureRedirect are already URI encoded in the config
      // But Kashier script expects them decoded, so decode before passing
      script.setAttribute("data-merchantRedirect", decodeURIComponent(config.merchantRedirect));
      script.setAttribute("data-mode", config.mode);
      script.setAttribute("data-display", config.display);
      script.setAttribute("data-type", config.type || "external");
      
      console.log("[Kashier Iframe] Script data attributes:", {
        amount: config.amount,
        hash: config.hash.substring(0, 20) + "...",
        currency: config.currency,
        orderId: config.orderId,
        merchantId: config.merchantId,
        mode: config.mode,
        merchantRedirect: decodeURIComponent(config.merchantRedirect),
      });

      // Set optional attributes if provided
      if (config.description) {
        script.setAttribute("data-description", config.description);
      }
      if (config.serverWebhook) {
        // Decode serverWebhook before passing to script
        script.setAttribute("data-serverWebhook", decodeURIComponent(config.serverWebhook));
      }
      if (config.failureRedirect) {
        // Decode failureRedirect before passing to script
        script.setAttribute("data-failureRedirect", decodeURIComponent(config.failureRedirect));
      }
      if (config.redirectMethod) {
        script.setAttribute("data-redirectMethod", config.redirectMethod);
      }
      if (config.allowedMethods) {
        script.setAttribute("data-allowedMethods", config.allowedMethods);
      }
      if (config.defaultMethod) {
        script.setAttribute("data-defaultMethod", config.defaultMethod);
      }
      if (config.metaData) {
        script.setAttribute("data-metaData", config.metaData);
      }
      if (config.brandColor) {
        script.setAttribute("data-brandColor", config.brandColor);
      }
      if (config.manualCapture) {
        script.setAttribute("data-manualCapture", config.manualCapture);
      }
      if (config.customer) {
        script.setAttribute("data-customer", config.customer);
      }
      if (config.saveCard) {
        script.setAttribute("data-saveCard", config.saveCard);
      }
      if (config.interactionSource) {
        script.setAttribute("data-interactionSource", config.interactionSource);
      }
      if (config.enable3DS) {
        script.setAttribute("data-enable3DS", config.enable3DS);
      }
      if (config.paymentRequestId) {
        script.setAttribute("data-paymentRequestId", config.paymentRequestId);
      }
      if (config.connectedAccount) {
        script.setAttribute("data-connectedAccount", config.connectedAccount);
      }

      // Handle script load event
      script.onload = () => {
        console.log("[Kashier Iframe] Script loaded successfully");
        setScriptLoaded(true);
        
        // Check if iframe was created after a short delay
        setTimeout(() => {
          const iframe = document.querySelector('iframe[src*="kashier"]') || 
                        document.querySelector('iframe[src*="payments.kashier"]');
          if (iframe) {
            console.log("[Kashier Iframe] Iframe detected:", iframe);
          } else {
            console.warn("[Kashier Iframe] Script loaded but iframe not found. Check browser console for Kashier errors.");
          }
        }, 2000);
      };

      script.onerror = (error) => {
        console.error("[Kashier Iframe] Script failed to load:", error);
        setScriptLoaded(false);
      };

      // Append script to the payment container - Kashier script will automatically create the iframe here
      // Use a small delay to ensure the container is rendered
      const appendScript = () => {
        const container = containerRef.current || document.getElementById("kashier-payment-container");
        if (container) {
          container.appendChild(script);
          console.log("[Kashier Iframe] Script appended to container");
        } else {
          // Fallback to body if container not found
          document.body.appendChild(script);
          console.log("[Kashier Iframe] Script appended to body (container not found)");
        }
      };

      // Try immediately, or wait a bit if container not ready
      if (containerRef.current || document.getElementById("kashier-payment-container")) {
        appendScript();
      } else {
        setTimeout(appendScript, 100);
      }

      console.log("[Kashier Iframe] Script element created and appended with config:", config);
    } catch (error) {
      console.error("[Kashier Iframe] Error initializing payment:", error);
    }
  }, [configJson, scriptLoaded]);

  if (!configJson && !transactionId) {
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-red-600">
            {t("Payment configuration is required.", "تكوين الدفع مطلوب.")}
          </p>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">
            {t("Complete Your Payment", "أكمل عملية الدفع")}
          </h1>

          {/* Container for Kashier iframe */}
          <div 
            ref={containerRef}
            id="kashier-payment-container" 
            className="border rounded-lg overflow-hidden bg-white dark:bg-zinc-900 shadow-lg min-h-[600px]"
          >
            {!scriptLoaded && (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
                <p className="text-zinc-600 dark:text-zinc-400">
                  {t("Loading payment form...", "جارٍ تحميل نموذج الدفع...")}
                </p>
              </div>
            )}
            {/* Kashier iframe will be automatically created by the script inside this container */}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

export default function KashierIframePage() {
  return (
    <Suspense
      fallback={
        <SiteLayout>
          <div className="container mx-auto px-4 py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">
              Loading...
            </p>
          </div>
        </SiteLayout>
      }
    >
      <KashierIframeContent />
    </Suspense>
  );
}

