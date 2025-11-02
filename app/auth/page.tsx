"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteLayout } from "@/components/layout/SiteLayout";

// Auth landing page that directs users to login or register
// Uses shared SiteLayout for consistent header/footer with smart navigation
// Handles redirect parameter and passes it to login/register pages
export default function AuthPage() {
  const { t } = useLocale();

  // Get redirect URL from query params to pass to login/register pages
  // This allows users to return to the original page (e.g., pricing) after authentication
  const [redirectQuery, setRedirectQuery] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      setRedirectQuery(redirect ? `?redirect=${encodeURIComponent(redirect)}` : "");
    }
  }, []);

  return (
    <SiteLayout>

      {/* Auth selection cards */}
      <section className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12 sm:px-6 md:px-10">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-semibold mb-2">
              {t("Get Started", "ابدأ الآن")}
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg">
              {t(
                "Sign in to your account or create a new one to start building your CV",
                "سجل الدخول إلى حسابك أو أنشئ حساباً جديداً لبدء إنشاء سيرتك الذاتية"
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Login Card */}
            <Card className="border-2 hover:border-[#0d47a1] transition-colors">
              <CardHeader>
                <CardTitle className="text-xl">
                  {t("Sign In", "تسجيل الدخول")}
                </CardTitle>
                <CardDescription>
                  {t("Access your existing account", "الوصول إلى حسابك الحالي")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {t(
                    "Sign in with email or Google to manage your CVs",
                    "سجل الدخول باستخدام البريد الإلكتروني أو جوجل لإدارة سيرك الذاتية"
                  )}
                </p>
                <Button
                  asChild
                  className="w-full text-white"
                  style={{ backgroundColor: "#0d47a1" }}
                >
                  <Link href={`/auth/login${redirectQuery}`}>{t("Sign In", "تسجيل الدخول")}</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Register Card */}
            <Card className="border-2 hover:border-[#d4af37] transition-colors">
              <CardHeader>
                <CardTitle className="text-xl">
                  {t("Create Account", "إنشاء حساب")}
                </CardTitle>
                <CardDescription>
                  {t("Start building your professional CV", "ابدأ بإنشاء سيرتك الذاتية الاحترافية")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {t(
                    "Create a free account and get started with your first CV",
                    "أنشئ حساباً مجانياً وابدأ بسيرتك الذاتية الأولى"
                  )}
                </p>
                <Button
                  asChild
                  className="w-full text-white"
                  style={{ backgroundColor: "#0d47a1" }}
                >
                  <Link href={`/auth/register${redirectQuery}`}>{t("Create Account", "إنشاء حساب")}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Additional links */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <Link href="/" className="underline hover:text-[#0d47a1]">
                {t("Back to Home", "العودة إلى الصفحة الرئيسية")}
              </Link>
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {t("Need help?", "تحتاج مساعدة؟")}{" "}
              <Link href="/pricing" className="underline hover:text-[#d4af37]">
                {t("See Pricing", "شاهد الأسعار")}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}


