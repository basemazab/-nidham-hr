import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateVideoScript, PLATFORM_PRESETS, type PlatformId } from "@/lib/video-studio";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productSummary, platform, targetAudience, tone, durationSeconds, keyMessage, additionalContext } = await req.json();

    if (!productSummary || productSummary.length < 10) {
      return Response.json({ error: "وصف المنتج لازم 10 حروف على الأقل" }, { status: 400 });
    }
    if (!platform || !PLATFORM_PRESETS.some((p) => p.id === platform)) {
      return Response.json({ error: "اختر منصة صالحة" }, { status: 400 });
    }
    if (!keyMessage || keyMessage.length < 5) {
      return Response.json({ error: "الرسالة الأساسية مطلوبة" }, { status: 400 });
    }

    const script = await generateVideoScript({
      productSummary,
      platform: platform as PlatformId,
      targetAudience: targetAudience || "الجمهور العام في مصر",
      tone: tone || "احترافي",
      durationSeconds: Math.min(Math.max(durationSeconds || 30, 15), 600),
      keyMessage,
      additionalContext,
    });

    return Response.json({ ok: true, script });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
