import Link from "next/link";
import { requireHRPage } from "@/lib/permissions";
import { LegalAdvisorClient } from "./advisor-client";

export const metadata = {
  title: "المستشار القانوني | ذكاء HR",
};

export const dynamic = "force-dynamic";

type CaseRow = {
  id: string;
  employee_name: string;
  case_type: string;
  status: string;
  created_at: string;
};

const STATUS_AR: Record<string, string> = {
  open: "مفتوحة",
  investigated: "تحقيق",
  opined: "صدر فيها رأي",
  closed: "مغلقة",
};

export default async function LegalAdvisorPage() {
  const { supabase, profile } = await requireHRPage();

  const { data: cases } = await supabase
    .from("legal_cases")
    .select("id, employee_name, case_type, status, created_at")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })
    .limit(15)
    .returns<CaseRow[]>();

  return (
    <main className="flex-1 px-6 py-8 min-h-screen bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="max-w-3xl mx-auto">
        <nav className="print:hidden text-xs text-slate-500 mb-4 font-cairo">
          <Link href="/dashboard" className="hover:text-brand-cyan-dark">الرئيسية</Link>
          <span className="mx-2">›</span>
          <span className="text-slate-700 dark:text-slate-300">المستشار القانوني</span>
        </nav>

        <div className="print:hidden mb-6">
          <h1 className="text-2xl font-black font-cairo text-slate-900 dark:text-slate-100">
            ⚖️ المستشار القانوني
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-cairo">
            واقعة مع موظف أو عامل؟ الأداة بتجهّز محضر تحقيق رسمي، تسجّل أقواله،
            وتطلع رأي قانوني مبني على قانون العمل المصري 12/2003 — بالإجراء
            الصحيح والمستندات جاهزة للطباعة.
          </p>
        </div>

        <LegalAdvisorClient />

        {cases && cases.length > 0 && (
          <div className="print:hidden mt-10">
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 font-cairo mb-3">
              📂 القضايا السابقة
            </h2>
            <div className="space-y-2">
              {cases.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 font-cairo truncate">
                      {c.employee_name} — {c.case_type}
                    </div>
                    <div className="text-[11px] text-slate-400 font-cairo">
                      {new Date(c.created_at).toLocaleString("ar-EG", {
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Africa/Cairo",
                      })}
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-cairo shrink-0">
                    {STATUS_AR[c.status] ?? c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
