import type { Metadata } from "next";
import { cookies } from "next/headers";
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

// Force dynamic rendering to allow cookie access
export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read locale cookie set by middleware to control global lang/dir at <html>
  // Default to 'en' if cookie cannot be read
  let locale: "en" | "ar" = "en";
  try {
    const cookieStore = await cookies();
    const localeValue = cookieStore.get("locale")?.value;
    locale = localeValue === "ar" ? "ar" : "en";
  } catch (error) {
    // Fallback to 'en' if cookies cannot be read
    locale = "en";
  }
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <html lang={locale} dir={dir}>
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
