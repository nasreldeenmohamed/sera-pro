"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Edit, Trash2, FileText, Lock } from "lucide-react";
import type { UserCv } from "@/firebase/firestore";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

/**
 * CV Preview Card Component
 * 
 * Displays a CV preview card with:
 * - Clickable preview that navigates to edit page (if enabled)
 * - Download button (with or without watermark based on plan)
 * - Delete button
 * - Plan-specific features and badges
 * - Support for disabled state when CV is beyond plan limit
 * 
 * @param cv - CV data to display
 * @param requiresWatermark - Whether downloads should include watermark
 * @param enabled - Whether this CV is accessible based on plan limits (default: true)
 * @param maxCvLimit - Maximum CV limit for current plan (null for unlimited)
 * @param planType - Current plan type for upgrade messaging
 * @param onEdit - Callback when user clicks to edit CV (or upgrade if disabled)
 * @param onDownload - Callback when user clicks to download CV
 * @param onDelete - Callback when user clicks to delete CV
 * @param busy - Whether an operation is in progress
 * @param isAr - Whether UI is in Arabic (RTL)
 * @param t - Translation function
 */
type CvPreviewCardProps = {
  cv: UserCv;
  requiresWatermark: boolean;
  enabled?: boolean; // Whether CV is accessible based on plan limits
  maxCvLimit?: number | null; // Maximum CV limit for current plan
  planType?: "free" | "one_time" | "flex_pack" | "annual_pass";
  onEdit: (cvId: string) => void;
  onDownload: (cvId: string, showWatermark?: boolean) => Promise<void>;
  onDelete: (cvId: string) => void;
  busy: boolean;
  isAr: boolean;
  t: (en: string, ar: string) => string;
};

export function CvPreviewCard({
  cv,
  requiresWatermark,
  enabled = true,
  maxCvLimit,
  planType,
  onEdit,
  onDownload,
  onDelete,
  busy,
  isAr,
  t,
}: CvPreviewCardProps) {
  /**
   * Get tooltip message for disabled CV cards
   * Different messages based on plan type and limit
   */
  const getDisabledTooltip = () => {
    if (!planType || planType === "free" || planType === "one_time") {
      return t(
        "Upgrade your plan to access this CV",
        "قم بترقية خطتك للوصول إلى هذه السيرة"
      );
    }
    
    if (planType === "flex_pack") {
      return t(
        "You've reached your Flex Pack CV limit. Upgrade to Annual Pass to access all CVs.",
        "لقد وصلت إلى حد سير باقة Flex Pack. قم بالترقية إلى البطاقة السنوية للوصول إلى جميع السير."
      );
    }
    
    return t(
      "Upgrade your plan to access this CV",
      "قم بترقية خطتك للوصول إلى هذه السيرة"
    );
  };

  const handleCardClick = () => {
    // If disabled, navigate to pricing page to upgrade
    // If enabled, navigate to edit page with CV data preloaded
    onEdit(cv.id);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (!enabled) {
      // If disabled, redirect to pricing instead of downloading
      onEdit(cv.id); // This will call onEdit which redirects to pricing when disabled
      return;
    }
    await onDownload(cv.id, requiresWatermark);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (confirm(t("Are you sure you want to delete this CV?", "هل أنت متأكد من حذف هذه السيرة؟"))) {
      onDelete(cv.id);
    }
  };

  // Card styling based on enabled/disabled state
  const cardClassName = enabled
    ? "cursor-pointer hover:shadow-lg transition-shadow border-zinc-200 dark:border-zinc-800"
    : "cursor-not-allowed opacity-60 border-zinc-300 dark:border-zinc-700 relative";

  // Wrap card in tooltip only if disabled (to show upgrade message)
  const cardContent = (
    <Card 
      className={cardClassName}
      onClick={handleCardClick}
    >
      {/* Lock overlay for disabled CVs */}
      {!enabled && (
        <div className="absolute inset-0 bg-zinc-900/5 dark:bg-zinc-50/5 rounded-lg z-10 flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-zinc-900 rounded-full p-2 shadow-lg">
            <Lock className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
          </div>
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold line-clamp-1">
            {cv.fullName || t("Untitled CV", "سيرة بدون عنوان")}
          </CardTitle>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!enabled && (
              <Lock className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            )}
            <FileText className="h-5 w-5 text-zinc-400" />
          </div>
        </div>
        {!enabled && (
          <Badge variant="secondary" className="mt-2 text-xs">
            {t("Locked", "مقفلة")}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CV Summary Preview */}
        <div className="min-h-[60px]">
          {cv.summary ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">
              {cv.summary}
            </p>
          ) : (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">
              {t("No summary provided", "لا يوجد ملخص")}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          {enabled ? (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={handleCardClick}
                className="flex-1 min-w-[100px] flex items-center gap-2"
                style={{ backgroundColor: "#0d47a1" }}
              >
                <Edit className="h-3.5 w-3.5" />
                <span>{t("Edit", "تعديل")}</span>
              </Button>
              
              <Button
                size="sm"
                variant="secondary"
                onClick={handleDownload}
                disabled={busy}
                className="flex-1 min-w-[100px] flex items-center gap-2"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{t("Download", "تنزيل")}</span>
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={handleCardClick}
                disabled={busy}
                className="flex-1 min-w-[100px] flex items-center gap-2"
                style={{ backgroundColor: "#0d47a1" }}
              >
                <Lock className="h-3.5 w-3.5" />
                <span>{t("Upgrade", "ترقية")}</span>
              </Button>
              
              <Button
                size="sm"
                variant="secondary"
                onClick={handleDownload}
                disabled={true}
                className="flex-1 min-w-[100px] flex items-center gap-2 opacity-50 cursor-not-allowed"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{t("Download", "تنزيل")}</span>
              </Button>
            </>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={busy}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Only wrap in tooltip if disabled
  if (!enabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {cardContent}
        </TooltipTrigger>
        <TooltipContent>
          <p>{getDisabledTooltip()}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return cardContent;
}

