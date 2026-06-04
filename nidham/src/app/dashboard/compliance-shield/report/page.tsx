import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  scanCompliance,
  type ComplianceEmployee,
  type LeaveBalanceRow,
  type CompanyDocument,
} from "@/lib/compliance-shield";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

type Profile = {
  company_id: string;
  companies: { name: string | null } | null;
};

const SEV_AR: Record<string, string> = {
  high: "خطر عالٍ",
  medium: "تنبيه",
  low: "للمراجعة",
};

export default async function ComplianceReportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, companies(name)")
    .eq("id", user.id)
    .single<Profile>();
  const companyId = profile?.company_id ?? "";
  const companyName = profile?.companies?.name ?? "شركتك";

  const year = new Date().getFullYear();
  const [companyRes, employeesRes, balancesRes, docsRes] = await Promise.all([
    supabase
      .from("companies")
      .select("social_insurance_enabled, income_tax_enabled")
      .eq("id", companyId)
      .maybeSingle<{ social_insurance_enabled: boolean | null; income_tax_enabled: boolean | null }>(),
    supabase
      .from("employees")
      .select("id, full_name, status, hire_date, national_id, social_insurance_number, basic_salary, contract_type, contract_end")
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

  const now = new Date();
  const result = scanCompliance({
    employees: employeesRes.data ?? [],
    company: {
      social_insurance_enabled: companyRes.data?.social_insurance_enabled ?? false,
      income_tax_enabled: companyRes.data?.income_tax_enabled ?? false,
    },
    annualBalances: balancesRes.data ?? [],
    documents: docsRes.data ?? [],
    today: now,
  });

  const dateStr = now.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const gradeColor: Record<string, string> = {
    emerald: "#059669",
    cyan: "#0891b2",
    amber: "#d97706",
    rose: "#e11d48",
  };

  return (
    <main className="min-h-screen bg-slate-100 print:bg-white py-8 px-4 print:p-0 font-cairo">
      {/* Toolbar (screen only) */}
      <div className="max-w-3xl mx-auto mb-4 flex items-center justify-between print:hidden">
        <a href="/dashboard/compliance-shield" className="text-sm text-slate-500 hover:text-slate-800">
          ← رجوع للدرع
        </a>
        <PrintButton />
      </div>

      {/* The sheet */}
      <div className="max-w-3xl mx-auto bg-white print:shadow-none shadow-xl rounded-2xl print:rounded-none p-8 md:p-12">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-200 pb-5 mb-6">
          <div>
            <div className="text-2xl font-black text-slate-900">تقرير الامتثال</div>
            <div className="text-sm text-slate-500 mt-1">{companyName}</div>
            <div className="text-xs text-slate-400 mt-0.5">بتاريخ {dateStr}</div>
          </div>
          <div className="text-left">
            <div className="text-xl font-black" style={{ color: "#0891b2" }}>نِظام</div>
            <div className="text-[10px] tracking-widest text-amber-600 font-bold">NIDHAM HR</div>
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center gap-6 mb-8 p-6 rounded-xl bg-slate-50 print:bg-white print:border print:border-slate-200">
          <div className="text-center">
            <div
              className="text-6xl font-black tabular-nums leading-none"
              style={{ color: gradeColor[result.grade.tone] }}
            >
              {result.score}
            </div>
            <div className="text-xs text-slate-400 mt-1">من 100</div>
          </div>
          <div className="flex-1">
            <div className="text-lg font-black text-slate-900 mb-1">
              مؤشر الامتثال: {result.grade.label}
            </div>
            <div className="text-sm text-slate-600 leading-relaxed">
              {result.risks.length === 0
                ? "لا توجد مخاطر امتثال مرصودة على بيانات الشركة في تاريخ التقرير."
                : `تم رصد ${result.risks.length} بند يحتاج مراجعة` +
                  (result.exposureEGP > 0
                    ? ` · تعرّض تقديري للغرامات ≈ ${result.exposureEGP.toLocaleString("ar-EG")} جنيه.`
                    : ".")}
            </div>
          </div>
        </div>

        {/* Findings */}
        <h2 className="text-base font-black text-slate-900 mb-3">البنود المرصودة</h2>
        {result.risks.length === 0 ? (
          <div className="p-4 rounded-lg bg-emerald-50 print:border print:border-emerald-200 text-emerald-800 text-sm">
            ✓ كل الالتزامات المرصودة سليمة. حافظ على التحديث المستمر لبيانات الموظفين.
          </div>
        ) : (
          <table className="w-full text-sm border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-right">
                <th className="p-2 font-bold border-b border-slate-200">البند</th>
                <th className="p-2 font-bold border-b border-slate-200">التصنيف</th>
                <th className="p-2 font-bold border-b border-slate-200">السند القانوني</th>
                <th className="p-2 font-bold border-b border-slate-200">تقدير</th>
              </tr>
            </thead>
            <tbody>
              {result.risks.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 align-top">
                  <td className="p-2 text-slate-800">
                    <div className="font-bold">{r.title}</div>
                    <div className="text-xs text-slate-500">{r.detail}</div>
                  </td>
                  <td className="p-2 text-slate-600 whitespace-nowrap">{SEV_AR[r.severity]}</td>
                  <td className="p-2 text-slate-500 text-xs">{r.legalRef}</td>
                  <td className="p-2 text-rose-700 font-bold whitespace-nowrap">
                    {r.estFine ? `~${r.estFine.toLocaleString("ar-EG")} ج` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Monitored list */}
        <h2 className="text-base font-black text-slate-900 mt-8 mb-3">نطاق المراقبة</h2>
        <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-600">
          <div>• تسجيل التأمينات في المواعيد</div>
          <div>• اكتمال بيانات الموظفين الحكومية</div>
          <div>• مستحقات نهاية الخدمة للمفصولين</div>
          <div>• التزامات حجم الشركة (50+)</div>
          <div>• التزام رصيد الإجازات المتراكم</div>
          <div>• لائحة الجزاءات والسلامة المهنية</div>
          <div>• تواريخ انتهاء المستندات والتراخيص</div>
          <div>• انتهاء فترات الاختبار (المادة 33)</div>
          <div>• العقود محددة المدة وتجديدها</div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-5 border-t border-slate-200 text-[11px] text-slate-400 leading-relaxed">
          تم إنشاء هذا التقرير تلقائياً بواسطة نظام نِظام لإدارة الموارد البشرية بتاريخ
          {" "}{dateStr}. الأرقام تقديرية لأغراض الاسترشاد والوقاية، ولا تُغني عن
          المراجعة القانونية المتخصصة. الحالة محسوبة على بيانات الشركة المسجّلة في
          النظام لحظة إصدار التقرير.
        </div>
      </div>
    </main>
  );
}
