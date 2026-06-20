import Link from "next/link";
import { requireAdmin } from "@/lib/permissions";
import { BrandingClient } from "./branding-client";

export const metadata = { title: "هوية الشركة | نِظام" };

export default async function BrandingPage() {
  const { supabase, profile } = await requireAdmin();

  const { data: company, error } = await supabase
    .from("companies")
    .select("name, logo_url")
    .eq("id", profile.company_id)
    .maybeSingle<{ name: string; logo_url: string | null }>();

  // logo_url column may not exist yet (migration 114 pending) — fall back to
  // the name so the page still shows the real company name.
  let companyName = company?.name ?? "شركتك";
  const initialLogo = company?.logo_url ?? null;
  if (error) {
    const { data: nameOnly } = await supabase
      .from("companies")
      .select("name")
      .eq("id", profile.company_id)
      .maybeSingle<{ name: string }>();
    if (nameOnly?.name) companyName = nameOnly.name;
  }

  return (
    <main className="flex-1 px-4 sm:px-6 py-8 bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-brand-cyan-dark font-cairo">
            ← الرجوع للوحة التحكم
          </Link>
        </div>
        <header className="mb-6">
          <h1 className="text-3xl font-black font-cairo text-slate-800 mb-1">🎨 هوية الشركة</h1>
          <p className="text-sm text-slate-500 font-cairo leading-relaxed">
            ارفع شعار شركتك — هيظهر تلقائيًا في ترويسة كل المستندات اللي بتطلّعها من النظام
            (المذكرات، المستندات الرسمية…) مع الحفاظ على هوية «نِظام» في الأسفل.
          </p>
        </header>

        <BrandingClient companyName={companyName} initialLogo={initialLogo} />
      </div>
    </main>
  );
}
