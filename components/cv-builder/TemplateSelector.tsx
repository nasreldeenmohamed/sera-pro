"use client";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, Lock } from "lucide-react";
import { TEMPLATES, hasTemplateAccess, getUpgradeMessage, type Template } from "@/lib/templates";
import type { UserPlan } from "@/firebase/firestore";

/**
 * Template Selector Component
 * 
 * Displays visual previews of available CV templates and allows users to select one.
 * Template selection happens before data entry to show users how their CV will look.
 * 
 * Features:
 * - Shows all templates with visual previews
 * - Locks premium templates for free users
 * - Shows lock icons and upgrade tooltips for locked templates
 * - Prompts upgrade when clicking locked templates
 * - Organizes templates by access level
 * 
 * Future extensibility:
 * - Add actual template preview images/thumbnails
 * - Add template filtering by category
 * - Add template search functionality
 * - Add template preview rendering with sample data
 * - Add template customization options (colors, fonts, layouts)
 */
type TemplateSelectorProps = {
  selectedTemplate: string;
  onSelect: (templateKey: string) => void;
  onNext: () => void;
  onSkip?: () => void;
  userPlan?: UserPlan | null;
  onUpgrade?: () => void; // Callback when user tries to select locked template
};

export function TemplateSelector({
  selectedTemplate,
  onSelect,
  onNext,
  onSkip,
  userPlan = null,
  onUpgrade,
}: TemplateSelectorProps) {
  const { isAr, t } = useLocale();

  // Check template access and handle locked templates
  const handleTemplateClick = (template: Template) => {
    const hasAccess = hasTemplateAccess(template, userPlan);
    
    if (!hasAccess) {
      // Show upgrade prompt
      if (onUpgrade) {
        onUpgrade();
      } else {
        // Fallback: show alert
        alert(getUpgradeMessage(template, isAr));
      }
      return;
    }

    // Allow selection
    onSelect(template.key);
  };

  // Separate templates by access level for better organization
  const basicTemplates = TEMPLATES.filter((t) => t.accessLevel === "basic");
  const premiumTemplates = TEMPLATES.filter((t) => t.accessLevel === "premium");

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
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

      {/* Basic Templates Section */}
      {basicTemplates.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
            {t("Basic Templates", "القوالب الأساسية")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {basicTemplates.map((template) => {
              const isSelected = selectedTemplate === template.key;
              const hasAccess = hasTemplateAccess(template, userPlan);

              return (
                <Card
                  key={template.key}
                  className={`transition-all ${
                    hasAccess
                      ? `cursor-pointer hover:shadow-lg ${
                          isSelected
                            ? "ring-2 ring-blue-600 border-blue-600"
                            : "hover:border-blue-300"
                        }`
                      : "opacity-75 cursor-not-allowed"
                  }`}
                  onClick={() => hasAccess && handleTemplateClick(template)}
                >
                  <CardHeader className="relative">
                    {/* Popular Badge */}
                    {template.popular && (
                      <div className={`absolute ${isAr ? "left-2" : "right-2"} top-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-1 rounded-full z-10`}>
                        {t("Popular", "الأكثر شعبية")}
                      </div>
                    )}
                    {/* Selected Check */}
                    {isSelected && hasAccess && (
                      <div className={`absolute ${isAr ? "right-2" : "left-2"} top-2 bg-blue-600 text-white rounded-full p-1 z-10`}>
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                    {/* Template Preview */}
                    <div 
                      className="aspect-[3/4] rounded-md flex items-center justify-center mb-3 border border-zinc-200 dark:border-zinc-700 relative overflow-hidden"
                      style={{
                        backgroundColor: template.previewColors.secondary,
                        borderColor: template.previewColors.primary + "40",
                      }}
                    >
                      {/* Dynamic preview with template colors */}
                      <div className="w-full h-full p-3 flex flex-col">
                        {/* Header bar with primary color */}
                        <div 
                          className="h-2 mb-2 rounded"
                          style={{ backgroundColor: template.previewColors.primary }}
                        />
                        {/* Content preview */}
                        <div className="flex-1 flex flex-col gap-1">
                          <div 
                            className="h-1 rounded"
                            style={{ backgroundColor: template.previewColors.accent + "60", width: "60%" }}
                          />
                          <div 
                            className="h-1 rounded"
                            style={{ backgroundColor: template.previewColors.accent + "40", width: "80%" }}
                          />
                          <div 
                            className="h-1 rounded"
                            style={{ backgroundColor: template.previewColors.accent + "30", width: "50%" }}
                          />
                        </div>
                        {/* Footer accent */}
                        <div 
                          className="h-1 mt-2 rounded"
                          style={{ backgroundColor: template.previewColors.accent + "30", width: "40%" }}
                        />
                      </div>
                    </div>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{t(template.name.en, template.name.ar)}</span>
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
        </div>
      )}

      {/* Premium Templates Section */}
      {premiumTemplates.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
            {t("Premium Templates", "القوالب المميزة")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {premiumTemplates.map((template) => {
              const isSelected = selectedTemplate === template.key;
              const hasAccess = hasTemplateAccess(template, userPlan);

              return (
                <Tooltip key={template.key}>
                  <TooltipTrigger asChild>
                    <Card
                      className={`transition-all relative ${
                        hasAccess
                          ? `cursor-pointer hover:shadow-lg ${
                              isSelected
                                ? "ring-2 ring-blue-600 border-blue-600"
                                : "hover:border-blue-300"
                            }`
                          : "opacity-75 cursor-not-allowed"
                      }`}
                      onClick={() => hasAccess && handleTemplateClick(template)}
                    >
                      {/* Lock Overlay for locked templates */}
                      {!hasAccess && (
                        <div className="absolute inset-0 bg-zinc-900/50 dark:bg-zinc-900/70 rounded-lg z-10 flex items-center justify-center">
                          <div className="bg-white dark:bg-zinc-800 rounded-full p-3">
                            <Lock className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
                          </div>
                        </div>
                      )}
                      <CardHeader className="relative">
                        {/* Popular Badge */}
                        {template.popular && (
                          <div className={`absolute ${isAr ? "left-2" : "right-2"} top-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-1 rounded-full z-10`}>
                            {t("Popular", "الأكثر شعبية")}
                          </div>
                        )}
                        {/* Selected Check */}
                        {isSelected && hasAccess && (
                          <div className={`absolute ${isAr ? "right-2" : "left-2"} top-2 bg-blue-600 text-white rounded-full p-1 z-10`}>
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                        {/* Lock Icon Badge */}
                        {!hasAccess && (
                          <div className={`absolute ${isAr ? "right-2" : "left-2"} top-2 bg-zinc-700 text-white rounded-full p-1 z-10`}>
                            <Lock className="h-4 w-4" />
                          </div>
                        )}
                        {/* Template Preview */}
                        <div 
                          className="aspect-[3/4] rounded-md flex items-center justify-center mb-3 border border-zinc-200 dark:border-zinc-700 relative overflow-hidden"
                          style={{
                            backgroundColor: template.previewColors.secondary,
                            borderColor: template.previewColors.primary + "40",
                          }}
                        >
                          {/* Dynamic preview with template colors */}
                          <div className="w-full h-full p-3 flex flex-col">
                            {/* Header bar with primary color */}
                            <div 
                              className="h-2 mb-2 rounded"
                              style={{ backgroundColor: template.previewColors.primary }}
                            />
                            {/* Content preview */}
                            <div className="flex-1 flex flex-col gap-1">
                              <div 
                                className="h-1 rounded"
                                style={{ backgroundColor: template.previewColors.accent + "60", width: "60%" }}
                              />
                              <div 
                                className="h-1 rounded"
                                style={{ backgroundColor: template.previewColors.accent + "40", width: "80%" }}
                              />
                              <div 
                                className="h-1 rounded"
                                style={{ backgroundColor: template.previewColors.accent + "30", width: "50%" }}
                              />
                            </div>
                            {/* Footer accent */}
                            <div 
                              className="h-1 mt-2 rounded"
                              style={{ backgroundColor: template.previewColors.accent + "30", width: "40%" }}
                            />
                          </div>
                        </div>
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span>{t(template.name.en, template.name.ar)}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-sm">
                          {t(template.description.en, template.description.ar)}
                        </CardDescription>
                        {!hasAccess && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                            {t("Premium Template", "قالب مميز")}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  {!hasAccess && (
                    <TooltipContent>
                      <p>{getUpgradeMessage(template, isAr)}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </div>
        </div>
      )}

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

