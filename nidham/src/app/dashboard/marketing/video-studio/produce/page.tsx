"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { VideoRenderer, type RenderScene } from "@/lib/video-renderer";

const PLATFORM_RESOLUTIONS: Record<string, { width: number; height: number }> = {
  tiktok: { width: 1080, height: 1920 },
  youtube_shorts: { width: 1080, height: 1920 },
  instagram_reels: { width: 1080, height: 1920 },
  linkedin: { width: 1920, height: 1080 },
  youtube: { width: 1920, height: 1080 },
  facebook: { width: 1920, height: 1080 },
};

const SCENE_TEMPLATES = [
  {
    id: "product_showcase",
    label: "عرض منتج",
    visual: "منتج يظهر في المنتصف بخلفية ناعمة مع تأثيرات ضوئية",
    shotType: "close_up",
  },
  {
    id: "explainer",
    label: "شرح",
    visual: "رسوم بيانية متحركة توضح الفكرة مع أيقونات",
    shotType: "wide",
  },
  {
    id: "testimonial",
    label: "شهادة عميل",
    visual: "شخص يتحدث أمام خلفية مكتبية مع شعار الشركة",
    shotType: "medium",
  },
  {
    id: "comparison",
    label: "مقارنة",
    visual: "جدول مقارنة مع علامات صح وخطأ",
    shotType: "wide",
  },
  {
    id: "call_to_action",
    label: "دعوة للإجراء",
    visual: "شاشة بخلفية جريئة مع النص الرئيسي وزر CTA",
    shotType: "detail",
  },
];

export default function VideoProducePage() {
  const [scriptJson, setScriptJson] = useState("");
  const [platform, setPlatform] = useState("tiktok");
  const [brandColor, setBrandColor] = useState("#0891b2");
  const [bgMusic, setBgMusic] = useState(false);
  const [parsedScenes, setParsedScenes] = useState<RenderScene[]>([]);
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalScenes, setTotalScenes] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [voicesReady, setVoicesReady] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<VideoRenderer | null>(null);

  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => setVoicesReady(true);
      if (window.speechSynthesis.getVoices().length > 0) setVoicesReady(true);
    }
  }, []);

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
      if (scenes.length === 0) {
        setError("مفيش مشاهد في الـ script — تأكد إنك حطيت script فيه scenes");
        return;
      }
      setParsedScenes(scenes);
      setError("");
      setVideoUrl(null);
      setProgress(0);
    } catch {
      setError("الـ JSON مش صحيح — تأكد من الفورمات");
    }
  }

  function applyTemplate(templateId: string) {
    try {
      const script = JSON.parse(scriptJson);
      const template = SCENE_TEMPLATES.find((t) => t.id === templateId);
      if (!template || !script.scenes) return;
      const firstScene = script.scenes[0];
      if (firstScene) {
        firstScene.visuals = template.visual;
        firstScene.shotType = template.shotType;
      }
      setScriptJson(JSON.stringify(script, null, 2));
    } catch {}
  }

  async function startPreview() {
    if (parsedScenes.length === 0) return;
    const res = PLATFORM_RESOLUTIONS[platform] ?? PLATFORM_RESOLUTIONS.tiktok;
    const renderer = new VideoRenderer(res.width, res.height);
    rendererRef.current = renderer;

    // Render first scene to canvas
    await renderer.renderScene(parsedScenes[0], 0, parsedScenes.length);
    const previewCanvas = previewCanvasRef.current;
    if (previewCanvas) {
      previewCanvas.width = res.width;
      previewCanvas.height = res.height;
      const ctx = previewCanvas.getContext("2d");
      ctx?.drawImage(renderer["canvas"], 0, 0, previewCanvas.width, previewCanvas.height);
    }
    setCurrentSceneIndex(0);
  }

  async function nextPreview() {
    if (!rendererRef.current) return;
    const nextIndex = currentSceneIndex + 1;
    if (nextIndex >= parsedScenes.length) return;
    await rendererRef.current.renderScene(parsedScenes[nextIndex], nextIndex, parsedScenes.length);
    const previewCanvas = previewCanvasRef.current;
    if (previewCanvas) {
      const ctx = previewCanvas.getContext("2d");
      ctx?.drawImage(rendererRef.current["canvas"], 0, 0, previewCanvas.width, previewCanvas.height);
    }
    setCurrentSceneIndex(nextIndex);
  }

  const renderVideo = useCallback(async () => {
    if (parsedScenes.length === 0) return;
    setRendering(true);
    setError("");
    setVideoUrl(null);

    try {
      const res = PLATFORM_RESOLUTIONS[platform] ?? PLATFORM_RESOLUTIONS.tiktok;
      const renderer = new VideoRenderer(res.width, res.height);

      const blob = await renderer.renderFullVideo(parsedScenes, (scene, total) => {
        setProgress(scene);
        setTotalScenes(total);
      });

      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setProgress(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل في إنشاء الفيديو");
    } finally {
      setRendering(false);
    }
  }, [parsedScenes, platform]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-slate-800">إنتاج الفيديو</h1>
        <p className="mt-1 text-sm text-slate-500">
          حول الـ script لفيلم كامل — مع voiceover بالعربي ومؤثرات بصرية
        </p>
      </div>

      {/* Script Input */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <label className="mb-2 block text-sm font-bold text-slate-700">
          لصق JSON الـ Script
        </label>
        <textarea
          value={scriptJson}
          onChange={(e) => setScriptJson(e.target.value)}
          placeholder='حط هنا JSON الـ Script اللي اتعمل من قبل كده...'
          rows={6}
          className="w-full rounded-lg border px-3 py-2 text-xs font-mono"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={parseScript}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700"
          >
            تحليل الـ Script
          </button>
          <select
            onChange={(e) => applyTemplate(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">تطبيق قالب بصري...</option>
            {SCENE_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="tiktok">TikTok (9:16)</option>
            <option value="youtube_shorts">YouTube Shorts (9:16)</option>
            <option value="instagram_reels">Instagram Reels (9:16)</option>
            <option value="linkedin">LinkedIn (16:9)</option>
            <option value="youtube">YouTube (16:9)</option>
            <option value="facebook">Facebook (16:9)</option>
          </select>
          <label className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={bgMusic}
              onChange={(e) => setBgMusic(e.target.checked)}
            />
            موسيقى خلفية
          </label>
        </div>
        {error && (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}
      </div>

      {/* Scenes list */}
      {parsedScenes.length > 0 && (
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-bold text-slate-700">
            المشاهد ({parsedScenes.length})
          </h2>
          <div className="space-y-2">
            {parsedScenes.map((scene, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-sm"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-700">
                  {scene.sceneNumber}
                </span>
                <div className="flex-1 truncate">
                  <p className="font-medium text-slate-700 truncate">
                    {scene.narration.slice(0, 60)}...
                  </p>
                  <p className="text-xs text-slate-400">
                    {scene.duration}ث · {scene.shotType ?? "بدون shot type"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview + Render */}
      {parsedScenes.length > 0 && (
        <div className="space-y-4">
          {/* Preview controls */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-bold text-slate-700">معاينة</h2>
            <div className="flex justify-center">
              <canvas
                ref={previewCanvasRef}
                className="w-full max-w-xs rounded-xl border shadow-lg"
                style={{ aspectRatio: platform === "linkedin" || platform === "youtube" || platform === "facebook" ? "16/9" : "9/16" }}
              />
            </div>
            <div className="mt-3 flex justify-center gap-2">
              <button
                onClick={startPreview}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                عرض المشهد الأول
              </button>
              {currentSceneIndex > 0 && (
                <button
                  onClick={() => {
                    setCurrentSceneIndex(0);
                    startPreview();
                  }}
                  className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200"
                >
                  إعادة
                </button>
              )}
              {currentSceneIndex < parsedScenes.length - 1 && (
                <button
                  onClick={nextPreview}
                  className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700"
                >
                  المشهد التالي ←
                </button>
              )}
            </div>
            <p className="mt-2 text-center text-xs text-slate-400">
              المشهد {currentSceneIndex + 1} من {parsedScenes.length}
            </p>
            {!voicesReady && (
              <p className="mt-2 text-center text-xs text-amber-600">
                جاري تحميل الصوتيات... انتظر لحظة
              </p>
            )}
          </div>

          {/* Render button */}
          <div className="flex justify-center">
            <button
              onClick={renderVideo}
              disabled={rendering}
              className="w-full max-w-md rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 px-8 py-4 text-lg font-black text-white shadow-xl hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 transition"
            >
              {rendering
                ? `جاري التصوير... ${progress}/${totalScenes}`
                : "🎬 تصوير الفيديو"}
            </button>
          </div>

          {/* Progress bar */}
          {rendering && (
            <div className="mx-auto max-w-md">
              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                  style={{
                    width: totalScenes > 0 ? `${(progress / totalScenes) * 100}%` : "0%",
                  }}
                />
              </div>
              <p className="mt-1 text-center text-xs text-slate-500">
                جاري إنشاء المشاهد مع voiceover...
              </p>
            </div>
          )}

          {/* Result */}
          {videoUrl && (
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-bold text-emerald-700">✓ الفيديو جاهز</h2>
              <video
                src={videoUrl}
                controls
                className="mx-auto max-w-sm rounded-xl shadow-lg"
                style={{
                  aspectRatio:
                    platform === "linkedin" || platform === "youtube" || platform === "facebook"
                      ? "16/9"
                      : "9/16",
                }}
              />
              <div className="mt-3 flex justify-center gap-3">
                <a
                  href={videoUrl}
                  download={`nidham-video-${Date.now()}.webm`}
                  className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  ⬇ تحميل الفيديو
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(videoUrl);
                  }}
                  className="rounded-lg border px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
                >
                  نسخ الرابط
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
