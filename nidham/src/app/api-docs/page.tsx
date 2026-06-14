import Link from "next/link";
import { ApiDocsClient } from "./client";

export const metadata = {
  title: "توثيق API — Nidham HR",
  description:
    "واجهة برمجة تطبيقات نِظام للموارد البشرية والمرتبات: endpoints للموظفين والحضور والمرتبات، مصادقة بمفتاح API، متوافقة مع القانون المصري.",
};

const BASE = "https://www.nidhamhr.com/api/v1";

const ENDPOINTS = [
  { m: "GET", path: "/employees", desc: "قائمة الموظفين (ترقيم + تصفية)", scope: "employees:read" },
  { m: "POST", path: "/employees", desc: "إضافة موظف جديد", scope: "employees:write" },
  { m: "GET", path: "/attendance", desc: "سجلات الحضور (from / to / employee / status)", scope: "attendance:read" },
  { m: "POST", path: "/attendance", desc: "تسجيل/تحديث حضور دفعة (مزامنة ثنائية)", scope: "attendance:write" },
  { m: "GET", path: "/payroll", desc: "بيانات المرتبات والتأمينات", scope: "payroll:read" },
];

const QUICKSTART = `curl -H "Authorization: Bearer مفتاحك" \\
  "https://www.nidhamhr.com/api/v1/employees?limit=5"`;

function MethodBadge({ m }: { m: string }) {
  const cls =
    m === "GET"
      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  return (
    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-black tracking-wide ${cls}`} dir="ltr">
      {m}
    </span>
  );
}

export default function ApiDocsPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 py-10 px-5 font-cairo">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Hero */}
        <header className="rounded-3xl bg-gradient-to-br from-brand-cyan-dark to-brand-navy p-8 text-white">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">OpenAPI 3.1</span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">v1.0.0</span>
            <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-200">● شغّال</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-2">واجهة Nidham HR API</h1>
          <p className="max-w-2xl text-cyan-50/90 leading-relaxed">
            اربط أنظمتك (ERP زي Odoo، محاسبة، أو أي تطبيق) بنِظام للموارد البشرية والمرتبات.
            متوافقة مع قانون العمل المصري 12/2003 وقانون التأمينات 148/2019.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link href="/dashboard/settings/api-keys" className="rounded-xl bg-white px-5 py-2.5 text-sm font-black text-brand-cyan-dark hover:bg-cyan-50 transition">
              احصل على مفتاح API
            </Link>
            <Link href="/integrations/odoo" className="rounded-xl bg-white/10 border border-white/30 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/20 transition">
              دليل ربط Odoo
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-cyan-50/80">
            <span><span className="font-bold">Base URL:</span> <code dir="ltr" className="font-mono">{BASE}</code></span>
            <span><span className="font-bold">Auth:</span> <code dir="ltr" className="font-mono">Authorization: Bearer &lt;key&gt;</code></span>
          </div>
        </header>

        {/* Auth */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-2 text-lg font-black text-slate-900 dark:text-white">المصادقة</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            كل طلب لازم يحمل هيدر <code dir="ltr" className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-brand-cyan-dark dark:bg-slate-800">Authorization: Bearer &lt;key&gt;</code>.
            تطلع المفتاح من <Link href="/dashboard/settings/api-keys" className="font-bold text-brand-cyan-dark hover:underline">الإعدادات ← مفاتيح API</Link>،
            وتختار له صلاحيات محددة (قراءة/كتابة لكل قسم). كل مفتاح مربوط بشركتك فقط.
          </p>
        </section>

        {/* Endpoints */}
        <section>
          <h2 className="mb-3 text-lg font-black text-slate-900 dark:text-white">الـ Endpoints المتاحة</h2>
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300">Endpoint</th>
                  <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300">الوصف</th>
                  <th className="px-4 py-3 font-black text-slate-600 dark:text-slate-300">الصلاحية</th>
                </tr>
              </thead>
              <tbody>
                {ENDPOINTS.map((e) => (
                  <tr key={e.m + e.path} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2" dir="ltr">
                        <MethodBadge m={e.m} />
                        <code className="font-mono text-slate-800 dark:text-slate-200">{e.path}</code>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{e.desc}</td>
                    <td className="px-4 py-3"><code dir="ltr" className="text-xs text-slate-500">{e.scope}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick start */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 text-lg font-black text-slate-900 dark:text-white">ابدأ بسرعة</h2>
          <pre dir="ltr" className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
            <code>{QUICKSTART}</code>
          </pre>
          <p className="mt-2 text-xs text-slate-500">بدّل <code dir="ltr" className="font-mono">مفتاحك</code> بمفتاح API بتاعك. النتيجة JSON فيها <code dir="ltr" className="font-mono">data</code> و <code dir="ltr" className="font-mono">pagination</code>.</p>
        </section>

        {/* Interactive Swagger */}
        <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">جرّب مباشرة (تفاعلي)</h2>
            <p className="text-xs text-slate-500">اضغط Authorize وحط مفتاحك، وجرّب أي endpoint من هنا على طول.</p>
          </div>
          <div dir="ltr" className="px-2 py-2">
            <ApiDocsClient />
          </div>
        </section>
      </div>
    </main>
  );
}
