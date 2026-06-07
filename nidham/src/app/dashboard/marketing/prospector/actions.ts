"use server";

// ============================================================================
// Prospector — server actions (find → import → content → reach → export)
// ============================================================================
//
// All gated behind the Enterprise "marketing_studio" feature like the rest
// of the Marketing Studio. Imported prospects become rows in `customers`
// (status='lead') so the existing Leads CRM + Pipeline manage them with zero
// extra plumbing. The WhatsApp SEND happens either in Bot X (bulk CSV) or
// manually via per-lead wa.me links — a Vercel app can't hold a WA session.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireHR } from "@/lib/permissions";
import { canUseFeature } from "@/lib/subscriptions-server";
import { arabicizeDbError } from "@/lib/i18n";
import {
  searchPlaces,
  buildBotXCsv,
  toWhatsAppNumber,
  isLikelyMobile,
  parseManualContacts,
  type ProspectResult,
  type SearchOutcome,
} from "@/lib/prospecting";
import { generateOutreachMessages } from "@/lib/outreach-ai";

async function gate() {
  const { profile, supabase } = await requireHR();
  if (!(await canUseFeature("marketing_studio"))) {
    redirect(
      "/dashboard?error=" +
        encodeURIComponent("أداة الباحث متاحة للنسخة Enterprise فقط"),
    );
  }
  return { profile, supabase };
}

type LeadRow = { wa: string | null; full_name: string; notes: string | null };

// Shared insert path: dedupe by phone within the company (and by name for
// phone-less rows within the batch), then bulk-insert as leads. Throws on a
// DB error so callers can surface an Arabic message.
async function insertLeadRows(
  supabase: Awaited<ReturnType<typeof gate>>["supabase"],
  companyId: string,
  rows: LeadRow[],
  source: string,
): Promise<{ inserted: number; skipped: number }> {
  const candidatePhones = Array.from(
    new Set(rows.map((r) => r.wa).filter((x): x is string => !!x)),
  );

  const existing = new Set<string>();
  if (candidatePhones.length > 0) {
    const { data: dup } = await supabase
      .from("customers")
      .select("phone")
      .eq("company_id", companyId)
      .in("phone", candidatePhones)
      .returns<{ phone: string | null }[]>();
    for (const d of dup ?? []) if (d.phone) existing.add(d.phone);
  }

  const seenNoPhone = new Set<string>();
  const toInsert: Record<string, unknown>[] = [];
  let skipped = 0;
  for (const r of rows) {
    if (r.wa) {
      if (existing.has(r.wa)) {
        skipped++;
        continue;
      }
      existing.add(r.wa);
    } else {
      const k = r.full_name.toLowerCase();
      if (seenNoPhone.has(k)) {
        skipped++;
        continue;
      }
      seenNoPhone.add(k);
    }
    toInsert.push({
      company_id: companyId,
      full_name: r.full_name,
      type: "company",
      phone: r.wa,
      whatsapp: r.wa,
      status: "lead",
      source,
      notes: r.notes,
    });
  }

  if (toInsert.length === 0) return { inserted: 0, skipped };

  const { error } = await supabase.from("customers").insert(toInsert);
  if (error) throw new Error(arabicizeDbError(error.message));

  revalidatePath("/dashboard/marketing/prospector");
  revalidatePath("/dashboard/marketing/leads");
  return { inserted: toInsert.length, skipped };
}

// ----------------------------------------------------------------------------
// searchProspectsAction — Google Places text search (returns to the client).
// ----------------------------------------------------------------------------
export async function searchProspectsAction(query: string): Promise<SearchOutcome> {
  await gate();
  return searchPlaces(query, { max: 20 });
}

// ----------------------------------------------------------------------------
// importProspectsAction — insert selected Places results as leads.
// ----------------------------------------------------------------------------
export async function importProspectsAction(
  rows: ProspectResult[],
): Promise<{ ok: true; inserted: number; skipped: number } | { ok: false; error: string }> {
  const { profile, supabase } = await gate();
  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, error: "مفيش نتايج محددة للاستيراد" };
  }
  const prepared: LeadRow[] = rows.slice(0, 200).map((r) => ({
    wa: toWhatsAppNumber(r.phone ?? r.phoneRaw ?? null),
    full_name: (r.name || "بدون اسم").slice(0, 120),
    notes:
      [
        r.address,
        r.website,
        r.rating != null
          ? `تقييم ${r.rating}${r.ratingCount ? ` (${r.ratingCount})` : ""}`
          : null,
        r.category,
      ]
        .filter(Boolean)
        .join(" · ")
        .slice(0, 500) || null,
  }));

  try {
    const { inserted, skipped } = await insertLeadRows(
      supabase,
      profile.company_id,
      prepared,
      "google_maps",
    );
    return { ok: true, inserted, skipped };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "خطأ في الاستيراد" };
  }
}

// ----------------------------------------------------------------------------
// importManualAction — import leads from pasted text (no Google key needed).
// ----------------------------------------------------------------------------
export async function importManualAction(
  text: string,
): Promise<{ ok: true; inserted: number; skipped: number } | { ok: false; error: string }> {
  const { profile, supabase } = await gate();
  const parsed = parseManualContacts(text || "");
  if (parsed.length === 0) {
    return {
      ok: false,
      error: "مفيش أرقام صالحة. اكتب كل عميل في سطر: الاسم والرقم (أو الرقم لوحده).",
    };
  }

  const prepared: LeadRow[] = parsed
    .slice(0, 500)
    .map((p) => ({
      wa: toWhatsAppNumber(p.phone),
      full_name: (p.name || "عميل").slice(0, 120),
      notes: null,
    }))
    .filter((p) => !!p.wa); // manual import requires a usable number

  if (prepared.length === 0) {
    return { ok: false, error: "الأرقام دي مش مصرية صالحة للواتساب." };
  }

  try {
    const { inserted, skipped } = await insertLeadRows(
      supabase,
      profile.company_id,
      prepared,
      "manual",
    );
    return { ok: true, inserted, skipped };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "خطأ في الاستيراد" };
  }
}

// ----------------------------------------------------------------------------
// generateOutreachAction — AI-written WhatsApp openers for a sector.
// ----------------------------------------------------------------------------
export async function generateOutreachAction(input: {
  sector: string;
  angle?: string;
  city?: string;
}): Promise<
  | { ok: true; messages: { angle: string; text: string }[] }
  | { ok: false; error: string }
> {
  await gate();
  const sector = (input.sector || "").trim();
  if (sector.length < 2) {
    return { ok: false, error: "اكتب القطاع المستهدف (مثلاً: مصانع، عيادات، مكاتب محاسبة)" };
  }
  try {
    const out = await generateOutreachMessages({
      sector,
      angle: input.angle?.trim() || undefined,
      city: input.city?.trim() || undefined,
    });
    return { ok: true, messages: out.messages };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "تعذّر توليد الرسائل، جرّب تاني",
    };
  }
}

// ----------------------------------------------------------------------------
// listOutreachAction — fetch leads (with WhatsApp-ready numbers) so the client
// can build per-lead wa.me links for manual sending (no Bot X needed).
// ----------------------------------------------------------------------------
export async function listOutreachAction(opts: {
  source?: string;
  status?: string;
  limit?: number;
}): Promise<
  | { ok: true; leads: { id: string; name: string; wa: string }[] }
  | { ok: false; error: string }
> {
  const { profile, supabase } = await gate();

  let q = supabase
    .from("customers")
    .select("id, full_name, phone, whatsapp")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })
    .limit(Math.min(opts.limit ?? 100, 300));

  if (opts.source && opts.source !== "all") q = q.eq("source", opts.source);
  if (opts.status && opts.status !== "all") q = q.eq("status", opts.status);

  const { data, error } = await q.returns<
    { id: string; full_name: string | null; phone: string | null; whatsapp: string | null }[]
  >();

  if (error) return { ok: false, error: arabicizeDbError(error.message) };

  const leads = (data ?? [])
    .map((c) => ({
      id: c.id,
      name: c.full_name || "عميل",
      wa: (c.whatsapp || c.phone || "").replace(/\D/g, ""),
    }))
    .filter((l) => isLikelyMobile(l.wa));

  return { ok: true, leads };
}

// ----------------------------------------------------------------------------
// exportBotXAction — build a Bot-X-ready CSV from the company's leads,
// filtered by source/status. Returns the CSV text for the client to download.
// ----------------------------------------------------------------------------
export async function exportBotXAction(opts: {
  source?: string;
  status?: string;
  mobileOnly?: boolean;
}): Promise<
  | { ok: true; csv: string; count: number; total: number }
  | { ok: false; error: string }
> {
  const { profile, supabase } = await gate();

  let q = supabase
    .from("customers")
    .select("full_name, phone, whatsapp")
    .eq("company_id", profile.company_id)
    .limit(5000);

  if (opts.source && opts.source !== "all") q = q.eq("source", opts.source);
  if (opts.status && opts.status !== "all") q = q.eq("status", opts.status);

  const { data, error } = await q.returns<
    { full_name: string | null; phone: string | null; whatsapp: string | null }[]
  >();

  if (error) return { ok: false, error: arabicizeDbError(error.message) };

  const total = data?.length ?? 0;
  const { csv, count } = buildBotXCsv(
    (data ?? []).map((c) => ({ name: c.full_name, wa: c.whatsapp || c.phone })),
    { mobileOnly: opts.mobileOnly ?? true },
  );

  return { ok: true, csv, count, total };
}
