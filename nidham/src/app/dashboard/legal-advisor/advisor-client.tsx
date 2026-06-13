"use client";

import { useState } from "react";
import { startCase, opineOnCase } from "./actions";
import { CASE_TYPES, LEGAL_DISCLAIMER, type InvestigationResult, type LegalOpinion } from "@/lib/legal-advisor";

type Phase = "intake" | "investigate" | "opinion";

const ESTABLISHED_UI: Record<string, { label: string; cls: string }> = {
  established: { label: "ثابتة في حق العامل", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  partially: { label: "ثابتة جزئيًا", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  not_established: { label: "غير ثابتة", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  needs_more: { label: "تحتاج أدلة أكثر", cls: "bg-sky-50 text-sky-700 border-sky-200" },
};

export function LegalAdvisorClient() {
  const [phase, setPhase] = useState<Phase>("intake");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // intake
  const [employeeName, setEmployeeName] = useState("");
  const [employeeTitle, setEmployeeTitle] = useState("");
  const [caseType, setCaseType] = useState<string>(CASE_TYPES[0].label);
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState("");

  // investigate
  const [caseId, setCaseId] = useState("");
  const [investigation, setInvestigation] = useState<InvestigationResult | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);

  // opinion
  const [opinion, setOpinion] = useState<LegalOpinion | null>(null);

  async function begin() {
    setError("");
    if (!employeeName.trim() || description.trim().length < 10) {
      setError("اكتب اسم العامل ووصف واضح للواقعة.");
      return;
    }
    setLoading(true);
    try {
      const res = await startCase({ employeeName, employeeTitle, caseType, description, evidence });
      if (res.ok) {
        setCaseId(res.caseId);
        setInvestigation(res.investigation);
        setAnswers(new Array(res.investigation.questions.length).fill(""));
        setPhase("investigate");
      } else setError(res.error);
    } catch {
      setError("مشكلة في الاتصال — جرّب تاني.");
    } finally {
      setLoading(false);
    }
  }

  async function writeOpinion() {
    if (!investigation) return;
    setError("");
    setLoading(true);
    try {
      const payload = investigation.questions.map((q, i) => ({ question: q, answer: answers[i] || "" }));
      const res = await opineOnCase({ caseId, answers: payload });
      if (res.ok) {
        setOpinion(res.opinion);
        setPhase("opinion");
      } else setError(res.error);
    } catch {
      setError("مشكلة في الاتصال — جرّب تاني.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPhase("intake");
    setEmployeeName(""); setEmployeeTitle(""); setDescription(""); setEvidence("");
    setInvestigation(null); setAnswers([]); setOpinion(null); setCaseId(""); setError("");
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="print:hidden p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-cairo">
          ⚠ {error}
        </div>
      )}

      {/* Phase 1 — intake */}
      {phase === "intake" && (
        <div className="print:hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="اسم العامل *">
              <input value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} className={inputCls} placeholder="الاسم الكامل" />
            </Field>
            <Field label="الوظيفة">
              <input value={employeeTitle} onChange={(e) => setEmployeeTitle(e.target.value)} className={inputCls} placeholder="مثال: مندوب مبيعات" />
            </Field>
          </div>
          <Field label="نوع الواقعة *">
            <select value={caseType} onChange={(e) => setCaseType(e.target.value)} className={inputCls}>
              {CASE_TYPES.map((t) => <option key={t.key} value={t.label}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="وصف الواقعة *">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={inputCls} placeholder="اشرح اللي حصل بالتفصيل: إيه، إمتى، فين، إزاي اكتشفتوه..." />
          </Field>
          <Field label="الأدلة المتاحة (اختياري)">
            <textarea value={evidence} onChange={(e) => setEvidence(e.target.value)} rows={2} className={inputCls} placeholder="كاميرات، مستندات، شهود، عجز في الخزينة..." />
          </Field>
          <button type="button" onClick={begin} disabled={loading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white font-bold font-cairo text-sm shadow-lg disabled:opacity-60 transition">
            {loading ? "⚖️ بيجهّز محضر التحقيق…" : "⚖️ ابدأ التحقيق"}
          </button>
        </div>
      )}

      {/* Phase 2 — investigation */}
      {phase === "investigate" && investigation && (
        <div className="print:hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h2 className="font-black text-slate-900 dark:text-slate-100 font-cairo mb-1">📋 محضر التحقيق مع {employeeName}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-cairo mb-4">{investigation.intro}</p>
          <ol className="space-y-4">
            {investigation.questions.map((q, i) => (
              <li key={i}>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100 font-cairo mb-1">
                  {i + 1}. {q}
                </div>
                <textarea value={answers[i] || ""} onChange={(e) => {
                  const next = [...answers]; next[i] = e.target.value; setAnswers(next);
                }} rows={2} className={inputCls} placeholder="أقوال العامل…" />
              </li>
            ))}
          </ol>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={writeOpinion} disabled={loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white font-bold font-cairo text-sm shadow-lg disabled:opacity-60 transition">
              {loading ? "⚖️ بيكتب الرأي القانوني…" : "⚖️ اكتب الرأي القانوني"}
            </button>
            <button type="button" onClick={reset} className="px-4 py-3 rounded-xl border border-slate-300 text-slate-600 font-cairo text-sm">قضية جديدة</button>
          </div>
        </div>
      )}

      {/* Phase 3 — opinion */}
      {phase === "opinion" && opinion && (
        <>
          <div className="print:hidden flex flex-wrap gap-2">
            <button type="button" onClick={() => window.print()} className="px-4 py-2 rounded-lg bg-brand-cyan-dark hover:bg-brand-cyan text-white font-bold font-cairo text-xs transition">🖨️ اطبع الرأي + المحضر</button>
            <button type="button" onClick={reset} className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold font-cairo text-xs">قضية جديدة</button>
          </div>

          {/* On-screen */}
          <div className="print:hidden space-y-4">
            <OpinionCard opinion={opinion} employeeName={employeeName} />
          </div>

          {/* Print doc */}
          <div className="hidden print:block text-black" dir="rtl">
            <div className="flex items-start justify-between border-b-2 border-slate-400 pb-3 mb-5">
              <div>
                <div className="text-lg font-black">رأي قانوني ومحضر تحقيق</div>
                <div className="text-sm">العامل: {employeeName} · نوع الواقعة: {caseType}</div>
              </div>
              <div className="text-left">
                <div className="text-lg font-black" style={{ color: "#0891b2" }}>نِظام</div>
                <div className="text-[10px] tracking-widest" style={{ color: "#C9A84C" }}>NIDHAM HR</div>
              </div>
            </div>
            <PrintOpinion opinion={opinion} />
            <p className="text-[10px] text-slate-500 mt-6 pt-2 border-t border-slate-300">{LEGAL_DISCLAIMER}</p>
          </div>
        </>
      )}
    </div>
  );
}

function OpinionCard({ opinion, employeeName }: { opinion: LegalOpinion; employeeName: string }) {
  const est = ESTABLISHED_UI[opinion.is_established] ?? ESTABLISHED_UI.needs_more;
  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
          <h2 className="font-black text-lg text-slate-900 dark:text-slate-100 font-cairo">⚖️ الرأي القانوني — {employeeName}</h2>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border font-cairo ${est.cls}`}>{est.label}</span>
        </div>
        <Section title="التكييف القانوني" body={opinion.classification} />
        <Section title="التسبيب" body={opinion.reasoning} />
        <Section title="الإجراء الموصى به" body={opinion.recommended_action} highlight />
      </div>

      <ListCard title="📜 المواد القانونية المنطبقة" items={opinion.legal_articles} />
      <ListCard title="✅ الخطوات والضمانات الإجرائية الواجبة" items={opinion.procedural_steps} />
      {opinion.warnings.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-200 dark:border-rose-800 p-5">
          <h3 className="font-black text-rose-700 dark:text-rose-300 font-cairo mb-2">🚩 تحذيرات — تجنّبها وإلا بطل الإجراء</h3>
          <ul className="space-y-1.5">{opinion.warnings.map((w, i) => <li key={i} className="text-sm text-rose-800 dark:text-rose-200 font-cairo flex gap-2"><span>•</span><span>{w}</span></li>)}</ul>
        </div>
      )}

      <DocCard title="📋 مسودة محضر التحقيق" body={opinion.investigation_record} />
      <DocCard title="📄 مسودة قرار الجزاء / الإنذار" body={opinion.penalty_decision} />

      <p className="text-xs text-slate-500 dark:text-slate-400 font-cairo bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-800">⚠️ {LEGAL_DISCLAIMER}</p>
    </>
  );
}

function PrintOpinion({ opinion }: { opinion: LegalOpinion }) {
  return (
    <div className="text-sm space-y-3">
      <p><b>التكييف القانوني:</b> {opinion.classification}</p>
      <p><b>التسبيب:</b> {opinion.reasoning}</p>
      <p><b>الإجراء الموصى به:</b> {opinion.recommended_action}</p>
      <p><b>المواد المنطبقة:</b> {opinion.legal_articles.join(" · ")}</p>
      <div><b>الإجراءات الواجبة:</b><ol className="list-decimal pr-5">{opinion.procedural_steps.map((s, i) => <li key={i}>{s}</li>)}</ol></div>
      <div style={{ breakInside: "avoid" }}><b>محضر التحقيق:</b><p className="whitespace-pre-wrap">{opinion.investigation_record}</p></div>
      <div style={{ breakInside: "avoid" }}><b>قرار الجزاء:</b><p className="whitespace-pre-wrap">{opinion.penalty_decision}</p></div>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm outline-none focus:border-brand-cyan font-cairo";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-sm font-bold text-slate-800 dark:text-slate-100 mb-1 font-cairo">{label}</label>{children}</div>;
}
function Section({ title, body, highlight }: { title: string; body: string; highlight?: boolean }) {
  return <div className={`mt-3 ${highlight ? "p-3 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800" : ""}`}><div className="text-xs font-bold text-slate-500 dark:text-slate-400 font-cairo mb-0.5">{title}</div><p className="text-sm text-slate-700 dark:text-slate-200 font-cairo leading-relaxed">{body}</p></div>;
}
function ListCard({ title, items }: { title: string; items: string[] }) {
  return <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5"><h3 className="font-black text-slate-900 dark:text-slate-100 font-cairo mb-2">{title}</h3><ul className="space-y-1.5">{items.map((s, i) => <li key={i} className="text-sm text-slate-700 dark:text-slate-200 font-cairo flex gap-2"><span className="text-brand-cyan-dark mt-0.5">✓</span><span>{s}</span></li>)}</ul></div>;
}
function DocCard({ title, body }: { title: string; body: string }) {
  return <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5"><h3 className="font-black text-slate-900 dark:text-slate-100 font-cairo mb-2">{title}</h3><p className="text-sm text-slate-700 dark:text-slate-200 font-cairo leading-relaxed whitespace-pre-wrap">{body}</p></div>;
}
