"use server";

import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/permissions";

type ChecklistType = "onboarding" | "offboarding";

export async function toggleChecklistItem(
  employeeId: string,
  itemKey: string,
  checked: boolean,
  type: ChecklistType,
) {
  const supabase = await createClient();
  const { profile } = await getMyProfile();
  if (!profile?.company_id) return { success: false, error: "no company" };

  const { error } = await supabase.from("employee_checklist").upsert(
    {
      employee_id: employeeId,
      item_key: itemKey,
      checked,
      type,
      company_id: profile.company_id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "employee_id,item_key" },
  );

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getChecklistProgress(
  employeeId: string,
  type: ChecklistType,
) {
  const supabase = await createClient();
  const { profile } = await getMyProfile();

  const { data, error } = await supabase
    .from("employee_checklist")
    .select("item_key, checked")
    .eq("employee_id", employeeId)
    .eq("type", type)
    .eq("company_id", profile?.company_id ?? "");

  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: (data ?? []) as { item_key: string; checked: boolean }[] };
}
