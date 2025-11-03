"use client";
import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/locale-context";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Facebook, 
  Instagram, 
  Linkedin, 
  Mail, 
  CheckCircle, 
  Shield,
  Lock,
  Globe
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UKFlag, EgyptFlag } from "@/components/ui/flags";

/**
 * Enhanced Global Footer Component for Sera Pro - سيرة برو
 * 
 * Features:
 * - Multi-column responsive layout (4 columns on desktop, stacked on mobile)
 * - Brand section with logo (clickable to homepage) and value proposition
 * - Quick Links navigation column
 * - Support section (FAQs, Terms, Privacy, Cookies, GDPR)
 * - Follow Us section with labeled social media icons
 * - Newsletter signup form
 * - Language switcher matching header style
 * - Trust badges (SSL, Payment Security, Made in Egypt)
 * - Dynamic copyright year
 * - Fully bilingual with RTL/LTR support
 * - Accessibility features (tooltips, ARIA labels)
 * - Mobile-first responsive design
 * 
 * Structure:
 * - Column 1: Brand + About
 * - Column 2: Quick Links
 * - Column 3: Support & Legal
 * - Column 4: Follow Us + Newsletter
 * - Bottom bar: Copyright, Badges, Language Switcher
 */
export function Footer() {
  const { isAr, t, setLocale } = useLocale();
  const [email, setEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "success" | "error">("idle");

  /**
   * Handle newsletter subscription
   * TODO: Integrate with email service (e.g., Mailchimp, SendGrid, or custom API)
   */
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setNewsletterStatus("error");
      return;
    }

    // TODO: Replace with actual newsletter subscription API call
    try {
      console.log("[Newsletter] Subscribing email:", email);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setNewsletterStatus("success");
      setEmail("");
      
      // Reset status after 3 seconds
      setTimeout(() => setNewsletterStatus("idle"), 3000);
    } catch (error) {
      console.error("[Newsletter] Subscription error:", error);
      setNewsletterStatus("error");
    }
  };

  return (
    <footer className="border-t bg-zinc-50 dark:bg-zinc-900 px-4 py-12 sm:px-6 md:px-10">
      <div className="mx-auto max-w-6xl">
        {/* Main Footer Content - Multi-column Grid */}
        <div className={`grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 ${isAr ? "text-right" : "text-left"}`}>
          
          {/* Column 1: Brand & About Section */}
          <div className="space-y-4">
            <div>
              {/* Clickable Logo - links to homepage */}
              <Link 
                href="/" 
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                aria-label={t("Home", "الرئيسية")}
              >
                <div className="h-8 w-8 rounded-md flex-shrink-0" style={{ backgroundColor: "#0d47a1" }} />
                <span className="text-base font-semibold">Sera Pro - سيرة برو</span>
              </Link>
            </div>
            
            {/* Value Proposition / About */}
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {t(
                "AI-powered CV builder designed for Egypt and MENA. Create professional, ATS-optimized resumes in Arabic and English.",
                "منشئ السيرة الذاتية المدعوم بالذكاء الاصطناعي المصمم لمصر والمنطقة. أنشئ سيرًا احترافية متوافقة مع أنظمة التتبع بالعربية والإنجليزية."
              )}
            </p>

            {/* Trust Badges - Visual indicators of security and authenticity */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* SSL/Security Badge */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <Lock className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    <span className="hidden sm:inline">{t("SSL Secured", "محمي SSL")}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("Secure encrypted connection", "اتصال مشفر آمن")}</p>
                </TooltipContent>
              </Tooltip>

              {/* Payment Security Badge */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <Shield className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="hidden sm:inline">{t("Secure Payments", "مدفوعات آمنة")}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("Powered by Kashier - trusted payment gateway", "مدعوم بـ كاشير - بوابة دفع موثوقة")}</p>
                </TooltipContent>
              </Tooltip>

              {/* Made in Egypt Badge */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <Globe className="h-3.5 w-3.5 text-[#d4af37]" />
                    <span className="hidden sm:inline">{t("Made in Egypt", "صُنع في مصر")}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("Built for the Egyptian job market", "مبني لسوق العمل المصري")}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Column 2: Quick Links Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {t("Quick Links", "روابط سريعة")}
            </h4>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li>
                <Link 
                  href="/" 
                  className="hover:underline hover:text-[#0d47a1] dark:hover:text-blue-400 transition-colors"
                >
                  {t("Home", "الرئيسية")}
                </Link>
              </li>
              <li>
                <Link 
                  href="/pricing" 
                  className="hover:underline hover:text-[#0d47a1] dark:hover:text-blue-400 transition-colors"
                >
                  {t("Pricing", "الأسعار")}
                </Link>
              </li>
              <li>
                <Link 
                  href="/#features" 
                  className="hover:underline hover:text-[#0d47a1] dark:hover:text-blue-400 transition-colors"
                >
                  {t("Features", "المميزات")}
                </Link>
              </li>
              <li>
                <Link 
                  href="/create-cv" 
                  className="hover:underline hover:text-[#0d47a1] dark:hover:text-blue-400 transition-colors"
                >
                  {t("Create CV", "إنشاء سيرة")}
                </Link>
              </li>
              <li>
                {/* About - Links to home page about section, or create /about page if needed */}
                <Link 
                  href="/#about" 
                  className="hover:underline hover:text-[#0d47a1] dark:hover:text-blue-400 transition-colors"
                >
                  {t("About", "عن الموقع")}
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:contact.serapro@gmail.com" 
                  className="hover:underline hover:text-[#0d47a1] dark:hover:text-blue-400 transition-colors"
                >
                  {t("Contact", "تواصل")}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Support & Legal Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {t("Support", "الدعم")}
            </h4>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li>
                <Link 
                  href="/faq" 
                  className="hover:underline hover:text-[#0d47a1] dark:hover:text-blue-400 transition-colors"
                >
                  {t("FAQs", "الأسئلة الشائعة")}
                </Link>
              </li>
              <li>
                <Link 
                  href="/legal/terms" 
                  className="hover:underline hover:text-[#0d47a1] dark:hover:text-blue-400 transition-colors"
                >
                  {t("Terms of Service", "شروط الخدمة")}
                </Link>
              </li>
              <li>
                <Link 
                  href="/legal/privacy" 
                  className="hover:underline hover:text-[#0d47a1] dark:hover:text-blue-400 transition-colors"
                >
                  {t("Privacy Policy", "سياسة الخصوصية")}
                </Link>
              </li>
              <li>
                {/* Cookie Policy - Links to Privacy Policy section or dedicated page if available */}
                <Link 
                  href="/legal/privacy#cookies" 
                  className="hover:underline hover:text-[#0d47a1] dark:hover:text-blue-400 transition-colors"
                >
                  {t("Cookie Policy", "سياسة الكوكيز")}
                </Link>
              </li>
              <li>
                {/* GDPR Compliance - Links to Privacy Policy section or dedicated page if available */}
                <Link 
                  href="/legal/privacy#gdpr" 
                  className="hover:underline hover:text-[#0d47a1] dark:hover:text-blue-400 transition-colors"
                >
                  {t("GDPR Compliance", "امتثال GDPR")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Follow Us & Newsletter Section */}
          <div className="space-y-4">
            {/* Follow Us Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {t("Follow Us", "تابعنا")}
              </h4>
              <div className="flex items-center gap-3">
                {/* Facebook */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href="https://www.facebook.com/seeerapro"
                      aria-label={t("Facebook", "فيسبوك")}
                      className="flex items-center justify-center h-9 w-9 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-[#0d47a1] hover:text-white dark:hover:bg-[#0d47a1] transition-all"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Facebook className="h-4 w-4" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("Visit our Facebook page", "زيارة صفحتنا على فيسبوك")}</p>
                  </TooltipContent>
                </Tooltip>

                {/* Instagram */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href="https://instagram.com/serapro" // TODO: Replace with actual social media URLs
                      aria-label={t("Instagram", "إنستغرام")}
                      className="flex items-center justify-center h-9 w-9 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-[#0d47a1] hover:text-white dark:hover:bg-[#0d47a1] transition-all"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Instagram className="h-4 w-4" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("Follow us on Instagram", "تابعنا على إنستغرام")}</p>
                  </TooltipContent>
                </Tooltip>

                {/* LinkedIn */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href="https://linkedin.com/company/serapro" // TODO: Replace with actual social media URLs
                      aria-label={t("LinkedIn", "لينكدإن")}
                      className="flex items-center justify-center h-9 w-9 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-[#0d47a1] hover:text-white dark:hover:bg-[#0d47a1] transition-all"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Linkedin className="h-4 w-4" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("Connect with us on LinkedIn", "تواصل معنا على لينكدإن")}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Newsletter Signup Section */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {t("Subscribe for Updates", "اشترك للحصول على التحديثات")}
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {t("Get the latest features and tips", "احصل على آخر الميزات والنصائح")}
              </p>
              
              {/* Newsletter Form */}
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder={t("Your email", "بريدك الإلكتروني")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 text-sm h-9"
                    required
                    aria-label={t("Email address for newsletter", "عنوان البريد الإلكتروني للنشرة الإخبارية")}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="h-9 px-4"
                    style={{ backgroundColor: "#0d47a1" }}
                    disabled={newsletterStatus === "success"}
                  >
                    {newsletterStatus === "success" ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {/* Status Messages */}
                {newsletterStatus === "success" && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {t("Subscribed successfully!", "تم الاشتراك بنجاح!")}
                  </p>
                )}
                {newsletterStatus === "error" && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {t("Please enter a valid email", "يرجى إدخال بريد إلكتروني صالح")}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Badges, Language Switcher */}
        <div className={`mt-10 pt-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 ${isAr ? "text-right" : "text-left"}`}>
          
          {/* Copyright Notice - Dynamic Year */}
          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            <p>
              © {new Date().getFullYear()} Sera Pro - سيرة برو. {t("All rights reserved.", "جميع الحقوق محفوظة.")}
            </p>
            <p className="mt-1">
              {t("Cairo, Egypt", "القاهرة، مصر")} •{" "}
              <a 
                href="mailto:contact.serapro@gmail.com" 
                className="hover:underline hover:text-[#0d47a1] dark:hover:text-blue-400 transition-colors"
              >
                contact.serapro@gmail.com
              </a>
            </p>
          </div>

          {/* Language Switcher - Matches header style */}
          <div 
            className="flex items-center gap-3"
            dir={isAr ? "rtl" : "ltr"}
          >
            <span className="text-xs text-zinc-600 dark:text-zinc-400 hidden sm:inline">
              {t("Language", "اللغة")}:
            </span>
            <SegmentedControl
              options={[
                {
                  value: "en",
                  label: "English",
                  icon: <UKFlag className="h-3 w-4 flex-shrink-0" />,
                },
                {
                  value: "ar",
                  label: "العربية",
                  icon: <EgyptFlag className="h-3 w-4 flex-shrink-0" />,
                },
              ]}
              value={isAr ? "ar" : "en"}
              onChange={(val) => setLocale(val as "ar" | "en")}
              size="sm"
              ariaLabel={t("Select language", "اختر اللغة")}
              className="shadow-xs border-zinc-300 dark:border-zinc-700"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
