// ============================================================================
// /dashboard/marketing/ad-auditor — native Ad Auditor (Claude-Ads replacement)
// ============================================================================
// Paste an ad → AI scores it, lists issues with fixes, and writes improved
// Arabic variants. Pure AI (Groq→Gemini), Enterprise-gated.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canUseFeature } from "@/lib/subscriptions-server";
import { UpgradeRequired } from "@/components/upgrade-required";
import { AdAuditorClient } from "./ad-auditor-client";

export const dynamic = "force-dynamic";

export default async function AdAuditorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!(await canUseFeature("marketing_studio"))) {
    return <UpgradeRequired feature="marketing_studio" />;
  }

  return (
    <main className="flex-1 px-4 md:px-6 py-6 bg-gradient-to-b from-slate-50 via-white to-amber-50/20 min-h-screen">
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
          <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-300 text-amber-800 text-xs font-bold mb-2 font-cairo">
            🔍 مدقق الإعلانات
          </div>
          <h1 className="text-3xl font-black font-cairo text-slate-800 mb-1">
            دقّق إعلانك قبل ما تصرف عليه
          </h1>
          <p className="text-sm text-slate-500 font-cairo leading-relaxed max-w-2xl">
            الزق نص أي إعلان (فيسبوك/جوجل/تيك توك) والنظام هيقيّمه، يطلّعلك المشاكل
            بترتيب الخطورة مع الحل، ويكتبلك نسخ محسّنة جاهزة — كله بالعربي.
          </p>
        </header>

        <AdAuditorClient />
      </div>
    </main>
  );
}
