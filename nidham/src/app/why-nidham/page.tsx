import Link from "next/link";

export const metadata = {
  title: "ليه نِظام هو أفضل نظام HR في مصر — 10 أسباب تختارنا",
  description:
    "10 أسباب تخلّي نِظام أفضل نظام HR في مصر: مصري 100%، متوافق مع قانون العمل، أرخص 60-85% من Bayzat/ZenHR، AI مدمج، واتساب بوت، ودعم فني بالعربي. 14 يوم تجربة مجانية.",
  alternates: { canonical: "/why-nidham" },
  openGraph: {
    images: [{ url: "/api/og?title=" + encodeURIComponent("ليه نِظام هو أفضل نظام HR في مصر — 10 أسباب"), width: 1200, height: 630, alt: "ليه نِظام هو أفضل نظام HR في مصر — 10 أسباب" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ليه نِظام هو أفضل نظام HR في مصر — 10 أسباب تختارنا",
    description: "مصري 100%، متوافق مع قانون العمل، أرخص 60-85% من Bayzat/ZenHR، AI مدمج، واتساب بوت، ودعم فني بالعربي.",
  },
};

const REASONS = [
  {
    icon: "🇪🇬",
    title: "مصري 100% — معمول لمصر مش معمّم",
    desc: "نِظام مش منصة أجنبية اتعملت للخليج واتضافت لها شريحة مصرية. النظام مبني من الصفر في دمياط، مصر — للقوانين المصرية، باللهجة المصرية، وبنظام الدفع المصري.",
    stats: ["قانون العمل 12/2003", "التأمينات 148/2019", "نموذج 1 و2 و6", "شرائح ضريبة 2026"],
  },
  {
    icon: "💰",
    title: "أرخص 60-85% من المنافسين",
    desc: "Bayzat و ZenHR أسعارهم بالدولار — 4-7$/موظف/شهر. نِظام بالجنيه المصري: Pro بـ 2,500 ج/شهر للـ 100 موظف. الـ Free plan مجاني للأبد لحد 5 موظفين.",
    stats: ["2,500 ج/شهر لـ 100 موظف", "750 ج/شهر لـ 25 موظف", "مجاني لـ 5 موظفين", "شهرين هدية سنوياً"],
  },
  {
    icon: "🤖",
    title: "AI مدمج — مش إضافة منفصلة",
    desc: "AI Agent يرد على استفسارات الموظفين بالعربي، فحص CVs بالذكاء الاصطناعي، توليد بوستات تسويقية، و AI CMO يحلل السوق. كل ده جوه النظام — مش subscription تاني.",
    stats: ["AI Agent للموظفين", "فحص CVs تلقائي", "توليد محتوى تسويقي", "AI CMO"],
  },
  {
    icon: "📱",
    title: "واتساب بوت — الموظفين مش محتاجين تدريب",
    desc: "95% من المصريين على واتساب يومياً. الموظف بيكتب 'عايز كشف مرتبي' على واتساب → البوت يرد فوراً. حضور، إجازات، سلف — كل حاجة من واتساب. بدون تنزيل تطبيق.",
    stats: ["حضور من واتساب", "كشف مرتب مباشر", "تقديم إجازة", "بدون تنزيل"],
  },
  {
    icon: "📊",
    title: "HR + CRM + تسويق — نظام واحد بدل 3",
    desc: "معظم الشركات عندها HR system + CRM + Canva/منصة تسويق = 3 فواتير. نِظام يجمّعهم في واحد. Bridge Analytics يربط أداء المبيعات بالـ HR — تشوف الصورة الكاملة.",
    stats: ["HR + Payroll مدمج", "CRM مع Pipeline", "استوديو تسويق AI", "Bridge Analytics"],
  },
  {
    icon: "🛡",
    title: "أمان من الدرجة الأولى — متوافق مع PDPL",
    desc: "بيانات الموظفين مشفّرة AES-256 — نفس مستوى البنوك. متوافق مع قانون حماية البيانات المصري 151/2020. Audit Log كامل لكل عملية وصول. 2FA لجميع الحسابات.",
    stats: ["AES-256 تشفير", "PDPL 151/2020", "Audit Log كامل", "2FA أمان"],
  },
  {
    icon: "⚡",
    title: "Setup في أقل من 7 أيام",
    desc: "استيراد Excel → ربط أجهزة الحضور → أول دورة مرتبات تجريبية. كل ده في أسبوع. مع كل اشتراك Pro، بنعمل تدريب لـ HR مجاناً لمدة ساعة مع حدّاد.",
    stats: ["استيراد Excel", "ربط ZKTeco", "أول مرتبات في يوم 7", "تدريب HR مجاني"],
  },
  {
    icon: "📋",
    title: "9 نماذج رسمية جاهزة — اطبع في 30 ثانية",
    desc: "نموذج 1 تأمينات، نموذج 2، نموذج 6، شهادة خبرة، شهادة راتب، عقد عمل، إفادة مرتب، خطاب إنذار، محضر جزاء. كلها مطابقة لمتطلبات مكتب العمل والتأمينات.",
    stats: ["نموذج 1 و2 و6", "شهادة خبرة", "عقد عمل قانوني", "إفادة مرتب"],
  },
  {
    icon: "📡",
    title: "حضور GPS مع سيلفي — قانوني ومريح",
    desc: "الموظف بيفتح لينك من موبايله، بيسمح للـ GPS والكاميرا، بياخد سيلفي. النظام بيتأكد إنه في مكان العمل (Geofencing). قانوني تماماً — لا يحتاج بصمة أو جهاز.",
    stats: ["GPS Geofencing", "سيلفي توثيق", "بدون جهاز بصمة", "تقرير حضور فوري"],
  },
  {
    icon: "🇪🇬",
    title: "دعم فني بالعربي المصري — واتساب + إيميل",
    desc: "مفيش دردشة بالهند. مفيش إيميل بالإنجليزي تنتظر عليه 48 ساعة. الدعم على واتساب 0105 535 6622 — رد في دقايق. ولو محتاج مكالمة، بنكلمك.",
    stats: ["واتساب 0105 535 6622", "إيميل خلال ساعة", "رد في دقايق", "تدريب مجاني"],
  },
];

export default function WhyNidhamPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-12 text-center">
        <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold font-cairo mb-4">
          🇪🇬 مصري 100% — مبني في دمياط، مصر
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-cairo text-slate-900 dark:text-slate-50 mb-4 leading-tight">
          10 أسباب تخلّي نِظام أفضل نظام HR في مصر
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 font-cairo max-w-2xl mx-auto mb-6">
          مقارنة حقيقية؟ نِظام أوفر 60-85% من Bayzat و ZenHR، ومتوافق مع القوانين المصرية.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/signup"
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black font-cairo text-sm shadow-lg hover:shadow-xl transition hover:-translate-y-0.5"
          >
            🚀 ابدأ تجربة مجانية — 14 يوم
          </Link>
          <Link
            href="/compare"
            className="px-8 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold font-cairo text-sm hover:border-emerald-400 transition"
          >
            📊 شوف المقارنة الكاملة
          </Link>
        </div>
        <div className="mt-4">
          <Link href="/features" className="text-xs text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition underline underline-offset-2 font-cairo">
            ⚡ استعرض كل مميزات نظام HR بالتفصيل
          </Link>
        </div>
      </section>

      {/* Social proof strip */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "200+", label: "موظف على النظام", icon: "👥" },
            { value: "90%", label: "توفير في وقت HR", icon: "⏱" },
            { value: "0", label: "غرامات تأمينات", icon: "🛡" },
            { value: "14 يوم", label: "تجربة مجانية", icon: "🎯" },
          ].map((s) => (
            <div key={s.label} className="text-center p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xl font-black font-display text-slate-800 dark:text-slate-100">{s.value}</div>
              <div className="text-[10px] font-cairo text-slate-500 dark:text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* The 10 reasons */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <div className="space-y-5">
          {REASONS.map((r, i) => (
            <div key={r.title} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-2xl shrink-0">
                  {r.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-black flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <h2 className="text-base font-black font-cairo text-slate-800 dark:text-slate-200">
                      {r.title}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-cairo leading-relaxed mb-3">
                    {r.desc}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {r.stats.map((s) => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-cairo">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Customer quote */}
      <section className="max-w-3xl mx-auto px-4 pb-12">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-3xl p-8 text-center">
          <div className="text-5xl mb-4">🏗</div>
          <blockquote className="text-lg font-cairo text-slate-700 dark:text-slate-200 mb-4 leading-relaxed">
            &ldquo;أول مرة الـ payroll cycle بيخلص في يوم واحد بدل أسبوع. نظام مصري بيفهم القانون فعلاً.&rdquo;
          </blockquote>
          <div className="text-sm font-bold font-cairo text-slate-800 dark:text-slate-100">
            مجموعة الاتحاد للإنشاءات المعدنية
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-cairo">
            200+ موظف · شغّالين على نِظام من 6 شهور
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 pb-20 text-center">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 sm:p-12 shadow-xl">
          <h2 className="text-2xl font-black font-cairo text-white mb-3">
            جهّز شركتك بنظام HR مصري 100%
          </h2>
          <p className="text-sm text-white/80 font-cairo mb-6 max-w-md mx-auto">
            14 يوم تجربة مجانية — مفيش بطاقة ائتمان. لو عجبك، كمل مع باقتنا Pro بـ 2,500 ج/شهر.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="px-8 py-3 rounded-xl bg-white text-emerald-700 font-black font-cairo text-sm shadow-lg hover:shadow-xl transition hover:-translate-y-0.5"
            >
              🚀 ابدأ تجربة مجانية
            </Link>
            <a
              href="https://wa.me/201055356622?text=أهلاً، شفت ليه نِظام وعايز أسأل"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 rounded-xl border-2 border-white/40 text-white font-bold font-cairo text-sm hover:bg-white/10 transition"
            >
              💬 كلّمنا على واتساب
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
