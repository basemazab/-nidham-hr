"use client";

// ============================================================================
// SEO Content Optimizer UI — score article vs target keyword + on-page fixes.
// ============================================================================

import { useState, useTransition } from "react";
import type { SeoOptimizeResult } from "@/lib/marketing-ai";
import { optimizeSeoAction } from "./actions";

const SEV: Record<string, { label: string; cls: string }> = {
  critical: { label: "خطير", cls: "bg-rose-100 text-rose-700 border-rose-200" },
  high: { label: "عالي", cls: "bg-orange-100 text-orange-700 border-orange-200" },
  medium: { label: "متوسط", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  low: { label: "بسيط", cls: "bg-slate-100 text-slate-600 border-slate-200" },
};

function scoreColor(s: number) {
  if (s >= 75) return "text-emerald-600";
  if (s >= 50) return "text-amber-600";
  return "text-rose-600";
}

function Check({ ok }: { ok: boolean }) {
  return (
    <span className={ok ? "text-emerald-600" : "text-rose-500"}>{ok ? "✓" : "✗"}</span>
  );
}

export function SeoOptimizerClient() {
  const [keyword, setKeyword] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [result, setResult] = useState<SeoOptimizeResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, start] = useTransition();

  function run() {
    setErr(null);
    start(async () => {
      const out = await optimizeSeoAction({ keyword, content, title });
      if (!out.ok) {
        setErr(out.error);
        setResult(null);
        return;
      }
      setResult(out.result);
    });
  }

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <div className="space-y-5">
      <section className="bg-white border-2 border-sky-200 rounded-2xl p-5">
        <div className="grid sm:grid-cols-2 gap-2 mb-3">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="الكلمة المفتاحية (مثلاً: حاسبة المرتبات)"
            className="px-3 py-2 rounded-lg border border-slate-200 focus:border-sky-400 outline-none text-sm font-cairo"
          />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="العنوان الحالي (اختياري)"
            className="px-3 py-2 rounded-lg border border-slate-200 focus:border-sky-400 outline-none text-sm font-cairo"
          />
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={7}
          placeholder="الزق نص المقال/الصفحة هنا..."
          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-sky-400 outline-none text-sm font-cairo resize-y mb-3"
        />
        <button
          onClick={run}
          disabled={loading || keyword.trim().length < 2 || content.trim().length < 50}
          className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold font-cairo text-sm"
        >
          {loading ? "بيحلّل…" : "🔍 حلّل وحسّن"}
        </button>
        {err && (
          <div className="mt-3 bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 font-cairo leading-relaxed">
            {err}
          </div>
        )}
      </section>

      {result && (
        <>
          {/* Score + keyword analysis */}
          <section className="bg-white border-2 border-slate-200 rounded-2xl p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className={`text-5xl font-black font-cairo ${scoreColor(result.overall_score)}`}>
                {result.overall_score}
                <span className="text-lg text-slate-400">/100</span>
              </div>
              <div className="text-xs text-slate-600 font-cairo space-y-1">
                <div>
                  <Check ok={result.keyword_analysis.in_title} /> الكلمة في العنوان
                </div>
                <div>
                  <Check ok={result.keyword_analysis.in_first_paragraph} /> في أول فقرة
                </div>
                <div>
                  <Check ok={result.keyword_analysis.in_headings} /> في العناوين الفرعية
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-cairo">
              تكرار الكلمة: {result.keyword_analysis.occurrences} مرة ·{" "}
              {result.keyword_analysis.density_note}
            </p>
          </section>

          {/* Suggested title + meta */}
          <section className="bg-white border-2 border-emerald-200 rounded-2xl p-5 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-500 font-cairo">عنوان مقترح</span>
                <button
                  onClick={() => copy(result.suggested_title, "title")}
                  className="text-[11px] font-bold text-emerald-700 font-cairo"
                >
                  {copied === "title" ? "✓ اتنسخ" : "📋 نسخ"}
                </button>
              </div>
              <p className="text-sm font-bold text-slate-800 font-cairo">{result.suggested_title}</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-500 font-cairo">وصف ميتا مقترح</span>
                <button
                  onClick={() => copy(result.suggested_meta_description, "meta")}
                  className="text-[11px] font-bold text-emerald-700 font-cairo"
                >
                  {copied === "meta" ? "✓ اتنسخ" : "📋 نسخ"}
                </button>
              </div>
              <p className="text-sm text-slate-700 font-cairo">{result.suggested_meta_description}</p>
            </div>
          </section>

          {/* Issues */}
          <section className="bg-white border-2 border-slate-200 rounded-2xl p-5">
            <h2 className="font-black font-cairo text-slate-800 mb-3">المشاكل والإصلاحات</h2>
            <div className="space-y-2">
              {result.issues.map((it, i) => (
                <div key={i} className="border border-slate-100 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-bold font-cairo ${SEV[it.severity]?.cls ?? SEV.low.cls}`}
                    >
                      {SEV[it.severity]?.label ?? it.severity}
                    </span>
                    <span className="text-[10px] text-slate-400 font-cairo">{it.area}</span>
                  </div>
                  <p className="text-sm text-slate-700 font-cairo mb-1">⚠️ {it.problem}</p>
                  <p className="text-sm text-emerald-700 font-cairo">✅ {it.fix}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Outline + missing subtopics */}
          <div className="grid md:grid-cols-2 gap-3">
            {result.outline_suggestion.length > 0 && (
              <section className="bg-white border-2 border-slate-200 rounded-2xl p-5">
                <h2 className="font-black font-cairo text-slate-800 mb-2">🗂️ بنية مقترحة</h2>
                <ul className="list-disc pr-5 space-y-1">
                  {result.outline_suggestion.map((h, i) => (
                    <li key={i} className="text-sm text-slate-700 font-cairo">
                      {h}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {result.missing_subtopics.length > 0 && (
              <section className="bg-white border-2 border-slate-200 rounded-2xl p-5">
                <h2 className="font-black font-cairo text-slate-800 mb-2">➕ مواضيع ناقصة</h2>
                <ul className="list-disc pr-5 space-y-1">
                  {result.missing_subtopics.map((t, i) => (
                    <li key={i} className="text-sm text-slate-700 font-cairo">
                      {t}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {result.quick_wins.length > 0 && (
            <section className="bg-sky-50 border border-sky-200 rounded-2xl p-5">
              <h2 className="font-black font-cairo text-sky-900 mb-2">⚡ مكاسب سريعة</h2>
              <ul className="list-disc pr-5 space-y-1">
                {result.quick_wins.map((q, i) => (
                  <li key={i} className="text-sm text-sky-800 font-cairo">
                    {q}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
