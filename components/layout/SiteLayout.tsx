"use client";
import { useLocale } from "@/lib/locale-context";
import { Header } from "./Header";
import { Footer } from "./Footer";

/**
 * Site-wide layout wrapper component
 * 
 * Provides consistent header and footer across all pages.
 * Handles:
 * - RTL/LTR direction based on locale
 * - Global theme consistency
 * - Mobile responsiveness
 * 
 * Usage:
 * Wrap page content with <SiteLayout>...</SiteLayout>
 * The header adapts automatically based on auth state (see Header.tsx)
 */
export function SiteLayout({ children }: { children: React.ReactNode }) {
  const { isAr } = useLocale();

  return (
    <div className="min-h-screen bg-white dark:bg-black" dir={isAr ? "rtl" : "ltr"}>
      <Header />
      <main className="min-h-[calc(100vh-200px)]">
        {children}
      </main>
      <Footer />
    </div>
  );
}

