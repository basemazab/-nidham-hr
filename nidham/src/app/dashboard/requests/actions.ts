"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireHR } from "@/lib/permissions";
import { bustDashboardCache } from "@/lib/cache";
import { asText } from "@/lib/form-helpers";
import {
  decideRequest as svcDecideRequest,
  markAdvancePaid as svcMarkAdvancePaid,
} from "@/services/requests.service";

type RequestKind = "leave" | "advance" | "permission";

export async function decideRequest(
  kind: RequestKind,
  id: string,
  decision: "approved" | "rejected",
  formData: FormData,
) {
  const { supabase, profile } = await requireHR();

  const hrNotes = asText(formData.get("hr_notes"));

  const result = await svcDecideRequest(supabase, profile.company_id, profile.id, kind, id, decision, hrNotes);
  const backUrl = `/dashboard/requests/${kind}/${id}`;
  if (!result.success) {
    redirect(`${backUrl}?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/dashboard/requests");
  bustDashboardCache();
  revalidatePath(backUrl);
  redirect("/dashboard/requests?decided=1");
}

export async function markAdvancePaid(id: string) {
  const { supabase, profile } = await requireHR();

  const result = await svcMarkAdvancePaid(supabase, profile.company_id, id);
  if (!result.success) {
    redirect(`/dashboard/requests/advance/${id}?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/dashboard/requests");
  bustDashboardCache();
  revalidatePath(`/dashboard/requests/advance/${id}`);
}
