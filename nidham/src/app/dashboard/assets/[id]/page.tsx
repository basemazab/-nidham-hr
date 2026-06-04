// ============================================================================
// /dashboard/assets/[id] — Asset detail + assign / return / retire
// ============================================================================
// Wires up the assignAsset / returnAsset / retireAsset server actions (which
// already existed but had no UI — every asset row used to 404 here).

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/permissions";
import { formatEGP } from "@/lib/format";
import { assignAsset, returnAsset, retireAsset } from "../actions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ assigned?: string; returned?: string; retired?: string; error?: string }>;
};

type Asset = {
  id: string;
  name: string;
  asset_type: string;
  serial_number: string | null;
  asset_tag: string | null;
  status: string;
  purchase_date: string | null;
  purchase_cost: number | null;
  current_estimated_value: number | null;
  notes: string | null;
  assigned_employee_id: string | null;
  assigned_at: string | null;
  employees: { full_name: string } | null;
};

type HistoryRow = {
  id: string;
  assigned_at: string;
  condition_on_assign: string | null;
  returned_at: string | null;
  condition_on_return: string | null;
  notes: string | null;
  employees: { full_name: string } | null;
};

const TYPE_LABELS: Record<string, { ar: string; icon: string }> = {
  laptop: { ar: "لاب توب", icon: "💻" }, desktop: { ar: "كمبيوتر مكتبي", icon: "🖥" },
  phone: { ar: "تليفون", icon: "📱" }, tablet: { ar: "تابلت", icon: "📲" },
  monitor: { ar: "شاشة", icon: "🖼" }, printer: { ar: "طابعة", icon: "🖨" },
  car: { ar: "سيارة", icon: "🚗" }, motorcycle: { ar: "موتوسيكل", icon: "🏍" },
  tool: { ar: "أداة / معدة", icon: "🔧" }, uniform: { ar: "زي / يونيفورم", icon: "👔" },
  sim_card: { ar: "خط محمول", icon: "📞" }, access_card: { ar: "بطاقة دخول", icon: "🔑" },
  other: { ar: "أخرى", icon: "📦" },
};
const STATUS_LABELS: Record<string, { ar: string; cls: string }> = {
  available: { ar: "متاح", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  assigned: { ar: "مخصص", cls: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  in_maintenance: { ar: "صيانة", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  retired: { ar: "خارج الخدمة", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  lost: { ar: "مفقود", cls: "bg-rose-50 text-rose-700 border-rose-200" },
};
const COND_AR: Record<string, string> = {
  new: "جديد", good: "جيد", fair: "متوسط", poor: "ضعيف", damaged: "تالف", lost: "مفقود",
};

function fmtDate(s: string | null): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("ar-EG");
}

export default async function AssetDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { assigned, returned, retired, error } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { profile } = await getMyProfile();
  const companyId = profile?.company_id ?? "";

  const { data: asset } = await supabase
    .from("assets")
    .select(
      "id, name, asset_type, serial_number, asset_tag, status, purchase_date, purchase_cost, current_estimated_value, notes, assigned_employee_id, assigned_at, employees(full_name)",
    )
    .eq("id", id)
    .eq("company_id", companyId)
    .maybeSingle<Asset>();

  if (!asset) notFound();

  const [historyRes, employeesRes] = await Promise.all([
    supabase
      .from("asset_assignments")
      .select("id, assigned_at, condition_on_assign, returned_at, condition_on_return, notes, employees(full_name)")
      .eq("asset_id", id)
      .eq("company_id", companyId)
      .order("assigned_at", { ascending: false })
      .returns<HistoryRow[]>(),
    supabase
      .from("employees")
      .select("id, full_name")
      .eq("company_id", companyId)
      .eq("status", "active")
      .order("full_name")
      .returns<{ id: string; full_name: string }[]>(),
  ]);

  const history = historyRes.data ?? [];
  const employees = employeesRes.data ?? [];
  const type = TYPE_LABELS[asset.asset_type] ?? TYPE_LABELS.other;
  const st = STATUS_LABELS[asset.status] ?? STATUS_LABELS.available;
  const isAssigned = asset.status === "assigned" && asset.assigned_employee_id;
  const canAssign = asset.status === "available";
  const isRetired = asset.status === "retired";

  return (
    <main className="flex-1 px-4 md:px-6 py-6 bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard/assets" className="text-sm text-slate-500 hover:text-brand-cyan-dark font-cairo">
          ← كل الأصول
        </Link>

        {assigned && <Toast ok>تم تخصيص الأصل للموظف ✓</Toast>}
        {returned && <Toast ok>تم استرجاع الأصل ✓</Toast>}
        {retired && <Toast ok>تم تحويل الأصل لخارج الخدمة ✓</Toast>}
        {error && <Toast>{decodeURIComponent(error)}</Toast>}

        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mt-4 mb-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl font-black font-cairo text-slate-800">
                {type.icon} {asset.name}
              </h1>
              <p className="text-sm text-slate-500 font-cairo mt-0.5">{type.ar}</p>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full border font-bold font-cairo ${st.cls}`}>{st.ar}</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mt-5 text-sm">
            <Field label="الرقم التسلسلي" value={asset.serial_number} mono />
            <Field label="كود الأصل" value={asset.asset_tag} mono />
            <Field label="تاريخ الشراء" value={fmtDate(asset.purchase_date)} />
            <Field label="تكلفة الشراء" value={asset.purchase_cost ? formatEGP(asset.purchase_cost) : "—"} />
            <Field label="القيمة الحالية" value={asset.current_estimated_value ? formatEGP(asset.current_estimated_value) : "—"} />
            <Field label="المخصص حاليًا" value={isAssigned ? asset.employees?.full_name ?? "—" : "—"} />
          </div>
          {asset.notes && <p className="text-sm text-slate-600 font-cairo mt-3 bg-slate-50 rounded-lg p-3">{asset.notes}</p>}
        </div>

        {/* Action card */}
        {!isRetired && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-5">
            {canAssign ? (
              <>
                <h2 className="font-black font-cairo text-slate-800 mb-3">تخصيص الأصل لموظف</h2>
                {employees.length === 0 ? (
                  <p className="text-sm text-slate-500 font-cairo">ضيف موظفين الأول عشان تقدر تخصّص الأصل.</p>
                ) : (
                  <form action={assignAsset} className="grid sm:grid-cols-2 gap-3">
                    <input type="hidden" name="asset_id" value={asset.id} />
                    <label className="block">
                      <span className="block text-xs font-bold text-slate-600 mb-1 font-cairo">الموظف</span>
                      <select name="employee_id" required className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm font-cairo bg-white">
                        <option value="">— اختر موظف —</option>
                        {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                      </select>
                    </label>
                    <label className="block">
                      <span className="block text-xs font-bold text-slate-600 mb-1 font-cairo">حالة الأصل عند التسليم</span>
                      <select name="condition_on_assign" className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm font-cairo bg-white">
                        <option value="good">جيد</option>
                        <option value="new">جديد</option>
                        <option value="fair">متوسط</option>
                        <option value="poor">ضعيف</option>
                      </select>
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="block text-xs font-bold text-slate-600 mb-1 font-cairo">ملاحظات (اختياري)</span>
                      <input name="notes" className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm font-cairo" placeholder="مثلاً: مع الشاحن والشنطة" />
                    </label>
                    <div className="sm:col-span-2">
                      <button type="submit" className="px-5 py-2.5 rounded-lg bg-brand-cyan-dark hover:bg-brand-cyan text-white font-bold font-cairo text-sm">تخصيص</button>
                    </div>
                  </form>
                )}
              </>
            ) : isAssigned ? (
              <>
                <h2 className="font-black font-cairo text-slate-800 mb-1">استرجاع الأصل</h2>
                <p className="text-sm text-slate-500 font-cairo mb-3">مخصص حاليًا لـ <strong>{asset.employees?.full_name}</strong> من {fmtDate(asset.assigned_at)}.</p>
                <form action={returnAsset} className="grid sm:grid-cols-2 gap-3">
                  <input type="hidden" name="asset_id" value={asset.id} />
                  <label className="block">
                    <span className="block text-xs font-bold text-slate-600 mb-1 font-cairo">حالة الأصل عند الاسترجاع</span>
                    <select name="condition_on_return" className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm font-cairo bg-white">
                      <option value="good">جيد</option>
                      <option value="fair">متوسط</option>
                      <option value="poor">ضعيف</option>
                      <option value="damaged">تالف</option>
                      <option value="lost">مفقود</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="block text-xs font-bold text-slate-600 mb-1 font-cairo">ملاحظات (اختياري)</span>
                    <input name="notes" className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm font-cairo" placeholder="ملاحظات الاسترجاع" />
                  </label>
                  <div className="sm:col-span-2">
                    <button type="submit" className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-cairo text-sm">تأكيد الاسترجاع</button>
                  </div>
                </form>
              </>
            ) : (
              <p className="text-sm text-slate-500 font-cairo">الأصل في حالة &quot;{st.ar}&quot;.</p>
            )}

            <form action={retireAsset.bind(null, asset.id)} className="mt-4 pt-4 border-t border-slate-100">
              <button type="submit" className="text-xs text-rose-600 hover:text-rose-700 font-cairo font-bold">
                🚫 تحويل لخارج الخدمة (retire)
              </button>
            </form>
          </div>
        )}

        {/* History */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h2 className="font-black font-cairo text-slate-800">سجل التخصيص ({history.length})</h2>
          </div>
          {history.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400 font-cairo">لسه الأصل ما اتخصصش لحد.</p>
          ) : (
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-xs font-bold text-slate-600">
                <tr>
                  <th className="px-4 py-2 font-cairo">الموظف</th>
                  <th className="px-4 py-2 font-cairo">من</th>
                  <th className="px-4 py-2 font-cairo">إلى</th>
                  <th className="px-4 py-2 font-cairo">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((h) => (
                  <tr key={h.id}>
                    <td className="px-4 py-2.5 font-cairo text-slate-800">{h.employees?.full_name ?? "—"}</td>
                    <td className="px-4 py-2.5 font-cairo text-slate-600">{fmtDate(h.assigned_at)}</td>
                    <td className="px-4 py-2.5 font-cairo text-slate-600">{h.returned_at ? fmtDate(h.returned_at) : <span className="text-cyan-700">لسه عنده</span>}</td>
                    <td className="px-4 py-2.5 font-cairo text-slate-500 text-xs">
                      {h.condition_on_assign ? `تسليم: ${COND_AR[h.condition_on_assign] ?? h.condition_on_assign}` : ""}
                      {h.condition_on_return ? ` · استرجاع: ${COND_AR[h.condition_on_return] ?? h.condition_on_return}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}

function Field({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
      <span className="text-slate-500 font-cairo">{label}</span>
      <span className={`text-slate-800 ${mono ? "font-mono" : "font-cairo"}`} dir={mono ? "ltr" : undefined}>{value || "—"}</span>
    </div>
  );
}

function Toast({ children, ok }: { children: React.ReactNode; ok?: boolean }) {
  return (
    <div className={`mt-4 p-3 rounded-lg text-sm font-cairo border ${ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-700"}`}>
      {ok ? "✓ " : "⚠ "}{children}
    </div>
  );
}
