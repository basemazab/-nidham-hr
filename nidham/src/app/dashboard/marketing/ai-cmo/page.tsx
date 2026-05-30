"use client";

import { useState } from "react";
import Link from "next/link";
import { runCMOFullAnalysis } from "../actions";
import type { CMOAnalysisResult } from "../actions";
import type { BrandProfile, SEOAudit, GEOAnalysis, ContentStrategy, SocialPlan, FullMarketingPlan } from "@/lib/marketing-ai";

const STEPS = [
  { key: "brandProfile", label: "العلامة التجارية", icon: "🏷️" },
  { key: "seoAudit", label: "تحليل SEO", icon: "🔍" },
  { key: "geoAnalysis", label: "ظهور AI", icon: "🤖" },
  { key: "contentStrategy", label: "استراتيجية المحتوى", icon: "📝" },
  { key: "socialPlan", label: "السوشيال ميديا", icon: "📱" },
  { key: "fullPlan", label: "الخطة التسويقية", icon: "🎯" },
];

export default function AICMOPage() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [result, setResult] = useState<CMOAnalysisResult | null>(null);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setProgress([]);
    setResult(null);

    // Show progress as each step completes (server action returns all at once)
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev.length >= STEPS.length) { clearInterval(timer); return prev; }
        return [...prev, STEPS[prev.length].label];
      });
    }, 3000);

    try {
      const res = await runCMOFullAnalysis(url.trim());
      clearInterval(timer);
      setProgress(STEPS.map((s) => s.label));
      setResult(res);
    } catch {
      clearInterval(timer);
      setResult({ brandProfile: null, seoAudit: null, geoAnalysis: null, contentStrategy: null, socialPlan: null, fullPlan: null, error: "حدث خطأ أثناء التحليل" });
    } finally {
      setBusy(false);
      clearInterval(timer);
    }
  }

  return (
    <main className="flex-1 px-4 md:px-6 py-6 bg-gradient-to-b from-slate-50 via-white to-violet-50/20 min-h-screen font-cairo">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4">
          <Link href="/dashboard/marketing" className="text-sm text-slate-500 hover:text-brand-cyan-dark">
            ← استوديو التسويق
          </Link>
        </div>

        <header className="mb-6">
          <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-violet-100 to-fuchsia-100 border border-violet-300 text-violet-800 text-xs font-bold mb-2">
            🧠 AI CMO
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-1">
            المدير التسويقي الذكي
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed max-w-3xl">
            زي Okara.ai — حط رابط موقعك، والنظام يحلله بـ 6 وكلاء AI: 
            SEO, GEO, محتوى, سوشيال ميديا, وخطة تسويق متكاملة. 
            كل ده باستخدام Groq/Gemini بتوعنا.
          </p>
        </header>

        {/* URL Input */}
        <form onSubmit={handleAnalyze} className="bg-white border-2 border-slate-200 rounded-2xl p-5 mb-6">
          <label className="block text-xs font-bold text-slate-700 mb-1 font-cairo">
            رابط الموقع الإلكتروني <span className="text-rose-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              type="url"
              required
              dir="ltr"
              placeholder="https://example.com"
              className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-200 outline-none text-sm font-mono"
            />
            <button
              type="submit"
              disabled={busy}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-purple-500 text-white font-black font-cairo shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all disabled:opacity-50"
            >
              {busy ? "⏳ جاري..." : "✦ تحليل"}
            </button>
          </div>
        </form>

        {/* Progress */}
        {busy && (
          <div className="bg-white border-2 border-violet-200 rounded-2xl p-5 mb-6">
            <h3 className="text-sm font-black text-slate-700 mb-3 font-cairo">⏳ جاري تشغيل وكلاء AI...</h3>
            <div className="space-y-2">
              {STEPS.map((s, i) => {
                const done = progress.includes(s.label);
                return (
                  <div key={s.key} className={`flex items-center gap-3 ${done ? "text-emerald-700" : "text-slate-400"}`}>
                    <span className="text-lg">{done ? "✅" : "⏳"}</span>
                    <div className="flex-1">
                      <div className="text-sm font-bold font-cairo">{s.icon} {s.label}</div>
                    </div>
                    {done && <span className="text-[10px] font-bold font-cairo">تم</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error */}
        {result?.error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800 font-cairo">
            ⚠ {result.error}
          </div>
        )}

        {/* Results */}
        {result && !result.error && (
          <div className="space-y-6">
            {/* 1. Brand Profile */}
            {result.brandProfile && <BrandProfileCard profile={result.brandProfile} />}

            {/* 2. SEO Audit */}
            {result.seoAudit && <SEOCard audit={result.seoAudit} />}

            {/* 3. GEO Analysis */}
            {result.geoAnalysis && <GEOCard geo={result.geoAnalysis} />}

            {/* 4. Content Strategy */}
            {result.contentStrategy && <ContentCard content={result.contentStrategy} />}

            {/* 5. Social Plan */}
            {result.socialPlan && <SocialCard social={result.socialPlan} />}

            {/* 6. Full Plan */}
            {result.fullPlan && <FullPlanCard plan={result.fullPlan} />}
          </div>
        )}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Brand Profile Card
// ---------------------------------------------------------------------------
function BrandProfileCard({ profile }: { profile: BrandProfile }) {
  return (
    <Section icon="🏷️" title="العلامة التجارية" gradient="from-violet-100 to-fuchsia-100 border-violet-300">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>{profile.brand_name}</Label>
          <p className="text-lg font-black text-slate-800 font-cairo">{profile.tagline}</p>
          <p className="text-sm text-slate-600 mt-1 font-cairo">{profile.description}</p>
        </div>
        <div className="space-y-2">
          <BadgeList title="الصناعة" items={[profile.industry]} />
          <BadgeList title="نبرة الصوت" items={[profile.tone_of_voice]} />
        </div>
        <div>
          <BadgeList title="الجمهور المستهدف" items={profile.target_audience} />
        </div>
        <div>
          <BadgeList title="نقاط القوة" items={profile.unique_selling_points} />
        </div>
        <div>
          <BadgeList title="المنافسون" items={profile.competitors} />
        </div>
        <div>
          <BadgeList title="القنوات المقترحة" items={profile.suggested_channels} />
        </div>
        <div className="md:col-span-2">
          <BadgeList title="فرص تسويقية" items={profile.marketing_gaps} />
        </div>
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// SEO Card
// ---------------------------------------------------------------------------
function SEOCard({ audit }: { audit: SEOAudit }) {
  return (
    <Section icon="🔍" title="تحليل SEO" gradient="from-sky-100 to-blue-100 border-sky-300">
      <div className="mb-4">
        <ScoreBar label="النتيجة الإجمالية" score={audit.overall_score} />
      </div>
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <MiniScore label="Title Tag" score={audit.title_tag.score} detail={audit.title_tag.recommendation} />
        <MiniScore label="Meta Description" score={audit.meta_description.score} detail={audit.meta_description.recommendation} />
        <MiniScore label="الـ Headings" score={audit.headings.structure_score} detail={audit.headings.recommendation} />
        <MiniScore label="جودة المحتوى" score={audit.content_quality.score} detail={audit.content_quality.recommendation} />
      </div>
      <div className="mb-4">
        <h4 className="text-xs font-bold text-slate-700 mb-2 font-cairo">🔑 الكلمات المفتاحية المقترحة</h4>
        <div className="flex flex-wrap gap-2">
          {audit.keywords.map((kw, i) => (
            <span key={i} className={`text-[10px] px-2 py-1 rounded-full font-bold font-cairo ${kw.priority === "high" ? "bg-emerald-100 text-emerald-700" : kw.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
              {kw.keyword}
            </span>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-xs font-bold text-slate-700 mb-2 font-cairo">⚡ تحسينات سريعة</h4>
        <ul className="list-disc pr-5 space-y-1">
          {audit.quick_wins.map((qw, i) => (
            <li key={i} className="text-xs text-slate-600 font-cairo">{qw}</li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// GEO Card
// ---------------------------------------------------------------------------
function GEOCard({ geo }: { geo: GEOAnalysis }) {
  return (
    <Section icon="🤖" title="الظهور في محركات AI (GEO)" gradient="from-emerald-100 to-teal-100 border-emerald-300">
      <div className="mb-4">
        <ScoreBar label="GEO Score" score={geo.geo_score} />
      </div>
      <p className="text-sm text-slate-600 mb-4 font-cairo">{geo.visibility_summary}</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <MiniScore label="ChatGPT" score={geo.chatgpt_visibility.score} detail={geo.chatgpt_visibility.recommendation.slice(0, 60)} />
        <MiniScore label="Perplexity" score={geo.perplexity_visibility.score} detail={geo.perplexity_visibility.recommendation.slice(0, 60)} />
        <MiniScore label="Gemini" score={geo.gemini_visibility.score} detail={geo.gemini_visibility.recommendation.slice(0, 60)} />
        <MiniScore label="Claude" score={geo.claude_visibility.score} detail={geo.claude_visibility.recommendation.slice(0, 60)} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-bold text-slate-700 mb-2 font-cairo">💡 نصائح التحسين</h4>
          <ul className="list-disc pr-5 space-y-1">
            {geo.optimization_tips.map((t, i) => <li key={i} className="text-xs text-slate-600 font-cairo">{t}</li>)}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-700 mb-2 font-cairo">📄 محتوى مطلوب للظهور في AI</h4>
          <ul className="list-disc pr-5 space-y-1">
            {geo.content_types_needed.map((c, i) => <li key={i} className="text-xs text-slate-600 font-cairo">{c}</li>)}
          </ul>
        </div>
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Content Strategy Card
// ---------------------------------------------------------------------------
function ContentCard({ content }: { content: ContentStrategy }) {
  return (
    <Section icon="📝" title="استراتيجية المحتوى" gradient="from-amber-100 to-orange-100 border-amber-300">
      <div className="space-y-4 mb-4">
        {content.content_pillars.map((p, i) => (
          <div key={i} className="bg-slate-50 rounded-xl p-4">
            <h4 className="text-sm font-black text-slate-800 mb-2 font-cairo">{p.pillar}</h4>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {p.topics.map((t, j) => <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 font-cairo">{t}</span>)}
            </div>
            <div className="text-[10px] text-slate-500 font-cairo">
              📍 {p.target_platform} · {p.recommended_formats.join("، ")}
            </div>
          </div>
        ))}
      </div>
      <div className="mb-4">
        <h4 className="text-xs font-bold text-slate-700 mb-2 font-cairo">📅 التقويم التحريري (أسبوعين)</h4>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {content.content_calendar.map((c, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-lg p-2.5">
              <div className="text-[9px] text-violet-600 font-bold font-cairo">{c.day}</div>
              <div className="text-xs font-bold text-slate-800 font-cairo truncate">{c.topic}</div>
              <div className="text-[9px] text-slate-500 font-cairo">{c.format} · {c.platform}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-bold text-slate-700 mb-2 font-cairo">💡 أفكار مقالات</h4>
          {content.blog_ideas.map((b, i) => (
            <div key={i} className="mb-2 p-2 bg-white border border-slate-200 rounded-lg">
              <div className="text-xs font-bold text-slate-800 font-cairo">{b.title}</div>
              <div className="text-[10px] text-slate-500 font-cairo">{b.seo_keyword} · ~{b.estimated_word_count} كلمة</div>
            </div>
          ))}
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-700 mb-2 font-cairo">🔍 ثغرات محتوى</h4>
          <ul className="list-disc pr-5 space-y-1">
            {content.content_gaps.map((g, i) => <li key={i} className="text-xs text-slate-600 font-cairo">{g}</li>)}
          </ul>
        </div>
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Social Plan Card
// ---------------------------------------------------------------------------
function SocialCard({ social }: { social: SocialPlan }) {
  return (
    <Section icon="📱" title="خطة السوشيال ميديا" gradient="from-rose-100 to-pink-100 border-rose-300">
      <div className="grid md:grid-cols-3 gap-4">
        <SocialPlatformCard icon="🐦" name="X (Twitter)" strategy={social.x_plan.strategy} posts={social.x_plan.posts} />
        <SocialPlatformCard icon="💼" name="LinkedIn" strategy={social.linkedin_plan.strategy} posts={social.linkedin_plan.posts} />
        <SocialPlatformCard icon="👽" name="Reddit" strategy={social.reddit_plan.strategy} posts={social.reddit_plan.posts} subreddits={social.reddit_plan.subreddits} />
      </div>
    </Section>
  );
}

function SocialPlatformCard({ icon, name, strategy, posts, subreddits }: { icon: string; name: string; strategy: string; posts: { platform: string; variant: string; post_text: string }[]; subreddits?: string[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <h4 className="text-sm font-black text-slate-800 font-cairo">{name}</h4>
      </div>
      <p className="text-[11px] text-slate-500 mb-3 font-cairo">{strategy}</p>
      {subreddits && (
        <div className="flex flex-wrap gap-1 mb-3">
          {subreddits.map((s, i) => <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 font-mono">{s}</span>)}
        </div>
      )}
      <div className="space-y-2">
        {posts.slice(0, 3).map((p, i) => (
          <div key={i} className="text-[10px] bg-slate-50 rounded-lg p-2 text-slate-700 font-cairo leading-relaxed">
            <span className="font-bold text-violet-600">{p.variant}: </span>
            {p.post_text.slice(0, 120)}...
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Full Plan Card
// ---------------------------------------------------------------------------
function FullPlanCard({ plan }: { plan: FullMarketingPlan }) {
  return (
    <Section icon="🎯" title="الخطة التسويقية المتكاملة" gradient="from-indigo-100 to-purple-100 border-indigo-300">
      <div className="p-4 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl mb-4 border border-violet-200">
        <h4 className="text-xs font-bold text-violet-800 mb-1 font-cairo">📋 ملخص تنفيذي</h4>
        <p className="text-sm text-slate-700 font-cairo">{plan.executive_summary}</p>
      </div>

      <div className="mb-4">
        <h4 className="text-xs font-bold text-slate-700 mb-2 font-cairo">📍 الموقع التسويقي</h4>
        <p className="text-sm text-slate-600 font-cairo">{plan.brand_positioning}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        {plan.channel_strategy.map((c, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-black text-slate-800 font-cairo">{c.channel}</h4>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold font-cairo ${c.priority === "primary" ? "bg-emerald-100 text-emerald-700" : c.priority === "secondary" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                {c.priority === "primary" ? "أساسي" : c.priority === "secondary" ? "ثانوي" : "تجريبي"}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mb-1 font-cairo">الميزانية: {c.budget_percent}%</div>
            <ul className="list-disc pr-4 space-y-0.5">
              {c.tactics.map((t, j) => <li key={j} className="text-[10px] text-slate-600 font-cairo">{t}</li>)}
            </ul>
            <div className="mt-1 text-[9px] text-slate-400 font-cairo">KPI: {c.kpis.join("، ")}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-sky-50 rounded-xl border border-sky-200">
          <h4 className="text-xs font-bold text-sky-800 mb-1 font-cairo">🔍 أولويات SEO</h4>
          <ul className="list-disc pr-4 space-y-0.5">
            {plan.seo_priorities.map((s, i) => <li key={i} className="text-[11px] text-slate-700 font-cairo">{s}</li>)}
          </ul>
        </div>
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
          <h4 className="text-xs font-bold text-emerald-800 mb-1 font-cairo">🤖 أولويات GEO</h4>
          <ul className="list-disc pr-4 space-y-0.5">
            {plan.geo_priorities.map((g, i) => <li key={i} className="text-[11px] text-slate-700 font-cairo">{g}</li>)}
          </ul>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="text-xs font-bold text-slate-700 mb-2 font-cairo">📱 نهج السوشيال ميديا</h4>
          <p className="text-sm text-slate-600 font-cairo">{plan.social_media_approach}</p>
        </div>
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
          <h4 className="text-xs font-bold text-amber-800 mb-1 font-cairo">⏱ الجدول الزمني</h4>
          <p className="text-sm text-slate-700 font-cairo">{plan.estimated_timeline}</p>
        </div>
      </div>

      {plan.monthly_budget_egp && (
        <div className="p-4 bg-white border-2 border-amber-200 rounded-xl mb-4">
          <h4 className="text-xs font-bold text-slate-700 mb-1 font-cairo">💰 الميزانية الشهرية المقترحة</h4>
          <p className="text-lg font-black text-amber-700 font-cairo">
            {plan.monthly_budget_egp.min.toLocaleString()} - {plan.monthly_budget_egp.max.toLocaleString()} EGP
          </p>
          <p className="text-[11px] text-slate-500 font-cairo">{plan.monthly_budget_egp.breakdown}</p>
        </div>
      )}

      <div>
        <h4 className="text-xs font-bold text-slate-700 mb-2 font-cairo">📈 النتائج المتوقعة (3-6 أشهر)</h4>
        <ul className="list-disc pr-5 space-y-1">
          {plan.expected_outcomes.map((o, i) => <li key={i} className="text-sm text-slate-600 font-cairo">{o}</li>)}
        </ul>
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Shared UI components
// ---------------------------------------------------------------------------

function Section({ icon, title, gradient, children }: { icon: string; title: string; gradient: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border-2 border-slate-200 rounded-2xl p-5">
      <div className={`inline-block px-3 py-1 rounded-full bg-gradient-to-r ${gradient} text-xs font-bold mb-4 font-cairo`}>
        {icon} {title}
      </div>
      {children}
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-black text-slate-800 font-cairo mb-1">{children}</h3>;
}

function BadgeList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mb-2">
      <h4 className="text-[10px] font-bold text-slate-500 mb-1 font-cairo">{title}</h4>
      <div className="flex flex-wrap gap-1">
        {items.map((item, i) => (
          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700 font-cairo">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-slate-700 font-cairo">{label}</span>
        <span className="text-xs font-black font-mono">{pct}%</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MiniScore({ label, score, detail }: { label: string; score: number; detail: string }) {
  const pct = Math.max(0, Math.min(100, score));
  const color = pct >= 80 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-rose-600";
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-bold text-slate-700 font-cairo">{label}</span>
        <span className={`text-sm font-black font-mono ${color}`}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${pct >= 80 ? "bg-emerald-400" : pct >= 50 ? "bg-amber-400" : "bg-rose-400"}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[9px] text-slate-500 mt-1 font-cairo">{detail}</p>
    </div>
  );
}
