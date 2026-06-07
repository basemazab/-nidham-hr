"use server";

// ============================================================================
// Sequences — server actions (build sequence → add steps → enroll a segment)
// ============================================================================
// The /api/cron/run-sequences cron walks enrollments and sends due steps.
// Enterprise-gated. All are form actions (redirect back to the sequences page).

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireHR } from "@/lib/permissions";
import { canUseFeature } from "@/lib/subscriptions-server";

const PAGE = "/dashboard/marketing/sequences";
const UUID = /^[0-9a-f-]{36}$/i;

async function gate() {
  const { profile, supabase } = await requireHR();
  if (!(await canUseFeature("marketing_studio"))) {
    redirect("/dashboard?error=" + encodeURIComponent("السلاسل متاحة للنسخة Enterprise فقط"));
  }
  return { profile, supabase };
}

function back(q: string): never {
  redirect(`${PAGE}?${q}`);
}

export async function createSequence(form: FormData): Promise<void> {
  const { profile, supabase } = await gate();
  const name = String(form.get("name") ?? "").trim().slice(0, 120);
  if (!name) back("err=" + encodeURIComponent("اكتب اسم السلسلة"));
  const { error } = await supabase
    .from("marketing_sequences")
    .insert({ company_id: profile.company_id, name });
  if (error) {
    back(
      "err=" +
        encodeURIComponent(
          /relation .* does not exist|PGRST205|schema cache/i.test(error.message)
            ? "طبّق migration 097 في Supabase الأول"
            : error.message,
        ),
    );
  }
  revalidatePath(PAGE);
  back("ok=1");
}

export async function toggleSequence(form: FormData): Promise<void> {
  const { profile, supabase } = await gate();
  const id = String(form.get("id") ?? "");
  const active = String(form.get("active") ?? "") === "1";
  if (!UUID.test(id)) back("");
  await supabase
    .from("marketing_sequences")
    .update({ active })
    .eq("id", id)
    .eq("company_id", profile.company_id);
  revalidatePath(PAGE);
  back("ok=1");
}

export async function deleteSequence(form: FormData): Promise<void> {
  const { profile, supabase } = await gate();
  const id = String(form.get("id") ?? "");
  if (!UUID.test(id)) back("");
  await supabase
    .from("marketing_sequences")
    .delete()
    .eq("id", id)
    .eq("company_id", profile.company_id);
  revalidatePath(PAGE);
  back("ok=1");
}

export async function addSequenceStep(form: FormData): Promise<void> {
  const { profile, supabase } = await gate();
  const sequenceId = String(form.get("sequence_id") ?? "");
  const message = String(form.get("message") ?? "").trim().slice(0, 2000);
  const delayHours = Math.max(0, Math.min(24 * 60, parseInt(String(form.get("delay_hours") ?? "24"), 10) || 0));
  if (!UUID.test(sequenceId) || !message) back("err=" + encodeURIComponent("اكتب نص الخطوة"));

  // Ownership: the sequence must belong to this tenant.
  const { data: seq } = await supabase
    .from("marketing_sequences")
    .select("id")
    .eq("id", sequenceId)
    .eq("company_id", profile.company_id)
    .maybeSingle();
  if (!seq) back("err=" + encodeURIComponent("السلسلة غير موجودة"));

  const { count } = await supabase
    .from("marketing_sequence_steps")
    .select("id", { count: "exact", head: true })
    .eq("sequence_id", sequenceId);

  await supabase.from("marketing_sequence_steps").insert({
    sequence_id: sequenceId,
    step_order: count ?? 0,
    delay_hours: delayHours,
    message,
  });
  revalidatePath(PAGE);
  back("ok=1");
}

export async function deleteSequenceStep(form: FormData): Promise<void> {
  await gate();
  const { supabase } = await requireHR();
  const id = String(form.get("id") ?? "");
  if (!UUID.test(id)) back("");
  // RLS (via parent sequence company) prevents cross-tenant deletes.
  await supabase.from("marketing_sequence_steps").delete().eq("id", id);
  revalidatePath(PAGE);
  back("ok=1");
}

export async function enrollSegment(form: FormData): Promise<void> {
  const { profile, supabase } = await gate();
  const sequenceId = String(form.get("sequence_id") ?? "");
  if (!UUID.test(sequenceId)) back("err=" + encodeURIComponent("اختر سلسلة"));

  // Ownership + first-step delay.
  const { data: seq } = await supabase
    .from("marketing_sequences")
    .select("id")
    .eq("id", sequenceId)
    .eq("company_id", profile.company_id)
    .maybeSingle();
  if (!seq) back("err=" + encodeURIComponent("السلسلة غير موجودة"));

  const { data: firstStep } = await supabase
    .from("marketing_sequence_steps")
    .select("delay_hours")
    .eq("sequence_id", sequenceId)
    .order("step_order", { ascending: true })
    .limit(1)
    .maybeSingle<{ delay_hours: number }>();
  if (!firstStep) back("err=" + encodeURIComponent("ضيف خطوة واحدة للسلسلة الأول"));

  const channel = String(form.get("channel") ?? "all");
  const status = String(form.get("status") ?? "all");
  const leadQuality = String(form.get("lead_quality") ?? "all");
  const tag = String(form.get("tag") ?? "").trim();

  let q = supabase
    .from("marketing_inbox_conversations")
    .select("id")
    .eq("company_id", profile.company_id);
  if (channel !== "all") q = q.eq("channel", channel);
  if (status !== "all") q = q.eq("status", status);
  if (leadQuality !== "all") q = q.eq("ai_lead_quality", leadQuality);
  if (tag) q = q.contains("tags", [tag]);

  const { data: convs } = await q.limit(2000).returns<{ id: string }[]>();
  const list = convs ?? [];
  if (list.length === 0) back("err=" + encodeURIComponent("مفيش محادثات في الشريحة دي"));

  const nextRun = new Date(
    Date.now() + (firstStep.delay_hours ?? 0) * 3600 * 1000,
  ).toISOString();
  const rows = list.map((c) => ({
    company_id: profile.company_id,
    sequence_id: sequenceId,
    conversation_id: c.id,
    current_step: 0,
    status: "active",
    next_run_at: nextRun,
  }));

  // Ignore already-enrolled conversations (unique sequence_id+conversation_id).
  const { error } = await supabase
    .from("marketing_sequence_enrollments")
    .upsert(rows, { onConflict: "sequence_id,conversation_id", ignoreDuplicates: true });
  if (error) back("err=" + encodeURIComponent(error.message));

  revalidatePath(PAGE);
  back("enrolled=" + list.length);
}
