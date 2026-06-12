// ============================================================================
// /api/admin/test-email — super-admin diagnostic for the sales-alert emails
// ============================================================================
// sendEmail() deliberately swallows Resend's error body (alerts are
// best-effort and must never break signups). When alerts "don't arrive",
// this route reproduces the exact same send and returns Resend's FULL
// response so the failure is visible: invalid key, sandbox to-address
// restriction, unverified from-domain, etc.

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { data: sa } = await supabase
    .from("super_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!sa) return Response.json({ error: "super admin only" }, { status: 403 });

  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM_EMAIL || "Nidham <notifications@nidham.app>";
  const to = process.env.NIDHAM_SALES_EMAIL || "basemazab640@gmail.com";

  if (!apiKey) {
    return Response.json({
      ok: false,
      stage: "env",
      error: "RESEND_API_KEY غير موجود في هذا الـ deployment",
      from,
      to,
    });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "🧪 اختبار تنبيهات نِظام",
      html: '<div dir="rtl" style="font-family:Tahoma">لو وصلك الإيميل ده — تنبيهات المبيعات شغالة ✅</div>',
    }),
  });
  const detail = await res.text().catch(() => "");

  return Response.json({
    ok: res.ok,
    resendStatus: res.status,
    from,
    to,
    keyFormatOk: apiKey.startsWith("re_"),
    keyLength: apiKey.length,
    resendResponse: detail.slice(0, 600),
  });
}
