import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addDocument, deleteDocument } from "./actions";

export const dynamic = "force-dynamic";

type DocRow = {
  id: string;
  name: string;
  category: string;
  expiry_date: string;
  reminder_days: number;
  notes: string | null;
};

type SearchParams = Promise<{ ok?: string; error?: string }>;

const CAT_AR: Record<string, string> = {
  commercial_register: "سجل تجاري",
  tax_card: "بطاقة ضريبية",
  license: "ترخيص",
  insurance: "شهادة تأمين",
  civil_defense: "دفاع مدني",
  contract: "عقد",
  permit: "تصريح",
  other: "أخرى",
};

function daysUntil(dateStr: string, today: Date): number {
  const d = new Date(dateStr + "T00:00:00").getTime();
  const t = new Date(today.toISOString().split("T")[0] + "T00:00:00").getTime();
  return Math.round((d - t) / (1000 * 60 * 60 * 24));
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { ok, error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: docsRaw } = await supabase
    .from("company_documents")
    .select("id, name, category, expiry_date, reminder_days, notes")
    .order("expiry_date", { ascending: true })
    .returns<DocRow[]>();
  const docs = docsRaw ?? [];

  const today = new Date();
  const expiredCount = docs.filter((d) => daysUntil(d.expiry_date, today) < 0).length;
  const soonCount = docs.filter((d) => {
    const days = daysUntil(d.expiry_date, today);
    return days >= 0 && days <= (d.reminder_days ?? 30);
  }).length;

  return (
    <main className="flex-1 px-6 py-8 min-h-screen bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black font-cairo text-slate-900 dark:text-slate-100">
            📁 المستندات والتراخيص
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-cairo">
            تابع تواريخ انتهاء مستندات شركتك — وهنبّهك قبل ميعاد كل واحد. المنتهي
            والقريب بيظهروا في درع الامتثال تلقائياً.
          </p>
        </div>

        {ok && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-cairo">
            ✓ {ok === "added" ? "تم إضافة المستند" : "تم الحذف"}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-cairo">
            ⚠ {decodeURIComponent(error)}
          </div>
        )}

        {/* Stats */}
        {docs.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Stat label="إجمالي" value={docs.length} cls="text-slate-800 dark:text-slate-100" />
            <Stat label="قرب الانتهاء" value={soonCount} cls="text-amber-600" />
            <Stat label="منتهية" value={expiredCount} cls="text-rose-600" />
          </div>
        )}

        {/* Add form */}
        <details className="mb-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden" open={docs.length === 0}>
          <summary className="px-5 py-4 cursor-pointer font-bold font-cairo text-slate-800 dark:text-slate-100 select-none">
            ➕ إضافة مستند
          </summary>
          <form action={addDocument} className="px-5 pb-5 grid sm:grid-cols-2 gap-4">
            <label className="block sm:col-span-2">
              <span className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 font-cairo">اسم المستند</span>
              <input name="name" required placeholder="مثلاً: السجل التجاري" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 outline-none focus:border-brand-cyan font-cairo" />
            </label>
            <label className="block">
              <span className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 font-cairo">النوع</span>
              <select name="category" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 outline-none focus:border-brand-cyan font-cairo">
                {Object.entries(CAT_AR).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 font-cairo">تاريخ الانتهاء</span>
              <input name="expiry_date" type="date" required className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 outline-none focus:border-brand-cyan font-cairo" />
            </label>
            <label className="block">
              <span className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 font-cairo">نبّهني قبل (أيام)</span>
              <input name="reminder_days" type="number" min={0} defaultValue={30} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 outline-none focus:border-brand-cyan font-cairo" />
            </label>
            <label className="block">
              <span className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 font-cairo">ملاحظات (اختياري)</span>
              <input name="notes" placeholder="رقم، جهة الإصدار…" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 outline-none focus:border-brand-cyan font-cairo" />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className="px-6 py-2.5 rounded-lg bg-brand-cyan-dark hover:bg-brand-cyan text-white font-bold font-cairo text-sm transition">
                حفظ المستند
              </button>
            </div>
          </form>
        </details>

        {/* List */}
        {docs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
            <div className="text-4xl mb-3">📁</div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-cairo">
              مفيش مستندات لسه. ضيف السجل التجاري والبطاقة الضريبية والتراخيص
              عشان منتساش أي تجديد.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map((d) => {
              const days = daysUntil(d.expiry_date, today);
              const expired = days < 0;
              const soon = days >= 0 && days <= (d.reminder_days ?? 30);
              const tone = expired
                ? "border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-900/10"
                : soon
                  ? "border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900";
              const badge = expired
                ? { t: `منتهي من ${Math.abs(days)} يوم`, c: "bg-rose-100 text-rose-800 border-rose-300" }
                : soon
                  ? { t: `باقي ${days} يوم`, c: "bg-amber-100 text-amber-800 border-amber-300" }
                  : { t: `باقي ${days} يوم`, c: "bg-emerald-100 text-emerald-800 border-emerald-300" };
              return (
                <div key={d.id} className={`rounded-2xl border p-4 shadow-sm flex items-center justify-between gap-3 ${tone}`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-slate-100 font-cairo">{d.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-cairo">{CAT_AR[d.category] ?? "أخرى"}</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-cairo mt-0.5">
                      ينتهي: {new Date(d.expiry_date + "T00:00:00").toLocaleDateString("ar-EG")}
                      {d.notes ? ` · ${d.notes}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-bold font-cairo px-2.5 py-1 rounded-full border ${badge.c}`}>{badge.t}</span>
                    <form action={deleteDocument}>
                      <input type="hidden" name="id" value={d.id} />
                      <button type="submit" aria-label="حذف" className="text-slate-300 hover:text-rose-500 transition text-lg">✕</button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center shadow-sm">
      <div className={`text-3xl font-black font-cairo tabular-nums ${cls}`}>{value.toLocaleString("ar-EG")}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-cairo mt-1">{label}</div>
    </div>
  );
}
