import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RetentionBanner } from "@/components/retention-banner";
import { SmartInsights } from "@/components/smart-insights";
import { PWAInstallButton } from "@/components/pwa-install-button";
import { NidhamAIDashboard } from "@/components/nidham-ai-dashboard";
import { loadNidhamAISignals } from "./nidham-ai-actions";
import {
  scanCompliance,
  type ComplianceEmployee,
  type LeaveBalanceRow,
} from "@/lib/compliance-shield";

type Profile = {
  full_name: string | null;
  role: string;
  companies: {
    name: string;
    industry: string | null;
  } | null;
};

export const dynamic = "force-dynamic";

type DashboardSearchParams = Promise<{ welcome?: string; plan?: string }>;

const PLAN_LABEL_AR: Record<string, string> = {
  free: "Free (5 موظفين)",
  starter: "Starter (25 موظف)",
  pro: "Pro (100 موظف)",
  business: "Business (500 موظف)",
  enterprise: "Enterprise",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: DashboardSearchParams;
}) {
  const { welcome, plan } = await searchParams;
  const isFirstVisit = welcome === "1";
  const intendedPlan = plan && PLAN_LABEL_AR[plan] ? plan : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, company_id, companies(name, industry)")
    .eq("id", user.id)
    .single<Profile & { company_id: string }>();

  const callerCompanyId = profile?.company_id ?? "";
  const complianceYear = new Date().getFullYear();

  const [employeesData, customersCount, interactionsCount, companyFlags, leaveBalances, aiSignals] =
    await Promise.all([
      // Full employee rows (compliance fields) — also gives us the headcount,
      // so we drop the separate count query. RLS scopes to the caller's tenant.
      supabase
        .from("employees")
        .select("id, full_name, status, hire_date, national_id, social_insurance_number, basic_salary")
        .eq("company_id", callerCompanyId)
        .returns<ComplianceEmployee[]>(),
      supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("company_id", callerCompanyId),
      supabase
        .from("interactions")
        .select("id", { count: "exact", head: true })
        .eq("company_id", callerCompanyId),
      supabase
        .from("companies")
        .select("social_insurance_enabled, income_tax_enabled")
        .eq("id", callerCompanyId)
        .maybeSingle<{ social_insurance_enabled: boolean | null; income_tax_enabled: boolean | null }>(),
      supabase
        .from("leave_balances")
        .select("employee_id, entitled_days, used_days")
        .eq("company_id", callerCompanyId)
        .eq("year", complianceYear)
        .eq("leave_type", "annual")
        .returns<LeaveBalanceRow[]>(),
      loadNidhamAISignals(),
    ]);

  const employees = employeesData.data ?? [];
  const empCount = employees.length;
  const custCount = customersCount.count ?? 0;
  const intCount = interactionsCount.count ?? 0;

  // Compliance Shield scan — surfaced as a top banner so the owner sees their
  // fine exposure on every visit (the feature's retention hook).
  const shield = scanCompliance({
    employees,
    company: {
      social_insurance_enabled: companyFlags.data?.social_insurance_enabled ?? false,
      income_tax_enabled: companyFlags.data?.income_tax_enabled ?? false,
    },
    annualBalances: leaveBalances.data ?? [],
    today: new Date(),
  });

  const { data: subscription } = profile?.company_id
    ? await supabase
        .from("subscriptions")
        .select("plan, status, ends_at")
        .eq("company_id", profile.company_id)
        .maybeSingle<{ plan: string; status: string; ends_at: string }>()
    : { data: null };
  const subDaysLeft = subscription
    ? Math.round(
        (new Date(subscription.ends_at + "T00:00:00").getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;
  const subPlanLabel: Record<string, string> = {
    trial: "تجريبية",
    basic: "Basic",
    pro: "Pro",
    enterprise: "Enterprise",
  };

  const displayName = profile?.full_name ?? user.email?.split("@")[0] ?? "مستخدم";
  const companyName = profile?.companies?.name ?? "—";
  const roleLabel: Record<string, string> = {
    admin: "مدير",
    manager: "مشرف",
    employee: "موظف",
  };

  const onboardingDone = empCount > 0;
  const isEnterprise = subscription?.plan === "enterprise";

  return (
    <main className={`flex-1 px-6 py-8 min-h-screen ${
      isEnterprise
        ? "bg-gradient-to-b from-amber-50/40 via-white to-amber-50/20"
        : "bg-gradient-to-b from-slate-50 via-white to-cyan-50/30"
    }`}>
      <div className="max-w-6xl mx-auto">
        {isEnterprise && (
          <div className="bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 border-2 border-amber-300 rounded-2xl p-5 mb-6 flex items-center gap-4 shadow-lg shadow-amber-500/10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-2xl">👑</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] tracking-[0.3em] text-amber-700 font-bold uppercase font-cairo mb-0.5">
                Enterprise Account
              </div>
              <div className="text-lg font-black text-amber-900 font-cairo">
                مرحبًا بك في الباقة المميزة ✨
              </div>
              <div className="text-xs text-amber-800 font-cairo mt-0.5">
                كل الميزات مفتوحة · دعم متميز · Bridge Analytics · سجل النشاط
              </div>
            </div>
            <Link
              href="/dashboard/subscription"
              className="text-xs text-amber-800 hover:text-amber-900 hover:underline font-bold font-cairo whitespace-nowrap"
            >
              عرض التفاصيل ↗
            </Link>
          </div>
        )}

        {/* Welcome card */}
        <div className={`bg-white p-8 rounded-2xl shadow-xl mb-6 ${
          isEnterprise
            ? "border-2 border-amber-200"
            : "border border-slate-100"
        }`}>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-cyan to-brand-cyan-dark flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-black text-white">
                {displayName[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-black font-cairo mb-1 text-slate-800">
                أهلًا {displayName} 👋
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 mb-3">
                <span>
                  الشركة: <strong className="text-slate-700">{companyName}</strong>
                </span>
                <span>•</span>
                <span>
                  الصلاحية: <strong className="text-brand-cyan-dark">
                    {roleLabel[profile?.role ?? "admin"] ?? profile?.role}
                  </strong>
                </span>
              </div>
              <p className="inline-block text-brand-cyan-dark font-bold font-mono bg-cyan-50 px-3 py-1.5 rounded-lg text-xs">
                {user.email}
              </p>
              <div className="mt-3">
                <PWAInstallButton />
              </div>
            </div>

            {subscription && (
              <Link
                href="/dashboard/subscription"
                className={`flex flex-col items-center justify-center px-4 py-3 rounded-xl border-2 transition hover:-translate-y-0.5 ${
                  subscription.status === "trial"
                    ? subDaysLeft <= 3
                      ? "bg-red-50 border-red-300 hover:border-red-500"
                      : "bg-amber-50 border-amber-300 hover:border-amber-500"
                    : "bg-emerald-50 border-emerald-200 hover:border-emerald-400"
                }`}
              >
                <div className="text-[10px] text-slate-500 tracking-wider font-cairo">
                  💎 خطتك
                </div>
                <div className="text-lg font-black text-slate-800 font-cairo">
                  {subPlanLabel[subscription.plan] ?? subscription.plan}
                </div>
                <div
                  className={`text-xs font-bold font-cairo ${
                    subscription.status === "trial"
                      ? subDaysLeft <= 3
                        ? "text-red-600"
                        : "text-amber-700"
                      : "text-emerald-700"
                  }`}
                >
                  {subDaysLeft >= 0
                    ? `${subDaysLeft} يوم متبقي`
                    : `انتهت من ${Math.abs(subDaysLeft)} يوم`}
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Compliance Shield banner — the retention hook: fine exposure in the
            owner's face on every visit, one click from the full breakdown. */}
        <ComplianceShieldBanner
          riskCount={shield.risks.length}
          highCount={shield.highCount}
          exposureEGP={shield.exposureEGP}
        />

        {/* KPI cards — at-a-glance company metrics. These counts were fetched
            on every load but never rendered; now surfaced as the dashboard's
            top row, each linking to its module. */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard emoji="👥" label="إجمالي الموظفين" value={empCount} accent="cyan" href="/dashboard/employees" />
          <KpiCard emoji="🤝" label="العملاء" value={custCount} accent="emerald" href="/dashboard/customers" />
          <KpiCard emoji="💬" label="التفاعلات" value={intCount} accent="violet" href="/dashboard/interactions" />
          <KpiCard
            emoji="💎"
            label="أيام الباقة المتبقية"
            value={subscription ? Math.max(0, subDaysLeft) : 0}
            accent="amber"
            href="/dashboard/subscription"
          />
        </div>

        {/* Nidham AI Predictive Engine Section */}
        <section className="mb-8">
          <NidhamAIDashboard employees={aiSignals} />
        </section>

        {/* Smart Insights Section */}
        <SmartInsights companyId={callerCompanyId} />

        {/* Retention Banner */}
        <RetentionBanner />
      </div>
    </main>
  );
}

// Compliance Shield banner. Three states:
//   • risks with an EGP exposure → red, leads with the money number
//   • risks without a quantified fine → amber, leads with the count
//   • clean → subtle green "compliant" reassurance
// Always one click from the full /dashboard/compliance-shield breakdown.
function ComplianceShieldBanner({
  riskCount,
  highCount,
  exposureEGP,
}: {
  riskCount: number;
  highCount: number;
  exposureEGP: number;
}) {
  if (riskCount === 0) {
    return (
      <Link
        href="/dashboard/compliance-shield"
        className="flex items-center gap-3 mb-6 px-5 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 transition group"
      >
        <span className="text-xl">🛡️</span>
        <span className="flex-1 text-sm font-bold text-emerald-800 dark:text-emerald-300 font-cairo">
          درع الامتثال: شركتك ملتزمة — مفيش مخاطر مرصودة ✓
        </span>
        <span className="text-emerald-600 dark:text-emerald-400 text-sm group-hover:-translate-x-0.5 transition">←</span>
      </Link>
    );
  }

  const hasMoney = exposureEGP > 0;
  const tone = hasMoney || highCount > 0
    ? {
        wrap: "bg-rose-50 dark:bg-rose-900/20 border-rose-300 dark:border-rose-800 hover:border-rose-500",
        title: "text-rose-900 dark:text-rose-200",
        sub: "text-rose-700 dark:text-rose-300",
        arrow: "text-rose-600 dark:text-rose-400",
      }
    : {
        wrap: "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-800 hover:border-amber-500",
        title: "text-amber-900 dark:text-amber-200",
        sub: "text-amber-700 dark:text-amber-300",
        arrow: "text-amber-600 dark:text-amber-400",
      };

  return (
    <Link
      href="/dashboard/compliance-shield"
      className={`flex items-center gap-4 mb-6 px-5 py-4 rounded-2xl border-2 shadow-sm transition group ${tone.wrap}`}
    >
      <span className="text-3xl shrink-0">🛡️</span>
      <div className="flex-1 min-w-0">
        <div className={`font-black font-cairo ${tone.title}`}>
          درع الامتثال رصد {riskCount.toLocaleString("ar-EG")}{" "}
          {riskCount <= 10 ? "تنبيهات" : "تنبيه"} للمراجعة
        </div>
        <div className={`text-sm font-cairo ${tone.sub}`}>
          {hasMoney
            ? `تعرّض تقديري للغرامات ≈ ${exposureEGP.toLocaleString("ar-EG")} ج — اقفلها قبل ما تتحوّل لمخالفة.`
            : "بنود لازم تراجعها لحماية شركتك من المخالفات."}
        </div>
      </div>
      <span className={`shrink-0 text-sm font-bold font-cairo whitespace-nowrap ${tone.arrow}`}>
        راجع الآن ←
      </span>
    </Link>
  );
}

// At-a-glance metric card for the dashboard top row. RTL: the accent bar sits
// on the leading (right) edge. Tabular numerals keep the figures aligned.
function KpiCard({
  emoji,
  label,
  value,
  accent,
  href,
}: {
  emoji: string;
  label: string;
  value: number;
  accent: "cyan" | "emerald" | "violet" | "amber";
  href: string;
}) {
  const accentBar: Record<typeof accent, string> = {
    cyan: "border-r-brand-cyan",
    emerald: "border-r-emerald-500",
    violet: "border-r-violet-500",
    amber: "border-r-amber-500",
  };
  return (
    <Link
      href={href}
      className={`group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 border-r-4 ${accentBar[accent]} p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{emoji}</span>
        <span className="text-slate-300 dark:text-slate-600 group-hover:text-slate-400 transition">↗</span>
      </div>
      {/* Arabic numeral zero "٠" renders as a tiny dot in Cairo font and reads
          as a smudge. Show an em-dash placeholder when the metric is empty —
          clearer signal that there's intentionally nothing to count yet. */}
      <div className="text-3xl font-black text-slate-800 dark:text-slate-100 font-cairo tabular-nums">
        {value > 0 ? (
          value.toLocaleString("ar-EG")
        ) : (
          <span className="text-slate-300 dark:text-slate-600">—</span>
        )}
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-cairo mt-1">{label}</div>
    </Link>
  );
}
