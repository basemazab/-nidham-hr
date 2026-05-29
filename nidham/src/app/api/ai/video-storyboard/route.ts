import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateStoryboard, type PlatformId } from "@/lib/video-studio";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { script, visualStyle, platform, additionalNotes } = await req.json();

    if (!script || !script.scenes || script.scenes.length === 0) {
      return Response.json({ error: "السيناريو مطلوب ويجب أن يحتوي على مشاهد" }, { status: 400 });
    }

    const storyboard = await generateStoryboard({
      script,
      visualStyle: visualStyle || "realistic",
      platform: (platform as PlatformId) || "tiktok",
      additionalNotes,
    });

    return Response.json({ ok: true, storyboard });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
