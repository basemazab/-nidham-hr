import Link from "next/link";
import { requireHRPage } from "@/lib/permissions";
import { EngineerClient } from "./engineer-client";
import { createDevRequest } from "./actions";

export const metadata = {
  title: "مهندس النظام | الإعدادات",
};

export const dynamic = "force-dynamic";

type DevRequestRow = {
  id: string;
  kind: string;
  title: string;
  details: string | null;
  status: string;
  created_at: string;
};

const STATUS_UI: Record<string, { label: string; cls: string }> = {
  new: { label: "🆕 جديد", cls: "bg-sky-50 text-sky-700 border-sky-200" },
  in_progress: { label: "🔧 قيد التنفيذ", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  done: { label: "✅ اتنفذ", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "مرفوض", cls: "bg-slate-50 text-slate-500 border-slate-200" },
};

export default async function SystemEngineerPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  const { supabase, profile } = await requireHRPage();
  const sp = await searchParams;

  const { data: requests } = await supabase
    .from("dev_requests")
    .select("id, kind, title, details, status, created_at")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<DevRequestRow[]>();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Link
          href="/dashboard"
          className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          ← الرئيسية
        </Link>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 font-cairo">
          🛠️ مهندس النظام
        </h1>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-cairo mb-6">
        فحص حي لكل مفاصل النظام بضغطة — وأي مشكلة أو فكرة فيتشر، سجّلها هنا
        وبيتحفظ معاها تشخيص كامل لحظة التسجيل.
      </p>

      {sp.created && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 font-cairo">
          ✅ الطلب اتسجل بتشخيص كامل مرفق — هيتنفذ وهتشوف حالته هنا.
        </div>
      )}
      {sp.error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 font-cairo">
          ⚠️ {decodeURIComponent(sp.error)}
        </div>
      )}

      {/* Live health check */}
      <EngineerClient />

      {/* New request */}
      <section className="mt-8 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <h2 className="font-black text-lg text-slate-900 dark:text-slate-100 font-cairo mb-1">
          📝 سجّل مشكلة أو اطلب فيتشر
        </h2>
        <p className="text-xs text-slate-500 font-cairo mb-4">
          بيتسجل ومعاه صورة كاملة من حالة النظام لحظة الطلب — عشان التنفيذ يبدأ
          بكل المعلومات.
        </p>
        <form action={createDevRequest} className="space-y-3">
          <div className="flex flex-wrap gap-4 items-center">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-200 font-cairo flex items-center gap-2">
              النوع:
              <select
                name="kind"
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm font-cairo"
              >
                <option value="bug">🐞 مشكلة في النظام</option>
                <option value="feature">✨ فيتشر جديدة</option>
              </select>
            </label>
          </div>
          <input
            name="title"
            required
            placeholder="عنوان قصير — مثال: الرد الآلي مش بيبعت الكتالوج"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm font-cairo"
          />
          <textarea
            name="details"
            rows={4}
            placeholder="التفاصيل: حصل إيه بالظبط؟ في أي صفحة؟ إنت كنت بتعمل إيه؟ (كل ما التفاصيل أكتر، التنفيذ أسرع وأدق)"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm font-cairo"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white font-bold font-cairo text-sm shadow-lg transition"
          >
            📨 سجّل الطلب بالتشخيص المرفق
          </button>
        </form>
      </section>

      {/* Requests list */}
      <section className="mt-8">
        <h2 className="font-black text-lg text-slate-900 dark:text-slate-100 font-cairo mb-3">
          📋 الطلبات
        </h2>
        {requests && requests.length > 0 ? (
          <div className="space-y-2">
            {requests.map((r) => {
              const ui = STATUS_UI[r.status] ?? STATUS_UI.new;
              return (
                <div
                  key={r.id}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span>{r.kind === "feature" ? "✨" : "🐞"}</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 font-cairo text-sm">
                        {r.title}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2 py-1 rounded-full border font-cairo ${ui.cls}`}
                    >
                      {ui.label}
                    </span>
                  </div>
                  {r.details && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-cairo mt-1 whitespace-pre-wrap">
                      {r.details.slice(0, 300)}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 font-cairo mt-2">
                    {new Date(r.created_at).toLocaleString("ar-EG", {
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Africa/Cairo",
                    })}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-400 font-cairo">
            مفيش طلبات لسه — أول ما تسجل طلب هيظهر هنا بحالته.
          </p>
        )}
      </section>
    </div>
  );
}
