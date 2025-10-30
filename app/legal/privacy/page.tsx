"use client";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useLocale } from "@/lib/locale-context";

// Bilingual Privacy Policy for Sera Pro - سيرة برو
// - Uses shared SiteLayout for consistent header/footer
// - GDPR-aligned details with clear data practices and rights
// - Local tabs for switching between EN/AR content while respecting global locale for page direction
export default function PrivacyPage() {
  const { locale } = useLocale();
  const [lang, setLang] = useState<"en" | "ar">(locale);
  return (
    <SiteLayout>
      <section className="mx-auto w-full max-w-3xl p-6 sm:p-8 md:p-12">
        <header className="mb-4">
          <h1 className="text-2xl font-semibold">Sera Pro – Privacy Policy / سياسة الخصوصية</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Last updated: {new Date().toLocaleDateString()}</p>
        </header>

        <Tabs value={lang} onValueChange={(v) => setLang(v as "en" | "ar")}> 
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="en">English</TabsTrigger>
            <TabsTrigger value="ar">العربية</TabsTrigger>
          </TabsList>

          {/* English Privacy */}
          <TabsContent value="en">
            <article className="prose prose-zinc max-w-none dark:prose-invert" dir="ltr">
              <h2>1. Overview</h2>
              <p>
                Sera Pro respects your privacy. This Policy explains what personal data we collect, how we use it, and your rights under
                applicable laws, including GDPR where relevant.
              </p>
              <h2>2. Data We Collect</h2>
              <ul>
                <li>Account data: name, email, authentication details.</li>
                <li>CV content you create or upload.</li>
                <li>Payment data processed by Kashier (we do not store full card details).</li>
                <li>Usage and analytics data to improve our service.</li>
              </ul>
              <h2>3. How We Use Data</h2>
              <ul>
                <li>Provide and improve the CV builder and AI features.</li>
                <li>Process payments for subscriptions via Kashier.</li>
                <li>Communicate service updates and respond to support requests.</li>
                <li>Maintain security, prevent fraud, and comply with legal obligations.</li>
              </ul>
              <h2>4. AI Processing</h2>
              <p>
                AI features analyze your CV content to provide suggestions. Processing is performed to deliver the service you request.
                You can opt out by not using AI features.
              </p>
              <h2>5. Sharing and Transfers</h2>
              <p>
                We may share limited data with service providers (e.g., hosting, analytics, payment processing) under contractual
                safeguards. International transfers follow appropriate legal mechanisms where required.
              </p>
              <h2>6. Data Retention</h2>
              <p>
                We keep data only as long as necessary for the purposes above or as required by law. You may request deletion of your
                account and content.
              </p>
              <h2>7. Your Rights</h2>
              <p>
                Subject to applicable law, you may request access, correction, deletion, or portability of your data, and object to or
                restrict processing. Contact: support@serapro.app.
              </p>
              <h2>8. Cookies</h2>
              <p>
                We use cookies to maintain sessions, remember language preferences, and improve user experience. You can manage cookies
                via your browser settings.
              </p>
              <h2>9. Security</h2>
              <p>
                We implement reasonable technical and organizational measures to protect data. No method of transmission is 100% secure.
              </p>
              <h2>10. Contact</h2>
              <p>Questions: support@serapro.app</p>
            </article>
          </TabsContent>

          {/* Arabic Privacy (RTL) */}
          <TabsContent value="ar">
            <article className="prose prose-zinc max-w-none dark:prose-invert" dir="rtl">
              <h2>١. نظرة عامة</h2>
              <p>
                تُقدّر سيرة برو خصوصيتك. توضح هذه السياسة ما هي البيانات الشخصية التي نجمعها وكيف نستخدمها وحقوقك بموجب القوانين
                السارية، بما في ذلك اللائحة العامة لحماية البيانات (GDPR) عند انطباقها.
              </p>
              <h2>٢. البيانات التي نجمعها</h2>
              <ul>
                <li>بيانات الحساب: الاسم والبريد الإلكتروني وتفاصيل المصادقة.</li>
                <li>محتوى السيرة الذاتية الذي تُنشئه أو ترفعه.</li>
                <li>بيانات الدفع التي تتم معالجتها عبر كاشير (لا نخزن بيانات البطاقات كاملة).</li>
                <li>بيانات الاستخدام والتحليلات لتحسين الخدمة.</li>
              </ul>
              <h2>٣. كيفية استخدام البيانات</h2>
              <ul>
                <li>تقديم أداة إنشاء السيرة الذاتية وميزات الذكاء الاصطناعي وتحسينها.</li>
                <li>معالجة المدفوعات للاشتراكات عبر كاشير.</li>
                <li>التواصل بشأن تحديثات الخدمة والرد على طلبات الدعم.</li>
                <li>تعزيز الأمان ومنع الاحتيال والامتثال للالتزامات القانونية.</li>
              </ul>
              <h2>٤. المعالجة بالذكاء الاصطناعي</h2>
              <p>
                تقوم ميزات الذكاء الاصطناعي بتحليل محتوى سيرتك لتقديم اقتراحات. تتم المعالجة لتقديم الخدمة التي تطلبها. يمكنك
                إلغاء الاشتراك بعدم استخدام ميزات الذكاء الاصطناعي.
              </p>
              <h2>٥. المشاركة والنقل</h2>
              <p>
                قد نشارك بيانات محدودة مع مزودي الخدمات (مثل الاستضافة والتحليلات ومعالجة المدفوعات) بموجب ضمانات تعاقدية.
                تتم عمليات النقل الدولية وفق الآليات القانونية المناسبة عند الحاجة.
              </p>
              <h2>٦. الاحتفاظ بالبيانات</h2>
              <p>
                نحتفظ بالبيانات للمدة اللازمة للأغراض المذكورة أعلاه أو كما يتطلب القانون. يمكنك طلب حذف حسابك ومحتواك.
              </p>
              <h2>٧. حقوقك</h2>
              <p>
                وفقًا للقانون المعمول به، يمكنك طلب الوصول إلى بياناتك أو تصحيحها أو حذفها أو نقلها، والاعتراض على المعالجة أو
                تقييدها. للتواصل: support@serapro.app
              </p>
              <h2>٨. ملفات تعريف الارتباط (الكوكيز)</h2>
              <p>
                نستخدم الكوكيز للحفاظ على الجلسات وتذكر تفضيلات اللغة وتحسين التجربة. يمكنك إدارة الكوكيز من إعدادات المتصفح.
              </p>
              <h2>٩. الأمان</h2>
              <p>
                نطبق تدابير تقنية وتنظيمية معقولة لحماية البيانات. ومع ذلك، لا توجد وسيلة نقل آمنة بنسبة 100٪.
              </p>
              <h2>١٠. التواصل</h2>
              <p>الاستفسارات: support@serapro.app</p>
            </article>
          </TabsContent>
        </Tabs>
      </section>
    </SiteLayout>
  );
}


