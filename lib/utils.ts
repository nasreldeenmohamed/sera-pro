import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting utilities
const MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const dateRegex = /^\d{4}-\d{2}(-\d{2})?$/;

/**
 * Format date from YYYY-MM to MON YYYY (e.g., "2025-12" -> "DEC 2025")
 */
export function formatDateForDisplay(dateStr: string): string {
  if (!dateStr || !dateRegex.test(dateStr)) return dateStr;
  const [year, month] = dateStr.split("-").map(Number);
  if (year && month >= 1 && month <= 12) {
    return `${MONTH_NAMES[month - 1]} ${year}`;
  }
  return dateStr;
}

/**
 * Format date range for display (e.g., "JUN 2015 - AUG 2023" or "DEC 2025 - Present")
 */
export function formatDateRange(startDate: string, endDate?: string | null, presentLabel: string = "Present"): string {
  const formattedStart = formatDateForDisplay(startDate);
  if (!endDate || endDate.trim() === "") {
    return `${formattedStart} - ${presentLabel}`;
  }
  const formattedEnd = formatDateForDisplay(endDate);
  return `${formattedStart} - ${formattedEnd}`;
}
