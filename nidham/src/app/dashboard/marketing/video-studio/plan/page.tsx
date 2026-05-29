"use client";

import { useState } from "react";
import Link from "next/link";
import { PLATFORM_PRESETS, type PlatformId, type Storyboard, type ProductionPlan } from "@/lib/video-studio";

const BUDGET_OPTIONS = [
  { id: "1000-5000", label: "1,000 - 5,000 EGP — إنتاج بسيط" },
  { id: "5000-15000", label: "5,000 - 15,000 EGP — إنتاج متوسط" },
  { id: "15000-50000", label: "15,000 - 50,000 EGP — إنتاج احترافي" },
  { id: "50000+", label: "50,000+ EGP — إنتاج كبير" },
];

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  essential: { label: "ضروري", color: "bg-rose-100 text-rose-800 border-rose-200" },
  important: { label: "مهم", color: "bg-amber-100 text-amber-800 border-amber-200" },
  nice_to_have: { label: "تحسيني", color: "bg-slate-100 text-slate-600 border-slate-200" },
};

export default function ProductionPlanPage() {
  const [storyboardText, setStoryboardText] = useState("");
  const [platform, setPlatform] = useState<string>("tiktok");
  const [budget, setBudget] = useState("5000-15000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProductionPlan | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    let storyboard: Storyboard;
    try {
      storyboard = JSON.parse(storyboardText) as Storyboard;
      if (!storyboard.frames || storyboard.frames.length === 0) throw new Error();
    } catch {
      setError("لصق Storyboard صالح (JSON) — استخدم مولد الـ Storyboard أولاً");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/ai/video-production-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyboard, platform, budget }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل التوليد");
      setResult(data.plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل التوليد");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 px-4 md:px-6 py-6 bg-gradient-to-b from-slate-50 via-white to-emerald-50/20 min-h-screen font-cairo">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4">
          <Link href="/dashboard/marketing/video-studio" className="text-sm text-slate-500 hover:text-brand-cyan-dark">
            ← العودة لاستوديو الفيديو
          </Link>
        </div>

        <header className="mb-6">
          <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-emerald-100 to-teal-50 border border-emerald-300 text-emerald-800 text-xs font-bold mb-2">
            🎥 خطة الإنتاج
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-1">مولد خطة الإنتاج</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            حوّل الـ Storyboard لخطة إنتاج عملية: المعدات، الـ assets، الميزانية، الفريق، والجدول الزمني.
          </p>
        </header>

        {error && (
          <div className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">⚠ {error}</div>
        )}

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الـ Storyboard (JSON) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={storyboardText}
                  onChange={(e) => setStoryboardText(e.target.value)}
                  rows={8}
                  placeholder="الصق JSON الـ Storyboard..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-400 outline-none text-sm font-mono resize-y"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  💡 استخدم مولد الـ Storyboard أولاً
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المنصة</label>
                <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-400 outline-none text-sm">
                  {PLATFORM_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الميزانية التقريبية</label>
                <select value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-400 outline-none text-sm">
                  {BUDGET_OPTIONS.map((b) => (
                    <option key={b.id} value={b.id}>{b.label}</option>
                  ))}
                </select>
              </div>

              <button type="submit" disabled={loading}
                className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition disabled:opacity-50"
              >
                {loading ? "✨ جاري التوليد..." : "🎥 توليد خطة الإنتاج"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-3">
            {loading && (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
                <div className="text-4xl mb-3 animate-bounce">🎥</div>
                <p className="text-slate-600 font-bold">AI بيحلل ويخطط الإنتاج...</p>
                <p className="text-xs text-slate-400 mt-1">ده بياخد 20-40 ثانية</p>
              </div>
            )}

            {!loading && !result && (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
                <div className="text-5xl mb-4">🎥</div>
                <h3 className="text-lg font-black text-slate-700 mb-2">خطط لإنتاج فيديو احترافي</h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
                  الصق JSON الـ Storyboard من مولد الـ Storyboard، اختار
                  المنصة والميزانية، واضغط توليد. هتاخد خطة إنتاج كاملة
                  جاهزة للتنفيذ.
                </p>
              </div>
            )}

            {!loading && result && (
              <div className="space-y-4">
                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                    <div className="text-[10px] font-bold text-emerald-700">الـ Assets</div>
                    <div className="text-lg font-black text-slate-800">{result.requiredAssets.length}</div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                    <div className="text-[10px] font-bold text-amber-700">الميزانية</div>
                    <div className="text-sm font-black text-slate-800">{result.budgetEstimate}</div>
                  </div>
                  <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-center">
                    <div className="text-[10px] font-bold text-violet-700">الفريق</div>
                    <div className="text-sm font-black text-slate-800">{result.teamNeeded.length}</div>
                  </div>
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center">
                    <div className="text-[10px] font-bold text-rose-700">قبل النشر</div>
                    <div className="text-sm font-black text-slate-800">{result.preLaunchChecklist.length}</div>
                  </div>
                </div>

                {/* Equipment */}
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">🎥 المعدات المطلوبة</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.equipmentNeeded.map((eq, i) => (
                      <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold">{eq}</span>
                    ))}
                  </div>
                </div>

                {/* Assets */}
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">📦 الـ Assets المطلوبة</h3>
                  <div className="space-y-2">
                    {result.requiredAssets.map((asset, i) => {
                      const pri = PRIORITY_LABELS[asset.priority] || PRIORITY_LABELS.nice_to_have;
                      return (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${pri.color}`}>
                            {pri.label}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800">{asset.description}</p>
                            <p className="text-[11px] text-slate-500">المصدر: {asset.source} · {asset.type}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Team + Timeline */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">👥 الفريق</h3>
                    <ul className="space-y-1">
                      {result.teamNeeded.map((t, i) => (
                        <li key={i} className="text-sm text-slate-700 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">📅 الجدول الزمني</h3>
                    <p className="text-sm text-slate-700 leading-relaxed">{result.timeline}</p>
                  </div>
                </div>

                {/* Platform requirements */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                  <h3 className="text-xs font-bold text-amber-700 uppercase mb-2">📋 متطلبات المنصة</h3>
                  <ul className="space-y-1">
                    {result.platformRequirements.map((req, i) => (
                      <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                        <span className="text-amber-500">•</span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pre-launch checklist */}
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-5">
                  <h3 className="text-xs font-bold text-rose-700 uppercase mb-2">✅ قائمة مراجعة ما قبل النشر</h3>
                  <div className="space-y-2">
                    {result.preLaunchChecklist.map((item, i) => (
                      <label key={i} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded border-rose-300 text-rose-500 focus:ring-rose-400" />
                        <span className="text-sm text-rose-900">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Budget note */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                  <h3 className="text-xs font-bold text-emerald-700 uppercase mb-2">💰 تقدير الميزانية</h3>
                  <p className="text-sm text-emerald-800 leading-relaxed">{result.budgetEstimate}</p>
                </div>

                <button onClick={handleSubmit} className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black transition hover:shadow-lg">
                  🔄 توليد خطة جديدة
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
