"use client";
import { useLocale } from "@/lib/locale-context";
import { useMemo } from "react";
import type { CvDraftData } from "@/firebase/firestore";
import { getTemplate } from "@/lib/templates";
import { cn } from "@/lib/utils";

/**
 * Live CV Preview Component
 * 
 * Displays a real-time preview of the CV as the user edits data.
 * Updates instantly when form values change, matching the selected template.
 * 
 * Features:
 * - Real-time updates from form values
 * - Template-aware rendering with distinct styles
 * - RTL/LTR support
 * - Responsive design
 * - Print-friendly styling
 * - Dynamic color schemes per template
 */
type LiveCvPreviewProps = {
  data: CvDraftData;
  templateKey: string;
  cvLanguage?: "ar" | "en"; // CV content language (overrides data.cvLanguage if provided)
  className?: string;
};

/**
 * Classic Template - Traditional professional layout
 */
const ClassicTemplate = ({ data, isAr }: { data: CvDraftData; isAr: boolean }) => {
  const { t } = useLocale();
  const template = getTemplate("classic");
  const colors = template?.previewColors || { primary: "#0d47a1", secondary: "#f5f5f5", accent: "#1976d2", text: "#212121" };

  return (
    <div
      className={cn("cv-preview bg-white text-zinc-900 p-6 md:p-8 shadow-lg rounded-lg border border-zinc-200", isAr ? "text-right" : "text-left")}
      dir={isAr ? "rtl" : "ltr"}
      style={{ borderTopColor: colors.primary, borderTopWidth: "4px" }}
    >
      <header className="mb-6 pb-4 border-b-2" style={{ borderColor: colors.primary }}>
        <h1 className="text-3xl font-bold mb-2" style={{ color: colors.primary }}>
          {data.fullName || t("Your Name", "اسمك")}
        </h1>
        {data.title && (
          <p className="text-lg text-zinc-700 mb-2">{data.title}</p>
        )}
        <div className={cn("flex flex-wrap gap-3 text-sm text-zinc-600", isAr ? "flex-row-reverse" : "")}>
          {data.contact?.email && <span>{data.contact.email}</span>}
          {data.contact?.phone && <span>{data.contact.phone}</span>}
          {data.contact?.location && <span>{data.contact.location}</span>}
          {data.contact?.website && (
            <a href={data.contact.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {data.contact.website}
            </a>
          )}
        </div>
      </header>

      {data.summary && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2 pb-1" style={{ color: colors.primary, borderBottom: `2px solid ${colors.primary}` }}>
            {t("Professional Summary", "ملخص مهني")}
          </h2>
          <p className="text-zinc-700 whitespace-pre-line leading-relaxed">{data.summary}</p>
        </section>
      )}

      {data.experience && data.experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 pb-1" style={{ color: colors.primary, borderBottom: `2px solid ${colors.primary}` }}>
            {t("Professional Experience", "الخبرة المهنية")}
          </h2>
          <div className="space-y-4">
            {data.experience.map((exp, idx) => (
              <div key={idx} className="mb-4">
                <div className={cn("flex justify-between items-start mb-1", isAr ? "flex-row-reverse" : "")}>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-zinc-900">{exp.role || t("Role", "الوظيفة")}</h3>
                    <p className="text-zinc-700 font-medium">{exp.company || t("Company", "الشركة")}</p>
                  </div>
                  <div className={cn("text-sm text-zinc-600 whitespace-nowrap", isAr ? "ml-3" : "mr-3")}>
                    {exp.startDate || ""} {exp.endDate ? ` ${isAr ? "إلى" : "-"} ${exp.endDate}` : ` ${isAr ? "-" : "-"} ${t("Present", "حتى الآن")}`}
                  </div>
                </div>
                {exp.description && (
                  <p className="text-zinc-600 text-sm whitespace-pre-line mt-2 leading-relaxed">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {data.education && data.education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 pb-1" style={{ color: colors.primary, borderBottom: `2px solid ${colors.primary}` }}>
            {t("Education", "التعليم")}
          </h2>
          <div className="space-y-3">
            {data.education.map((edu, idx) => (
              <div key={idx} className={cn("flex justify-between items-start", isAr ? "flex-row-reverse" : "")}>
                <div className="flex-1">
                  <h3 className="font-semibold text-zinc-900">{edu.degree || t("Degree", "المؤهل")}</h3>
                  <p className="text-zinc-700">{edu.school || t("Institution", "المؤسسة")}</p>
                </div>
                <div className={cn("text-sm text-zinc-600 whitespace-nowrap", isAr ? "ml-3" : "mr-3")}>
                  {edu.startDate || ""} {edu.endDate ? ` ${isAr ? "إلى" : "-"} ${edu.endDate}` : ""}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.skills && data.skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 pb-1" style={{ color: colors.primary, borderBottom: `2px solid ${colors.primary}` }}>
            {t("Skills", "المهارات")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, idx) => (
              skill && (
                <span key={idx} className="px-3 py-1 rounded-md text-sm font-medium border" style={{ backgroundColor: colors.secondary, color: colors.primary, borderColor: colors.accent }}>
                  {skill}
                </span>
              )
            ))}
          </div>
        </section>
      )}

      {data.languages && data.languages.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 pb-1" style={{ color: colors.primary, borderBottom: `2px solid ${colors.primary}` }}>
            {t("Languages", "اللغات")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.languages.map((lang, idx) => (
              lang && (
                <span key={idx} className="text-zinc-700">
                  {lang}
                  {idx < data.languages.length - 1 && <span className="mx-1">{isAr ? "،" : ","}</span>}
                </span>
              )
            ))}
          </div>
        </section>
      )}

      {data.certifications && data.certifications.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 pb-1" style={{ color: colors.primary, borderBottom: `2px solid ${colors.primary}` }}>
            {t("Certifications", "الشهادات")}
          </h2>
          <ul className={cn("list-disc space-y-1", isAr ? "mr-6" : "ml-6")}>
            {data.certifications.map((cert, idx) => (
              cert && <li key={idx} className="text-zinc-700">{cert}</li>
            ))}
          </ul>
        </section>
      )}

      {(!data.fullName && !data.experience?.length && !data.education?.length) && (
        <div className="text-center py-12 text-zinc-400">
          <p className="text-lg mb-2">{t("CV Preview", "معاينة السيرة الذاتية")}</p>
          <p className="text-sm">{t("Start filling the form to see your CV preview here", "ابدأ بملء النموذج لرؤية معاينة سيرتك الذاتية هنا")}</p>
        </div>
      )}
    </div>
  );
};

/**
 * Modern Template - Clean contemporary design
 */
const ModernTemplate = ({ data, isAr }: { data: CvDraftData; isAr: boolean }) => {
  const { t } = useLocale();
  const template = getTemplate("modern");
  const colors = template?.previewColors || { primary: "#1565c0", secondary: "#ffffff", accent: "#42a5f5", text: "#424242" };

  return (
    <div
      className={cn("cv-preview bg-white text-zinc-900 p-6 md:p-8 shadow-lg rounded-lg", isAr ? "text-right" : "text-left")}
      dir={isAr ? "rtl" : "ltr"}
    >
      <header className="mb-6 pb-4" style={{ borderBottom: `3px solid ${colors.accent}` }}>
        <h1 className="text-4xl font-light mb-1" style={{ color: colors.primary, fontWeight: 300 }}>
          {data.fullName || t("Your Name", "اسمك")}
        </h1>
        {data.title && (
          <p className="text-base text-zinc-600 mb-3 uppercase tracking-wide">{data.title}</p>
        )}
        <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
          {data.contact?.email && <span>{data.contact.email}</span>}
          {data.contact?.phone && <span>{data.contact.phone}</span>}
          {data.contact?.location && <span>{data.contact.location}</span>}
          {data.contact?.website && (
            <a href={data.contact.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {data.contact.website}
            </a>
          )}
        </div>
      </header>

      {data.summary && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2 uppercase tracking-wider" style={{ color: colors.primary }}>
            {t("Summary", "الملخص")}
          </h2>
          <p className="text-zinc-700 text-sm leading-relaxed">{data.summary}</p>
        </section>
      )}

      {data.experience && data.experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3 uppercase tracking-wider" style={{ color: colors.primary }}>
            {t("Experience", "الخبرات")}
          </h2>
          <div className="space-y-4">
            {data.experience.map((exp, idx) => (
              <div key={idx} className={cn(isAr ? "border-r-2 pr-4" : "border-l-2 pl-4")} style={{ borderColor: colors.accent }}>
                <div className={cn("flex justify-between items-start mb-1", isAr ? "flex-row-reverse" : "")}>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base">{exp.role || t("Role", "الوظيفة")}</h3>
                    <p className="text-sm text-zinc-600">{exp.company || t("Company", "الشركة")}</p>
                  </div>
                  <div className={cn("text-xs text-zinc-500 whitespace-nowrap", isAr ? "ml-3" : "mr-3")}>
                    {exp.startDate || ""} {exp.endDate ? ` ${isAr ? "إلى" : "-"} ${exp.endDate}` : ` ${t("Present", "حتى الآن")}`}
                  </div>
                </div>
                {exp.description && (
                  <p className="text-zinc-600 text-xs whitespace-pre-line mt-1 leading-relaxed">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {data.education && data.education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3 uppercase tracking-wider" style={{ color: colors.primary }}>
            {t("Education", "التعليم")}
          </h2>
          <div className="space-y-3">
            {data.education.map((edu, idx) => (
              <div key={idx} className={cn("flex justify-between items-start", isAr ? "border-r-2 pr-4 flex-row-reverse" : "border-l-2 pl-4")} style={{ borderColor: colors.accent }}>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{edu.degree || t("Degree", "المؤهل")}</h3>
                  <p className="text-xs text-zinc-600">{edu.school || t("Institution", "المؤسسة")}</p>
                </div>
                <div className={cn("text-xs text-zinc-500 whitespace-nowrap", isAr ? "ml-3" : "mr-3")}>
                  {edu.startDate || ""} {edu.endDate ? ` ${isAr ? "إلى" : "-"} ${edu.endDate}` : ""}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.skills && data.skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3 uppercase tracking-wider" style={{ color: colors.primary }}>
            {t("Skills", "المهارات")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, idx) => (
              skill && (
                <span key={idx} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: colors.accent + "20", color: colors.primary }}>
                  {skill}
                </span>
              )
            ))}
          </div>
        </section>
      )}

      {data.languages && data.languages.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3 uppercase tracking-wider" style={{ color: colors.primary }}>
            {t("Languages", "اللغات")}
          </h2>
          <div className="flex flex-wrap gap-2 text-sm">
            {data.languages.map((lang, idx) => (
              lang && (
                <span key={idx} className="text-zinc-700">
                  {lang}
                  {idx < data.languages.length - 1 && <span className="mx-1">{isAr ? "،" : ","}</span>}
                </span>
              )
            ))}
          </div>
        </section>
      )}

      {data.certifications && data.certifications.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3 uppercase tracking-wider" style={{ color: colors.primary }}>
            {t("Certifications", "الشهادات")}
          </h2>
          <ul className={cn("list-disc space-y-1 text-sm", isAr ? "mr-6" : "ml-6")}>
            {data.certifications.map((cert, idx) => (
              cert && <li key={idx} className="text-zinc-700">{cert}</li>
            ))}
          </ul>
        </section>
      )}

      {(!data.fullName && !data.experience?.length && !data.education?.length) && (
        <div className="text-center py-12 text-zinc-400">
          <p className="text-lg mb-2">{t("CV Preview", "معاينة السيرة الذاتية")}</p>
          <p className="text-sm">{t("Start filling the form to see your CV preview here", "ابدأ بملء النموذج لرؤية معاينة سيرتك الذاتية هنا")}</p>
        </div>
      )}
    </div>
  );
};

/**
 * Elegant Template - Sophisticated with subtle design
 */
const ElegantTemplate = ({ data, isAr }: { data: CvDraftData; isAr: boolean }) => {
  const { t } = useLocale();
  const template = getTemplate("elegant");
  const colors = template?.previewColors || { primary: "#1a237e", secondary: "#fafafa", accent: "#5c6bc0", text: "#263238" };

  return (
    <div
      className={cn("cv-preview bg-white text-zinc-900 p-6 md:p-8 shadow-lg rounded-lg border", isAr ? "text-right" : "text-left")}
      dir={isAr ? "rtl" : "ltr"}
      style={{ backgroundColor: colors.secondary }}
    >
      <header className="mb-6 pb-4 border-b" style={{ borderColor: colors.accent + "40" }}>
        <h1 className="text-3xl font-serif mb-2" style={{ color: colors.primary }}>
          {data.fullName || t("Your Name", "اسمك")}
        </h1>
        {data.title && (
          <p className="text-base text-zinc-600 mb-2 italic">{data.title}</p>
        )}
        <div className="flex flex-wrap gap-3 text-sm text-zinc-600">
          {data.contact?.email && <span>{data.contact.email}</span>}
          {data.contact?.phone && <span>{data.contact.phone}</span>}
          {data.contact?.location && <span>{data.contact.location}</span>}
          {data.contact?.website && (
            <a href={data.contact.website} target="_blank" rel="noopener noreferrer" style={{ color: colors.accent }} className="hover:underline">
              {data.contact.website}
            </a>
          )}
        </div>
      </header>

      {data.summary && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2 pb-1 border-b" style={{ color: colors.primary, borderColor: colors.accent + "40" }}>
            {t("Summary", "الملخص")}
          </h2>
          <p className="text-zinc-700 text-sm leading-relaxed mt-2">{data.summary}</p>
        </section>
      )}

      {data.experience && data.experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3 pb-1 border-b" style={{ color: colors.primary, borderColor: colors.accent + "40" }}>
            {t("Experience", "الخبرات")}
          </h2>
          <div className="space-y-4">
            {data.experience.map((exp, idx) => (
              <div key={idx} className="mb-3">
                <div className={cn("flex justify-between items-start mb-1", isAr ? "flex-row-reverse" : "")}>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base" style={{ color: colors.primary }}>{exp.role || t("Role", "الوظيفة")}</h3>
                    <p className="text-sm text-zinc-600 italic">{exp.company || t("Company", "الشركة")}</p>
                  </div>
                  <div className={cn("text-xs text-zinc-500 whitespace-nowrap", isAr ? "ml-3" : "mr-3")}>
                    {exp.startDate || ""} {exp.endDate ? ` ${isAr ? "إلى" : "-"} ${exp.endDate}` : ` ${t("Present", "حتى الآن")}`}
                  </div>
                </div>
                {exp.description && (
                  <p className="text-zinc-600 text-xs whitespace-pre-line mt-1 leading-relaxed">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {data.education && data.education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3 pb-1 border-b" style={{ color: colors.primary, borderColor: colors.accent + "40" }}>
            {t("Education", "التعليم")}
          </h2>
          <div className="space-y-3">
            {data.education.map((edu, idx) => (
              <div key={idx} className={cn("flex justify-between items-start", isAr ? "flex-row-reverse" : "")}>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm" style={{ color: colors.primary }}>{edu.degree || t("Degree", "المؤهل")}</h3>
                  <p className="text-xs text-zinc-600 italic">{edu.school || t("Institution", "المؤسسة")}</p>
                </div>
                <div className={cn("text-xs text-zinc-500 whitespace-nowrap", isAr ? "ml-3" : "mr-3")}>
                  {edu.startDate || ""} {edu.endDate ? ` ${isAr ? "إلى" : "-"} ${edu.endDate}` : ""}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.skills && data.skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3 pb-1 border-b" style={{ color: colors.primary, borderColor: colors.accent + "40" }}>
            {t("Skills", "المهارات")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, idx) => (
              skill && (
                <span key={idx} className="px-2 py-1 rounded text-xs border" style={{ backgroundColor: colors.secondary, color: colors.primary, borderColor: colors.accent + "60" }}>
                  {skill}
                </span>
              )
            ))}
          </div>
        </section>
      )}

      {data.languages && data.languages.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3 pb-1 border-b" style={{ color: colors.primary, borderColor: colors.accent + "40" }}>
            {t("Languages", "اللغات")}
          </h2>
          <div className="flex flex-wrap gap-2 text-sm">
            {data.languages.map((lang, idx) => (
              lang && (
                <span key={idx} className="text-zinc-700">
                  {lang}
                  {idx < data.languages.length - 1 && <span className="mx-1">{isAr ? "،" : ","}</span>}
                </span>
              )
            ))}
          </div>
        </section>
      )}

      {data.certifications && data.certifications.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3 pb-1 border-b" style={{ color: colors.primary, borderColor: colors.accent + "40" }}>
            {t("Certifications", "الشهادات")}
          </h2>
          <ul className={cn("list-disc space-y-1 text-sm", isAr ? "mr-6" : "ml-6")}>
            {data.certifications.map((cert, idx) => (
              cert && <li key={idx} className="text-zinc-700">{cert}</li>
            ))}
          </ul>
        </section>
      )}

      {(!data.fullName && !data.experience?.length && !data.education?.length) && (
        <div className="text-center py-12 text-zinc-400">
          <p className="text-lg mb-2">{t("CV Preview", "معاينة السيرة الذاتية")}</p>
          <p className="text-sm">{t("Start filling the form to see your CV preview here", "ابدأ بملء النموذج لرؤية معاينة سيرتك الذاتية هنا")}</p>
        </div>
      )}
    </div>
  );
};

/**
 * Creative Template - Bold and eye-catching
 */
const CreativeTemplate = ({ data, isAr }: { data: CvDraftData; isAr: boolean }) => {
  const { t } = useLocale();
  const template = getTemplate("creative");
  const colors = template?.previewColors || { primary: "#6a1b9a", secondary: "#f3e5f5", accent: "#ab47bc", text: "#1a1a1a" };

  return (
    <div
      className={cn("cv-preview bg-white text-zinc-900 p-6 md:p-8 shadow-lg rounded-lg", isAr ? "text-right" : "text-left")}
      dir={isAr ? "rtl" : "ltr"}
    >
      <header className="mb-6 pb-4" style={{ borderBottom: `4px solid ${colors.primary}`, backgroundColor: colors.secondary, marginLeft: isAr ? "0" : "-1.5rem", marginRight: isAr ? "-1.5rem" : "0", padding: "1.5rem", paddingBottom: "1rem" }}>
        <h1 className="text-4xl font-bold mb-2" style={{ color: colors.primary }}>
          {data.fullName || t("Your Name", "اسمك")}
        </h1>
        {data.title && (
          <p className="text-base text-zinc-700 mb-2 font-semibold">{data.title}</p>
        )}
        <div className="flex flex-wrap gap-3 text-sm" style={{ color: colors.accent }}>
          {data.contact?.email && <span>{data.contact.email}</span>}
          {data.contact?.phone && <span>{data.contact.phone}</span>}
          {data.contact?.location && <span>{data.contact.location}</span>}
          {data.contact?.website && (
            <a href={data.contact.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {data.contact.website}
            </a>
          )}
        </div>
      </header>

      {data.summary && (
        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2" style={{ color: colors.primary }}>
            {t("Summary", "الملخص")}
          </h2>
          <p className="text-zinc-700 leading-relaxed">{data.summary}</p>
        </section>
      )}

      {data.experience && data.experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-bold mb-3 pb-2" style={{ color: colors.primary, borderBottom: `3px solid ${colors.accent}` }}>
            {t("Experience", "الخبرات")}
          </h2>
          <div className="space-y-4">
            {data.experience.map((exp, idx) => (
              <div key={idx} className={cn("mb-4", isAr ? "pr-4" : "pl-4")} style={{ [isAr ? "borderRight" : "borderLeft"]: `4px solid ${colors.accent}` }}>
                <div className={cn("flex justify-between items-start mb-1", isAr ? "flex-row-reverse" : "")}>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg" style={{ color: colors.primary }}>{exp.role || t("Role", "الوظيفة")}</h3>
                    <p className="text-base text-zinc-700 font-semibold">{exp.company || t("Company", "الشركة")}</p>
                  </div>
                  <div className={cn("text-sm text-zinc-600 whitespace-nowrap", isAr ? "ml-3" : "mr-3")}>
                    {exp.startDate || ""} {exp.endDate ? ` ${isAr ? "إلى" : "-"} ${exp.endDate}` : ` ${t("Present", "حتى الآن")}`}
                  </div>
                </div>
                {exp.description && (
                  <p className="text-zinc-600 text-sm whitespace-pre-line mt-2 leading-relaxed">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {data.education && data.education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-bold mb-3 pb-2" style={{ color: colors.primary, borderBottom: `3px solid ${colors.accent}` }}>
            {t("Education", "التعليم")}
          </h2>
          <div className="space-y-3">
            {data.education.map((edu, idx) => (
              <div key={idx} className={cn("flex justify-between items-start", isAr ? "pr-4 flex-row-reverse" : "pl-4")} style={{ [isAr ? "borderRight" : "borderLeft"]: `4px solid ${colors.accent}` }}>
                <div className="flex-1">
                  <h3 className="font-bold text-base" style={{ color: colors.primary }}>{edu.degree || t("Degree", "المؤهل")}</h3>
                  <p className="text-sm text-zinc-700 font-semibold">{edu.school || t("Institution", "المؤسسة")}</p>
                </div>
                <div className={cn("text-sm text-zinc-600 whitespace-nowrap", isAr ? "ml-3" : "mr-3")}>
                  {edu.startDate || ""} {edu.endDate ? ` ${isAr ? "إلى" : "-"} ${edu.endDate}` : ""}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.skills && data.skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-bold mb-3 pb-2" style={{ color: colors.primary, borderBottom: `3px solid ${colors.accent}` }}>
            {t("Skills", "المهارات")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, idx) => (
              skill && (
                <span key={idx} className="px-3 py-1 rounded font-semibold text-sm" style={{ backgroundColor: colors.primary, color: "#ffffff" }}>
                  {skill}
                </span>
              )
            ))}
          </div>
        </section>
      )}

      {data.languages && data.languages.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-bold mb-3 pb-2" style={{ color: colors.primary, borderBottom: `3px solid ${colors.accent}` }}>
            {t("Languages", "اللغات")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.languages.map((lang, idx) => (
              lang && (
                <span key={idx} className="text-zinc-700 font-semibold">
                  {lang}
                  {idx < data.languages.length - 1 && <span className="mx-1">{isAr ? "،" : ","}</span>}
                </span>
              )
            ))}
          </div>
        </section>
      )}

      {data.certifications && data.certifications.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-bold mb-3 pb-2" style={{ color: colors.primary, borderBottom: `3px solid ${colors.accent}` }}>
            {t("Certifications", "الشهادات")}
          </h2>
          <ul className={cn("list-disc space-y-1", isAr ? "mr-6" : "ml-6")}>
            {data.certifications.map((cert, idx) => (
              cert && <li key={idx} className="text-zinc-700 font-semibold">{cert}</li>
            ))}
          </ul>
        </section>
      )}

      {(!data.fullName && !data.experience?.length && !data.education?.length) && (
        <div className="text-center py-12 text-zinc-400">
          <p className="text-lg mb-2">{t("CV Preview", "معاينة السيرة الذاتية")}</p>
          <p className="text-sm">{t("Start filling the form to see your CV preview here", "ابدأ بملء النموذج لرؤية معاينة سيرتك الذاتية هنا")}</p>
        </div>
      )}
    </div>
  );
};

/**
 * Technical Template - Structured for technical roles
 */
const TechnicalTemplate = ({ data, isAr }: { data: CvDraftData; isAr: boolean }) => {
  const { t } = useLocale();
  const template = getTemplate("technical");
  const colors = template?.previewColors || { primary: "#004d40", secondary: "#e0f2f1", accent: "#26a69a", text: "#263238" };

  return (
    <div
      className={cn("cv-preview bg-white text-zinc-900 p-6 md:p-8 shadow-lg rounded-lg", isAr ? "text-right" : "text-left")}
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="grid grid-cols-12 gap-4">
        {/* Sidebar */}
        <div className="col-span-12 md:col-span-4 p-4 rounded" style={{ backgroundColor: colors.secondary }}>
          <h1 className="text-2xl font-bold mb-2" style={{ color: colors.primary }}>
            {data.fullName || t("Your Name", "اسمك")}
          </h1>
          {data.title && (
            <p className="text-sm text-zinc-700 mb-4">{data.title}</p>
          )}
          <div className="space-y-2 text-xs text-zinc-600 mb-6">
            {data.contact?.email && <div>{data.contact.email}</div>}
            {data.contact?.phone && <div>{data.contact.phone}</div>}
            {data.contact?.location && <div>{data.contact.location}</div>}
            {data.contact?.website && (
              <a href={data.contact.website} target="_blank" rel="noopener noreferrer" style={{ color: colors.accent }} className="hover:underline">
                {data.contact.website}
              </a>
            )}
          </div>

          {data.skills && data.skills.length > 0 && (
            <section className="mb-4">
              <h2 className="text-sm font-bold mb-2 uppercase" style={{ color: colors.primary }}>
                {t("Skills", "المهارات")}
              </h2>
              <div className="space-y-1">
                {data.skills.map((skill, idx) => (
                  skill && (
                    <div key={idx} className="text-xs text-zinc-700">• {skill}</div>
                  )
                ))}
              </div>
            </section>
          )}

          {data.languages && data.languages.length > 0 && (
            <section className="mb-4">
              <h2 className="text-sm font-bold mb-2 uppercase" style={{ color: colors.primary }}>
                {t("Languages", "اللغات")}
              </h2>
              <div className="text-xs text-zinc-700">
                {data.languages.join(isAr ? "، " : ", ")}
              </div>
            </section>
          )}
        </div>

        {/* Main Content */}
        <div className="col-span-12 md:col-span-8">
          {data.summary && (
            <section className="mb-6">
              <h2 className="text-lg font-bold mb-2 pb-1 border-b-2" style={{ color: colors.primary, borderColor: colors.accent }}>
                {t("Summary", "الملخص")}
              </h2>
              <p className="text-zinc-700 text-sm leading-relaxed">{data.summary}</p>
            </section>
          )}

          {data.experience && data.experience.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-bold mb-3 pb-1 border-b-2" style={{ color: colors.primary, borderColor: colors.accent }}>
                {t("Experience", "الخبرات")}
              </h2>
              <div className="space-y-4">
                {data.experience.map((exp, idx) => (
                  <div key={idx} className="mb-3">
                    <div className={cn("flex justify-between items-start mb-1", isAr ? "flex-row-reverse" : "")}>
                      <div className="flex-1">
                        <h3 className="font-bold text-base" style={{ color: colors.primary }}>{exp.role || t("Role", "الوظيفة")}</h3>
                        <p className="text-sm text-zinc-700 font-semibold">{exp.company || t("Company", "الشركة")}</p>
                      </div>
                      <div className={cn("text-xs text-zinc-600 whitespace-nowrap", isAr ? "ml-3" : "mr-3")}>
                        {exp.startDate || ""} {exp.endDate ? ` ${isAr ? "إلى" : "-"} ${exp.endDate}` : ` ${t("Present", "حتى الآن")}`}
                      </div>
                    </div>
                    {exp.description && (
                      <p className="text-zinc-600 text-xs whitespace-pre-line mt-1 leading-relaxed">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.education && data.education.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-bold mb-3 pb-1 border-b-2" style={{ color: colors.primary, borderColor: colors.accent }}>
                {t("Education", "التعليم")}
              </h2>
              <div className="space-y-3">
                {data.education.map((edu, idx) => (
                  <div key={idx} className={cn("flex justify-between items-start", isAr ? "flex-row-reverse" : "")}>
                    <div className="flex-1">
                      <h3 className="font-bold text-sm" style={{ color: colors.primary }}>{edu.degree || t("Degree", "المؤهل")}</h3>
                      <p className="text-xs text-zinc-700 font-semibold">{edu.school || t("Institution", "المؤسسة")}</p>
                    </div>
                    <div className={cn("text-xs text-zinc-600 whitespace-nowrap", isAr ? "ml-3" : "mr-3")}>
                      {edu.startDate || ""} {edu.endDate ? ` ${isAr ? "إلى" : "-"} ${edu.endDate}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.certifications && data.certifications.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-bold mb-3 pb-1 border-b-2" style={{ color: colors.primary, borderColor: colors.accent }}>
                {t("Certifications", "الشهادات")}
              </h2>
              <ul className={cn("list-disc space-y-1 text-sm", isAr ? "mr-6" : "ml-6")}>
                {data.certifications.map((cert, idx) => (
                  cert && <li key={idx} className="text-zinc-700">{cert}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {(!data.fullName && !data.experience?.length && !data.education?.length) && (
        <div className="text-center py-12 text-zinc-400 col-span-12">
          <p className="text-lg mb-2">{t("CV Preview", "معاينة السيرة الذاتية")}</p>
          <p className="text-sm">{t("Start filling the form to see your CV preview here", "ابدأ بملء النموذج لرؤية معاينة سيرتك الذاتية هنا")}</p>
        </div>
      )}
    </div>
  );
};

/**
 * Minimalist Template - Clean and minimal
 */
const MinimalistTemplate = ({ data, isAr }: { data: CvDraftData; isAr: boolean }) => {
  const { t } = useLocale();
  const template = getTemplate("minimalist");
  const colors = template?.previewColors || { primary: "#212121", secondary: "#ffffff", accent: "#757575", text: "#212121" };

  return (
    <div
      className={cn("cv-preview bg-white text-zinc-900 p-6 md:p-8 shadow-lg rounded-lg", isAr ? "text-right" : "text-left")}
      dir={isAr ? "rtl" : "ltr"}
    >
      <header className="mb-8 pb-6 border-b" style={{ borderColor: colors.accent + "30" }}>
        <h1 className="text-3xl font-light mb-1" style={{ color: colors.text, fontWeight: 300 }}>
          {data.fullName || t("Your Name", "اسمك")}
        </h1>
        {data.title && (
          <p className="text-sm text-zinc-500 mt-1">{data.title}</p>
        )}
        <div className="flex flex-wrap gap-3 text-xs text-zinc-400 mt-3">
          {data.contact?.email && <span>{data.contact.email}</span>}
          {data.contact?.phone && <span>{data.contact.phone}</span>}
          {data.contact?.location && <span>{data.contact.location}</span>}
          {data.contact?.website && (
            <a href={data.contact.website} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:underline">
              {data.contact.website}
            </a>
          )}
        </div>
      </header>

      {data.summary && (
        <section className="mb-6">
          <p className="text-zinc-700 text-sm leading-relaxed">{data.summary}</p>
        </section>
      )}

      {data.experience && data.experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-base font-light mb-3 uppercase tracking-widest text-zinc-400" style={{ fontSize: "0.75rem", letterSpacing: "0.2em" }}>
            {t("Experience", "الخبرات")}
          </h2>
          <div className="space-y-4">
            {data.experience.map((exp, idx) => (
              <div key={idx} className="mb-4">
                <div className={cn("flex justify-between items-start mb-1", isAr ? "flex-row-reverse" : "")}>
                  <div className="flex-1">
                    <h3 className="font-normal text-base text-zinc-900">{exp.role || t("Role", "الوظيفة")}</h3>
                    <p className="text-sm text-zinc-500">{exp.company || t("Company", "الشركة")}</p>
                  </div>
                  <div className={cn("text-xs text-zinc-400 whitespace-nowrap", isAr ? "ml-3" : "mr-3")}>
                    {exp.startDate || ""} {exp.endDate ? ` ${isAr ? "إلى" : "-"} ${exp.endDate}` : ` ${t("Present", "حتى الآن")}`}
                  </div>
                </div>
                {exp.description && (
                  <p className="text-zinc-600 text-xs whitespace-pre-line mt-1 leading-relaxed">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {data.education && data.education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-base font-light mb-3 uppercase tracking-widest text-zinc-400" style={{ fontSize: "0.75rem", letterSpacing: "0.2em" }}>
            {t("Education", "التعليم")}
          </h2>
          <div className="space-y-3">
            {data.education.map((edu, idx) => (
              <div key={idx} className={cn("flex justify-between items-start", isAr ? "flex-row-reverse" : "")}>
                <div className="flex-1">
                  <h3 className="font-normal text-sm text-zinc-900">{edu.degree || t("Degree", "المؤهل")}</h3>
                  <p className="text-xs text-zinc-500">{edu.school || t("Institution", "المؤسسة")}</p>
                </div>
                <div className={cn("text-xs text-zinc-400 whitespace-nowrap", isAr ? "ml-3" : "mr-3")}>
                  {edu.startDate || ""} {edu.endDate ? ` ${isAr ? "إلى" : "-"} ${edu.endDate}` : ""}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.skills && data.skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-base font-light mb-3 uppercase tracking-widest text-zinc-400" style={{ fontSize: "0.75rem", letterSpacing: "0.2em" }}>
            {t("Skills", "المهارات")}
          </h2>
          <div className="flex flex-wrap gap-1 text-xs text-zinc-600">
            {data.skills.map((skill, idx) => (
              skill && (
                <span key={idx}>
                  {skill}
                  {idx < data.skills.length - 1 && <span className="mx-1 text-zinc-300">{isAr ? "•" : "•"}</span>}
                </span>
              )
            ))}
          </div>
        </section>
      )}

      {data.languages && data.languages.length > 0 && (
        <section className="mb-6">
          <h2 className="text-base font-light mb-3 uppercase tracking-widest text-zinc-400" style={{ fontSize: "0.75rem", letterSpacing: "0.2em" }}>
            {t("Languages", "اللغات")}
          </h2>
          <div className="text-xs text-zinc-600">
            {data.languages.join(isAr ? "، " : ", ")}
          </div>
        </section>
      )}

      {data.certifications && data.certifications.length > 0 && (
        <section className="mb-6">
          <h2 className="text-base font-light mb-3 uppercase tracking-widest text-zinc-400" style={{ fontSize: "0.75rem", letterSpacing: "0.2em" }}>
            {t("Certifications", "الشهادات")}
          </h2>
          <div className="space-y-1 text-xs text-zinc-600">
            {data.certifications.map((cert, idx) => (
              cert && <div key={idx}>{cert}</div>
            ))}
          </div>
        </section>
      )}

      {(!data.fullName && !data.experience?.length && !data.education?.length) && (
        <div className="text-center py-12 text-zinc-400">
          <p className="text-lg mb-2">{t("CV Preview", "معاينة السيرة الذاتية")}</p>
          <p className="text-sm">{t("Start filling the form to see your CV preview here", "ابدأ بملء النموذج لرؤية معاينة سيرتك الذاتية هنا")}</p>
        </div>
      )}
    </div>
  );
};

/**
 * Colorful Template - Vibrant and colorful
 */
const ColorfulTemplate = ({ data, isAr }: { data: CvDraftData; isAr: boolean }) => {
  const { t } = useLocale();
  const template = getTemplate("colorful");
  const colors = template?.previewColors || { primary: "#c62828", secondary: "#ffebee", accent: "#ef5350", text: "#212121" };

  return (
    <div
      className={cn("cv-preview bg-white text-zinc-900 p-6 md:p-8 shadow-lg rounded-lg", isAr ? "text-right" : "text-left")}
      dir={isAr ? "rtl" : "ltr"}
    >
      <header className="mb-6 pb-4" style={{ borderBottom: `5px solid ${colors.primary}` }}>
        <h1 className="text-4xl font-black mb-2" style={{ color: colors.primary, fontWeight: 900 }}>
          {data.fullName || t("Your Name", "اسمك")}
        </h1>
        {data.title && (
          <p className="text-base text-zinc-700 mb-2 font-bold">{data.title}</p>
        )}
        <div className="flex flex-wrap gap-3 text-sm font-semibold" style={{ color: colors.accent }}>
          {data.contact?.email && <span>{data.contact.email}</span>}
          {data.contact?.phone && <span>{data.contact.phone}</span>}
          {data.contact?.location && <span>{data.contact.location}</span>}
          {data.contact?.website && (
            <a href={data.contact.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {data.contact.website}
            </a>
          )}
        </div>
      </header>

      {data.summary && (
        <section className="mb-6 p-4 rounded" style={{ backgroundColor: colors.secondary }}>
          <h2 className="text-xl font-black mb-2" style={{ color: colors.primary }}>
            {t("Summary", "الملخص")}
          </h2>
          <p className="text-zinc-700 leading-relaxed">{data.summary}</p>
        </section>
      )}

      {data.experience && data.experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-2xl font-black mb-3 pb-2" style={{ color: colors.primary, borderBottom: `4px solid ${colors.accent}` }}>
            {t("Experience", "الخبرات")}
          </h2>
          <div className="space-y-4">
            {data.experience.map((exp, idx) => (
              <div key={idx} className="mb-4 p-3 rounded" style={{ backgroundColor: colors.secondary + "40" }}>
                <div className={cn("flex justify-between items-start mb-1", isAr ? "flex-row-reverse" : "")}>
                  <div className="flex-1">
                    <h3 className="font-black text-lg" style={{ color: colors.primary }}>{exp.role || t("Role", "الوظيفة")}</h3>
                    <p className="text-base text-zinc-700 font-bold">{exp.company || t("Company", "الشركة")}</p>
                  </div>
                  <div className={cn("text-sm text-zinc-600 whitespace-nowrap font-bold", isAr ? "ml-3" : "mr-3")}>
                    {exp.startDate || ""} {exp.endDate ? ` ${isAr ? "إلى" : "-"} ${exp.endDate}` : ` ${t("Present", "حتى الآن")}`}
                  </div>
                </div>
                {exp.description && (
                  <p className="text-zinc-600 text-sm whitespace-pre-line mt-2 leading-relaxed">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {data.education && data.education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-2xl font-black mb-3 pb-2" style={{ color: colors.primary, borderBottom: `4px solid ${colors.accent}` }}>
            {t("Education", "التعليم")}
          </h2>
          <div className="space-y-3">
            {data.education.map((edu, idx) => (
              <div key={idx} className={cn("flex justify-between items-start p-3 rounded", isAr ? "flex-row-reverse" : "")} style={{ backgroundColor: colors.secondary + "40" }}>
                <div className="flex-1">
                  <h3 className="font-black text-base" style={{ color: colors.primary }}>{edu.degree || t("Degree", "المؤهل")}</h3>
                  <p className="text-sm text-zinc-700 font-bold">{edu.school || t("Institution", "المؤسسة")}</p>
                </div>
                <div className={cn("text-sm text-zinc-600 whitespace-nowrap font-bold", isAr ? "ml-3" : "mr-3")}>
                  {edu.startDate || ""} {edu.endDate ? ` ${isAr ? "إلى" : "-"} ${edu.endDate}` : ""}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.skills && data.skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-2xl font-black mb-3 pb-2" style={{ color: colors.primary, borderBottom: `4px solid ${colors.accent}` }}>
            {t("Skills", "المهارات")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, idx) => (
              skill && (
                <span key={idx} className="px-4 py-2 rounded-full font-bold text-sm" style={{ backgroundColor: colors.primary, color: "#ffffff" }}>
                  {skill}
                </span>
              )
            ))}
          </div>
        </section>
      )}

      {data.languages && data.languages.length > 0 && (
        <section className="mb-6">
          <h2 className="text-2xl font-black mb-3 pb-2" style={{ color: colors.primary, borderBottom: `4px solid ${colors.accent}` }}>
            {t("Languages", "اللغات")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.languages.map((lang, idx) => (
              lang && (
                <span key={idx} className="px-3 py-1 rounded font-bold text-sm" style={{ backgroundColor: colors.accent, color: "#ffffff" }}>
                  {lang}
                </span>
              )
            ))}
          </div>
        </section>
      )}

      {data.certifications && data.certifications.length > 0 && (
        <section className="mb-6">
          <h2 className="text-2xl font-black mb-3 pb-2" style={{ color: colors.primary, borderBottom: `4px solid ${colors.accent}` }}>
            {t("Certifications", "الشهادات")}
          </h2>
          <ul className={cn("list-disc space-y-1", isAr ? "mr-6" : "ml-6")}>
            {data.certifications.map((cert, idx) => (
              cert && <li key={idx} className="text-zinc-700 font-bold">{cert}</li>
            ))}
          </ul>
        </section>
      )}

      {(!data.fullName && !data.experience?.length && !data.education?.length) && (
        <div className="text-center py-12 text-zinc-400">
          <p className="text-lg mb-2">{t("CV Preview", "معاينة السيرة الذاتية")}</p>
          <p className="text-sm">{t("Start filling the form to see your CV preview here", "ابدأ بملء النموذج لرؤية معاينة سيرتك الذاتية هنا")}</p>
        </div>
      )}
    </div>
  );
};

export function LiveCvPreview({ data, templateKey, cvLanguage, className = "" }: LiveCvPreviewProps) {
  const { t } = useLocale();
  
  // Use CV language from props or data, fallback to "en"
  // This determines the content language and RTL/LTR direction, separate from UI locale
  const actualCvLanguage = cvLanguage || data.cvLanguage || "en";
  const isCvAr = actualCvLanguage === "ar";

  // Generate preview content based on template
  const previewContent = useMemo(() => {
    const template = templateKey || "classic";

    switch (template) {
      case "classic":
        return <ClassicTemplate data={data} isAr={isCvAr} />;
      case "modern":
        return <ModernTemplate data={data} isAr={isCvAr} />;
      case "elegant":
        return <ElegantTemplate data={data} isAr={isCvAr} />;
      case "creative":
        return <CreativeTemplate data={data} isAr={isCvAr} />;
      case "technical":
        return <TechnicalTemplate data={data} isAr={isCvAr} />;
      case "minimalist":
        return <MinimalistTemplate data={data} isAr={isCvAr} />;
      case "colorful":
        return <ColorfulTemplate data={data} isAr={isCvAr} />;
      default:
        return <ClassicTemplate data={data} isAr={isCvAr} />;
    }
  }, [data, templateKey, isCvAr]);

  return (
    <div className={`live-cv-preview ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-sm text-zinc-700 dark:text-zinc-300">
          {t("Live Preview", "معاينة مباشرة")}
        </h3>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {t("Updates as you type", "يتحدث أثناء الكتابة")}
        </span>
      </div>
      <div className="cv-preview-container max-h-[calc(100vh-8rem)] overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        {previewContent}
      </div>
    </div>
  );
}