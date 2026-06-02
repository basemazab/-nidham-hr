"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireHR } from "@/lib/permissions";

export async function listWorkflows() {
  const { supabase, profile } = await requireHR();
  const { data, error } = await supabase
    .from("workflows")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getWorkflow(id: string) {
  const { supabase, profile } = await requireHR();
  const { data, error } = await supabase
    .from("workflows")
    .select("*")
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createWorkflow(formData: FormData) {
  const { supabase, profile } = await requireHR();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const triggerType = formData.get("trigger_type") as string;

  const { data, error } = await supabase
    .from("workflows")
    .insert({
      company_id: profile.company_id,
      created_by: profile.id,
      name,
      description,
      trigger_type: triggerType,
      trigger_config: {},
      conditions: [],
      actions: [],
      is_active: false,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/automation");
  return data;
}

export async function updateWorkflow(id: string, formData: FormData) {
  const { supabase, profile } = await requireHR();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const isActive = formData.get("is_active") === "true";

  const { data, error } = await supabase
    .from("workflows")
    .update({ name, description, is_active: isActive })
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/automation");
  return data;
}

export async function saveWorkflowDefinition(
  id: string,
  definition: {
    trigger_config: Record<string, unknown>;
    conditions: unknown[];
    actions: unknown[];
  },
) {
  const { supabase, profile } = await requireHR();
  const { error } = await supabase
    .from("workflows")
    .update({
      trigger_config: definition.trigger_config,
      conditions: definition.conditions,
      actions: definition.actions,
    })
    .eq("id", id)
    .eq("company_id", profile.company_id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/automation");
}

export async function toggleWorkflow(id: string, isActive: boolean) {
  const { supabase, profile } = await requireHR();
  const { error } = await supabase
    .from("workflows")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("company_id", profile.company_id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/automation");
}

export async function deleteWorkflow(id: string) {
  const { supabase, profile } = await requireHR();
  const { error } = await supabase
    .from("workflows")
    .delete()
    .eq("id", id)
    .eq("company_id", profile.company_id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/automation");
}

export async function listExecutionLogs(workflowId?: string) {
  const { supabase, profile } = await requireHR();
  let query = supabase
    .from("workflow_execution_logs")
    .select("*, workflows:workflow_id(name)")
    .eq("workflows.company_id", profile.company_id)
    .order("started_at", { ascending: false })
    .limit(50);

  if (workflowId) {
    query = query.eq("workflow_id", workflowId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}
