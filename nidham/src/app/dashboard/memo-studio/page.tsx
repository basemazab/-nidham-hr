import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MemoStudioClient } from "./memo-studio-client";

export const metadata = { title: "مولّد المستندات الرسمية | نِظام" };

export default async function MemoStudioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, full_name, role")
    .eq("id", user.id)
    .maybeSingle<{ company_id: string | null; full_name: string | null; role: string }>();

  // HR-facing tool — employees have no business generating company memos.
  if (!profile || (profile.role !== "admin" && profile.role !== "manager")) {
    redirect("/dashboard");
  }

  let companyName = "الشركة";
  if (profile.company_id) {
    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", profile.company_id)
      .maybeSingle<{ name: string }>();
    if (company?.name) companyName = company.name;
  }

  return <MemoStudioClient companyName={companyName} signatory={profile.full_name ?? ""} />;
}
