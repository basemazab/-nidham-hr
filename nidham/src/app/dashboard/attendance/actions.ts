"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireHR, requireAdmin } from "@/lib/permissions";
import { bustDashboardCache } from "@/lib/cache";
import { workedHours } from "@/lib/attendance";
import { asText } from "@/lib/form-helpers";
import {
  markAllPresent as svcMarkAllPresent,
  copyFromYesterday as svcCopyFromYesterday,
  saveAttendance as svcSaveAttendance,
  bulkSaveAttendance as svcBulkSaveAttendance,
  bulkDeleteAttendance as svcBulkDeleteAttendance,
  deleteOneAttendance as svcDeleteOneAttendance,
  parseTime,
  clampMinutes,
} from "@/services/attendance.service";

export async function markAllPresent(formData: FormData) {
  const { supabase, profile } = await requireHR();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const date = String(formData.get("date") ?? "");
  if (!date) {
    redirect("/dashboard/attendance?error=" + encodeURIComponent("التاريخ مطلوب"));
  }

  const result = await svcMarkAllPresent(supabase, profile.company_id, date, user.id);
  if (!result.success) {
    redirect(`/dashboard/attendance?date=${encodeURIComponent(date)}&error=` + encodeURIComponent(result.error));
  }

  revalidatePath("/dashboard/attendance");
  bustDashboardCache();
  redirect(`/dashboard/attendance?date=${encodeURIComponent(date)}&saved=${result.data.count}`);
}

export async function copyFromYesterday(formData: FormData) {
  const { supabase, profile } = await requireHR();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const date = String(formData.get("date") ?? "");
  if (!date) {
    redirect("/dashboard/attendance?error=" + encodeURIComponent("التاريخ مطلوب"));
  }

  const result = await svcCopyFromYesterday(supabase, profile.company_id, date, user.id);
  if (!result.success) {
    redirect(`/dashboard/attendance?date=${encodeURIComponent(date)}&error=` + encodeURIComponent(result.error));
  }

  revalidatePath("/dashboard/attendance");
  bustDashboardCache();
  redirect(`/dashboard/attendance?date=${encodeURIComponent(date)}&saved=${result.data.count}`);
}

export async function saveAttendance(formData: FormData) {
  const { supabase, profile } = await requireHR();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const date = String(formData.get("date") ?? "");
  if (!date) {
    redirect("/dashboard/attendance?error=" + encodeURIComponent("التاريخ مطلوب"));
  }

  const records: Array<{ employeeId: string; status: string; tardiness: number; earlyLeave: number; checkIn: string | null; checkOut: string | null }> = [];

  for (const [key, rawValue] of formData.entries()) {
    if (!key.startsWith("status_")) continue;
    const empId = key.replace("status_", "");
    const status = String(rawValue ?? "");
    const tardiness = clampMinutes(formData.get(`tardiness_${empId}`));
    const earlyLeave = clampMinutes(formData.get(`early_leave_${empId}`));
    const checkIn = parseTime(formData.get(`check_in_${empId}`));
    const checkOut = parseTime(formData.get(`check_out_${empId}`));

    if (!status && !checkIn && !checkOut && tardiness === 0 && earlyLeave === 0) continue;

    let finalStatus = status;
    if (!finalStatus && (checkIn || checkOut)) finalStatus = "present";
    if (!finalStatus) continue;

    records.push({ employeeId: empId, status: finalStatus, tardiness, earlyLeave, checkIn, checkOut });
  }

  const result = await svcSaveAttendance(supabase, profile.company_id, date, user.id, records, workedHours);
  if (!result.success) {
    redirect("/dashboard/attendance?date=" + encodeURIComponent(date) + "&error=" + encodeURIComponent(result.error));
  }

  revalidatePath("/dashboard/attendance");
  bustDashboardCache();
  redirect("/dashboard/attendance?date=" + encodeURIComponent(date) + "&saved=" + result.data.saved);
}

export async function bulkSaveAttendance(formData: FormData) {
  const { supabase, profile } = await requireHR();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const startDate = asText(formData.get("start_date"));
  const endDateRaw = asText(formData.get("end_date"));
  const endDate = endDateRaw || startDate || "";
  const statusRaw = String(formData.get("status") ?? "present").trim();
  const fridaysAsWeekend = String(formData.get("fridays_as_weekend") ?? "") === "on";

  if (!startDate) {
    redirect("/dashboard/attendance?error=" + encodeURIComponent("التاريخ مطلوب"));
  }

  const result = await svcBulkSaveAttendance(supabase, profile.company_id, startDate, endDate, statusRaw, fridaysAsWeekend, user.id);
  if (!result.success) {
    redirect("/dashboard/attendance?error=" + encodeURIComponent(result.error));
  }

  revalidatePath("/dashboard/attendance");
  bustDashboardCache();
  redirect(
    "/dashboard/attendance?date=" + encodeURIComponent(endDate) +
    "&bulk=" + encodeURIComponent(`${result.data.inserted}|${result.data.days}|${result.data.employeesCount}`),
  );
}

export async function bulkDeleteAttendance(formData: FormData) {
  const { supabase, profile } = await requireAdmin();

  const startDate = String(formData.get("start_date") ?? "").trim();
  const endDateRaw = String(formData.get("end_date") ?? "").trim();
  const endDate = endDateRaw || startDate;
  const confirm = String(formData.get("confirm") ?? "").trim();

  const result = await svcBulkDeleteAttendance(supabase, profile.company_id, startDate, endDate, confirm);
  if (!result.success) {
    redirect("/dashboard/attendance?error=" + encodeURIComponent(result.error));
  }

  revalidatePath("/dashboard/attendance");
  revalidatePath("/dashboard/reports/attendance");
  bustDashboardCache();
  redirect("/dashboard/attendance?date=" + encodeURIComponent(endDate) + "&deleted=" + encodeURIComponent(`${result.data.deleted}|${result.data.days}`));
}

export async function deleteOneAttendance(formData: FormData) {
  const { supabase, profile } = await requireHR();
  const employeeId = String(formData.get("employee_id") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();

  const result = await svcDeleteOneAttendance(supabase, profile.company_id, employeeId, date);
  if (!result.success) {
    redirect("/dashboard/attendance?date=" + encodeURIComponent(date) + "&error=" + encodeURIComponent(result.error));
  }

  revalidatePath("/dashboard/attendance");
  revalidatePath("/dashboard/reports/attendance");
  redirect("/dashboard/attendance?date=" + encodeURIComponent(date));
}

export { parseTime, clampMinutes } from "@/services/attendance.service";
