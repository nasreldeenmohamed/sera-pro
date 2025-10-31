"use client";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/locale-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * AuthRequiredModal Component
 * 
 * Displays a bilingual modal prompting users to sign in or sign up when they attempt
 * to access a protected action (save draft, download CV, use premium features, etc.).
 * 
 * This is part of the "guest mode" user flow where users can explore the CV builder
 * without authentication, but are prompted to sign in when they want to persist data
 * or access premium features.
 * 
 * The modal provides:
 * - Clear explanation of why authentication is needed
 * - Quick access to sign in/sign up pages
 * - Optional: Continue as guest (cancel) option
 * 
 * @param open - Controls modal visibility
 * @param onClose - Callback when modal is closed
 * @param action - The action that requires authentication (e.g., "save", "download")
 * @param onAuthSuccess - Callback to execute the intended action after successful authentication
 * 
 * Future extensibility:
 * - Add social login buttons (Google, LinkedIn) directly in modal
 * - Add "Remember this choice" for future visits
 * - Add trial mode options (e.g., "Try premium features for 7 days")
 */
type AuthRequiredModalProps = {
  open: boolean;
  onClose: () => void;
  action: "save" | "download" | "premium" | "load" | "general";
  onAuthSuccess?: () => void; // Callback to execute after auth (e.g., auto-save draft)
};

export function AuthRequiredModal({
  open,
  onClose,
  action,
  onAuthSuccess,
}: AuthRequiredModalProps) {
  const { isAr, t } = useLocale();
  const router = useRouter();

  // Get action-specific messaging
  const getActionMessages = () => {
    switch (action) {
      case "save":
        return {
          title: t("Sign in to save your CV", "سجل الدخول لحفظ سيرتك الذاتية"),
          description: t(
            "Save your CV draft to access it later from any device. Your progress will be saved securely.",
            "احفظ مسودة سيرتك للوصول إليها لاحقًا من أي جهاز. سيتم حفظ تقدمك بأمان."
          ),
        };
      case "download":
        return {
          title: t("Sign in to download your CV", "سجل الدخول لتنزيل سيرتك الذاتية"),
          description: t(
            "Download your CV as a professional PDF. Sign in to access unlimited downloads and premium templates.",
            "نزّل سيرتك كملف PDF احترافي. سجّل الدخول للوصول إلى تنزيلات غير محدودة وقوالب مميزة."
          ),
        };
      case "premium":
        return {
          title: t("Unlock premium features", "افتح الميزات المميزة"),
          description: t(
            "Sign in to access AI enhancement, premium templates, and other advanced features.",
            "سجّل الدخول للوصول إلى التحسين بالذكاء الاصطناعي والقوالب المميزة والميزات المتقدمة الأخرى."
          ),
        };
      case "load":
        return {
          title: t("Sign in to load your saved CV", "سجل الدخول لتحميل سيرتك المحفوظة"),
          description: t(
            "Access your previously saved CV drafts from your account.",
            "الوصول إلى مسودات سيرتك الذاتية المحفوظة مسبقًا من حسابك."
          ),
        };
      default:
        return {
          title: t("Sign in required", "تسجيل الدخول مطلوب"),
          description: t(
            "Please sign in to continue with this action.",
            "يرجى تسجيل الدخول لمتابعة هذا الإجراء."
          ),
        };
    }
  };

  const messages = getActionMessages();

  // Navigate to auth page with return URL and action parameter
  const handleSignIn = () => {
    // Store the callback action in sessionStorage so we can resume after auth
    if (onAuthSuccess) {
      sessionStorage.setItem("authCallback", JSON.stringify({ action, callback: "pending" }));
    }
    // Get current path for redirect (defaults to /create-cv)
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "/create-cv";
    router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}&action=${encodeURIComponent(action)}`);
    onClose();
  };

  const handleSignUp = () => {
    // Store the callback action in sessionStorage
    if (onAuthSuccess) {
      sessionStorage.setItem("authCallback", JSON.stringify({ action, callback: "pending" }));
    }
    // Get current path for redirect (defaults to /create-cv)
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "/create-cv";
    router.push(`/auth/register?redirect=${encodeURIComponent(currentPath)}&action=${encodeURIComponent(action)}`);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{messages.title}</DialogTitle>
          <DialogDescription className="pt-2">
            {messages.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            {t("Maybe later", "ربما لاحقًا")}
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="secondary"
              onClick={handleSignIn}
              className="flex-1 sm:flex-initial"
            >
              {t("Sign In", "تسجيل الدخول")}
            </Button>
            <Button
              onClick={handleSignUp}
              className="flex-1 sm:flex-initial text-white"
              style={{ backgroundColor: "#0d47a1" }}
            >
              {t("Sign Up", "إنشاء حساب")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

