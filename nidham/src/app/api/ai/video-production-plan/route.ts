import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateProductionPlan, type PlatformId } from "@/lib/video-studio";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { storyboard, platform, budget } = await req.json();

    if (!storyboard || !storyboard.frames || storyboard.frames.length === 0) {
      return Response.json({ error: "الـ storyboard مطلوب ويجب أن يحتوي على frames" }, { status: 400 });
    }

    const plan = await generateProductionPlan({
      storyboard,
      platform: (platform as PlatformId) || "tiktok",
      budget: budget || "5000 - 15000 EGP",
    });

    return Response.json({ ok: true, plan });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
