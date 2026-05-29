"use client";

import { useState } from "react";
import Link from "next/link";
import { PLATFORM_PRESETS, SHOT_TYPE_LABELS, type PlatformId, type VideoScript, type Storyboard, type StoryboardFrame } from "@/lib/video-studio";

export default function StoryboardPage() {
  const [scriptText, setScriptText] = useState("");
  const [platform, setPlatform] = useState<string>("tiktok");
  const [visualStyle, setVisualStyle] = useState("realistic");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Storyboard | null>(null);
  const [parsedScript, setParsedScript] = useState<VideoScript | null>(null);

  const selectedPlatform = PLATFORM_PRESETS.find((p) => p.id === platform);

  const tryParseScript = (): VideoScript | null => {
    try {
      return JSON.parse(scriptText) as VideoScript;
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const parsed = tryParseScript();
    if (!parsed || !parsed.scenes || parsed.scenes.length === 0) {
      setError("لصق سيناريو صالح (JSON) أو استخدم مولد السيناريو أولاً");
      return;
    }

    setParsedScript(parsed);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/video-storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: parsed,
          visualStyle,
          platform,
          additionalNotes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل التوليد");
      setResult(data.storyboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل التوليد");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 px-4 md:px-6 py-6 bg-gradient-to-b from-slate-50 via-white to-violet-50/20 min-h-screen font-cairo">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4">
          <Link
            href="/dashboard/marketing/video-studio"
            className="text-sm text-slate-500 hover:text-brand-cyan-dark"
          >
            ← العودة لاستوديو الفيديو
          </Link>
        </div>

        <header className="mb-6">
          <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-violet-100 to-purple-50 border border-violet-300 text-violet-800 text-xs font-bold mb-2">
            🎬 لوحة القصة
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-1">
            مولد لوحة القصة (Storyboard)
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            حوّل سيناريو الفيديو إلى لوحة قصة تفصيلية — أوصاف بصرية، أنواع
            اللقطات، حركة الكاميرا، والعناصر المطلوبة لكل مشهد.
          </p>
        </header>

        {error && (
          <div className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">⚠ {error}</div>
        )}

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  السيناريو (JSON) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  rows={8}
                  placeholder='الصق هنا JSON السيناريو اللي جه من مولد السيناريو...'
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-violet-400 outline-none text-sm font-mono resize-y"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  💡 استخدم مولد السيناريو أولاً، انسخ الـ JSON، والصقه هنا
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  المنصة
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-violet-400 outline-none text-sm"
                >
                  {PLATFORM_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الأسلوب البصري
                </label>
                <select
                  value={visualStyle}
                  onChange={(e) => setVisualStyle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-violet-400 outline-none text-sm"
                >
                  <option value="realistic">Realistic — تصوير حقيقي</option>
                  <option value="animated">Animated — كرتون/أنيميشن</option>
                  <option value="cinematic">Cinematic — سينمائي</option>
                  <option value="minimalist">Minimalist — بسيط وأنيق</option>
                  <option value="motion_graphics">Motion Graphics — جرافيك متحرك</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ملاحظات إضافية (اختياري)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="أي توجيهات للمخرج أو المصور..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-violet-400 outline-none text-sm resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-black shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition disabled:opacity-50"
              >
                {loading ? "✨ جاري التوليد..." : "🎬 توليد الـ Storyboard"}
              </button>
            </form>
          </div>

          {/* Result */}
          <div className="lg:col-span-3">
            {loading && (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
                <div className="text-4xl mb-3 animate-bounce">🎬</div>
                <p className="text-slate-600 font-bold">AI بيحلل السيناريو وبيكتب الـ Storyboard...</p>
                <p className="text-xs text-slate-400 mt-1">ده بياخد 20-40 ثانية</p>
              </div>
            )}

            {!loading && !result && (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
                <div className="text-5xl mb-4">🎬</div>
                <h3 className="text-lg font-black text-slate-700 mb-2">
                  الصق السيناريو واختار الأسلوب البصري
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
                  محتاج JSON السيناريو من مولد السيناريو. اختار المنصة
                  والأسلوب البصري، واضغط توليد. النظام هيكتب وصف تفصيلي لكل
                  مشهد.
                </p>
                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
                  <Link href="/dashboard/marketing/video-studio/script" className="text-violet-600 hover:text-violet-800 font-bold">
                    ← ابدأ بمولد السيناريو
                  </Link>
                </div>
              </div>
            )}

            {!loading && result && (
              <div className="space-y-4">
                <div className="bg-white border-2 border-violet-200 rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-xs font-bold text-violet-600 mb-1">
                        {selectedPlatform?.icon} {selectedPlatform?.name}
                      </div>
                      <h2 className="text-xl font-black text-slate-800">{result.title}</h2>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
                    >
                      📋 نسخ JSON
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-violet-50 rounded-lg p-3 text-center">
                      <div className="text-[10px] font-bold text-violet-700">الأسلوب</div>
                      <div className="text-xs font-black text-slate-800">{result.visualStyle}</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <div className="text-[10px] font-bold text-purple-700">المشاهد</div>
                      <div className="text-xs font-black text-slate-800">{result.frames.length}</div>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 text-center">
                      <div className="text-[10px] font-bold text-amber-700">الألوان</div>
                      <div className="flex gap-1 justify-center mt-1">
                        {result.colorPalette.map((c, i) => (
                          <span key={i} className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: c }} title={c} />
                        ))}
                      </div>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3 text-center">
                      <div className="text-[10px] font-bold text-emerald-700">الانتقالات</div>
                      <div className="text-xs font-black text-slate-800">{result.transitions}</div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{result.conceptSummary}</p>
                </div>

                {/* Frames */}
                {result.frames.map((frame) => (
                  <FrameCard key={frame.sceneNumber} frame={frame} />
                ))}

                {/* Music + Production notes */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="text-[10px] font-bold text-slate-500 mb-1">🎵 الموسيقى التصويرية</div>
                    <p className="text-sm text-slate-700">{result.musicSuggestion}</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="text-[10px] font-bold text-slate-500 mb-1">🎥 ملاحظات إنتاجية</div>
                    <p className="text-sm text-slate-700">{result.productionNotes}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={handleSubmit} className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-black transition hover:shadow-lg">
                    🔄 توليد Storyboard جديد
                  </button>
                  <Link
                    href="/dashboard/marketing/video-studio/plan"
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-center transition hover:shadow-lg"
                  >
                    🎥 خطة الإنتاج →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function FrameCard({ frame }: { frame: StoryboardFrame }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-3 text-right hover:bg-slate-50 transition"
      >
        <span className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center shrink-0">
          {frame.sceneNumber}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">
            {frame.shotDescription.slice(0, 80)}...
          </p>
          <div className="flex gap-2 mt-1">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
              {SHOT_TYPE_LABELS[frame.shotType] || frame.shotType}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
              {frame.duration}
            </span>
          </div>
        </div>
        <span className="text-slate-400">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
          <div>
            <div className="text-[10px] font-bold text-slate-500 mb-1">وصف المشهد</div>
            <p className="text-sm text-slate-700">{frame.shotDescription}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] font-bold text-slate-500 mb-1">🎥 الكاميرا</div>
              <p className="text-sm text-slate-700">{frame.cameraMovement}</p>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 mb-1">🔊 الصوت</div>
              <p className="text-sm text-slate-700">{frame.audio}</p>
            </div>
          </div>
          {frame.textOverlay && (
            <div>
              <div className="text-[10px] font-bold text-slate-500 mb-1">📝 النص على الشاشة</div>
              <p className="text-sm text-slate-700 bg-amber-50 border border-amber-200 rounded-lg p-2">{frame.textOverlay}</p>
            </div>
          )}
          <div>
            <div className="text-[10px] font-bold text-slate-500 mb-1">🎨 العناصر البصرية</div>
            <div className="flex flex-wrap gap-1">
              {frame.visualElements.map((el, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                  {el}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
