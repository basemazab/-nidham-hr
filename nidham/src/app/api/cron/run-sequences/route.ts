// ============================================================================
// /api/cron/run-sequences — drive Marketing Inbox drip sequences
// ============================================================================
// Walks enrollments whose next_run_at is due, sends the current step's message
// via the tenant's Meta page token, then advances to the next step (or marks
// the enrollment done). Runs across all tenants with the service role.
//
// Called by Vercel Cron, OR by any scheduler that sends the CRON_SECRET (so a
// finer cadence than the Vercel plan allows can be wired externally).
//
// Same Meta caveat as broadcasts: delivery only inside the 24h window. A failed
// send still advances the enrollment so it never gets stuck retrying.

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendMetaMessage } from "@/lib/marketing-inbox/meta-client";

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

type StepRow = { step_order: number; delay_hours: number; message: string };
type Enrollment = {
  id: string;
  company_id: string;
  sequence_id: string;
  conversation_id: string;
  current_step: number;
};

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const nowIso = new Date().toISOString();

  const { data: due, error } = await supabase
    .from("marketing_sequence_enrollments")
    .select("id, company_id, sequence_id, conversation_id, current_step")
    .eq("status", "active")
    .lte("next_run_at", nowIso)
    .limit(300)
    .returns<Enrollment[]>();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  if (!due || due.length === 0) {
    return NextResponse.json({ ok: true, due: 0, ranAt: nowIso });
  }

  // Caches to avoid N+1 lookups.
  const stepsBySeq = new Map<string, StepRow[]>();
  const tokenByCompany = new Map<string, string | null>();

  let sent = 0;
  let failed = 0;
  let advanced = 0;
  let done = 0;

  for (const e of due) {
    // Steps for this sequence (ordered).
    let steps = stepsBySeq.get(e.sequence_id);
    if (!steps) {
      const { data } = await supabase
        .from("marketing_sequence_steps")
        .select("step_order, delay_hours, message")
        .eq("sequence_id", e.sequence_id)
        .order("step_order", { ascending: true })
        .returns<StepRow[]>();
      steps = data ?? [];
      stepsBySeq.set(e.sequence_id, steps);
    }

    const step = steps[e.current_step];
    if (!step) {
      await supabase
        .from("marketing_sequence_enrollments")
        .update({ status: "done" })
        .eq("id", e.id);
      done++;
      continue;
    }

    // Conversation (channel + recipient).
    const { data: conv } = await supabase
      .from("marketing_inbox_conversations")
      .select("channel, external_user_id")
      .eq("id", e.conversation_id)
      .maybeSingle<{ channel: string; external_user_id: string }>();

    // Page token (cached per company).
    let token = tokenByCompany.get(e.company_id);
    if (token === undefined) {
      const { data: s } = await supabase
        .from("marketing_inbox_settings")
        .select("meta_page_token")
        .eq("company_id", e.company_id)
        .maybeSingle<{ meta_page_token: string | null }>();
      token = s?.meta_page_token ?? null;
      tokenByCompany.set(e.company_id, token);
    }

    const sendable =
      !!conv &&
      !!token &&
      (conv.channel === "messenger" || conv.channel === "instagram");

    if (sendable && conv && token) {
      const res = await sendMetaMessage({
        channel: conv.channel as "messenger" | "instagram",
        pageToken: token,
        recipientId: conv.external_user_id,
        text: step.message,
      });
      if (res.ok) {
        sent++;
        await supabase.from("marketing_inbox_messages").insert({
          conversation_id: e.conversation_id,
          direction: "outbound",
          sender: "ai",
          body: `[سلسلة] ${step.message}`,
          sent_at: nowIso,
        });
      } else {
        failed++;
      }
    } else {
      failed++;
    }

    // Advance regardless of send success (never get stuck).
    const nextIndex = e.current_step + 1;
    const nextStep = steps[nextIndex];
    if (nextStep) {
      const nextRun = new Date(
        Date.now() + nextStep.delay_hours * 3600 * 1000,
      ).toISOString();
      await supabase
        .from("marketing_sequence_enrollments")
        .update({ current_step: nextIndex, next_run_at: nextRun })
        .eq("id", e.id);
      advanced++;
    } else {
      await supabase
        .from("marketing_sequence_enrollments")
        .update({ status: "done" })
        .eq("id", e.id);
      done++;
    }
  }

  // Piggyback: publish due LinkedIn scheduled posts in the same daily run
  // (Vercel Hobby caps cron jobs at 2, so no separate slot). Best-effort.
  let linkedin: { due: number; posted: number; failed: number } | null = null;
  try {
    const { runScheduledLinkedInPosts } = await import(
      "@/lib/linkedin-scheduler"
    );
    linkedin = await runScheduledLinkedInPosts(supabase);
  } catch (err) {
    console.error(
      "[cron] linkedin scheduler failed:",
      err instanceof Error ? err.message : err,
    );
  }

  // Piggyback: publish due Social-Suite scheduled posts (Facebook page etc.).
  let social: { due: number; published: number; failed: number } | null = null;
  try {
    const { publishDueSocialPosts } = await import("@/lib/social-scheduler");
    social = await publishDueSocialPosts(supabase);
  } catch (err) {
    console.error(
      "[cron] social scheduler failed:",
      err instanceof Error ? err.message : err,
    );
  }

  return NextResponse.json({
    ok: true,
    due: due.length,
    sent,
    failed,
    advanced,
    done,
    linkedin,
    social,
    ranAt: nowIso,
  });
}
