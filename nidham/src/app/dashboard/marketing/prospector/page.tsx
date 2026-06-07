// ============================================================================
// /dashboard/marketing/prospector — Growth tool (find → import → reach → export)
// ============================================================================
//
// One integrated surface that does the parts of "Bot X" a cloud app CAN do:
//   1) Find real businesses on Google Maps (Places API) and import them as
//      leads (customers rows → existing Leads CRM + Pipeline).
//   2) Generate WhatsApp opener messages with AI ({name} merge tag).
//   3) Export a Bot-X-ready WhatsApp CSV.
// The actual WhatsApp sending stays in Bot X (a cloud serverless app can't
// hold a WhatsApp Web session). Enterprise-gated like the rest of the Studio.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/permissions";
import { canUseFeature } from "@/lib/subscriptions-server";
import { UpgradeRequired } from "@/components/upgrade-required";
import { ProspectorClient } from "./prospector-client";

export const dynamic = "force-dynamic";

export default async function ProspectorPage() {
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

  // Quick stats — how many prospects we've pulled + how many are fresh.
  const [{ count: mapsCount }, { count: leadCount }] = await Promise.all([
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("source", "google_maps"),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "lead"),
  ]);

  return (
    <main className="flex-1 px-4 md:px-6 py-6 bg-gradient-to-b from-slate-50 via-white to-cyan-50/20 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/dashboard/marketing"
            className="text-sm text-slate-500 hover:text-brand-cyan-dark font-cairo"
          >
            ← استوديو التسويق
          </Link>
          <Link
            href="/dashboard/marketing/leads"
            className="text-sm text-violet-600 hover:text-violet-800 font-cairo font-bold"
          >
            📥 Leads Inbox
          </Link>
        </div>

        <header className="mb-6">
          <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-cyan-100 to-violet-100 border border-cyan-300 text-cyan-800 text-xs font-bold mb-2 font-cairo">
            🚀 Growth · الباحث والتواصل
          </div>
          <h1 className="text-3xl font-black font-cairo text-slate-800 mb-1">
            ماكينة العملاء
          </h1>
          <p className="text-sm text-slate-500 font-cairo leading-relaxed max-w-2xl">
            دوّر على عملاء حقيقيين على جوجل ماب، استوردهم كـ Leads، ولّد رسائل واتساب
            بالـ AI، وصدّرهم جاهزين لبوت اكس عشان تبعت. <strong>الإرسال نفسه بيتم من بوت اكس.</strong>
          </p>
        </header>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white border-2 border-cyan-100 rounded-2xl p-4">
            <div className="text-2xl font-black text-cyan-700 font-cairo">{mapsCount ?? 0}</div>
            <div className="text-xs text-slate-500 font-cairo">عملاء من جوجل ماب</div>
          </div>
          <div className="bg-white border-2 border-violet-100 rounded-2xl p-4">
            <div className="text-2xl font-black text-violet-700 font-cairo">{leadCount ?? 0}</div>
            <div className="text-xs text-slate-500 font-cairo">Leads جديدة لسه ما اتكلمناش معاها</div>
          </div>
        </div>

        <ProspectorClient />
      </div>
    </main>
  );
}
