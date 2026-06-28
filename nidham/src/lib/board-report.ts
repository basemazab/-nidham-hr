// ============================================================================
// board-report.ts — build the Board-of-Directors attendance report
// ============================================================================
// Pure computation: takes the active roster + the set of codes that punched
// (from parseAttendanceSheet) and produces a per-department present/absent
// breakdown with a TRANSPARENT staffing recommendation. No I/O.
//
// Honesty notes baked into the design:
//  - "absent" = on the active roster (with a biometric code) but NOT found in
//    the uploaded sheet. It may include approved leave — the report footnotes
//    this, and the recommendation is a SIGNAL for the board to review, not a
//    hard claim.
//  - employees with NO employee_code can't be matched to the sheet, so they're
//    counted separately ("noCode") and excluded from the attendance rate
//    instead of being silently marked absent.

import { normalizeCode } from "@/lib/attendance-sheet";

export type RosterEmployee = {
  employee_code: string | null;
  full_name: string;
  department: string | null;
  job_title: string | null;
};

export type DeptRecommendation = {
  level: "ok" | "watch" | "hire" | "unknown";
  label: string;
};

export type DeptReport = {
  name: string;
  total: number; // active headcount
  withCode: number; // have a biometric code (checkable)
  noCode: number; // can't be verified against the sheet
  present: number;
  absent: number;
  rate: number | null; // present / withCode (0..1), null if withCode === 0
  recommendation: DeptRecommendation;
  absentees: { name: string; code: string | null; job_title: string | null }[];
};

export type BoardReport = {
  period: { from: string | null; to: string | null; days: number };
  totals: {
    total: number;
    withCode: number;
    noCode: number;
    present: number;
    absent: number;
    rate: number | null;
    departments: number;
  };
  departments: DeptReport[];
};

const UNASSIGNED = "بدون قسم محدد";

function recommend(rate: number | null, withCode: number): DeptRecommendation {
  if (withCode === 0 || rate === null) {
    return { level: "unknown", label: "تعذّر التقييم — مفيش أكواد بصمة في القسم" };
  }
  if (rate >= 0.9) return { level: "ok", label: "القوة كافية" };
  if (rate >= 0.75) return { level: "watch", label: "مقبول — يحتاج متابعة" };
  return { level: "hire", label: "تحت الضغط — يُنصح بتعزيز التوظيف" };
}

export function buildBoardReport(
  roster: RosterEmployee[],
  presentCodesRaw: string[],
  dates: string[],
): BoardReport {
  // presentCodes from the parser are already normalized; normalize again
  // defensively in case a caller passes raw codes.
  const present = new Set(presentCodesRaw.map((c) => normalizeCode(c)));

  const byDept = new Map<string, RosterEmployee[]>();
  for (const e of roster) {
    const dept = (e.department ?? "").trim() || UNASSIGNED;
    const list = byDept.get(dept) ?? [];
    list.push(e);
    byDept.set(dept, list);
  }

  const departments: DeptReport[] = [];
  for (const [name, emps] of byDept) {
    let withCode = 0;
    let presentCount = 0;
    const absentees: DeptReport["absentees"] = [];
    for (const e of emps) {
      const code = (e.employee_code ?? "").trim();
      if (!code) continue;
      withCode += 1;
      if (present.has(normalizeCode(code))) {
        presentCount += 1;
      } else {
        absentees.push({ name: e.full_name, code, job_title: e.job_title });
      }
    }
    const total = emps.length;
    const noCode = total - withCode;
    const absent = withCode - presentCount;
    const rate = withCode > 0 ? presentCount / withCode : null;
    absentees.sort((a, b) => a.name.localeCompare(b.name, "ar"));
    departments.push({
      name,
      total,
      withCode,
      noCode,
      present: presentCount,
      absent,
      rate,
      recommendation: recommend(rate, withCode),
      absentees,
    });
  }

  // Largest departments first (most relevant to the board); unassigned last.
  departments.sort((a, b) => {
    if (a.name === UNASSIGNED) return 1;
    if (b.name === UNASSIGNED) return -1;
    return b.total - a.total;
  });

  const totalsTotal = roster.length;
  const totalsWithCode = departments.reduce((s, d) => s + d.withCode, 0);
  const totalsPresent = departments.reduce((s, d) => s + d.present, 0);
  const totalsNoCode = totalsTotal - totalsWithCode;
  const totalsAbsent = totalsWithCode - totalsPresent;

  const sortedDates = [...dates].sort();
  return {
    period: {
      from: sortedDates[0] ?? null,
      to: sortedDates[sortedDates.length - 1] ?? null,
      days: sortedDates.length,
    },
    totals: {
      total: totalsTotal,
      withCode: totalsWithCode,
      noCode: totalsNoCode,
      present: totalsPresent,
      absent: totalsAbsent,
      rate: totalsWithCode > 0 ? totalsPresent / totalsWithCode : null,
      departments: departments.length,
    },
    departments,
  };
}
