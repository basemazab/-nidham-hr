"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { generateApiKey } from "@/lib/api/keys";
import { requireAdmin } from "@/lib/permissions";

export async function createApiKey(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  const name = formData.get("name") as string;
  const env = formData.get("env") as "production" | "test";
  const scopes = formData.getAll("scopes") as string[];

  const { raw, prefix, hash } = generateApiKey(env);

  const { error } = await supabase.from("api_keys").insert({
    company_id: profile.company_id,
    created_by: profile.id,
    name,
    key_hash: hash,
    key_prefix: prefix,
    scopes,
    rate_limit_rps: env === "production" ? 30 : 10,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/settings/api-keys");

  return { raw };
}

export async function revokeApiKey(id: string) {
  const { supabase, profile } = await requireAdmin();
  const { error } = await supabase
    .from("api_keys")
    .update({ is_active: false })
    .eq("id", id)
    .eq("company_id", profile.company_id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/settings/api-keys");
}

export async function deleteApiKey(id: string) {
  const { supabase, profile } = await requireAdmin();
  const { error } = await supabase
    .from("api_keys")
    .delete()
    .eq("id", id)
    .eq("company_id", profile.company_id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/settings/api-keys");
}
