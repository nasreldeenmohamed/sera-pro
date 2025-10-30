import { NextRequest, NextResponse } from "next/server";
import { enhanceCvWithClaude } from "@/lib/ai/anthropic";

// AI Enhancement endpoint: uses Claude when ANTHROPIC_API_KEY is present, otherwise falls back.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, locale, model } = body as { data: any; locale: "en" | "ar"; model?: string };

    // Attempt Claude enhancement first
    const result = await enhanceCvWithClaude(data, locale, { model });
    if (result.ok && result.data) {
      return NextResponse.json({ data: result.data, model: model || "claude-3-5-haiku-latest" });
    }

    // Fallback stub when key missing or response invalid
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

    const message = result.ok ? null : result.message || "Using fallback enhancer.";
    return NextResponse.json({ data: enhanced, fallback: true, message });
  } catch (e: any) {
    // Log server-side error for diagnostics
    console.error("[AI Enhance Route] Unexpected error:", e?.message || e);
    return NextResponse.json({ error: "AI enhancement failed" }, { status: 500 });
  }
}


