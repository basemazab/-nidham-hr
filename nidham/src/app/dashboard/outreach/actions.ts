"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/permissions";
import { STARTER_LEADS } from "@/lib/outreach-seed";
import type { LeadStatus } from "@/lib/outreach";

const PATH = "/dashboard/outreach";
const VALID: LeadStatus[] = ["new", "messaged", "replied", "demo", "customer", "not_interested"];

function normalizePhone(p: string): string {
  return (p ?? "").replace(/\D/g, "");
}

// One-click import of the 63 starter leads — skips any phone already present so
// it's safe to click twice.
export async function seedStarterLeads() {
  const { supabase, profile } = await requireAdmin();

  const { data: existing } = await supabase
    .from("outreach_leads")
    .select("phone")
    .eq("company_id", profile.company_id);
  const seen = new Set((existing ?? []).map((r) => normalizePhone(r.phone as string)));

  const rows = STARTER_LEADS.filter((l) => !seen.has(normalizePhone(l.phone))).map((l) => ({
    company_id: profile.company_id,
    name: l.name,
    phone: l.phone,
    sector: l.sector,
    city: l.city,
    source: l.source,
    created_by: profile.id,
  }));

  if (rows.length > 0) {
    const { error } = await supabase.from("outreach_leads").insert(rows);
    if (error) throw new Error(error.message);
  }
  revalidatePath(PATH);
  return { added: rows.length };
}

// Import pasted lines: "name, phone, sector" (sector optional). One per line.
export async function importLeadsFromText(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  const raw = String(formData.get("text") ?? "");

  const { data: existing } = await supabase
    .from("outreach_leads")
    .select("phone")
    .eq("company_id", profile.company_id);
  const seen = new Set((existing ?? []).map((r) => normalizePhone(r.phone as string)));

  const rows: Record<string, unknown>[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    const parts = t.split(/[,\t؛;]/).map((x) => x.trim());
    const name = parts[0];
    const phone = parts[1] ?? "";
    const sector = parts[2] ?? null;
    if (!name) continue;
    const key = normalizePhone(phone);
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    rows.push({
      company_id: profile.company_id,
      name,
      phone: phone || null,
      sector,
      source: "استيراد يدوي",
      created_by: profile.id,
    });
  }

  if (rows.length > 0) {
    const { error } = await supabase.from("outreach_leads").insert(rows);
    if (error) throw new Error(error.message);
  }
  revalidatePath(PATH);
  return { added: rows.length };
}

export async function setLeadStatus(id: string, status: LeadStatus) {
  const { supabase, profile } = await requireAdmin();
  if (!VALID.includes(status)) return;
  await supabase
    .from("outreach_leads")
    .update({ status })
    .eq("id", id)
    .eq("company_id", profile.company_id);
  revalidatePath(PATH);
}

// Called when the user taps the WhatsApp button: stamp the contact time and
// auto-advance "new" → "messaged" (he can correct it after).
export async function markContacted(id: string) {
  const { supabase, profile } = await requireAdmin();
  const { data: lead } = await supabase
    .from("outreach_leads")
    .select("status")
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .maybeSingle<{ status: LeadStatus }>();

  const patch: Record<string, unknown> = { last_contacted_at: new Date().toISOString() };
  if (lead?.status === "new") patch.status = "messaged";

  await supabase
    .from("outreach_leads")
    .update(patch)
    .eq("id", id)
    .eq("company_id", profile.company_id);
  revalidatePath(PATH);
}

export async function updateLeadNotes(id: string, notes: string) {
  const { supabase, profile } = await requireAdmin();
  await supabase
    .from("outreach_leads")
    .update({ notes })
    .eq("id", id)
    .eq("company_id", profile.company_id);
  revalidatePath(PATH);
}

export async function deleteLead(id: string) {
  const { supabase, profile } = await requireAdmin();
  await supabase
    .from("outreach_leads")
    .delete()
    .eq("id", id)
    .eq("company_id", profile.company_id);
  revalidatePath(PATH);
}
