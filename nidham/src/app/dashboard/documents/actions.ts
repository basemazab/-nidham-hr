"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const CATEGORIES = [
  "commercial_register",
  "tax_card",
  "license",
  "insurance",
  "civil_defense",
  "contract",
  "permit",
  "other",
];

export async function addDocument(formData: FormData) {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const categoryRaw = (formData.get("category") as string | null) ?? "other";
  const category = CATEGORIES.includes(categoryRaw) ? categoryRaw : "other";
  const expiry_date = (formData.get("expiry_date") as string | null) ?? "";
  const reminder_days = Math.max(0, Number(formData.get("reminder_days")) || 30);
  const notes = ((formData.get("notes") as string | null) ?? "").trim() || null;

  if (!name || !expiry_date) {
    redirect("/dashboard/documents?error=" + encodeURIComponent("لازم تكتب الاسم وتاريخ الانتهاء"));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single<{ company_id: string }>();
  if (!profile?.company_id) {
    redirect("/dashboard/documents?error=" + encodeURIComponent("الحساب مش مربوط بشركة"));
  }

  const { error } = await supabase.from("company_documents").insert({
    company_id: profile.company_id,
    name,
    category,
    expiry_date,
    reminder_days,
    notes,
  });
  if (error) {
    redirect("/dashboard/documents?error=" + encodeURIComponent(error.message));
  }
  revalidatePath("/dashboard/documents");
  redirect("/dashboard/documents?ok=added");
}

export async function deleteDocument(formData: FormData) {
  const id = formData.get("id") as string | null;
  if (!id) return;
  const supabase = await createClient();
  // RLS (company_documents_all_own) scopes the delete to the caller's tenant.
  await supabase.from("company_documents").delete().eq("id", id);
  revalidatePath("/dashboard/documents");
  redirect("/dashboard/documents?ok=deleted");
}
