"use client";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useLocale } from "@/lib/locale-context";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";

/**
 * FAQ Page - Frequently Asked Questions
 * 
 * Bilingual FAQ page for Sera Pro - سيرة برو
 * 
 * Features:
 * - Organized sections: Account, CV Creation, Payments, Privacy, Troubleshooting, Contact
 * - Expandable accordion-style Q&A for easy scanning
 * - Fully bilingual (Arabic/English) with automatic RTL/LTR support
 * - Mobile-responsive design
 * - Follows site theme and styling
 * 
 * Sections covered:
 * - How to start creating a CV
 * - Language options (Arabic/English)
 * - Saving and loading drafts (authentication required)
 * - Pricing and payment methods (Kashier/EGP)
 * - Downloading resume after payment
 * - Data privacy and security
 * - Contact and support information
 */
export default function FAQPage() {
  const { t } = useLocale();

  // FAQ data structure - organized by category
  const faqSections = [
    {
      id: "getting-started",
      title: t("Getting Started", "البدء"),
      icon: "🚀",
      questions: [
        {
          q: t(
            "How do I start creating my CV?",
            "كيف أبدأ في إنشاء سيرتي الذاتية؟"
          ),
          a: t(
            "Click 'Create CV' in the header or visit /create-cv. You can start with our free plan - no account required for basic usage. The builder guides you through entering your information step by step.",
            "انقر على 'إنشاء سيرة' في الهيدر أو زر '/create-cv'. يمكنك البدء بخانتنا المجانية - لا يتطلب حساب للاستخدام الأساسي. يساعدك المنشئ في إدخال معلوماتك خطوة بخطوة."
          ),
        },
        {
          q: t(
            "Do I need to create an account?",
            "هل أحتاج لإنشاء حساب؟"
          ),
          a: t(
            "An account is optional for creating a free, watermarked CV. However, you need an account to save drafts, access unlimited templates, download watermark-free PDFs, and unlock premium features. Sign up is quick and free.",
            "الحساب اختياري لإنشاء سيرة مجانية بعلامة مائية. لكنك تحتاج حسابًا لحفظ المسودات والوصول للقوالب غير المحدودة وتنزيل ملفات PDF بدون علامة مائية وفتح الميزات المميزة. التسجيل سريع ومجاني."
          ),
        },
        {
          q: t(
            "Can I edit my CV after creating it?",
            "هل يمكنني تعديل سيرتي بعد إنشائها؟"
          ),
          a: t(
            "Yes! With a free account, you can edit your drafts anytime. Paid plans (One-Time Purchase) grant 7 days of unlimited edits. After purchase, you can modify your CV as many times as needed within the validity period.",
            "نعم! مع حساب مجاني، يمكنك تعديل مسوداتك في أي وقت. الخطط المدفوعة (الشراء لمرة واحدة) تمنح 7 أيام من التعديلات غير المحدودة. بعد الشراء، يمكنك تعديل سيرتك بقدر ما تحتاج خلال فترة الصلاحية."
          ),
        },
      ],
    },
    {
      id: "languages",
      title: t("Languages & Templates", "اللغات والقوالب"),
      icon: "🌐",
      questions: [
        {
          q: t(
            "What languages are supported?",
            "ما اللغات المدعومة؟"
          ),
          a: t(
            "Sera Pro supports both Arabic and English. You can create your CV in either language or both. The interface automatically switches between RTL (Right-to-Left) for Arabic and LTR (Left-to-Right) for English based on your selection.",
            "سيرة برو يدعم العربية والإنجليزية. يمكنك إنشاء سيرتك بأي لغة أو كلتيهما. واجهة المستخدم تتحول تلقائيًا بين RTL (من اليمين لليسار) للعربية و LTR (من اليسار لليمين) للإنجليزية حسب اختيارك."
          ),
        },
        {
          q: t(
            "Can I create a bilingual CV?",
            "هل يمكنني إنشاء سيرة ثنائية اللغة؟"
          ),
          a: t(
            "Yes! You can create separate CVs in Arabic and English, or customize sections to include both languages. Each CV can be saved and exported independently.",
            "نعم! يمكنك إنشاء سير منفصلة بالعربية والإنجليزية، أو تخصيص الأقسام لتشمل اللغتين. كل سيرة يمكن حفظها وتصديرها بشكل مستقل."
          ),
        },
        {
          q: t(
            "How many templates are available?",
            "كم قالب متاح؟"
          ),
          a: t(
            "Free accounts have access to 2 basic templates. Paid plans unlock 10+ professional templates optimized for ATS (Applicant Tracking Systems) and modern recruiters. Templates are designed specifically for the Egyptian and MENA job markets.",
            "الحسابات المجانية تحصل على قالبين أساسيين. الخطط المدفوعة تفتح أكثر من 10 قوالب احترافية محسنة لأنظمة تتبع المتقدمين (ATS) والمسؤولين عن التوظيف الحديثين. القوالب مصممة خصيصًا لسوق العمل المصري والمنطقة."
          ),
        },
      ],
    },
    {
      id: "account",
      title: t("Account & Saving", "الحساب والحفظ"),
      icon: "💾",
      questions: [
        {
          q: t(
            "How do I save my CV draft?",
            "كيف أحفظ مسودة سيرتي؟"
          ),
          a: t(
            "Sign up or log in to your account. Once authenticated, your CV drafts are automatically saved as you work. You can access all your saved drafts from the Dashboard at any time.",
            "سجل أو سجل الدخول لحسابك. بمجرد المصادقة، تُحفظ مسوداتك تلقائيًا أثناء العمل. يمكنك الوصول لجميع مسوداتك المحفوظة من لوحة التحكم في أي وقت."
          ),
        },
        {
          q: t(
            "Can I have multiple CVs?",
            "هل يمكنني إنشاء سير متعددة؟"
          ),
          a: t(
            "Absolutely! With a free account, you can create and save multiple CV drafts. Paid plans (Flex Pack or Annual Pass) allow you to export multiple professional CVs without watermarks.",
            "بالتأكيد! مع حساب مجاني، يمكنك إنشاء وحفظ مسودات سير متعددة. الخطط المدفوعة (الباقة المرنة أو البطاقة السنوية) تتيح لك تصدير سير احترافية متعددة بدون علامة مائية."
          ),
        },
        {
          q: t(
            "What happens if I lose my account?",
            "ماذا يحدث إذا فقدت حسابي؟"
          ),
          a: t(
            "Use the password reset feature on the login page. If you're still having issues, contact contact.serapro@gmail.com. We can help you recover your account and access your saved CVs.",
            "استخدم ميزة إعادة تعيين كلمة المرور في صفحة تسجيل الدخول. إذا واجهت مشاكل، تواصل مع contact.serapro@gmail.com. يمكننا مساعدتك في استعادة حسابك والوصول لسيرك المحفوظة."
          ),
        },
      ],
    },
    {
      id: "pricing",
      title: t("Pricing & Payments", "الأسعار والمدفوعات"),
      icon: "💰",
      questions: [
        {
          q: t(
            "How much does it cost?",
            "كم التكلفة؟"
          ),
          a: t(
            "We offer a free tier with basic features and watermarked PDFs. Paid plans start at EGP 49 for a one-time purchase (1 CV, 3 templates, 7 days edits), EGP 149 for a Flex Pack (5 CVs, 6 months), or EGP 299/year for an Annual Pass (unlimited CVs). All prices are in Egyptian Pounds (EGP).",
            "نوفر مستوى مجاني بميزات أساسية وملفات PDF بعلامة مائية. الخطط المدفوعة تبدأ من 49 جنيه للشراء لمرة واحدة (سيرة واحدة، 3 قوالب، 7 أيام تعديلات)، 149 جنيه للباقة المرنة (5 سير، 6 أشهر)، أو 299 جنيه/سنة للبطاقة السنوية (سير غير محدودة). جميع الأسعار بالجنيه المصري."
          ),
        },
        {
          q: t(
            "What payment methods do you accept?",
            "ما طرق الدفع المقبولة؟"
          ),
          a: t(
            "We accept payments through Kashier, a trusted payment gateway in Egypt. You can pay using credit/debit cards, mobile wallets, or bank transfers. All transactions are secure and processed in EGP.",
            "نقبل المدفوعات عبر كاشير، بوابة دفع موثوقة في مصر. يمكنك الدفع باستخدام بطاقات الائتمان/الخصم أو المحافظ الإلكترونية أو التحويلات البنكية. جميع المعاملات آمنة وتتم بالجنيه المصري."
          ),
        },
        {
          q: t(
            "Do I need to pay to download my CV?",
            "هل أحتاج للدفع لتنزيل سيرتي؟"
          ),
          a: t(
            "Free accounts can download a watermarked PDF. To download a professional, watermark-free PDF, you need a paid plan. One-Time Purchase allows one clean download, Flex Pack gives you 5 credits, and Annual Pass provides unlimited downloads.",
            "الحسابات المجانية يمكنها تنزيل ملف PDF بعلامة مائية. لتنزيل ملف PDF احترافي بدون علامة مائية، تحتاج خطة مدفوعة. الشراء لمرة واحدة يسمح بتنزيل واحد نظيف، الباقة المرنة تعطيك 5 رصيد، والبطاقة السنوية توفر تنزيلات غير محدودة."
          ),
        },
        {
          q: t(
            "What's the difference between plans?",
            "ما الفرق بين الخطط؟"
          ),
          a: t(
            "Free: 1 basic CV, 3 templates, watermarked PDF. One-Time: 1 CV, 3 templates, 7 days of unlimited edits. Flex Pack: 5 CV credits valid 6 months. Annual Pass: Unlimited CVs, all templates, cover letters, LinkedIn tools, and future features.",
            "المجانية: سيرة أساسية واحدة، 3 قوالب، ملف PDF بعلامة مائية. لمرة واحدة: سيرة واحدة، 3 قوالب، 7 أيام من التعديلات غير المحدودة. الباقة المرنة: رصيد 5 سير صالح لـ 6 أشهر. البطاقة السنوية: سير غير محدودة، جميع القوالب، خطابات التغطية، أدوات لينكدإن، والميزات المستقبلية."
          ),
        },
      ],
    },
    {
      id: "download",
      title: t("Downloading & Export", "التنزيل والتصدير"),
      icon: "📥",
      questions: [
        {
          q: t(
            "How do I download my CV?",
            "كيف أنزل سيرتي؟"
          ),
          a: t(
            "After completing your CV and purchasing a plan (or using the free watermarked version), click the 'Download PDF' button in the CV builder. The file will be generated and downloaded to your device. Make sure you're logged in if you've made a purchase.",
            "بعد إكمال سيرتك وشراء خطة (أو استخدام النسخة المجانية المائية)، انقر زر 'تنزيل PDF' في منشئ السيرة. سيتم إنشاء الملف وتنزيله لجهازك. تأكد من تسجيل الدخول إذا قمت بشراء خطة."
          ),
        },
        {
          q: t(
            "What format will my CV be in?",
            "في أي تنسيق ستكون سيرتي؟"
          ),
          a: t(
            "CVs are exported as PDF files, which are universally accepted by employers and ATS systems. PDF format ensures your CV maintains its formatting across different devices and platforms.",
            "تُصدّر السير كملفات PDF، المقبولة عالميًا من قبل أصحاب العمل وأنظمة ATS. تنسيق PDF يضمن الحفاظ على تنسيق سيرتك عبر الأجهزة والمنصات المختلفة."
          ),
        },
        {
          q: t(
            "Can I edit my CV after downloading?",
            "هل يمكنني تعديل سيرتي بعد التنزيل؟"
          ),
          a: t(
            "Yes! As long as your plan is active (7 days for One-Time, 6 months for Flex Pack, 1 year for Annual Pass), you can return to your CV draft, make changes, and download an updated version. Your edits are saved automatically.",
            "نعم! طالما خطتك نشطة (7 أيام للشراء لمرة واحدة، 6 أشهر للباقة المرنة، سنة للبطاقة السنوية)، يمكنك العودة لمسودة سيرتك وإجراء تغييرات وتنزيل نسخة محدثة. تعديلاتك تُحفظ تلقائيًا."
          ),
        },
      ],
    },
    {
      id: "privacy",
      title: t("Privacy & Security", "الخصوصية والأمان"),
      icon: "🔒",
      questions: [
        {
          q: t(
            "Is my data safe?",
            "هل بياناتي آمنة؟"
          ),
          a: t(
            "Yes. We use industry-standard encryption and security measures. Your CV content is stored securely in Firebase, and payment information is processed securely through Kashier (we never store full card details). See our Privacy Policy for details.",
            "نعم. نستخدم التشفير وإجراءات الأمان المعيارية. محتوى سيرتك يُحفظ بأمان في Firebase، ومعلومات الدفع تُعالج بأمان عبر كاشير (لا نخزن تفاصيل البطاقة كاملة أبدًا). راجع سياسة الخصوصية للتفاصيل."
          ),
        },
        {
          q: t(
            "Who can see my CV?",
            "من يمكنه رؤية سيرتي؟"
          ),
          a: t(
            "Only you can access your CV drafts and account. We do not share your CV content with third parties. Your data is used solely to provide and improve our service. You have full control over your information.",
            "أنت فقط يمكنك الوصول لمسودات سيرتك وحسابك. لا نشارك محتوى سيرتك مع أطراف ثالثة. بياناتك تُستخدم فقط لتقديم وتحسين خدمتنا. لديك سيطرة كاملة على معلوماتك."
          ),
        },
        {
          q: t(
            "Can I delete my account and data?",
            "هل يمكنني حذف حسابي وبياناتي؟"
          ),
          a: t(
            "Yes. You can request account deletion by contacting contact.serapro@gmail.com. We will permanently delete your account and all associated data, including CV drafts, within 30 days of your request. This action cannot be undone.",
            "نعم. يمكنك طلب حذف الحساب بالتواصل مع contact.serapro@gmail.com. سنحذف حسابك وجميع البيانات المرتبطة بشكل دائم، بما في ذلك مسودات السير، خلال 30 يومًا من طلبك. هذا الإجراء لا يمكن التراجع عنه."
          ),
        },
      ],
    },
    {
      id: "troubleshooting",
      title: t("Troubleshooting", "حل المشاكل"),
      icon: "🛠️",
      questions: [
        {
          q: t(
            "My CV didn't download. What should I do?",
            "لم يتم تنزيل سيرتي. ماذا أفعل؟"
          ),
          a: t(
            "First, check if you have a paid plan active. Free accounts can only download watermarked versions. Ensure your browser allows downloads and check your Downloads folder. If issues persist, try a different browser or contact contact.serapro@gmail.com.",
            "أولاً، تحقق إذا كانت لديك خطة مدفوعة نشطة. الحسابات المجانية يمكنها تنزيل النسخ المائية فقط. تأكد أن متصفحك يسمح بالتنزيلات وتحقق من مجلد التنزيلات. إذا استمرت المشاكل، جرّب متصفحًا آخر أو تواصل مع contact.serapro@gmail.com."
          ),
        },
        {
          q: t(
            "I can't log in to my account.",
            "لا أستطيع تسجيل الدخول لحسابي."
          ),
          a: t(
            "Use the 'Forgot Password' link on the login page to reset your password. If you signed up with Google or another provider, use that same method. If problems continue, contact contact.serapro@gmail.com with your email address.",
            "استخدم رابط 'نسيت كلمة المرور' في صفحة تسجيل الدخول لإعادة تعيين كلمة المرور. إذا سجلت عبر Google أو مزود آخر، استخدم نفس الطريقة. إذا استمرت المشاكل، تواصل مع contact.serapro@gmail.com مع عنوان بريدك الإلكتروني."
          ),
        },
        {
          q: t(
            "The page is not displaying correctly.",
            "الصفحة لا تعرض بشكل صحيح."
          ),
          a: t(
            "Try clearing your browser cache and refreshing the page. Ensure JavaScript is enabled. If you're using an older browser, try updating it. For RTL (Arabic) display issues, make sure your browser supports right-to-left text direction.",
            "جرّب مسح ذاكرة التخزين المؤقت لمتصفحك وتحديث الصفحة. تأكد أن JavaScript مفعّل. إذا كنت تستخدم متصفحًا قديمًا، جرّب تحديثه. لمشاكل عرض RTL (العربية)، تأكد أن متصفحك يدعم اتجاه النص من اليمين لليسار."
          ),
        },
        {
          q: t(
            "My payment was processed but I don't see my plan activated.",
            "تمت معالجة دفاعي لكن لا أرى خطتي مفعّلة."
          ),
          a: t(
            "This usually resolves automatically within a few minutes. Try logging out and back in, or refresh the page. If after 15 minutes your plan isn't active, contact contact.serapro@gmail.com with your payment receipt or transaction ID, and we'll resolve it promptly.",
            "عادة ما يُحل هذا تلقائيًا خلال بضع دقائق. جرّب تسجيل الخروج والدخول مرة أخرى، أو حدّث الصفحة. إذا لم تكن خطتك نشطة بعد 15 دقيقة، تواصل مع contact.serapro@gmail.com مع إيصال الدفع أو معرف المعاملة، وسنحل المشكلة بسرعة."
          ),
        },
      ],
    },
    {
      id: "contact",
      title: t("Contact & Support", "التواصل والدعم"),
      icon: "📧",
      questions: [
        {
          q: t(
            "How can I contact support?",
            "كيف يمكنني التواصل مع الدعم؟"
          ),
          a: t(
            "Email us at contact.serapro@gmail.com for any questions, issues, or feedback. We typically respond within 24-48 hours. For urgent payment or account issues, include 'URGENT' in your subject line.",
            "راسلنا على contact.serapro@gmail.com لأي أسئلة أو مشاكل أو ملاحظات. عادة نرد خلال 24-48 ساعة. للمشاكل العاجلة المتعلقة بالدفع أو الحساب، أضف 'URGENT' في موضوع الرسالة."
          ),
        },
        {
          q: t(
            "Do you offer refunds?",
            "هل تقدمون استرداد الأموال؟"
          ),
          a: t(
            "Refund requests are handled case-by-case. Contact contact.serapro@gmail.com within 7 days of purchase with your reason. If you've already downloaded a CV, refunds may not be applicable, but we'll work with you to find a solution.",
            "طلبات الاسترداد تُعالج كل حالة على حدة. تواصل مع contact.serapro@gmail.com خلال 7 أيام من الشراء مع سببك. إذا كنت قد نزلت سيرة بالفعل، قد لا ينطبق الاسترداد، لكننا سنعمل معك لإيجاد حل."
          ),
        },
        {
          q: t(
            "Can I suggest a feature?",
            "هل يمكنني اقتراح ميزة؟"
          ),
          a: t(
            "Absolutely! We welcome feedback and feature suggestions. Email contact.serapro@gmail.com with your ideas. User feedback helps us improve Sera Pro for everyone.",
            "بالتأكيد! نرحب بالملاحظات واقتراحات الميزات. راسلنا على contact.serapro@gmail.com بأفكارك. ملاحظات المستخدمين تساعدنا في تحسين سيرة برو للجميع."
          ),
        },
      ],
    },
  ];

  return (
    <SiteLayout>
      <section className="px-4 py-10 sm:px-6 md:px-10">
        <div className="mx-auto max-w-4xl">
          {/* Page Header */}
          <header className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-semibold mb-3">
              {t("Frequently Asked Questions", "الأسئلة الشائعة")}
            </h1>
            <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400">
              {t(
                "Find answers to common questions about Sera Pro.",
                "اعثر على إجابات للأسئلة الشائعة حول سيرة برو."
              )}
            </p>
          </header>

          {/* Quick Links / Sections Navigation */}
          <div className="mb-8 flex flex-wrap gap-2 justify-center">
            {faqSections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="px-3 py-1.5 text-sm rounded-full border hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <span className="mr-1">{section.icon}</span>
                {section.title}
              </a>
            ))}
          </div>

          {/* FAQ Sections */}
          <div className="space-y-8">
            {faqSections.map((section) => (
              <div key={section.id} id={section.id} className="scroll-mt-20">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <span>{section.icon}</span>
                  {section.title}
                </h2>
                <Accordion type="single" collapsible className="w-full">
                  {section.questions.map((item, index) => (
                    <AccordionItem
                      key={`${section.id}-${index}`}
                      value={`${section.id}-${index}`}
                      className="border-b"
                    >
                      <AccordionTrigger className="text-start font-medium hover:no-underline">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          {/* Additional Help Section */}
          <div className="mt-12 rounded-xl border p-6 bg-zinc-50 dark:bg-zinc-900 text-center">
            <h3 className="text-lg font-semibold mb-2">
              {t("Still have questions?", "لا تزال لديك أسئلة؟")}
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              {t(
                "Can't find what you're looking for? Our support team is here to help.",
                "لا تجد ما تبحث عنه؟ فريق الدعم جاهز لمساعدتك."
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="mailto:contact.serapro@gmail.com"
                className="px-4 py-2 text-sm rounded-md text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#0d47a1" }}
              >
                {t("Contact Support", "اتصل بالدعم")}
              </Link>
              <Link
                href="/pricing"
                className="px-4 py-2 text-sm rounded-md border hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {t("View Pricing", "عرض الأسعار")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

