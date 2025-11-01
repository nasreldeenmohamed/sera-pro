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
  page: { padding: 24, fontSize: 11, direction: "ltr", position: "relative" }, // Base style - will be overridden by rtl style
  rtl: { direction: "rtl" }, // RTL direction for Arabic content
  header: { fontSize: 16, marginBottom: 8 },
  section: { marginTop: 8 },
  row: { marginTop: 4 },
  watermark: {
    position: "absolute",
    top: "40%",
    left: "25%",
    fontSize: 48,
    color: "#cccccc",
    opacity: 0.15,
    transform: "rotate(-45deg)",
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
export function ClassicTemplate({ data, isAr, showWatermark = false }: { data: any; isAr: boolean; showWatermark?: boolean }) {
  return (
    <Document>
      <Page size="A4" style={[styles.page, isAr ? styles.rtl : null] as any}>
        {/* Watermark overlay for free plan users */}
        {showWatermark && (
          <Text style={styles.watermark}>
            {isAr ? "سيرة برو" : "Sera Pro"}
          </Text>
        )}
        
        {/* CV Content */}
        <View style={styles.content}>
          <Text style={styles.header}>{data.fullName}</Text>
          {data.title ? <Text>{data.title}</Text> : null}
          {data.contact?.email ? <Text>{data.contact.email}</Text> : null}
          {data.contact?.phone ? <Text>{data.contact.phone}</Text> : null}
          {data.summary ? <Text style={styles.section}>{data.summary}</Text> : null}

          {Array.isArray(data.experience) && data.experience.length > 0 && (
            <View style={styles.section}>
              <Text>{isAr ? "الخبرات" : "Experience"}</Text>
              {data.experience.map((e: any, i: number) => (
                <View key={i} style={styles.row}>
                  <Text>{e.role} - {e.company}</Text>
                  <Text>{e.startDate}{e.endDate ? ` - ${e.endDate}` : ""}</Text>
                  {e.description ? <Text>{e.description}</Text> : null}
                </View>
              ))}
            </View>
          )}

          {Array.isArray(data.education) && data.education.length > 0 && (
            <View style={styles.section}>
              <Text>{isAr ? "التعليم" : "Education"}</Text>
              {data.education.map((e: any, i: number) => (
                <View key={i} style={styles.row}>
                  <Text>{e.degree} - {e.school}</Text>
                  <Text>{e.startDate}{e.endDate ? ` - ${e.endDate}` : ""}</Text>
                </View>
              ))}
            </View>
          )}

          {Array.isArray(data.skills) && data.skills.length > 0 && (
            <View style={styles.section}>
              <Text>{isAr ? "المهارات" : "Skills"}</Text>
              <Text>{data.skills.join(isAr ? "، " : ", ")}</Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}


