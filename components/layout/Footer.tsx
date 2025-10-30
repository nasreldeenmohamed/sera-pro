"use client";
import Link from "next/link";
import { useLocale } from "@/lib/locale-context";
import { Facebook, Instagram, Linkedin } from "lucide-react";

/**
 * Global footer component for Sera Pro - سيرة برو
 * Features:
 * - Brand info and description
 * - Contact information
 * - Legal links (Terms, Privacy)
 * - Social media icons
 * - Copyright notice
 * - Mobile-responsive grid layout
 * - Bilingual with RTL support
 */
export function Footer() {
  const { t } = useLocale();

  return (
    <footer className="border-t bg-white dark:bg-black px-4 py-8 sm:px-6 md:px-10">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-3">
        {/* Brand section */}
        <div className="space-y-2 text-start">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md" style={{ backgroundColor: "#0d47a1" }} />
            <span className="text-sm font-semibold">Sera Pro - سيرة برو</span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t(
              "AI CV builder for Egypt and MENA.",
              "منشئ السيرة الذاتية بالذكاء الاصطناعي لمصر والمنطقة."
            )}
          </p>
        </div>

        {/* Contact section */}
        <div className="space-y-2 text-start">
          <h4 className="text-sm font-semibold">{t("Contact", "تواصل")}</h4>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
            <li>
              <a href="mailto:support@serapro.app" className="hover:underline hover:text-[#0d47a1] transition-colors">
                support@serapro.app
              </a>
            </li>
            <li>
              <span>{t("Cairo, Egypt", "القاهرة، مصر")}</span>
            </li>
          </ul>
        </div>

        {/* Legal links section */}
        <div className="space-y-2 text-start">
          <h4 className="text-sm font-semibold">{t("Legal", "قانوني")}</h4>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
            <li>
              <Link href="/legal/terms" className="hover:underline hover:text-[#0d47a1] transition-colors">
                {t("Terms", "الشروط")}
              </Link>
            </li>
            <li>
              <Link href="/legal/privacy" className="hover:underline hover:text-[#0d47a1] transition-colors">
                {t("Privacy", "الخصوصية")}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar: Copyright + Social icons */}
      <div className="mx-auto mt-6 flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t">
        <p className="text-xs text-zinc-500">
          © {new Date().getFullYear()} Sera Pro - سيرة برو. {t("All rights reserved.", "جميع الحقوق محفوظة.")}
        </p>
        {/* Social media icons - TODO: Replace '#' with actual URLs */}
        <div className="flex items-center gap-4 text-zinc-600 dark:text-zinc-400">
          <a
            href="#"
            aria-label="Facebook"
            className="hover:text-[#0d47a1] transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Facebook className="h-4 w-4" />
          </a>
          <a
            href="#"
            aria-label="Instagram"
            className="hover:text-[#0d47a1] transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Instagram className="h-4 w-4" />
          </a>
          <a
            href="#"
            aria-label="LinkedIn"
            className="hover:text-[#0d47a1] transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Linkedin className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}

