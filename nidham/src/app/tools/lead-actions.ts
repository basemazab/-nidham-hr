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

    // Sales alert — no lead should sit unseen in /admin/leads. Awaited (the
    // visitor waits ~300ms extra) because fire-and-forget gets cancelled when
    // the serverless invocation ends; sendEmail never throws and skips
    // silently when RESEND_API_KEY isn't set.
    try {
      const { sendEmail } = await import("@/lib/email");
      const esc = (v: string) =>
        v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      await sendEmail({
        to: process.env.NIDHAM_SALES_EMAIL || "basemazab640@gmail.com",
        subject: `📞 عميل مهتم جديد${name ? `: ${name}` : ""} — ${input.source}`,
        html: `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:1.8">
          <h2>📞 عميل مهتم ساب بياناته على الموقع</h2>
          <p><b>الاسم:</b> ${esc(name) || "—"}</p>
          <p><b>الموبايل:</b> ${esc(phone) || "—"}</p>
          <p><b>الإيميل:</b> ${esc(email) || "—"}</p>
          <p><b>المصدر:</b> ${esc(input.source || "tool")}</p>
          ${input.message?.trim() ? `<p><b>رسالته:</b> ${esc(input.message.trim())}</p>` : ""}
          <p style="color:#b45309"><b>⚡ كلمه دلوقتي وهو لسه مهتم — كل ساعة تأخير بتقلل فرصة الرد.</b></p>
          <p><a href="https://www.nidhamhr.com/admin/leads">كل العملاء المهتمين ←</a></p>
        </div>`,
      });
    } catch {
      // alert is best-effort — the lead is already saved
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "مشكلة في الاتصال، جرّب تاني" };
  }
}
