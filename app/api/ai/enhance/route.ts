import { NextRequest, NextResponse } from "next/server";
import { enhanceCvWithClaude } from "@/lib/ai/anthropic";

// AI Enhancement endpoint: uses Claude when ANTHROPIC_API_KEY is present, otherwise falls back.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, locale, model } = body as { data: any; locale: "en" | "ar"; model?: string };

    console.log("[AI Enhance API] Request received:", {
      hasData: !!data,
      locale,
      model,
      title: data?.title,
      summaryPreview: data?.summary?.substring?.(0, 50),
    });

    // Attempt Claude enhancement first
    const result = await enhanceCvWithClaude(data, locale, { model });
    
    console.log("[AI Enhance API] Claude result:", {
      ok: result.ok,
      reason: result.reason,
      hasData: !!result.data,
      message: result.message,
    });
    
    if (result.ok && result.data) {
      console.log("[AI Enhance API] Returning enhanced data");
      return NextResponse.json({ 
        data: result.data, 
        model: model || "claude-3-5-haiku-latest" 
      });
    }

    // Log why Claude failed
    console.warn("[AI Enhance API] Claude enhancement failed, using fallback:", {
      reason: result.reason,
      message: result.message,
    });

    // If API key is missing, return error instead of fallback
    if (result.reason === "missing_api_key") {
      return NextResponse.json({ 
        error: result.message || "Anthropic API key is not configured. Please set ANTHROPIC_API_KEY in .env.local",
        reason: "missing_api_key"
      }, { status: 503 });
    }

    // Fallback stub when key missing or response invalid
    // Note: This fallback does minimal enhancement, mainly for testing
    const enhanced = { ...data };
    if (Array.isArray(enhanced.experience)) {
      enhanced.experience = enhanced.experience.map((e: any) => ({
        ...e,
        role: e?.role ? String(e.role).replace(/^./, (c: string) => c.toUpperCase()) : e.role,
        description: e?.description ? `• ${e.description}` : e.description,
      }));
    }
    if (typeof enhanced.summary === "string" && enhanced.summary) {
      enhanced.summary = locale === "ar" ? `✔ ${enhanced.summary}` : `✔ ${enhanced.summary}`;
    }

    const message = result.ok ? null : result.message || "Using fallback enhancer (API key may be missing or invalid).";
    return NextResponse.json({ 
      data: enhanced, 
      fallback: true, 
      message,
      error: result.message,
      reason: result.reason
    });
  } catch (e: any) {
    // Log server-side error for diagnostics
    console.error("[AI Enhance Route] Unexpected error:", {
      message: e?.message,
      stack: e?.stack,
      error: e
    });
    return NextResponse.json({ 
      error: e?.message || "AI enhancement failed",
      details: process.env.NODE_ENV === "development" ? e?.stack : undefined
    }, { status: 500 });
  }
}


