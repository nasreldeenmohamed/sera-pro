"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/locale-context";
import { useAuth } from "@/lib/auth-context";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings } from "lucide-react";

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
 * - Smart navigation: shows auth buttons when logged out, user menu when logged in
 * - Mobile-responsive
 * - RTL/LTR support based on locale
 */
export function Header() {
  const { isAr, t, setLocale } = useLocale();
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white dark:bg-black backdrop-blur-sm bg-opacity-95">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 md:px-10">
        {/* Brand logo/name - links to home */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="h-8 w-8 rounded-md" style={{ backgroundColor: "#0d47a1" }} />
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

          {/* User menu (when logged in) */}
          {!loading && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user.email?.split("@")[0] || t("Account", "حساب")}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isAr ? "start" : "end"}>
                <DropdownMenuLabel>{t("My Account", "حسابي")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    {t("Dashboard", "لوحة التحكم")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/create-cv" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t("Create CV", "إنشاء سيرة")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 dark:text-red-400">
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("Sign Out", "تسجيل الخروج")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Language toggle - always visible, allows switching between Arabic (RTL) and English (LTR) */}
          <div className={`flex items-center gap-2 text-sm ${isAr ? "border-r pr-4 mr-2" : "border-l pl-4 ml-2"}`}>
            <span className="opacity-80 text-xs">EN</span>
            <Switch checked={isAr} onCheckedChange={(v) => setLocale(v ? "ar" : "en")} />
            <span className="opacity-80 text-xs">AR</span>
          </div>
        </div>
      </div>
    </header>
  );
}

