import { NextRequest, NextResponse } from "next/server";
import { setUserPlanFromProduct } from "@/firebase/firestore";

// Activates a plan after successful payment. In production, verify the transaction via Kashier webhook or callback.
// Body: { userId: string, product: 'one_time' | 'flex_pack' | 'annual_pass' }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, product } = body as { userId: string; product: "one_time" | "flex_pack" | "annual_pass" };
    if (!userId || !product) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    // TODO(verification): Validate payment signature/status from Kashier before activation
    await setUserPlanFromProduct(userId, product);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[Payments Activate]", e?.message || e);
    return NextResponse.json({ error: "Activation failed" }, { status: 500 });
  }
}


