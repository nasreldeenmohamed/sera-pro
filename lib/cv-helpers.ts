// CV Builder helper utilities for guidance, tips, and validation
// All helper text and tips are bilingual (English/Arabic)

export type HelpContent = {
  en: string;
  ar: string;
};

// Writing tips for CV sections
export const CV_TIPS: Record<string, HelpContent> = {
  summary: {
    en: "Write 2-4 sentences highlighting your key strengths and career goals. Use action verbs and quantify achievements when possible.",
    ar: "اكتب 2-4 جملة تسلط الضوء على نقاط قوتك الرئيسية وأهدافك المهنية. استخدم أفعال العمل وقم بقياس الإنجازات عند الإمكان.",
  },
  experienceDescription: {
    en: "Use bullet points with action verbs (e.g., 'Developed', 'Managed', 'Increased'). Quantify results (numbers, percentages, time saved). Focus on achievements, not just duties.",
    ar: "استخدم نقاط بفعل العمل (مثل 'طورت'، 'أدرت'، 'زادت'). قم بقياس النتائج (أرقام، نسب مئوية، وقت تم توفيره). ركز على الإنجازات وليس فقط الواجبات.",
  },
  skills: {
    en: "List technical skills, software, tools, and soft skills. Be specific (e.g., 'JavaScript' not 'Programming'). Group related skills together.",
    ar: "اذكر المهارات التقنية والبرمجيات والأدوات والمهارات الشخصية. كن محدداً (مثل 'JavaScript' وليس 'برمجة'). اجمَع المهارات ذات الصلة معاً.",
  },
  email: {
    en: "Use a professional email address. Avoid personal or informal addresses.",
    ar: "استخدم عنوان بريد إلكتروني احترافي. تجنب العناوين الشخصية أو غير الرسمية.",
  },
  date: {
    en: "Use format YYYY-MM (e.g., 2020-01). For current positions, leave end date empty or use 'Present'.",
    ar: "استخدم التنسيق YYYY-MM (مثل 2020-01). للوظائف الحالية، اترك تاريخ النهاية فارغاً أو استخدم 'حتى الآن'.",
  },
};

// Field labels with help text
export const FIELD_HELP: Record<string, HelpContent> = {
  fullName: {
    en: "Your complete legal name as it appears on official documents.",
    ar: "اسمك الكامل القانوني كما يظهر في المستندات الرسمية.",
  },
  title: {
    en: "Your current job title or desired position (e.g., 'Senior Software Engineer').",
    ar: "المسمى الوظيفي الحالي أو المنصب المرغوب (مثل 'مهندس برمجيات أول').",
  },
  summary: {
    en: "A brief professional summary (2-4 sentences) highlighting your experience and goals.",
    ar: "ملخص مهني موجز (2-4 جمل) يسلط الضوء على خبرتك وأهدافك.",
  },
  company: {
    en: "The full name of the company or organization where you worked.",
    ar: "الاسم الكامل للشركة أو المؤسسة التي عملت بها.",
  },
  role: {
    en: "Your job title at this position.",
    ar: "المسمى الوظيفي في هذه الوظيفة.",
  },
  description: {
    en: "Describe your key responsibilities and achievements. Use bullet points and action verbs.",
    ar: "اشرح مسؤولياتك الرئيسية وإنجازاتك. استخدم نقاط وأفعال العمل.",
  },
};

// Validation helper to check minimum required data for AI enhancement
export function hasMinimumDataForAI(data: any): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  if (!data.fullName || data.fullName.trim().length < 2) {
    missing.push("Full Name / الاسم الكامل");
  }
  
  if (!data.experience || data.experience.length === 0) {
    missing.push("At least one work experience / خبرة عمل واحدة على الأقل");
  }
  
  // Summary or title recommended but not required
  // Education recommended but not required
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

// Format validation messages for display
// Extracts the correct language from bilingual validation messages (format: "English / Arabic")
export function formatValidationMessage(message: string, locale: "en" | "ar" = "en"): string {
  if (!message || !message.includes(" / ")) return message;
  const [en, ar] = message.split(" / ");
  return locale === "ar" ? (ar || en) : (en || ar);
}

// Count validation errors in form data
export function countFormErrors(errors: any): number {
  let count = 0;
  function traverse(obj: any): void {
    for (const key in obj) {
      if (obj[key] && typeof obj[key] === "object") {
        if (obj[key].message) {
          count++;
        } else {
          traverse(obj[key]);
        }
      }
    }
  }
  traverse(errors);
  return count;
}

