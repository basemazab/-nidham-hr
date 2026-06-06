import Link from "next/link";
import dynamic from "next/dynamic";
import { SectionHeader } from "./sections/section-helpers";
import { DeferredJsonLd } from "@/components/deferred-json-ld";
import { HeroSection } from "./sections/hero";
import { DesktopAppSection } from "./sections/desktop-app";
import { Reveal, CountUp, ScrollProgress } from "./sections/reveal";

const DynamicLiveScreenshots = dynamic(() => import("./sections/live-screenshots").then((m) => ({ default: m.LiveScreenshotsSection })), { loading: () => <div className="h-64 animate-pulse bg-slate-100 rounded-2xl" /> });
const DynamicBridgeAnalytics = dynamic(() => import("./sections/bridge-analytics").then((m) => ({ default: m.BridgeAnalyticsSection })), { loading: () => <div className="h-64 animate-pulse bg-slate-800 rounded-2xl" /> });
const DynamicAISection = dynamic(() => import("./sections/ai-section").then((m) => ({ default: m.AISection })), { loading: () => <div className="h-64 animate-pulse bg-slate-100 rounded-2xl" /> });
const DynamicMarketingStudio = dynamic(() => import("./sections/marketing-studio").then((m) => ({ default: m.MarketingStudioSection })), { loading: () => <div className="h-64 animate-pulse bg-slate-900 rounded-2xl" /> });
const DynamicMobileSection = dynamic(() => import("./sections/mobile-section").then((m) => ({ default: m.MobileSection })), { loading: () => <div className="h-64 animate-pulse bg-slate-100 rounded-2xl" /> });
const DynamicSecuritySection = dynamic(() => import("./sections/security-section").then((m) => ({ default: m.SecuritySection })), { loading: () => <div className="h-48 animate-pulse bg-slate-100 rounded-2xl" /> });
const DynamicDeploymentOptions = dynamic(() => import("./sections/deployment-options").then((m) => ({ default: m.DeploymentOptionsSection })), { loading: () => <div className="h-48 animate-pulse bg-slate-100 rounded-2xl" /> });
const DynamicHowItWorks = dynamic(() => import("./sections/how-it-works").then((m) => ({ default: m.HowItWorksSection })), { loading: () => <div className="h-64 animate-pulse bg-slate-100 rounded-2xl" /> });
const DynamicFinalCTA = dynamic(() => import("./sections/final-cta").then((m) => ({ default: m.FinalCTASection })));
const DynamicFooter = dynamic(() => import("./sections/footer").then((m) => ({ default: m.Footer })));

type SearchParams = Promise<{
  error?: string;
  error_code?: string;
  error_description?: string;
}>;

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const hasAuthError = !!(params.error || params.error_code);
  const friendlyError =
    params.error_code === "otp_expired"
      ? "اللينك انتهت صلاحيته أو اتستخدم قبل كده — اطلب لينك جديد"
      : params.error_description
      ? decodeURIComponent(params.error_description.replace(/\+/g, " "))
      : "حصلت مشكلة في تسجيل الدخول — جرّب تاني";

  const faqQuestions = [
    { question: "ما هو أفضل نظام HR في مصر؟", answer: "نِظام هو أفضل نظام HR ومرتبات متكامل للشركات المصرية — يدعم قانون العمل 12/2003 والتأمينات 148/2019، حضور بالـ GPS، حساب روابط آلي، CRM، واستوديو تسويق بالذكاء الاصطناعي. جرّب 14 يوم مجاناً." },
    { question: "كم تكلفة نظام HR للشركات الصغيرة في مصر؟", answer: "نِظام يبدأ من 750 جنيه مصري شهرياً لـ 25 موظف (باقة Starter). الباقة Pro 2,500 جنيه لـ 100 موظف، والباقة Business 6,000 جنيه لـ 500 موظف. وفيه باقة مجانية حتى 5 موظفين. كل الباقات تشمل دعم فني وتحديثات قانونية." },
    { question: "إيه الفرق بين نِظام و Bayzat أو ZenHR؟", answer: "نِظام مصمم خصيصاً للسوق المصري — متوافق مع قانون العمل المصري 12/2003 والتأمينات 148/2019، ويدعم اللغة العربية بالكامل، ويشمل CRM واستوديو تسويق بـ AI. Bayzat و ZenHR مصممان للسوق الخليجي ويفتقران للتوافق القانوني المصري." },
    { question: "هل نظام الحضور بالـ GPS قانوني في مصر؟", answer: "نعم، الحضور بالـ GPS قانوني في مصر. نِظام يستخدم GPS + سيلفي لتسجيل الحضور، مع geofence قابل للتعديل حول موقع الشركة. القانون لا يشترط طريقة محددة لتسجيل الحضور طالما موثقة." },
    { question: "ازاي أحسب المرتب في مصر بعد التأمينات والضريبة؟", answer: "نِظام يحسب المرتب تلقائياً: التأمينات الاجتماعية 11% على الموظف (و18.75% على صاحب العمل) على الأجر التأميني بين 2,700 و16,700 جنيه (قيم 2026)، وضريبة كسب العمل بالشرائح بعد إعفاء شخصي 20,000 جنيه سنوياً — أول 40,000 بنسبة 0%، ثم 10% و15% و20% و22.5% و25% وحتى 27.5% لما يزيد عن 1.2 مليون." },
    { question: "هل يوفر نِظام فحص السير الذاتية بالذكاء الاصطناعي؟", answer: "نعم، نِظام يشمل فحص CVs بالـ AI — بيحلل السيرة الذاتية، يحسب درجة التطابق مع الوظيفة (0-100)، ويقترح أسئلة مقابلة شخصية مخصصة لكل مرشح." },
    { question: "هل يمكن تجربة نِظام مجاناً؟", answer: "نعم، نِظام يوفر تجربة مجانية لمدة 14 يوم بدون بطاقة ائتمان. تشمل كل الميزات بما فيها AI والحضور بالـ GPS. تقدر تلغي أي وقت." },
    { question: "هل نِظام مناسب للشركات الناشئة والصغيرة؟", answer: "بالتأكيد. نِظام مصمم للشركات الناشئة والصغيرة في مصر — يبدأ من 750 جنيه شهرياً (وفيه باقة مجانية)، يوفر حل متكامل بديل لـ Excel، ويوفر وقت الـ HR مع أتمتة الرواتب والحضور والإجازات." },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqQuestions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: { "@type": "Answer", text: q.answer },
    })),
  };

  return (
    <main className="bg-white">
      <ScrollProgress />
      {hasAuthError && (
        <div className="max-w-3xl mx-auto px-6 pt-6">
          <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200 text-right flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-bold text-red-800 mb-1 font-cairo">حصلت مشكلة</h3>
              <p className="text-sm text-red-700 mb-3 font-cairo">{friendlyError}</p>
              <Link href="/forgot-password" className="inline-block text-sm text-red-700 font-bold underline hover:no-underline font-cairo">
                اطلب لينك إعادة تعيين جديد ←
              </Link>
            </div>
          </div>
        </div>
      )}
      <HeroSection />
      <ProofStrip />
      <Reveal><ComplianceShieldHighlight /></Reveal>
      <CoreModulesSection />
      <Reveal><DynamicLiveScreenshots /></Reveal>
      <Reveal><DynamicBridgeAnalytics /></Reveal>
      <Reveal><DynamicAISection /></Reveal>
      <Reveal><DynamicMarketingStudio /></Reveal>
      <Reveal><DynamicMobileSection /></Reveal>
      <Reveal><DynamicSecuritySection /></Reveal>
      <Reveal><DynamicDeploymentOptions /></Reveal>
      <Reveal><DesktopAppSection /></Reveal>
      <Reveal><DynamicHowItWorks /></Reveal>
      <Reveal><DynamicFinalCTA /></Reveal>
      <DynamicFooter />
      <DeferredJsonLd schema={faqSchema} />
    </main>
  );
}

function ComplianceShieldHighlight() {
  return (
    <section className="px-6 py-12">
      <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-brand-navy text-white p-8 md:p-10 shadow-xl relative overflow-hidden">
        <div aria-hidden className="absolute -top-6 -left-4 text-[160px] opacity-[0.07] leading-none">🛡️</div>
        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <div className="inline-block px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs font-bold mb-3 font-cairo">
              ✦ جديد · ميزة حصرية
            </div>
            <h2 className="text-2xl md:text-3xl font-black font-cairo mb-2 leading-tight">
              درع الامتثال — أول نظام HR مصري
              <br className="hidden md:block" /> بيحميك من الغرامات قبل ما تحصل
            </h2>
            <p className="text-slate-300 font-cairo leading-relaxed max-w-2xl">
              بيفحص بيانات شركتك تلقائياً وينبّهك قبل أي غرامة من مكتب العمل أو
              التأمينات — بالقيمة بالجنيه والمادة القانونية. كل نظام تاني بينظّم؛
              نِظام بيحميك.
            </p>
          </div>
          <Link
            href="/compliance-shield"
            className="shrink-0 inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black text-lg shadow-lg transition font-cairo whitespace-nowrap"
          >
            اعرف أكتر ←
          </Link>
        </div>
      </div>
    </section>
  );
}

function ProofStrip() {
  const items: { value?: number; suffix?: string; text?: string; label: string }[] = [
    { value: 21, label: "يوم إجازة سنوية محسوبين تلقائيًا" },
    { value: 11, suffix: "%", label: "تأمينات اجتماعية على الموظف، لحد سقف الأجر التأميني" },
    { value: 100, suffix: "م", label: "geofence حول مكتبك للحضور" },
    { value: 6, label: "أدوات AI تسويق بتحل محل وكالة كاملة" },
    { text: "AI", label: "بيقرا CVs، يصمم حملات، ويجيب leads" },
  ];
  return (
    <section className="border-y border-slate-200 bg-white px-6 py-10">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-6">
        {items.map((i, idx) => (
          <Reveal key={i.label} delay={idx * 0.08} className="text-center">
            <div className="text-3xl md:text-4xl font-black font-display bg-gradient-to-r from-brand-cyan-dark via-brand-cyan to-brand-navy bg-clip-text text-transparent mb-1 animate-gradient-text">
              {i.value !== undefined ? (
                <CountUp value={i.value} suffix={i.suffix ?? ""} />
              ) : (
                i.text
              )}
            </div>
            <div className="text-xs md:text-sm text-slate-600 font-cairo leading-relaxed">{i.label}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function CoreModulesSection() {
  const modules = [
    { icon: "👥", title: "إدارة الموظفين", desc: "بيانات شاملة (مرتب، تأمينات، قومي، بنك)، رفع Excel أو PDF بالـ AI، أكواد دعوة بـ QR.", points: ["رفع Excel + CSV", "رفع PDF بالـ AI", "Audit log كامل"] },
    { icon: "⏰", title: "الحضور والانصراف", desc: "GPS-aware من تطبيق الموبايل، أو دخول يدوي، أو رفع من بصمة ZKTeco.", points: ["تثبيت بالـ GPS", "Geofence قابل للتعديل", "استيراد من البصمة"] },
    { icon: "💰", title: "الرواتب المصرية", desc: "محاسبة كاملة بقانون العمل والضرائب 2024 + شرائح ضريبة الدخل 6 شرائح.", points: ["تأمينات 14% + سقف", "ضريبة 10% → 27.5%", "خصم السلف تلقائيًا"] },
    { icon: "📨", title: "طلبات الموظفين", desc: "إجازات، سلف، استئذانات — الموظف بيقدّم من الموبايل، HR يوافق ويتم خصم الرصيد.", points: ["8 أنواع إجازة", "أقساط حتى 24 شهر", "رصيد يقل تلقائيًا"] },
    { icon: "💼", title: "إدارة العملاء (CRM)", desc: "Pipeline متكامل + تفاعلات + عقود مع تتبع تواريخ التجديد.", points: ["Leads → Active → Won/Lost", "تفاعلات يومية", "تنبيهات العقود"] },
    { icon: "🎯", title: "التوظيف الذكي", desc: "إعلانات وظائف عامة + فحص CVs بالـ AI ودرجة تطابق وأسئلة مقابلة.", points: ["صفحة public للوظائف", "AI score 0-100", "أسئلة مقابلة جاهزة"] },
    { icon: "📊", title: "التقارير", desc: "تقرير الحضور الشهري + Bridge Analytics (الالتزام × الإنتاجية).", points: ["Export Excel", "Per-employee", "Bridge HR ↔ CRM"] },
    { icon: "🤖", title: "مساعد ذكي", desc: "اسأله بالعربي عن قانون العمل أو عن بيانات شركتك. Gemini 2.5 + قانون 12/2003.", points: ["قانون عمل وتأمينات", "حسابات الضرائب", "ملخصات الشركة"] },
    { icon: "✦", title: "استوديو التسويق (Enterprise)", desc: "وكالة تسويق كاملة جواه نظامك: 6 أدوات AI + landing pages + Leads pipeline + Meta integration.", points: ["AI يصمم حملات + ad copy + SEO", "Landing pages + Lead capture", "Pipeline Kanban + Analytics"] },
  ];
  return (
    <section className="px-6 py-20 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <SectionHeader eyebrow="الموديولات الأساسية" title="كل اللي شركتك محتاجه — في صفحة واحدة" subtitle="من ساعة ما توقّع عقد موظف لحد ما تبعتله شيك آخر الشهر، كل خطوة في نظام واحد." />
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {modules.map((m, i) => (
            <Reveal key={m.title} delay={(i % 4) * 0.07}>
              <div className="group h-full bg-white p-6 rounded-2xl border border-slate-200 hover:border-brand-cyan/50 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1.5 transition-all duration-300">
                <div className="text-3xl mb-3 inline-block transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">{m.icon}</div>
                <h3 className="font-black font-cairo text-slate-800 mb-2 group-hover:text-brand-cyan-dark transition-colors">{m.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4 font-cairo">{m.desc}</p>
                <ul className="space-y-1.5">
                  {m.points.map((p) => (
                    <li key={p} className="text-xs text-slate-500 flex items-start gap-2 font-cairo">
                      <span className="text-brand-cyan-dark mt-0.5">✓</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
