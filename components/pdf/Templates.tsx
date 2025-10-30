"use client";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

// TODO(fonts): Register Arabic-capable fonts for better RTL; using default for MVP

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 11, direction: "ltr" },
  rtl: { direction: "rtl" },
  header: { fontSize: 16, marginBottom: 8 },
  section: { marginTop: 8 },
  row: { marginTop: 4 },
});

export function ClassicTemplate({ data, isAr }: { data: any; isAr: boolean }) {
  return (
    <Document>
      <Page size="A4" style={[styles.page, isAr ? styles.rtl : null] as any}>
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
      </Page>
    </Document>
  );
}


