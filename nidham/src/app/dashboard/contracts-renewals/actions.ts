"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireHR } from "@/lib/permissions";
import { arabicizeDbError } from "@/lib/i18n";
import { bustDashboardCache } from "@/lib/cache";
import { asText, asNumber } from "@/lib/form-helpers";

export async function renewContract(id: string, formData: FormData) {
  const { profile } = await requireHR();

  const end_date = asText(formData.get("end_date"));
  if (!end_date) {
    redirect(
      `/dashboard/contracts-renewals/${id}?error=` +
        encodeURIComponent("تاريخ الانتهاء الجديد مطلوب"),
    );
  }

  const start_date = asText(formData.get("start_date"));
  if (start_date && end_date < start_date) {
    redirect(
      `/dashboard/contracts-renewals/${id}?error=` +
        encodeURIComponent("تاريخ الانتهاء لازم يكون بعد تاريخ البداية"),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("contracts")
    .update({
      end_date,
      start_date: start_date ?? undefined,
      contract_value: asNumber(formData.get("contract_value")),
      service_type: asText(formData.get("service_type")),
      notes: asText(formData.get("notes")),
      status: "active",
    })
    .eq("id", id)
    .eq("company_id", profile.company_id);

  if (error) {
    redirect(
      `/dashboard/contracts-renewals/${id}?error=` +
        encodeURIComponent(arabicizeDbError(error.message)),
    );
  }

  revalidatePath("/dashboard/contracts-renewals");
  revalidatePath("/dashboard/contracts");
  bustDashboardCache();
  revalidatePath(`/dashboard/contracts-renewals/${id}`);
  redirect("/dashboard/contracts-renewals?renewed=1");
}
