// ============================================================================
// /api/reports/board-attendance — parse an uploaded biometric sheet and return
// a Board-of-Directors present/absent report (per department + staffing signal)
// ============================================================================
// HR-only. Loads the tenant's ACTIVE roster, matches it against the codes that
// punched in the uploaded sheet, and returns the computed report as JSON. The
// printable rendering happens client-side from this data.

import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { parseAttendanceSheet } from "@/lib/attendance-sheet";
import { buildBoardReport, type RosterEmployee } from "@/lib/board-report";

export const maxDuration = 60;
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single<{ role: string; company_id: string }>();
  if (!profile || (profile.role !== "admin" && profile.role !== "manager")) {
    return Response.json({ error: "التقرير ده مخصص لـ HR فقط" }, { status: 403 });
  }

  const rl = checkRateLimit(`board-report:${user.id}`, 20, 10 * 60_000);
  if (!rl.ok) {
    return Response.json(
      { error: `كتر شوية — جرّب بعد ${Math.ceil(rl.retryAfterSeconds / 60)} دقيقة` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("file");
    if (f instanceof File && f.size > 0) {
      if (f.size > MAX_BYTES) {
        return Response.json({ error: "الملف كبير جدًا (الحد الأقصى 5 MB)" }, { status: 400 });
      }
      file = f;
    }
  } catch {
    return Response.json({ error: "فشل قراءة الطلب" }, { status: 400 });
  }
  if (!file) {
    return Response.json({ error: "ارفع كشف البصمة (Excel أو CSV)" }, { status: 400 });
  }

  // Active roster for this tenant (RLS auto-scopes, but we also filter by
  // company_id + status to be explicit and exclude terminated/resigned staff).
  const { data: roster, error: rosterErr } = await supabase
    .from("employees")
    .select("employee_code, full_name, department, job_title")
    .eq("company_id", profile.company_id)
    .eq("status", "active")
    .returns<RosterEmployee[]>();

  if (rosterErr) {
    return Response.json({ error: "تعذّر تحميل بيانات الموظفين: " + rosterErr.message }, { status: 500 });
  }
  if (!roster || roster.length === 0) {
    return Response.json(
      { error: "مفيش موظفين نشطين في النظام — ضيف الموظفين الأول عشان نقدر نقارن الحضور." },
      { status: 400 },
    );
  }

  const parsed = parseAttendanceSheet(await file.arrayBuffer());
  if (!parsed.ok) {
    return Response.json({ error: parsed.error ?? "تعذّر قراءة الكشف" }, { status: 422 });
  }
  if (parsed.presentCodes.length === 0) {
    return Response.json(
      { error: "ما قدرناش نطلّع أي حضور من الكشف — تأكد إن فيه عمود «رقم البصمة/كود الموظف» وعمود وقت/تاريخ." },
      { status: 422 },
    );
  }

  const report = buildBoardReport(roster, parsed.presentCodes, parsed.dates);

  return Response.json({
    ok: true,
    report,
    meta: {
      sheetRows: parsed.rowsParsed,
      matchedPresent: report.totals.present,
    },
  });
}
