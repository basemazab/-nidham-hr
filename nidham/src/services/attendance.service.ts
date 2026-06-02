import type { SupabaseClient } from "@supabase/supabase-js";
import { err, ok, type ActionResult } from "@/lib/result";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_STATUSES = [
  "present",
  "absent",
  "half_day",
  "leave",
  "holiday",
  "weekend",
] as const;
type AttendanceStatus = (typeof VALID_STATUSES)[number];

const BULK_MAX_DAYS = 60;
const BULK_DELETE_MAX_DAYS = 365;

// ---------------------------------------------------------------------------
// Helpers (extracted from actions.ts for reuse)
// ---------------------------------------------------------------------------

export function clampMinutes(value: FormDataEntryValue | null): number {
  if (value === null) return 0;
  const n = parseInt(String(value), 10);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(n, 720);
}

export function parseTime(value: FormDataEntryValue | null): string | null {
  if (value === null) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const m = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const mn = parseInt(m[2], 10);
  const s = m[3] ? parseInt(m[3], 10) : 0;
  if (h < 0 || h > 23 || mn < 0 || mn > 59 || s < 0 || s > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(mn).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function datesBetween(start: string, end: string): string[] {
  const [ys, ms, ds] = start.split("-").map((n) => parseInt(n, 10));
  const [ye, me, de] = end.split("-").map((n) => parseInt(n, 10));
  if (
    !Number.isFinite(ys) || !Number.isFinite(ms) || !Number.isFinite(ds) ||
    !Number.isFinite(ye) || !Number.isFinite(me) || !Number.isFinite(de)
  ) {
    return [];
  }
  const startD = new Date(ys, ms - 1, ds);
  const endD = new Date(ye, me - 1, de);
  if (Number.isNaN(startD.getTime()) || Number.isNaN(endD.getTime())) return [];
  if (endD < startD) return [];

  const out: string[] = [];
  const cur = new Date(startD);
  while (cur <= endD) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    out.push(`${y}-${m}-${d}`);
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Mark all present
// ---------------------------------------------------------------------------

export async function markAllPresent(
  supabase: SupabaseClient,
  companyId: string,
  date: string,
  userId: string,
): Promise<ActionResult<{ count: number }>> {
  const { data: employees } = await supabase
    .from("employees")
    .select("id")
    .eq("company_id", companyId)
    .eq("status", "active")
    .returns<Array<{ id: string }>>();

  const list = employees ?? [];
  if (list.length === 0) {
    return err("مفيش موظفين نشطين");
  }

  const rows = list.map((e) => ({
    company_id: companyId,
    employee_id: e.id,
    date,
    status: "present",
    tardiness_minutes: 0,
    early_leave_minutes: 0,
    created_by: userId,
  }));

  const { error, count } = await supabase
    .from("attendance")
    .upsert(rows, { onConflict: "company_id,employee_id,date", count: "exact" });

  if (error) return err(error.message);
  return ok({ count: count ?? rows.length });
}

// ---------------------------------------------------------------------------
// Copy from yesterday
// ---------------------------------------------------------------------------

export async function copyFromYesterday(
  supabase: SupabaseClient,
  companyId: string,
  date: string,
  userId: string,
): Promise<ActionResult<{ count: number }>> {
  const dt = new Date(date + "T00:00:00");
  dt.setDate(dt.getDate() - 1);
  const yesterday = dt.toISOString().split("T")[0];

  const { data: prior } = await supabase
    .from("attendance")
    .select("employee_id, status, tardiness_minutes, early_leave_minutes")
    .eq("company_id", companyId)
    .eq("date", yesterday)
    .returns<Array<{ employee_id: string; status: string; tardiness_minutes: number | null; early_leave_minutes: number | null }>>();

  const list = prior ?? [];
  if (list.length === 0) {
    return err("مفيش حضور مسجّل امبارح للنسخ منه");
  }

  const rows = list.map((p) => ({
    company_id: companyId,
    employee_id: p.employee_id,
    date,
    status: p.status,
    tardiness_minutes: p.tardiness_minutes ?? 0,
    early_leave_minutes: p.early_leave_minutes ?? 0,
    created_by: userId,
  }));

  const { error, count } = await supabase
    .from("attendance")
    .upsert(rows, { onConflict: "company_id,employee_id,date", count: "exact" });

  if (error) return err(error.message);
  return ok({ count: count ?? rows.length });
}

// ---------------------------------------------------------------------------
// Attendance record type for saveAttendance
// ---------------------------------------------------------------------------

export type AttendanceRecordInput = {
  employeeId: string;
  status: string;
  tardiness: number;
  earlyLeave: number;
  checkIn: string | null;
  checkOut: string | null;
};

// ---------------------------------------------------------------------------
// Save individual attendance
// ---------------------------------------------------------------------------

export async function saveAttendance(
  supabase: SupabaseClient,
  companyId: string,
  date: string,
  userId: string,
  records: AttendanceRecordInput[],
  workedHoursFn: (checkIn: string, checkOut: string) => number,
): Promise<ActionResult<{ saved: number }>> {
  if (records.length === 0) {
    return err("اختار حالة موظف واحد على الأقل");
  }

  const rows = records
    .filter((r) => r.status)
    .map((r) => ({
      company_id: companyId,
      employee_id: r.employeeId,
      date,
      status: r.status,
      tardiness_minutes: r.tardiness,
      early_leave_minutes: r.earlyLeave,
      check_in: r.checkIn,
      check_out: r.checkOut,
      hours_worked: r.checkIn && r.checkOut ? Number(workedHoursFn(r.checkIn, r.checkOut).toFixed(2)) : null,
      created_by: userId,
    }));

  if (rows.length === 0) {
    return err("اختار حالة موظف واحد على الأقل");
  }

  const { error } = await supabase
    .from("attendance")
    .upsert(rows, { onConflict: "employee_id,date" });

  if (error) return err(error.message);
  return ok({ saved: rows.length });
}

// ---------------------------------------------------------------------------
// Bulk save
// ---------------------------------------------------------------------------

export async function bulkSaveAttendance(
  supabase: SupabaseClient,
  companyId: string,
  startDate: string,
  endDate: string,
  status: string,
  fridaysAsWeekend: boolean,
  userId: string,
): Promise<ActionResult<{ inserted: number; days: number; employeesCount: number }>> {
  if (!startDate) return err("التاريخ مطلوب");
  if (!(VALID_STATUSES as readonly string[]).includes(status)) return err("الحالة المختارة غير صحيحة");

  const dates = datesBetween(startDate, endDate);
  if (dates.length === 0) return err("تاريخ النهاية لازم يكون بعد أو يساوي تاريخ البداية");
  if (dates.length > BULK_MAX_DAYS) return err(`الفترة كبيرة جدًا (${dates.length} يوم). الحد الأقصى ${BULK_MAX_DAYS} يوم في المرة الواحدة.`);

  const { data: employees } = await supabase
    .from("employees")
    .select("id")
    .eq("status", "active")
    .eq("company_id", companyId)
    .returns<{ id: string }[]>();

  const empIds = (employees ?? []).map((e) => e.id);
  if (empIds.length === 0) return err("مفيش موظفين نشطين في الشركة");

  const records: Array<{
    company_id: string;
    employee_id: string;
    date: string;
    status: string;
    created_by: string;
  }> = [];

  for (const isoDate of dates) {
    const [yStr, mStr, dStr] = isoDate.split("-");
    const dt = new Date(Number(yStr), Number(mStr) - 1, Number(dStr));
    const isFriday = dt.getDay() === 5;
    const effectiveStatus = fridaysAsWeekend && isFriday ? "weekend" : status;

    for (const empId of empIds) {
      records.push({
        company_id: companyId,
        employee_id: empId,
        date: isoDate,
        status: effectiveStatus,
        created_by: userId,
      });
    }
  }

  const { error, count } = await supabase
    .from("attendance")
    .upsert(records, {
      onConflict: "employee_id,date",
      ignoreDuplicates: true,
      count: "exact",
    });

  if (error) return err(error.message);
  return ok({ inserted: count ?? records.length, days: dates.length, employeesCount: empIds.length });
}

// ---------------------------------------------------------------------------
// Bulk delete
// ---------------------------------------------------------------------------

export async function bulkDeleteAttendance(
  supabase: SupabaseClient,
  companyId: string,
  startDate: string,
  endDate: string,
  confirm: string,
): Promise<ActionResult<{ deleted: number; days: number }>> {
  if (!startDate) return err("التاريخ مطلوب");
  if (confirm !== "حذف") return err("لازم تكتب 'حذف' في خانة التأكيد عشان نمسح.");

  const dates = datesBetween(startDate, endDate);
  if (dates.length === 0) return err("تاريخ النهاية لازم يكون بعد أو يساوي تاريخ البداية");
  if (dates.length > BULK_DELETE_MAX_DAYS) return err(`الفترة كبيرة جدًا (${dates.length} يوم). الحد الأقصى ${BULK_DELETE_MAX_DAYS} يوم في المرة الواحدة.`);

  const { count: beforeCount } = await supabase
    .from("attendance")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .gte("date", startDate)
    .lte("date", endDate);

  const willDelete = beforeCount ?? 0;
  if (willDelete === 0) return err("مفيش سجلات حضور في الفترة دي عشان تتمسح.");

  const { error } = await supabase
    .from("attendance")
    .delete()
    .eq("company_id", companyId)
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) return err(error.message);
  return ok({ deleted: willDelete, days: dates.length });
}

// ---------------------------------------------------------------------------
// Delete one
// ---------------------------------------------------------------------------

export async function deleteOneAttendance(
  supabase: SupabaseClient,
  companyId: string,
  employeeId: string,
  date: string,
): Promise<ActionResult> {
  if (!employeeId || !date) return err("الموظف والتاريخ مطلوبين للحذف");

  const { error } = await supabase
    .from("attendance")
    .delete()
    .eq("employee_id", employeeId)
    .eq("company_id", companyId)
    .eq("date", date);

  if (error) return err(error.message);
  return ok(undefined);
}
