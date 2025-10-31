"use client";
import { useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, CheckCircle2 } from "lucide-react";

/**
 * Language Selector Component for CV Builder
 * 
 * Allows users to choose the language in which they want to create their CV.
 * This is separate from the UI locale - it determines the content language,
 * text direction (RTL/LTR), and field labels/placeholders throughout the CV builder.
 * 
 * Implementation Details:
 * - Displays clear language options (Arabic/English) with descriptions
 * - Sets the initial CV language preference
 * - Persists selection to form state
 * - Provides visual feedback on selection
 * 
 * Future Extensibility:
 * - Add more languages (French, etc.)
 * - Add bilingual CV option (both languages in one CV)
 * - Auto-detect language from imported data
 */
type LanguageSelectorProps = {
  selectedLanguage: "ar" | "en";
  onSelect: (language: "ar" | "en") => void;
  onNext: () => void;
};

export function LanguageSelector({ selectedLanguage, onSelect, onNext }: LanguageSelectorProps) {
  const { isAr: isUILocaleAr, t } = useLocale();

  // Language options with descriptions
  const languages = [
    {
      code: "ar" as const,
      name: { en: "Arabic", ar: "العربية" },
      description: {
        en: "Create your CV in Arabic with right-to-left text direction. Perfect for Arabic-speaking markets and employers.",
        ar: "أنشئ سيرتك الذاتية بالعربية مع اتجاه النص من اليمين لليسار. مثالي للأسواق وأصحاب العمل الناطقين بالعربية.",
      },
      flag: "🇸🇦",
    },
    {
      code: "en" as const,
      name: { en: "English", ar: "الإنجليزية" },
      description: {
        en: "Create your CV in English with left-to-right text direction. Ideal for international opportunities and English-speaking markets.",
        ar: "أنشئ سيرتك الذاتية بالإنجليزية مع اتجاه النص من اليسار لليمين. مثالي للفرص الدولية والأسواق الناطقة بالإنجليزية.",
      },
      flag: "🇬🇧",
    },
  ];

  return (
    <div className="space-y-6">
      <header className="text-center">
        <h2 className="text-2xl font-semibold">
          {t("Select CV Language", "اختر لغة السيرة الذاتية")}
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          {t(
            "Choose the language you want to use for your CV content. This will determine text direction, field labels, and preview styling.",
            "اختر اللغة التي تريد استخدامها لمحتوى سيرتك الذاتية. سيحدد هذا اتجاه النص وتسميات الحقول وتنسيق المعاينة."
          )}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {languages.map((lang) => {
          const isSelected = selectedLanguage === lang.code;
          const langIsAr = lang.code === "ar";

          return (
            <Card
              key={lang.code}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                isSelected
                  ? "border-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-950"
                  : "border hover:border-zinc-300 dark:hover:border-zinc-700"
              }`}
              onClick={() => onSelect(lang.code)}
              dir={langIsAr ? "rtl" : "ltr"}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{lang.flag}</span>
                    <CardTitle className="text-xl">
                      {t(lang.name.en, lang.name.ar)}
                    </CardTitle>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {t(lang.description.en, lang.description.ar)}
                </CardDescription>
                <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <Globe className="h-4 w-4" />
                  <span>
                    {t(
                      `Text direction: ${langIsAr ? "Right to Left" : "Left to Right"}`,
                      `اتجاه النص: ${langIsAr ? "من اليمين لليسار" : "من اليسار لليمين"}`
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={onNext}
          className="text-white"
          style={{ backgroundColor: "#0d47a1" }}
          disabled={!selectedLanguage}
        >
          {t("Continue", "متابعة")} →
        </Button>
      </div>
    </div>
  );
}

