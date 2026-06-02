"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireHR, requireAdmin } from "@/lib/permissions";
import { bustDashboardCache } from "@/lib/cache";
import { asText, asNumber } from "@/lib/form-helpers";
import {
  createShift as svcCreateShift,
  updateShift as svcUpdateShift,
  deleteShift as svcDeleteShift,
  createRotation as svcCreateRotation,
  deleteRotation as svcDeleteRotation,
  assignEmployeeShift as svcAssignShift,
} from "@/services/shifts.service";

export async function createShift(formData: FormData) {
  const { supabase, profile } = await requireHR();

  const name = asText(formData.get("name"));
  const startTime = asText(formData.get("start_time"));
  const endTime = asText(formData.get("end_time"));

  if (!name || !startTime || !endTime) {
    redirect("/dashboard/shifts?error=" + encodeURIComponent("الاسم ووقت البداية والنهاية مطلوبين"));
  }

  const result = await svcCreateShift(supabase, profile.company_id, {
    name,
    startTime,
    endTime,
    expectedHours: asNumber(formData.get("expected_hours")) ?? 8,
    color: asText(formData.get("color")) ?? "cyan",
    isOvernight: formData.get("is_overnight") === "on",
  });

  if (!result.success) {
    redirect("/dashboard/shifts?error=" + encodeURIComponent(result.error));
  }

  revalidatePath("/dashboard/shifts");
  bustDashboardCache();
  redirect("/dashboard/shifts?created=shift");
}

export async function updateShift(shiftId: string, formData: FormData) {
  const { supabase, profile } = await requireHR();

  const update: Record<string, unknown> = {};
  const name = asText(formData.get("name"));
  if (name) update.name = name;
  const startTime = asText(formData.get("start_time"));
  if (startTime) update.start_time = startTime;
  const endTime = asText(formData.get("end_time"));
  if (endTime) update.end_time = endTime;
  const expectedHours = asNumber(formData.get("expected_hours"));
  if (expectedHours !== null) update.expected_hours = expectedHours;
  const color = asText(formData.get("color"));
  if (color) update.color = color;
  if (formData.get("is_overnight") !== null) {
    update.is_overnight = formData.get("is_overnight") === "on";
  }

  const result = await svcUpdateShift(supabase, profile.company_id, shiftId, update);
  if (!result.success) {
    redirect("/dashboard/shifts?error=" + encodeURIComponent(result.error));
  }

  revalidatePath("/dashboard/shifts");
  bustDashboardCache();
  redirect("/dashboard/shifts?updated=shift");
}

export async function deleteShift(shiftId: string) {
  const { supabase, profile } = await requireAdmin();
  await svcDeleteShift(supabase, profile.company_id, shiftId);
  revalidatePath("/dashboard/shifts");
  bustDashboardCache();
  redirect("/dashboard/shifts?deleted=shift");
}

export async function createRotation(formData: FormData) {
  const { supabase, profile } = await requireHR();

  const name = asText(formData.get("name"));
  const daysPerShift = asNumber(formData.get("days_per_shift")) ?? 6;

  const shiftIds: string[] = [];
  for (const key of ["shift_1", "shift_2", "shift_3", "shift_4"]) {
    const v = asText(formData.get(key));
    if (v) shiftIds.push(v);
  }

  if (!name) {
    redirect("/dashboard/shifts?error=" + encodeURIComponent("اكتب اسم نمط التدوير"));
  }
  if (shiftIds.length < 2) {
    redirect("/dashboard/shifts?error=" + encodeURIComponent("اختار على الأقل وردتين للتدوير"));
  }
  if (daysPerShift < 1 || daysPerShift > 30) {
    redirect("/dashboard/shifts?error=" + encodeURIComponent("عدد الأيام لكل وردية بين 1 و 30"));
  }

  const result = await svcCreateRotation(supabase, profile.company_id, {
    name,
    description: asText(formData.get("description")),
    shiftIds,
    daysPerShift,
  });

  if (!result.success) {
    redirect("/dashboard/shifts?error=" + encodeURIComponent(result.error));
  }

  revalidatePath("/dashboard/shifts");
  bustDashboardCache();
  redirect("/dashboard/shifts?created=rotation");
}

export async function deleteRotation(rotationId: string) {
  await requireAdmin();
  const supabase = (await import("@/lib/supabase/server")).createClient();
  const result = await svcDeleteRotation(await supabase, rotationId);
  if (!result.success) {
    redirect("/dashboard/shifts?error=" + encodeURIComponent(result.error));
  }
  revalidatePath("/dashboard/shifts");
  bustDashboardCache();
  redirect("/dashboard/shifts?deleted=rotation");
}

export async function assignEmployeeShift(employeeId: string, formData: FormData) {
  const { supabase, profile } = await requireHR();

  const type = asText(formData.get("assignment_type")) ?? "none";

  const result = await svcAssignShift(
    supabase,
    profile.company_id,
    employeeId,
    type,
    asText(formData.get("shift_id")),
    asText(formData.get("rotation_id")),
    asText(formData.get("anchor_date")) ?? new Date().toISOString().split("T")[0],
    asNumber(formData.get("anchor_position")) ?? 0,
  );

  if (!result.success) {
    redirect(`/dashboard/employees/${employeeId}?error=` + encodeURIComponent(result.error));
  }

  revalidatePath(`/dashboard/employees/${employeeId}`);
  revalidatePath("/dashboard/shifts");
  bustDashboardCache();
  redirect(`/dashboard/employees/${employeeId}?shift_updated=1`);
}
