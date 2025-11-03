/**
 * CV Template Configuration
 * 
 * Defines all available CV templates with their metadata, access levels, and preview styling.
 * 
 * Template Access Groups:
 * - GROUP 1: First N templates (accessible to Free and One-Time plans)
 *   - Currently: First 3 templates
 *   - To change: Update TEMPLATE_GROUP_1_SIZE constant
 * - GROUP 2: All remaining templates (accessible only to Flex Pack and Annual Pass plans)
 *   - All templates after the first N templates require premium subscription
 * 
 * Access Rules:
 * - Free plan: Only Group 1 templates (first 3)
 * - One-Time purchase: Only Group 1 templates (first 3)
 * - Flex Pack: All templates (Group 1 + Group 2)
 * - Annual Pass: All templates (Group 1 + Group 2)
 * 
 * Template Properties:
 * - key: Unique identifier used in form state
 * - name: Bilingual display name
 * - description: Bilingual description
 * - accessLevel: "basic" | "premium" (kept for backward compatibility, not used for access control)
 * - requiredPlan: Legacy field (kept for backward compatibility, not used for access control)
 * - category: Style category for organization
 * - popular: Whether to show "Popular" badge
 * 
 * Future extensibility:
 * - Add template preview images
 * - Add color customization options
 * - Add font family options
 * - Add section ordering customization
 * - Add template-specific field requirements
 * - Easily adjust group sizes by changing TEMPLATE_GROUP_1_SIZE
 */
import type { UserPlan } from "@/firebase/firestore";

/**
 * Number of templates in Group 1 (accessible to Free and One-Time plans)
 * To change the grouping, simply update this constant.
 * Remaining templates will automatically be in Group 2 (premium plans only).
 */
export const TEMPLATE_GROUP_1_SIZE = 3;

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
 * Access is determined by template position:
 * - First TEMPLATE_GROUP_1_SIZE templates (Group 1): Accessible to Free and One-Time plans
 * - All remaining templates (Group 2): Only accessible to Flex Pack and Annual Pass plans
 * 
 * @param template - Template to check
 * @param userPlan - User's current plan (null = free)
 * @returns true if user can access the template
 */
export function hasTemplateAccess(template: Template, userPlan: UserPlan | null): boolean {
  // Find template index in TEMPLATES array
  const templateIndex = TEMPLATES.findIndex((t) => t.key === template.key);
  
  // If template not found, deny access (safety check)
  if (templateIndex === -1) {
    return false;
  }

  // Group 1: First TEMPLATE_GROUP_1_SIZE templates
  // Accessible to: Free and One-Time plans
  if (templateIndex < TEMPLATE_GROUP_1_SIZE) {
    return true; // Always accessible
  }

  // Group 2: All remaining templates
  // Accessible to: Flex Pack and Annual Pass plans only
  if (!userPlan || userPlan.planType === "free" || userPlan.planType === "one_time") {
    return false; // Group 2 requires premium plan
  }

  // Flex Pack and Annual Pass have access to all templates
  return userPlan.planType === "flex_pack" || userPlan.planType === "annual_pass";
}

/**
 * Get template group number (1 or 2) for a template
 * Useful for UI organization and display
 * 
 * @param template - Template to check
 * @returns 1 for Group 1, 2 for Group 2
 */
export function getTemplateGroup(template: Template): 1 | 2 {
  const templateIndex = TEMPLATES.findIndex((t) => t.key === template.key);
  if (templateIndex === -1) return 1; // Default to group 1 if not found
  
  return templateIndex < TEMPLATE_GROUP_1_SIZE ? 1 : 2;
}

/**
 * Get all accessible templates for a user's plan
 */
export function getAccessibleTemplates(userPlan: UserPlan | null): Template[] {
  return TEMPLATES.filter((template) => hasTemplateAccess(template, userPlan));
}

/**
 * Get upgrade message for locked template
 * 
 * Templates in Group 2 require Flex Pack or Annual Pass.
 * 
 * @param template - Template that is locked
 * @param isAr - Whether to return Arabic message
 * @returns Bilingual upgrade message
 */
export function getUpgradeMessage(template: Template, isAr: boolean): string {
  const templateGroup = getTemplateGroup(template);
  
  // Group 1 templates are always accessible, so no upgrade message needed
  if (templateGroup === 1) {
    return "";
  }

  // Group 2 templates require Flex Pack or Annual Pass
  return isAr
    ? "قم بالترقية إلى الباقة المرنة أو البطاقة السنوية لفتح هذا القالب"
    : "Upgrade to Flex Pack or Annual Pass to unlock this template";
}
