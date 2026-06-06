import type { SupabaseClient } from "@supabase/supabase-js";
import { err, ok, type ActionResult } from "@/lib/result";
import { calculatePayroll, calculateProRationFactor, type AttendanceBreakdown } from "@/lib/payroll";
import { calculateEosGratuity } from "@/lib/eos";
import { arabicizeDbError } from "@/lib/i18n";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

type EmployeeRow = {
  id: string;
  full_name: string;
  basic_salary: number | null;
  housing_allowance: number | null;
  transport_allowance: number | null;
  other_allowances: number | null;
  incentive_allowance: number | null;
  daily_wage: number | null;
  pay_frequency: "monthly" | "weekly";
  hire_date: string | null;
  termination_date: string | null;
};

type AttendanceRecord = {
  employee_id: string;
  date: string;
  status: string;
  tardiness_minutes: number | null;
  early_leave_minutes: number | null;
  leave_type: string | null;
};

// ---------------------------------------------------------------------------
// Generate payroll period
// ---------------------------------------------------------------------------

export type GeneratePeriodParams = {
  frequency: "monthly" | "weekly";
  startDate: string;
  endDate: string;
  workingDays: number;
};

export async function generatePayrollPeriod(
  supabase: SupabaseClient,
  companyId: string,
  params: GeneratePeriodParams,
): Promise<ActionResult<{ periodId: string }>> {
  const { frequency, startDate, endDate, workingDays } = params;

  const startD = new Date(startDate + "T00:00:00");
  const year = startD.getFullYear();
  const month = startD.getMonth() + 1;

  const { data: existing } = await supabase
    .from("payroll_periods")
    .select("id")
    .eq("company_id", companyId)
    .eq("frequency", frequency)
    .eq("start_date", startDate)
    .maybeSingle();

  if (existing) return ok({ periodId: existing.id });

  const { data: period, error: periodError } = await supabase
    .from("payroll_periods")
    .insert({
      company_id: companyId,
      year,
      month,
      frequency,
      start_date: startDate,
      end_date: endDate,
      working_days: workingDays,
      status: "draft",
    })
    .select("id")
    .single();

  if (periodError || !period) {
    return err(arabicizeDbError(periodError?.message ?? "Failed to create period"));
  }

  const entriesResult = await computeAndInsertEntries(supabase, companyId, period.id, frequency, startDate, endDate, workingDays);
  if (!entriesResult.success) return entriesResult;

  return ok({ periodId: period.id });
}

// ---------------------------------------------------------------------------
// Regenerate entries
// ---------------------------------------------------------------------------

export async function regeneratePeriodEntries(
  supabase: SupabaseClient,
  companyId: string,
  periodId: string,
): Promise<ActionResult<{ count: number }>> {
  const { data: period } = await supabase
    .from("payroll_periods")
    .select("id, company_id, frequency, start_date, end_date, working_days, status")
    .eq("id", periodId)
    .single<{
      id: string;
      company_id: string;
      frequency: "monthly" | "weekly" | null;
      start_date: string | null;
      end_date: string | null;
      working_days: number;
      status: string;
    }>();

  if (!period) return err("Period not found");
  if (period.status !== "draft") return err("ممكن تعيد توليد الـ entries على المسودات فقط");
  if (!period.start_date || !period.end_date) return err("الدورة دي ناقصة تاريخ بداية أو نهاية");

  const frequency = period.frequency ?? "monthly";

  await supabase.from("payroll_entries").delete().eq("period_id", periodId).eq("company_id", companyId);

  const entriesResult = await computeAndInsertEntries(supabase, companyId, periodId, frequency, period.start_date, period.end_date, period.working_days ?? 26);
  if (!entriesResult.success) return entriesResult;

  return ok({ count: entriesResult.data.count });
}

// ---------------------------------------------------------------------------
// Shared entry computation
// ---------------------------------------------------------------------------

async function computeAndInsertEntries(
  supabase: SupabaseClient,
  companyId: string,
  periodId: string,
  frequency: "monthly" | "weekly",
  startDate: string,
  endDate: string,
  workingDays: number,
): Promise<ActionResult<{ count: number }>> {
  const employeesQuery =
    frequency === "monthly"
      ? supabase
          .from("employees")
          .select("id, full_name, basic_salary, housing_allowance, transport_allowance, other_allowances, incentive_allowance, daily_wage, pay_frequency, hire_date, termination_date")
          .eq("company_id", companyId)
          // Include staff terminated INSIDE this cycle so their final
          // pro-rated paycheck + EOS is generated (the EOS block below only
          // fires for rows the query returns). Earlier-terminated staff are
          // excluded — their termination_date falls outside the window.
          .or(`status.eq.active,and(status.eq.terminated,termination_date.gte.${startDate},termination_date.lte.${endDate})`)
          .or("pay_frequency.eq.monthly,pay_frequency.is.null")
      : supabase
          .from("employees")
          .select("id, full_name, basic_salary, housing_allowance, transport_allowance, other_allowances, incentive_allowance, daily_wage, pay_frequency, hire_date, termination_date")
          .eq("company_id", companyId)
          // Same terminated-in-cycle inclusion as the monthly branch.
          .or(`status.eq.active,and(status.eq.terminated,termination_date.gte.${startDate},termination_date.lte.${endDate})`)
          .eq("pay_frequency", "weekly");

  const [employeesRes, attendanceRes, companyRes, holidaysRes] = await Promise.all([
    employeesQuery.returns<EmployeeRow[]>(),
    supabase
      .from("attendance")
      .select("employee_id, date, status, tardiness_minutes, early_leave_minutes, leave_type")
      .gte("date", startDate)
      .lte("date", endDate)
      .returns<AttendanceRecord[]>(),
    supabase
      .from("companies")
      .select("social_insurance_enabled, income_tax_enabled")
      .eq("id", companyId)
      .single<{ social_insurance_enabled: boolean | null; income_tax_enabled: boolean | null }>(),
    supabase
      .from("public_holidays")
      .select("date, is_paid, company_id")
      .gte("date", startDate)
      .lte("date", endDate)
      .or(`company_id.eq.${companyId},company_id.is.null`)
      .returns<{ date: string; is_paid: boolean; company_id: string | null }[]>(),
  ]);

  const payrollSettings = {
    socialInsuranceEnabled: companyRes.data?.social_insurance_enabled === true,
    incomeTaxEnabled: companyRes.data?.income_tax_enabled === true,
  };

  const employees = employeesRes.data ?? [];
  const attendance = attendanceRes.data ?? [];

  const paidHolidayDates = buildPaidHolidaySet(holidaysRes.data ?? []);

  const advanceDeductions = new Map<string, number>();
  await Promise.all(
    employees.map(async (emp) => {
      const { data } = await supabase.rpc("compute_advance_deduction_for_period", {
        p_employee_id: emp.id,
        p_period_start: startDate,
        p_period_end: endDate,
      });
      advanceDeductions.set(emp.id, typeof data === "number" ? data : 0);
    }),
  );

  const entries = employees.map((emp) => {
    const empAttendance = attendance.filter((a) => a.employee_id === emp.id);
    const attended = empAttendance.filter((a) => a.status === "present").length;
    const halfDay = empAttendance.filter((a) => a.status === "half_day").length;
    const absentRows = empAttendance.filter((a) => a.status === "absent");
    const absentOnHoliday = absentRows.filter((a) => paidHolidayDates.has(a.date)).length;
    const absent = absentRows.length - absentOnHoliday;
    const unpaidLeave = empAttendance.filter((a) => a.status === "leave" && a.leave_type === "unpaid").length;
    const leave = Math.max(0, empAttendance.length - attended - halfDay - absent - unpaidLeave);

    const workdayRows = empAttendance.filter((a) => a.status === "present" || a.status === "half_day");
    const tardinessMinutes = workdayRows.reduce((s, a) => s + (a.tardiness_minutes ?? 0), 0);
    const earlyLeaveMinutes = workdayRows.reduce((s, a) => s + (a.early_leave_minutes ?? 0), 0);

    const breakdown: AttendanceBreakdown = { attended, halfDay, leave, absent, unpaidLeave, tardinessMinutes, earlyLeaveMinutes };
    const loanDeduction = advanceDeductions.get(emp.id) ?? 0;

    const proRationFactor = calculateProRationFactor({
      periodStart: startDate,
      periodEnd: endDate,
      hireDate: emp.hire_date,
      terminationDate: emp.termination_date,
    });

    const result = calculatePayroll(
      {
        basicSalary: emp.basic_salary ?? 0,
        housingAllowance: emp.housing_allowance ?? 0,
        transportAllowance: emp.transport_allowance ?? 0,
        otherAllowances: emp.other_allowances ?? 0,
        incentiveAllowance: emp.incentive_allowance ?? 0,
        loanDeduction,
        dailyWage: emp.daily_wage ?? null,
      },
      breakdown,
      workingDays,
      { ...payrollSettings, proRationFactor },
    );

    let eosAmount = 0;
    if (emp.termination_date && emp.hire_date && emp.basic_salary) {
      const tDate = emp.termination_date.slice(0, 10);
      if (tDate >= startDate && tDate <= endDate) {
        const eos = calculateEosGratuity(emp.hire_date, tDate, emp.basic_salary);
        eosAmount = eos.totalAmountEgp;
      }
    }

    return {
      company_id: companyId,
      period_id: periodId,
      employee_id: emp.id,
      attended_days: breakdown.attended,
      half_day_days: breakdown.halfDay,
      leave_days: breakdown.leave,
      absent_days: breakdown.absent,
      basic_salary: emp.basic_salary ?? 0,
      housing_allowance: emp.housing_allowance ?? 0,
      transport_allowance: emp.transport_allowance ?? 0,
      other_allowances: emp.other_allowances ?? 0,
      incentive_allowance: emp.incentive_allowance ?? 0,
      bonuses: 0,
      overtime: 0,
      gross_salary: result.grossSalary,
      absence_deduction: result.absenceDeduction,
      tardiness_deduction: result.tardinessDeduction,
      social_insurance: result.socialInsurance,
      income_tax: result.incomeTax,
      loan_deduction: loanDeduction,
      other_deductions: 0,
      total_deductions: result.totalDeductions,
      eos_gratuity: eosAmount,
      net_salary: result.netSalary + eosAmount,
    };
  });

  if (entries.length > 0) {
    await supabase.from("payroll_entries").upsert(entries, { onConflict: "period_id,employee_id" });
  }

  return ok({ count: entries.length });
}

function buildPaidHolidaySet(holidays: { date: string; is_paid: boolean; company_id: string | null }[]): Set<string> {
  const holidayMap = new Map<string, boolean>();
  const sorted = holidays.slice().sort((a, b) => {
    if (a.company_id === null && b.company_id !== null) return -1;
    if (a.company_id !== null && b.company_id === null) return 1;
    return 0;
  });
  for (const h of sorted) holidayMap.set(h.date, h.is_paid);
  const paid = new Set<string>();
  for (const [date, isPaid] of holidayMap) {
    if (isPaid) paid.add(date);
  }
  return paid;
}

// ---------------------------------------------------------------------------
// Update payroll entry
// ---------------------------------------------------------------------------

export async function updatePayrollEntry(
  supabase: SupabaseClient,
  companyId: string,
  entryId: string,
  formData: FormData,
): Promise<ActionResult<{ periodId: string }>> {
  const { data: entry } = await supabase
    .from("payroll_entries")
    .select("id, period_id, employee_id, attended_days, half_day_days, leave_days, absent_days, basic_salary, housing_allowance, transport_allowance, other_allowances")
    .eq("id", entryId)
    .eq("company_id", companyId)
    .single();

  if (!entry) return err("Entry not found");

  const { data: period } = await supabase
    .from("payroll_periods")
    .select("working_days, status")
    .eq("id", entry.period_id)
    .single();

  if (!period) return err("Period not found");
  if (period.status === "paid") return err("الشهر مقفول — مينفعش تعدل");

  const asNum = (name: string): number => {
    const v = formData.get(name);
    if (v === null) return 0;
    const n = Number(String(v));
    return Number.isFinite(n) ? n : 0;
  };
  const asTxt = (name: string): string | null => {
    const v = formData.get(name);
    if (v === null) return null;
    const s = String(v).trim();
    return s.length > 0 ? s : null;
  };

  const attended = asNum("attended_days");
  const halfDay = asNum("half_day_days");
  const leave = asNum("leave_days");
  const absent = asNum("absent_days");
  const basic = asNum("basic_salary");
  const housing = asNum("housing_allowance");
  const transport = asNum("transport_allowance");
  const other = asNum("other_allowances");
  const incentive = asNum("incentive_allowance");
  const bonuses = asNum("bonuses");
  const otHoursDay = asNum("overtime_hours_day");
  const otHoursNight = asNum("overtime_hours_night");
  const otHoursRest = asNum("overtime_hours_rest");
  const overtime = asNum("overtime");
  const loan = asNum("loan_deduction");
  const otherDed = asNum("other_deductions");

  const { data: companyRow } = await supabase
    .from("companies")
    .select("social_insurance_enabled, income_tax_enabled")
    .eq("id", companyId)
    .single<{ social_insurance_enabled: boolean | null; income_tax_enabled: boolean | null }>();

  const result = calculatePayroll(
    {
      basicSalary: basic, housingAllowance: housing, transportAllowance: transport,
      otherAllowances: other, incentiveAllowance: incentive, bonuses, overtime,
      overtimeHoursDay: otHoursDay, overtimeHoursNight: otHoursNight, overtimeHoursRest: otHoursRest,
      loanDeduction: loan, otherDeductions: otherDed,
      dailyWage: asNum("daily_wage") || null,
    },
    { attended, halfDay, leave, absent },
    period.working_days ?? 26,
    {
      socialInsuranceEnabled: companyRow?.social_insurance_enabled === true,
      incomeTaxEnabled: companyRow?.income_tax_enabled === true,
    },
  );

  await supabase
    .from("payroll_entries")
    .update({
      attended_days: attended, half_day_days: halfDay, leave_days: leave, absent_days: absent,
      basic_salary: basic, housing_allowance: housing, transport_allowance: transport,
      other_allowances: other, incentive_allowance: incentive, bonuses,
      overtime: result.overtime, overtime_hours_day: otHoursDay, overtime_hours_night: otHoursNight,
      overtime_hours_rest: otHoursRest, gross_salary: result.grossSalary,
      absence_deduction: result.absenceDeduction, social_insurance: result.socialInsurance,
      income_tax: result.incomeTax, loan_deduction: loan, other_deductions: otherDed,
      total_deductions: result.totalDeductions, net_salary: result.netSalary,
      notes: asTxt("notes"),
    })
    .eq("id", entryId)
    .eq("company_id", companyId);

  return ok({ periodId: entry.period_id });
}

// ---------------------------------------------------------------------------
// Status transitions
// ---------------------------------------------------------------------------

export async function approvePayrollPeriod(
  supabase: SupabaseClient,
  companyId: string,
  profileId: string,
  periodId: string,
): Promise<ActionResult> {
  const { error } = await supabase
    .from("payroll_periods")
    .update({ status: "approved", approved_at: new Date().toISOString(), approved_by: profileId })
    .eq("id", periodId)
    .eq("company_id", companyId)
    .eq("status", "draft");
  if (error) return err(arabicizeDbError(error.message));
  return ok(undefined);
}

export async function markPayrollAsPaid(
  supabase: SupabaseClient,
  companyId: string,
  periodId: string,
): Promise<ActionResult> {
  const { error } = await supabase
    .from("payroll_periods")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", periodId)
    .eq("company_id", companyId)
    .eq("status", "approved");
  if (error) return err(arabicizeDbError(error.message));
  return ok(undefined);
}

export async function deletePayrollPeriod(
  supabase: SupabaseClient,
  companyId: string,
  periodId: string,
): Promise<ActionResult> {
  await supabase
    .from("payroll_periods")
    .delete()
    .eq("id", periodId)
    .eq("company_id", companyId)
    .eq("status", "draft");
  return ok(undefined);
}

export async function rollbackPayrollToDraft(
  supabase: SupabaseClient,
  companyId: string,
  periodId: string,
): Promise<ActionResult> {
  const { error } = await supabase
    .from("payroll_periods")
    .update({ status: "draft", approved_at: null, approved_by: null })
    .eq("id", periodId)
    .eq("company_id", companyId)
    .eq("status", "approved");
  if (error) return err(arabicizeDbError(error.message));
  return ok(undefined);
}

export async function cancelPayrollPeriod(
  supabase: SupabaseClient,
  companyId: string,
  profileId: string,
  periodId: string,
  reason: string,
  confirm: string,
): Promise<ActionResult> {
  if (confirm !== "إلغاء") return err("لازم تكتب 'إلغاء' للتأكيد");
  if (reason.length < 5) return err("اكتب سبب الإلغاء (5 حروف على الأقل)");

  const { error } = await supabase
    .from("payroll_periods")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancelled_by: profileId, cancellation_reason: reason })
    .eq("id", periodId)
    .eq("company_id", companyId)
    .in("status", ["draft", "approved", "paid"]);
  if (error) return err(arabicizeDbError(error.message));
  return ok(undefined);
}

export async function reopenPayrollPeriod(
  supabase: SupabaseClient,
  companyId: string,
  profileId: string,
  periodId: string,
  confirm: string,
): Promise<ActionResult<{ nextStatus: string }>> {
  if (confirm !== "فتح") return err("لازم تكتب 'فتح' للتأكيد");

  const { data: period } = await supabase
    .from("payroll_periods")
    .select("status, reopened_count")
    .eq("id", periodId)
    .single<{ status: string; reopened_count: number }>();
  if (!period) return err("Period not found");

  let nextStatus: "draft" | "approved" | null = null;
  const updates: Record<string, unknown> = {
    reopened_count: (period.reopened_count ?? 0) + 1,
    last_reopened_at: new Date().toISOString(),
    last_reopened_by: profileId,
  };

  if (period.status === "paid") { nextStatus = "approved"; updates.status = "approved"; updates.paid_at = null; }
  else if (period.status === "approved") { nextStatus = "draft"; updates.status = "draft"; updates.approved_at = null; updates.approved_by = null; }
  else if (period.status === "cancelled") { nextStatus = "draft"; updates.status = "draft"; updates.cancelled_at = null; updates.cancelled_by = null; updates.cancellation_reason = null; }
  else return err("الدورة دي مش ممكن تفتحها (draft بالفعل)");

  const { error } = await supabase.from("payroll_periods").update(updates).eq("id", periodId).eq("company_id", companyId);
  if (error) return err(arabicizeDbError(error.message));
  return ok({ nextStatus: nextStatus ?? "1" });
}

// ---------------------------------------------------------------------------
// Simulate
// ---------------------------------------------------------------------------

export async function simulatePayrollRun(
  supabase: SupabaseClient,
  companyId: string,
  periodId: string,
): Promise<{ total_employees: number; gross_total: number; net_total: number; deductions_total: number; insurance_total: number; tax_total: number; bonuses_total: number } | { error: string }> {
  const { data: period } = await supabase
    .from("payroll_periods")
    .select("*, payroll_entries(*)")
    .eq("id", periodId)
    .eq("company_id", companyId)
    .single();

  if (!period) return { error: "فترة المرتبات غير موجودة" };

  const entries = (period as any).payroll_entries || [];
  return {
    total_employees: entries.length,
    gross_total: entries.reduce((s: number, e: any) => s + Number(e.gross_salary || 0), 0),
    net_total: entries.reduce((s: number, e: any) => s + Number(e.net_salary || 0), 0),
    deductions_total: entries.reduce((s: number, e: any) => s + Number(e.total_deductions || 0), 0),
    insurance_total: entries.reduce((s: number, e: any) => s + Number(e.social_insurance || 0), 0),
    tax_total: entries.reduce((s: number, e: any) => s + Number(e.income_tax || 0), 0),
    bonuses_total: entries.reduce((s: number, e: any) => s + Number(e.bonuses || 0), 0),
  };
}

// ---------------------------------------------------------------------------
// Bulk bonus
// ---------------------------------------------------------------------------

export async function applyBulkBonus(
  supabase: SupabaseClient,
  companyId: string,
  profileId: string,
  periodId: string,
  amount: number,
  reason: string,
  recipientsRaw: string | null,
): Promise<ActionResult<{ appliedCount: number }>> {
  const { data: period } = await supabase
    .from("payroll_periods")
    .select("status, working_days")
    .eq("id", periodId)
    .single<{ status: string; working_days: number }>();
  if (!period) return err("Period not found");
  if (period.status === "paid" || period.status === "cancelled") return err("الدورة مقفولة — افتحها قبل التعديل");

  const filterIds = recipientsRaw && recipientsRaw !== "all"
    ? String(recipientsRaw).split(",").map((s) => s.trim()).filter((s) => /^[0-9a-f-]{36}$/i.test(s))
    : null;

  let entriesQuery = supabase
    .from("payroll_entries")
    .select("id, employee_id, attended_days, half_day_days, leave_days, absent_days, basic_salary, housing_allowance, transport_allowance, other_allowances, incentive_allowance, bonuses, overtime, loan_deduction, other_deductions, employees(daily_wage)")
    .eq("period_id", periodId);
  if (filterIds && filterIds.length > 0) entriesQuery = entriesQuery.in("id", filterIds);

  const { data: entries } = await entriesQuery;
  const list = entries ?? [];
  if (list.length === 0) return err("مفيش موظفين للصرف عليهم");

  const { data: companyRow } = await supabase
    .from("companies")
    .select("social_insurance_enabled, income_tax_enabled")
    .eq("id", companyId)
    .single<{ social_insurance_enabled: boolean | null; income_tax_enabled: boolean | null }>();

  const settings = {
    socialInsuranceEnabled: companyRow?.social_insurance_enabled === true,
    incomeTaxEnabled: companyRow?.income_tax_enabled === true,
  };

  let appliedCount = 0;
  await Promise.all(
    list.map(async (e) => {
      const newBonuses = Number(e.bonuses ?? 0) + amount;
      const result = calculatePayroll(
        {
          basicSalary: Number(e.basic_salary ?? 0), housingAllowance: Number(e.housing_allowance ?? 0),
          transportAllowance: Number(e.transport_allowance ?? 0), otherAllowances: Number(e.other_allowances ?? 0),
          incentiveAllowance: Number(e.incentive_allowance ?? 0), bonuses: newBonuses,
          overtime: Number(e.overtime ?? 0), loanDeduction: Number(e.loan_deduction ?? 0),
          otherDeductions: Number(e.other_deductions ?? 0),
          dailyWage: (e as { employees?: { daily_wage?: number | null } | null }).employees?.daily_wage ?? null,
        },
        {
          attended: Number(e.attended_days ?? 0), halfDay: Number(e.half_day_days ?? 0),
          leave: Number(e.leave_days ?? 0), absent: Number(e.absent_days ?? 0),
        },
        period.working_days ?? 26, settings,
      );
      const { error } = await supabase.from("payroll_entries").update({
        bonuses: newBonuses, bonus_reason: reason, gross_salary: result.grossSalary,
        social_insurance: result.socialInsurance, income_tax: result.incomeTax,
        total_deductions: result.totalDeductions, net_salary: result.netSalary,
      }).eq("id", e.id).eq("company_id", companyId);
      if (!error) appliedCount += 1;
    }),
  );

  await supabase.from("bulk_bonus_runs").insert({
    company_id: companyId, period_id: periodId, amount_each: amount, reason,
    recipients_count: appliedCount, total_amount: appliedCount * amount, applied_by: profileId,
  });

  return ok({ appliedCount });
}
