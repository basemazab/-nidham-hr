import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/permissions";
import { correctAttendance } from "./actions";

// Absence follow-up view: shows employees who are ABSENT or NOT-YET-MARKED for
// a given day, with one-tap fixes for the cases HR raised — on a work errand
// (مأمورية), or forgot to fingerprint but was present.

export const dynamic = "force-dynamic";
export const metadata = { title: "متابعة وتصحيح الغياب | نِظام" };

type Employee = {
  id: string;
  full_name: string;
  job_title: string | null;
  department: string | null;
};

type Params = Promise<{ date?: string; fixed?: string; error?: string }>;

function formatArabicDate(isoDate: string): string {
  return new Date(isoDate + "T00:00:00").toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function AbsencesPage({
  searchParams,
}: {
  searchParams: Params;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { profile } = await getMyProfile();
  const companyId = profile?.company_id ?? "";

  const sp = await searchParams;
  const todayIso = new Date().toISOString().split("T")[0];
  const selectedDate = sp.date ?? todayIso;

  const { data: employeesData } = await supabase
    .from("employees")
    .select("id, full_name, job_title, department")
    .eq("company_id", companyId)
    .eq("status", "active")
    .order("full_name")
    .returns<Employee[]>();
  const employees = employeesData ?? [];

  const { data: rows } = await supabase
    .from("attendance")
    .select("employee_id, status, notes")
    .eq("company_id", companyId)
    .eq("date", selectedDate)
    .returns<Array<{ employee_id: string; status: string; notes: string | null }>>();
  const byEmp = new Map<string, { status: string; notes: string | null }>(
    (rows ?? []).map((r) => [r.employee_id, { status: r.status, notes: r.notes }]),
  );

  // "Needs attention" = explicitly absent, or no record at all (didn't punch /
  // not imported). Everyone else (present / leave / half-day / holiday) is fine.
  const flagged = employees
    .map((e) => {
      const rec = byEmp.get(e.id);
      const state: "absent" | "unmarked" | null = !rec
        ? "unmarked"
        : rec.status === "absent"
          ? "absent"
          : null;
      return state ? { emp: e, state } : null;
    })
    .filter((x): x is { emp: Employee; state: "absent" | "unmarked" } => x !== null);

  const okCount = employees.length - flagged.length;

  return (
    <main className="flex-1 px-6 py-8 bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
          <Link href="/dashboard/attendance" className="text-sm text-slate-500 hover:text-brand-cyan-dark font-cairo">
            ← الرجوع للحضور
          </Link>
          <Link
            href="/dashboard/attendance/review"
            className="text-sm text-brand-cyan-dark hover:underline font-cairo"
          >
            مراجعة دفعات الاستيراد ←
          </Link>
        </div>

        <header className="mb-6">
          <h1 className="text-3xl font-black font-cairo text-slate-800 mb-1">🚫 متابعة وتصحيح الغياب</h1>
          <p className="text-sm text-slate-500 font-cairo leading-relaxed">
            الموظفين الغايبين أو اللي لسه مش مسجّلين في اليوم ده. لو حد كان في
            <b> مأمورية</b> أو <b>نسي يبصم وهو حاضر</b> — صحّحه بضغطة من هنا.
          </p>
        </header>

        {/* Date selector */}
        <form method="get" className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-4 flex items-end gap-3">
          <div className="flex-1">
            <label htmlFor="date" className="block text-xs font-medium text-slate-600 mb-1 font-cairo">التاريخ</label>
            <input type="date" id="date" name="date" defaultValue={selectedDate} max={todayIso}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-brand-cyan outline-none text-slate-900" />
          </div>
          <button type="submit" className="px-5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm font-cairo transition">عرض</button>
        </form>

        <p className="text-sm text-slate-500 font-cairo mb-4">{formatArabicDate(selectedDate)}</p>

        {sp.fixed && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-cairo">✓ تم تحديث حضور الموظف</div>
        )}
        {sp.error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-cairo">⚠ {decodeURIComponent(sp.error)}</div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 mb-4 font-cairo">
          <SummaryTile label="محتاجين مراجعة" value={flagged.length} color="bg-rose-50 text-rose-700 border-rose-200" />
          <SummaryTile label="تمام (حاضر/إجازة)" value={okCount} color="bg-emerald-50 text-emerald-700 border-emerald-200" />
          <SummaryTile label="إجمالي الموظفين" value={employees.length} color="bg-slate-50 text-slate-600 border-slate-200" />
        </div>

        {flagged.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-16 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-lg font-bold font-cairo mb-1 text-slate-700">مفيش غياب محتاج مراجعة في اليوم ده</h2>
            <p className="text-sm text-slate-500 font-cairo">كل الموظفين إما حاضرين أو في إجازة.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {flagged.map(({ emp, state }) => (
              <div key={emp.id} className="bg-white rounded-2xl border border-slate-200 p-4 font-cairo flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {emp.full_name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 truncate">{emp.full_name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                      {emp.job_title && <span>{emp.job_title}</span>}
                      {emp.department && <span className="text-slate-400">· {emp.department}</span>}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${state === "absent" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                        {state === "absent" ? "✗ غايب" : "— لم يُسجّل"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* One-tap corrections */}
                <div className="flex flex-wrap gap-1.5">
                  <FixButton employeeId={emp.id} date={selectedDate} status="present" label="✓ حاضر" cls="bg-emerald-500 hover:bg-emerald-600 text-white" />
                  <FixButton employeeId={emp.id} date={selectedDate} status="present" note="مأمورية" label="🚗 مأمورية" cls="bg-cyan-600 hover:bg-cyan-700 text-white" />
                  <FixButton employeeId={emp.id} date={selectedDate} status="half_day" label="◐ نص يوم" cls="bg-white border border-amber-300 text-amber-700 hover:bg-amber-50" />
                  <FixButton employeeId={emp.id} date={selectedDate} status="leave" label="🏖 إجازة" cls="bg-white border border-cyan-300 text-cyan-700 hover:bg-cyan-50" />
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-6 font-cairo">
          💡 «مأمورية» بتتسجّل حضور كامل (براتب) مع ملاحظة إنها مأمورية. للتعديلات
          الدقيقة (ساعات/تأخير) استخدم <Link href="/dashboard/attendance" className="text-brand-cyan-dark underline">صفحة تسجيل الحضور</Link>.
        </p>
      </div>
    </main>
  );
}

function FixButton({
  employeeId,
  date,
  status,
  label,
  cls,
  note,
}: {
  employeeId: string;
  date: string;
  status: string;
  label: string;
  cls: string;
  note?: string;
}) {
  return (
    <form action={correctAttendance}>
      <input type="hidden" name="employee_id" value={employeeId} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="status" value={status} />
      {note && <input type="hidden" name="note" value={note} />}
      <button type="submit" className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${cls}`}>
        {label}
      </button>
    </form>
  );
}

function SummaryTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`p-3 rounded-xl border text-center ${color}`}>
      <div className="text-2xl font-black font-display">{value.toLocaleString("ar-EG")}</div>
      <div className="text-[11px] font-bold mt-0.5">{label}</div>
    </div>
  );
}
