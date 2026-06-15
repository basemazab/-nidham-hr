import { requireSuperAdmin } from "@/lib/permissions";
import { OutreachClient } from "./outreach-client";
import type { OutreachLead } from "@/lib/outreach";

export const metadata = { title: "العملاء المحتملين" };
export const dynamic = "force-dynamic";

export default async function OutreachPage() {
  // Owner-only tool — must never be exposed to tenants.
  const { supabase } = await requireSuperAdmin();
  const { data } = await supabase
    .from("outreach_leads")
    .select(
      "id,name,phone,sector,city,website,email,status,notes,source,last_contacted_at,created_at",
    )
    .order("created_at", { ascending: true });

  return <OutreachClient leads={(data ?? []) as OutreachLead[]} />;
}
