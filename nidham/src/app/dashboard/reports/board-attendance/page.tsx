// ============================================================================
// /dashboard/reports/board-attendance — Board-of-Directors attendance report
// ============================================================================
// Shows the factory's current strength (total + per-department headcount) right
// away, then lets HR upload a biometric sheet to produce a printable present/
// absent report with a per-department staffing signal — built for the board.

import { requireHR } from "@/lib/permissions";
import { resolveFormContext } from "@/lib/forms";
import { BoardReportClient } from "./board-report-client";

export const dynamic = "force-dynamic";

type Emp = {
  employee_code: string | null;
  full_name: string;
  department: string | null;
  job_title: string | null;
  status: string | null;
};

type DeptOverview = { name: string; total: number; withCode: number };

const UNASSIGNED = "بدون قسم محدد";

export default async function BoardAttendancePage() {
  const { supabase, profile } = await requireHR();

  const ctx = await resolveFormContext({ formTypeCode: "BOD" });

  const { data: rosterData } = await supabase
    .from("employees")
    .select("employee_code, full_name, department, job_title, status")
    .eq("company_id", profile.company_id)
    .eq("status", "active")
    .returns<Emp[]>();

  const roster = rosterData ?? [];

  // Pre-upload strength overview (headcount only — present/absent needs a sheet).
  const byDept = new Map<string, { total: number; withCode: number }>();
  for (const e of roster) {
    const dept = (e.department ?? "").trim() || UNASSIGNED;
    const cur = byDept.get(dept) ?? { total: 0, withCode: 0 };
    cur.total += 1;
    if ((e.employee_code ?? "").trim()) cur.withCode += 1;
    byDept.set(dept, cur);
  }
  const overview: DeptOverview[] = [...byDept.entries()]
    .map(([name, v]) => ({ name, total: v.total, withCode: v.withCode }))
    .sort((a, b) => {
      if (a.name === UNASSIGNED) return 1;
      if (b.name === UNASSIGNED) return -1;
      return b.total - a.total;
    });

  const totalActive = roster.length;
  const totalWithCode = overview.reduce((s, d) => s + d.withCode, 0);

  return (
    <BoardReportClient
      company={{
        name: ctx.company.name,
        industry: ctx.company.industry,
        logoUrl: ctx.company.logoUrl ?? null,
      }}
      reference={ctx.reference}
      today={ctx.today}
      overview={overview}
      totalActive={totalActive}
      totalWithCode={totalWithCode}
    />
  );
}
