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
    console.warn("[Claude API] ANTHROPIC_API_KEY is not set in environment variables");
    return {
      ok: false as const,
      reason: "missing_api_key" as const,
      data: null,
      message:
        "Anthropic API key is not configured. Set ANTHROPIC_API_KEY in environment to enable live enhancement.",
    };
  }
  
  console.log("[Claude API] Starting enhancement with model:", model, "locale:", locale);

  const system =
    locale === "ar"
      ? "أنت خبير في تحسين السير الذاتية لسوق العمل المصري والعربي. حسّن اللغة، استخدم أفعال إنجاز قوية، وأضف كلمات مفتاحية مهنية متعلقة بالوظيفة. حافظ على نفس بنية JSON دون إضافة حقول جديدة."
      : "You are an expert CV optimizer for the Egyptian job market. Improve clarity, use strong action verbs, and incorporate relevant job keywords. Preserve the exact JSON schema without adding new fields.";

  // Build per-section guidance to get better results and keep structure stable
  const lines: string[] = [];
  
  // Focus on Professional Title enhancement with job keywords
  if (typeof cvData?.title === "string" && cvData.title.trim()) {
    lines.push(
      locale === "ar"
        ? "المسمى المهني (title): أعد صياغة المسمى المهني ليصبح أكثر احترافية وجاذبية. أضف كلمات مفتاحية متعلقة بالوظيفة والمهارات التقنية. مثال: بدلاً من 'مطور تطبيقات' استخدم 'مهندس تطبيقات محمولة متخصص في Android/iOS'."
        : "Professional Title (title): Rewrite the professional title to be more professional and compelling. Add relevant job keywords and technical skills. Example: Instead of 'App Developer' use 'Mobile Software Engineer specializing in Android/iOS'."
    );
  }
  
  // Focus on Professional Summary enhancement with job keywords
  if (typeof cvData?.summary === "string" && cvData.summary.trim()) {
    lines.push(
      locale === "ar"
        ? "الملخص المهني (summary): أعد كتابة الملخص المهني ليكون أكثر فعالية وتركيزًا. استخدم أفعال إنجاز قوية (قمت، طورت، أنجزت، قادت)، أضف كلمات مفتاحية مهنية متعلقة بالوظيفة، واذكر الإنجازات القابلة للقياس. اجعل الفقرة موجزة (3-5 جمل) ولكن قوية ومؤثرة."
        : "Professional Summary (summary): Rewrite the professional summary to be more effective and focused. Use strong action verbs (Led, Developed, Achieved, Managed), incorporate relevant job keywords, and mention measurable achievements. Keep it concise (3-5 sentences) but impactful."
    );
  }
  
  if (Array.isArray(cvData?.experience) && cvData.experience.length) {
    lines.push(
      locale === "ar"
        ? "الخبرات: أعد صياغة الوصف (description) لتبدأ بأفعال إنجاز قوية (قمت، قدت، طورت، أنجزت)، أضف مقاييس عند الإمكان (مثل: 'قمت بتطوير تطبيق خدم 10000+ مستخدم')، واجعل الوصف موجزًا وواضحًا."
        : "Experience: Rewrite descriptions to start with strong action verbs (Led, Built, Improved, Achieved), add measurable impact when possible (e.g., 'Developed an app serving 10,000+ users'), keep descriptions concise and clear."
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
      ? "قم بتحسين السيرة الذاتية التالية مع الحفاظ على نفس بنية JSON. لا تُدخل حقولًا جديدة. استخدم اللغة المحددة (عربية/إنجليزية) كما في الإدخال.\n\nركز بشكل خاص على:\n- المسمى المهني (title): اجعله أكثر احترافية مع إضافة كلمات مفتاحية مهنية متعلقة بالوظيفة\n- الملخص المهني (summary): أعد كتابته بشكل احترافي باستخدام أفعال إنجاز قوية وكلمات مفتاحية مهنية وإنجازات قابلة للقياس\n\n"
      : "Enhance the following CV while preserving the exact JSON structure. Do not add new fields. Use the same language (Arabic/English) as the input.\n\nFocus especially on:\n- Professional Title (title): Make it more professional with relevant job keywords\n- Professional Summary (summary): Rewrite it professionally using strong action verbs, job keywords, and measurable achievements\n\n",
    lines.length > 0 ? "\n- " : "",
    lines.join("\n- "),
    locale === "ar" ? "\n\nأعد JSON فقط دون نص إضافي. تأكد من أن الحقول title و summary تم تحسينها بالفعل." : "\n\nReturn JSON only, no extra prose. Ensure the title and summary fields are actually enhanced.",
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
      console.error("[Claude API Error]", {
        status: res.status,
        statusText: res.statusText,
        error: text,
        apiKeyPresent: !!apiKey,
        apiKeyPrefix: apiKey?.substring(0, 10) + "..."
      });
      return { 
        ok: false as const, 
        reason: "api_error" as const, 
        data: null, 
        message: `Claude API error (${res.status}): ${text.substring(0, 200)}` 
      };
    }
    const json = await res.json();
    const content = json?.content?.[0]?.text || "";

    // Attempt to parse JSON from the model response
    // Claude sometimes wraps JSON in markdown code blocks (```json ... ```)
    let enhanced: any = null;
    try {
      // Try to extract JSON from markdown code blocks if present
      let jsonString = content.trim();
      
      // Remove markdown code block markers if present
      if (jsonString.startsWith("```")) {
        // Find the first ``` and remove everything before the first newline after it
        const firstBlock = jsonString.indexOf("```");
        const afterFirstBlock = jsonString.indexOf("\n", firstBlock + 3);
        if (afterFirstBlock !== -1) {
          jsonString = jsonString.substring(afterFirstBlock + 1);
        }
        // Remove closing ```
        const lastBlock = jsonString.lastIndexOf("```");
        if (lastBlock !== -1) {
          jsonString = jsonString.substring(0, lastBlock).trim();
        }
      }
      
      enhanced = JSON.parse(jsonString);
      
      // Validate that we got a proper object with expected fields
      if (!enhanced || typeof enhanced !== "object") {
        throw new Error("Parsed data is not an object");
      }
      
      console.log("[Claude Success] Enhanced CV data received");
      
    } catch (parseError: any) {
      console.error("[Claude Parse Error]", {
        error: parseError?.message,
        contentPreview: content?.slice?.(0, 500),
        contentLength: content?.length
      });
      
      // If response isn't pure JSON, try to extract JSON object using regex
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          enhanced = JSON.parse(jsonMatch[0]);
          console.log("[Claude Recovery] Extracted JSON from response using regex");
        } else {
          enhanced = null;
        }
      } catch (recoveryError) {
        console.error("[Claude Recovery Failed]", recoveryError);
        enhanced = null;
      }
    }

    if (!enhanced) {
      return { 
        ok: false as const, 
        reason: "parse_error" as const, 
        data: null, 
        message: "Failed to parse Claude response. Please check server logs." 
      };
    }

    return { ok: true as const, reason: null, data: enhanced, message: null };
  } catch (e: any) {
    console.error("[Claude Network Error]", {
      message: e?.message,
      stack: e?.stack,
      error: e
    });
    return { 
      ok: false as const, 
      reason: "network_error" as const, 
      data: null, 
      message: e?.message || "Network error connecting to Claude API" 
    };
  }
}


