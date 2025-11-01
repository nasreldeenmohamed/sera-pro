"use client";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

/**
 * PDF Template Components
 * 
 * DEFAULT BEHAVIOR: Arabic (ar) with RTL layout
 * - PDF templates support both Arabic (RTL) and English (LTR) layouts
 * - isAr prop determines direction and formatting
 * - Date formats, separators, and text alignment adapt based on language
 * - Supports watermark overlay for free plan users (shows "Sera Pro - سيرة برو" logo/text)
 * 
 * TODO(fonts): Register Arabic-capable fonts for better RTL rendering
 * Currently using default fonts for MVP - Arabic fonts would improve RTL text rendering
 */

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, direction: "ltr", position: "relative", fontFamily: "Helvetica" }, // Base style - will be overridden by rtl style
  rtl: { direction: "rtl" }, // RTL direction for Arabic content
  headerSection: { 
    marginBottom: 16, 
    paddingBottom: 12, 
    borderBottomWidth: 3, 
    borderBottomColor: "#0d47a1" 
  },
  headerName: { fontSize: 24, fontWeight: "bold", color: "#0d47a1", marginBottom: 4 },
  headerTitle: { fontSize: 14, color: "#374151", marginBottom: 8 },
  headerContact: { fontSize: 10, color: "#6b7280", marginTop: 2 },
  sectionTitle: { 
    fontSize: 14, 
    fontWeight: "bold", 
    color: "#0d47a1", 
    marginTop: 12, 
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: "#0d47a1"
  },
  section: { marginTop: 12, marginBottom: 8 },
  row: { marginTop: 8, marginBottom: 8 },
  experienceRole: { fontSize: 12, fontWeight: "bold", color: "#111827", marginBottom: 2 },
  experienceCompany: { fontSize: 11, color: "#374151", marginBottom: 4 },
  experienceDate: { fontSize: 10, color: "#6b7280", fontStyle: "italic" },
  experienceDesc: { fontSize: 10, color: "#4b5563", marginTop: 4, lineHeight: 1.4 },
  educationDegree: { fontSize: 12, fontWeight: "bold", color: "#111827", marginBottom: 2 },
  educationSchool: { fontSize: 11, color: "#374151" },
  educationDate: { fontSize: 10, color: "#6b7280", fontStyle: "italic" },
  skillsText: { fontSize: 10, color: "#374151", lineHeight: 1.5 },
  summaryText: { fontSize: 10, color: "#374151", lineHeight: 1.6, marginTop: 4 },
  watermark: {
    position: "absolute",
    top: "35%",
    left: "15%",
    fontSize: 64,
    color: "#d1d5db",
    opacity: 0.3,
    transform: "rotate(-45deg)",
    fontWeight: "bold",
    letterSpacing: 3,
  },
  content: {
    position: "relative",
    zIndex: 1,
  },
});

/**
 * Classic CV Template
 * 
 * Supports both Arabic (RTL) and English (LTR) layouts.
 * - Uses appropriate date separators (Arabic: "إلى", English: "-")
 * - Applies RTL direction for Arabic CVs
 * - Formats skills list with appropriate separators (Arabic: "، ", English: ", ")
 * - Supports watermark overlay for free plan users
 * 
 * @param data - CV data object containing personal info, experience, education, skills, etc.
 * @param isAr - Whether the CV content is in Arabic (affects RTL/LTR direction)
 * @param showWatermark - If true, displays "Sera Pro - سيرة برو" watermark diagonally across the page
 */
export function ClassicTemplate({ data, isAr, showWatermark = false, templateKey }: { data: any; isAr: boolean; showWatermark?: boolean; templateKey?: string }) {
  return (
    <Document>
      <Page size="A4" style={[styles.page, isAr ? styles.rtl : null] as any}>
        {/* Prominent watermark overlay for free plan users */}
        {showWatermark && (
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
            <Text style={styles.watermark}>
              {isAr ? "سيرة برو" : "SERA PRO"}
            </Text>
          </View>
        )}
        
        {/* CV Content */}
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.headerName}>{data.fullName || (isAr ? "الاسم الكامل" : "Full Name")}</Text>
            {data.title && <Text style={styles.headerTitle}>{data.title}</Text>}
            <View style={{ marginTop: 4 }}>
              {data.contact?.email && <Text style={styles.headerContact}>{data.contact.email}</Text>}
              {data.contact?.phone && <Text style={styles.headerContact}>{data.contact.phone}</Text>}
              {data.contact?.location && <Text style={styles.headerContact}>{data.contact.location}</Text>}
              {data.contact?.website && <Text style={styles.headerContact}>{data.contact.website}</Text>}
            </View>
          </View>

          {/* Professional Summary */}
          {data.summary && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{isAr ? "الملخص المهني" : "Professional Summary"}</Text>
              <Text style={styles.summaryText}>{data.summary}</Text>
            </View>
          )}

          {/* Professional Experience */}
          {Array.isArray(data.experience) && data.experience.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{isAr ? "الخبرة المهنية" : "Professional Experience"}</Text>
              {data.experience.map((e: any, i: number) => (
                <View key={i} style={styles.row}>
                  <Text style={styles.experienceRole}>{e.role || (isAr ? "الوظيفة" : "Role")}</Text>
                  <Text style={styles.experienceCompany}>{e.company || (isAr ? "الشركة" : "Company")}</Text>
                  <Text style={styles.experienceDate}>
                    {e.startDate || ""}{e.endDate ? (isAr ? ` إلى ${e.endDate}` : ` - ${e.endDate}`) : (isAr ? " - حتى الآن" : " - Present")}
                  </Text>
                  {e.description && (
                    <Text style={styles.experienceDesc}>{e.description}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Education */}
          {Array.isArray(data.education) && data.education.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{isAr ? "التعليم" : "Education"}</Text>
              {data.education.map((e: any, i: number) => (
                <View key={i} style={styles.row}>
                  <Text style={styles.educationDegree}>{e.degree || (isAr ? "المؤهل" : "Degree")}</Text>
                  <Text style={styles.educationSchool}>{e.school || (isAr ? "المؤسسة" : "Institution")}</Text>
                  <Text style={styles.educationDate}>
                    {e.startDate || ""}{e.endDate ? (isAr ? ` إلى ${e.endDate}` : ` - ${e.endDate}`) : ""}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Skills */}
          {Array.isArray(data.skills) && data.skills.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{isAr ? "المهارات" : "Skills"}</Text>
              <Text style={styles.skillsText}>{data.skills.join(isAr ? "، " : ", ")}</Text>
            </View>
          )}

          {/* Languages */}
          {Array.isArray(data.languages) && data.languages.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{isAr ? "اللغات" : "Languages"}</Text>
              <Text style={styles.skillsText}>{data.languages.join(isAr ? "، " : ", ")}</Text>
            </View>
          )}

          {/* Certifications */}
          {Array.isArray(data.certifications) && data.certifications.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{isAr ? "الشهادات" : "Certifications"}</Text>
              {data.certifications.map((cert: string, i: number) => (
                <Text key={i} style={{ ...styles.skillsText, marginTop: 2 }}>• {cert}</Text>
              ))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}


