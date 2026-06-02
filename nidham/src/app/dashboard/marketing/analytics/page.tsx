// ============================================================================
// /dashboard/marketing/analytics — Sources & Funnel Analytics
// ============================================================================
//
// Answers the questions the user said matter most:
//   - من فين العملاء بييجوا؟ (Source breakdown)
//   - أي حملة بتجيب جودة عالية؟ (Campaign ROI)
//   - أي landing page بتحوّل أحسن؟ (Page leaderboard)
//   - الـ funnel كامل: visits → engaged → leads → contacted → won
//
// Uses Suspense streaming so each section renders independently — the KPI
// cards don't wait for the landing-pages leaderboard, and vice versa.
// React.cache() deduplicates the DB calls when multiple sections need
// the same data.
//
// Aggregations are done in JS rather than Postgres window functions
// because the data volume is small per tenant and it keeps the dependency
// on Supabase's filter language minimal.

import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/permissions";
import { canUseFeature } from "@/lib/subscriptions-server";
import { UpgradeRequired } from "@/components/upgrade-required";

type LeadEventRow = {
  id: string;
  event_type: string;
  utm_source: string | null;
  utm_campaign: string | null;
  landing_page_id: string | null;
  customer_id: string | null;
  session_id: string | null;
  occurred_at: string;
};

type CustomerRow = {
  id: string;
  status: string;
  estimated_value: number | null;
  source: string | null;
  first_utm_source: string | null;
  first_utm_medium: string | null;
  first_utm_campaign: string | null;
  landing_page_id: string | null;
  converted_at: string | null;
  created_at: string;
};

type LPRow = {
  id: string;
  name: string;
  slug: string;
  views_count: number;
  conversions_count: number;
};

const fetchAnalyticsData = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  if (!(await canUseFeature("marketing_studio"))) return null;

  const { profile } = await getMyProfile();
  const callerCompanyId = profile?.company_id ?? "";

  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const [eventsRes, customersRes, pagesRes] = await Promise.all([
    supabase
      .from("lead_events")
      .select("id, event_type, utm_source, utm_campaign, landing_page_id, customer_id, session_id, occurred_at")
      .eq("company_id", callerCompanyId)
      .gte("occurred_at", since)
      .order("occurred_at", { ascending: false })
      .limit(5000)
      .returns<LeadEventRow[]>(),
    supabase
      .from("customers")
      .select("id, status, estimated_value, source, first_utm_source, first_utm_medium, first_utm_campaign, landing_page_id, converted_at, created_at")
      .eq("company_id", callerCompanyId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(2000)
      .returns<CustomerRow[]>(),
    supabase
      .from("landing_pages")
      .select("id, name, slug, views_count, conversions_count")
      .eq("company_id", callerCompanyId)
      .order("conversions_count", { ascending: false })
      .returns<LPRow[]>(),
  ]);

  return { eventsRes, customersRes, pagesRes, callerCompanyId };
});

// ── Auth guard wrapper ──
export default async function MarketingAnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await canUseFeature("marketing_studio"))) {
    return <UpgradeRequired feature="marketing_studio" />;
  }

  return (
    <main className="flex-1 px-4 md:px-6 py-6 bg-gradient-to-b from-slate-50 via-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <Link href="/dashboard/marketing/leads" className="text-sm text-slate-500 hover:text-brand-cyan-dark font-cairo">
            ← Leads Inbox
          </Link>
        </div>
        <header className="mb-6">
          <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-300 text-emerald-800 text-xs font-bold mb-2 font-cairo">
            📊 Analytics
          </div>
          <h1 className="text-3xl font-black font-cairo text-slate-800 mb-1">
            تحليل الأداء والمصادر
          </h1>
          <Suspense fallback={<p className="text-sm text-slate-400 font-cairo">جاري التحميل...</p>}>
            <HeaderStats />
          </Suspense>
        </header>

        <Suspense fallback={<TableMissingSkeleton />}>
          <TableMissingCheck />
        </Suspense>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Suspense fallback={<KpiSkeleton />}>
            <RevenueKPI />
          </Suspense>
          <Suspense fallback={<KpiSkeleton />}>
            <WonCountKPI />
          </Suspense>
          <Suspense fallback={<KpiSkeleton />}>
            <AvgDealKPI />
          </Suspense>
          <Suspense fallback={<KpiSkeleton />}>
            <ConversionKPI />
          </Suspense>
        </div>

        <div className="mb-6 bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-sm font-black text-slate-700 mb-4 font-cairo">🌀 Funnel — الرحلة الكاملة</h2>
          <Suspense fallback={<FunnelSkeleton />}>
            <FunnelSection />
          </Suspense>
        </div>

        <div className="mb-6 bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-sm font-black text-slate-700 mb-4 font-cairo">📡 المصادر — منين بييجي العملاء؟</h2>
          <Suspense fallback={<TableSkeleton />}>
            <SourceSection />
          </Suspense>
        </div>

        <div className="mb-6 bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-sm font-black text-slate-700 mb-4 font-cairo">📢 الحملات — أي حملة بتجيب أحسن نتايج؟</h2>
          <Suspense fallback={<TableSkeleton />}>
            <CampaignSection />
          </Suspense>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-sm font-black text-slate-700 mb-4 font-cairo">🏠 صفحات الهبوط — Conversion Leaderboard</h2>
          <Suspense fallback={<TableSkeleton />}>
            <LandingPagesSection />
          </Suspense>
        </div>

        <Suspense fallback={null}>
          <LostAnalysisSection />
        </Suspense>
      </div>
    </main>
  );
}

// ── Header Stats ──
async function HeaderStats() {
  const data = await fetchAnalyticsData();
  if (!data) return null;
  const events = data.eventsRes.data ?? [];
  const customers = data.customersRes.data ?? [];
  return (
    <p className="text-sm text-slate-500 font-cairo">
      آخر 90 يوم · {events.length.toLocaleString("ar-EG")} حدث · {customers.length} lead
    </p>
  );
}

// ── Table Missing Check ──
async function TableMissingCheck() {
  const data = await fetchAnalyticsData();
  if (!data) return null;
  if (
    !!data.eventsRes.error &&
    /relation .* does not exist|42P01|column .* does not exist|PGRST/i.test(
      data.eventsRes.error.message ?? "",
    )
  ) {
    return (
      <div className="mb-5 bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 font-cairo">
        <h3 className="font-black text-amber-900 mb-2">⚠ Migration 039 لسه ما اتطبّقتش</h3>
        <p className="text-sm text-amber-800">
          صفحة الـ Analytics محتاجة جداول landing_pages و lead_events. طبّق Migration 039 على Supabase.
        </p>
      </div>
    );
  }
  return null;
}

// ── KPI Sections ──
async function RevenueKPI() {
  const data = await fetchAnalyticsData();
  if (!data) return null;
  const customers = data.customersRes.data ?? [];
  const wonRevenue = customers.filter((c) => c.status === "won").reduce((sum, c) => sum + (Number(c.estimated_value) || 0), 0);
  return <KpiCard icon="💰" label="إيرادات محقّقة" value={`${wonRevenue.toLocaleString("ar-EG")} ج`} color="emerald" big />;
}

async function WonCountKPI() {
  const data = await fetchAnalyticsData();
  if (!data) return null;
  const wonCount = (data.customersRes.data ?? []).filter((c) => c.status === "won").length;
  return <KpiCard icon="🏆" label="عملاء جدد" value={wonCount.toString()} color="emerald" />;
}

async function AvgDealKPI() {
  const data = await fetchAnalyticsData();
  if (!data) return null;
  const customers = data.customersRes.data ?? [];
  const won = customers.filter((c) => c.status === "won");
  const avgDealSize = won.length > 0 ? won.reduce((sum, c) => sum + (Number(c.estimated_value) || 0), 0) / won.length : 0;
  return <KpiCard icon="💎" label="متوسط قيمة الصفقة" value={`${Math.round(avgDealSize).toLocaleString("ar-EG")} ج`} color="amber" />;
}

async function ConversionKPI() {
  const data = await fetchAnalyticsData();
  if (!data) return null;
  const events = data.eventsRes.data ?? [];
  const customers = data.customersRes.data ?? [];
  const visitSessions = new Set(events.filter((e) => e.event_type === "page_view").map((e) => e.session_id));
  const wonCount = customers.filter((c) => c.status === "won").length;
  return (
    <KpiCard
      icon="📊"
      label="معدل التحويل (visit→won)"
      value={visitSessions.size > 0 ? `${((wonCount / visitSessions.size) * 100).toFixed(1)}%` : "—"}
      color="violet"
    />
  );
}

// ── Funnel ──
async function FunnelSection() {
  const data = await fetchAnalyticsData();
  if (!data) return null;
  const events = data.eventsRes.data ?? [];
  const customers = data.customersRes.data ?? [];

  const visitSessions = new Set(events.filter((e) => e.event_type === "page_view").map((e) => e.session_id));
  const engagedSessions = new Set(events.filter((e) => e.event_type === "whatsapp_click" || e.event_type === "phone_click").map((e) => e.session_id));
  const leadsCount = customers.length;
  const contactedCount = customers.filter((c) => c.status !== "lead" && c.status !== "dormant").length;
  const wonCount = customers.filter((c) => c.status === "won").length;
  const lostCount = customers.filter((c) => c.status === "lost").length;

  const funnel = { visits: visitSessions.size, engaged: engagedSessions.size, leads: leadsCount, contacted: contactedCount, won: wonCount, lost: lostCount };

  return <FunnelChart funnel={funnel} />;
}

// ── Source Section ──
async function SourceSection() {
  const data = await fetchAnalyticsData();
  if (!data) return null;
  const customers = data.customersRes.data ?? [];

  type Bucket = { key: string; label: string; leads: number; contacted: number; won: number; revenue: number };
  const map = new Map<string, Bucket>();
  for (const c of customers) {
    const k = c.first_utm_source ?? c.source ?? "مباشر / مش معروف";
    const b = map.get(k) ?? { key: k, label: k, leads: 0, contacted: 0, won: 0, revenue: 0 };
    b.leads += 1;
    if (c.status !== "lead" && c.status !== "dormant") b.contacted += 1;
    if (c.status === "won") { b.won += 1; b.revenue += Number(c.estimated_value) || 0; }
    map.set(k, b);
  }
  const rows = Array.from(map.values()).sort((a, b) => b.leads - a.leads);

  if (rows.length === 0) return <EmptyHint>لسه مفيش leads — اعمل landing page وابدأ تشاركها.</EmptyHint>;
  return <BreakdownTable rows={rows} />;
}

// ── Campaign Section ──
async function CampaignSection() {
  const data = await fetchAnalyticsData();
  if (!data) return null;
  const customers = data.customersRes.data ?? [];

  type Bucket = { key: string; label: string; leads: number; contacted: number; won: number; revenue: number };
  const map = new Map<string, Bucket>();
  for (const c of customers) {
    const k = c.first_utm_campaign ?? "بدون حملة";
    const b = map.get(k) ?? { key: k, label: k, leads: 0, contacted: 0, won: 0, revenue: 0 };
    b.leads += 1;
    if (c.status !== "lead" && c.status !== "dormant") b.contacted += 1;
    if (c.status === "won") { b.won += 1; b.revenue += Number(c.estimated_value) || 0; }
    map.set(k, b);
  }
  const rows = Array.from(map.values()).sort((a, b) => b.leads - a.leads);

  if (rows.length === 0)
    return <EmptyHint>مفيش leads بـ utm_campaign لسه. ضيف <code>?utm_campaign=summer-2026</code> في links إعلاناتك.</EmptyHint>;
  return <BreakdownTable rows={rows} />;
}

// ── Landing Pages Section ──
async function LandingPagesSection() {
  const data = await fetchAnalyticsData();
  if (!data) return null;
  const customers = data.customersRes.data ?? [];
  const pages = data.pagesRes.data ?? [];

  const pageLeadCounts = new Map<string, { leads: number; won: number; revenue: number }>();
  for (const c of customers) {
    if (!c.landing_page_id) continue;
    const cur = pageLeadCounts.get(c.landing_page_id) ?? { leads: 0, won: 0, revenue: 0 };
    cur.leads += 1;
    if (c.status === "won") { cur.won += 1; cur.revenue += Number(c.estimated_value) || 0; }
    pageLeadCounts.set(c.landing_page_id, cur);
  }

  type PageStat = { id: string; name: string; slug: string; views: number; leads: number; won: number; revenue: number; cvr: number };
  const pageStats: PageStat[] = pages
    .map((p) => {
      const counts = pageLeadCounts.get(p.id) ?? { leads: 0, won: 0, revenue: 0 };
      const views = p.views_count ?? 0;
      const leads = Math.max(counts.leads, p.conversions_count ?? 0);
      return { id: p.id, name: p.name, slug: p.slug, views, leads, won: counts.won, revenue: counts.revenue, cvr: views > 0 ? (leads / views) * 100 : 0 };
    })
    .sort((a, b) => b.leads - a.leads);

  if (pageStats.length === 0) return <EmptyHint>مفيش landing pages لسه.</EmptyHint>;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm font-cairo min-w-[700px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <Th>الصفحة</Th><Th>زيارات</Th><Th>Leads</Th><Th>CVR%</Th><Th>عملاء</Th><Th>إيرادات</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageStats.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-3 py-3">
                  <Link href={`/dashboard/marketing/landing-pages/${p.id}`} className="font-bold text-slate-800 hover:text-cyan-700">{p.name}</Link>
                  <div className="text-[10px] text-slate-400 font-mono" dir="ltr">/p/{p.slug}</div>
                </td>
                <td className="px-3 py-3 font-mono text-xs" dir="ltr">{p.views.toLocaleString("en-US")}</td>
                <td className="px-3 py-3 font-mono text-xs" dir="ltr">{p.leads.toLocaleString("en-US")}</td>
                <td className="px-3 py-3">
                  <span className={`font-bold ${p.cvr >= 5 ? "text-emerald-700" : p.cvr >= 2 ? "text-amber-700" : "text-slate-500"}`}>{p.cvr.toFixed(1)}%</span>
                </td>
                <td className="px-3 py-3 font-mono text-xs" dir="ltr">{p.won}</td>
                <td className="px-3 py-3 font-bold text-emerald-700">{p.revenue > 0 ? `${p.revenue.toLocaleString("ar-EG")} ج` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-slate-400 font-cairo mt-3">💡 الزيارات بتيجي من event &quot;page_view&quot; — Leads = اللي سيبوا بياناتهم. CVR = leads ÷ visits.</p>
    </>
  );
}

// ── Lost Analysis ──
async function LostAnalysisSection() {
  const data = await fetchAnalyticsData();
  if (!data) return null;
  const lostCount = (data.customersRes.data ?? []).filter((c) => c.status === "lost").length;
  if (lostCount === 0) return null;
  return (
    <section className="mt-6 bg-rose-50/50 border border-rose-200 rounded-2xl p-5">
      <h2 className="text-sm font-black text-rose-800 mb-2 font-cairo">❌ تحليل الـ Lost</h2>
      <p className="text-sm text-slate-700 font-cairo">
        فقدنا <strong className="text-rose-700">{lostCount}</strong> lead في الـ 90 يوم اللي فاتوا. روح Leads Inbox واستخدم filter &quot;ضايع&quot; لمراجعة الأسباب.
      </p>
      <Link href="/dashboard/marketing/leads?status=lost" className="inline-block mt-3 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold font-cairo">
        راجع الـ Lost leads →
      </Link>
    </section>
  );
}

// ----------------------------------------------------------------------------
// FunnelChart — horizontal stages with width = ratio to previous stage
// ----------------------------------------------------------------------------
function FunnelChart({
  funnel,
}: {
  funnel: {
    visits: number;
    engaged: number;
    leads: number;
    contacted: number;
    won: number;
    lost: number;
  };
}) {
  const stages = [
    { label: "👁 زيارات", value: funnel.visits, color: "bg-slate-400" },
    {
      label: "💬 ضغط CTA",
      value: funnel.engaged,
      color: "bg-cyan-500",
    },
    { label: "📝 Leads", value: funnel.leads, color: "bg-violet-500" },
    {
      label: "📞 اتواصل معاهم",
      value: funnel.contacted,
      color: "bg-amber-500",
    },
    { label: "🏆 عملاء", value: funnel.won, color: "bg-emerald-600" },
  ];

  const max = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div className="space-y-2">
      {stages.map((s, i) => {
        const widthPct = (s.value / max) * 100;
        const prevValue = i > 0 ? stages[i - 1].value : 0;
        const conversionFromPrev =
          prevValue > 0 ? (s.value / prevValue) * 100 : null;
        return (
          <div key={s.label}>
            <div className="flex items-center justify-between text-xs font-cairo mb-1">
              <span className="font-bold text-slate-700">{s.label}</span>
              <span className="font-mono text-slate-600">
                {s.value.toLocaleString("en-US")}
                {conversionFromPrev !== null && (
                  <span className="text-[10px] text-slate-400 mr-2">
                    ({conversionFromPrev.toFixed(1)}% من السابق)
                  </span>
                )}
              </span>
            </div>
            <div className="h-7 bg-slate-100 rounded-lg overflow-hidden">
              <div
                className={`h-full ${s.color} transition-all`}
                style={{ width: `${Math.max(widthPct, 2)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ----------------------------------------------------------------------------
// BreakdownTable — generic source/campaign rollup
// ----------------------------------------------------------------------------
function BreakdownTable({
  rows,
}: {
  rows: {
    key: string;
    label: string;
    leads: number;
    contacted: number;
    won: number;
    revenue: number;
  }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-right text-sm font-cairo min-w-[600px]">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <Th>المصدر</Th>
            <Th>Leads</Th>
            <Th>اتواصل</Th>
            <Th>عملاء</Th>
            <Th>إيرادات</Th>
            <Th>Win Rate</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => {
            const winRate = r.leads > 0 ? (r.won / r.leads) * 100 : 0;
            return (
              <tr key={r.key} className="hover:bg-slate-50">
                <td className="px-3 py-3 font-bold text-slate-800">
                  {r.label}
                </td>
                <td className="px-3 py-3 font-mono" dir="ltr">
                  {r.leads}
                </td>
                <td className="px-3 py-3 font-mono text-amber-700" dir="ltr">
                  {r.contacted}
                </td>
                <td className="px-3 py-3 font-mono text-emerald-700 font-bold" dir="ltr">
                  {r.won}
                </td>
                <td className="px-3 py-3 font-bold text-emerald-700">
                  {r.revenue > 0
                    ? `${r.revenue.toLocaleString("ar-EG")} ج`
                    : "—"}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`font-bold ${winRate >= 20 ? "text-emerald-700" : winRate >= 5 ? "text-amber-700" : "text-slate-500"}`}
                  >
                    {winRate.toFixed(0)}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  color,
  big,
}: {
  icon: string;
  label: string;
  value: string;
  color: "emerald" | "amber" | "violet";
  big?: boolean;
}) {
  const bg: Record<typeof color, string> = {
    emerald: "from-emerald-500 to-emerald-700 text-white",
    amber: "from-amber-50 to-white border-amber-200 text-slate-800",
    violet: "from-violet-50 to-white border-violet-200 text-slate-800",
  };
  return (
    <div
      className={`p-4 rounded-2xl bg-gradient-to-br ${bg[color]} border ${color !== "emerald" ? "border" : ""} shadow-sm`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xl">{icon}</span>
      </div>
      <div className={`${big ? "text-2xl" : "text-xl"} font-black font-display`}>
        {value}
      </div>
      <div className="text-[10px] opacity-80 font-cairo mt-1">{label}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
      {children}
    </th>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-slate-500 font-cairo text-center py-6">
      {children}
    </p>
  );
}

// ── Suspense Skeletons ──
function KpiSkeleton() {
  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-100 to-white border border-slate-200 shadow-sm animate-pulse">
      <div className="h-4 w-6 bg-slate-200 rounded mb-3" />
      <div className="h-7 w-16 bg-slate-200 rounded mb-1" />
      <div className="h-3 w-12 bg-slate-200 rounded" />
    </div>
  );
}

function FunnelSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[80, 60, 45, 30, 15].map((w, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-3 w-16 bg-slate-200 rounded" />
          <div className="h-6 bg-slate-200 rounded-lg flex-1" style={{ width: `${w}%` }} />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="flex gap-4">
        <div className="h-4 flex-1 bg-slate-200 rounded" />
        <div className="h-4 w-12 bg-slate-200 rounded" />
        <div className="h-4 w-12 bg-slate-200 rounded" />
        <div className="h-4 w-12 bg-slate-200 rounded" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4">
          <div className="h-4 flex-1 bg-slate-100 rounded" />
          <div className="h-4 w-12 bg-slate-100 rounded" />
          <div className="h-4 w-12 bg-slate-100 rounded" />
          <div className="h-4 w-12 bg-slate-100 rounded" />
        </div>
      ))}
    </div>
  );
}

function TableMissingSkeleton() {
  return null;
}
