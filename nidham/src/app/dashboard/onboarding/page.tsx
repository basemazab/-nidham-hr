import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/permissions";
import { formatDate, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

type EmployeeRow = {
  id: string;
  full_name: string;
  department: string | null;
  job_title: string | null;
  hire_date: string | null;
  created_at: string | null;
  status: string;
  termination_date: string | null;
  avatar_url: string | null;
};

function daysSince(dateStr: string): number {
  const then = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function OnboardingHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { profile } = await getMyProfile();
  const callerCompanyId = profile?.company_id ?? "";

  let list: EmployeeRow[] = [];
  try {
    const { data, error } = await supabase
      .from("employees")
      .select(
        "id, full_name, department, job_title, hire_date, created_at, status, termination_date, avatar_url",
      )
      .eq("company_id", callerCompanyId)
      .order("created_at", { ascending: false })
      .returns<EmployeeRow[]>();
    if (!error) list = data ?? [];
  } catch {
    // table may not exist
  }

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const recentHires = list.filter(
    (e) =>
      e.status === "active" &&
      e.created_at &&
      new Date(e.created_at) >= ninetyDaysAgo,
  );

  const terminated = list.filter(
    (e) => e.status === "terminated" || e.termination_date,
  );

  return (
    <main className="flex-1 px-4 md:px-6 py-6 bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <Link
            href="/dashboard"
            className="text-sm text-slate-500 hover:text-brand-cyan-dark font-cairo"
          >
            ← الرجوع للـ Dashboard
          </Link>
        </div>

        <header className="mb-6">
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold mb-2 font-cairo">
            🤝 الاستقبال والتسكين
          </div>
          <h1 className="text-3xl font-black font-cairo text-slate-800 mb-1">
            الاستقبال والتسكين
          </h1>
          <p className="text-sm text-slate-500 font-cairo">
            متابعة إجراءات استقبال الموظفين الجدد وإنهاء خدمات المغادرين
          </p>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <SummaryCard
            label="استقبال جديد"
            value={formatNumber(recentHires.length)}
            color="cyan"
          >
            <UserPlusIcon />
          </SummaryCard>
          <SummaryCard
            label="إنهاء خدمة"
            value={formatNumber(terminated.length)}
            color="rose"
          >
            <UserMinusIcon />
          </SummaryCard>
          <SummaryCard
            label="قيد الانتظار"
            value={formatNumber(
              recentHires.filter((e) => !e.hire_date).length,
            )}
            color="amber"
          >
            <ClockIcon />
          </SummaryCard>
          <SummaryCard
            label="إجمالي الموظفين"
            value={formatNumber(list.length)}
            color="slate"
          >
            <UsersIcon />
          </SummaryCard>
        </div>

        {list.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-16 text-center">
            <div className="text-6xl mb-4">🤝</div>
            <h2 className="text-xl font-bold font-cairo mb-2 text-slate-700">
              مفيش موظفين بعد
            </h2>
            <p className="text-slate-500 mb-6 font-cairo">
              ضيف موظفين الأول عشان تبدأ تشوف قائمة الاستقبال والتسكين
            </p>
            <Link
              href="/dashboard/employees/new"
              className="inline-block px-6 py-3 rounded-xl bg-brand-cyan-dark text-white font-bold hover:bg-brand-cyan transition font-cairo"
            >
              ضيف أول موظف
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Onboarding Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🌟</span>
                <h2 className="text-lg font-black font-cairo text-slate-800">
                  الاستقبال — الموظفون الجدد
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-bold font-cairo">
                  {recentHires.length}
                </span>
              </div>
              {recentHires.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                  <p className="text-slate-500 font-cairo text-sm">
                    لا يوجد موظفون جدد في آخر ٩٠ يوم
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentHires.map((emp) => {
                    const days = emp.created_at ? daysSince(emp.created_at) : 0;
                    return (
                      <EmployeeCard
                        key={emp.id}
                        emp={emp}
                        href={`/dashboard/onboarding/${emp.id}`}
                        badge={`منذ ${days} يوم`}
                        badgeColor="cyan"
                      />
                    );
                  })}
                </div>
              )}
            </section>

            {/* Offboarding Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🚪</span>
                <h2 className="text-lg font-black font-cairo text-slate-800">
                  التسكين — المغادرون
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold font-cairo">
                  {terminated.length}
                </span>
              </div>
              {terminated.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                  <p className="text-slate-500 font-cairo text-sm">
                    لا يوجد موظفون منتهية خدماتهم
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {terminated.map((emp) => (
                    <EmployeeCard
                      key={emp.id}
                      emp={emp}
                      href={`/dashboard/offboarding/${emp.id}`}
                      badge={
                        emp.termination_date
                          ? formatDate(emp.termination_date)
                          : "منتهي"
                      }
                      badgeColor="rose"
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  color,
  children,
}: {
  label: string;
  value: string;
  color: string;
  children: React.ReactNode;
}) {
  const border: Record<string, string> = {
    cyan: "border-cyan-200",
    rose: "border-rose-200",
    amber: "border-amber-200",
    slate: "border-slate-200",
  };
  const bg: Record<string, string> = {
    cyan: "from-cyan-50 to-white",
    rose: "from-rose-50 to-white",
    amber: "from-amber-50 to-white",
    slate: "from-slate-50 to-white",
  };
  return (
    <div
      className={`p-4 rounded-2xl bg-gradient-to-br ${bg[color] || bg.slate} border ${border[color] || border.slate} shadow-sm`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="w-8 h-8 text-slate-600">{children}</span>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-cairo">
          {label}
        </span>
      </div>
      <div className="text-2xl md:text-3xl font-black text-slate-800 font-cairo">
        {value}
      </div>
    </div>
  );
}

function EmployeeCard({
  emp,
  href,
  badge,
  badgeColor,
}: {
  emp: EmployeeRow;
  href: string;
  badge: string;
  badgeColor: string;
}) {
  const badgeCls: Record<string, string> = {
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return (
    <Link
      href={href}
      className="block bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-cyan to-brand-navy flex items-center justify-center text-white font-black font-cairo shrink-0">
          {emp.full_name?.charAt(0) ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-800 font-cairo text-sm truncate">
            {emp.full_name}
          </div>
          <div className="text-xs text-slate-500 font-cairo truncate">
            {emp.job_title ?? emp.department ?? "—"}
          </div>
        </div>
        <div
          className={`text-[10px] px-2 py-0.5 rounded-full border font-bold font-cairo whitespace-nowrap shrink-0 ${badgeCls[badgeColor] || badgeCls.cyan}`}
        >
          {badge}
        </div>
        <span className="text-slate-400 text-lg shrink-0">←</span>
      </div>
    </Link>
  );
}

// SVG Icon Components
function UserPlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}

function UserMinusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
