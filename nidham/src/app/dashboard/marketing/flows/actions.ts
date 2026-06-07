"use server";

// ============================================================================
// Flows — server actions (build button-menu flows for the Meta inbox)
// ============================================================================
// A flow = nodes (message + buttons). The webhook starts a flow on a trigger
// keyword and navigates on button taps. Enterprise-gated; form actions.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireHR } from "@/lib/permissions";
import { canUseFeature } from "@/lib/subscriptions-server";

const PAGE = "/dashboard/marketing/flows";
const UUID = /^[0-9a-f-]{36}$/i;

async function gate() {
  const { profile, supabase } = await requireHR();
  if (!(await canUseFeature("marketing_studio"))) {
    redirect("/dashboard?error=" + encodeURIComponent("الفلوهات متاحة للنسخة Enterprise فقط"));
  }
  return { profile, supabase };
}

function back(q: string): never {
  redirect(`${PAGE}?${q}`);
}

export async function createFlow(form: FormData): Promise<void> {
  const { profile, supabase } = await gate();
  const name = String(form.get("name") ?? "").trim().slice(0, 120);
  const keywords = String(form.get("trigger_keywords") ?? "")
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 30);
  if (!name) back("err=" + encodeURIComponent("اكتب اسم الفلو"));

  const { error } = await supabase
    .from("marketing_flows")
    .insert({ company_id: profile.company_id, name, trigger_keywords: keywords });
  if (error) {
    back(
      "err=" +
        encodeURIComponent(
          /relation .* does not exist|PGRST205|schema cache/i.test(error.message)
            ? "طبّق migration 098 في Supabase الأول"
            : error.message,
        ),
    );
  }
  revalidatePath(PAGE);
  back("ok=1");
}

export async function toggleFlow(form: FormData): Promise<void> {
  const { profile, supabase } = await gate();
  const id = String(form.get("id") ?? "");
  const active = String(form.get("active") ?? "") === "1";
  if (!UUID.test(id)) back("");
  await supabase
    .from("marketing_flows")
    .update({ active })
    .eq("id", id)
    .eq("company_id", profile.company_id);
  revalidatePath(PAGE);
  back("ok=1");
}

export async function deleteFlow(form: FormData): Promise<void> {
  const { profile, supabase } = await gate();
  const id = String(form.get("id") ?? "");
  if (!UUID.test(id)) back("");
  await supabase
    .from("marketing_flows")
    .delete()
    .eq("id", id)
    .eq("company_id", profile.company_id);
  revalidatePath(PAGE);
  back("ok=1");
}

export async function addFlowNode(form: FormData): Promise<void> {
  const { profile, supabase } = await gate();
  const flowId = String(form.get("flow_id") ?? "");
  const label = String(form.get("label") ?? "").trim().slice(0, 80);
  const message = String(form.get("message") ?? "").trim().slice(0, 2000);
  if (!UUID.test(flowId) || !message) back("err=" + encodeURIComponent("اكتب نص العقدة"));

  // Ownership check.
  const { data: flow } = await supabase
    .from("marketing_flows")
    .select("id")
    .eq("id", flowId)
    .eq("company_id", profile.company_id)
    .maybeSingle();
  if (!flow) back("err=" + encodeURIComponent("الفلو غير موجود"));

  // First node of a flow becomes the start by default.
  const { count } = await supabase
    .from("marketing_flow_nodes")
    .select("id", { count: "exact", head: true })
    .eq("flow_id", flowId);

  await supabase.from("marketing_flow_nodes").insert({
    flow_id: flowId,
    label: label || "عقدة",
    message,
    is_start: (count ?? 0) === 0,
    buttons: [],
  });
  revalidatePath(PAGE);
  back("ok=1");
}

export async function updateFlowNode(form: FormData): Promise<void> {
  await gate();
  const { supabase } = await requireHR();
  const id = String(form.get("id") ?? "");
  const flowId = String(form.get("flow_id") ?? "");
  if (!UUID.test(id) || !UUID.test(flowId)) back("");

  const label = String(form.get("label") ?? "").trim().slice(0, 80);
  const message = String(form.get("message") ?? "").trim().slice(0, 2000);
  const isStart = form.get("is_start") === "on";

  // Build up to 3 buttons from label_i + next_i fields.
  const buttons: { label: string; next_node_id: string }[] = [];
  for (let i = 1; i <= 3; i++) {
    const bl = String(form.get(`btn_label_${i}`) ?? "").trim().slice(0, 20);
    const bn = String(form.get(`btn_next_${i}`) ?? "").trim();
    if (bl && UUID.test(bn)) buttons.push({ label: bl, next_node_id: bn });
  }

  if (message) {
    await supabase
      .from("marketing_flow_nodes")
      .update({ label: label || "عقدة", message, buttons })
      .eq("id", id);
  }

  // Exactly one start node per flow.
  if (isStart) {
    await supabase
      .from("marketing_flow_nodes")
      .update({ is_start: false })
      .eq("flow_id", flowId);
    await supabase.from("marketing_flow_nodes").update({ is_start: true }).eq("id", id);
  }

  revalidatePath(PAGE);
  back("ok=1");
}

export async function deleteFlowNode(form: FormData): Promise<void> {
  await gate();
  const { supabase } = await requireHR();
  const id = String(form.get("id") ?? "");
  if (!UUID.test(id)) back("");
  await supabase.from("marketing_flow_nodes").delete().eq("id", id);
  revalidatePath(PAGE);
  back("ok=1");
}
