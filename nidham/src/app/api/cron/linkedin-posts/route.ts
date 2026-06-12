// ============================================================================
// /api/cron/linkedin-posts — publish due LinkedIn scheduled posts
// ============================================================================
// The daily Vercel cron piggybacks this logic on /api/cron/run-sequences
// (Hobby plan caps crons at 2). This standalone route exists for manual runs
// and external schedulers — auth via CRON_SECRET like the other crons.

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { runScheduledLinkedInPosts } from "@/lib/linkedin-scheduler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return req.headers.get("user-agent")?.includes("vercel-cron") ?? false;
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${cronSecret}`) return true;
  if (req.headers.get("x-cron-secret") === cronSecret) return true;
  return false;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  try {
    const result = await runScheduledLinkedInPosts(supabase);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
