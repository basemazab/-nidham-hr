import Link from "next/link";

export const metadata = {
  title: "جديد نِظام — سجل التحديثات | Nidham HR Changelog",
  description:
    "كل التحديثات والمميزات الجديدة في نِظام HR — منصة الموارد البشرية والمرتبات المصرية. بنطوّر باستمرار.",
  alternates: { canonical: "https://www.nidhamhr.com/changelog" },
};

// Only REAL, shipped features. Update when something meaningful goes live.
type Entry = {
  date: string;
  tag: "جديد" | "تحسين" | "إصلاح";
  title: string;
  points: string[];
};

const ENTRIES: Entry[] = [
  {
    date: "يونيو 2026",
    tag: "جديد",
    title: "المساعد الفني الفوري 🛟",
    points: [
      "مساعد دعم على كل صفحة بيشخّص مشاكل النظام فعليًا ويحلها خطوة بخطوة",
      "صفحة «مهندس النظام» بتفحص كل مفاصل النظام بضغطة (قاعدة البيانات، الربط، الإيميل...)",
    ],
  },
  {
    date: "يونيو 2026",
    tag: "جديد",
    title: "نبض نِظام ⚡ — مديرك التنفيذي الآلي",
    points: [
      "بريفينج يومي بالذكاء الاصطناعي بيمسح شركتك كلها ويرتّب أولوياتك",
      "مؤشر صحة للشركة + خطوة عملية لكل بند مع لينك مباشر",
    ],
  },
  {
    date: "يونيو 2026",
    tag: "جديد",
    title: "التوظيف الذكي الكامل 🎯",
    points: [
      "المساعد بينشر الوظيفة، يجمع الـ CVs، ويفرزها بالـ AI تلقائيًا",
      "مترجم ومحلّل السيرة الذاتية (عربي ⇄ إنجليزي) + اختبار مطبوع للمرشح",
      "نشر الوظائف على فيسبوك ولينكد إن رسميًا",
    ],
  },
  {
    date: "يونيو 2026",
    tag: "تحسين",
    title: "صندوق رسائل التسويق الأذكى 💬",
    points: [
      "رد آلي طبيعي على عملاء فيسبوك وإنستجرام بمعلومات شركتك الحقيقية",
      "يبعت الكتالوجات والملفات تلقائيًا ويسجّل العميل في الـ CRM",
    ],
  },
  {
    date: "مايو 2026",
    tag: "جديد",
    title: "درع الامتثال 🛡️",
    points: [
      "بيراقب بياناتك وينبّهك قبل أي غرامة من مكتب العمل أو التأمينات",
      "بالقيمة بالجنيه والمادة القانونية",
    ],
  },
  {
    date: "مايو 2026",
    tag: "تحسين",
    title: "مرتبات أدق وأسرع 💰",
    points: [
      "مراجعة المرتبات بالـ AI بتلقط أي رقم شاذ قبل الصرف",
      "تحليلات تكلفة لكل قسم + اتجاه شهري",
    ],
  },
];

const TAG_CLS: Record<Entry["tag"], string> = {
  جديد: "bg-emerald-50 text-emerald-700 border-emerald-200",
  تحسين: "bg-sky-50 text-sky-700 border-sky-200",
  إصلاح: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function ChangelogPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <nav className="text-xs text-slate-500 mb-6 font-cairo">
          <Link href="/" className="hover:text-brand-cyan-dark">الرئيسية</Link>
          <span className="mx-2">›</span>
          <span className="text-slate-700">جديد نِظام</span>
        </nav>

        <header className="mb-10 text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-bold mb-3 font-cairo">
            ✦ بنطوّر باستمرار
          </div>
          <h1 className="text-3xl md:text-4xl font-black font-cairo text-slate-900 mb-2">
            جديد نِظام
          </h1>
          <p className="text-sm text-slate-600 font-cairo max-w-xl mx-auto leading-relaxed">
            نِظام منتج حي بيتطوّر كل أسبوع بناءً على احتياجات الشركات المصرية.
            دي أهم التحديثات اللي نزلت.
          </p>
        </header>

        <div className="relative border-r-2 border-slate-200 pr-6 space-y-8">
          {ENTRIES.map((e, i) => (
            <div key={i} className="relative">
              <span className="absolute -right-[31px] top-1.5 w-3 h-3 rounded-full bg-brand-cyan ring-4 ring-white" />
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <span className="text-xs text-slate-400 font-cairo">{e.date}</span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border font-cairo ${TAG_CLS[e.tag]}`}
                >
                  {e.tag}
                </span>
              </div>
              <h2 className="font-black text-lg text-slate-900 font-cairo mb-2">
                {e.title}
              </h2>
              <ul className="space-y-1.5">
                {e.points.map((p, j) => (
                  <li
                    key={j}
                    className="text-sm text-slate-600 font-cairo flex items-start gap-2"
                  >
                    <span className="text-brand-cyan-dark mt-0.5">✓</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/signup?plan=pro"
            className="inline-block px-7 py-3.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white font-black font-cairo shadow-lg hover:shadow-xl transition"
          >
            جرّب نِظام مجانًا 14 يوم ←
          </Link>
        </div>
      </div>
    </main>
  );
}
