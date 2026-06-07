// ============================================================================
// /dashboard/marketing/sequences — drip message sequences (ManyChat-style)
// ============================================================================
// Build a sequence of timed steps, then enroll a segment of inbox
// conversations. The /api/cron/run-sequences cron sends due steps.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/permissions";
import { canUseFeature } from "@/lib/subscriptions-server";
import { UpgradeRequired } from "@/components/upgrade-required";
import {
  createSequence,
  addSequenceStep,
  deleteSequenceStep,
  deleteSequence,
  toggleSequence,
  enrollSegment,
} from "./actions";

export const dynamic = "force-dynamic";

type Seq = { id: string; name: string; active: boolean };
type Step = {
  id: string;
  sequence_id: string;
  step_order: number;
  delay_hours: number;
  message: string;
};

function delayLabel(h: number): string {
  if (h <= 0) return "فورًا";
  if (h < 24) return `بعد ${h} ساعة`;
  const d = Math.round(h / 24);
  return `بعد ${d} يوم`;
}

export default async function SequencesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; err?: string; enrolled?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await canUseFeature("marketing_studio"))) {
    return <UpgradeRequired feature="marketing_studio" />;
  }

  const { profile } = await getMyProfile();
  const companyId = profile?.company_id ?? "";
  const sp = await searchParams;

  const { data: seqs } = await supabase
    .from("marketing_sequences")
    .select("id, name, active")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .returns<Seq[]>();

  const sequences = seqs ?? [];
  const ids = sequences.map((s) => s.id);

  let stepsBySeq: Record<string, Step[]> = {};
  if (ids.length > 0) {
    const { data: steps } = await supabase
      .from("marketing_sequence_steps")
      .select("id, sequence_id, step_order, delay_hours, message")
      .in("sequence_id", ids)
      .order("step_order", { ascending: true })
      .returns<Step[]>();
    stepsBySeq = (steps ?? []).reduce<Record<string, Step[]>>((acc, s) => {
      (acc[s.sequence_id] ||= []).push(s);
      return acc;
    }, {});
  }

  return (
    <main className="flex-1 px-4 md:px-6 py-6 bg-gradient-to-b from-slate-50 via-white to-teal-50/20 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <Link href="/dashboard/marketing" className="text-sm text-slate-500 hover:text-brand-cyan-dark font-cairo">
            ← استوديو التسويق
          </Link>
        </div>

        <header className="mb-6">
          <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-teal-100 to-emerald-100 border border-teal-300 text-teal-800 text-xs font-bold mb-2 font-cairo">
            ⏱️ السلاسل (Sequences)
          </div>
          <h1 className="text-3xl font-black font-cairo text-slate-800 mb-1">
            سلسلة رسائل مجدولة
          </h1>
          <p className="text-sm text-slate-500 font-cairo leading-relaxed max-w-2xl">
            ابنِ خطوات برسائل وتوقيت (ترحيب → بعد يوم → بعد 3 أيام...)، وسجّل شريحة
            من عملائك — والنظام يبعت كل خطوة في وقتها أوتوماتيك.
          </p>
        </header>

        {sp.ok && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 font-cairo">تم ✓</div>
        )}
        {sp.enrolled && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 font-cairo">
            تم تسجيل {sp.enrolled} محادثة في السلسلة ✓ (هتبدأ الرسائل في وقتها)
          </div>
        )}
        {sp.err && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 font-cairo">
            {decodeURIComponent(sp.err)}
          </div>
        )}

        {/* Create sequence */}
        <form action={createSequence} className="flex gap-2 mb-6">
          <input
            name="name"
            required
            placeholder="اسم سلسلة جديدة (مثلاً: ترحيب العملاء الجدد)"
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-cairo"
          />
          <button type="submit" className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold font-cairo text-sm whitespace-nowrap">
            + سلسلة
          </button>
        </form>

        {sequences.length === 0 ? (
          <p className="text-sm text-slate-400 font-cairo">مفيش سلاسل لسه — اعمل أول سلسلة فوق.</p>
        ) : (
          <div className="space-y-5">
            {sequences.map((seq) => {
              const steps = stepsBySeq[seq.id] ?? [];
              return (
                <section key={seq.id} className="bg-white border-2 border-slate-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h2 className="font-black font-cairo text-slate-800">
                      {seq.active ? "🟢" : "⚪"} {seq.name}
                    </h2>
                    <div className="flex items-center gap-2">
                      <form action={toggleSequence}>
                        <input type="hidden" name="id" value={seq.id} />
                        <input type="hidden" name="active" value={seq.active ? "0" : "1"} />
                        <button type="submit" className="text-xs font-bold text-slate-500 hover:text-slate-800 font-cairo">
                          {seq.active ? "إيقاف" : "تشغيل"}
                        </button>
                      </form>
                      <form action={deleteSequence}>
                        <input type="hidden" name="id" value={seq.id} />
                        <button type="submit" className="text-xs font-bold text-rose-500 hover:text-rose-700 font-cairo">
                          حذف
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Steps */}
                  <ol className="space-y-2 mb-3">
                    {steps.map((st, i) => (
                      <li key={st.id} className="flex items-start gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-xs font-bold text-teal-700 shrink-0 mt-0.5">
                          {i + 1}. {delayLabel(st.delay_hours)}
                        </span>
                        <p className="text-sm text-slate-700 font-cairo flex-1 whitespace-pre-wrap">{st.message}</p>
                        <form action={deleteSequenceStep}>
                          <input type="hidden" name="id" value={st.id} />
                          <button type="submit" className="text-rose-400 hover:text-rose-600 text-xs shrink-0">✕</button>
                        </form>
                      </li>
                    ))}
                    {steps.length === 0 && (
                      <li className="text-xs text-slate-400 font-cairo">مفيش خطوات لسه — ضيف أول خطوة.</li>
                    )}
                  </ol>

                  {/* Add step */}
                  <form action={addSequenceStep} className="flex flex-wrap items-end gap-2 mb-4 pb-4 border-b border-slate-100">
                    <input type="hidden" name="sequence_id" value={seq.id} />
                    <label className="text-xs font-cairo text-slate-600">
                      التأخير (ساعات)
                      <input name="delay_hours" type="number" min={0} defaultValue={steps.length === 0 ? 0 : 24} className="block w-24 mt-1 px-2 py-1.5 rounded border border-slate-200 text-sm" />
                    </label>
                    <input name="message" required placeholder="نص الرسالة..." className="flex-1 min-w-[180px] px-3 py-2 rounded-lg border border-slate-200 text-sm font-cairo" />
                    <button type="submit" className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white font-bold font-cairo text-sm">+ خطوة</button>
                  </form>

                  {/* Enroll a segment */}
                  <form action={enrollSegment} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="sequence_id" value={seq.id} />
                    <span className="text-xs font-bold text-slate-600 font-cairo w-full">سجّل شريحة في السلسلة دي:</span>
                    <select name="channel" className="px-2 py-1.5 rounded border border-slate-200 text-sm font-cairo">
                      <option value="all">كل القنوات</option>
                      <option value="messenger">ماسنجر</option>
                      <option value="instagram">إنستجرام</option>
                    </select>
                    <select name="status" className="px-2 py-1.5 rounded border border-slate-200 text-sm font-cairo">
                      <option value="all">كل الحالات</option>
                      <option value="open">مفتوحة</option>
                      <option value="ai_replied">رد AI</option>
                      <option value="qualified">مؤهّلة</option>
                    </select>
                    <select name="lead_quality" className="px-2 py-1.5 rounded border border-slate-200 text-sm font-cairo">
                      <option value="all">أي جودة</option>
                      <option value="hot">ساخن</option>
                      <option value="warm">دافئ</option>
                      <option value="cold">بارد</option>
                    </select>
                    <input name="tag" placeholder="تاج (اختياري)" className="w-28 px-2 py-1.5 rounded border border-slate-200 text-sm font-cairo" />
                    <button type="submit" className="px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold font-cairo text-sm">سجّل</button>
                  </form>
                </section>
              );
            })}
          </div>
        )}

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800 font-cairo leading-relaxed">
          🛡️ الرسائل بتتبعت عبر cron دوري، وبتوصل جوه نافذة 24 ساعة من آخر تفاعل للعميل (سياسة Meta).
          لو محتاج توقيت أدق من تكرار الـ cron، ممكن جدول خارجي ينده <code className="font-mono" dir="ltr">/api/cron/run-sequences</code> بمفتاح <code className="font-mono" dir="ltr">CRON_SECRET</code>.
        </div>
      </div>
    </main>
  );
}
