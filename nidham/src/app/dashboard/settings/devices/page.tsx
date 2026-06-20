import Link from "next/link";
import { requireAdmin } from "@/lib/permissions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { registerDevice, toggleDevice, deleteDevice } from "./actions";

export const metadata = { title: "أجهزة البصمة | نِظام" };

type DeviceRow = {
  id: string;
  name: string;
  serial_number: string;
  is_active: boolean;
  last_seen_at: string | null;
  last_push_at: string | null;
  total_punches: number;
  created_at: string;
};

type Params = Promise<{ saved?: string; deleted?: string; error?: string }>;

export default async function DevicesPage({
  searchParams,
}: {
  searchParams: Params;
}) {
  const { supabase, profile } = await requireAdmin();
  const sp = await searchParams;

  const { data: devices } = await supabase
    .from("attendance_devices")
    .select("id, name, serial_number, is_active, last_seen_at, last_push_at, total_punches, created_at")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })
    .returns<DeviceRow[]>();

  const list = devices ?? [];

  return (
    <main className="flex-1 px-6 py-8 bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard/attendance" className="text-sm text-slate-500 hover:text-brand-cyan-dark font-cairo">
            ← الرجوع للحضور
          </Link>
        </div>

        <header className="mb-6">
          <h1 className="text-3xl font-black font-cairo text-slate-800 mb-1">🔌 ربط أجهزة البصمة</h1>
          <p className="text-sm text-slate-500 font-cairo leading-relaxed">
            النظام بيشتغل مع <b>أي جهاز بصمة</b> بطريقتين — اختار اللي يناسب جهازك. البصمات بتظهرلك بعد كده في <Link href="/dashboard/attendance/review" className="text-brand-cyan-dark underline">مراجعة واعتماد الحضور</Link>.
          </p>
        </header>

        {sp.saved && (
          <Flash tone="emerald">✓ تم تسجيل الجهاز. اضبط فيه إعدادات Cloud Server اللي تحت.</Flash>
        )}
        {sp.deleted && <Flash tone="amber">✓ تم حذف الجهاز.</Flash>}
        {sp.error && <Flash tone="red">⚠ {decodeURIComponent(sp.error)}</Flash>}

        {/* Two ways to connect — pick by device type */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl border-2 border-cyan-200 bg-cyan-50/40 p-5 font-cairo">
            <div className="text-[11px] font-black text-cyan-700 mb-1">الطريقة ١ — الأفضل ⚡</div>
            <h2 className="font-black text-slate-800 mb-1">ربط تلقائي لحظي</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              الجهاز يبعت البصمات لوحده أول بأول من غير أي تدخّل يدوي. متاح لأجهزة{" "}
              <b>ZKTeco / eSSL</b> وأي جهاز بيدعم «Cloud Server / ADMS Push».
              سجّل الجهاز تحت 👇 واضبط الإعدادات.
            </p>
          </div>
          <div className="rounded-2xl border-2 border-slate-200 bg-white p-5 font-cairo">
            <div className="text-[11px] font-black text-slate-500 mb-1">الطريقة ٢ — تشتغل مع أي جهاز ✅</div>
            <h2 className="font-black text-slate-800 mb-1">استيراد ملف الحضور</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              لأي جهاز تاني (<b>Hikvision، Suprema، Anviz، Realand</b>، أو موديل قديم):
              صدّر ملف الحضور Excel/CSV من برنامج الجهاز، والنظام بيتعرّف على الأعمدة{" "}
              <b>تلقائيًا</b> مهما كان تنسيقها.
            </p>
            <Link
              href="/dashboard/attendance/import"
              className="inline-block px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition"
            >
              استيراد ملف بصمة →
            </Link>
          </div>
        </div>

        {/* How-to / device config (auto-push path) */}
        <div className="mb-6 rounded-2xl border-2 border-cyan-200 bg-cyan-50/50 p-5 font-cairo">
          <h2 className="font-black text-slate-800 mb-2">⚙ إعدادات الـ Cloud Server في الجهاز (للربط التلقائي — ZKTeco / eSSL)</h2>
          <p className="text-xs text-slate-600 mb-3 leading-relaxed">
            من قائمة الجهاز: <b>Comm → Cloud Server Setup</b> (أو ADMS) — اكتب القيم دي:
          </p>
          <div className="grid sm:grid-cols-2 gap-2 text-sm">
            <ConfigRow label="Server Address / Domain" value="nidhamhr.com" />
            <ConfigRow label="Server Port" value="443" />
            <ConfigRow label="Enable Domain Name / HTTPS" value="نعم (ON)" />
            <ConfigRow label="Path (لو موجود)" value="/iclock" />
          </div>
          <ul className="mt-3 text-xs text-slate-600 space-y-1.5 leading-relaxed">
            <li>• <b>مهم جدًا:</b> رقم تعريف الموظف على الجهاز (Enroll ID) لازم يساوي <b>«كود الموظف»</b> في النظام — بالكود ده النظام بيعرف كل بصمة تخص مين.</li>
            <li>• بعد الضبط، اعمل Restart للجهاز. أول ما يتصل هيظهر «آخر اتصال» تحت، وأول بصمة هيظهر «آخر استلام».</li>
            <li>• لو جهازك بيدعم HTTP بس (موديل قديم) قوللي — بنحتاج إعداد مختلف.</li>
          </ul>
        </div>

        {/* Register form */}
        <form action={registerDevice} className="mb-8 rounded-2xl border-2 border-slate-200 bg-white p-5">
          <h2 className="font-black text-slate-800 font-cairo mb-1">➕ تسجيل جهاز للربط التلقائي</h2>
          <p className="text-xs text-slate-500 font-cairo mb-3">
            للأجهزة اللي بتدعم Cloud Server / ADMS بس (ZKTeco / eSSL). أي جهاز تاني استخدم «استيراد ملف الحضور» فوق.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-bold text-slate-700 mb-1 font-cairo">اسم الجهاز</span>
              <input name="name" placeholder="مثلاً: بصمة المصنع - البوابة" required
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-cyan font-cairo" />
            </label>
            <label className="block">
              <span className="block text-sm font-bold text-slate-700 mb-1 font-cairo">الرقم التسلسلي (Serial / SN)</span>
              <input name="serial_number" placeholder="من قائمة الجهاز: System Info → SN" required dir="ltr"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-cyan font-mono" />
            </label>
          </div>
          <button type="submit"
            className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white font-bold font-cairo text-sm shadow-md hover:shadow-lg transition">
            سجّل الجهاز
          </button>
        </form>

        {/* Device list */}
        <h2 className="font-black text-slate-800 font-cairo mb-3">الأجهزة المسجّلة ({list.length})</h2>
        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 font-cairo">
            مفيش أجهزة مسجّلة لسه — سجّل أول جهاز فوق.
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((d) => (
              <div key={d.id} className="rounded-2xl border border-slate-200 bg-white p-4 font-cairo">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-slate-800">{d.name}</span>
                      {d.is_active ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">نشط</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-bold">متوقّف</span>
                      )}
                      {d.last_seen_at && <span className="px-2 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-[10px] font-bold">✓ اتصل بالنظام</span>}
                    </div>
                    <div className="text-xs text-slate-500 font-mono" dir="ltr">SN: {d.serial_number}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={toggleDevice}>
                      <input type="hidden" name="id" value={d.id} />
                      <input type="hidden" name="active" value={d.is_active ? "0" : "1"} />
                      <button type="submit" className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold">
                        {d.is_active ? "إيقاف" : "تفعيل"}
                      </button>
                    </form>
                    <form action={deleteDevice}>
                      <input type="hidden" name="id" value={d.id} />
                      <ConfirmSubmitButton
                        label="🗑 حذف"
                        message={`حذف الجهاز «${d.name}»؟ مش هيقدر يبعت بصمات بعد كده.`}
                        confirmLabel="نعم احذف"
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold cursor-pointer"
                      />
                    </form>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <Stat label="آخر اتصال" value={fmt(d.last_seen_at)} />
                  <Stat label="آخر استلام بصمة" value={fmt(d.last_push_at)} />
                  <Stat label="إجمالي البصمات" value={d.total_punches.toLocaleString("ar-EG")} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-bold text-slate-800 font-mono" dir="ltr">{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
      <div className="text-[10px] text-slate-500 font-bold">{label}</div>
      <div className="text-xs font-black text-slate-700 mt-0.5">{value}</div>
    </div>
  );
}

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" });
}

function Flash({ tone, children }: { tone: "emerald" | "amber" | "red"; children: React.ReactNode }) {
  const cls = {
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-800",
    amber: "bg-amber-50 border-amber-200 text-amber-800",
    red: "bg-red-50 border-red-200 text-red-700",
  }[tone];
  return <div className={`mb-4 rounded-xl border-2 p-3 text-sm font-cairo ${cls}`}>{children}</div>;
}
