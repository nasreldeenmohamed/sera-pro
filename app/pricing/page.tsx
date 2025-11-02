"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useLocale } from "@/lib/locale-context";
import { PlanActionButton } from "@/components/payments/PlanActionButton";
import { Check } from "lucide-react";

/**
 * Pricing Page
 * 
 * Shows all 4 plans: Free, One-Time Purchase, Flex Pack, Annual Pass
 * Uses shared SiteLayout for consistent header/footer
 * Uses PlanActionButton component for unified action handling across Home and Pricing pages
 * 
 * All plan action buttons now share the same logic:
 * - Free: Navigate to CV builder (no auth required)
 * - Paid plans: Check authentication, redirect to login if needed, then proceed with purchase
 */
export default function PricingPage() {
  const { isAr, t } = useLocale();

  return (
    <SiteLayout>
      <section className="px-4 py-10 sm:px-6 md:px-10">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-semibold">
              {t("Pricing Plans", "خطط الأسعار")}
            </h1>
            <p className="mt-3 text-base sm:text-lg text-zinc-600 dark:text-zinc-400">
              {t(
                "Sera Pro charges per CV or power-user access — affordable for Egypt.",
                "سيرة برو تُحاسب لكل سيرة أو على وصول للمستخدمين المحترفين — أسعار مناسبة للسوق المحلي."
              )}
            </p>
          </div>

          {/* Pricing Cards Grid */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Free Plan */}
            <div className="rounded-xl border p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold">{t("Free", "مجانية")}</h3>
              <p className="mt-1 text-3xl font-bold">EGP 0</p>
              {/* Free Plan: Updated to show 3 templates (updated from 2 templates) */}
              <ul className="mt-4 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                {[
                  t("1 basic CV", "سيرة أساسية واحدة"),
                  t("3 templates", "3 قوالب"),
                  t("Watermarked PDF", "ملف PDF بعلامة مائية"),
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 flex-shrink-0" style={{ color: "#d4af37" }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {/* Free plan: Navigate to CV builder (no authentication required) */}
              <PlanActionButton
                product="free"
                returnUrl="/pricing"
              />
            </div>

            {/* One-Time Purchase Plan
                Updated plan details (2024):
                - Price: EGP 49 (fixed price, no longer variable)
                - Features: 1 CV, 3 Templates, Unlimited Edits for 7 days
                - Simplified offering for single CV creation needs
            */}
            <div
              className="rounded-xl border p-6 ring-1 hover:shadow-md transition-shadow"
              style={{
                borderColor: "#d4af37",
                boxShadow: "0 0 0 1px #d4af37 inset",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold">
                  {t("One-Time Purchase", "شراء لمرة واحدة")}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                  {t("Popular", "الأكثر شعبية")}
                </span>
              </div>
              <p className="mt-1 text-3xl font-bold">EGP 49</p>
              <ul className="mt-4 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                {[
                  t("1 CV", "سيرة واحدة"),
                  t("3 Templates", "3 قوالب"),
                  t(
                    "Unlimited edits for 7 days",
                    "تعديلات غير محدودة لمدة 7 أيام"
                  ),
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 flex-shrink-0" style={{ color: "#d4af37" }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {/* One-Time Purchase: Requires authentication, then initiates purchase flow */}
              <PlanActionButton
                product="one_time"
                returnUrl="/pricing"
              />
            </div>

            {/* Flex Pack */}
            <div className="rounded-xl border p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold">{t("Flex Pack", "باقة مرنة")}</h3>
              <p className="mt-1 text-3xl font-bold">EGP 149</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                {t("6 months validity", "صالح لمدة 6 أشهر")}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                {[
                  t("5 CVs credits (wallet)", "رصيد 5 سير (محفظة)"),
                  t("Valid for 6 months", "صالحة لمدة 6 أشهر"),
                  t("AI + templates included", "ذكاء اصطناعي + قوالب"),
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 flex-shrink-0" style={{ color: "#d4af37" }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {/* Flex Pack: Requires authentication, then initiates pack purchase workflow */}
              <PlanActionButton
                product="flex_pack"
                returnUrl="/pricing"
              />
            </div>

            {/* Annual Pass */}
            <div className="rounded-xl border p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold">
                {t("Annual Pass", "البطاقة السنوية")}
              </h3>
              <p className="mt-1 text-3xl font-bold">
                EGP 299/<span className="text-lg">{t("year", "سنة")}</span>
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                {t("Best value", "أفضل قيمة")}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                {[
                  t("Unlimited CVs", "سير غير محدودة"),
                  t(
                    "Cover letter & LinkedIn tools",
                    "أدوات خطاب التغطية ولينكدإن"
                  ),
                  t(
                    "Access future features",
                    "الوصول للميزات المستقبلية"
                  ),
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 flex-shrink-0" style={{ color: "#d4af37" }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {/* Annual Pass: Requires authentication, then initiates subscription purchase workflow */}
              <PlanActionButton
                product="annual_pass"
                returnUrl="/pricing"
              />
            </div>
          </div>

          {/* FAQ / Explanatory text */}
          <div className="mt-12 rounded-xl border p-6 bg-zinc-50 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold mb-4">
              {t("How it works", "كيف يعمل")}
            </h3>
            <div className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
              <p>
                {t(
                  "Pay per actual CV, or choose a pack/pass for power users. Pricing is optimized for the Egyptian market.",
                  "ادفع مقابل السيرة الفعلية، أو اختر باقة/بطاقة سنوية للمستخدمين المحترفين. التسعير مناسب للسوق المصري."
                )}
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  {t(
                    "One-Time grants 7 days of unlimited edits for that CV.",
                    "الشراء لمرة واحدة يمنح 7 أيام من التعديلات غير المحدودة لتلك السيرة."
                  )}
                </li>
                <li>
                  {t(
                    "Flex Pack adds a wallet with CV credits you can spend anytime.",
                    "الباقة المرنة تضيف محفظة برصيد سير يمكنك استخدامه في أي وقت."
                  )}
                </li>
                <li>
                  {t(
                    "Annual Pass unlocks pro tools and future features.",
                    "البطاقة السنوية تفتح أدوات احترافية وميزات مستقبلية."
                  )}
                </li>
              </ul>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-10 rounded-2xl border p-8 text-center" style={{ backgroundColor: "#0d47a1" }}>
            <h3 className="text-xl font-semibold text-white mb-2">
              {t(
                "Ready to craft your standout CV?",
                "جاهز لإنشاء سيرتك المتميزة؟"
              )}
            </h3>
            <p className="text-sm text-white opacity-90 mb-6">
              {t("Start free, upgrade anytime.", "ابدأ مجانًا ويمكنك الترقية لاحقًا.")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                asChild
                className="text-black"
                style={{ backgroundColor: "#d4af37" }}
              >
                <Link href="/create-cv">{t("Start Now", "ابدأ الآن")}</Link>
              </Button>
              <Button asChild variant="secondary" className="bg-white text-black hover:bg-zinc-100">
                <Link href="/auth">{t("Sign In", "تسجيل الدخول")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}


