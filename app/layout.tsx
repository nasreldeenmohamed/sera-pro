"use client";
import { useEffect, useState } from "react";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /**
   * DEFAULT BEHAVIOR: Arabic (ar) with RTL layout
   * 
   * For static export, we read locale from cookies client-side
   * - Defaults to 'ar' (Arabic) if cookie cannot be read or doesn't exist
   * - This ensures all new visitors get Arabic-first, RTL experience by default
   * - Users can switch to English via language toggle, which saves their preference
   */
  const [locale, setLocale] = useState<"en" | "ar">("ar"); // DEFAULT: Arabic
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Read locale from cookie client-side
    if (typeof document !== "undefined") {
      const cookies = document.cookie.split(";");
      const localeCookie = cookies.find((c) => c.trim().startsWith("locale="));
      const localeValue = localeCookie?.split("=")[1];
      if (localeValue === "en" || localeValue === "ar") {
        setLocale(localeValue);
      }
    }
  }, []);

  // Set direction based on locale: Arabic = RTL, English = LTR
  const dir = locale === "ar" ? "rtl" : "ltr";
  
  return (
    <html lang={locale} dir={dir}>
      <head>
        <title>Sera Pro - سيرة برو</title>
        <meta name="description" content="AI-powered Arabic-English CV builder with RTL support" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LocaleProvider initialLocale={locale}>
          <AuthProvider>{children}</AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
