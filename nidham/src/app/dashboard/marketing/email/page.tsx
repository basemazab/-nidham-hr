// ============================================================================
// /dashboard/marketing/email — native Email Campaigns (write → list → send)
// ============================================================================
// AI writes a campaign about the TENANT's product, builds a recipient list
// from leads-with-email (import/export), and sends via Resend (RESEND_API_KEY)
// or exports a CSV for an external ESP. Enterprise-gated.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/permissions";
import { canUseFeature } from "@/lib/subscriptions-server";
import { UpgradeRequired } from "@/components/upgrade-required";
import { EmailClient } from "./email-client";

export const dynamic = "force-dynamic";

export default async function EmailCampaignsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!(await canUseFeature("marketing_studio"))) {
    return <UpgradeRequired feature="marketing_studio" />;
  }

  const { profile } = await getMyProfile();
  const companyId = profile?.company_id ?? "";

  // Auto-fill "your product" from the tenant's latest marketing project so the
  // campaign is about THEIR business, not the platform.
  const { data: proj } = await supabase
    .from("marketing_projects")
    .select("product_summary")
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ product_summary: string | null }>();
  const defaultBusiness = (proj?.product_summary ?? "").trim();

  return (
    <main className="flex-1 px-4 md:px-6 py-6 bg-gradient-to-b from-slate-50 via-white to-indigo-50/20 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <Link
            href="/dashboard/marketing"
            className="text-sm text-slate-500 hover:text-brand-cyan-dark font-cairo"
          >
            ← استوديو التسويق
          </Link>
        </div>

        <header className="mb-6">
          <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-indigo-100 to-violet-100 border border-indigo-300 text-indigo-800 text-xs font-bold mb-2 font-cairo">
            📧 حملات الإيميل
          </div>
          <h1 className="text-3xl font-black font-cairo text-slate-800 mb-1">
            اكتب حملة إيميل وابعتها لعملائك
          </h1>
          <p className="text-sm text-slate-500 font-cairo leading-relaxed max-w-2xl">
            الـ AI بيكتب الحملة عن منتجك، تبني قائمة من عملائك (استيراد/تصدير)،
            وتبعت من جوه النظام أو تصدّر لـ Brevo.
          </p>
        </header>

        <EmailClient defaultBusiness={defaultBusiness} />
      </div>
    </main>
  );
}
