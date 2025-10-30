"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { saveCvDraft, updateCvDraft, getUserCv } from "@/firebase/firestore";
import { ClassicTemplate } from "@/components/pdf/Templates";
import { downloadPdf } from "@/lib/pdf";
import { SiteLayout } from "@/components/layout/SiteLayout";

// Multi-step CV builder schema (MVP): supports basic structure with arrays
const experienceSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  description: z.string().optional(),
});
const educationSchema = z.object({
  school: z.string().min(1),
  degree: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
});
const schema = z.object({
  fullName: z.string().min(1),
  title: z.string().optional(),
  summary: z.string().optional(),
  contact: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    website: z.string().optional(),
  }),
  experience: z.array(experienceSchema).default([]),
  education: z.array(educationSchema).default([]),
  skills: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  templateKey: z.string().default("classic"),
});

type FormValues = z.infer<typeof schema>;

export default function CreateCvPage() {
  const router = useRouter();
  const params = useSearchParams();
  const cvId = params.get("id");
  const { user } = useAuth();
  const { isAr, t } = useLocale();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      title: "",
      summary: "",
      contact: { email: "", phone: "", location: "", website: "" },
      experience: [],
      education: [],
      skills: [],
      languages: [],
      certifications: [],
      templateKey: "classic",
    },
  });

  const expArray = useFieldArray({ control: form.control, name: "experience" });
  const eduArray = useFieldArray({ control: form.control, name: "education" });
  const skillsArray = useFieldArray({ control: form.control, name: "skills" });
  const langsArray = useFieldArray({ control: form.control, name: "languages" });
  const certsArray = useFieldArray({ control: form.control, name: "certifications" });

  // Load for edit
  useEffect(() => {
    async function load() {
      if (!cvId || !user) return;
      const data = await getUserCv(user.uid, cvId);
      if (data) {
        // Best-effort populate known fields; other custom fields remain
        form.reset({
          fullName: (data as any).fullName || "",
          title: (data as any).title || "",
          summary: (data as any).summary || "",
          contact: (data as any).contact || { email: "", phone: "", location: "", website: "" },
          experience: (data as any).experience || [],
          education: (data as any).education || [],
          skills: (data as any).skills || [],
          languages: (data as any).languages || [],
          certifications: (data as any).certifications || [],
          templateKey: (data as any).templateKey || "classic",
        });
      }
    }
    load();
  }, [cvId, user, form]);

  async function saveDraft() {
    if (!user) return;
    const values = form.getValues();
    const payload = { ...values, status: "draft" } as any;
    if (cvId) {
      await updateCvDraft(user.uid, cvId, payload);
    } else {
      const ref = await saveCvDraft(user.uid, { fullName: values.fullName, summary: values.summary || "" });
      await updateCvDraft(user.uid, ref.id, payload);
    }
  }

  // Simple template dropdown for MVP
  const templates = useMemo(() => [
    { key: "classic", name: t("Classic", "كلاسيك") },
    { key: "modern", name: t("Modern", "حديث") },
    { key: "elegant", name: t("Elegant", "أنيق") },
  ], [t]);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function enhanceWithAI() {
    setAiError(null);
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: form.getValues(), locale: isAr ? "ar" : "en" }),
      });
      if (!res.ok) throw new Error("AI failed");
      const json = await res.json();
      form.reset(json.data);
    } catch (e: any) {
      setAiError(e?.message || "AI error");
    } finally {
      setAiLoading(false);
    }
  }

  async function exportPdf() {
    // TODO(templates): Switch on templateKey for different designs; add fonts for Arabic
    const data = form.getValues();
    await downloadPdf(<ClassicTemplate data={data} isAr={isAr} />, `${data.fullName || "cv"}.pdf`);
  }

  return (
    <SiteLayout>
      <section className="mx-auto w-full max-w-5xl p-6 sm:p-8 md:p-12">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{t("CV Builder", "منشئ السيرة")}</h1>
          <div className="flex flex-wrap gap-2">
            {/* AI Enhance: calls API route; TODO refine prompt and handle edge cases */}
            <Button variant="secondary" disabled={aiLoading} onClick={enhanceWithAI}>{aiLoading ? t("Enhancing...", "...تحسين") : t("Enhance with AI", "تحسين بالذكاء")}</Button>
            {/* PDF Export: client-side generation using React-PDF; TODO add more templates and fonts */}
            <Button variant="secondary" onClick={exportPdf}>{t("Download as PDF", "تنزيل كملف PDF")}</Button>
            <Button onClick={saveDraft} className="text-white" style={{ backgroundColor: "#0d47a1" }}>{t("Save Draft", "حفظ مسودة")}</Button>
          </div>
        </header>
        {aiError ? <p className="text-sm text-red-600">{aiError}</p> : null}

        {/* Multi-step via Tabs for MVP (wrap everything in Form provider so FormField has context) */}
        <Form {...form}>
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid grid-cols-3 sm:grid-cols-6">
            <TabsTrigger value="personal">{t("Personal", "بيانات")}</TabsTrigger>
            <TabsTrigger value="experience">{t("Experience", "خبرات")}</TabsTrigger>
            <TabsTrigger value="education">{t("Education", "تعليم")}</TabsTrigger>
            <TabsTrigger value="skills">{t("Skills", "مهارات")}</TabsTrigger>
            <TabsTrigger value="languages">{t("Languages", "لغات")}</TabsTrigger>
            <TabsTrigger value="certs">{t("Certs", "شهادات")}</TabsTrigger>
          </TabsList>

          {/* Personal */}
          <TabsContent value="personal" className="mt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField name="fullName" control={form.control} render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{t("Full Name", "الاسم الكامل")}</FormLabel>
                    <FormControl><Input placeholder={t("Jane Doe", "فلانة الفلانية")} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="title" control={form.control} render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{t("Professional Title", "المسمى المهني")}</FormLabel>
                    <FormControl><Input placeholder={t("Software Engineer", "مهندسة برمجيات")} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="contact.email" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Email", "البريد الإلكتروني")}</FormLabel>
                    <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="contact.phone" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Phone", "الهاتف")}</FormLabel>
                    <FormControl><Input placeholder="010-000-0000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="contact.location" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Location", "الموقع")}</FormLabel>
                    <FormControl><Input placeholder={t("Cairo, Egypt", "القاهرة، مصر")} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="contact.website" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Website", "الموقع الشخصي")}</FormLabel>
                    <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="summary" control={form.control} render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{t("Summary", "الملخص")}</FormLabel>
                    <FormControl>
                      <textarea rows={5} className="w-full rounded-md border px-3 py-2 text-sm outline-none" placeholder={t("Short professional summary", "ملخص مهني قصير")} {...field as any} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="templateKey" control={form.control} render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{t("Template", "القالب")}</FormLabel>
                    <FormControl>
                      <select className="w-full rounded-md border px-3 py-2 text-sm outline-none" {...field}>
                        {templates.map((tpl) => (<option key={tpl.key} value={tpl.key}>{tpl.name}</option>))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
          </TabsContent>

          {/* Experience */}
          <TabsContent value="experience" className="mt-4">
            <div className="space-y-4">
              {expArray.fields.map((f, idx) => (
                <div key={f.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-2">
                  <FormField name={`experience.${idx}.company`} control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Company", "الشركة")}</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name={`experience.${idx}.role`} control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Role", "الوظيفة")}</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name={`experience.${idx}.startDate`} control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Start Date", "تاريخ البداية")}</FormLabel>
                      <FormControl><Input placeholder="YYYY-MM" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name={`experience.${idx}.endDate`} control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("End Date", "تاريخ النهاية")}</FormLabel>
                      <FormControl><Input placeholder={t("Present or YYYY-MM", "حتى الآن أو YYYY-MM")} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name={`experience.${idx}.description`} control={form.control} render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>{t("Description", "التفاصيل")}</FormLabel>
                      <FormControl><textarea rows={3} className="w-full rounded-md border px-3 py-2 text-sm outline-none" {...field as any} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="sm:col-span-2 flex justify-end">
                    <Button variant="secondary" type="button" onClick={() => expArray.remove(idx)}>{t("Remove", "حذف")}</Button>
                  </div>
                </div>
              ))}
              <Button type="button" onClick={() => expArray.append({ company: "", role: "", startDate: "" })}>{t("Add Experience", "إضافة خبرة")}</Button>
            </div>
          </TabsContent>

          {/* Education */}
          <TabsContent value="education" className="mt-4">
            <div className="space-y-4">
              {eduArray.fields.map((f, idx) => (
                <div key={f.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-2">
                  <FormField name={`education.${idx}.school`} control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("School", "المؤسسة")}</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name={`education.${idx}.degree`} control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Degree", "المؤهل")}</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name={`education.${idx}.startDate`} control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Start Date", "تاريخ البداية")}</FormLabel>
                      <FormControl><Input placeholder="YYYY-MM" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name={`education.${idx}.endDate`} control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("End Date", "تاريخ النهاية")}</FormLabel>
                      <FormControl><Input placeholder="YYYY-MM" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="sm:col-span-2 flex justify-end">
                    <Button variant="secondary" type="button" onClick={() => eduArray.remove(idx)}>{t("Remove", "حذف")}</Button>
                  </div>
                </div>
              ))}
              <Button type="button" onClick={() => eduArray.append({ school: "", degree: "", startDate: "" })}>{t("Add Education", "إضافة تعليم")}</Button>
            </div>
          </TabsContent>

          {/* Skills */}
          <TabsContent value="skills" className="mt-4">
            <div className="space-y-3">
              {skillsArray.fields.map((f, idx) => (
                <div key={f.id} className="flex items-center gap-2">
                  <Input {...form.register(`skills.${idx}` as const)} />
                  <Button variant="secondary" type="button" onClick={() => skillsArray.remove(idx)}>{t("Remove", "حذف")}</Button>
                </div>
              ))}
              <Button type="button" onClick={() => skillsArray.append("")}>{t("Add Skill", "إضافة مهارة")}</Button>
            </div>
          </TabsContent>

          {/* Languages */}
          <TabsContent value="languages" className="mt-4">
            <div className="space-y-3">
              {langsArray.fields.map((f, idx) => (
                <div key={f.id} className="flex items-center gap-2">
                  <Input {...form.register(`languages.${idx}` as const)} />
                  <Button variant="secondary" type="button" onClick={() => langsArray.remove(idx)}>{t("Remove", "حذف")}</Button>
                </div>
              ))}
              <Button type="button" onClick={() => langsArray.append("")}>{t("Add Language", "إضافة لغة")}</Button>
            </div>
          </TabsContent>

          {/* Certifications */}
          <TabsContent value="certs" className="mt-4">
            <div className="space-y-3">
              {certsArray.fields.map((f, idx) => (
                <div key={f.id} className="flex items-center gap-2">
                  <Input {...form.register(`certifications.${idx}` as const)} />
                  <Button variant="secondary" type="button" onClick={() => certsArray.remove(idx)}>{t("Remove", "حذف")}</Button>
                </div>
              ))}
              <Button type="button" onClick={() => certsArray.append("")}>{t("Add Certification", "إضافة شهادة")}</Button>
            </div>
          </TabsContent>
        </Tabs>
        </Form>

        {/* Footer actions */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button onClick={saveDraft} className="text-white" style={{ backgroundColor: "#0d47a1" }}>{t("Save Draft", "حفظ مسودة")}</Button>
          <Button variant="secondary" onClick={() => { saveDraft(); router.push("/dashboard"); }}>{t("Finish", "إنهاء")}</Button>
        </div>
      </section>
    </SiteLayout>
  );
}


