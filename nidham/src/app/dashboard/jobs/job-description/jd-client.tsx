"use client";

import { useState } from "react";
import type { JobDescriptionResult } from "@/lib/recruitment";

export function JobDescriptionClient() {
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [jd, setJd] = useState<JobDescriptionResult | null>(null);

  async function generate() {
    setError("");
    setJd(null);
    if (title.trim().length < 2) {
      setError("اكتب المسمى الوظيفي.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/ai/job-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), department: department.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) setError(json.error || "فشل التوليد — جرّب تاني.");
      else setJd(json.jd as JobDescriptionResult);
    } catch {
      setError("مشكلة في الاتصال — جرّب تاني.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Input (screen only) */}
      <div className="print:hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-sm font-bold text-slate-800 dark:text-slate-100 mb-1 font-cairo">المسمى الوظيفي *</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً: مشرف إنتاج، محاسب، مندوب مبيعات" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm outline-none focus:border-brand-cyan font-cairo" />
          </label>
          <label className="block">
            <span className="block text-sm font-bold text-slate-800 dark:text-slate-100 mb-1 font-cairo">القسم (اختياري)</span>
            <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="مثلاً: الإنتاج، المالية" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm outline-none focus:border-brand-cyan font-cairo" />
          </label>
        </div>
        <button type="button" onClick={generate} disabled={loading} className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white font-bold font-cairo text-sm shadow-lg disabled:opacity-60 transition">
          {loading ? "📝 بجهّز التوصيف…" : "📝 ولّد التوصيف الوظيفي"}
        </button>
        {error && <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-cairo">⚠ {error}</div>}
      </div>

      {loading && (
        <div className="print:hidden text-center py-10 text-slate-500 font-cairo">
          <div className="text-4xl mb-3 animate-pulse">🤖</div>
          بكتب توصيف مخصّص لنشاط شركتك…
        </div>
      )}

      {jd && (
        <>
          {/* Toolbar (screen only) */}
          <div className="print:hidden flex items-center gap-2">
            <button type="button" onClick={() => window.print()} className="px-5 py-2.5 rounded-lg bg-brand-cyan-dark hover:bg-brand-cyan text-white font-bold font-cairo text-sm transition">🖨️ اطبع التوصيف</button>
            <span className="text-xs text-slate-400 font-cairo">جاهز للطباعة والتسليم للموظف</span>
          </div>

          {/* Screen view */}
          <div className="print:hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <JdBody jd={jd} />
            {jd.industry_note && (
              <div className="text-xs text-slate-500 dark:text-slate-400 font-cairo bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-800 mt-4">
                🏭 {jd.industry_note}
              </div>
            )}
          </div>

          {/* Print-only formal document */}
          <div className="hidden print:block text-black" dir="rtl">
            <div className="flex items-start justify-between border-b-2 border-slate-400 pb-3 mb-5">
              <div className="text-lg font-black">توصيف وظيفي</div>
              <div className="text-left">
                <div className="text-lg font-black" style={{ color: "#0891b2" }}>نِظام</div>
                <div className="text-[10px] tracking-widest" style={{ color: "#C9A84C" }}>NIDHAM HR</div>
              </div>
            </div>
            <JdBody jd={jd} print />
            {/* Signature lines */}
            <div className="grid grid-cols-2 gap-8 mt-10 text-sm">
              <div>
                <div className="border-b border-slate-400 h-8 mb-1" />
                توقيع الموظف
              </div>
              <div>
                <div className="border-b border-slate-400 h-8 mb-1" />
                توقيع المسؤول المباشر
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function JdBody({ jd, print }: { jd: JobDescriptionResult; print?: boolean }) {
  const titleCls = print ? "text-lg font-black text-black" : "text-xl font-black text-slate-900 dark:text-slate-100 font-cairo";
  const h = print ? "text-base font-black text-black mt-4 mb-1" : "text-sm font-black text-brand-cyan-dark dark:text-brand-cyan mt-4 mb-1 font-cairo";
  const body = print ? "text-sm text-black" : "text-sm text-slate-700 dark:text-slate-300 font-cairo";
  return (
    <div>
      <h2 className={titleCls}>{jd.job_title}</h2>
      <div className={`${body} mt-0.5`}><strong>يتبع:</strong> {jd.reports_to}</div>

      <h3 className={h}>الغرض من الوظيفة</h3>
      <p className={`${body} leading-relaxed`}>{jd.job_purpose}</p>

      <h3 className={h}>المهام والمسؤوليات</h3>
      <ol className={`${body} list-decimal pr-5 space-y-1 leading-relaxed`}>
        {jd.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
      </ol>

      <h3 className={h}>المؤهلات والمهارات المطلوبة</h3>
      <ul className={`${body} list-disc pr-5 space-y-1`}>
        {jd.qualifications.map((q, i) => <li key={i}>{q}</li>)}
      </ul>

      <h3 className={h}>مؤشرات الأداء (KPIs)</h3>
      <ul className={`${body} list-disc pr-5 space-y-1`}>
        {jd.kpis.map((k, i) => <li key={i}>{k}</li>)}
      </ul>
    </div>
  );
}
