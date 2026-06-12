"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireHR } from "@/lib/permissions";

// Save the tenant's own LinkedIn App credentials (Client ID + Secret).
export async function saveLinkedInApp(form: FormData): Promise<void> {
  const { supabase, profile } = await requireHR();

  const clientId = String(form.get("client_id") ?? "").trim();
  const clientSecret = String(form.get("client_secret") ?? "").trim();

  if (!clientId || !clientSecret) {
    redirect(
      "/dashboard/settings/linkedin?error=" +
        encodeURIComponent("اكتب Client ID و Client Secret"),
    );
  }

  const { error } = await supabase.from("linkedin_connections").upsert(
    {
      company_id: profile.company_id,
      client_id: clientId,
      client_secret: clientSecret,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_id" },
  );

  if (error) {
    redirect(
      "/dashboard/settings/linkedin?error=" +
        encodeURIComponent(
          /relation .* does not exist|PGRST205|schema cache/i.test(error.message)
            ? "طبّق migration 105 في Supabase الأول"
            : error.message,
        ),
    );
  }

  revalidatePath("/dashboard/settings/linkedin");
  redirect("/dashboard/settings/linkedin?saved=1");
}

// Remove the stored token (keeps the app credentials).
export async function disconnectLinkedIn(): Promise<void> {
  const { supabase, profile } = await requireHR();
  await supabase
    .from("linkedin_connections")
    .update({
      access_token: null,
      token_expires_at: null,
      member_urn: null,
      member_name: null,
      updated_at: new Date().toISOString(),
    })
    .eq("company_id", profile.company_id);
  revalidatePath("/dashboard/settings/linkedin");
  redirect("/dashboard/settings/linkedin?disconnected=1");
}
