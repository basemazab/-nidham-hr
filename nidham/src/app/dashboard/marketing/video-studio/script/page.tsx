"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PLATFORM_PRESETS, type PlatformId, type VideoScript } from "@/lib/video-studio";

const TONES = [
  { id: "professional", label: "احترافي — جاد وموثوق" },
  { id: "casual", label: "عفوي — زي صاحبك بيكلمك" },
  { id: "humorous", label: "فكاهي — خفيف ظل ومضحك" },
  { id: "inspirational", label: "تحفيزي — يحرّك المشاعر" },
  { id: "dramatic", label: "درامي — عميق ومؤثر" },
  { id: "educational", label: "تعليمي — شرح وتوضيح" },
];

export default function ScriptGeneratorPage() {
  const searchParams = useSearchParams();
  const initialPlatform = searchParams.get("platform") || "";

  const [platform, setPlatform] = useState<string>(initialPlatform);
  const [productSummary, setProductSummary] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState("professional");
  const [keyMessage, setKeyMessage] = useState("");
  const [duration, setDuration] = useState(60);
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VideoScript | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedPlatform = PLATFORM_PRESETS.find((p) => p.id === platform);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!platform) {
      setError("اختر منصة");
      return;
    }
    if (productSummary.length < 10) {
      setError("وصف المنتج لازم 10 حروف على الأقل");
      return;
    }
    if (keyMessage.length < 5) {
      setError("الرسالة الأساسية مطلوبة");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/ai/video-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSummary,
          platform,
          targetAudience,
          tone,
          durationSeconds: duration,
          keyMessage,
          additionalContext: context || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل التوليد");
      setResult(data.script);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل التوليد");
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    if (!result) return;
    const text = `🎬 ${result.title}
      
⏱ المدة: ${result.totalDuration}
🎯 الجمهور: ${result.targetAudience}
💬 النبرة: ${result.moodAndTone}

📝 الـ Hook: ${result.hook}

📋 المشاهد:
${result.scenes.map((s) => `[${s.sceneNumber}] ${s.timing}
  👁 ${s.visuals}
  🎤 ${s.narration}
  ⏱ ${s.duration}
`).join("\n")}

💡 ${result.keyMessage}

🎯 CTA: ${result.cta}

📌 نصائح المنصة: ${result.platformTips}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="flex-1 px-4 md:px-6 py-6 bg-gradient-to-b from-slate-50 via-white to-rose-50/20 min-h-screen font-cairo">
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
          <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-rose-100 to-orange-50 border border-rose-300 text-rose-800 text-xs font-bold mb-2">
            ✍ توليد السيناريو
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-1">
            مولد سيناريو الفيديو
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            AI بيكتب سيناريو فيديو تسويقي كامل بالعربي المصري — اختر منصة،
            صف المنتج، وخلي النظام يكتبلك السيناريو.
          </p>
        </header>

        {error && (
          <div className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            ⚠ {error}
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  المنصة <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PLATFORM_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlatform(p.id)}
                      className={`p-2 rounded-lg border text-center transition text-xs ${
                        platform === p.id
                          ? "border-rose-400 bg-rose-50 text-rose-800 font-bold"
                          : "border-slate-200 hover:border-slate-300 text-slate-600"
                      }`}
                    >
                      <div className="text-lg">{p.icon}</div>
                      <div className="font-bold">{p.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  وصف المنتج/الخدمة <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={productSummary}
                  onChange={(e) => setProductSummary(e.target.value)}
                  rows={3}
                  required
                  minLength={10}
                  placeholder="إيه هو المنتج؟ ليه الناس عايزاه؟ إيه المشكلة اللي بيحلها..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-rose-400 outline-none text-sm resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الرسالة الأساسية <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={keyMessage}
                  onChange={(e) => setKeyMessage(e.target.value)}
                  required
                  minLength={5}
                  placeholder="إيه الحاجة اللي المفروض المشاهد يفتكرها بعد الفيديو؟"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-rose-400 outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الجمهور المستهدف
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="أصحاب شركات, ربات بيوت, شباب..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-rose-400 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المدة (ثانية)
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    min={15}
                    max={600}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-rose-400 outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  النبرة
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-rose-400 outline-none text-sm"
                >
                  {TONES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  سياق إضافي (اختياري)
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={2}
                  placeholder="عندك عرض حالياً؟ حدث خاص؟ أي تفاصيل إضافية..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-rose-400 outline-none text-sm resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-black shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 transition disabled:opacity-50"
              >
                {loading ? "✨ جاري التوليد..." : "✍ توليد السيناريو"}
              </button>
            </form>
          </div>

          {/* Result */}
          <div className="lg:col-span-3">
            {loading && (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
                <div className="text-4xl mb-3 animate-bounce">✍</div>
                <p className="text-slate-600 font-bold">AI بيكتب السيناريو...</p>
                <p className="text-xs text-slate-400 mt-1">ده بياخد 15-30 ثانية</p>
              </div>
            )}

            {!loading && !result && (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
                <div className="text-5xl mb-4">🎬</div>
                <h3 className="text-lg font-black text-slate-700 mb-2">
                  اكتب بيانات الفيديو على الشمال
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
                  اختار المنصة، اكتب وصف المنتج والرسالة الأساسية، واضغط
                  "توليد السيناريو". AI هيكتبلك سيناريو كامل بالعربي المصري
                  زي ما كبار المخرجين بيكتبوا.
                </p>
                {selectedPlatform && (
                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">
                    {selectedPlatform.icon} {selectedPlatform.name} —{" "}
                    {selectedPlatform.resolution} · {selectedPlatform.aspectRatio}
                  </div>
                )}
              </div>
            )}

            {!loading && result && (
              <div className="space-y-4">
                {/* Header */}
                <div className="bg-white border-2 border-rose-200 rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-xs font-bold text-rose-600 mb-1">
                        {selectedPlatform?.icon} {selectedPlatform?.name}
                      </div>
                      <h2 className="text-xl font-black text-slate-800">
                        {result.title}
                      </h2>
                    </div>
                    <button
                      onClick={copyAll}
                      className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-bold text-slate-700 transition"
                    >
                      {copied ? "✅ تم النسخ" : "📋 نسخ الكل"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-rose-50 rounded-lg p-3 text-center">
                      <div className="text-[10px] font-bold text-rose-700">المدة</div>
                      <div className="text-sm font-black text-slate-800">{result.totalDuration}</div>
                    </div>
                    <div className="bg-violet-50 rounded-lg p-3 text-center">
                      <div className="text-[10px] font-bold text-violet-700">الجمهور</div>
                      <div className="text-sm font-black text-slate-800">{result.targetAudience}</div>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3 text-center">
                      <div className="text-[10px] font-bold text-emerald-700">النبرة</div>
                      <div className="text-sm font-black text-slate-800">{result.moodAndTone}</div>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 text-center">
                      <div className="text-[10px] font-bold text-amber-700">المشاهد</div>
                      <div className="text-sm font-black text-slate-800">{result.scenes.length}</div>
                    </div>
                  </div>
                </div>

                {/* Hook */}
                <div className="bg-gradient-to-r from-rose-50 to-orange-50 border-r-4 border-rose-500 rounded-xl p-4">
                  <div className="text-[10px] font-bold text-rose-700 mb-1">🎣 الـ Hook</div>
                  <p className="text-base font-bold text-slate-800">{result.hook}</p>
                </div>

                {/* Scenes */}
                {result.scenes.map((scene) => (
                  <div key={scene.sceneNumber} className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center">
                        {scene.sceneNumber}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">{scene.timing}</span>
                      <span className="text-[11px] text-slate-400">· {scene.duration}</span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 mb-1">👁 المرئيات</div>
                        <p className="text-sm text-slate-700 leading-relaxed">{scene.visuals}</p>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 mb-1">🎤 النص</div>
                        <p className="text-sm text-slate-700 leading-relaxed">{scene.narration}</p>
                      </div>
                    </div>
                    {scene.notes && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-amber-600">ملاحظة: </span>
                        <span className="text-[11px] text-slate-500">{scene.notes}</span>
                      </div>
                    )}
                  </div>
                ))}

                {/* CTA + Key Message */}
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 mb-1">💡 الرسالة الأساسية</div>
                      <p className="text-sm font-bold text-slate-800">{result.keyMessage}</p>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 mb-1">🎯 CTA</div>
                      <p className="text-sm font-bold text-rose-700">{result.cta}</p>
                    </div>
                  </div>
                </div>

                {/* Platform tips */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="text-[10px] font-bold text-amber-700 mb-1">📌 نصائح المنصة</div>
                  <p className="text-sm text-amber-800">{result.platformTips}</p>
                </div>

                {/* Next steps */}
                <div className="flex gap-3">
                  <button onClick={handleSubmit} className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-black transition hover:shadow-lg">
                    🔄 توليد سيناريو جديد
                  </button>
                  <Link
                    href={`/dashboard/marketing/video-studio/storyboard`}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-black text-center transition hover:shadow-lg"
                  >
                    🎬 إنشاء Storyboard →
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
