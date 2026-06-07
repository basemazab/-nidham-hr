// ============================================================================
// /dashboard/marketing/automations — Automation overview & performance
// ============================================================================
// Read-only dashboard that measures the whole automation suite: keyword rules,
// flows, broadcasts, sequences, and how inbox conversations were handled
// (keyword vs flow vs AI vs comment) + lead-quality split. Enterprise-gated.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/permissions";
import { canUseFeature } from "@/lib/subscriptions-server";
import { UpgradeRequired } from "@/components/upgrade-required";

export const dynamic = "force-dynamic";

type ConvRow = { ai_intent: string | null; ai_lead_quality: string | null };
type BroadcastRow = { sent: number; failed: number };

function bucketIntent(intent: string | null): string | null {
  if (!intent) return "بدون";
  if (intent === "keyword_rule") return "كلمات مفتاحية";
  if (intent === "flow") return "فلوهات";
  if (intent.startsWith("comment")) return "كومنتات";
  if (
    intent === "ai_not_enabled" ||
    intent === "channel_disabled" ||
    intent.startsWith("ai_error") ||
    intent.startsWith("send_failed") ||
    intent === "handoff_keyword"
  ) {
    return null; // not a successful automated reply
  }
  return "ردود AI";
}

export default async function AutomationsOverviewPage() {
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

  const [
    rulesCount,
    flowsCount,
    seqActive,
    enrollActive,
    enrollDone,
    broadcastsRes,
    convRes,
  ] = await Promise.all([
    supabase
      .from("marketing_auto_reply_rules")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("active", true),
    supabase
      .from("marketing_flows")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("active", true),
    supabase
      .from("marketing_sequences")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("active", true),
    supabase
      .from("marketing_sequence_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "active"),
    supabase
      .from("marketing_sequence_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "done"),
    supabase
      .from("marketing_broadcasts")
      .select("sent, failed")
      .eq("company_id", companyId)
      .limit(1000)
      .returns<BroadcastRow[]>(),
    supabase
      .from("marketing_inbox_conversations")
      .select("ai_intent, ai_lead_quality")
      .eq("company_id", companyId)
      .limit(5000)
      .returns<ConvRow[]>(),
  ]);

  const broadcastSent = (broadcastsRes.data ?? []).reduce((s, b) => s + (b.sent || 0), 0);
  const broadcastFailed = (broadcastsRes.data ?? []).reduce((s, b) => s + (b.failed || 0), 0);

  const convs = convRes.data ?? [];
  const intentBuckets = new Map<string, number>();
  const qualityBuckets = new Map<string, number>();
  for (const c of convs) {
    const b = bucketIntent(c.ai_intent);
    if (b) intentBuckets.set(b, (intentBuckets.get(b) ?? 0) + 1);
    const q = c.ai_lead_quality;
    if (q) qualityBuckets.set(q, (qualityBuckets.get(q) ?? 0) + 1);
  }
  const intentRows = Array.from(intentBuckets.entries()).sort((a, b) => b[1] - a[1]);
  const totalHandled = intentRows.reduce((s, [, n]) => s + n, 0);

  const QUALITY_LABELS: Record<string, { label: string; cls: string }> = {
    hot: { label: "🔥 ساخن", cls: "text-rose-600" },
    warm: { label: "🌤️ دافئ", cls: "text-amber-600" },
    cold: { label: "❄️ بارد", cls: "text-sky-600" },
    spam: { label: "🚫 سبام", cls: "text-slate-400" },
  };

  return (
    <main className="flex-1 px-4 md:px-6 py-6 bg-gradient-to-b from-slate-50 via-white to-violet-50/10 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Link href="/dashboard/marketing" className="text-sm text-slate-500 hover:text-brand-cyan-dark font-cairo">
            ← استوديو التسويق
          </Link>
        </div>

        <header className="mb-6">
          <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-violet-100 to-cyan-100 border border-violet-300 text-violet-800 text-xs font-bold mb-2 font-cairo">
            📊 أداء الأتمتة
          </div>
          <h1 className="text-3xl font-black font-cairo text-slate-800 mb-1">
            نظرة عامة على الأتمتة
          </h1>
          <p className="text-sm text-slate-500 font-cairo leading-relaxed max-w-2xl">
            كل أدوات الأتمتة وأداؤها في مكان واحد — القواعد، الفلوهات، البثّ،
            السلاسل، وإزاي اتعاملنا مع محادثات عملائك.
          </p>
        </header>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <KpiCard icon="🤖" value={rulesCount.count ?? 0} label="قواعد كلمات نشطة" href="/dashboard/marketing/inbox/settings" />
          <KpiCard icon="🔀" value={flowsCount.count ?? 0} label="فلوهات نشطة" href="/dashboard/marketing/flows" />
          <KpiCard icon="⏱️" value={seqActive.count ?? 0} label="سلاسل نشطة" href="/dashboard/marketing/sequences" />
          <KpiCard icon="📣" value={broadcastSent} label="رسائل بثّ مرسلة" href="/dashboard/marketing/broadcast" />
        </div>

        {/* How conversations were handled */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 mb-5">
          <h2 className="text-sm font-black text-slate-700 mb-4 font-cairo">
            🛠️ إزاي اتعاملنا مع المحادثات ({totalHandled})
          </h2>
          {intentRows.length === 0 ? (
            <p className="text-sm text-slate-400 font-cairo">لسه مفيش محادثات اتعامل معاها أوتوماتيك.</p>
          ) : (
            <div className="space-y-2">
              {intentRows.map(([label, n]) => {
                const pct = totalHandled > 0 ? (n / totalHandled) * 100 : 0;
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between text-xs font-cairo mb-1">
                      <span className="font-bold text-slate-700">{label}</span>
                      <span className="font-mono text-slate-500" dir="ltr">{n} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-6 bg-slate-100 rounded-lg overflow-hidden">
                      <div className="h-full bg-gradient-to-l from-violet-500 to-cyan-500" style={{ width: `${Math.max(pct, 2)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Lead quality + sequence/broadcast detail */}
        <div className="grid md:grid-cols-2 gap-5">
          <section className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-sm font-black text-slate-700 mb-3 font-cairo">⭐ جودة العملاء</h2>
            {qualityBuckets.size === 0 ? (
              <p className="text-sm text-slate-400 font-cairo">لسه مفيش تقييم.</p>
            ) : (
              <ul className="space-y-1.5">
                {["hot", "warm", "cold", "spam"].filter((q) => qualityBuckets.has(q)).map((q) => (
                  <li key={q} className="flex items-center justify-between text-sm font-cairo">
                    <span className={QUALITY_LABELS[q]?.cls ?? "text-slate-600"}>{QUALITY_LABELS[q]?.label ?? q}</span>
                    <span className="font-mono text-slate-600" dir="ltr">{qualityBuckets.get(q)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-sm font-black text-slate-700 mb-3 font-cairo">⏱️ السلاسل + 📣 البثّ</h2>
            <ul className="space-y-1.5 text-sm font-cairo text-slate-700">
              <li className="flex items-center justify-between"><span>مسجّلين نشطين في سلاسل</span><span className="font-mono" dir="ltr">{enrollActive.count ?? 0}</span></li>
              <li className="flex items-center justify-between"><span>أكملوا السلسلة</span><span className="font-mono text-emerald-700" dir="ltr">{enrollDone.count ?? 0}</span></li>
              <li className="flex items-center justify-between"><span>رسائل بثّ مرسلة</span><span className="font-mono text-emerald-700" dir="ltr">{broadcastSent}</span></li>
              <li className="flex items-center justify-between"><span>بثّ فشل (نافذة 24س)</span><span className="font-mono text-rose-600" dir="ltr">{broadcastFailed}</span></li>
            </ul>
          </section>
        </div>

        <p className="text-[11px] text-slate-400 font-cairo mt-5 leading-relaxed">
          💡 الأرقام دي بتعكس نشاط صفحتك المربوطة. لو لسه مفيش بيانات، اربط الصفحة من
          إعدادات الـ Inbox وابدأ تجمّع محادثات.
        </p>
      </div>
    </main>
  );
}

function KpiCard({ icon, value, label, href }: { icon: string; value: number; label: string; href: string }) {
  return (
    <Link href={href} className="block p-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-violet-300 hover:shadow-md transition">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-black text-slate-800 font-cairo">{value}</div>
      <div className="text-[11px] text-slate-500 font-cairo mt-0.5">{label}</div>
    </Link>
  );
}
