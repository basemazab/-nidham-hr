"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { VideoRenderer, type RenderScene } from "@/lib/video-renderer";

const PLATFORM_RESOLUTIONS: Record<string, { width: number; height: number; label: string }> = {
  tiktok: { width: 1080, height: 1920, label: "TikTok 9:16" },
  youtube_shorts: { width: 1080, height: 1920, label: "YouTube Shorts 9:16" },
  instagram_reels: { width: 1080, height: 1920, label: "Instagram Reels 9:16" },
  linkedin: { width: 1920, height: 1080, label: "LinkedIn 16:9" },
  youtube: { width: 1920, height: 1080, label: "YouTube 16:9" },
  facebook: { width: 1920, height: 1080, label: "Facebook 16:9" },
};

const SCENE_TEMPLATES = [
  { id: "product_showcase", label: "عرض منتج", visual: "منتج يظهر في المنتصف بخلفية ناعمة مع تأثيرات ضوئية", shotType: "close_up" },
  { id: "explainer", label: "شرح", visual: "رسوم بيانية متحركة توضح الفكرة مع أيقونات", shotType: "wide" },
  { id: "testimonial", label: "شهادة عميل", visual: "شخص يتحدث أمام خلفية مكتبية مع شعار الشركة", shotType: "medium" },
  { id: "comparison", label: "مقارنة", visual: "جدول مقارنة مع علامات صح وخطأ", shotType: "wide" },
  { id: "call_to_action", label: "دعوة للإجراء", visual: "شاشة بخلفية جريئة مع النص الرئيسي وزر CTA", shotType: "detail" },
];

const SAMPLE_SCRIPT = {
  title: "فيديو تعريفي - نظام موارد بشرية",
  scenes: [
    { sceneNumber: 1, narration: "مرحباً بكم في نظامنا المتكامل لإدارة الموارد البشرية", visuals: "شاشة افتتاحية بشعار الشركة وخلفية متحركة", duration: 5, shotType: "wide", textOverlay: "نظام HRMS المتكامل" },
    { sceneNumber: 2, narration: "نقدم لكم أحدث الحلول التقنية لإدارة الرواتب والموظفين", visuals: "أيقونات متحركة للرواتب والحضور تنبثق بتأثير ثلاثي الأبعاد", duration: 5, shotType: "medium", textOverlay: "حلول متكاملة" },
    { sceneNumber: 3, narration: "تابع أداء موظفيك بدقة وتحكم كامل في جميع العمليات", visuals: "لوحة تحكم مع رسوم بيانية متحركة ومؤشرات أداء", duration: 5, shotType: "detail", textOverlay: "تحليلات دقيقة" },
    { sceneNumber: 4, narration: "انضم إلى مئات الشركات التي تثق في نظامنا", visuals: "شعارات عملاء تظهر تباعاً مع تأثير دخول أنيق", duration: 5, shotType: "wide", textOverlay: "انضم إلينا اليوم" },
  ],
};

export default function VideoProducePage() {
  const [scriptJson, setScriptJson] = useState("");
  const [platform, setPlatform] = useState("tiktok");
  const [bgMusic, setBgMusic] = useState(false);
  const [parsedScenes, setParsedScenes] = useState<RenderScene[]>([]);
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalScenes, setTotalScenes] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [phase, setPhase] = useState<"idle" | "rendering" | "audio" | "done">("idle");
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<VideoRenderer | null>(null);

  function parseScript() {
    try {
      const script = JSON.parse(scriptJson);
      const scenes = (script.scenes ?? []).map((s: any, i: number) => ({
        sceneNumber: s.sceneNumber ?? i + 1,
        narration: s.narration ?? s.narrationText ?? "",
        visuals: s.visuals ?? s.visualDescription ?? "",
        duration: s.duration ?? s.timing ?? 5,
        shotType: s.shotType,
        textOverlay: s.textOverlay,
      }));
      if (scenes.length === 0) { setError("مفيش مشاهد في الـ Script"); return; }
      setParsedScenes(scenes); setError(""); setVideoUrl(null); setProgress(0); setPhase("idle");
    } catch { setError("الـ JSON مش صحيح"); }
  }

  function loadSample() {
    setScriptJson(JSON.stringify(SAMPLE_SCRIPT, null, 2));
  }

  function applyTemplate(templateId: string) {
    try {
      const script = JSON.parse(scriptJson);
      const template = SCENE_TEMPLATES.find((t) => t.id === templateId);
      if (!template || !script.scenes) return;
      const firstScene = script.scenes[0];
      if (firstScene) { firstScene.visuals = template.visual; firstScene.shotType = template.shotType; }
      setScriptJson(JSON.stringify(script, null, 2));
    } catch {}
  }

  async function previewScene(index: number) {
    if (parsedScenes.length === 0) return;
    const res = PLATFORM_RESOLUTIONS[platform] ?? PLATFORM_RESOLUTIONS.tiktok;
    const renderer = new VideoRenderer(res.width, res.height);
    rendererRef.current = renderer;
    renderer.renderStaticScene(parsedScenes[index], index, parsedScenes.length);
    const pc = previewCanvasRef.current;
    if (pc) {
      pc.width = res.width; pc.height = res.height;
      const ctx = pc.getContext("2d");
      ctx?.drawImage(renderer.getCanvas(), 0, 0, pc.width, pc.height);
    }
    setCurrentSceneIndex(index);
  }

  const renderVideo = useCallback(async () => {
    if (parsedScenes.length === 0) return;
    setRendering(true); setError(""); setVideoUrl(null); setPhase("rendering");

    try {
      const res = PLATFORM_RESOLUTIONS[platform] ?? PLATFORM_RESOLUTIONS.tiktok;
      const renderer = new VideoRenderer(res.width, res.height);

      const blob = await renderer.renderFullVideo(parsedScenes, (scene, total) => {
        setProgress(scene); setTotalScenes(total);
      }, bgMusic);

      const url = URL.createObjectURL(blob);
      setVideoUrl(url); setProgress(0); setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل في إنشاء الفيديو");
    } finally {
      setRendering(false);
    }
  }, [parsedScenes, platform, bgMusic]);

  const aspectClass = platform === "linkedin" || platform === "youtube" || platform === "facebook" ? "16/9" : "9/16";

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-slate-800">🎬 إنتاج الفيديو</h1>
        <p className="mt-1 text-sm text-slate-500">
          حول الـ Script لفيلم احترافي — مع تأثيرات بصرية وموسيقى خلفية وانتقالات سينمائية
        </p>
      </div>

      {/* Script Input */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-bold text-slate-700">لصق JSON الـ Script</label>
          <button onClick={loadSample} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200">
            تحميل نموذج
          </button>
        </div>
        <textarea
          value={scriptJson}
          onChange={(e) => setScriptJson(e.target.value)}
          placeholder='حط هنا JSON الـ Script...'
          rows={6}
          className="w-full rounded-lg border px-3 py-2 text-xs font-mono"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={parseScript} className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700">
            تحليل الـ Script
          </button>
          <select onChange={(e) => applyTemplate(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
            <option value="">تطبيق قالب بصري...</option>
            {SCENE_TEMPLATES.map((t) => (<option key={t.id} value={t.id}>{t.label}</option>))}
          </select>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
            <option value="tiktok">TikTok (9:16)</option>
            <option value="youtube_shorts">YouTube Shorts (9:16)</option>
            <option value="instagram_reels">Instagram Reels (9:16)</option>
            <option value="linkedin">LinkedIn (16:9)</option>
            <option value="youtube">YouTube (16:9)</option>
            <option value="facebook">Facebook (16:9)</option>
          </select>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm">
            <input type="checkbox" checked={bgMusic} onChange={(e) => setBgMusic(e.target.checked)} />
            موسيقى خلفية
          </label>
        </div>
        {error && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      </div>

      {/* Scenes list */}
      {parsedScenes.length > 0 && (
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-bold text-slate-700">المشاهد ({parsedScenes.length})</h2>
          <div className="space-y-2">
            {parsedScenes.map((scene, i) => (
              <div key={i}
                className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-sm cursor-pointer hover:bg-slate-100 transition"
                onClick={() => previewScene(i)}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-700">
                  {scene.sceneNumber}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-700 truncate">{scene.narration.slice(0, 70)}...</p>
                  <p className="text-xs text-slate-400">{scene.duration}ث · بصمة {scene.sceneNumber} من {parsedScenes.length}</p>
                </div>
                <span className="text-xs text-cyan-600 shrink-0">معاينة</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview + Render */}
      {parsedScenes.length > 0 && (
        <div className="space-y-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-bold text-slate-700">معاينة المشهد</h2>
            <div className="flex justify-center">
              <canvas ref={previewCanvasRef} className="w-full max-w-xs rounded-xl border shadow-lg" style={{ aspectRatio: aspectClass }} />
            </div>
            <div className="mt-3 flex justify-center gap-2">
              {parsedScenes.map((_, i) => (
                <button key={i} onClick={() => previewScene(i)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    i === currentSceneIndex ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <p className="mt-2 text-center text-xs text-slate-400">اضغط على رقم المشهد للمعاينة</p>
          </div>

          {/* Render button */}
          <div className="flex justify-center">
            <button onClick={renderVideo} disabled={rendering}
              className="w-full max-w-md rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 px-8 py-4 text-lg font-black text-white shadow-xl hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700 disabled:opacity-50 transition transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {rendering ? `🎥 جاري الإنتاج... ${progress}/${totalScenes}` : "🎬 إنتاج الفيديو"}
            </button>
          </div>

          {/* Progress bar */}
          {rendering && (
            <div className="mx-auto max-w-md text-center">
              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 transition-all duration-300"
                  style={{ width: totalScenes > 0 ? `${(progress / totalScenes) * 100}%` : "0%" }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {phase === "rendering" ? "جاري التصوير مع تأثيرات بصرية..." : "اكتمل!"}
              </p>
            </div>
          )}

          {/* Result */}
          {videoUrl && (
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-bold text-emerald-700">✓ الفيديو جاهز</h2>
              <video src={videoUrl} controls className="mx-auto max-w-sm rounded-xl shadow-lg" style={{ aspectRatio: aspectClass }} />
              <div className="mt-3 flex justify-center gap-3">
                <a href={videoUrl} download={`nidham-video-${Date.now()}.webm`}
                  className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition">
                  ⬇ تحميل الفيديو
                </a>
                <button onClick={() => navigator.clipboard.writeText(videoUrl)}
                  className="rounded-lg border px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition">
                  نسخ الرابط
                </button>
              </div>
              <p className="mt-3 text-center text-xs text-slate-400">
                الفيديو يحتوي على موسيقى خلفية {bgMusic ? "✓" : "✗"} · الصوت التعليقي يُشغل أثناء العرض
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
