"use client";

import { useState } from "react";
import type { CvTranslationResult } from "@/lib/cv-translator";

export function CvTranslatorClient() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [target, setTarget] = useState<"auto" | "ar" | "en">("auto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CvTranslationResult | null>(null);

  async function translate() {
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
      fd.append("target", target);
      const res = await fetch("/api/ai/cv-translator", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || "فشلت الترجمة — جرّب تاني.");
      } else {
        setResult(json.result as CvTranslationResult);
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
              accept=".pdf,.docx,.png,.jpg,.jpeg,.webp,.txt,application/pdf,image/*,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 dark:text-slate-300 file:ml-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-cyan file:text-white file:font-bold file:cursor-pointer hover:file:bg-brand-cyan-dark font-cairo"
            />
            <p className="text-xs text-slate-400 mt-2 font-cairo">
              PDF أو Word أو صورة أو نص · حد أقصى 5 ميجا
            </p>
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

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-200 font-cairo flex items-center gap-2">
            اتجاه الترجمة:
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as "auto" | "ar" | "en")}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm outline-none focus:border-brand-cyan font-cairo"
            >
              <option value="auto">تلقائي (يكتشف اللغة)</option>
              <option value="ar">ترجم للعربي</option>
              <option value="en">ترجم للإنجليزي</option>
            </select>
          </label>
          <button
            type="button"
            onClick={translate}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white font-bold font-cairo text-sm shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? "🌐 بترجم وبحلّل…" : "🌐 ترجم وحلّل"}
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
          <div className="text-4xl mb-3 animate-pulse">🌐</div>
          الذكاء الاصطناعي بيقرا السيرة، بيترجمها بالكامل، وبيجهّز التحليل…
        </div>
      )}

      {result && <Results r={result} />}
    </div>
  );
}

function Results({ r }: { r: CvTranslationResult }) {
  const t = r.translated;
  const isRtl = r.direction === "rtl";

  return (
    <>
      {/* Toolbar (screen only) */}
      <div className="print:hidden flex flex-wrap items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 rounded-lg bg-brand-cyan-dark hover:bg-brand-cyan text-white font-bold font-cairo text-xs transition"
        >
          🖨️ اطبع الترجمة
        </button>
        <span className="text-xs text-slate-500 font-cairo">
          اللغة الأصلية: <strong>{r.detected_language}</strong>
        </span>
        <span
          className={`text-xs font-bold font-cairo px-2.5 py-1 rounded-full ${
            r.analysis.overall_score >= 70
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : r.analysis.overall_score >= 45
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}
        >
          تقييم الملف: {r.analysis.overall_score}/100
        </span>
      </div>

      <div className="space-y-5 print:hidden">
        {/* ── Translated CV ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="font-black text-slate-900 dark:text-slate-100 font-cairo mb-4">
            🌐 الترجمة الكاملة
          </h3>
          <div dir={r.direction} className={isRtl ? "font-cairo" : ""}>
            <div className="border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
              <div className="text-xl font-black text-slate-900 dark:text-slate-100">{t.name}</div>
              {t.headline && (
                <div className="text-sm text-brand-cyan-dark dark:text-brand-cyan mt-0.5">{t.headline}</div>
              )}
              {t.contact_lines.length > 0 && (
                <div className="text-xs text-slate-500 mt-2 space-y-0.5">
                  {t.contact_lines.map((c, i) => (
                    <div key={i} dir="auto">{c}</div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-5">
              {t.sections.map((sec, i) => (
                <section key={i}>
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 border-r-4 border-brand-cyan pr-2 mb-2"
                      style={!isRtl ? { borderRight: "none", borderLeft: "4px solid #06b6d4", paddingRight: 0, paddingLeft: "0.5rem" } : undefined}>
                    {sec.title}
                  </h4>
                  <div className="space-y-3">
                    {sec.entries.map((en, j) => (
                      <div key={j}>
                        {en.heading && (
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{en.heading}</div>
                        )}
                        {en.meta && <div className="text-xs text-slate-400">{en.meta}</div>}
                        {en.bullets.length > 0 && (
                          <ul className={`text-sm text-slate-600 dark:text-slate-300 mt-1 space-y-0.5 list-disc ${isRtl ? "pr-5" : "pl-5"}`}>
                            {en.bullets.map((b, k) => (
                              <li key={k}>{b}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>

        {/* ── Analysis ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="font-black text-slate-900 dark:text-slate-100 font-cairo mb-1">📊 التحليل الكامل</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-cairo leading-relaxed mb-4">{r.analysis.summary}</p>

          <div className="grid sm:grid-cols-4 gap-3 mb-4">
            <Stat label="سنين الخبرة" value={`${r.analysis.years_experience}`} />
            <Stat label="المستوى" value={r.analysis.seniority} />
            <Stat label="التعليم" value={r.analysis.education} />
            <Stat label="التقييم العام" value={`${r.analysis.overall_score}/100`} />
          </div>

          {r.analysis.key_skills.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-bold text-slate-500 mb-1.5 font-cairo">المهارات</div>
              <div className="flex flex-wrap gap-1.5">
                {r.analysis.key_skills.map((s, i) => (
                  <span key={i} className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-cairo">{s}</span>
                ))}
              </div>
            </div>
          )}

          {r.analysis.languages.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-bold text-slate-500 mb-1.5 font-cairo">اللغات</div>
              <div className="flex flex-wrap gap-1.5">
                {r.analysis.languages.map((s, i) => (
                  <span key={i} className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-900/30 text-brand-cyan-dark dark:text-brand-cyan font-cairo">{s}</span>
                ))}
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-1 font-cairo">✅ نقاط القوة</div>
              <ul className="text-sm text-slate-600 dark:text-slate-300 font-cairo space-y-1 list-disc pr-4">
                {r.analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div>
              <div className="text-xs font-bold text-rose-700 dark:text-rose-400 mb-1 font-cairo">⚠️ الفجوات</div>
              <ul className="text-sm text-slate-600 dark:text-slate-300 font-cairo space-y-1 list-disc pr-4">
                {r.analysis.gaps.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          </div>

          {r.analysis.red_flags.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
              <div className="text-xs font-bold text-rose-700 dark:text-rose-300 mb-1 font-cairo">🚩 علامات إنذار</div>
              <ul className="text-sm text-rose-800 dark:text-rose-200 font-cairo space-y-1 list-disc pr-4">
                {r.analysis.red_flags.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {r.analysis.suggested_roles.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-bold text-slate-500 mb-1.5 font-cairo">🎯 وظائف مناسبة ليه</div>
              <div className="flex flex-wrap gap-1.5">
                {r.analysis.suggested_roles.map((s, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-cairo">{s}</span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 font-cairo">
            💡 الخلاصة: {r.analysis.verdict}
          </div>
        </div>

        {/* Interview questions */}
        {r.analysis.interview_questions.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="font-black text-slate-900 dark:text-slate-100 font-cairo mb-4">💬 أسئلة مقابلة مقترحة</h3>
            <ol className="space-y-3">
              {r.analysis.interview_questions.map((q, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-cyan/10 text-brand-cyan-dark text-xs font-bold flex items-center justify-center shrink-0 font-cairo">{i + 1}</span>
                  <p className="text-sm text-slate-800 dark:text-slate-100 font-cairo">{q}</p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* ── Print-only: clean A4 of the TRANSLATION only ── */}
      <div className="hidden print:block text-black" dir={r.direction}>
        <div className="flex items-start justify-between border-b-2 border-slate-400 pb-3 mb-5" dir="rtl">
          <div>
            <div className="text-lg font-black">ترجمة سيرة ذاتية — {t.name}</div>
            <div className="text-xs text-slate-600">اللغة الأصلية: {r.detected_language}</div>
          </div>
          <div className="text-left">
            <div className="text-lg font-black" style={{ color: "#0891b2" }}>نِظام</div>
            <div className="text-[10px] tracking-widest" style={{ color: "#C9A84C" }}>NIDHAM HR</div>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-xl font-black">{t.name}</div>
          {t.headline && <div className="text-sm">{t.headline}</div>}
          {t.contact_lines.length > 0 && (
            <div className="text-xs mt-1 space-y-0.5">
              {t.contact_lines.map((c, i) => (
                <div key={i} dir="auto">{c}</div>
              ))}
            </div>
          )}
        </div>

        {t.sections.map((sec, i) => (
          <section key={i} className="mb-4" style={{ breakInside: "avoid" }}>
            <h2 className="text-base font-black border-b border-slate-300 pb-1 mb-2">{sec.title}</h2>
            <div className="space-y-2.5">
              {sec.entries.map((en, j) => (
                <div key={j}>
                  {en.heading && <div className="text-sm font-bold">{en.heading}</div>}
                  {en.meta && <div className="text-[11px] text-slate-500">{en.meta}</div>}
                  {en.bullets.length > 0 && (
                    <ul className={`text-sm mt-0.5 space-y-0.5 list-disc ${isRtl ? "pr-5" : "pl-5"}`}>
                      {en.bullets.map((b, k) => (
                        <li key={k}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="mt-6 pt-2 border-t border-slate-300 text-[10px] text-slate-500" dir="rtl">
          ترجمة آلية بواسطة نِظام — Nidham HR · nidhamhr.com
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
      <div className="text-[11px] text-slate-500 font-cairo">{label}</div>
      <div className="text-sm font-black text-slate-900 dark:text-slate-100 font-cairo mt-0.5">{value}</div>
    </div>
  );
}
