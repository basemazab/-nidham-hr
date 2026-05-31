import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RetentionBanner } from "@/components/retention-banner";
import { SmartInsights } from "@/components/smart-insights";
import { PWAInstallButton } from "@/components/pwa-install-button";
import { NidhamAIDashboard } from "@/components/nidham-ai-dashboard";
import { loadNidhamAISignals } from "./nidham-ai-actions";

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

  const [employeesCount, customersCount, interactionsCount, aiSignals] = await Promise.all([
    supabase
      .from("employees")
      .select("id", { count: "exact", head: true })
      .eq("company_id", callerCompanyId),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("company_id", callerCompanyId),
    supabase
      .from("interactions")
      .select("id", { count: "exact", head: true })
      .eq("company_id", callerCompanyId),
    loadNidhamAISignals(),
  ]);

  const empCount = employeesCount.count ?? 0;
  const custCount = customersCount.count ?? 0;
  const intCount = interactionsCount.count ?? 0;

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

function FirstStepCard({
  num,
  emoji,
  title,
  href,
}: {
  num: string;
  emoji: string;
  title: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white/10 border border-white/20 p-4 rounded-2xl hover:bg-white/20 transition group"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-black">
          {num}
        </div>
        <span className="text-xl">{emoji}</span>
        <span className="font-bold font-cairo group-hover:underline">{title}</span>
      </div>
    </Link>
  );
}
