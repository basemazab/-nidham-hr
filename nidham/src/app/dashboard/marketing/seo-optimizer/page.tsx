// ============================================================================
// /dashboard/marketing/seo-optimizer — native SEO content optimizer (Surfer-lite)
// ============================================================================
// Paste article + target keyword → AI score, on-page fixes, suggested title +
// meta + outline + missing subtopics. Pure AI (Groq→Gemini), Enterprise-gated.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canUseFeature } from "@/lib/subscriptions-server";
import { UpgradeRequired } from "@/components/upgrade-required";
import { SeoOptimizerClient } from "./seo-optimizer-client";

export const dynamic = "force-dynamic";

export default async function SeoOptimizerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!(await canUseFeature("marketing_studio"))) {
    return <UpgradeRequired feature="marketing_studio" />;
  }

  return (
    <main className="flex-1 px-4 md:px-6 py-6 bg-gradient-to-b from-slate-50 via-white to-sky-50/20 min-h-screen">
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
          <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-sky-100 to-cyan-100 border border-sky-300 text-sky-800 text-xs font-bold mb-2 font-cairo">
            🔍 محسّن محتوى SEO
          </div>
          <h1 className="text-3xl font-black font-cairo text-slate-800 mb-1">
            حسّن مقالك قبل ما تنشره
          </h1>
          <p className="text-sm text-slate-500 font-cairo leading-relaxed max-w-2xl">
            الزق مقالك + الكلمة المفتاحية، والنظام هيقيّمه، يطلّعلك مشاكل الـ SEO
            مع الحل، ويقترح عنوان + وصف ميتا + بنية + مواضيع ناقصة — كله بالعربي.
          </p>
        </header>

        <SeoOptimizerClient />
      </div>
    </main>
  );
}
