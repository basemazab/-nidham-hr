"use client";

import { useState } from "react";
import Link from "next/link";
import { generatePlatformAdCopy } from "@/lib/marketing-ai";
import type { AdCopyResult } from "@/lib/marketing-ai";

const PLATFORMS = [
  { id: "meta", label: "Meta Ads", icon: "📘", sub: "Facebook + Instagram" },
  { id: "google", label: "Google Ads", icon: "🔍", sub: "Search + Display" },
  { id: "tiktok", label: "TikTok Ads", icon: "🎵", sub: "In-Feed + Spark" },
  { id: "linkedin", label: "LinkedIn Ads", icon: "💼", sub: "Sponsored Content" },
];

const OBJECTIVES = ["مبيعات", "عملاء محتملين", "زيارة الموقع", "تفاعل", "وعي بالعلامة"];
const TONES = ["احترافي", "ودود", "جريء", "فكاهي", "ملهم", "عاجل"];

export default function AdCopyPage() {
  const [platform, setPlatform] = useState<string>("meta");
  const [product, setProduct] = useState("");
  const [objective, setObjective] = useState("مبيعات");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("احترافي");
  const [cta, setCta] = useState("");
  const [extra, setExtra] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AdCopyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await generatePlatformAdCopy({
        platform: platform as any,
        product: product.trim(),
        objective,
        audience: audience.trim() || "عام",
        tone,
        cta: cta.trim() || "اكتشف المزيد",
        extra_context: extra.trim() || undefined,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل التوليد");
    } finally {
      setBusy(false);
    }
  }

  const specs: Record<string, { primary: number; headline: number; desc: number }> = {
    meta: { primary: 125, headline: 27, desc: 27 },
    google: { primary: 90, headline: 30, desc: 90 },
    tiktok: { primary: 150, headline: 35, desc: 30 },
    linkedin: { primary: 150, headline: 70, desc: 70 },
  };
  const platformSpec = specs[platform] ?? specs.meta;

  return (
    <main className="flex-1 px-4 md:px-6 py-6 bg-gradient-to-b from-slate-50 via-white to-violet-50/20 min-h-screen font-cairo">
      <div className="max-w-5xl mx-auto">
        <div className="mb-4">
          <Link
            href="/dashboard/marketing"
            className="text-sm text-slate-500 hover:text-brand-cyan-dark"
          >
            ← استوديو التسويق
          </Link>
        </div>

        <header className="mb-6">
          <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-violet-100 to-fuchsia-100 border border-violet-300 text-violet-800 text-xs font-bold mb-2">
            ✍ AI Ad Copy
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-1">
            مولد النصوص الإعلانية
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
            اكتب وصف منتجك واختر المنصة — الذكاء الاصطناعي هيولّد 3 variants
            إعلانية جاهزة مع character limits مظبوطة لكل منصة.
          </p>
        </header>

        {/* Platform selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPlatform(p.id)}
              className={`text-right bg-white border-2 rounded-2xl p-4 transition hover:shadow-md ${
                platform === p.id
                  ? "border-violet-400 shadow-md bg-violet-50/30"
                  : "border-slate-200"
              }`}
            >
              <div className="text-2xl mb-1">{p.icon}</div>
              <h3 className="text-sm font-black text-slate-800">{p.label}</h3>
              <p className="text-[10px] text-slate-500">{p.sub}</p>
              <div className="mt-2 text-[9px] font-mono text-slate-400" dir="ltr">
                {specs[p.id as keyof typeof specs].primary}h / {specs[p.id as keyof typeof specs].headline}h / {specs[p.id as keyof typeof specs].desc}h
              </div>
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleGenerate} className="bg-white border-2 border-slate-200 rounded-2xl p-5 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المنتج / الخدمة <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                required
                minLength={10}
                rows={3}
                placeholder="مثلاً: ألواح WPC مقاومة للماء والرطوبة، 3 ألوان، تركب على الهيكل الحالي"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-200 outline-none text-sm resize-y"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الهدف الإعلاني</label>
              <select value={objective} onChange={(e) => setObjective(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-violet-400">
                {OBJECTIVES.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">نبرة الصوت</label>
              <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-violet-400">
                {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الجمهور المستهدف</label>
              <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="مثلاً: أصحاب منازل 25-45 سنة في مصر" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-violet-400" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">زر CTA المطلوب</label>
              <input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="مثلاً: اطلب دلوقتي" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-violet-400" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">سياق إضافي (اختياري)</label>
              <textarea value={extra} onChange={(e) => setExtra(e.target.value)} rows={2} placeholder="أي معلومات إضافية: عرض خاص، موسم، منافسين..." className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-violet-400 resize-y" />
            </div>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="mt-4 w-full px-5 py-3 rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-purple-500 text-white font-black font-cairo shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all disabled:opacity-50"
          >
            {busy ? "⏳ جاري التوليد..." : "✦ توليد النصوص الإعلانية"}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800 font-cairo">
            ⚠ {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <section className="space-y-4 mb-6">
            <h2 className="text-sm font-black text-slate-700 font-cairo">
              ✦ النتائج — {result.platform_used} · {result.variants.length} variants
            </h2>
            {result.variants.map((v, i) => {
              const angleLabels: Record<string, string> = {
                pain: "🎯 Pain Point",
                desire: "💫 Desire / Aspiration",
                "social-proof": "👥 Social Proof",
                urgency: "⏰ Urgency",
                fomo: "🔥 FOMO",
              };
              return (
                <div key={i} className="bg-white border-2 border-slate-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-violet-700 bg-violet-50 px-3 py-1 rounded-full">
                      {angleLabels[v.angle] ?? v.angle}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Variant {i + 1}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-600">النص الرئيسي</span>
                        <CharBadge current={v.char_counts.primary} max={platformSpec.primary * 2} />
                      </div>
                      <p className="text-sm text-slate-800 leading-relaxed">{v.primary_text}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-600">العنوان</span>
                          <CharBadge current={v.char_counts.headline} max={platformSpec.headline} />
                        </div>
                        <p className="text-sm font-bold text-slate-800">{v.headline}</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-600">الوصف</span>
                          <CharBadge current={v.char_counts.description} max={platformSpec.desc} />
                        </div>
                        <p className="text-sm text-slate-600">{v.description}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                      <span className="inline-block px-4 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-bold">
                        {v.cta}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

function CharBadge({ current, max }: { current: number; max: number }) {
  const pct = current / max;
  const cls = pct > 1 ? "bg-rose-100 text-rose-700" : pct > 0.9 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700";
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${cls}`}>
      {current}/{max}
    </span>
  );
}
