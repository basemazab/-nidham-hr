import { requireAdmin } from "@/lib/permissions";
import { OutreachClient } from "./outreach-client";
import type { OutreachLead } from "@/lib/outreach";

export const metadata = { title: "العملاء المحتملين" };
export const dynamic = "force-dynamic";

export default async function OutreachPage() {
  // The TOOL is available to every tenant admin. Each company sees only its own
  // leads (RLS). Only the platform owner (super-admin) can load the private
  // starter-leads seed — gated below + in the seed action.
  const { supabase, profile } = await requireAdmin();
  const { data } = await supabase
    .from("outreach_leads")
    .select(
      "id,name,phone,sector,city,website,email,status,notes,source,last_contacted_at,created_at",
    )
    .order("created_at", { ascending: true });

  const { data: sa } = await supabase
    .from("super_admins")
    .select("user_id")
    .eq("user_id", profile.id)
    .maybeSingle();

  return (
    <OutreachClient leads={(data ?? []) as OutreachLead[]} isSuperAdmin={!!sa} />
  );
}
