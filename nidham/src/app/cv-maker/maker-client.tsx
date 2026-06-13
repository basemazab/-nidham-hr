"use client";

import { useState } from "react";
import type { CvData } from "@/lib/cv-builder";
import { CvDocument, buildCvWordHtml, CV_TEMPLATES, type CvTemplate } from "@/app/dashboard/cv-builder/cv-document";

type Review = { score: number; verdict: string; missing_keywords: string[]; fixes: string[] } | null;

export function CvMakerClient() {
  const [raw, setRaw] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [cv, setCv] = useState<CvData | null>(null);
  const [review, setReview] = useState<Review>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [showGate, setShowGate] = useState(false);
  const [template, setTemplate] = useState<CvTemplate>("classic");

  async function onFile(file: File | null) {
    if (!file) return;
    setBusy("file"); setError("");
    try {
      if (file.name.toLowerCase().endsWith(".txt")) setRaw(await file.text());
      else {
        const fd = new FormData(); fd.append("file", file);
        const r = await fetch("/api/cv/extract", { method: "POST", body: fd });
        const j = await r.json();
        if (r.ok && j.text) setRaw(j.text); else setError(j.error || "تعذّر قراءة الملف — الصق النص.");
      }
    } catch { setError("تعذّر قراءة الملف."); } finally { setBusy(""); }
  }

  async function build() {
    setError("");
    if (raw.trim().length < 30) { setError("اكتب بياناتك أو الصق سيرتك (30 حرف على الأقل)."); return; }
    setBusy("build");
    try {
      const r = await fetch("/api/cv-maker/build", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: raw, targetRole }),
      });
      const j = await r.json();
      if (r.ok && j.ok) { setCv(j.cv); setReview(j.review); }
      else setError(j.error || "حصلت مشكلة — جرّب تاني.");
    } catch { setError("مشكلة في الاتصال — جرّب تاني."); } finally { setBusy(""); }
  }

  async function unlock() {
    if (!cv) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("اكتب إيميل صحيح."); return; }
    setBusy("save"); setError("");
    try {
      const r = await fetch("/api/cv-maker/save", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv: { ...cv, _template: template }, email: email.trim() }),
      });
      const j = await r.json();
      if (r.ok && j.ok) { setUnlocked(true); setShareUrl(j.url); setShowGate(false); }
      else setError(j.error || "حصلت مشكلة — جرّب تاني.");
    } catch { setError("مشكلة في الاتصال — جرّب تاني."); } finally { setBusy(""); }
  }

  function exportWord() {
    if (!cv) return;
    const blob = new Blob(["﻿", buildCvWordHtml(cv)], { type: "application/msword" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(cv.full_name || "CV").replace(/\s+/g, "_")}.doc`;
    a.click(); URL.revokeObjectURL(a.href);
  }

  const inp = "w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-cyan font-cairo";

  return (
    <div className="space-y-6">
      {error && <div className="print:hidden p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-cairo">⚠ {error}</div>}

      {!cv && (
        <div className="print:hidden bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1 font-cairo">الوظيفة اللي بتقدّم عليها (تحسّن النتيجة)</label>
            <input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className={inp} placeholder="مثال: محاسب / مهندس مدني / Sales" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1 font-cairo">ارفع سيرتك القديمة (PDF/Word) — أو الصق بياناتك تحت</label>
            <input type="file" accept=".pdf,.docx,.txt" onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:ml-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-cyan file:text-white file:font-bold file:cursor-pointer hover:file:bg-brand-cyan-dark font-cairo" />
          </div>
          <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={6} className={inp}
            placeholder="اكتب خبرتك وتعليمك ومهاراتك بأي ترتيب — مثلاً: اسمي أحمد، محاسب 5 سنين في القاهرة، اشتغلت في شركة كذا، خريج تجارة، بعرف Excel و SAP... والـAI هيحوّلها سيرة احترافية." />
          <button type="button" onClick={build} disabled={!!busy}
            className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white font-black font-cairo shadow-lg disabled:opacity-60 transition">
            {busy === "build" ? "✨ بيبني سيرتك الاحترافية…" : busy === "file" ? "📄 بيقرا الملف…" : "✨ اعمل سيرتي الاحترافية مجانًا"}
          </button>
          <p className="text-[11px] text-slate-400 text-center font-cairo">مجانًا · بصيغة متوافقة مع أنظمة التوظيف (ATS) · بالعربي والإنجليزي</p>
        </div>
      )}

      {cv && (
        <>
          {review && (
            <div className="print:hidden bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-black tabular-nums shrink-0 ${review.score >= 75 ? "bg-emerald-100 text-emerald-700" : review.score >= 50 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>{review.score}</div>
              <div className="min-w-0">
                <div className="font-black text-slate-900 font-cairo">درجة توافق ATS: {review.score}/100</div>
                <div className="text-sm text-slate-600 font-cairo">{review.verdict}</div>
                {review.fixes.length > 0 && <div className="text-xs text-slate-500 font-cairo mt-1">💡 {review.fixes[0]}</div>}
              </div>
            </div>
          )}

          <div className="print:hidden bg-white rounded-2xl border border-slate-200 p-3 shadow-sm">
            <div className="text-xs font-bold text-slate-500 font-cairo mb-2">🎨 اختر القالب</div>
            <div className="flex flex-wrap gap-2">
              {CV_TEMPLATES.map((t) => (
                <button key={t.key} type="button" onClick={() => setTemplate(t.key)} title={t.hint}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-cairo border transition ${template === t.key ? "bg-brand-cyan-dark text-white border-brand-cyan-dark" : "bg-white text-slate-600 border-slate-300 hover:border-brand-cyan"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="print:hidden flex flex-wrap gap-2">
            <button type="button" onClick={() => { if (unlocked) window.print(); else setShowGate(true); }} className="px-4 py-2 rounded-lg bg-brand-cyan-dark text-white font-bold font-cairo text-xs">🖨️ طباعة / PDF</button>
            <button type="button" onClick={() => { if (unlocked) exportWord(); else setShowGate(true); }} className="px-4 py-2 rounded-lg bg-slate-700 text-white font-bold font-cairo text-xs">⬇️ Word</button>
            <button type="button" onClick={() => setShowGate(true)} className="px-4 py-2 rounded-lg bg-amber-500 text-white font-bold font-cairo text-xs">🌐 لينك تفاعلي</button>
            <button type="button" onClick={() => { setCv(null); setReview(null); setUnlocked(false); setShareUrl(""); }} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 font-bold font-cairo text-xs">سيرة جديدة</button>
          </div>

          {shareUrl && (
            <div className="print:hidden p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm font-cairo">
              🌐 لينك سيرتك التفاعلي (شاركه): <a href={shareUrl} target="_blank" rel="noopener" className="text-brand-cyan-dark font-bold underline break-all" dir="ltr">{shareUrl}</a>
            </div>
          )}

          {/* Email gate */}
          {showGate && !unlocked && (
            <div className="print:hidden p-5 rounded-2xl bg-cyan-50 border-2 border-cyan-200">
              <div className="font-black text-slate-900 font-cairo mb-1">📧 اكتب إيميلك علشان تحمّل سيرتك</div>
              <p className="text-xs text-slate-600 font-cairo mb-3">هنبعتلك نسخة + لينك تفاعلي تشاركه. مرة واحدة بس وتفتح كل التحميلات.</p>
              <div className="flex gap-2 flex-wrap">
                <input value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" placeholder="you@email.com" className={inp + " flex-1 min-w-[200px]"} />
                <button type="button" onClick={unlock} disabled={busy === "save"} className="px-5 py-2.5 rounded-lg bg-brand-cyan-dark text-white font-bold font-cairo text-sm disabled:opacity-60">{busy === "save" ? "..." : "افتح التحميل"}</button>
              </div>
            </div>
          )}

          <div className="bg-slate-100 rounded-2xl p-4 print:p-0 print:bg-white">
            <div className="bg-white shadow-lg mx-auto print:shadow-none" style={{ maxWidth: 760 }}>
              <CvDocument cv={cv} template={template} />
            </div>
          </div>
          <div className="hidden print:block"><CvDocument cv={cv} template={template} print /></div>
        </>
      )}
    </div>
  );
}
