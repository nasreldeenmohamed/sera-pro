"use client";
import { useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Info, Zap, Star, Crown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { UserPlan } from "@/firebase/firestore";

/**
 * Plan Cards Component
 * 
 * DEFAULT BEHAVIOR: Arabic (ar) with RTL layout, EGP currency
 * - All pricing displayed in EGP (Egyptian Pounds) - optimized for Egyptian market
 * - Supports both Arabic (RTL) and English (LTR) layouts
 * - Currency formatting and pricing are Egypt-friendly by default
 * 
 * Displays visually distinct payment plan options with clear descriptions,
 * pricing, benefits, and comparison features. Designed to help users
 * easily understand and choose the right plan for their needs.
 * 
 * Features:
 * - Visual distinction with icons and colored highlights
 * - Tooltips for additional information
 * - Clear pricing and feature lists
 * - Comparison between plans
 * - Mobile-responsive design
 * - Bilingual support (AR/EN)
 */

type PlanProduct = "one_time" | "flex_pack" | "annual_pass";

type PlanCardProps = {
  product: PlanProduct;
  currentPlan: UserPlan | null;
  onPurchase: (product: PlanProduct) => void;
};

export function PlanCards({ currentPlan, onPurchase }: { currentPlan: UserPlan | null; onPurchase: (product: PlanProduct) => void }) {
  const { isAr, t } = useLocale();

  const plans: Array<{
    product: PlanProduct;
    name: { en: string; ar: string };
    price: number;
    currency: string;
    description: { en: string; ar: string };
    icon: React.ReactNode;
    color: string;
    popular?: boolean;
    features: Array<{ en: string; ar: string; tooltip?: { en: string; ar: string } }>;
    highlights: Array<{ en: string; ar: string }>;
  }> = [
    {
      product: "one_time",
      name: { en: "Single CV Purchase", ar: "شراء سيرة واحدة" },
      price: 49,
      currency: "EGP",
      description: {
        en: "Perfect for one-time needs. Get a professional CV with 3 templates and 7 days of unlimited edits.",
        ar: "مثالي للاحتياجات لمرة واحدة. احصل على سيرة احترافية مع 3 قوالب و 7 أيام من التعديلات غير المحدودة.",
      },
      icon: <Zap className="h-5 w-5" />,
      color: "#0d47a1",
      features: [
        { en: "1 CV", ar: "سيرة واحدة" },
        { en: "3 Templates", ar: "3 قوالب" },
        { en: "Unlimited edits for 7 days", ar: "تعديلات غير محدودة لمدة 7 أيام", tooltip: { en: "You can edit and re-download your CV for 7 days after purchase", ar: "يمكنك تعديل وإعادة تنزيل سيرتك لمدة 7 أيام بعد الشراء" } },
      ],
      highlights: [
        { en: "One-time payment", ar: "دفعة واحدة" },
        { en: "No subscription", ar: "بدون اشتراك" },
      ],
    },
    {
      product: "flex_pack",
      name: { en: "Flex Pack", ar: "باقة مرنة" },
      price: 5, // TEMPORARY: Changed from 149 to 5 for testing
      currency: "EGP",
      description: {
        en: "Great value for multiple CVs. Create up to 5 professional CVs with credits valid for 6 months.",
        ar: "قيمة ممتازة لعدة سير. أنشئ حتى 5 سير احترافية برصيد صالح لمدة 6 أشهر.",
      },
      icon: <Star className="h-5 w-5" />,
      color: "#d4af37",
      popular: true,
      features: [
        { en: "5 CV credits (wallet system)", ar: "رصيد 5 سير (نظام محفظة)", tooltip: { en: "Use credits anytime within 6 months. Each CV export uses 1 credit.", ar: "استخدم الرصيد في أي وقت خلال 6 أشهر. كل تصدير لسيرة يستخدم رصيد واحد." } },
        { en: "Valid for 6 months", ar: "صالح لمدة 6 أشهر" },
        { en: "All premium templates", ar: "جميع القوالب المميزة" },
        { en: "AI enhancement included", ar: "التحسين بالذكاء الاصطناعي متضمن" },
        { en: "No watermark PDFs", ar: "ملفات PDF بدون علامة مائية" },
      ],
      highlights: [
        { en: "Best value", ar: "أفضل قيمة" },
        { en: "Flexible usage", ar: "استخدام مرن" },
      ],
    },
    {
      product: "annual_pass",
      name: { en: "Annual Pass", ar: "البطاقة السنوية" },
      price: 299,
      currency: "EGP",
      description: {
        en: "Unlimited CVs for power users. Create as many CVs as you need for a full year with all premium features.",
        ar: "سير غير محدودة للمستخدمين المحترفين. أنشئ عددًا غير محدود من السير لمدة سنة كاملة مع جميع الميزات المميزة.",
      },
      icon: <Crown className="h-5 w-5" />,
      color: "#9c27b0",
      features: [
        { en: "Unlimited CVs", ar: "سير غير محدودة", tooltip: { en: "Create and download as many CVs as you want throughout the year", ar: "أنشئ ونزّل عددًا غير محدود من السير على مدار السنة" } },
        { en: "Valid for 1 year", ar: "صالح لمدة سنة واحدة" },
        { en: "All premium templates + future templates", ar: "جميع القوالب المميزة + القوالب المستقبلية" },
        { en: "Priority AI enhancement", ar: "أولوية في التحسين بالذكاء الاصطناعي" },
        { en: "Advanced export options", ar: "خيارات تصدير متقدمة", tooltip: { en: "Multiple formats, custom branding options", ar: "صيغ متعددة، خيارات تخصيص العلامة التجارية" } },
        { en: "Priority support", ar: "دعم ذو أولوية" },
      ],
      highlights: [
        { en: "Unlimited", ar: "غير محدود" },
        { en: "All features", ar: "جميع الميزات" },
      ],
    },
  ];

  const isCurrentPlan = (product: PlanProduct) => {
    if (!currentPlan) return false;
    return currentPlan.planType === product;
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => {
        const isCurrent = isCurrentPlan(plan.product);
        const isUpgrade =
          currentPlan &&
          currentPlan.planType !== "free" &&
          !isCurrent &&
          ((plan.product === "annual_pass") ||
            (plan.product === "flex_pack" && currentPlan.planType === "one_time"));

        return (
          <Card
            key={plan.product}
            className={`relative transition-all hover:shadow-lg ${
              plan.popular ? "ring-2" : ""
            }`}
            style={plan.popular ? { 
              "--tw-ring-color": plan.color + "40",
              borderColor: plan.color + "40"
            } as React.CSSProperties : {}}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div
                className={`absolute ${isAr ? "left-4" : "right-4"} -top-3`}
              >
                <Badge
                  className="px-3 py-1 font-semibold"
                  style={{ backgroundColor: plan.color, color: "#ffffff" }}
                >
                  {t("Most Popular", "الأكثر شعبية")}
                </Badge>
              </div>
            )}

            {/* Current Plan Badge */}
            {isCurrent && (
              <div
                className={`absolute ${isAr ? "right-4" : "left-4"} top-4`}
              >
                <Badge variant="secondary" className="px-2 py-1 text-xs">
                  {t("Current Plan", "الخطة الحالية")}
                </Badge>
              </div>
            )}

            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: plan.color + "20", color: plan.color }}
                >
                  {plan.icon}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl">{t(plan.name.en, plan.name.ar)}</CardTitle>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-bold" style={{ color: plan.color }}>
                      {plan.price}
                    </span>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {plan.currency}
                    </span>
                  </div>
                </div>
              </div>
              <CardDescription className="text-sm mt-2">
                {t(plan.description.en, plan.description.ar)}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Highlights */}
              <div className="flex flex-wrap gap-2">
                {plan.highlights.map((highlight, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="text-xs"
                    style={{ borderColor: plan.color + "40", color: plan.color }}
                  >
                    {t(highlight.en, highlight.ar)}
                  </Badge>
                ))}
              </div>

              {/* Features List */}
              <ul className="space-y-2">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check
                      className="h-4 w-4 flex-shrink-0 mt-0.5"
                      style={{ color: plan.color }}
                    />
                    <div className="flex-1 flex items-center gap-1">
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {t(feature.en, feature.ar)}
                      </span>
                      {feature.tooltip && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center"
                              aria-label={t("More info", "مزيد من المعلومات")}
                            >
                              <Info className="h-3 w-3 text-zinc-400 hover:text-zinc-600" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs max-w-xs">
                              {t(feature.tooltip.en, feature.tooltip.ar)}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {/* Action Button */}
              <Button
                onClick={() => onPurchase(plan.product)}
                disabled={isCurrent}
                className="w-full text-white font-semibold"
                style={{
                  backgroundColor: isCurrent ? "#9e9e9e" : plan.color,
                  cursor: isCurrent ? "not-allowed" : "pointer",
                }}
              >
                {isCurrent
                  ? t("Current Plan", "الخطة الحالية")
                  : isUpgrade
                  ? t("Upgrade Now", "ترقية الآن")
                  : t("Buy Now", "اشترِ الآن")}
              </Button>

              {/* Comparison Note */}
              {plan.product === "one_time" && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center mt-2">
                  {t(
                    "vs Free: No watermark, premium templates, AI enhancement",
                    "مقارنة بالمجانية: بدون علامة مائية، قوالب مميزة، تحسين بالذكاء الاصطناعي"
                  )}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
