"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireHR } from "@/lib/permissions";
import { arabicizeDbError } from "@/lib/i18n";
import { bustDashboardCache } from "@/lib/cache";

const VALID_STATUSES = ["present", "absent", "half_day", "leave"] as const;
const BASE = "/dashboard/attendance/absences";

// Quick-fix a single employee's attendance for a day from the absences view.
// Handles the two real cases HR raised:
//   • on a work errand (مأمورية)  → present + note "مأمورية"
//   • forgot to fingerprint        → present (no deduction)
// Also lets HR flip an absence to leave / half-day in one tap.
export async function correctAttendance(formData: FormData) {
  const { supabase, profile } = await requireHR();

  const employeeId = String(formData.get("employee_id") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim() || null;

  const back = `${BASE}?date=${encodeURIComponent(date)}`;

  if (!/^[0-9a-f-]{36}$/i.test(employeeId)) {
    redirect(`${back}&error=${encodeURIComponent("موظف غير صالح")}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    redirect(`${BASE}?error=${encodeURIComponent("تاريخ غير صالح")}`);
  }
  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    redirect(`${back}&error=${encodeURIComponent("حالة غير صحيحة")}`);
  }

  // Ownership guard: the employee must belong to the caller's company.
  // Blocks a forged employee_id under a super-admin session (mig 038).
  const { data: emp } = await supabase
    .from("employees")
    .select("id")
    .eq("id", employeeId)
    .eq("company_id", profile.company_id)
    .maybeSingle<{ id: string }>();
  if (!emp) {
    redirect(`${back}&error=${encodeURIComponent("الموظف ده مش تابع لشركتك")}`);
  }

  const { error } = await supabase.from("attendance").upsert(
    {
      company_id: profile.company_id,
      employee_id: employeeId,
      date,
      status,
      // Manual correction → no punch-derived lateness. HR can fine-tune
      // minutes on the main attendance page if needed.
      tardiness_minutes: 0,
      early_leave_minutes: 0,
      notes: note,
    },
    { onConflict: "employee_id,date" },
  );

  if (error) {
    redirect(`${back}&error=${encodeURIComponent(arabicizeDbError(error.message))}`);
  }

  revalidatePath(BASE);
  revalidatePath("/dashboard/attendance");
  bustDashboardCache();
  redirect(`${back}&fixed=1`);
}
