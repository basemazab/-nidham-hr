import Link from "next/link";
import { Suspense, cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/permissions";

export const dynamic = "force-dynamic";

type EmpRow = {
  id: string;
  full_name: string;
  status: string;
  department: string | null;
  hire_date: string | null;
  termination_date: string | null;
  basic_salary: number | null;
};

type AttRow = {
  employee_id: string;
  date: string;
  status: string;
  tardiness_minutes: number | null;
};

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function weekStart(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split("T")[0];
}

function arabicMonthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("ar-EG", { month: "short" });
}

const getEmployees = cache(async (companyId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("employees")
    .select("id, full_name, status, department, hire_date, termination_date, basic_salary")
    .eq("company_id", companyId)
    .returns<EmpRow[]>();
  return data ?? [];
});

const getAttendance = cache(async (companyId: string, since: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("attendance")
    .select("employee_id, date, status, tardiness_minutes")
    .eq("company_id", companyId)
    .gte("date", since)
    .returns<AttRow[]>();
  return data ?? [];
});

const getRetention = cache(async (companyId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("employee_retention_insights")
    .select("employee_id, insight_type, score, status")
    .eq("company_id", companyId)
    .eq("insight_type", "flight_risk")
    .eq("status", "pending")
    .order("score", { ascending: false })
    .limit(5)
    .returns<Array<{ employee_id: string; score: number; status: string }>>();
  return data ?? [];
});

async function HeadcountSnapshot({ companyId }: { companyId: string }) {
  const employees = await getEmployees(companyId);
  let active = 0, terminated = 0, onLeave = 0;
  for (const e of employees) {
    if (e.status === "active") active++;
    else if (e.status === "terminated") terminated++;
    else if (e.status === "on_leave") onLeave++;
  }
  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <BigStat label="إجمالي الموظفين" value={employees.length} tone="cyan" emoji="👥" />
      <BigStat label="نشطين" value={active} tone="emerald" emoji="✓" />
      <BigStat label="في إجازة" value={onLeave} tone="amber" emoji="🏖" />
      <BigStat label="منتهية خدمتهم" value={terminated} tone="slate" emoji="🚪" />
    </section>
  );
}

async function HeadcountTrend({ companyId, today }: { companyId: string; today: Date }) {
  const employees = await getEmployees(companyId);
  const yearAgoIso = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
    .toISOString().split("T")[0];

  const monthsTrend = new Map<string, { hires: number; terms: number }>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    monthsTrend.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, { hires: 0, terms: 0 });
  }
  for (const e of employees) {
    if (e.hire_date && e.hire_date >= yearAgoIso) {
      const cur = monthsTrend.get(monthKey(e.hire_date));
      if (cur) cur.hires += 1;
    }
    if (e.termination_date && e.termination_date >= yearAgoIso) {
      const cur = monthsTrend.get(monthKey(e.termination_date));
      if (cur) cur.terms += 1;
    }
  }
  const trendArray = Array.from(monthsTrend.entries()).map(([k, v]) => ({
    month: k, label: arabicMonthLabel(k), hires: v.hires, terms: v.terms, net: v.hires - v.terms,
  }));
  const trendMax = Math.max(1, ...trendArray.flatMap((t) => [t.hires, t.terms]));

  return (
    <ChartCard title="📈 الهيكل البشري — آخر 12 شهر" subtitle="تعيينات (أخضر) vs إنهاءات (وردي)">
      <div className="space-y-1">
        {trendArray.map((t) => (
          <div key={t.month} className="flex items-center gap-2 text-xs font-cairo">
            <span className="w-10 text-slate-500 shrink-0">{t.label}</span>
            <div className="flex-1 grid grid-cols-2 gap-px">
              <div className="flex justify-end items-center gap-1">
                {t.hires > 0 && <span className="text-emerald-700 font-bold tabular-nums">{t.hires}</span>}
                <div className="h-3 bg-emerald-400 rounded-l-sm" style={{ width: `${(t.hires / trendMax) * 100}%` }} />
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 bg-rose-400 rounded-r-sm" style={{ width: `${(t.terms / trendMax) * 100}%` }} />
                {t.terms > 0 && <span className="text-rose-700 font-bold tabular-nums">{t.terms}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

async function TardinessChart({ companyId, twelveWeeksAgoIso }: { companyId: string; twelveWeeksAgoIso: string }) {
  const attendance = await getAttendance(companyId, twelveWeeksAgoIso);
  const weeksMap = new Map<string, { late: number; total: number }>();
  for (const a of attendance) {
    if (a.status !== "present") continue;
    const wk = weekStart(a.date);
    const cur = weeksMap.get(wk) ?? { late: 0, total: 0 };
    cur.total += 1;
    if ((a.tardiness_minutes ?? 0) > 0) cur.late += 1;
    weeksMap.set(wk, cur);
  }
  const weeks = Array.from(weeksMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([wk, v]) => ({ week: wk, late: v.late, total: v.total, pct: v.total > 0 ? Math.round((v.late / v.total) * 100) : 0 }))
    .slice(-12);
  const weeksMax = Math.max(1, ...weeks.map((w) => w.late));

  return (
    <ChartCard title="⏰ نمط التأخير — آخر 12 أسبوع" subtitle="عدد حالات التأخير في كل أسبوع">
      {weeks.length === 0 ? (
        <div className="text-sm text-slate-500 font-cairo text-center py-8">مفيش حضور مسجّل بعد</div>
      ) : (
        <div className="space-y-1">
          {weeks.map((w) => (
            <div key={w.week} className="flex items-center gap-2 text-xs font-cairo">
              <span className="w-16 text-slate-500 font-mono shrink-0" dir="ltr">{w.week.slice(5)}</span>
              <div className="flex-1 flex items-center gap-1.5">
                <div className="h-3 bg-amber-400 rounded" style={{ width: `${(w.late / weeksMax) * 100}%`, minWidth: "2px" }} />
                <span className="text-amber-700 font-bold tabular-nums">{w.late}</span>
                <span className="text-slate-400 tabular-nums">/ {w.total} ({w.pct}%)</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}

async function DeptBreakdown({ companyId }: { companyId: string }) {
  const employees = await getEmployees(companyId);
  const deptCounts = new Map<string, number>();
  for (const e of employees) {
    if (e.status !== "active") continue;
    const k = e.department?.trim() || "(بدون قسم)";
    deptCounts.set(k, (deptCounts.get(k) ?? 0) + 1);
  }
  const deptArray = Array.from(deptCounts.entries())
    .map(([dept, count]) => ({ dept, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const deptMax = Math.max(1, ...deptArray.map((d) => d.count));

  return (
    <ChartCard title="🏢 التوزيع حسب القسم" subtitle="أكتر 10 أقسام">
      {deptArray.length === 0 ? (
        <div className="text-sm text-slate-500 font-cairo text-center py-8">ضيف أقسام للموظفين علشان تشوف التوزيع</div>
      ) : (
        <div className="space-y-1.5">
          {deptArray.map((d) => (
            <div key={d.dept} className="flex items-center gap-2 text-xs font-cairo">
              <span className="w-28 text-slate-700 truncate shrink-0">{d.dept}</span>
              <div className="flex-1 flex items-center gap-1.5">
                <div className="h-3 bg-cyan-400 rounded" style={{ width: `${(d.count / deptMax) * 100}%`, minWidth: "2px" }} />
                <span className="text-cyan-700 font-bold tabular-nums">{d.count}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}

async function SalaryTierChart({ companyId }: { companyId: string }) {
  const employees = await getEmployees(companyId);
  const salaryTiers = [
    { label: "أقل من 5,000", min: 0, max: 5000, count: 0 },
    { label: "5,000-10,000", min: 5000, max: 10000, count: 0 },
    { label: "10,000-20,000", min: 10000, max: 20000, count: 0 },
    { label: "20,000-50,000", min: 20000, max: 50000, count: 0 },
    { label: "50,000+", min: 50000, max: Infinity, count: 0 },
  ];
  for (const e of employees) {
    if (e.status !== "active") continue;
    const sal = Number(e.basic_salary ?? 0);
    const tier = salaryTiers.find((t) => sal >= t.min && sal < t.max);
    if (tier) tier.count += 1;
  }
  const salaryMax = Math.max(1, ...salaryTiers.map((s) => s.count));

  return (
    <ChartCard title="💰 توزيع المرتبات" subtitle="عدد الموظفين في كل شريحة (ج.م)">
      <div className="space-y-1.5">
        {salaryTiers.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs font-cairo">
            <span className="w-28 text-slate-700 shrink-0 font-mono" dir="ltr">{s.label}</span>
            <div className="flex-1 flex items-center gap-1.5">
              <div className="h-3 bg-violet-400 rounded" style={{ width: `${(s.count / salaryMax) * 100}%`, minWidth: "2px" }} />
              <span className="text-violet-700 font-bold tabular-nums">{s.count}</span>
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

async function RetentionRisks({ companyId }: { companyId: string }) {
  const [employees, flightRisks] = await Promise.all([
    getEmployees(companyId),
    getRetention(companyId),
  ]);
  const empNameMap = new Map<string, string>();
  for (const e of employees) empNameMap.set(e.id, e.full_name);
  const riskList = flightRisks.map((r) => ({
    employeeId: r.employee_id,
    name: empNameMap.get(r.employee_id) ?? "—",
    score: r.score,
  }));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-800 font-cairo">⚠ موظفين معرّضين للاستقالة</h3>
        <Link href="/dashboard/retention" className="text-xs text-rose-700 font-bold font-cairo hover:underline">التفاصيل ←</Link>
      </div>
      {riskList.length === 0 ? (
        <div className="text-sm text-slate-500 font-cairo text-center py-6">✓ مفيش حد معرّض دلوقتي — كل الإشارات إيجابية</div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {riskList.map((r, i) => (
            <li key={r.employeeId} className="py-2 flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center font-cairo">{i + 1}</span>
              <span className="flex-1 font-cairo text-slate-800 font-medium">{r.name}</span>
              <span className="text-xs font-bold text-rose-700 font-cairo">خطر {Math.round(r.score)}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

async function TopPerformers({ companyId, monthStart }: { companyId: string; monthStart: string }) {
  const [employees, attendance] = await Promise.all([
    getEmployees(companyId),
    getAttendance(companyId, monthStart),
  ]);
  const empStats = new Map<string, { present: number; absent: number; lateTimes: number }>();
  for (const a of attendance) {
    const cur = empStats.get(a.employee_id) ?? { present: 0, absent: 0, lateTimes: 0 };
    if (a.status === "present") {
      cur.present += 1;
      if ((a.tardiness_minutes ?? 0) > 0) cur.lateTimes += 1;
    } else if (a.status === "absent") {
      cur.absent += 1;
    }
    empStats.set(a.employee_id, cur);
  }
  const performers = [];
  for (const e of employees) {
    if (e.status !== "active") continue;
    const s = empStats.get(e.id) ?? { present: 0, absent: 0, lateTimes: 0 };
    if (s.present >= 5 && s.absent === 0 && s.lateTimes === 0) {
      performers.push({ ...e, ...s });
    }
  }
  performers.sort((a, b) => b.present - a.present);
  const top = performers.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <h3 className="font-bold text-slate-800 font-cairo mb-3">🌟 الأفضل أداءً الشهر ده</h3>
      {top.length === 0 ? (
        <div className="text-sm text-slate-500 font-cairo text-center py-6">لسه مفيش بيانات حضور كافية للشهر ده</div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {top.map((p, i) => (
            <li key={p.id} className="py-2 flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center font-cairo">{i + 1}</span>
              <div className="flex-1">
                <div className="font-cairo text-slate-800 font-medium">{p.full_name}</div>
                {p.department && <div className="text-[10px] text-slate-500 font-cairo">{p.department}</div>}
              </div>
              <div className="text-xs text-emerald-700 font-bold font-cairo">✓ {p.present} يوم</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { profile } = await getMyProfile();
  const companyId = profile?.company_id ?? "";

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 7 * 12);
  const twelveWeeksAgoIso = twelveWeeksAgo.toISOString().split("T")[0];

  return (
    <main className="flex-1 px-6 py-8 bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-brand-cyan-dark font-cairo">
            ← الرجوع للـ Dashboard
          </Link>
        </div>

        <header className="mb-6">
          <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-violet-50 to-cyan-50 border border-violet-200 text-violet-700 text-xs font-bold mb-2 font-cairo">
            📊 تحليلات متقدمة
          </div>
          <h1 className="text-3xl font-black font-cairo text-slate-800 mb-1">لوحة التحليلات</h1>
          <p className="text-sm text-slate-500 font-cairo leading-relaxed max-w-2xl">
            صورة شاملة لصحة فريق شركتك — من تطور العدد إلى أنماط الحضور وتوزيع المرتبات.
          </p>
        </header>

        <Suspense fallback={<SkeletonGrid />}>
          <HeadcountSnapshot companyId={companyId} />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Suspense fallback={<SkeletonCard />}>
            <HeadcountTrend companyId={companyId} today={today} />
          </Suspense>
          <Suspense fallback={<SkeletonCard />}>
            <TardinessChart companyId={companyId} twelveWeeksAgoIso={twelveWeeksAgoIso} />
          </Suspense>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Suspense fallback={<SkeletonCard />}>
            <DeptBreakdown companyId={companyId} />
          </Suspense>
          <Suspense fallback={<SkeletonCard />}>
            <SalaryTierChart companyId={companyId} />
          </Suspense>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Suspense fallback={<SkeletonCard />}>
            <RetentionRisks companyId={companyId} />
          </Suspense>
          <Suspense fallback={<SkeletonCard />}>
            <TopPerformers companyId={companyId} monthStart={monthStart} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

function SkeletonGrid() {
  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-4 rounded-2xl border-2 border-slate-100 bg-white animate-pulse">
          <div className="h-3 w-16 bg-slate-200 rounded mb-3" />
          <div className="h-8 w-12 bg-slate-200 rounded" />
        </div>
      ))}
    </section>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 animate-pulse">
      <div className="h-4 w-40 bg-slate-200 rounded mb-3" />
      <div className="h-3 w-24 bg-slate-200 rounded mb-4" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-2 mb-2">
          <div className="h-3 w-8 bg-slate-200 rounded" />
          <div className="h-3 flex-1 bg-slate-200 rounded" />
        </div>
      ))}
    </div>
  );
}

function BigStat({ label, value, tone, emoji }: { label: string; value: number; tone: "cyan" | "emerald" | "amber" | "slate"; emoji: string }) {
  const palette: Record<typeof tone, string> = {
    cyan: "bg-cyan-50 border-cyan-200 text-cyan-900",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
    amber: "bg-amber-50 border-amber-200 text-amber-900",
    slate: "bg-slate-50 border-slate-200 text-slate-700",
  };
  return (
    <div className={`p-4 rounded-2xl border-2 ${palette[tone]} font-cairo`}>
      <div className="flex items-center gap-2 mb-1 opacity-70 text-xs font-bold">
        <span className="text-lg">{emoji}</span>
        <span>{label}</span>
      </div>
      <div className="text-3xl font-black font-display">{value.toLocaleString("ar-EG")}</div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="mb-3">
        <h3 className="font-bold text-slate-800 font-cairo">{title}</h3>
        {subtitle && <p className="text-[10px] text-slate-500 font-cairo">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
