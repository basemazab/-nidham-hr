"use server";

import { createClient } from "@/lib/supabase/server";

// Public lead capture from the free calculator tools. The visitor isn't logged
// in, so this runs as the anon role and calls the SECURITY DEFINER RPC
// `capture_nidham_lead` (migration 094), which inserts into nidham_leads.
export async function captureToolLead(input: {
  name?: string;
  phone?: string;
  email?: string;
  source: string;
  message?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = (input.name ?? "").trim();
  const phone = (input.phone ?? "").trim();
  const email = (input.email ?? "").trim();

  if (!phone && !email) {
    return { ok: false, error: "ابعتلنا رقم موبايل أو إيميل عشان نتواصل" };
  }
  // light sanity checks
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "الإيميل مش مظبوط" };
  }
  if (phone && phone.replace(/\D/g, "").length < 8) {
    return { ok: false, error: "رقم الموبايل مش مظبوط" };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("capture_nidham_lead", {
      p_name: name || null,
      p_phone: phone || null,
      p_email: email || null,
      p_source: (input.source || "tool").slice(0, 60),
      p_message: (input.message ?? "").trim() || null,
    });
    if (error) {
      return { ok: false, error: "حصل خطأ بسيط، جرّب تاني" };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "مشكلة في الاتصال، جرّب تاني" };
  }
}
