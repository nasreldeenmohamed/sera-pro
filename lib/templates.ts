/**
 * CV Template Configuration
 * 
 * Defines all available CV templates with their metadata, access levels, and preview styling.
 * Templates are categorized as "basic" (free) or "premium" (requires paid plan).
 * 
 * Access Rules:
 * - Free plan: Only basic templates
 * - One-Time purchase: Basic + Creative templates
 * - Flex Pack: Basic + Creative + Technical templates
 * - Annual Pass: All templates (basic + premium)
 * 
 * Template Properties:
 * - key: Unique identifier used in form state
 * - name: Bilingual display name
 * - description: Bilingual description
 * - accessLevel: "basic" | "premium"
 * - requiredPlan: Minimum plan required (null = free)
 * - category: Style category for organization
 * - popular: Whether to show "Popular" badge
 * 
 * Future extensibility:
 * - Add template preview images
 * - Add color customization options
 * - Add font family options
 * - Add section ordering customization
 * - Add template-specific field requirements
 */
import type { UserPlan } from "@/firebase/firestore";

export type TemplateAccessLevel = "basic" | "premium";
export type TemplateCategory = "traditional" | "modern" | "creative" | "technical" | "minimal";

export interface Template {
  key: string;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  accessLevel: TemplateAccessLevel;
  requiredPlan: "one_time" | "flex_pack" | "annual_pass" | null;
  category: TemplateCategory;
  popular?: boolean;
  // Preview styling hints (for dynamic rendering)
  previewColors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
  };
  previewLayout: "side-by-side" | "chronological" | "minimal" | "bold";
}

/**
 * All available CV templates with metadata
 */
export const TEMPLATES: Template[] = [
  {
    key: "classic",
    name: { en: "Classic", ar: "كلاسيك" },
    description: {
      en: "Traditional, professional layout perfect for any industry",
      ar: "تصميم تقليدي احترافي مثالي لأي صناعة",
    },
    accessLevel: "basic",
    requiredPlan: null, // Free
    category: "traditional",
    popular: false,
    previewColors: {
      primary: "#0d47a1",
      secondary: "#f5f5f5",
      accent: "#1976d2",
      text: "#212121",
    },
    previewLayout: "chronological",
  },
  {
    key: "modern",
    name: { en: "Modern", ar: "حديث" },
    description: {
      en: "Clean, contemporary design with emphasis on readability",
      ar: "تصميم نظيف ومعاصر يركز على سهولة القراءة",
    },
    accessLevel: "basic",
    requiredPlan: null, // Free
    category: "modern",
    popular: true,
    previewColors: {
      primary: "#1565c0",
      secondary: "#ffffff",
      accent: "#42a5f5",
      text: "#424242",
    },
    previewLayout: "side-by-side",
  },
  {
    key: "elegant",
    name: { en: "Elegant", ar: "أنيق" },
    description: {
      en: "Sophisticated layout with subtle design elements",
      ar: "تصميم راقي بعناصر تصميمية دقيقة",
    },
    accessLevel: "basic",
    requiredPlan: null, // Free
    category: "traditional",
    popular: false,
    previewColors: {
      primary: "#1a237e",
      secondary: "#fafafa",
      accent: "#5c6bc0",
      text: "#263238",
    },
    previewLayout: "chronological",
  },
  {
    key: "creative",
    name: { en: "Creative", ar: "إبداعي" },
    description: {
      en: "Bold and eye-catching design for creative professionals",
      ar: "تصميم جريء وجذاب للمهنيين الإبداعيين",
    },
    accessLevel: "premium",
    requiredPlan: "one_time",
    category: "creative",
    popular: false,
    previewColors: {
      primary: "#6a1b9a",
      secondary: "#f3e5f5",
      accent: "#ab47bc",
      text: "#1a1a1a",
    },
    previewLayout: "bold",
  },
  {
    key: "technical",
    name: { en: "Technical", ar: "تقني" },
    description: {
      en: "Structured layout optimized for technical and engineering roles",
      ar: "تصميم منظم محسّن للوظائف التقنية والهندسية",
    },
    accessLevel: "premium",
    requiredPlan: "flex_pack",
    category: "technical",
    popular: false,
    previewColors: {
      primary: "#004d40",
      secondary: "#e0f2f1",
      accent: "#26a69a",
      text: "#263238",
    },
    previewLayout: "side-by-side",
  },
  {
    key: "minimalist",
    name: { en: "Minimalist", ar: "بسيط" },
    description: {
      en: "Clean, minimal design focusing on content over decoration",
      ar: "تصميم نظيف وبسيط يركز على المحتوى بدلاً من الزخرفة",
    },
    accessLevel: "premium",
    requiredPlan: "flex_pack",
    category: "minimal",
    popular: true,
    previewColors: {
      primary: "#212121",
      secondary: "#ffffff",
      accent: "#757575",
      text: "#212121",
    },
    previewLayout: "minimal",
  },
  {
    key: "colorful",
    name: { en: "Colorful", ar: "ملون" },
    description: {
      en: "Vibrant and colorful design perfect for marketing and design roles",
      ar: "تصميم حيوي وملون مثالي لوظائف التسويق والتصميم",
    },
    accessLevel: "premium",
    requiredPlan: "annual_pass",
    category: "creative",
    popular: false,
    previewColors: {
      primary: "#c62828",
      secondary: "#ffebee",
      accent: "#ef5350",
      text: "#212121",
    },
    previewLayout: "bold",
  },
];

/**
 * Get template by key
 */
export function getTemplate(key: string): Template | undefined {
  return TEMPLATES.find((t) => t.key === key);
}

/**
 * Check if user has access to a template based on their plan
 * 
 * @param template - Template to check
 * @param userPlan - User's current plan (null = free)
 * @returns true if user can access the template
 */
export function hasTemplateAccess(template: Template, userPlan: UserPlan | null): boolean {
  // Basic templates are always accessible
  if (template.accessLevel === "basic") {
    return true;
  }

  // Premium templates require a paid plan
  if (!userPlan || userPlan.planType === "free") {
    return false;
  }

  // Check required plan level
  if (!template.requiredPlan) {
    return true; // Shouldn't happen for premium, but handle gracefully
  }

  const planHierarchy: Record<string, number> = {
    free: 0,
    one_time: 1,
    flex_pack: 2,
    annual_pass: 3,
  };

  const userPlanLevel = planHierarchy[userPlan.planType] || 0;
  const requiredPlanLevel = planHierarchy[template.requiredPlan] || 0;

  return userPlanLevel >= requiredPlanLevel;
}

/**
 * Get all accessible templates for a user's plan
 */
export function getAccessibleTemplates(userPlan: UserPlan | null): Template[] {
  return TEMPLATES.filter((template) => hasTemplateAccess(template, userPlan));
}

/**
 * Get upgrade message for locked template
 */
export function getUpgradeMessage(template: Template, isAr: boolean): string {
  if (!template.requiredPlan) {
    return "";
  }

  const planNames: Record<string, { en: string; ar: string }> = {
    one_time: { en: "One-Time Purchase", ar: "شراء لمرة واحدة" },
    flex_pack: { en: "Flex Pack", ar: "باقة مرنة" },
    annual_pass: { en: "Annual Pass", ar: "البطاقة السنوية" },
  };

  const planName = planNames[template.requiredPlan]?.[isAr ? "ar" : "en"] || template.requiredPlan;

  return isAr
    ? `قم بالترقية إلى ${planName} لفتح هذا القالب`
    : `Upgrade to ${planName} to unlock this template`;
}
