"use server";

// ============================================================================
// Prospector — server actions (find → import → content → export)
// ============================================================================
//
// All gated behind the Enterprise "marketing_studio" feature like the rest
// of the Marketing Studio. Imported prospects become rows in `customers`
// (status='lead', source='google_maps') so the existing Leads CRM + Pipeline
// manage them with zero extra plumbing. The WhatsApp SEND itself happens in
// Bot X — we just hand it a ready CSV.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireHR } from "@/lib/permissions";
import { canUseFeature } from "@/lib/subscriptions-server";
import { arabicizeDbError } from "@/lib/i18n";
import {
  searchPlaces,
  buildBotXCsv,
  toWhatsAppNumber,
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

// ----------------------------------------------------------------------------
// searchProspectsAction — Google Places text search (returns to the client).
// ----------------------------------------------------------------------------
export async function searchProspectsAction(query: string): Promise<SearchOutcome> {
  await gate();
  return searchPlaces(query, { max: 20 });
}

// ----------------------------------------------------------------------------
// importProspectsAction — insert selected results as leads in `customers`.
// Dedupes by phone within the company so re-running a search doesn't create
// duplicates.
// ----------------------------------------------------------------------------
export async function importProspectsAction(
  rows: ProspectResult[],
): Promise<{ ok: true; inserted: number; skipped: number } | { ok: false; error: string }> {
  const { profile, supabase } = await gate();

  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, error: "مفيش نتايج محددة للاستيراد" };
  }
  // Cap to keep a single import bounded.
  const capped = rows.slice(0, 200);

  // Normalize + collect candidate phones for dedupe.
  const prepared = capped.map((r) => {
    const wa = toWhatsAppNumber(r.phone ?? r.phoneRaw ?? null);
    const noteParts = [
      r.address,
      r.website,
      r.rating != null ? `تقييم ${r.rating}${r.ratingCount ? ` (${r.ratingCount})` : ""}` : null,
      r.category,
    ].filter(Boolean);
    return {
      wa,
      full_name: (r.name || "بدون اسم").slice(0, 120),
      notes: noteParts.join(" · ").slice(0, 500) || null,
    };
  });

  const candidatePhones = Array.from(
    new Set(prepared.map((p) => p.wa).filter((x): x is string => !!x)),
  );

  // Which of these phones already exist in this company?
  const existing = new Set<string>();
  if (candidatePhones.length > 0) {
    const { data: dup } = await supabase
      .from("customers")
      .select("phone")
      .eq("company_id", profile.company_id)
      .in("phone", candidatePhones)
      .returns<{ phone: string | null }[]>();
    for (const d of dup ?? []) if (d.phone) existing.add(d.phone);
  }

  // Build insert payload: skip rows whose phone already exists. Rows with no
  // phone are still imported (the user may dig up a number later), but we
  // dedupe those by name to avoid obvious repeats within this batch.
  const seenNoPhone = new Set<string>();
  const toInsert: Record<string, unknown>[] = [];
  let skipped = 0;
  for (const p of prepared) {
    if (p.wa) {
      if (existing.has(p.wa)) {
        skipped++;
        continue;
      }
      existing.add(p.wa); // dedupe within the batch too
    } else {
      const k = p.full_name.toLowerCase();
      if (seenNoPhone.has(k)) {
        skipped++;
        continue;
      }
      seenNoPhone.add(k);
    }
    toInsert.push({
      company_id: profile.company_id,
      full_name: p.full_name,
      type: "company",
      phone: p.wa,
      whatsapp: p.wa,
      status: "lead",
      source: "google_maps",
      notes: p.notes,
    });
  }

  if (toInsert.length === 0) {
    return { ok: true, inserted: 0, skipped };
  }

  const { error } = await supabase.from("customers").insert(toInsert);
  if (error) {
    return { ok: false, error: arabicizeDbError(error.message) };
  }

  revalidatePath("/dashboard/marketing/prospector");
  revalidatePath("/dashboard/marketing/leads");
  return { ok: true, inserted: toInsert.length, skipped };
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
    (data ?? []).map((c) => ({
      name: c.full_name,
      wa: c.whatsapp || c.phone,
    })),
    { mobileOnly: opts.mobileOnly ?? true },
  );

  return { ok: true, csv, count, total };
}
