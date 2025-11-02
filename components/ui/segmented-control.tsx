"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Segmented Control Component
 * 
 * A modern, accessible toggle control for selecting between options.
 * Used for language switching and other binary/multi-choice selections.
 * 
 * Features:
 * - Smooth animations for selection indicator
 * - Keyboard accessible (Arrow keys to navigate, Enter/Space to select)
 * - Touch-friendly on mobile (large tap targets)
 * - Fully customizable styling
 * - RTL/LTR support
 * 
 * Usage:
 * <SegmentedControl
 *   options={[{ value: "en", label: "English" }, { value: "ar", label: "العربية" }]}
 *   value={selected}
 *   onChange={setSelected}
 * />
 */
type SegmentedControlOption = {
  value: string;
  label: string;
  icon?: React.ReactNode;
};

type SegmentedControlProps = {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  ariaLabel?: string;
};

export function SegmentedControl({
  options,
  value,
  onChange,
  className,
  size = "md",
  ariaLabel = "Select option",
}: SegmentedControlProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = React.useState<{
    left?: string;
    right?: string;
    width: string;
  }>({ width: "0px" });

  /**
   * Calculate and update indicator position based on selected option
   * Handles RTL/LTR direction automatically
   */
  const updateIndicatorPosition = React.useCallback(() => {
    if (!containerRef.current) return;

    const activeIndex = options.findIndex((opt) => opt.value === value);
    if (activeIndex === -1) return;

    const container = containerRef.current;
    const buttons = container.querySelectorAll("button");
    const activeButton = buttons[activeIndex] as HTMLButtonElement;

    if (!activeButton) return;

    const containerRect = container.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();

    // Determine direction from container's computed style or parent
    const computedStyle = window.getComputedStyle(container);
    const isRTL = computedStyle.direction === "rtl" || 
                  container.getAttribute("dir") === "rtl" ||
                  container.closest("[dir='rtl']") !== null;
    
    // Calculate position relative to container
    // In RTL, measure from the right edge; in LTR, measure from the left edge
    if (isRTL) {
      const relativeRight = containerRect.right - buttonRect.right;
      setIndicatorStyle({
        right: `${relativeRight}px`,
        width: `${buttonRect.width}px`,
      });
    } else {
      const relativeLeft = buttonRect.left - containerRect.left;
      setIndicatorStyle({
        left: `${relativeLeft}px`,
        width: `${buttonRect.width}px`,
      });
    }
  }, [value, options]);

  // Update indicator position when value or options change
  React.useEffect(() => {
    updateIndicatorPosition();
  }, [updateIndicatorPosition]);

  // Recalculate on mount (with small delay for DOM rendering) and window resize
  React.useEffect(() => {
    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      updateIndicatorPosition();
    }, 10);

    // Handle window resize for responsive behavior
    const handleResize = () => {
      updateIndicatorPosition();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [updateIndicatorPosition]);

  // Size variants with accessibility in mind (min 44px touch target)
  // sm: 32px height (compact for headers)
  // md: 36px height (standard)
  // lg: 40px height (prominent)
  const sizeClasses = {
    sm: "min-h-8 h-8 text-xs px-2.5 min-w-[44px]",
    md: "min-h-9 h-9 text-sm px-3.5 min-w-[44px]",
    lg: "min-h-10 h-10 text-base px-4 min-w-[44px]",
  };

  // Keyboard navigation with RTL-aware arrow key handling
  const handleKeyDown = (e: React.KeyboardEvent, optionValue: string) => {
    const currentIndex = options.findIndex((opt) => opt.value === value);
    const container = containerRef.current;
    const isRTL = container 
      ? (window.getComputedStyle(container).direction === "rtl" || 
         container.getAttribute("dir") === "rtl" ||
         container.closest("[dir='rtl']") !== null)
      : false;
    
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      // In RTL, ArrowLeft moves forward and ArrowRight moves backward
      const isForward = isRTL 
        ? e.key === "ArrowLeft" 
        : e.key === "ArrowRight";
      const direction = isForward ? 1 : -1;
      const nextIndex = (currentIndex + direction + options.length) % options.length;
      onChange(options[nextIndex].value);
      // Focus the newly selected button
      const buttons = container?.querySelectorAll("button");
      buttons?.[nextIndex]?.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onChange(optionValue);
    }
  };

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "relative inline-flex rounded-lg border bg-zinc-100 dark:bg-zinc-900 p-1",
        "shadow-sm",
        className
      )}
    >
      {/* Animated selection indicator with smooth transitions */}
      <div
        className={cn(
          "absolute rounded-md bg-white dark:bg-zinc-800 shadow-sm",
          "transition-all duration-300 ease-out",
          "border border-zinc-200 dark:border-zinc-700",
          "will-change-transform"
        )}
        style={{
          top: "4px",
          bottom: "4px",
          ...indicatorStyle,
        }}
        aria-hidden="true"
      />

      {/* Options */}
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={isSelected}
            aria-label={`${ariaLabel}: ${option.label}`}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => handleKeyDown(e, option.value)}
            className={cn(
              "relative z-10 flex items-center justify-center gap-1.5 rounded-md font-medium",
              "transition-all duration-200 ease-out",
              sizeClasses[size],
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d47a1] focus-visible:ring-offset-2",
              "active:scale-[0.98] active:transition-transform active:duration-100",
              isSelected
                ? "text-[#0d47a1] dark:text-[#0d47a1] font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium"
            )}
          >
            {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

