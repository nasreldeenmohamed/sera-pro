"use client";
import { useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

/**
 * Template Selector Component
 * 
 * Displays visual previews of available CV templates and allows users to select one.
 * Template selection happens before data entry to show users how their CV will look.
 * 
 * Future extensibility:
 * - Add more template preview images
 * - Add template categories (modern, classic, creative, etc.)
 * - Add template preview rendering with sample data
 * - Add template customization options (colors, fonts, layouts)
 */
type Template = {
  key: string;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  preview: string; // Path to preview image or component
  popular?: boolean;
};

const templates: Template[] = [
  {
    key: "classic",
    name: { en: "Classic", ar: "كلاسيك" },
    description: {
      en: "Traditional, professional layout perfect for any industry",
      ar: "تصميم تقليدي احترافي مثالي لأي صناعة",
    },
    preview: "/templates/classic-preview.png", // TODO: Add actual preview images
    popular: false,
  },
  {
    key: "modern",
    name: { en: "Modern", ar: "حديث" },
    description: {
      en: "Clean, contemporary design with emphasis on readability",
      ar: "تصميم نظيف ومعاصر يركز على سهولة القراءة",
    },
    preview: "/templates/modern-preview.png",
    popular: true,
  },
  {
    key: "elegant",
    name: { en: "Elegant", ar: "أنيق" },
    description: {
      en: "Sophisticated layout with subtle design elements",
      ar: "تصميم راقي بعناصر تصميمية دقيقة",
    },
    preview: "/templates/elegant-preview.png",
    popular: false,
  },
];

type TemplateSelectorProps = {
  selectedTemplate: string;
  onSelect: (templateKey: string) => void;
  onNext: () => void;
  onSkip?: () => void;
};

export function TemplateSelector({
  selectedTemplate,
  onSelect,
  onNext,
  onSkip,
}: TemplateSelectorProps) {
  const { isAr, t } = useLocale();

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold mb-2">
          {t("Choose Your CV Template", "اختر قالب سيرتك الذاتية")}
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          {t(
            "Select a template style that matches your professional field. You can change this later.",
            "اختر نمط قالب يتناسب مع مجال عملك. يمكنك تغيير هذا لاحقًا."
          )}
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map((template) => {
          const isSelected = selectedTemplate === template.key;

          return (
            <Card
              key={template.key}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                isSelected
                  ? "ring-2 ring-blue-600 border-blue-600"
                  : "hover:border-blue-300"
              }`}
              onClick={() => onSelect(template.key)}
            >
              <CardHeader className="relative">
                {/* Popular Badge */}
                {template.popular && (
                  <div className="absolute top-2 right-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-1 rounded-full">
                    {t("Popular", "الأكثر شعبية")}
                  </div>
                )}
                {/* Selected Check */}
                {isSelected && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white rounded-full p-1">
                    <Check className="h-4 w-4" />
                  </div>
                )}
                {/* Preview Image Placeholder */}
                <div className="aspect-[3/4] bg-zinc-100 dark:bg-zinc-800 rounded-md flex items-center justify-center mb-3">
                  <div className="text-center text-zinc-400 text-sm">
                    {t("Template Preview", "معاينة القالب")}
                    {/* TODO: Replace with actual template preview image */}
                    {/* <Image
                      src={template.preview}
                      alt={t(template.name.en, template.name.ar)}
                      width={300}
                      height={400}
                      className="rounded-md object-cover"
                    /> */}
                  </div>
                </div>
                <CardTitle className="text-lg">
                  {t(template.name.en, template.name.ar)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {t(template.description.en, template.description.ar)}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4">
        {onSkip && (
          <Button variant="ghost" onClick={onSkip}>
            {t("Skip", "تخطي")}
          </Button>
        )}
        <Button
          onClick={onNext}
          disabled={!selectedTemplate}
          className="text-white ml-auto"
          style={{ backgroundColor: "#0d47a1" }}
        >
          {t("Continue", "متابعة")} →
        </Button>
      </div>
    </div>
  );
}

