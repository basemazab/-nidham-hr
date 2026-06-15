"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/permissions";
import { STARTER_LEADS } from "@/lib/outreach-seed";
import type { LeadStatus } from "@/lib/outreach";

const PATH = "/dashboard/outreach";
const VALID: LeadStatus[] = ["new", "messaged", "replied", "demo", "customer", "not_interested"];

function normalizePhone(p: string): string {
  return (p ?? "").replace(/\D/g, "");
}

function looksPhone(s: string): boolean {
  const d = (s || "").replace(/\D/g, "");
  return d.length >= 7 && d.length <= 15;
}
function isSerial(s: string): boolean {
  return /^\d{1,4}$/.test((s || "").trim());
}

// Smart line parser: pick the phone column by its digits, drop a leading serial
// number, take the first remaining text column as the name. Handles
// "name,phone,sector", "serial,name,phone", and "name <phone>" forms.
function smartParseLine(t: string): { name: string; phone: string; sector: string | null } {
  const cols = t.split(/[,\t؛;|]/).map((x) => x.trim()).filter(Boolean);
  if (cols.length <= 1) {
    const one = cols[0] ?? "";
    const m = one.match(/\+?\d[\d\s\-().]{6,}\d/);
    if (m) {
      const phone = m[0].trim();
      const name = one.replace(m[0], "").replace(/^\s*\d{1,4}[\s.\-)،:]+/, "").trim();
      return { name: name || one, phone, sector: null };
    }
    return { name: one, phone: "", sector: null };
  }
  const phone = cols.find(looksPhone) ?? "";
  const rest = cols.filter((c) => c !== phone && !isSerial(c));
  return { name: rest[0] ?? "", phone, sector: rest[1] ?? null };
}

// One-click import of the 63 starter leads — skips any phone already present so
// it's safe to click twice.
export async function seedStarterLeads() {
  const { supabase, profile } = await requireSuperAdmin();

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
  const { supabase, profile } = await requireSuperAdmin();
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
    const { name, phone, sector } = smartParseLine(t);
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
  const { supabase, profile } = await requireSuperAdmin();
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
  const { supabase, profile } = await requireSuperAdmin();
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
  const { supabase, profile } = await requireSuperAdmin();
  await supabase
    .from("outreach_leads")
    .update({ notes })
    .eq("id", id)
    .eq("company_id", profile.company_id);
  revalidatePath(PATH);
}

export async function deleteLead(id: string) {
  const { supabase, profile } = await requireSuperAdmin();
  await supabase
    .from("outreach_leads")
    .delete()
    .eq("id", id)
    .eq("company_id", profile.company_id);
  revalidatePath(PATH);
}

// Pull existing CRM customers into the outreach board so they show with a
// WhatsApp button too. Only rows WITH a phone are useful here; dedupe by phone.
const CRM_STATUS_MAP: Record<string, LeadStatus> = {
  lead: "new",
  active: "replied",
  won: "customer",
  lost: "not_interested",
};

export async function importFromCustomers() {
  const { supabase, profile } = await requireSuperAdmin();

  const { data: existing } = await supabase
    .from("outreach_leads")
    .select("phone")
    .eq("company_id", profile.company_id);
  const seen = new Set(
    (existing ?? []).map((r) => normalizePhone(r.phone as string)).filter(Boolean),
  );

  const { data: customers, error } = await supabase
    .from("customers")
    .select("full_name, contact_name, phone, email, status")
    .eq("company_id", profile.company_id);
  if (error) throw new Error(error.message);

  let withoutPhone = 0;
  const rows: Record<string, unknown>[] = [];
  for (const c of customers ?? []) {
    if (!c.full_name) continue;
    const key = normalizePhone((c.phone as string) ?? "");
    if (!key) {
      withoutPhone++;
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      company_id: profile.company_id,
      name: c.full_name,
      phone: c.phone,
      email: (c.email as string) ?? null,
      notes: c.contact_name ? `جهة الاتصال: ${c.contact_name}` : null,
      status: CRM_STATUS_MAP[(c.status as string) ?? "lead"] ?? "new",
      source: "من العملاء (CRM)",
      created_by: profile.id,
    });
  }

  if (rows.length > 0) {
    const { error: insErr } = await supabase.from("outreach_leads").insert(rows);
    if (insErr) throw new Error(insErr.message);
  }
  revalidatePath(PATH);
  return { added: rows.length, withoutPhone };
}

// Repair rows that were mis-parsed on import (name ended up a serial number like
// "66", while the real name/phone landed in the other fields). For each such
// row we re-pick the phone (the field with 7+ digits) and the name (the field
// with letters), regardless of which column they were stored in.
export async function repairLeadNames() {
  const { supabase, profile } = await requireSuperAdmin();
  const { data: leads, error } = await supabase
    .from("outreach_leads")
    .select("id, name, phone, sector")
    .eq("company_id", profile.company_id);
  if (error) throw new Error(error.message);

  let fixed = 0;
  for (const l of leads ?? []) {
    const name = (l.name as string) ?? "";
    if (!isSerial(name)) continue; // only touch rows whose name is a bare number
    const fields = [l.name, l.phone, l.sector].filter(Boolean) as string[];
    const newPhone = fields.find(looksPhone) ?? (l.phone as string) ?? null;
    const newName = fields.find((f) => !looksPhone(f) && !isSerial(f)) ?? name;
    if (newName === l.name && newPhone === l.phone) continue;
    const { error: upErr } = await supabase
      .from("outreach_leads")
      .update({ name: newName, phone: newPhone, sector: null })
      .eq("id", l.id)
      .eq("company_id", profile.company_id);
    if (!upErr) fixed++;
  }
  revalidatePath(PATH);
  return { fixed };
}
