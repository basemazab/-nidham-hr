import Link from "next/link";
import { requireHRPage } from "@/lib/permissions";
import { PulseClient } from "./pulse-client";
import type { PulseBriefRow } from "./actions";

export const metadata = {
  title: "نبض نِظام | ذكاء HR",
};

export const dynamic = "force-dynamic";

export default async function PulsePage() {
  const { supabase, profile } = await requireHRPage();

  const todayIso = new Date().toISOString().split("T")[0];

  // Today's brief (if generated) + a small history strip for the trend.
  const { data: briefs } = await supabase
    .from("pulse_briefs")
    .select("id, brief_date, headline, health_score, items, stats, created_at")
    .eq("company_id", profile.company_id)
    .order("brief_date", { ascending: false })
    .limit(8)
    .returns<PulseBriefRow[]>();

  const todayBrief = (briefs ?? []).find((b) => b.brief_date === todayIso) ?? null;
  const history = (briefs ?? [])
    .filter((b) => b.brief_date !== todayIso)
    .slice(0, 7);

  return (
    <main className="flex-1 px-6 py-8 min-h-screen bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="max-w-4xl mx-auto">
        <nav className="text-xs text-slate-500 mb-4 font-cairo">
          <Link href="/dashboard" className="hover:text-brand-cyan-dark">الرئيسية</Link>
          <span className="mx-2">›</span>
          <span className="text-slate-700 dark:text-slate-300">نبض نِظام</span>
        </nav>

        <div className="mb-6">
          <h1 className="text-2xl font-black font-cairo text-slate-900 dark:text-slate-100">
            ⚡ نبض نِظام
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-cairo">
            مديرك التنفيذي الآلي: بيمسح شركتك كلها — حضور، إجازات، مرتبات،
            مستندات، عملاء، رسائل — ويطلعلك بريفينج يومي مرتب بالأولوية مع
            خطوة عملية لكل بند.
          </p>
        </div>

        <PulseClient initialBrief={todayBrief} history={history} />
      </div>
    </main>
  );
}
