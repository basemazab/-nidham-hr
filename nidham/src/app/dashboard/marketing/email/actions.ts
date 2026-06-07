"use server";

// ============================================================================
// Email Campaigns — server actions (write → recipients → send/export)
// ============================================================================
// Tenant-generic: campaigns are about the TENANT's product. Sending reuses
// RESEND_API_KEY (same infra as system email) but with a neutral wrapper.
// Enterprise-gated like the rest of the Marketing Studio.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireHR } from "@/lib/permissions";
import { canUseFeature } from "@/lib/subscriptions-server";
import { arabicizeDbError } from "@/lib/i18n";
import { generateEmailCampaign, type EmailCampaign } from "@/lib/marketing-ai";
import { sendMarketingEmail } from "@/lib/marketing-email";

const SEND_CAP = 50; // per run — respects free-tier limits + sender reputation

async function gate() {
  const { profile, supabase } = await requireHR();
  if (!(await canUseFeature("marketing_studio"))) {
    redirect(
      "/dashboard?error=" +
        encodeURIComponent("حملات الإيميل متاحة للنسخة Enterprise فقط"),
    );
  }
  return { profile, supabase };
}

const EMAIL_RE = /[^\s,;<>"']+@[^\s,;<>"']+\.[^\s,;<>"']+/;

// ----------------------------------------------------------------------------
// generateEmailAction — AI writes the campaign for the tenant's product.
// ----------------------------------------------------------------------------
export async function generateEmailAction(input: {
  business: string;
  goal: string;
  audience?: string;
  tone?: string;
}): Promise<{ ok: true; campaign: EmailCampaign } | { ok: false; error: string }> {
  await gate();
  const business = (input.business || "").trim();
  const goal = (input.goal || "").trim();
  if (business.length < 5) {
    return { ok: false, error: "اكتب منتجك/خدمتك الأول عشان الحملة تكون عن شغلك" };
  }
  if (goal.length < 2) {
    return { ok: false, error: "اكتب هدف الحملة (مثلاً: عرض، تعريف بمنتج جديد)" };
  }
  try {
    const campaign = await generateEmailCampaign({
      business,
      goal,
      audience: input.audience?.trim() || undefined,
      tone: input.tone?.trim() || undefined,
    });
    return { ok: true, campaign };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "تعذّر توليد الحملة، جرّب تاني",
    };
  }
}

// ----------------------------------------------------------------------------
// importEmailsAction — paste emails (one per line, optional name) as leads.
// ----------------------------------------------------------------------------
export async function importEmailsAction(
  text: string,
): Promise<{ ok: true; inserted: number; skipped: number } | { ok: false; error: string }> {
  const { profile, supabase } = await gate();

  const parsed: { email: string; name: string | null }[] = [];
  const seen = new Set<string>();
  for (const line of (text || "").split(/\r?\n/)) {
    const m = line.match(EMAIL_RE);
    if (!m) continue;
    const email = m[0].toLowerCase();
    if (seen.has(email)) continue;
    seen.add(email);
    const name =
      (line.slice(0, m.index ?? 0) + " " + line.slice((m.index ?? 0) + m[0].length))
        .replace(/[,;|\t]+/g, " ")
        .replace(/\s+/g, " ")
        .trim() || null;
    parsed.push({ email, name });
  }
  if (parsed.length === 0) {
    return { ok: false, error: "مفيش إيميلات صالحة. اكتب كل إيميل في سطر." };
  }

  const candidates = parsed.slice(0, 1000).map((p) => p.email);
  const existing = new Set<string>();
  const { data: dup } = await supabase
    .from("customers")
    .select("email")
    .eq("company_id", profile.company_id)
    .in("email", candidates)
    .returns<{ email: string | null }[]>();
  for (const d of dup ?? []) if (d.email) existing.add(d.email.toLowerCase());

  const toInsert: Record<string, unknown>[] = [];
  let skipped = 0;
  for (const p of parsed.slice(0, 1000)) {
    if (existing.has(p.email)) {
      skipped++;
      continue;
    }
    existing.add(p.email);
    toInsert.push({
      company_id: profile.company_id,
      full_name: (p.name || p.email).slice(0, 120),
      type: "company",
      email: p.email,
      status: "lead",
      source: "email_import",
    });
  }

  if (toInsert.length === 0) return { ok: true, inserted: 0, skipped };

  const { error } = await supabase.from("customers").insert(toInsert);
  if (error) return { ok: false, error: arabicizeDbError(error.message) };

  revalidatePath("/dashboard/marketing/email");
  revalidatePath("/dashboard/marketing/leads");
  return { ok: true, inserted: toInsert.length, skipped };
}

// ----------------------------------------------------------------------------
// listEmailRecipientsAction — leads that have an email, for the chosen filter.
// ----------------------------------------------------------------------------
export async function listEmailRecipientsAction(opts: {
  status?: string;
  source?: string;
  limit?: number;
}): Promise<
  | { ok: true; recipients: { id: string; name: string; email: string }[] }
  | { ok: false; error: string }
> {
  const { profile, supabase } = await gate();

  let q = supabase
    .from("customers")
    .select("id, full_name, email")
    .eq("company_id", profile.company_id)
    .not("email", "is", null)
    .order("created_at", { ascending: false })
    .limit(Math.min(opts.limit ?? 500, 2000));

  if (opts.status && opts.status !== "all") q = q.eq("status", opts.status);
  if (opts.source && opts.source !== "all") q = q.eq("source", opts.source);

  const { data, error } = await q.returns<
    { id: string; full_name: string | null; email: string | null }[]
  >();
  if (error) return { ok: false, error: arabicizeDbError(error.message) };

  const recipients = (data ?? [])
    .filter((c) => !!c.email && EMAIL_RE.test(c.email))
    .map((c) => ({ id: c.id, name: c.full_name || "عميل", email: c.email as string }));
  return { ok: true, recipients };
}

// ----------------------------------------------------------------------------
// exportEmailsAction — CSV (email,name) for an external ESP (Brevo, etc.).
// ----------------------------------------------------------------------------
export async function exportEmailsAction(opts: {
  status?: string;
  source?: string;
}): Promise<{ ok: true; csv: string; count: number } | { ok: false; error: string }> {
  const res = await listEmailRecipientsAction({ ...opts, limit: 2000 });
  if (!res.ok) return res;
  const lines = ["البريد,الاسم"];
  const seen = new Set<string>();
  for (const r of res.recipients) {
    const email = r.email.toLowerCase();
    if (seen.has(email)) continue;
    seen.add(email);
    lines.push(`${email},${(r.name || "عميل").replace(/[,\n\r]+/g, " ").trim()}`);
  }
  return { ok: true, csv: lines.join("\n") + "\n", count: seen.size };
}

// ----------------------------------------------------------------------------
// sendTestEmailAction — send one preview to the user's chosen address.
// ----------------------------------------------------------------------------
export async function sendTestEmailAction(input: {
  to: string;
  subject: string;
  html: string;
  fromName: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await gate();
  if (!EMAIL_RE.test(input.to || "")) {
    return { ok: false, error: "اكتب إيميل صحيح للتجربة" };
  }
  const r = await sendMarketingEmail({
    to: input.to.trim(),
    subject: input.subject || "(تجربة)",
    html: input.html || "<p>(تجربة)</p>",
    fromName: input.fromName || "فريق المبيعات",
  });
  if (r.ok) return { ok: true };
  if (r.skipped) {
    return {
      ok: false,
      error:
        "الإرسال مش متفعّل. ضيف RESEND_API_KEY (ودومين موثّق) في Vercel، أو استخدم التصدير لـ Brevo.",
    };
  }
  return { ok: false, error: r.error };
}

// ----------------------------------------------------------------------------
// sendCampaignAction — send to the filtered recipient list (capped per run).
// Marks successfully-emailed leads as contacted.
// ----------------------------------------------------------------------------
export async function sendCampaignAction(input: {
  subject: string;
  html: string;
  fromName: string;
  status?: string;
  source?: string;
}): Promise<
  | { ok: true; sent: number; failed: number; remaining: number; total: number }
  | { ok: false; error: string }
> {
  const { profile, supabase } = await gate();
  const subject = (input.subject || "").trim();
  if (subject.length < 2) return { ok: false, error: "اختار عنوان للحملة الأول" };
  if ((input.html || "").trim().length < 10) {
    return { ok: false, error: "مفيش محتوى للحملة — ولّدها الأول" };
  }

  const listRes = await listEmailRecipientsAction({
    status: input.status,
    source: input.source,
    limit: 2000,
  });
  if (!listRes.ok) return listRes;

  const total = listRes.recipients.length;
  if (total === 0) {
    return { ok: false, error: "مفيش عملاء بإيميلات في الفلتر ده. استورد إيميلات الأول." };
  }

  const batch = listRes.recipients.slice(0, SEND_CAP);
  const fromName = input.fromName || "فريق المبيعات";
  let sent = 0;
  let failed = 0;
  let skippedNoKey = false;
  const sentIds: string[] = [];

  for (const r of batch) {
    const res = await sendMarketingEmail({
      to: r.email,
      subject,
      html: input.html,
      fromName,
    });
    if (res.ok) {
      sent++;
      sentIds.push(r.id);
    } else if (res.skipped) {
      skippedNoKey = true;
      break;
    } else {
      failed++;
    }
  }

  if (skippedNoKey && sent === 0) {
    return {
      ok: false,
      error:
        "الإرسال مش متفعّل. ضيف RESEND_API_KEY (ودومين موثّق) في Vercel، أو نزّل CSV واستخدم Brevo.",
    };
  }

  // Stamp the ones we emailed as contacted (only those still 'lead').
  if (sentIds.length > 0) {
    await supabase
      .from("customers")
      .update({ last_contacted_at: new Date().toISOString() })
      .eq("company_id", profile.company_id)
      .in("id", sentIds);
  }

  revalidatePath("/dashboard/marketing/email");
  return { ok: true, sent, failed, remaining: Math.max(0, total - sent), total };
}
