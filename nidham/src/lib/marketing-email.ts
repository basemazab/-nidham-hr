// ============================================================================
// Marketing email sender — reuses RESEND_API_KEY but with a TENANT-NEUTRAL
// wrapper (NO Nidham branding) so each company emails its own customers as
// itself. Separate from src/lib/email.ts which is for Nidham system
// notifications (and carries Nidham branding). Never throws.
// ============================================================================

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type MarketingSendResult =
  | { ok: true; id: string }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; skipped: false; error: string };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Minimal neutral RTL wrapper. The footer carries the SENDER's name (the
// tenant) + a plain opt-out line — no platform branding.
function wrap(inner: string, fromName: string): string {
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Tajawal,Cairo,'Segoe UI',Tahoma,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06);">
        <tr><td style="padding:28px 32px;color:#0f172a;font-size:15px;line-height:1.8;">${inner}</td></tr>
        <tr><td style="background:#fafafa;padding:14px 32px;border-top:1px solid #eee;color:#94a3b8;font-size:11px;text-align:center;">
          ${escapeHtml(fromName)} — لو مش عايز رسايل تانية، رد على الإيميل بكلمة «إلغاء».
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// Resolve a verified sender address from env. Production sending needs a
// Resend-verified domain; we reuse whatever the deployment already verified
// for system email, but keep the DISPLAY name as the tenant's.
function resolveFrom(fromName: string): string {
  const raw =
    process.env.MARKETING_FROM_EMAIL ||
    process.env.RESEND_FROM_EMAIL ||
    "onboarding@resend.dev";
  const addr = raw.match(/<([^>]+)>/)?.[1] || raw.trim();
  const safeName = fromName.replace(/[<>"]/g, "").trim() || "فريق المبيعات";
  return `${safeName} <${addr}>`;
}

export async function sendMarketingEmail(input: {
  to: string;
  subject: string;
  html: string;
  fromName: string;
}): Promise<MarketingSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, skipped: true, reason: "RESEND_API_KEY مش متفعّل" };
  }
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resolveFrom(input.fromName),
        to: input.to,
        subject: input.subject,
        html: wrap(input.html, input.fromName),
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { ok: false, skipped: false, error: `Resend HTTP ${res.status}: ${detail.slice(0, 160)}` };
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: data.id ?? "" };
  } catch (err) {
    return {
      ok: false,
      skipped: false,
      error: err instanceof Error ? err.message : "send failed",
    };
  }
}
