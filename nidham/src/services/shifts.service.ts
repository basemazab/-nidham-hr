import type { SupabaseClient } from "@supabase/supabase-js";
import { err, ok, type ActionResult } from "@/lib/result";
import { arabicizeDbError } from "@/lib/i18n";

export type CreateShiftParams = {
  name: string;
  startTime: string;
  endTime: string;
  expectedHours: number;
  color: string;
  isOvernight: boolean;
};

export async function createShift(
  supabase: SupabaseClient,
  companyId: string,
  params: CreateShiftParams,
): Promise<ActionResult> {
  const { name, startTime, endTime, expectedHours, color, isOvernight } = params;

  const { error } = await supabase.from("shifts").insert({
    company_id: companyId,
    name,
    start_time: startTime,
    end_time: endTime,
    is_overnight: isOvernight,
    expected_hours: expectedHours,
    color,
  });

  if (error) return err(arabicizeDbError(error.message));
  return ok(undefined);
}

export async function updateShift(
  supabase: SupabaseClient,
  companyId: string,
  shiftId: string,
  update: Record<string, unknown>,
): Promise<ActionResult> {
  const { error } = await supabase
    .from("shifts")
    .update(update)
    .eq("id", shiftId)
    .eq("company_id", companyId);

  if (error) return err(arabicizeDbError(error.message));
  return ok(undefined);
}

export async function deleteShift(
  supabase: SupabaseClient,
  companyId: string,
  shiftId: string,
): Promise<ActionResult> {
  await supabase.from("shifts").delete().eq("id", shiftId).eq("company_id", companyId);
  return ok(undefined);
}

// ---------------------------------------------------------------------------
// Rotations
// ---------------------------------------------------------------------------

export function buildStandardPattern(shiftIds: string[], daysPerShift: number): (string | null)[] {
  const pattern: (string | null)[] = [];
  for (const id of shiftIds) {
    for (let i = 0; i < daysPerShift; i++) pattern.push(id);
    pattern.push(null);
  }
  return pattern;
}

export type CreateRotationParams = {
  name: string;
  description: string | null;
  shiftIds: string[];
  daysPerShift: number;
};

export async function createRotation(
  supabase: SupabaseClient,
  companyId: string,
  params: CreateRotationParams,
): Promise<ActionResult> {
  const { name, description, shiftIds, daysPerShift } = params;

  const pattern = buildStandardPattern(shiftIds, daysPerShift);

  const { error } = await supabase.from("shift_rotations").insert({
    company_id: companyId,
    name,
    description,
    cycle_days: pattern.length,
    pattern,
  });

  if (error) return err(arabicizeDbError(error.message));
  return ok(undefined);
}

export async function deleteRotation(
  supabase: SupabaseClient,
  companyId: string,
  rotationId: string,
): Promise<ActionResult> {
  // company_id clamp (defense-in-depth, matches deleteShift) so a forged
  // rotationId can never delete another tenant's rotation.
  await supabase
    .from("shift_rotations")
    .delete()
    .eq("id", rotationId)
    .eq("company_id", companyId);
  return ok(undefined);
}

// ---------------------------------------------------------------------------
// Employee assignment
// ---------------------------------------------------------------------------

export async function assignEmployeeShift(
  supabase: SupabaseClient,
  companyId: string,
  employeeId: string,
  type: string,
  shiftId: string | null,
  rotationId: string | null,
  anchorDate: string,
  anchorPos: number,
): Promise<ActionResult> {
  const update: Record<string, unknown> = {
    shift_id: null,
    rotation_id: null,
    rotation_anchor_date: null,
    rotation_anchor_position: 0,
  };

  if (type === "fixed") {
    if (!shiftId) return err("اختار الوردية");
    update.shift_id = shiftId;
  } else if (type === "rotation") {
    if (!rotationId) return err("اختار نمط التدوير");
    update.rotation_id = rotationId;
    update.rotation_anchor_date = anchorDate;
    update.rotation_anchor_position = anchorPos;
  }

  const { error } = await supabase
    .from("employees")
    .update(update)
    .eq("id", employeeId)
    .eq("company_id", companyId);

  if (error) return err(arabicizeDbError(error.message));
  return ok(undefined);
}
