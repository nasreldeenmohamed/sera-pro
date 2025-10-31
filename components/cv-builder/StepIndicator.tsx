"use client";
import { useLocale } from "@/lib/locale-context";
import { Check } from "lucide-react";

/**
 * Step Indicator Component
 * 
 * Visual progress indicator for multi-step CV builder flow.
 * Shows current step, completed steps, and total steps.
 * Supports bilingual labels and RTL layout.
 */
type StepIndicatorProps = {
  currentStep: number;
  totalSteps: number;
  steps: Array<{ key: string; label: { en: string; ar: string } }>;
};

export function StepIndicator({ currentStep, totalSteps, steps }: StepIndicatorProps) {
  const { isAr, t } = useLocale();

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          const isUpcoming = stepNum > currentStep;

          return (
            <div key={step.key} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isCurrent
                      ? "bg-blue-600 text-white ring-2 ring-blue-300"
                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    stepNum
                  )}
                </div>
                <span
                  className={`mt-2 text-xs text-center ${
                    isCurrent
                      ? "font-semibold text-blue-600 dark:text-blue-400"
                      : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {t(step.label.en, step.label.ar)}
                </span>
              </div>
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 ${
                    isCompleted ? "bg-green-500" : "bg-zinc-200 dark:bg-zinc-700"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

