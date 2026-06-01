import Link from "next/link";
import { FAQPageSchema } from "@/components/json-ld";

export const metadata = {
  title: "مقارنة أنظمة HR في مصر — Bayzat vs ZenHR vs نِظام | وفر 60%",
  description:
    "مقارنة شاملة بين أنظمة HR في مصر: Bayzat, ZenHR, ونِظام. الأسعار، المميزات، التوافق مع قانون العمل المصري، ودعم العملاء. نِظام أرخص 60% ومصري 100%.",
  alternates: { canonical: "/compare" },
  openGraph: {
    images: [{ url: "/api/og?title=" + encodeURIComponent("مقارنة أنظمة HR في مصر — Bayzat vs ZenHR vs نِظام"), width: 1200, height: 630, alt: "مقارنة أنظمة HR في مصر — Bayzat vs ZenHR vs نِظام" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "مقارنة أنظمة HR — Bayzat vs ZenHR vs نِظام | نِظام",
    description: "مقارنة شاملة بين أنظمة HR في مصر: الأسعار، المميزات، التوافق مع قانون العمل. نِظام أرخص 60% ومصري 100%.",
  },
};

const COMPARE_FAQS = [
  {
    question: "إيه الفرق بين نِظام و Bayzat؟",
    answer: "Bayzat منصة إماراتية موجهة للخليج، مش متوافقة مع قانون العمل المصري 12/2003 ولا التأمينات 148/2019. نِظام مبني خصيصاً لمصر — بيحسب التأمينات بالشرائح المصرية وضريبة الدخل بـ 7 شرايح. السعر أقل بـ 60%.",
  },
  {
    question: "نِظام ولا ZenHR لمصر؟",
    answer: "ZenHR منصة أردنية، بتنافس Bayzat في الخليج. أسعار ZenHR تبدأ من 4 دولار/موظف/شهر (حوالي 200 ج/موظف/شهر) مع حد أدنى 50 موظف = 10,000 ج/شهر. نِظام يبدأ من 0 ج (مجاني) و Pro بـ 1,500 ج/شهر لكل الشركة.",
  },
  {
    question: "هل نِظام مناسب لشركتي الناشئة؟",
    answer: "أكيد. الباقة المجانية تدعم حتى 5 موظفين ببلاش — مفيش بطاقة ائتمان. Starter بـ 500 ج/شهر لحد 25 موظف. Pro بـ 1,500 ج/شهر لحد 100 موظف.",
  },
  {
    question: "هل في دعم للعملاء بالعربي؟",
    answer: "أيوة، دعم كامل بالعربي المصري عبر واتساب 0105 535 6622. مع كل اشتراك Pro، بنعمل تدريب لفريق HR لمدة ساعة مجاناً.",
  },
];

const COMPARISON_ROWS = [
  {
    feature: "السعر لـ 100 موظف",
    nidham: "1,500 ج/شهر",
    bayzat: "4,500+ ج/شهر",
    zenhr: "10,000+ ج/شهر",
    excel: "0 ج (بتكاليف خفية)",
    best: "nidham",
  },
  {
    feature: "متوافق مع قانون العمل المصري 12/2003",
    nidham: "✅",
    bayzat: "❌",
    zenhr: "❌",
    excel: "يدوي",
    best: "nidham",
  },
  {
    feature: "حساب التأمينات الاجتماعية (148/2019)",
    nidham: "آلي 100%",
    bayzat: "غير متوفر",
    zenhr: "غير متوفر",
    excel: "يدوي",
    best: "nidham",
  },
  {
    feature: "شرائح ضريبة الدخل المصرية 2026",
    nidham: "آلي 7 شرايح",
    bayzat: "غير متوفر",
    zenhr: "غير متوفر",
    excel: "يدوي",
    best: "nidham",
  },
  {
    feature: "نماذج تأمينات رسمية (1، 2، 6)",
    nidham: "✅ جاهزة",
    bayzat: "❌",
    zenhr: "❌",
    excel: "يدوي",
    best: "nidham",
  },
  {
    feature: "حضور GPS مع سيلفي",
    nidham: "✅",
    bayzat: "جزئي",
    zenhr: "❌",
    excel: "❌",
    best: "nidham",
  },
  {
    feature: "AI Agent للموظفين",
    nidham: "✅",
    bayzat: "❌",
    zenhr: "❌",
    excel: "❌",
    best: "nidham",
  },
  {
    feature: "بوت واتساب للموظفين",
    nidham: "✅",
    bayzat: "❌",
    zenhr: "❌",
    excel: "❌",
    best: "nidham",
  },
  {
    feature: "CRM + Pipeline مبيعات",
    nidham: "✅ مدمج",
    bayzat: "❌",
    zenhr: "❌",
    excel: "يدوي",
    best: "nidham",
  },
  {
    feature: "استوديو تسويق AI",
    nidham: "✅ مدمج",
    bayzat: "❌",
    zenhr: "❌",
    excel: "❌",
    best: "nidham",
  },
  {
    feature: "توقيع إلكتروني",
    nidham: "✅",
    bayzat: "جزئي",
    zenhr: "❌",
    excel: "❌",
    best: "nidham",
  },
  {
    feature: "Bridge Analytics (HR + CRM)",
    nidham: "✅",
    bayzat: "❌",
    zenhr: "❌",
    excel: "❌",
    best: "nidham",
  },
  {
    feature: "تطبيق موبايل للموظفين",
    nidham: "✅ PWA",
    bayzat: "✅",
    zenhr: "✅",
    excel: "❌",
    best: "nidham",
  },
  {
    feature: "واجهة عربية كاملة",
    nidham: "✅ مصري",
    bayzat: "✅ فصحى",
    zenhr: "✅ فصحى",
    excel: "❌",
    best: "nidham",
  },
  {
    feature: "دعم عملاء بالعربي المصري",
    nidham: "✅ واتساب",
    bayzat: "إيميل",
    zenhr: "إيميل",
    excel: "❌",
    best: "nidham",
  },
  {
    feature: "فترة تجربة مجانية",
    nidham: "14 يوم",
    bayzat: "مش مذكور",
    zenhr: "7 أيام",
    excel: "غير مطلوب",
    best: "nidham",
  },
  {
    feature: "نسخة مجانية للأبد",
    nidham: "✅ حتى 5 موظفين",
    bayzat: "❌",
    zenhr: "❌",
    excel: "N/A",
    best: "nidham",
  },
  {
    feature: "API للتكامل",
    nidham: "✅ REST API",
    bayzat: "✅",
    zenhr: "✅",
    excel: "❌",
    best: "nidham",
  },
  {
    feature: "مصرية خالصة",
    nidham: "✅ شركة مصرية",
    bayzat: "🇦🇪 إماراتية",
    zenhr: "🇯🇴 أردنية",
    excel: "🇺🇸 أمريكية",
    best: "nidham",
  },
];

const SAVINGS_SCENARIOS = [
  {
    title: "شركة ناشئة — 15 موظف",
    nidham: "500 ج/شهر (Starter)",
    alternatives: "Bayzat ≈ 2,250 ج/شهر • ZenHR ≈ 3,000+ ج/شهر",
    save: "وفر 78-83%",
    icon: "🚀",
  },
  {
    title: "شركة متوسطة — 50 موظف",
    nidham: "1,500 ج/شهر (Pro)",
    alternatives: "Bayzat ≈ 4,500+ ج/شهر • ZenHR ≈ 10,000+ ج/شهر",
    save: "وفر 67-85%",
    icon: "🏢",
  },
  {
    title: "شركة كبيرة — 200 موظف",
    nidham: "3,500 ج/شهر (Business)",
    alternatives: "Bayzat ≈ 9,000+ ج/شهر • ZenHR ≈ 20,000+ ج/شهر",
    save: "وفر 61-83%",
    icon: "🏭",
  },
];

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <FAQPageSchema questions={COMPARE_FAQS} />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-12 text-center">
        <h1 className="text-3xl sm:text-4xl font-black font-cairo text-slate-900 dark:text-slate-50 mb-4 leading-tight">
          مقارنة أنظمة HR في مصر — مين الأفضل لشركتك؟
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 font-cairo max-w-2xl mx-auto">
          مقارنة حقيقية بالأرقام بين نِظام و Bayzat و ZenHR و Excel. عشان تختار الصح من أول مرة.
        </p>
      </section>

      {/* Savings scenarios */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-black font-cairo text-slate-800 dark:text-slate-200 mb-6 text-center">
          نِظام أوفر من المنافسين بنسبة 60-85%
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {SAVINGS_SCENARIOS.map((s) => (
            <div key={s.title} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="text-3xl mb-3">{s.icon}</div>
              <h3 className="text-base font-bold font-cairo text-slate-800 dark:text-slate-200 mb-2">{s.title}</h3>
              <div className="space-y-1 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">نِظام:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-cairo">{s.nidham}</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-cairo">{s.alternatives}</div>
              </div>
              <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-sm font-bold font-cairo">
                {s.save}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Full comparison table */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-black font-cairo text-slate-800 dark:text-slate-200 mb-6 text-center">
          جدول المقارنة الكامل
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <table className="w-full text-sm font-cairo">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="text-right p-3 font-bold text-slate-700 dark:text-slate-200">الميزة</th>
                <th className="text-center p-3 font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30">✦ نِظام</th>
                <th className="text-center p-3 font-bold text-slate-600 dark:text-slate-300">Bayzat</th>
                <th className="text-center p-3 font-bold text-slate-600 dark:text-slate-300">ZenHR</th>
                <th className="text-center p-3 font-bold text-slate-600 dark:text-slate-300">Excel</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => {
                const isEven = i % 2 === 0;
                return (
                  <tr key={row.feature} className={`${isEven ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-900/50"} border-t border-slate-100 dark:border-slate-800`}>
                    <td className="p-3 text-slate-800 dark:text-slate-200 font-bold">{row.feature}</td>
                    {(["nidham", "bayzat", "zenhr", "excel"] as const).map((key) => {
                      const val = row[key];
                      const isBest = key === row.best;
                      const isNidham = key === "nidham";
                      return (
                        <td key={key} className={`p-3 text-center text-xs ${isNidham ? "bg-emerald-50/50 dark:bg-emerald-900/10" : ""} ${isBest ? "font-bold text-emerald-700 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"}`}>
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Why Nidham wins */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-black font-cairo text-slate-800 dark:text-slate-200 mb-6 text-center">
          ليه نِظام هو الأفضل لشركتك المصرية؟
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { icon: "🇪🇬", title: "مصري خالص", desc: "مبني خصيصاً للشركات المصرية — متوافق مع قانون العمل 12/2003 والتأمينات 148/2019. مش منصة أجنبية معمّمة." },
            { icon: "💰", title: "أرخص 60-85%", desc: "باقات تبدأ من مجاني (5 موظفين ببلاش) و Pro بـ 1,500 ج/شهر للـ 100 موظف. Bayvat و ZenHR أغلى بكتير." },
            { icon: "🤖", title: "AI مدمج", desc: "AI Agent، فحص CVs بالذكاء الاصطناعي، وتوليد محتوى تسويقي — كلها مدمجة في النظام، مش إضافات منفصلة." },
            { icon: "📱", title: "واتساب + موبايل", desc: "الموظفين يتفاعلوا عبر واتساب (حضور، إجازات، كشف مرتب). بدون تنزيل تطبيق — PWA يشتغل على أي موبايل." },
            { icon: "📊", title: "HR + CRM + تسويق في واحد", desc: "نظام متكامل بدل 3 أنظمة منفصلة — وفر فلوس + وقت + مجهود. Bridge Analytics يربط كل حاجة." },
            { icon: "🔐", title: "أمان وقانون", desc: "متوافق مع قانون حماية البيانات المصري PDPL 151/2020. بيانات مشفّرة AES-256 مع Audit Log كامل." },
          ].map((item) => (
            <div key={item.title} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex gap-4">
              <span className="text-3xl shrink-0">{item.icon}</span>
              <div>
                <h3 className="text-sm font-bold font-cairo text-slate-800 dark:text-slate-200 mb-1">{item.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-cairo leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Internal link to features */}
      <section className="max-w-3xl mx-auto px-4 pb-6">
        <div className="text-center">
          <Link href="/features" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold font-cairo text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition">
            ⚡ استعرض كل مميزات نظام HR بالتفصيل
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-black font-cairo text-slate-800 dark:text-slate-200 mb-6 text-center">
          أسئلة شائعة عن المقارنة
        </h2>
        <div className="space-y-3">
          {COMPARE_FAQS.map((faq) => (
            <details key={faq.question} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 group">
              <summary className="text-sm font-bold font-cairo text-slate-800 dark:text-slate-200 cursor-pointer list-none flex items-center justify-between">
                {faq.question}
                <span className="text-slate-400 group-open:rotate-180 transition">▼</span>
              </summary>
              <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 font-cairo leading-relaxed">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 pb-20 text-center">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 sm:p-12 shadow-xl">
          <h2 className="text-2xl font-black font-cairo text-white mb-3">
            جهّز شركتك لنظام HR مصري 100%
          </h2>
          <p className="text-sm text-white/80 font-cairo mb-6 max-w-md mx-auto">
            14 يوم تجربة مجانية — مفيش بطاقة ائتمان. لو عجبك، كمل مع باقتنا Pro بـ 1,500 ج/شهر.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="px-8 py-3 rounded-xl bg-white text-emerald-700 font-black font-cairo text-sm shadow-lg hover:shadow-xl transition hover:-translate-y-0.5"
            >
              🚀 ابدأ تجربة مجانية
            </Link>
            <a
              href="https://wa.me/201080053809?text=أهلاً، شفت صفحة المقارنة وعايز أسأل عن نِظام"
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
