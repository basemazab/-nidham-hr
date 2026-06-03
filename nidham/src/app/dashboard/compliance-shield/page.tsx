import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  scanCompliance,
  type ComplianceEmployee,
  type LeaveBalanceRow,
  type CompanyDocument,
  type Severity,
} from "@/lib/compliance-shield";

export const dynamic = "force-dynamic";

const GRADE_TEXT: Record<"emerald" | "cyan" | "amber" | "rose", string> = {
  emerald: "text-emerald-400",
  cyan: "text-cyan-300",
  amber: "text-amber-300",
  rose: "text-rose-400",
};

const SEV: Record<Severity, { ring: string; chip: string; label: string; dot: string }> = {
  high: { ring: "border-rose-200 dark:border-rose-900", chip: "bg-rose-100 text-rose-800 border-rose-300", label: "خطر عالٍ", dot: "bg-rose-500" },
  medium: { ring: "border-amber-200 dark:border-amber-900", chip: "bg-amber-100 text-amber-800 border-amber-300", label: "تنبيه", dot: "bg-amber-500" },
  low: { ring: "border-slate-200 dark:border-slate-800", chip: "bg-slate-100 text-slate-700 border-slate-300", label: "للمراجعة", dot: "bg-slate-400" },
};

export default async function ComplianceShieldPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single<{ company_id: string }>();
  const companyId = profile?.company_id ?? "";

  const year = new Date().getFullYear();

  const [companyRes, employeesRes, balancesRes, docsRes] = await Promise.all([
    supabase
      .from("companies")
      .select("social_insurance_enabled, income_tax_enabled")
      .eq("id", companyId)
      .maybeSingle<{ social_insurance_enabled: boolean | null; income_tax_enabled: boolean | null }>(),
    supabase
      .from("employees")
      .select("id, full_name, status, hire_date, national_id, social_insurance_number, basic_salary")
      .eq("company_id", companyId)
      .returns<ComplianceEmployee[]>(),
    supabase
      .from("leave_balances")
      .select("employee_id, entitled_days, used_days")
      .eq("company_id", companyId)
      .eq("year", year)
      .eq("leave_type", "annual")
      .returns<LeaveBalanceRow[]>(),
    supabase
      .from("company_documents")
      .select("name, expiry_date, reminder_days")
      .eq("company_id", companyId)
      .returns<CompanyDocument[]>(),
  ]);

  const result = scanCompliance({
    employees: employeesRes.data ?? [],
    company: {
      social_insurance_enabled: companyRes.data?.social_insurance_enabled ?? false,
      income_tax_enabled: companyRes.data?.income_tax_enabled ?? false,
    },
    annualBalances: balancesRes.data ?? [],
    documents: docsRes.data ?? [],
    today: new Date(),
  });

  const clean = result.risks.length === 0;

  return (
    <main className="flex-1 px-6 py-8 min-h-screen bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="max-w-4xl mx-auto">
        {/* Hero */}
        <div className="rounded-2xl p-8 mb-6 text-white shadow-xl bg-gradient-to-br from-slate-900 via-slate-800 to-brand-navy relative overflow-hidden">
          <div className="absolute top-0 left-0 text-[120px] opacity-10 leading-none -mt-4 -ml-2">🛡️</div>
          <div className="relative">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="text-[11px] tracking-[0.3em] text-cyan-300 font-bold uppercase mb-1 font-cairo">
                  Compliance Shield
                </div>
                <h1 className="text-2xl md:text-3xl font-black font-cairo">درع الامتثال الذكي</h1>
              </div>
              {/* Compliance index — the number owners track over time. */}
              <div className="text-center shrink-0">
                <div
                  className={`text-4xl md:text-5xl font-black tabular-nums leading-none ${
                    GRADE_TEXT[result.grade.tone]
                  }`}
                >
                  {result.score}
                  <span className="text-lg text-slate-400">/100</span>
                </div>
                <div className={`text-xs font-bold font-cairo mt-1 ${GRADE_TEXT[result.grade.tone]}`}>
                  مؤشر الامتثال · {result.grade.label}
                </div>
              </div>
            </div>
            {result.exposureEGP > 0 ? (
              <>
                <div className="text-sm text-slate-300 font-cairo mb-1">تعرّضك التقديري للغرامات لو اتجاهلت التنبيهات:</div>
                <div className="text-4xl md:text-5xl font-black text-rose-400 font-cairo tabular-nums">
                  {result.exposureEGP.toLocaleString("ar-EG")} ج
                </div>
              </>
            ) : (
              <div className="text-lg font-bold text-emerald-400 font-cairo">
                ✓ مفيش تعرّض مالي مباشر للغرامات حالياً
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-cairo">
              <span className="px-3 py-1 rounded-full bg-white/10">يراقب {result.monitoredCount} التزامات تلقائياً</span>
              {result.highCount > 0 && <span className="px-3 py-1 rounded-full bg-rose-500/30 text-rose-100">{result.highCount} خطر عالٍ</span>}
              {result.mediumCount > 0 && <span className="px-3 py-1 rounded-full bg-amber-500/30 text-amber-100">{result.mediumCount} تنبيه</span>}
              <Link
                href="/dashboard/compliance-shield/report"
                className="px-3 py-1 rounded-full bg-cyan-500 text-slate-900 font-bold hover:bg-cyan-400 transition"
              >
                🖨️ تقرير قابل للطباعة
              </Link>
            </div>
          </div>
        </div>

        {/* Risks */}
        {clean ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900 p-10 text-center shadow-sm">
            <div className="text-5xl mb-3">✅</div>
            <h2 className="text-xl font-black font-cairo text-emerald-800 dark:text-emerald-300 mb-1">
              شركتك ملتزمة — مفيش مخاطر مرصودة
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-cairo">
              الدرع بيراقب بياناتك تلقائياً وهينبّهك أول ما يظهر أي خطر.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {result.risks.map((r) => {
              const s = SEV[r.severity];
              return (
                <div
                  key={r.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border ${s.ring} p-5 shadow-sm flex items-start gap-4`}
                >
                  <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${s.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-black font-cairo text-slate-900 dark:text-slate-100">{r.title}</h3>
                      <span className={`text-[10px] font-bold font-cairo px-2 py-0.5 rounded-full border ${s.chip}`}>{s.label}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-cairo leading-relaxed mb-2">
                      {r.detail}
                    </p>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-xs text-slate-400 font-cairo">
                        📜 {r.legalRef}
                        {r.estFine ? (
                          <span className="text-rose-600 dark:text-rose-400 font-bold">
                            {"  ·  غرامة تقديرية ~"}
                            {r.estFine.toLocaleString("ar-EG")} ج
                          </span>
                        ) : null}
                      </span>
                      <Link
                        href={r.actionHref}
                        className="text-xs font-bold font-cairo text-brand-cyan-dark dark:text-brand-cyan hover:underline whitespace-nowrap"
                      >
                        {r.actionLabel} ←
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* What we monitor */}
        <div className="mt-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h2 className="font-black font-cairo text-slate-900 dark:text-slate-100 mb-3">
            الدرع بيراقب ده تلقائياً
          </h2>
          <div className="grid sm:grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-400 font-cairo">
            <div>🛡️ تسجيل التأمينات في المواعيد</div>
            <div>🛡️ اكتمال بيانات الموظفين الحكومية</div>
            <div>🛡️ مستحقات نهاية الخدمة للمفصولين</div>
            <div>🛡️ التزامات حجم الشركة (50+)</div>
            <div>🛡️ التزام رصيد الإجازات المتراكم</div>
            <div>🛡️ لائحة الجزاءات والسلامة المهنية</div>
            <div>🛡️ تواريخ انتهاء المستندات والتراخيص</div>
            <div>🛡️ انتهاء فترات الاختبار</div>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-cairo mt-4">
            الأرقام تقديرية للتنبيه والوقاية، ولا تُغني عن المراجعة القانونية. الدرع
            بيتحدّث تلقائياً مع كل تغيير في بيانات شركتك.
          </p>
        </div>
      </div>
    </main>
  );
}
