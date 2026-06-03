"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Approve a pending referral → approve_referral() RPC extends BOTH companies'
// subscription by the reward months. The RPC re-checks super_admin via
// auth.uid(), so this server action (which runs with the caller's session) is
// safe: a non-super-admin's call is rejected at the database.
export async function approveReferral(formData: FormData) {
  const id = formData.get("id") as string | null;
  if (!id) redirect("/admin/referrals?error=missing-id");

  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_referral", {
    p_referral_id: id,
  });

  if (error) {
    redirect(`/admin/referrals?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/admin/referrals");
  redirect("/admin/referrals?ok=1");
}
