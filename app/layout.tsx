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
  
  return (
    <html lang={locale} dir={dir}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
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
