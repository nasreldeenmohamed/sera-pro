"use client";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Check } from "lucide-react";

// Bilingual Landing Page for "Sera Pro - سيرة برو"
// - Mobile-first, professional palette (blue/gold)
// - shadcn/ui Buttons, semantic sections
// - Uses shared SiteLayout for consistent header/footer
export default function Home() {
  // Global locale context (cookie + localStorage persistence)
  const { isAr, t } = useLocale();

  return (
    <SiteLayout>
      {/* Hero section: catchy bilingual headline, benefits, CTAs */}
      <section className="px-4 sm:px-6 md:px-10">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 py-8 sm:py-12 md:py-16 lg:grid-cols-2">
          <div className="space-y-4 text-start">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight">
              {t(
                "AI-powered CVs that get interviews",
                "سير ذاتية مدعومة بالذكاء الاصطناعي تحصل لك على مقابلات"
              )}
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg">
              {t(
                "Build ATS-optimized resumes in English and Arabic. Smart suggestions, professional templates, and one-click PDF.",
                "أنشئ سيرة ذاتية متوافقة مع أنظمة تتبع المتقدمين باللغتين العربية والإنجليزية، مع اقتراحات ذكية وقوالب احترافية وتصدير PDF بنقرة واحدة."
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Direct access to CV builder - no authentication required (guest mode) */}
              <Button asChild className="text-white" style={{ backgroundColor: "#0d47a1" }}>
                <Link href="/create-cv">{t("Create Free CV", "أنشئ سيرة مجانية")}</Link>
              </Button>
              <Button asChild variant="secondary" style={{ borderColor: "#d4af37" }}>
                <Link href="/pricing">{t("See Pricing", "الأسعار")}</Link>
              </Button>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              {t(
                "Start building instantly — sign in only when you're ready to save or download",
                "ابدأ البناء فورًا — سجّل الدخول فقط عندما تكون جاهزًا للحفظ أو التنزيل"
              )}
            </p>
            <ul className="mt-4 grid grid-cols-1 gap-2 text-sm text-zinc-700 dark:text-zinc-300 sm:grid-cols-2">
              {/* Key benefits bullets */}
              {[t("AI suggestions", "اقتراحات بالذكاء الاصطناعي"), t("ATS-optimized", "متوافق مع أنظمة التتبع"), t("Arabic & English", "عربي وإنجليزي"), t("One‑click PDF", "تصدير PDF بنقرة")].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4" style={{ color: "#d4af37" }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Replace with bilingual SVG mockups; swap based on language */}
          <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-xl border bg-white shadow-sm">
            <Image
              src={isAr ? "/mockup-ar.svg" : "/mockup-en.svg"}
              alt={isAr ? "واجهة عربية" : "English interface"}
              width={640}
              height={400}
              priority
            />
          </div>
        </div>
      </section>

      {/* Pricing Plans: Updated business model (Free, One-Time, Flex Pack, Annual Pass)
          Notes:
          - Checkout integration will pass a product key via query to API (to be implemented)
          - Flex Pack uses wallet/credits; One-Time grants 14-day edit window; Annual unlocks pro tools
      */}
      <section className="px-4 py-10 sm:px-6 md:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold text-start">
            {t("Pricing Plans", "خطط الأسعار")}
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 text-start">
            {t(
              "Sera Pro charges per CV or power-user access — affordable for Egypt.",
              "سيرة برو تُحاسب لكل سيرة أو على وصول للمستخدمين المحترفين — أسعار مناسبة للسوق المحلي."
            )}
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Free */}
            <div className="rounded-xl border p-6">
              <h3 className="text-lg font-semibold">{t("Free", "مجانية")}</h3>
              <p className="mt-1 text-3xl font-bold">EGP 0</p>
              <ul className="mt-4 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                {[t("1 basic CV", "سيرة أساسية واحدة"), t("2 templates", "قالبان"), t("Watermarked PDF", "ملف PDF بعلامة مائية")].map((f) => (
                  <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4" /><span>{f}</span></li>
                ))}
              </ul>
              <Button asChild className="mt-6 w-full text-white" style={{ backgroundColor: "#0d47a1" }}>
                <Link href="/create-cv">{t("Create Free CV", "أنشئ سيرة مجانية")}</Link>
              </Button>
            </div>

            {/* One-Time Purchase */}
            <div className="rounded-xl border p-6 ring-1" style={{ borderColor: "#d4af37", boxShadow: "0 0 0 1px #d4af37 inset" }}>
              <h3 className="text-lg font-semibold">{t("One-Time Purchase", "شراء لمرة واحدة")}</h3>
              <p className="mt-1 text-3xl font-bold">EGP 49–79</p>
              <ul className="mt-4 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                {[t("Per CV, AI‑enhanced, ATS‑optimized", "لكل سيرة، محسنة بالذكاء الاصطناعي ومتوافقة مع أنظمة التتبع"), t("10+ templates", "أكثر من 10 قوالب"), t("Unlimited edits for 14 days", "تعديلات غير محدودة لمدة 14 يومًا"), t("No watermark", "بدون علامة مائية")].map((f) => (
                  <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4" /><span>{f}</span></li>
                ))}
              </ul>
              {/* TODO(payment): At checkout, select 49 or 79 tier based on template group */}
              <Button asChild className="mt-6 w-full text-white" style={{ backgroundColor: "#0d47a1" }}>
                <Link href="/api/payments/kashier/checkout?product=one_time">{t("Buy CV", "شراء سيرة")}</Link>
              </Button>
            </div>

            {/* Flex Pack */}
            <div className="rounded-xl border p-6">
              <h3 className="text-lg font-semibold">{t("Flex Pack", "باقة مرنة")}</h3>
              <p className="mt-1 text-3xl font-bold">EGP 149</p>
              <ul className="mt-4 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                {[t("5 CVs credits (wallet)", "رصيد 5 سير (محفظة)"), t("Valid for 6 months", "صالحة لمدة 6 أشهر"), t("AI + templates included", "ذكاء اصطناعي + قوالب")].map((f) => (
                  <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4" /><span>{f}</span></li>
                ))}
              </ul>
              {/* TODO(wallet): Deduct 1 credit per exported CV, show balance in dashboard */}
              <Button asChild className="mt-6 w-full text-white" style={{ backgroundColor: "#0d47a1" }}>
                <Link href="/api/payments/kashier/checkout?product=flex_pack">{t("Get Flex Pack", "شراء الباقة المرنة")}</Link>
              </Button>
            </div>

            {/* Annual Pass */}
            <div className="rounded-xl border p-6">
              <h3 className="text-lg font-semibold">{t("Annual Pass", "البطاقة السنوية")}</h3>
              <p className="mt-1 text-3xl font-bold">EGP 299/{t("year", "سنة")}</p>
              <ul className="mt-4 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                {[t("Unlimited CVs", "سير غير محدودة"), t("Cover letter & LinkedIn tools", "أدوات خطاب التغطية ولينكدإن"), t("Access future features", "الوصول للميزات المستقبلية")].map((f) => (
                  <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4" /><span>{f}</span></li>
                ))}
              </ul>
              {/* TODO(access): Grant pro scope; renew yearly; show renewal date */}
              <Button asChild className="mt-6 w-full text-white" style={{ backgroundColor: "#0d47a1" }}>
                <Link href="/api/payments/kashier/checkout?product=annual_pass">{t("Get Annual Pass", "الحصول على البطاقة السنوية")}</Link>
              </Button>
            </div>
          </div>

          {/* FAQ / Explanatory text for model */}
          <div className="mt-8 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
            <p>
              {t(
                "Pay per actual CV, or choose a pack/pass for power users. Pricing is optimized for the Egyptian market.",
                "ادفع مقابل السيرة الفعلية، أو اختر باقة/بطاقة سنوية للمستخدمين المحترفين. التسعير مناسب للسوق المصري."
              )}
            </p>
            <ul className="list-disc pl-5">
              <li>{t("One-Time grants 14 days of unlimited edits for that CV.", "الشراء لمرة واحدة يمنح 14 يومًا من التعديلات غير المحدودة لتلك السيرة.")}</li>
              <li>{t("Flex Pack adds a wallet with CV credits you can spend anytime.", "الباقة المرنة تضيف محفظة برصيد سير يمكنك استخدامه في أي وقت.")}</li>
              <li>{t("Annual Pass unlocks pro tools and future features.", "البطاقة السنوية تفتح أدوات احترافية وميزات مستقبلية.")}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="px-4 py-10 sm:px-6 md:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold text-start">{t("Features", "المميزات")}</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              t("AI CV analysis", "تحليل السيرة بالذكاء الاصطناعي"),
              t("Professional templates", "قوالب احترافية"),
              t("PDF download", "تنزيل PDF"),
              t("Kashier payments", "مدفوعات كاشير"),
            ].map((feat) => (
              <div key={feat} className="rounded-xl border p-5 text-start">
                <div className="h-8 w-8 rounded-md" style={{ backgroundColor: "#d4af37" }} />
                <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">{feat}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="px-4 py-10 sm:px-6 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 rounded-2xl border p-6 text-center sm:flex-row sm:text-start" style={{ backgroundColor: "#0d47a1" }}>
          <div className="space-y-1 text-white">
            <h3 className="text-xl font-semibold">
              {t("Ready to craft your standout CV?", "جاهز لإنشاء سيرتك المتميزة؟")}
            </h3>
            <p className="text-sm opacity-90">
              {t("Start free, upgrade anytime.", "ابدأ مجانًا ويمكنك الترقية لاحقًا.")}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="text-black" style={{ backgroundColor: "#d4af37" }}>
              <Link href="/create-cv">{t("Start Now", "ابدأ الآن")}</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/auth">{t("Sign In", "تسجيل الدخول")}</Link>
            </Button>
          </div>
        </div>
      </section>

    </SiteLayout>
  );
}
