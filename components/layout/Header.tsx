"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { User } from "lucide-react";
import { UKFlag, EgyptFlag } from "@/components/ui/flags";

/**
 * Global header component for Sera Pro - سيرة برو
 * 
 * DEFAULT BEHAVIOR: Arabic (ar) with RTL layout
 * - Language toggle (AR/EN) is always visible in header, allowing users to switch at any time
 * - When user switches language, preference is saved to cookie + localStorage
 * - Navigation adapts to RTL/LTR direction automatically based on locale
 * 
 * Features:
 * - Brand logo/name with link to home
 * - Language toggle (AR/EN) using global locale context
 * - Smart navigation: shows auth buttons when logged out, user profile link when logged in
 * - Clicking user name/avatar navigates directly to /profile page (no dropdown menu)
 * - Mobile-responsive
 * - RTL/LTR support based on locale
 */
export function Header() {
  const { isAr, t, setLocale } = useLocale();
  const { user, loading } = useAuth();
  // State to handle logo image loading errors with fallback
  const [logoError, setLogoError] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-white dark:bg-black backdrop-blur-sm bg-opacity-95">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 md:px-10">
        {/* Brand logo/name - links to home */}
        {/* UPDATED: Now using high-resolution logo image with fallback to placeholder if image fails */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          {/* Logo image with fallback to colored placeholder if loading fails */}
          {logoError ? (
            // Fallback: Show colored placeholder if logo image fails to load
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-md flex-shrink-0" style={{ backgroundColor: "#0d47a1" }} />
          ) : (
            <div className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 relative">
              <Image
                src="/assets/images/sera_pro_logo_hd.png"
                alt="Sera Pro - سيرة برو Logo"
                width={48}
                height={48}
                className="h-full w-full object-contain"
                priority
                unoptimized
                onError={() => setLogoError(true)}
              />
            </div>
          )}
          <span className="text-base sm:text-lg font-semibold tracking-tight">
            Sera Pro - سيرة برو
          </span>
        </Link>

        {/* Right side: Navigation + Language toggle */}
        <div className="flex items-center gap-4">
          {/* Navigation links - adaptive based on auth state */}
          <nav className="hidden sm:flex items-center gap-4">
            {/* Home button - always visible */}
            <Button asChild variant="ghost" size="sm">
              <Link href="/">{t("Home", "الرئيسية")}</Link>
            </Button>
            {user ? (
              // Logged in: Show dashboard and CV builder links
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard">{t("Dashboard", "لوحة التحكم")}</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/create-cv">{t("Create CV", "إنشاء سيرة")}</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/pricing">{t("Pricing", "الأسعار")}</Link>
                </Button>
              </>
            ) : (
              // Not logged in: Show public navigation (guest users can access CV builder)
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/create-cv">{t("Create CV", "إنشاء سيرة")}</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/pricing">{t("Pricing", "الأسعار")}</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/auth">{t("Sign In", "تسجيل الدخول")}</Link>
                </Button>
              </>
            )}
          </nav>

          {/* User profile link (when logged in) - navigates directly to /profile page */}
          {!loading && user && (
            <Button 
              asChild 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-2"
            >
              <Link href="/profile" className="flex items-center gap-2">
                {/* User avatar or icon */}
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || user.email || "User"} 
                    className="h-6 w-6 rounded-full"
                  />
                ) : (
                  <User className="h-4 w-4" />
                )}
                {/* User name or email prefix */}
                <span className="hidden sm:inline">
                  {user.displayName || user.email?.split("@")[0] || t("Profile", "الملف الشخصي")}
                </span>
              </Link>
            </Button>
          )}

          {/* Modern Language Toggle - Segmented Control
              
              Features:
              - Smooth animated selection indicator (300ms transition)
              - Clear visual feedback: selected language highlighted in brand blue (#0d47a1)
              - Keyboard accessible: Arrow keys navigate, Enter/Space selects
              - Touch-friendly: Large tap targets (min 32px height) for mobile
              - Responsive: Adapts to window resize automatically
              - RTL-aware: Properly handles Arabic RTL layout and keyboard navigation
              - Positioned at header edge for maximum accessibility
              - Fully bilingual: Shows "English" and "العربية" with language icons
              
              Design:
              - Compact segmented control with rounded corners
              - White/dark background indicator slides smoothly between options
              - Active state uses brand color for text
              - Subtle shadow and border for depth
              - Icons provide visual context without cluttering
          */}
          <div 
            className="flex items-center"
            dir={isAr ? "rtl" : "ltr"}
            aria-label={t("Language selector", "محدد اللغة")}
          >
            <SegmentedControl
              options={[
                {
                  value: "en",
                  label: "English",
                  icon: <UKFlag className="h-3.5 w-5 flex-shrink-0" />,
                },
                {
                  value: "ar",
                  label: "العربية",
                  icon: <EgyptFlag className="h-3.5 w-5 flex-shrink-0" />,
                },
              ]}
              value={isAr ? "ar" : "en"}
              onChange={(val) => setLocale(val as "ar" | "en")}
              size="sm"
              ariaLabel={t("Select language", "اختر اللغة")}
              className="shadow-xs border-zinc-300 dark:border-zinc-700"
            />
          </div>
        </div>
      </div>
    </header>
  );
}

