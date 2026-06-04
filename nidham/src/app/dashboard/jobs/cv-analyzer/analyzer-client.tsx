"use client";

import { useState } from "react";
import type { CvAnalysisResult } from "@/lib/recruitment";

const TEST_TYPE_AR: Record<string, string> = {
  technical: "تقني",
  case_study: "حالة عملية",
  behavioral: "سلوكي",
};

export function CvAnalyzerClient() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CvAnalysisResult | null>(null);

  async function analyze() {
    setError("");
    setResult(null);
    if (!file && text.trim().length < 30) {
      setError("ارفع ملف السيرة الذاتية أو الصق نصها (30 حرف على الأقل).");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      if (file) fd.append("file", file);
      if (text.trim()) fd.append("text", text.trim());
      const res = await fetch("/api/ai/cv-analyzer", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || "فشل التحليل — جرّب تاني.");
      } else {
        setResult(json.analysis as CvAnalysisResult);
      }
    } catch {
      setError("مشكلة في الاتصال — جرّب تاني.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Input card */}
      <div className="print:hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-slate-800 dark:text-slate-100 mb-2 font-cairo">
              ارفع ملف الـ CV
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,application/pdf,image/*,text/plain"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 dark:text-slate-300 file:ml-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-cyan file:text-white file:font-bold file:cursor-pointer hover:file:bg-brand-cyan-dark font-cairo"
            />
            <p className="text-xs text-slate-400 mt-2 font-cairo">PDF أو صورة أو نص · حد أقصى 5 ميجا</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-800 dark:text-slate-100 mb-2 font-cairo">
              أو الصق نص السيرة الذاتية
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder="الصق نص الـ CV هنا…"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm outline-none focus:border-brand-cyan font-cairo resize-y"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={analyze}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white font-bold font-cairo text-sm shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? "🔍 بحلّل السيرة…" : "🔍 حلّل ورشّح"}
          </button>
          {file && <span className="text-xs text-slate-500 font-cairo truncate">{file.name}</span>}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-cairo">
            ⚠ {error}
          </div>
        )}
      </div>

      {loading && (
        <div className="print:hidden text-center py-10 text-slate-500 font-cairo">
          <div className="text-4xl mb-3 animate-pulse">🤖</div>
          الذكاء الاصطناعي بيقرا السيرة ويطابقها على وظائف شركتك…
        </div>
      )}

      {result && <Results r={result} />}
    </div>
  );
}

function Results({ r }: { r: CvAnalysisResult }) {
  const [printMode, setPrintMode] = useState<"all" | "test" | "hr">("all");
  const doPrint = (mode: "all" | "test" | "hr") => {
    setPrintMode(mode);
    // Let the print-only layout render the chosen sections, then print.
    setTimeout(() => window.print(), 80);
  };

  return (
    <>
      {/* Print toolbar (screen only) */}
      <div className="print:hidden flex flex-wrap gap-2 mb-4">
        <button type="button" onClick={() => doPrint("all")} className="px-4 py-2 rounded-lg bg-brand-cyan-dark hover:bg-brand-cyan text-white font-bold font-cairo text-xs transition">🖨️ اطبع التحليل كامل</button>
        <button type="button" onClick={() => doPrint("test")} className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold font-cairo text-xs transition">📝 اطبع اختبار المرشّح (بمساحة إجابة)</button>
        <button type="button" onClick={() => doPrint("hr")} className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold font-cairo text-xs transition">💬 اطبع أسئلة المقابلة</button>
      </div>

      {/* On-screen view (hidden when printing) */}
      <div className="space-y-5 print:hidden">
      {/* Candidate summary */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 font-cairo">{r.candidate_name}</h2>
            <p className="text-sm text-brand-cyan-dark dark:text-brand-cyan font-cairo">{r.headline}</p>
          </div>
          <div className="text-xs text-slate-500 font-cairo text-left">
            <div>الخبرة: <strong>{r.years_experience} سنة</strong></div>
            <div className="max-w-[220px]">{r.education}</div>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 font-cairo mt-3 leading-relaxed">{r.summary}</p>
        {r.key_skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {r.key_skills.map((s, i) => (
              <span key={i} className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-cairo">{s}</span>
            ))}
          </div>
        )}
      </div>

      {/* Recommended job */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300 font-cairo">🎯 الوظيفة الأنسب</div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 tabular-nums">{r.recommended_job.match_score}%</div>
        </div>
        <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 font-cairo">
          {r.recommended_job.title}
          {!r.recommended_job.is_from_company_jobs && (
            <span className="text-xs font-normal text-amber-700 dark:text-amber-400 mr-2">(مقترحة — مش من وظائف الشركة)</span>
          )}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 font-cairo mt-1 leading-relaxed">{r.recommended_job.reasoning}</p>
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <div>
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-1 font-cairo">نقاط القوة</div>
            <ul className="text-sm text-slate-600 dark:text-slate-300 font-cairo space-y-1 list-disc pr-4">
              {r.recommended_job.fit_strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div>
            <div className="text-xs font-bold text-rose-700 dark:text-rose-400 mb-1 font-cairo">الفجوات</div>
            <ul className="text-sm text-slate-600 dark:text-slate-300 font-cairo space-y-1 list-disc pr-4">
              {r.recommended_job.fit_gaps.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        </div>
        {r.other_matches.length > 0 && (
          <div className="mt-4 pt-3 border-t border-emerald-200 dark:border-emerald-800">
            <div className="text-xs font-bold text-slate-500 mb-2 font-cairo">وظائف أخرى محتملة:</div>
            <div className="flex flex-wrap gap-2">
              {r.other_matches.map((m, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-cairo">
                  {m.title} · {m.match_score}%
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Candidate test */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="font-black text-slate-900 dark:text-slate-100 font-cairo mb-1">📝 اختبار للمرشّح</h3>
        <p className="text-xs text-slate-500 font-cairo mb-4">أسئلة يجاوب عليها المرشح لاختبار جدارته — مخصصة لنشاط شركتك.</p>
        <ol className="space-y-3">
          {r.candidate_test.map((q, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-brand-cyan/10 text-brand-cyan-dark text-xs font-bold flex items-center justify-center shrink-0 font-cairo">{i + 1}</span>
              <div>
                <p className="text-sm text-slate-800 dark:text-slate-100 font-cairo">{q.question}</p>
                <p className="text-xs text-slate-400 font-cairo mt-0.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{TEST_TYPE_AR[q.type] ?? q.type}</span> · {q.skill_area}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* HR questions */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="font-black text-slate-900 dark:text-slate-100 font-cairo mb-1">💬 أسئلة للمقابلة (لك كـ HR)</h3>
        <p className="text-xs text-slate-500 font-cairo mb-4">أسئلة تناقشها مع المرشح، وكل سؤال معاه الهدف منه.</p>
        <ol className="space-y-3">
          {r.hr_questions.map((q, i) => (
            <li key={i} className="border-r-2 border-brand-cyan/30 pr-3">
              <p className="text-sm text-slate-800 dark:text-slate-100 font-cairo font-medium">{q.question}</p>
              <p className="text-xs text-slate-500 font-cairo mt-0.5">🎯 {q.purpose}</p>
            </li>
          ))}
        </ol>
      </div>

      {r.industry_tailoring_note && (
        <div className="text-xs text-slate-500 dark:text-slate-400 font-cairo bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
          🏭 {r.industry_tailoring_note}
        </div>
      )}
      </div>

      {/* Print-only document — clean A4 layout for the chosen sections */}
      <CvPrintDoc r={r} mode={printMode} />
    </>
  );
}

function CvPrintDoc({ r, mode }: { r: CvAnalysisResult; mode: "all" | "test" | "hr" }) {
  const showAnalysis = mode === "all";
  const showTest = mode === "all" || mode === "test";
  const showHr = mode === "all" || mode === "hr";
  return (
    <div className="hidden print:block text-black" dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-slate-400 pb-3 mb-5">
        <div>
          <div className="text-lg font-black">تحليل سيرة ذاتية — {r.candidate_name}</div>
          <div className="text-sm">الوظيفة المرشَّح لها: {r.recommended_job.title}</div>
        </div>
        <div className="text-left">
          <div className="text-lg font-black" style={{ color: "#0891b2" }}>نِظام</div>
          <div className="text-[10px] tracking-widest" style={{ color: "#C9A84C" }}>NIDHAM HR</div>
        </div>
      </div>

      {showAnalysis && (
        <section className="mb-6">
          <h2 className="text-base font-black mb-2">ملخّص التحليل</h2>
          <p className="text-sm mb-2 leading-relaxed">{r.summary}</p>
          <div className="text-sm space-y-1">
            <div><strong>الخبرة:</strong> {r.years_experience} سنة · <strong>التعليم:</strong> {r.education}</div>
            {r.key_skills.length > 0 && <div><strong>المهارات:</strong> {r.key_skills.join("، ")}</div>}
            <div><strong>التطابق مع {r.recommended_job.title}:</strong> {r.recommended_job.match_score}%</div>
            {r.recommended_job.fit_strengths.length > 0 && <div><strong>نقاط القوة:</strong> {r.recommended_job.fit_strengths.join("، ")}</div>}
            {r.recommended_job.fit_gaps.length > 0 && <div><strong>الفجوات:</strong> {r.recommended_job.fit_gaps.join("، ")}</div>}
          </div>
        </section>
      )}

      {showTest && (
        <section className="mb-6" style={{ breakInside: "avoid" }}>
          <h2 className="text-base font-black mb-1">اختبار المرشّح</h2>
          <div className="text-sm mb-3">الاسم: ............................　 التاريخ: ..................</div>
          <ol className="space-y-4">
            {r.candidate_test.map((q, i) => (
              <li key={i}>
                <div className="text-sm font-bold">{i + 1}. {q.question}</div>
                <div className="text-[11px] text-slate-500 mb-1">({q.skill_area})</div>
                {/* answer space */}
                <div>
                  {[0, 1, 2].map((n) => (
                    <div key={n} className="border-b border-slate-400" style={{ height: "1.6rem" }} />
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {showHr && (
        <section style={{ breakInside: "avoid" }}>
          <h2 className="text-base font-black mb-2">أسئلة المقابلة (للـ HR)</h2>
          <ol className="space-y-3">
            {r.hr_questions.map((q, i) => (
              <li key={i}>
                <div className="text-sm font-bold">{i + 1}. {q.question}</div>
                <div className="text-[11px] text-slate-500">🎯 {q.purpose}</div>
                <div className="border-b border-slate-300 mt-1" style={{ height: "1.4rem" }} />
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
