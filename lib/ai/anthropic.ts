// Server-side helper for Anthropic Claude integration.
// Model defaults to Claude 3.5 Haiku; switch to Sonnet by changing the model string.
// Env: ANTHROPIC_API_KEY must be set to enable live requests.

type Locale = "en" | "ar";

export async function enhanceCvWithClaude(
  cvData: any,
  locale: Locale,
  options?: { model?: string }
) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = options?.model || "claude-3-5-haiku-latest";

  if (!apiKey) {
    // Graceful fallback when key is not provided
    return {
      ok: false as const,
      reason: "missing_api_key" as const,
      data: null,
      message:
        "Anthropic API key is not configured. Set ANTHROPIC_API_KEY in environment to enable live enhancement.",
    };
  }

  const system =
    locale === "ar"
      ? "أنت خبير في تحسين السير الذاتية لسوق العمل المصري والعربي. حسّن اللغة، استخدم أفعال إنجاز قوية، ووازن الكلمات المفتاحية مع أنظمة ATS. حافظ على نفس بنية JSON دون إضافة حقول جديدة."
      : "You are an expert CV optimizer for the Egyptian job market. Improve clarity, use strong action verbs, and align keywords for ATS. Preserve the exact JSON schema without adding new fields.";

  // Build per-section guidance to get better results and keep structure stable
  const lines: string[] = [];
  if (Array.isArray(cvData?.experience) && cvData.experience.length) {
    lines.push(
      locale === "ar"
        ? "الخبرات: أعد صياغة الأدوار لتبدأ بأفعال إنجاز (قمت، قدت، طورت)، أضف مقاييس عند الإمكان، واجعل الوصف موجزًا وواضحًا."
        : "Experience: Rewrite roles to start with action verbs (Led, Built, Improved), add measurable impact when possible, keep descriptions concise and clear."
    );
  }
  if (typeof cvData?.summary === "string") {
    lines.push(
      locale === "ar"
        ? "الملخص: اكتب فقرة قصيرة تركّز على القيمة والمهارات الأساسية ذات الصلة، بدون حشو."
        : "Summary: Short paragraph highlighting value and core relevant skills; avoid fluff."
    );
  }
  if (Array.isArray(cvData?.skills) && cvData.skills.length) {
    lines.push(
      locale === "ar"
        ? "المهارات: نظّم المهارات بوضوح، وادمج المرادفات، وحافظ على الاتساق."
        : "Skills: Normalize wording, merge synonyms, and keep consistent naming."
    );
  }
  if (Array.isArray(cvData?.education) && cvData.education.length) {
    lines.push(
      locale === "ar"
        ? "التعليم: تأكد من تنسيق التواريخ والألقاب الأكاديمية بشكل مهني ومختصر."
        : "Education: Ensure dates and degrees are formatted professionally and concisely."
    );
  }

  const prompt = [
    locale === "ar"
      ? "قم بتحسين السيرة الذاتية التالية مع الحفاظ على نفس بنية JSON. لا تُدخل حقولًا جديدة. استخدم اللغة المحددة (عربية/إنجليزية) كما في الإدخال."
      : "Enhance the following CV while preserving the exact JSON structure. Do not add new fields. Use the same language (Arabic/English) as the input.",
    "\n- ",
    lines.join("\n- "),
    locale === "ar" ? "\nأعد JSON فقط دون نص إضافي." : "\nReturn JSON only, no extra prose.",
  ].join("");

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        system,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "text", text: "JSON:" },
              { type: "text", text: JSON.stringify(cvData) },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (process.env.ANTHROPIC_DEBUG) {
        // Server log for troubleshooting
        console.error("[Claude API Error]", res.status, text);
      }
      return { ok: false as const, reason: "api_error" as const, data: null, message: text };
    }
    const json = await res.json();
    const content = json?.content?.[0]?.text || "";

    // Attempt to parse JSON from the model response; fallback to original when parsing fails
    let enhanced: any = null;
    try {
      enhanced = JSON.parse(content);
    } catch {
      if (process.env.ANTHROPIC_DEBUG) {
        console.error("[Claude Parse Error] content=", content?.slice?.(0, 200));
      }
      // If response isn't pure JSON, keep data unchanged
      enhanced = null;
    }

    if (!enhanced) {
      return { ok: false as const, reason: "parse_error" as const, data: null, message: "Failed to parse Claude response." };
    }

    return { ok: true as const, reason: null, data: enhanced, message: null };
  } catch (e: any) {
    if (process.env.ANTHROPIC_DEBUG) {
      console.error("[Claude Network Error]", e?.message || e);
    }
    return { ok: false as const, reason: "network_error" as const, data: null, message: e?.message || "Network error" };
  }
}


