"use client";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useLocale } from "@/lib/locale-context";

// Bilingual Terms & Conditions for Sera Pro - سيرة برو
// - Uses shared SiteLayout for consistent header/footer
// - Mobile-first layout with clear headings
// - Local tabs allow instant AR/EN switching for content while respecting global locale for page direction
export default function TermsPage() {
  const { locale } = useLocale();
  const [lang, setLang] = useState<"en" | "ar">(locale);
  return (
    <SiteLayout>
      <section className="mx-auto w-full max-w-3xl p-6 sm:p-8 md:p-12">
        <header className="mb-4">
          <h1 className="text-2xl font-semibold">Sera Pro – Terms & Conditions / الشروط والأحكام</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Last updated: {new Date().toLocaleDateString()}</p>
        </header>

        {/* Language Tabs */}
        <Tabs value={lang} onValueChange={(v) => setLang(v as "en" | "ar")}> 
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="en">English</TabsTrigger>
            <TabsTrigger value="ar">العربية</TabsTrigger>
          </TabsList>

          {/* English Terms */}
          <TabsContent value="en">
            <article className="prose prose-zinc max-w-none dark:prose-invert" dir="ltr">
              <h2>1. Acceptance of Terms</h2>
              <p>
                Welcome to Sera Pro. By accessing or using our CV builder, you agree to these Terms & Conditions. If you do not
                agree, please discontinue use.
              </p>
              <h2>2. Service Description</h2>
              <p>
                Sera Pro provides an AI-powered CV builder with Arabic and English support, ATS-optimized templates, and PDF export.
                Payments for premium features are processed securely via Kashier.
              </p>
              <h2>3. User Responsibilities</h2>
              <ul>
                <li>Provide accurate information and keep your account secure.</li>
                <li>Use the service lawfully and do not upload illegal or harmful content.</li>
                <li>You are responsible for how your CV content is used, shared, or submitted to employers.</li>
              </ul>
              <h2>4. AI Usage Disclaimer</h2>
              <p>
                Our AI suggestions aim to improve clarity and alignment with job requirements. Results are not guaranteed and may
                contain errors. Always review and edit your CV before use.
              </p>
              <h2>5. Payments and Refunds (Kashier)</h2>
              <p>
                Paid plans are billed in EGP through Kashier. By purchasing, you authorize us to process the specified charges. Unless
                otherwise stated, subscriptions renew automatically until cancelled. Refunds are considered case-by-case subject to
                applicable Egyptian consumer protection laws and our fair use policy.
              </p>
              <h2>6. Intellectual Property</h2>
              <p>
                The Sera Pro platform, branding, and templates are owned by us. You retain ownership of your CV content.
              </p>
              <h2>7. Termination</h2>
              <p>
                We may suspend or terminate access for violations of these terms or for security concerns. You may stop using the
                service at any time.
              </p>
              <h2>8. Changes to Terms</h2>
              <p>
                We may update these Terms. Material changes will be communicated through the website or by email where available.
              </p>
              <h2>9. Contact</h2>
              <p>
                For questions, contact support@serapro.app.
              </p>
            </article>
          </TabsContent>

          {/* Arabic Terms (RTL) */}
          <TabsContent value="ar">
            <article className="prose prose-zinc max-w-none dark:prose-invert" dir="rtl">
              <h2>١. قبول الشروط</h2>
              <p>
                مرحبًا بك في سيرة برو. باستخدامك لخدمتنا، فإنك توافق على الشروط والأحكام التالية. إذا لم توافق، يرجى التوقف عن الاستخدام.
              </p>
              <h2>٢. وصف الخدمة</h2>
              <p>
                تقدم سيرة برو أداة لإنشاء السيرة الذاتية مدعومة بالذكاء الاصطناعي مع دعم العربية والإنجليزية، وقوالب متوافقة مع أنظمة
                تتبع المتقدمين، وخاصية تصدير PDF. تتم معالجة المدفوعات عبر كاشير بشكل آمن.
              </p>
              <h2>٣. مسؤوليات المستخدم</h2>
              <ul>
                <li>تقديم معلومات صحيحة والمحافظة على أمان الحساب.</li>
                <li>استخدام الخدمة بشكل قانوني وعدم رفع محتوى غير مشروع أو ضار.</li>
                <li>أنت مسؤول عن كيفية استخدام أو مشاركة أو تقديم محتوى سيرتك للجهات الخارجية.</li>
              </ul>
              <h2>٤. تنبيه حول استخدام الذكاء الاصطناعي</h2>
              <p>
                تهدف اقتراحات الذكاء الاصطناعي إلى تحسين الوضوح والمواءمة مع متطلبات الوظيفة. لا نضمن النتائج وقد تحتوي على
                أخطاء، لذا يرجى المراجعة والتحرير قبل الاستخدام.
              </p>
              <h2>٥. المدفوعات وسياسة الاسترجاع (كاشير)</h2>
              <p>
                يتم تحصيل رسوم الخطط المدفوعة بالجنيه المصري عبر كاشير. عند الشراء، فإنك تفوضنا بمعالجة الرسوم المحددة. ما لم
                يُذكر خلاف ذلك، يتم تجديد الاشتراكات تلقائيًا حتى الإلغاء. يتم النظر في طلبات الاسترجاع كل حالة على حدة وفقًا
                لقوانين حماية المستهلك المصرية وسياسة الاستخدام العادل لدينا.
              </p>
              <h2>٦. الملكية الفكرية</h2>
              <p>المنصة والعلامة والقوالب مملوكة لنا. وتحتفظ أنت بملكية محتوى سيرتك الذاتية.</p>
              <h2>٧. الإنهاء</h2>
              <p>قد نوقف أو ننهي الوصول في حال مخالفة الشروط أو لأسباب أمنية. ويمكنك التوقف عن استخدام الخدمة في أي وقت.</p>
              <h2>٨. تعديل الشروط</h2>
              <p>قد نقوم بتحديث هذه الشروط. سيتم إشعار التغييرات الجوهرية عبر الموقع أو البريد الإلكتروني عند توفره.</p>
              <h2>٩. التواصل</h2>
              <p>للاستفسارات: support@serapro.app</p>
            </article>
          </TabsContent>
        </Tabs>
      </section>
    </SiteLayout>
  );
}


