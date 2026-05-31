"use server";

import { createClient } from "@/lib/supabase/server";
import { requireHR } from "@/lib/permissions";
import { EmployeeSignals, monthsBetween } from "@/lib/retention";

type EmployeeRow = {
  id: string;
  company_id: string;
  full_name: string;
  job_title: string | null;
  department: string | null;
  hire_date: string | null;
  basic_salary: number | null;
  housing_allowance: number | null;
  transport_allowance: number | null;
  other_allowances: number | null;
  incentive_allowance: number | null;
  pay_frequency: "monthly" | "weekly" | null;
  status: string;
};

type AttendanceRow = {
  employee_id: string;
  date: string;
  status: string;
  tardiness_minutes: number | null;
  early_leave_minutes: number | null;
};

type SalaryHistoryRow = {
  employee_id: string;
  change_date: string;
};

type LeaveRow = {
  employee_id: string;
  days_count: number;
  status: string;
};

export async function loadNidhamAISignals(): Promise<EmployeeSignals[]> {
  const { profile } = await requireHR();
  const companyId = profile.company_id;
  const supabase = await createClient();

  const today = new Date();
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(today.getDate() - 90);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const sixtyDaysAgo = new Date(today);
  sixtyDaysAgo.setDate(today.getDate() - 60);

  const ninetyDaysAgoIso = ninetyDaysAgo.toISOString().split("T")[0];
  const thirtyDaysAgoIso = thirtyDaysAgo.toISOString().split("T")[0];
  const sixtyDaysAgoIso = sixtyDaysAgo.toISOString().split("T")[0];
  const todayIso = today.toISOString().split("T")[0];

  const [empRes, attRes, salaryRes, leaveRes] = await Promise.all([
    supabase
      .from("employees")
      .select(
        "id, company_id, full_name, job_title, department, hire_date, basic_salary, housing_allowance, transport_allowance, other_allowances, incentive_allowance, pay_frequency, status",
      )
      .eq("company_id", companyId)
      .eq("status", "active")
      .returns<EmployeeRow[]>(),
    supabase
      .from("attendance")
      .select(
        "employee_id, date, status, tardiness_minutes, early_leave_minutes",
      )
      .gte("date", ninetyDaysAgoIso)
      .lte("date", todayIso)
      .returns<AttendanceRow[]>(),
    supabase
      .from("salary_history")
      .select("employee_id, change_date")
      .order("change_date", { ascending: false })
      .returns<SalaryHistoryRow[]>(),
    supabase
      .from("leave_requests")
      .select("employee_id, days_count, status")
      .gte("start_date", thirtyDaysAgoIso)
      .lte("start_date", todayIso)
      .eq("status", "approved")
      .returns<LeaveRow[]>(),
  ]);

  const employees = empRes.data ?? [];
  const attendance = attRes.data ?? [];
  const salaryHistory = salaryRes.data ?? [];
  const leaves = leaveRes.data ?? [];

  const lastRaiseDate = new Map<string, string>();
  for (const row of salaryHistory) {
    if (!lastRaiseDate.has(row.employee_id)) {
      lastRaiseDate.set(row.employee_id, row.change_date);
    }
  }

  const recentLeaveDaysMap = new Map<string, number>();
  for (const row of leaves) {
    const cur = recentLeaveDaysMap.get(row.employee_id) ?? 0;
    recentLeaveDaysMap.set(row.employee_id, cur + (row.days_count ?? 0));
  }

  const signals: EmployeeSignals[] = [];
  for (const emp of employees) {
    if (!emp.hire_date) continue;

    const empAtt = attendance.filter((a) => a.employee_id === emp.id);
    const present = empAtt.filter((a) => a.status === "present").length;
    const halfDay = empAtt.filter((a) => a.status === "half_day").length;
    const absent = empAtt.filter((a) => a.status === "absent").length;
    const leave = empAtt.filter((a) => a.status === "leave").length;
    const workingRecords = present + halfDay + absent + leave;
    const attendanceRate = workingRecords === 0 ? 1 : (present + halfDay * 0.5) / workingRecords;

    const workdayRows = empAtt.filter((a) => a.status === "present" || a.status === "half_day");
    const tardinessSum = workdayRows.reduce((s, a) => s + (a.tardiness_minutes ?? 0), 0);
    const earlyLeaveSum = workdayRows.reduce((s, a) => s + (a.early_leave_minutes ?? 0), 0);
    const tardinessMinutesAvgPerDay = workdayRows.length === 0 ? 0 : tardinessSum / workdayRows.length;
    const earlyLeaveMinutesAvgPerDay = workdayRows.length === 0 ? 0 : earlyLeaveSum / workdayRows.length;

    const last30 = empAtt.filter((a) => a.date >= thirtyDaysAgoIso);
    const prev60 = empAtt.filter((a) => a.date >= sixtyDaysAgoIso && a.date < thirtyDaysAgoIso);
    const rateFor = (rows: AttendanceRow[]): number => {
      const p = rows.filter((r) => r.status === "present").length;
      const h = rows.filter((r) => r.status === "half_day").length;
      const ab = rows.filter((r) => r.status === "absent").length;
      const lv = rows.filter((r) => r.status === "leave").length;
      const tot = p + h + ab + lv;
      return tot === 0 ? 1 : (p + h * 0.5) / tot;
    };
    const last30Rate = rateFor(last30);
    const prev60Rate = rateFor(prev60);
    const attendanceRateDelta = last30Rate - prev60Rate;

    const tenureMonths = monthsBetween(emp.hire_date, today);
    const lastChange = lastRaiseDate.get(emp.id) ?? emp.hire_date;
    const monthsSinceLastRaise = monthsBetween(lastChange, today);

    const totalCompensation =
      (emp.basic_salary ?? 0) +
      (emp.housing_allowance ?? 0) +
      (emp.transport_allowance ?? 0) +
      (emp.other_allowances ?? 0) +
      (emp.incentive_allowance ?? 0);

    signals.push({
      id: emp.id,
      fullName: emp.full_name,
      jobTitle: emp.job_title,
      department: emp.department,
      hireDate: emp.hire_date,
      basicSalary: emp.basic_salary ?? 0,
      totalCompensation,
      payFrequency: emp.pay_frequency ?? "monthly",
      tenureMonths,
      monthsSinceLastRaise,
      attendanceRate,
      totalAttendanceDays: workingRecords,
      absentDays: absent,
      tardinessMinutesAvgPerDay,
      earlyLeaveMinutesAvgPerDay,
      attendanceRateDelta,
      recentLeaveDays: recentLeaveDaysMap.get(emp.id) ?? 0,
    });
  }

  return signals;
}
