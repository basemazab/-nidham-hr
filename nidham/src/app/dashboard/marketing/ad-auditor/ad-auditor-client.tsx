"use client";

// ============================================================================
// Ad Auditor UI — paste an ad, get a scored audit + fixes + improved variants.
// ============================================================================

import { useState, useTransition } from "react";
import type { AdAudit } from "@/lib/marketing-ai";
import { auditAdAction } from "./actions";

const PLATFORMS = [
  { value: "meta", label: "Meta (فيسبوك/إنستجرام)" },
  { value: "google", label: "Google" },
  { value: "tiktok", label: "TikTok" },
  { value: "linkedin", label: "LinkedIn" },
];

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

export function AdAuditorClient() {
  const [adText, setAdText] = useState("");
  const [platform, setPlatform] = useState("meta");
  const [goal, setGoal] = useState("");
  const [product, setProduct] = useState("");
  const [audit, setAudit] = useState<AdAudit | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [loading, start] = useTransition();

  function run() {
    setErr(null);
    start(async () => {
      const out = await auditAdAction({ ad_text: adText, platform, goal, product });
      if (!out.ok) {
        setErr(out.error);
        setAudit(null);
        return;
      }
      setAudit(out.audit);
    });
  }

  async function copyVariant(text: string, i: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      setTimeout(() => setCopied((c) => (c === i ? null : c)), 1500);
    } catch {
      /* ignore clipboard block */
    }
  }

  return (
    <div className="space-y-5">
      <section className="bg-white border-2 border-amber-200 rounded-2xl p-5">
        <textarea
          value={adText}
          onChange={(e) => setAdText(e.target.value)}
          rows={5}
          placeholder="الزق نص إعلانك هنا..."
          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-amber-400 outline-none text-sm font-cairo resize-y mb-3"
        />
        <div className="grid sm:grid-cols-3 gap-2 mb-3">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 outline-none text-sm font-cairo"
          >
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="الهدف (رسائل/مبيعات...)"
            className="px-3 py-2 rounded-lg border border-slate-200 outline-none text-sm font-cairo"
          />
          <input
            type="text"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="المنتج (اختياري)"
            className="px-3 py-2 rounded-lg border border-slate-200 outline-none text-sm font-cairo"
          />
        </div>
        <button
          onClick={run}
          disabled={loading || adText.trim().length < 10}
          className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold font-cairo text-sm"
        >
          {loading ? "بيدقّق…" : "🔍 دقّق الإعلان"}
        </button>
        {err && (
          <div className="mt-3 bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 font-cairo leading-relaxed">
            {err}
          </div>
        )}
      </section>

      {audit && (
        <>
          {/* Score */}
          <section className="bg-white border-2 border-slate-200 rounded-2xl p-5 flex items-center gap-4">
            <div className={`text-5xl font-black font-cairo ${scoreColor(audit.overall_score)}`}>
              {audit.overall_score}
              <span className="text-lg text-slate-400">/100</span>
            </div>
            <p className="text-sm text-slate-700 font-cairo leading-relaxed">{audit.verdict}</p>
          </section>

          {/* Issues */}
          <section className="bg-white border-2 border-slate-200 rounded-2xl p-5">
            <h2 className="font-black font-cairo text-slate-800 mb-3">المشاكل والإصلاحات</h2>
            <div className="space-y-2">
              {audit.issues.map((it, i) => (
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

          {/* Improved variants */}
          <section className="bg-white border-2 border-emerald-200 rounded-2xl p-5">
            <h2 className="font-black font-cairo text-slate-800 mb-3">نسخ محسّنة جاهزة</h2>
            <div className="space-y-2">
              {audit.improved_variants.map((v, i) => {
                const full = `${v.primary_text}\n\n${v.headline}\n${v.cta}`;
                return (
                  <div key={i} className="bg-emerald-50/60 border border-emerald-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-emerald-700 font-cairo bg-emerald-100 px-2 py-0.5 rounded-full">
                        {v.angle}
                      </span>
                      <button
                        onClick={() => copyVariant(full, i)}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 font-cairo"
                      >
                        {copied === i ? "✓ اتنسخت" : "📋 نسخ"}
                      </button>
                    </div>
                    <p className="text-sm text-slate-700 font-cairo whitespace-pre-wrap leading-relaxed">
                      {v.primary_text}
                    </p>
                    <p className="text-sm font-bold text-slate-800 font-cairo mt-1">{v.headline}</p>
                    <p className="text-xs text-cyan-700 font-cairo mt-0.5">{v.cta}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Quick wins */}
          {audit.quick_wins.length > 0 && (
            <section className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <h2 className="font-black font-cairo text-amber-900 mb-2">⚡ مكاسب سريعة</h2>
              <ul className="list-disc pr-5 space-y-1">
                {audit.quick_wins.map((q, i) => (
                  <li key={i} className="text-sm text-amber-800 font-cairo">
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
