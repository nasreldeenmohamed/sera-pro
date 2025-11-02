"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Edit, Trash2, FileText } from "lucide-react";
import type { UserCv } from "@/firebase/firestore";

/**
 * CV Preview Card Component
 * 
 * Displays a CV preview card with:
 * - Clickable preview that navigates to edit page
 * - Download button (with or without watermark based on plan)
 * - Delete button
 * - Plan-specific features and badges
 * 
 * @param cv - CV data to display
 * @param requiresWatermark - Whether downloads should include watermark
 * @param onEdit - Callback when user clicks to edit CV
 * @param onDownload - Callback when user clicks to download CV
 * @param onDelete - Callback when user clicks to delete CV
 * @param busy - Whether an operation is in progress
 * @param isAr - Whether UI is in Arabic (RTL)
 * @param t - Translation function
 */
type CvPreviewCardProps = {
  cv: UserCv;
  requiresWatermark: boolean;
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
  onEdit,
  onDownload,
  onDelete,
  busy,
  isAr,
  t,
}: CvPreviewCardProps) {
  const handleCardClick = () => {
    // Navigate to edit page with CV data preloaded
    onEdit(cv.id);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    await onDownload(cv.id, requiresWatermark);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (confirm(t("Are you sure you want to delete this CV?", "هل أنت متأكد من حذف هذه السيرة؟"))) {
      onDelete(cv.id);
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow border-zinc-200 dark:border-zinc-800"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold line-clamp-1">
            {cv.fullName || t("Untitled CV", "سيرة بدون عنوان")}
          </CardTitle>
          <FileText className="h-5 w-5 text-zinc-400 flex-shrink-0" />
        </div>
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
}

