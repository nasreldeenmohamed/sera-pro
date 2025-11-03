import type { Metadata } from "next";
import { cookies } from "next/headers";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { LocaleProvider } from "@/lib/locale-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // App name reflects bilingual brand
  title: "Sera Pro - سيرة برو",
  description: "AI-powered Arabic-English CV builder with RTL support",
  // UPDATED: Added comprehensive favicon and icon configuration
  // Next.js App Router automatically detects app/favicon.ico, but metadata ensures proper display
  icons: {
    // Main favicon - browser tab icon (replaces app/favicon.ico when logo is uploaded)
    icon: [
      {
        url: "/assets/images/sera_pro_logo_hd.png",
        sizes: "any",
        type: "image/png",
      },
      // Fallback to favicon.ico if logo not yet uploaded
      {
        url: "/favicon.ico",
        sizes: "16x16 32x32",
        type: "image/x-icon",
      },
    ],
    // Apple touch icon for iOS home screen
    apple: [
      {
        url: "/assets/images/sera_pro_logo_hd.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    // Other icon sizes for different contexts
    shortcut: "/assets/images/sera_pro_logo_hd.png",
  },
  openGraph: {
    title: "Sera Pro - سيرة برو",
    description: "AI-powered Arabic-English CV builder with RTL support",
    images: ["/assets/images/sera_pro_logo_hd.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sera Pro - سيرة برو",
    description: "AI-powered Arabic-English CV builder with RTL support",
    images: ["/assets/images/sera_pro_logo_hd.png"],
  },
};

// Enable dynamic rendering to allow cookie access (Vercel supports this)
export const dynamic = "force-dynamic";

/**
 * Root Layout - Server Component
 * 
 * DEFAULT BEHAVIOR: Arabic (ar) with RTL layout
 * 
 * Read locale cookie set by middleware to control global lang/dir at <html>
 * - Defaults to 'ar' (Arabic) if cookie cannot be read or doesn't exist
 * - This ensures all new visitors get Arabic-first, RTL experience by default
 * - Users can switch to English via language toggle, which saves their preference
 * 
 * Note: This is a Server Component that reads cookies server-side.
 * For static export (Firebase), convert to Client Component.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let locale: "en" | "ar" = "ar"; // DEFAULT: Arabic
  try {
    const cookieStore = await cookies();
    const localeValue = cookieStore.get("locale")?.value;
    // If cookie exists and is explicitly 'en', use English; otherwise default to Arabic
    locale = localeValue === "en" ? "en" : "ar";
  } catch (error) {
    // Fallback to Arabic (default) if cookies cannot be read
    locale = "ar";
  }
  // Set direction based on locale: Arabic = RTL, English = LTR
  const dir = locale === "ar" ? "rtl" : "ltr";
  
  // Get Google Analytics tracking ID from environment variables
  // Falls back to default if env var not set (for immediate detection)
  const gaTrackingId = process.env.NEXT_PUBLIC_GA_TRACKING_ID || "G-CH35BN07M5";
  
  // Get Meta Pixel ID from environment variables
  // Falls back to default if env var not set
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || "847265357880267";
  
  return (
    <html lang={locale} dir={dir}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Meta Pixel (Facebook Pixel) - Sera Pro
          * Pixel ID: Configured via NEXT_PUBLIC_META_PIXEL_ID environment variable
          * Falls back to 847265357880267 if env var not set
          * 
          * Using 'afterInteractive' strategy for optimal performance.
          * Meta Pixel loads after page becomes interactive, which is sufficient
          * for tracking and won't block page rendering.
          * Next.js will inject this script appropriately in the document.
          * 
          * The noscript fallback ensures tracking works even without JavaScript.
          */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${metaPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
        
        {/* Google Analytics (GA4) - Sera Pro
          * Tracking ID: Configured via NEXT_PUBLIC_GA_TRACKING_ID environment variable
          * Falls back to G-CH35BN07M5 if env var not set
          * 
          * Using 'beforeInteractive' strategy ensures scripts are injected into <head>
          * before the page becomes interactive, which is required for GA4 detection.
          * This is the recommended approach for analytics scripts in Next.js App Router.
          */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${gaTrackingId}`}
          strategy="beforeInteractive"
        />
        <Script id="google-analytics" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaTrackingId}');
          `}
        </Script>
        
        <LocaleProvider initialLocale={locale}>
          <AuthProvider>{children}</AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
