/**
 * CV Language Labels Utility
 * 
 * Provides bilingual labels, placeholders, and helper text for CV builder form fields.
 * These labels are based on the CV content language (cvLanguage), not the UI locale.
 * This allows users to create CVs in Arabic or English regardless of their UI language preference.
 * 
 * Usage:
 * - Import and call functions with cvLanguage ("ar" | "en")
 * - Use returned labels for FormLabel, Input placeholder, tooltip text, etc.
 * - All labels support both Arabic and English
 * 
 * Future Extensibility:
 * - Add more languages (French, etc.)
 * - Add contextual help text per field
 * - Add field-specific validation messages
 */

export type CvLanguage = "ar" | "en";

/**
 * Personal Information Section Labels
 */
export const getPersonalLabels = (cvLanguage: CvLanguage) => {
  const isAr = cvLanguage === "ar";
  return {
    fullName: {
      label: isAr ? "الاسم الكامل" : "Full Name",
      placeholder: isAr ? "أدخل اسمك الكامل" : "Enter your full name",
    },
    title: {
      label: isAr ? "المسمى المهني" : "Professional Title",
      placeholder: isAr ? "مثال: مطور برمجيات، مدير تسويق" : "e.g., Software Developer, Marketing Manager",
    },
    summary: {
      label: isAr ? "الملخص المهني" : "Professional Summary",
      placeholder: isAr ? "اكتب ملخصًا موجزًا عن خبرتك ومهاراتك" : "Write a brief summary of your experience and skills",
    },
    email: {
      label: isAr ? "البريد الإلكتروني" : "Email",
      placeholder: isAr ? "example@email.com" : "example@email.com",
    },
    phone: {
      label: isAr ? "رقم الهاتف" : "Phone",
      placeholder: isAr ? "+20 123 456 7890" : "+20 123 456 7890",
    },
    location: {
      label: isAr ? "الموقع" : "Location",
      placeholder: isAr ? "مثال: القاهرة، مصر" : "e.g., Cairo, Egypt",
    },
    website: {
      label: isAr ? "الموقع الإلكتروني" : "Website",
      placeholder: isAr ? "https://yourwebsite.com" : "https://yourwebsite.com",
    },
  };
};

/**
 * Experience Section Labels
 */
export const getExperienceLabels = (cvLanguage: CvLanguage) => {
  const isAr = cvLanguage === "ar";
  return {
    company: {
      label: isAr ? "اسم الشركة" : "Company Name",
      placeholder: isAr ? "أدخل اسم الشركة" : "Enter company name",
    },
    role: {
      label: isAr ? "المسمى الوظيفي" : "Job Title",
      placeholder: isAr ? "مثال: مطور برمجيات" : "e.g., Software Developer",
    },
    startDate: {
      label: isAr ? "تاريخ البداية" : "Start Date",
      placeholder: isAr ? "YYYY-MM" : "YYYY-MM",
    },
    endDate: {
      label: isAr ? "تاريخ النهاية" : "End Date",
      placeholder: isAr ? "YYYY-MM أو اتركه فارغًا إذا كنت لا تزال تعمل" : "YYYY-MM or leave empty if currently employed",
    },
    description: {
      label: isAr ? "الوصف" : "Description",
      placeholder: isAr ? "اكتب وصفًا موجزًا لمسؤولياتك وإنجازاتك" : "Write a brief description of your responsibilities and achievements",
    },
    present: {
      label: isAr ? "حتى الآن" : "Present",
    },
    addButton: isAr ? "إضافة خبرة عمل" : "Add Work Experience",
    removeButton: isAr ? "إزالة" : "Remove",
  };
};

/**
 * Education Section Labels
 */
export const getEducationLabels = (cvLanguage: CvLanguage) => {
  const isAr = cvLanguage === "ar";
  return {
    school: {
      label: isAr ? "اسم المؤسسة التعليمية" : "School/University",
      placeholder: isAr ? "أدخل اسم الجامعة أو المدرسة" : "Enter university or school name",
    },
    degree: {
      label: isAr ? "المؤهل العلمي" : "Degree",
      placeholder: isAr ? "مثال: بكالوريوس في علوم الحاسب" : "e.g., Bachelor of Computer Science",
    },
    startDate: {
      label: isAr ? "تاريخ البداية" : "Start Date",
      placeholder: isAr ? "YYYY-MM" : "YYYY-MM",
    },
    endDate: {
      label: isAr ? "تاريخ التخرج" : "Graduation Date",
      placeholder: isAr ? "YYYY-MM" : "YYYY-MM",
    },
    addButton: isAr ? "إضافة تعليم" : "Add Education",
    removeButton: isAr ? "إزالة" : "Remove",
  };
};

/**
 * Skills Section Labels
 */
export const getSkillsLabels = (cvLanguage: CvLanguage) => {
  const isAr = cvLanguage === "ar";
  return {
    skill: {
      label: isAr ? "المهارة" : "Skill",
      placeholder: isAr ? "مثال: JavaScript, إدارة المشاريع" : "e.g., JavaScript, Project Management",
    },
    addButton: isAr ? "إضافة مهارة" : "Add Skill",
    removeButton: isAr ? "إزالة" : "Remove",
  };
};

/**
 * Languages Section Labels
 */
export const getLanguagesLabels = (cvLanguage: CvLanguage) => {
  const isAr = cvLanguage === "ar";
  return {
    language: {
      label: isAr ? "اللغة" : "Language",
      placeholder: isAr ? "مثال: العربية (أم), الإنجليزية (متقدم)" : "e.g., Arabic (Native), English (Advanced)",
    },
    addButton: isAr ? "إضافة لغة" : "Add Language",
    removeButton: isAr ? "إزالة" : "Remove",
  };
};

/**
 * Certifications Section Labels
 */
export const getCertificationsLabels = (cvLanguage: CvLanguage) => {
  const isAr = cvLanguage === "ar";
  return {
    certification: {
      label: isAr ? "الشهادة" : "Certification",
      placeholder: isAr ? "مثال: شهادة AWS Certified Solutions Architect" : "e.g., AWS Certified Solutions Architect",
    },
    addButton: isAr ? "إضافة شهادة" : "Add Certification",
    removeButton: isAr ? "إزالة" : "Remove",
  };
};

/**
 * Projects Section Labels
 */
export const getProjectsLabels = (cvLanguage: CvLanguage) => {
  const isAr = cvLanguage === "ar";
  return {
    title: {
      label: isAr ? "عنوان المشروع" : "Project Title",
      placeholder: isAr ? "مثال: نظام إدارة المخزون" : "e.g., Inventory Management System",
      tooltip: {
        en: "Enter a clear, descriptive title for your project",
        ar: "أدخل عنوانًا واضحًا ووصفيًا لمشروعك",
      },
    },
    startDate: {
      label: isAr ? "تاريخ البداية" : "Start Date",
      placeholder: isAr ? "YYYY-MM" : "YYYY-MM",
    },
    endDate: {
      label: isAr ? "تاريخ النهاية" : "End Date",
      placeholder: isAr ? "YYYY-MM أو اتركه فارغًا للمشروع الجاري" : "YYYY-MM or leave empty for ongoing project",
    },
    description: {
      label: isAr ? "الوصف" : "Description",
      placeholder: isAr ? "اكتب وصفًا موجزًا للمشروع وإنجازاته" : "Write a brief description of the project and its achievements",
      tooltip: {
        en: "Describe your role, technologies used, and key outcomes of the project",
        ar: "اوصف دورك والتقنيات المستخدمة والنتائج الرئيسية للمشروع",
      },
    },
    addButton: isAr ? "إضافة مشروع" : "Add Project",
    removeButton: isAr ? "إزالة" : "Remove",
  };
};

/**
 * Section Headers
 */
export const getSectionHeaders = (cvLanguage: CvLanguage) => {
  const isAr = cvLanguage === "ar";
  return {
    personal: isAr ? "المعلومات الشخصية" : "Personal Information",
    experience: isAr ? "الخبرة المهنية" : "Work Experience",
    projects: isAr ? "المشاريع" : "Projects",
    education: isAr ? "التعليم" : "Education",
    skills: isAr ? "المهارات" : "Skills",
    languages: isAr ? "اللغات" : "Languages",
    certifications: isAr ? "الشهادات" : "Certifications",
  };
};

