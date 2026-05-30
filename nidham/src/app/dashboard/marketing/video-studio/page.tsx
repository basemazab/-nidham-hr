import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canUseFeature } from "@/lib/subscriptions-server";
import { UpgradeRequired } from "@/components/upgrade-required";
import { PLATFORM_PRESETS, PIPELINE_STAGES } from "@/lib/video-studio";

export const dynamic = "force-dynamic";

export default async function VideoStudioHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!(await canUseFeature("marketing_studio"))) {
    return <UpgradeRequired feature="marketing_studio" />;
  }

  return (
    <main className="flex-1 px-4 md:px-6 py-6 bg-gradient-to-b from-slate-50 via-white to-rose-50/20 min-h-screen font-cairo">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4">
          <Link
            href="/dashboard/marketing"
            className="text-sm text-slate-500 hover:text-brand-cyan-dark"
          >
            ← العودة لاستوديو التسويق
          </Link>
        </div>

        <header className="mb-6">
          <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-rose-100 to-orange-50 border border-rose-300 text-rose-800 text-xs font-bold mb-2">
            🎬 Video Studio
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-1">
            استوديو الفيديو الذكي
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
            نظام إنتاج فيديو تسويقي متكامل — من السيناريو للنشر. استخدم
            الذكاء الاصطناعي لكتابة سيناريوهات احترافية بالعربي المصري،
            بناء لوحات القصة، وتخطيط الإنتاج. مستوحى من نظام OpenMontage
            مفتوح المصدر.
          </p>
        </header>

        {/* Platform presets */}
        <section className="mb-6">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            قوالب المنصات ← اختر منصة وابدأ
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {PLATFORM_PRESETS.map((p) => (
              <Link
                key={p.id}
                href={`/dashboard/marketing/video-studio/script?platform=${p.id}`}
                className="group bg-white border-2 border-slate-200 hover:border-rose-400 rounded-2xl p-4 transition hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="text-3xl mb-2">{p.icon}</div>
                <h3 className="text-sm font-black text-slate-800 group-hover:text-rose-700 mb-1">
                  {p.name}
                </h3>
                <p className="text-[10px] text-slate-500 leading-snug mb-1">
                  {p.resolution} · {p.aspectRatio}
                </p>
                <p className="text-[10px] text-slate-400 leading-snug">
                  {p.maxDuration}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Pipeline stages */}
        <section className="mb-6">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            مراحل الإنتاج
          </h2>
          <div className="grid sm:grid-cols-5 gap-2">
            {PIPELINE_STAGES.map((stage, idx) => (
              <div key={stage.id} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">{stage.icon}</div>
                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold mb-1">
                  {idx + 1}
                </div>
                <h3 className="text-xs font-bold text-slate-800 mb-1">{stage.name}</h3>
                <p className="text-[10px] text-slate-500 leading-snug">{stage.aiTool}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quick actions */}
        <section className="grid md:grid-cols-4 gap-4 mb-6">
          <Link
            href="/dashboard/marketing/video-studio/script"
            className="group bg-gradient-to-br from-rose-50 to-orange-50 border-2 border-rose-200 hover:border-rose-400 rounded-2xl p-5 transition hover:shadow-lg"
          >
            <div className="text-2xl mb-2">✍</div>
            <h3 className="text-sm font-black text-slate-800 group-hover:text-rose-700 mb-1">
              توليد السيناريو
            </h3>
            <p className="text-[11px] text-slate-600 leading-snug">
              AI بيكتب سيناريو فيديو كامل بالعربي المصري — اختر منصة واكتب
              وصف المنتج
            </p>
          </Link>

          <Link
            href="/dashboard/marketing/video-studio/storyboard"
            className="group bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 hover:border-violet-400 rounded-2xl p-5 transition hover:shadow-lg"
          >
            <div className="text-2xl mb-2">🎬</div>
            <h3 className="text-sm font-black text-slate-800 group-hover:text-violet-700 mb-1">
              لوحة القصة
            </h3>
            <p className="text-[11px] text-slate-600 leading-snug">
              حوّل السيناريو لـ Storyboard تفصيلي — أوصاف بصرية، أنواع
              اللقطات، حركة الكاميرا
            </p>
          </Link>

           <Link
            href="/dashboard/marketing/video-studio/plan"
            className="group bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 hover:border-emerald-400 rounded-2xl p-5 transition hover:shadow-lg"
          >
            <div className="text-2xl mb-2">🎥</div>
            <h3 className="text-sm font-black text-slate-800 group-hover:text-emerald-700 mb-1">
              خطة الإنتاج
            </h3>
            <p className="text-[11px] text-slate-600 leading-snug">
              خطة إنتاج كاملة: الـ assets, المعدات, الميزانية, الجدول
              الزمني, قائمة المراجعة
            </p>
          </Link>

          <Link
            href="/dashboard/marketing/video-studio/produce"
            className="group bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 hover:border-cyan-400 rounded-2xl p-5 transition hover:shadow-lg"
          >
            <div className="text-2xl mb-2">🎞</div>
            <h3 className="text-sm font-black text-slate-800 group-hover:text-cyan-700 mb-1">
              إنتاج الفيديو
            </h3>
            <p className="text-[11px] text-slate-600 leading-snug">
              صوّر الفيديو فعلياً — voiceover بالعربي، مؤثرات بصرية، موسيقى
              خلفية، وتحميل WebM
            </p>
          </Link>
        </section>

        {/* Presets reference table */}
        <details className="bg-white border border-slate-200 rounded-2xl">
          <summary className="cursor-pointer text-sm font-bold text-slate-700 p-5 hover:text-rose-700 transition">
            📋 مواصفات المنصات بالتفصيل
          </summary>
          <div className="px-5 pb-5 overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2 px-3 font-bold text-slate-700">المنصة</th>
                  <th className="py-2 px-3 font-bold text-slate-700">الدقة</th>
                  <th className="py-2 px-3 font-bold text-slate-700">النسبة</th>
                  <th className="py-2 px-3 font-bold text-slate-700">أقصى مدة</th>
                  <th className="py-2 px-3 font-bold text-slate-700">الأنسب لـ</th>
                </tr>
              </thead>
              <tbody>
                {PLATFORM_PRESETS.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="py-2 px-3 font-bold text-slate-800">{p.icon} {p.name}</td>
                    <td className="py-2 px-3 text-slate-600">{p.resolution}</td>
                    <td className="py-2 px-3 text-slate-600">{p.aspectRatio}</td>
                    <td className="py-2 px-3 text-slate-600">{p.maxDuration}</td>
                    <td className="py-2 px-3 text-slate-600">{p.bestFor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 grid md:grid-cols-3 gap-4">
              {PLATFORM_PRESETS.map((p) => (
                <div key={p.id} className="bg-slate-50 rounded-lg p-3">
                  <h4 className="text-xs font-bold text-slate-700 mb-1">{p.icon} {p.name}</h4>
                  <ul className="text-[10px] text-slate-600 space-y-0.5 list-disc pr-4">
                    {p.tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </details>
      </div>
    </main>
  );
}
