"use server";

// ============================================================================
// Broadcast — server actions (segment → send / tag). ManyChat-style.
// ============================================================================
// Sends a one-off message to a segment of inbox conversations (subscribers).
// Reuses the Meta page token + sendMetaMessage. Messenger only delivers inside
// the 24h window — sends to older conversations fail and are COUNTED (honest).
// Enterprise-gated. Sends are capped per run to respect timeouts + rate limits.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireHR } from "@/lib/permissions";
import { canUseFeature } from "@/lib/subscriptions-server";
import { sendMetaMessage } from "@/lib/marketing-inbox/meta-client";

const SEND_CAP = 50; // per run
const TAG_CAP = 300; // per run

export type Segment = {
  channel?: string; // all | messenger | instagram
  status?: string; // all | open | ai_replied | human_replied | qualified | closed
  leadQuality?: string; // all | hot | warm | cold
  tag?: string; // exact tag or ""
};

async function gate() {
  const { profile, supabase } = await requireHR();
  if (!(await canUseFeature("marketing_studio"))) {
    redirect(
      "/dashboard?error=" + encodeURIComponent("البثّ متاح للنسخة Enterprise فقط"),
    );
  }
  return { profile, supabase };
}

type ConvRow = { id: string; channel: string; external_user_id: string };

// ── preview audience size ──
export async function previewBroadcastAction(
  seg: Segment,
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const { profile, supabase } = await gate();
  let q = supabase
    .from("marketing_inbox_conversations")
    .select("id", { count: "exact", head: true })
    .eq("company_id", profile.company_id);
  if (seg.channel && seg.channel !== "all") q = q.eq("channel", seg.channel);
  if (seg.status && seg.status !== "all") q = q.eq("status", seg.status);
  if (seg.leadQuality && seg.leadQuality !== "all")
    q = q.eq("ai_lead_quality", seg.leadQuality);
  if (seg.tag && seg.tag.trim()) q = q.contains("tags", [seg.tag.trim()]);

  const { count, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, count: count ?? 0 };
}

// ── send the broadcast (capped per run) ──
export async function sendBroadcastAction(input: {
  message: string;
  segment: Segment;
}): Promise<
  | { ok: true; sent: number; failed: number; remaining: number; total: number }
  | { ok: false; error: string }
> {
  const { profile, supabase } = await gate();
  const message = (input.message || "").trim();
  if (message.length < 2) return { ok: false, error: "اكتب نص الرسالة الأول" };

  const { data: settings } = await supabase
    .from("marketing_inbox_settings")
    .select("meta_page_token")
    .eq("company_id", profile.company_id)
    .maybeSingle<{ meta_page_token: string | null }>();
  if (!settings?.meta_page_token) {
    return { ok: false, error: "Meta Page Token مش مضبوط — اكمل إعدادات الـ Inbox الأول" };
  }

  const seg = input.segment;
  let q = supabase
    .from("marketing_inbox_conversations")
    .select("id, channel, external_user_id")
    .eq("company_id", profile.company_id);
  if (seg.channel && seg.channel !== "all") q = q.eq("channel", seg.channel);
  if (seg.status && seg.status !== "all") q = q.eq("status", seg.status);
  if (seg.leadQuality && seg.leadQuality !== "all")
    q = q.eq("ai_lead_quality", seg.leadQuality);
  if (seg.tag && seg.tag.trim()) q = q.contains("tags", [seg.tag.trim()]);

  const { data, error } = await q
    .order("last_message_at", { ascending: false })
    .limit(2000)
    .returns<ConvRow[]>();
  if (error) return { ok: false, error: error.message };

  const audience = data ?? [];
  const total = audience.length;
  if (total === 0) return { ok: false, error: "مفيش محادثات في الشريحة دي" };

  const batch = audience.slice(0, SEND_CAP);
  let sent = 0;
  let failed = 0;
  for (const conv of batch) {
    if (conv.channel !== "messenger" && conv.channel !== "instagram") {
      failed++;
      continue;
    }
    const res = await sendMetaMessage({
      channel: conv.channel,
      pageToken: settings.meta_page_token,
      recipientId: conv.external_user_id,
      text: message,
    });
    if (res.ok) {
      sent++;
      await supabase.from("marketing_inbox_messages").insert({
        conversation_id: conv.id,
        direction: "outbound",
        sender: "human",
        body: `[بثّ] ${message}`,
        sent_at: new Date().toISOString(),
      });
    } else {
      failed++;
    }
  }

  await supabase.from("marketing_broadcasts").insert({
    company_id: profile.company_id,
    message,
    segment: input.segment,
    recipients: total,
    sent,
    failed,
  });

  revalidatePath("/dashboard/marketing/broadcast");
  return { ok: true, sent, failed, remaining: Math.max(0, total - sent), total };
}

// ── bulk-tag a segment (so it becomes a reusable audience) ──
export async function tagSegmentAction(input: {
  segment: Segment;
  tag: string;
}): Promise<{ ok: true; tagged: number } | { ok: false; error: string }> {
  const { profile, supabase } = await gate();
  const tag = (input.tag || "").trim().slice(0, 40);
  if (!tag) return { ok: false, error: "اكتب اسم التاج" };

  const seg = input.segment;
  let q = supabase
    .from("marketing_inbox_conversations")
    .select("id, tags")
    .eq("company_id", profile.company_id);
  if (seg.channel && seg.channel !== "all") q = q.eq("channel", seg.channel);
  if (seg.status && seg.status !== "all") q = q.eq("status", seg.status);
  if (seg.leadQuality && seg.leadQuality !== "all")
    q = q.eq("ai_lead_quality", seg.leadQuality);
  if (seg.tag && seg.tag.trim()) q = q.contains("tags", [seg.tag.trim()]);

  const { data, error } = await q
    .limit(TAG_CAP)
    .returns<{ id: string; tags: string[] | null }[]>();
  if (error) return { ok: false, error: error.message };

  let tagged = 0;
  for (const row of data ?? []) {
    const current = row.tags ?? [];
    if (current.includes(tag)) continue;
    const { error: upErr } = await supabase
      .from("marketing_inbox_conversations")
      .update({ tags: [...current, tag] })
      .eq("id", row.id)
      .eq("company_id", profile.company_id);
    if (!upErr) tagged++;
  }

  revalidatePath("/dashboard/marketing/broadcast");
  return { ok: true, tagged };
}
