import Link from "next/link";

export const metadata = {
  title: "الذكاء الاصطناعي في الموارد البشرية والتسويق | نِظام AI",
  description:
    "AI بيحلل CVs، يحسب الرواتب والتأمينات، يجاوب على أسئلة قانون العمل، ويصمم حملات تسويقية — كله بالعربي في نظام واحد. جرب AI مجاناً 14 يوم.",
};

const aiFeatures = [
  {
    icon: "📄",
    title: "فحص السير الذاتية",
    desc: "AI بيقرأ 100 CV في 5 دقائق — درجة تطابق 0-100 + أسئلة مقابلة مخصصة لكل مرشح.",
    points: ["استخراج المؤهلات والخبرات تلقائياً", "Score 0-100 حسب متطلبات الوظيفة", "أسئلة مقابلة خاصة بكل مرشح", "ترتيب السير الذاتية حسب الأولوية"],
  },
  {
    icon: "💰",
    title: "حساب الرواتب والضرايب",
    desc: "التأمينات والضريبة تتخصم تلقائياً — حسب القوانين المصرية آخر تحديث.",
    points: ["تأمينات 11% موظف + 18.75% شركة", "شرائح ضريبة الدخل 2026 مدمجة", "قسمة 30 أو 26 حسب العقد", "إجازات وسلف تخصم تلقائياً"],
  },
  {
    icon: "🤖",
    title: "المساعد الذكي للـ HR",
    desc: "اسأل بالعامية المصرية عن قانون العمل، التأمينات، أو أي حاجة في شركتك.",
    points: ["مدرب على قانون 12/2003 و 148/2019", "يفهم العامية المصرية", "يجيب بيانات شركتك الفعلية", "يطلع ملخصات وتقارير في ثواني"],
  },
  {
    icon: "📊",
    title: "Bridge Analytics",
    desc: "AI يربط بين حضور الموظف وإنتاجيته — تقارير أداء ذكية لكل فرد.",
    points: ["ربط الالتزام بالإنتاجية", "اكتشاف الموظفين الأقل أداءً مبكراً", "تقارير دائرية للمديرين", "تنبيهات ذكية للانحرافات"],
  },
  {
    icon: "✦",
    title: "استوديو التسويق بالـ AI",
    desc: "6 أدوات AI تسويق متكاملة: من تحليل المنتج لتصميم الحملات.",
    points: ["تحليل تسويقي للمنتج", "بناء Buyer Personas", "كتابة Ad Copy لكل منصة", "بحث كلمات SEO + تحليل GEO"],
  },
  {
    icon: "💬",
    title: "بوت واتساب للموظفين",
    desc: "الموظف يستعلم ويقدم طلبات من WhatsApp — AI يرد ويسجل تلقائياً.",
    points: ["استعلام عن الرصيد والمرتب", "تقديم إجازة واستئذان", "تسجيل حضور من واتساب", "التكامل مع باقي النظام"],
  },
];

export default function AiLandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-cyan-50/30 font-cairo">
      <nav className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur sticky top-0 z-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-cyan to-brand-cyan-dark flex items-center justify-center shadow-md">
            <span className="text-xl font-black text-white font-display">ن</span>
          </div>
          <span className="text-xl font-black text-slate-900">نِظام AI</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden md:inline-block px-4 py-2 text-sm text-slate-600 hover:text-slate-900 font-medium">دخول</Link>
          <Link href="/signup" className="px-4 py-2 rounded-lg bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white text-sm font-bold shadow-md hover:shadow-lg transition">جرّب AI مجاناً</Link>
        </div>
      </nav>

      <section className="px-6 py-20 md:py-28 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 mb-6 shadow-xl shadow-violet-500/20">
          <span className="text-3xl">🤖</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-4 font-display leading-tight">
          الذكاء الاصطناعي في<br />
          <span className="bg-gradient-to-r from-violet-600 via-cyan-500 to-brand-cyan-dark bg-clip-text text-transparent">الموارد البشرية والتسويق</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
          نِظام بيجيب الذكاء الاصطناعي في كل حتة: من فحص السير الذاتية وحساب
          الرواتب، لتحليل الأداء وتصميم الحملات التسويقية. كله بالعربي، كله
          متوافق مع القوانين المصرية.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/signup" className="px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold text-lg shadow-lg shadow-violet-500/30 hover:-translate-y-0.5 transition-all">
            جرّب AI مجاناً 14 يوم
          </Link>
          <Link href="/product" className="px-8 py-4 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-lg hover:border-slate-400 transition-all">
            شوف النظام بالصور
          </Link>
        </div>
      </section>

      <section className="px-6 py-16 max-w-6xl mx-auto">
        <h2 className="text-3xl font-black text-center text-slate-900 mb-4 font-cairo">6 أدوات AI في نظام واحد</h2>
        <p className="text-center text-slate-500 mb-12 max-w-2xl mx-auto">كل أداة مبنية عشان تحل مشكلة حقيقية في الشركات المصرية</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {aiFeatures.map((f) => (
            <div key={f.title} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-violet-300 hover:shadow-lg transition-all">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-lg font-black text-slate-800 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">{f.desc}</p>
              <ul className="space-y-1.5">
                {f.points.map((p) => (
                  <li key={p} className="text-xs text-slate-500 flex items-start gap-2">
                    <span className="text-violet-500 mt-0.5">✓</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-16 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black text-slate-900 mb-4 font-cairo">من غير AI بتضيع ساعات — مع AI بتخلص في دقايق</h2>
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <div className="text-4xl font-black text-red-400 mb-2">5 ساعات</div>
              <p className="text-sm text-slate-600">وقت قراءة 100 CV يدوي</p>
              <div className="text-2xl mt-4">→</div>
              <div className="text-3xl font-black text-green-500 mt-2">5 دقايق</div>
              <p className="text-sm text-slate-600">مع AI screening</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <div className="text-4xl font-black text-red-400 mb-2">4 ساعات</div>
              <p className="text-sm text-slate-600">حساب المرتبات يدوي شهرياً</p>
              <div className="text-2xl mt-4">→</div>
              <div className="text-3xl font-black text-green-500 mt-2">صفر</div>
              <p className="text-sm text-slate-600">AI يحسب تلقائياً</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <div className="text-4xl font-black text-red-400 mb-2">3 ساعات</div>
              <p className="text-sm text-slate-600">الرد على استفسارات الموظفين يومياً</p>
              <div className="text-2xl mt-4">→</div>
              <div className="text-3xl font-black text-green-500 mt-2">ثواني</div>
              <p className="text-sm text-slate-600">مع AI chatbot</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 bg-cyan-950 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black mb-4 font-cairo">جهّز شركتك للمستقبل — جرب AI اليوم</h2>
          <p className="text-cyan-200 mb-8">14 يوم مجاناً — ما تحتاجش بطاقة ائتمان</p>
          <Link href="/signup" className="inline-block px-10 py-4 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-300 text-cyan-950 font-bold text-lg shadow-lg hover:-translate-y-0.5 transition-all">
            ابدأ التجربة المجانية
          </Link>
        </div>
      </section>
    </main>
  );
}
