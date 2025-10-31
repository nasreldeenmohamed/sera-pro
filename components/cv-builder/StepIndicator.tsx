"use client";
import { useLocale } from "@/lib/locale-context";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

/**
 * Step Indicator Component
 * 
 * Interactive progress indicator for multi-step CV builder flow.
 * Shows current step, completed steps, and allows clicking to jump to any step.
 * Supports bilingual labels and RTL layout.
 * 
 * Mobile Optimization:
 * - On mobile, shows full labels on active/current step to prevent truncation
 * - Uses horizontal scrolling for many steps to ensure all labels are readable
 * - Current step label gets more prominence and space
 * - Responsive label sizing: smaller on mobile, full on desktop
 * 
 * UX Improvements:
 * - Prevents label truncation with ellipses by using scrollable container on mobile
 * - Current step label always fully visible
 * - Completed steps use checkmark for visual clarity
 * - Upcoming steps are visually de-emphasized
 */
type StepIndicatorProps = {
  currentStep: number;
  totalSteps: number;
  steps: Array<{ key: string; label: { en: string; ar: string } }>;
  onStepClick?: (stepNumber: number) => void;
};

export function StepIndicator({ currentStep, totalSteps, steps, onStepClick }: StepIndicatorProps) {
  const { isAr, t } = useLocale();
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport for responsive behavior
  // SSR-safe: only runs on client side after mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleStepClick = (stepNum: number) => {
    // Only allow clicking on completed steps or the current step
    if (onStepClick && stepNum <= currentStep) {
      onStepClick(stepNum);
    }
  };

  return (
    <div className="mb-6" dir={isAr ? "rtl" : "ltr"}>
      {/* Scrollable container for mobile - ensures all steps are accessible and labels remain readable */}
      <div 
        className={cn(
          "flex items-center pb-2",
          isMobile 
            ? "overflow-x-auto gap-2 px-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" // Scrollable on mobile with gap for spacing, hide scrollbar for cleaner look
            : "justify-between", // Space evenly on desktop
          isAr && "flex-row-reverse" // Reverse direction for RTL
        )}
        style={isMobile ? { scrollBehavior: "smooth" } : {}}
      >
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          const isUpcoming = stepNum > currentStep;
          const isClickable = stepNum <= currentStep && !!onStepClick;

          return (
            <div 
              key={step.key} 
              className={cn(
                "flex items-center",
                isMobile ? "flex-shrink-0" : "flex-1 min-w-0" // Don't shrink on mobile, allow scrolling
              )}
            >
              {/* Step Circle and Label Container */}
              <div className={cn(
                "flex flex-col items-center",
                isMobile ? "w-20" : "flex-1 min-w-0" // Fixed width on mobile for consistent scrolling
              )}>
                <button
                  type="button"
                  onClick={() => handleStepClick(stepNum)}
                  disabled={!isClickable}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all flex-shrink-0",
                    isCompleted && "bg-green-500 text-white",
                    isCurrent && "bg-blue-600 text-white ring-2 ring-blue-300",
                    isUpcoming && "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400",
                    isClickable && "cursor-pointer hover:scale-110 hover:shadow-md",
                    !isClickable && "cursor-not-allowed"
                  )}
                  aria-label={t(`Go to ${step.label.en}`, `الانتقال إلى ${step.label.ar}`)}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    stepNum
                  )}
                </button>
                {/* Step Label - Responsive display strategy:
                    Mobile: Fixed width per step, current step gets full label without truncation
                    Desktop: Flexible width, truncate with tooltip for long labels
                    This ensures all step names are readable while maintaining clean layout
                */}
                <span
                  className={cn(
                    "mt-2 text-center px-1",
                    // Mobile: Fixed width prevents layout shifts, current step gets priority for full text
                    isMobile 
                      ? isCurrent 
                        ? "text-xs font-semibold text-blue-600 dark:text-blue-400 whitespace-normal leading-tight min-h-[2rem] flex items-center justify-center" 
                        : "text-xs text-zinc-600 dark:text-zinc-400 truncate max-w-[80px]"
                      // Desktop: Flexible layout with truncation and tooltip fallback
                      : "text-xs w-full truncate",
                    // Current step styling for desktop
                    !isMobile && isCurrent && "font-semibold text-blue-600 dark:text-blue-400",
                    !isMobile && !isCurrent && "text-zinc-600 dark:text-zinc-400"
                  )}
                  title={isCurrent || isMobile ? undefined : t(step.label.en, step.label.ar)} // Tooltip for truncated labels on desktop
                >
                  {t(step.label.en, step.label.ar)}
                </span>
              </div>
              {/* Connector Line - Hidden on mobile to allow cleaner scrolling, visible on desktop */}
              {index < steps.length - 1 && !isMobile && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-2 transition-colors",
                    isCompleted ? "bg-green-500" : "bg-zinc-200 dark:bg-zinc-700"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Mobile: Show current step label prominently below the stepper
          This provides a larger, more readable display of the current step name
          when space is constrained in the horizontal stepper above.
          UX rationale: Reduces cognitive load by clearly indicating what step the user is on.
      */}
      {isMobile && currentStep > 0 && steps[currentStep - 1] && (
        <div className="mt-2 text-center px-4">
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            {t("Step", "الخطوة")} {currentStep}: {t(steps[currentStep - 1].label.en, steps[currentStep - 1].label.ar)}
          </span>
        </div>
      )}
    </div>
  );
}

