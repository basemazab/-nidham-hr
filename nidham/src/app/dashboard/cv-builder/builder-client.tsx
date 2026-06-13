"use client";

import { useState } from "react";
import { buildCvFromText, scoreCv, saveCv, publishCv } from "./actions";
import type { CvData, AtsReview } from "@/lib/cv-builder";
import { CvDocument, buildCvWordHtml, EMPTY_CV, CV_TEMPLATES, CV_COLORS, type CvTemplate, type CvColor } from "./cv-document";

export function CvBuilderClient() {
  const [cv, setCv] = useState<CvData>(EMPTY_CV);
  const [title, setTitle] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [raw, setRaw] = useState("");
  const [id, setId] = useState<string | null>(null);
  const [review, setReview] = useState<AtsReview | null>(null);
  const [publicUrl, setPublicUrl] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);
  const [template, setTemplate] = useState<CvTemplate>("classic");
  const [color, setColor] = useState<CvColor>("navy");

  const set = (patch: Partial<CvData>) => setCv((c) => ({ ...c, ...patch }));

  async function build() {
    setError("");
    if (raw.trim().length < 30) { setError("الصق سيرتك أو بياناتك (30 حرف على الأقل)."); return; }
    setBusy("build");
    try {
      const res = await buildCvFromText({ rawText: raw, targetRole });
      if (res.ok) { setCv(res.cv); setStarted(true); setReview(null); }
      else setError(res.error);
    } catch { setError("مشكلة في الاتصال."); } finally { setBusy(""); }
  }

  async function onFile(file: File | null) {
    if (!file) return;
    setError(""); setBusy("file");
    try {
      if (file.name.toLowerCase().endsWith(".txt")) {
        setRaw(await file.text());
      } else {
        const fd = new FormData(); fd.append("file", file);
        const r = await fetch("/api/cv/extract", { method: "POST", body: fd });
        const j = await r.json();
        if (r.ok && j.text) setRaw(j.text);
        else setError(j.error || "تعذّر قراءة الملف — الصق النص يدويًا.");
      }
    } catch { setError("تعذّر قراءة الملف."); } finally { setBusy(""); }
  }

  async function score() {
    setError(""); setBusy("score");
    try {
      const res = await scoreCv({ cv, targetRole });
      if (res.ok) setReview(res.review); else setError(res.error);
    } catch { setError("مشكلة في الاتصال."); } finally { setBusy(""); }
  }

  async function persistAndPublish() {
    setError(""); setBusy("publish");
    try {
      const s = await saveCv({ id: id ?? undefined, title: title || cv.full_name, targetRole, cv: { ...cv, _template: template, _color: color } as CvData, atsScore: review?.score ?? null, atsReview: review ?? null });
      if (!s.ok) { setError(s.error); return; }
      setId(s.id);
      const p = await publishCv({ id: s.id });
      if (p.ok) setPublicUrl(p.url); else setError(p.error);
    } catch { setError("مشكلة في الاتصال."); } finally { setBusy(""); }
  }

  function exportWord() {
    const html = buildCvWordHtml(cv, color);
    const blob = new Blob(["﻿", html], { type: "application/msword" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(cv.full_name || "CV").replace(/\s+/g, "_")}.doc`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-5">
      {error && <div className="print:hidden p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-cairo">⚠ {error}</div>}

      {/* Intake */}
      <div className="print:hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <Field label="الوظيفة المستهدفة (تحسّن درجة ATS)">
            <input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className={inp} placeholder="مثال: محاسب أول / Frontend Developer" />
          </Field>
          <Field label="ارفع CV قديم (PDF / Word / نص)">
            <input type="file" accept=".pdf,.docx,.txt" onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 dark:text-slate-300 file:ml-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-cyan file:text-white file:font-bold file:cursor-pointer hover:file:bg-brand-cyan-dark font-cairo" />
          </Field>
        </div>
        <Field label="أو الصق بياناتك / سيرتك الحالية">
          <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={5} className={inp}
            placeholder="الصق سيرتك الحالية، أو اكتب نقاط سريعة عن خبرتك وتعليمك ومهاراتك — والـAI يحوّلها لسيرة احترافية." />
        </Field>
        <button type="button" onClick={build} disabled={busy === "build" || busy === "file"}
          className="mt-3 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white font-bold font-cairo text-sm shadow-lg disabled:opacity-60 transition">
          {busy === "build" ? "✨ بيبني سيرة احترافية…" : busy === "file" ? "📄 بيقرا الملف…" : "✨ ابنِ سيرة احترافية بالـ AI"}
        </button>
        {!started && (
          <button type="button" onClick={() => setStarted(true)} className="mt-3 mr-3 px-4 py-3 rounded-xl border border-slate-300 text-slate-600 font-cairo text-sm">
            أو ابدأ من فاضي
          </button>
        )}
      </div>

      {started && (
        <>
          {/* Template + color pickers */}
          <div className="print:hidden bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 font-cairo">🎨 التصميم:</span>
              {CV_TEMPLATES.map((t) => (
                <button key={t.key} type="button" onClick={() => setTemplate(t.key)} title={t.hint}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-cairo border transition ${template === t.key ? "bg-brand-cyan-dark text-white border-brand-cyan-dark" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-brand-cyan"}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 font-cairo">اللون:</span>
              {CV_COLORS.map((col) => (
                <button key={col.key} type="button" onClick={() => setColor(col.key)} title={col.label}
                  aria-label={col.label}
                  className={`w-6 h-6 rounded-full transition ${color === col.key ? "ring-2 ring-offset-2 ring-slate-900 dark:ring-offset-slate-900" : ""}`}
                  style={{ background: col.swatch }} />
              ))}
            </div>
          </div>

          {/* Toolbar */}
          <div className="print:hidden flex flex-wrap items-center gap-2">
            <button type="button" onClick={score} disabled={busy === "score"} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-cairo text-xs disabled:opacity-60 transition">{busy === "score" ? "بيقيّم…" : "🎯 قيّم درجة ATS"}</button>
            <button type="button" onClick={() => window.print()} className="px-4 py-2 rounded-lg bg-brand-cyan-dark hover:bg-brand-cyan text-white font-bold font-cairo text-xs transition">🖨️ اطبع / PDF</button>
            <button type="button" onClick={exportWord} className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white font-bold font-cairo text-xs transition">⬇️ Word</button>
            <button type="button" onClick={persistAndPublish} disabled={busy === "publish"} className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold font-cairo text-xs disabled:opacity-60 transition">{busy === "publish" ? "بينشر…" : "🌐 نسخة تفاعلية"}</button>
          </div>

          {publicUrl && (
            <div className="print:hidden p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm font-cairo">
              🌐 نسختك التفاعلية جاهزة: <a href={publicUrl} target="_blank" rel="noopener" className="text-brand-cyan-dark font-bold underline break-all" dir="ltr">{publicUrl}</a>
            </div>
          )}

          {review && (
            <div className="print:hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center gap-4 mb-3">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-black tabular-nums ${review.score >= 75 ? "bg-emerald-100 text-emerald-700" : review.score >= 50 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>{review.score}</div>
                <div><div className="font-black text-slate-900 dark:text-slate-100 font-cairo">درجة ATS: {review.score}/100</div><div className="text-sm text-slate-600 dark:text-slate-300 font-cairo">{review.verdict}</div></div>
              </div>
              {review.missing_keywords.length > 0 && <p className="text-xs font-cairo text-slate-600 dark:text-slate-300 mb-2"><b>كلمات مفتاحية ناقصة:</b> {review.missing_keywords.join("، ")}</p>}
              {review.fixes.length > 0 && <ul className="text-sm text-slate-700 dark:text-slate-200 font-cairo space-y-1 list-disc pr-5">{review.fixes.map((f, i) => <li key={i}>{f}</li>)}</ul>}
            </div>
          )}

          {/* Editor + live preview */}
          <div className="grid lg:grid-cols-2 gap-5 print:hidden">
            <CvEditor cv={cv} set={set} setCv={setCv} title={title} setTitle={setTitle} />
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 overflow-auto">
              <div className="bg-white shadow-lg mx-auto overflow-hidden rounded" style={{ maxWidth: 720 }}><CvDocument cv={cv} template={template} color={color} /></div>
            </div>
          </div>

          {/* Print-only clean document */}
          <div className="hidden print:block"><CvDocument cv={cv} template={template} color={color} print /></div>
        </>
      )}
    </div>
  );
}

const inp = "w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm outline-none focus:border-brand-cyan font-cairo";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-sm font-bold text-slate-800 dark:text-slate-100 mb-1 font-cairo">{label}</label>{children}</div>;
}

// ── Editor ──
function CvEditor({ cv, set, setCv, title, setTitle }: { cv: CvData; set: (p: Partial<CvData>) => void; setCv: (f: (c: CvData) => CvData) => void; title: string; setTitle: (v: string) => void }) {
  const lines = (label: string, val: string[], onChange: (v: string[]) => void) => (
    <Field label={label}>
      <textarea value={val.join("\n")} onChange={(e) => onChange(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))} rows={3} className={inp} />
    </Field>
  );
  return (
    <div className="space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="الاسم"><input value={cv.full_name} onChange={(e) => set({ full_name: e.target.value })} className={inp} /></Field>
        <Field label="المسمى المهني"><input value={cv.headline} onChange={(e) => set({ headline: e.target.value })} className={inp} /></Field>
        <Field label="الإيميل"><input value={cv.email} onChange={(e) => set({ email: e.target.value })} className={inp} dir="ltr" /></Field>
        <Field label="الموبايل"><input value={cv.phone} onChange={(e) => set({ phone: e.target.value })} className={inp} dir="ltr" /></Field>
        <Field label="المكان"><input value={cv.location} onChange={(e) => set({ location: e.target.value })} className={inp} /></Field>
        <Field label="اسم الملف (داخلي)"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inp} placeholder="سيرة محمد" /></Field>
      </div>
      {lines("روابط (سطر لكل لينك)", cv.links, (v) => set({ links: v }))}
      <Field label="الملخص المهني"><textarea value={cv.summary} onChange={(e) => set({ summary: e.target.value })} rows={3} className={inp} /></Field>

      <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
        <div className="flex items-center justify-between mb-2"><span className="font-bold text-sm font-cairo">الخبرات</span>
          <button type="button" onClick={() => setCv((c) => ({ ...c, experience: [...c.experience, { role: "", company: "", location: "", period: "", bullets: [] }] }))} className="text-xs text-brand-cyan-dark font-bold">+ خبرة</button></div>
        {cv.experience.map((ex, i) => (
          <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input value={ex.role} onChange={(e) => setCv((c) => { const x = [...c.experience]; x[i] = { ...x[i], role: e.target.value }; return { ...c, experience: x }; })} placeholder="المسمى" className={inp} />
              <input value={ex.company} onChange={(e) => setCv((c) => { const x = [...c.experience]; x[i] = { ...x[i], company: e.target.value }; return { ...c, experience: x }; })} placeholder="الشركة" className={inp} />
              <input value={ex.period} onChange={(e) => setCv((c) => { const x = [...c.experience]; x[i] = { ...x[i], period: e.target.value }; return { ...c, experience: x }; })} placeholder="الفترة" className={inp} />
              <input value={ex.location} onChange={(e) => setCv((c) => { const x = [...c.experience]; x[i] = { ...x[i], location: e.target.value }; return { ...c, experience: x }; })} placeholder="المكان" className={inp} />
            </div>
            <textarea value={ex.bullets.join("\n")} onChange={(e) => setCv((c) => { const x = [...c.experience]; x[i] = { ...x[i], bullets: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) }; return { ...c, experience: x }; })} rows={3} placeholder="إنجاز لكل سطر" className={inp} />
            <button type="button" onClick={() => setCv((c) => ({ ...c, experience: c.experience.filter((_, j) => j !== i) }))} className="text-xs text-rose-500 font-bold">حذف الخبرة</button>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
        <div className="flex items-center justify-between mb-2"><span className="font-bold text-sm font-cairo">التعليم</span>
          <button type="button" onClick={() => setCv((c) => ({ ...c, education: [...c.education, { degree: "", institution: "", period: "", details: "" }] }))} className="text-xs text-brand-cyan-dark font-bold">+ مؤهل</button></div>
        {cv.education.map((ed, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 mb-2">
            <input value={ed.degree} onChange={(e) => setCv((c) => { const x = [...c.education]; x[i] = { ...x[i], degree: e.target.value }; return { ...c, education: x }; })} placeholder="المؤهل" className={inp} />
            <input value={ed.institution} onChange={(e) => setCv((c) => { const x = [...c.education]; x[i] = { ...x[i], institution: e.target.value }; return { ...c, education: x }; })} placeholder="الجهة" className={inp} />
            <input value={ed.period} onChange={(e) => setCv((c) => { const x = [...c.education]; x[i] = { ...x[i], period: e.target.value }; return { ...c, education: x }; })} placeholder="الفترة" className={inp} />
            <input value={ed.details} onChange={(e) => setCv((c) => { const x = [...c.education]; x[i] = { ...x[i], details: e.target.value }; return { ...c, education: x }; })} placeholder="تفاصيل" className={inp} />
          </div>
        ))}
      </div>

      {lines("المهارات (سطر لكل مهارة)", cv.skills, (v) => set({ skills: v }))}
      {lines("اللغات", cv.languages, (v) => set({ languages: v }))}
      {lines("الشهادات", cv.certifications, (v) => set({ certifications: v }))}
    </div>
  );
}
