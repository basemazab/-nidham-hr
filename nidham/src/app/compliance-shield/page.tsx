import type { Metadata } from "next";
import Link from "next/link";
import { BlogNav, BlogFooter } from "@/components/blog-chrome";
import { BreadcrumbSchema } from "@/components/json-ld";

// ============================================================================
// /compliance-shield — public marketing page for the flagship feature
// ============================================================================
// Leads the whole product positioning with the #1 buying driver in the MENA
// SMB market: fear of labour-office + insurance fines. Targets searches like
// "حماية من غرامات مكتب العمل" / "نظام امتثال HR مصر".

export const metadata: Metadata = {
  title: {
    absolute: "درع الامتثال — أول نظام HR مصري بيحميك من غرامات مكتب العمل والتأمينات | نِظام",
  },
  description:
    "درع الامتثال من نِظام: يفحص بيانات شركتك تلقائياً وينبّهك قبل أي غرامة من مكتب العمل أو التأمينات — تسجيل متأخر، مستحقات مفصولين، التزامات الـ50 موظف، رصيد إجازات. حوّل الـHR من تكلفة لحماية. جرّب مجاناً.",
  alternates: { canonical: "/compliance-shield" },
  openGraph: {
    type: "website",
    title: "درع الامتثال — حماية من غرامات مكتب العمل والتأمينات",
    description:
      "أول نظام HR مصري بينبّهك قبل الغرامة بدل ما تتفاجئ بيها. فحص تلقائي مستمر لالتزاماتك القانونية.",
    url: "/compliance-shield",
  },
  twitter: {
    card: "summary_large_image",
    title: "درع الامتثال — حماية من غرامات مكتب العمل",
    description: "نظام HR مصري بينبّهك قبل الغرامة. جرّب مجاناً.",
  },
};

const FINES = [
  { v: "تأخير تسجيل التأمينات (نموذج 1)", f: "100 ج / يوم / موظف" },
  { v: "عدم منح الإجازة السنوية المستحقة", f: "تعويض ضعف الأجر + غرامة" },
  { v: "فصل بدون تسوية مستحقات", f: "قضية عمالية بعشرات الآلاف" },
  { v: "غياب سياسة منع التحرش (50+ موظف)", f: "مخالفة قانون 168/2023" },
  { v: "عدم وجود لجنة سلامة (50+ عامل)", f: "غرامات + إيقاف نشاط" },
];

const SHIELDS = [
  { icon: "🗂️", t: "تسجيل التأمينات في وقته", d: "ينبّهك لو موظف فات على تعيينه 7 أيام من غير تسجيل — قبل ما تبدأ الغرامة اليومية." },
  { icon: "📤", t: "مستحقات المفصولين", d: "يرصد أي موظف مفصول من غير تسوية نهاية خدمة موثّقة — حمايتك من القضايا العمالية." },
  { icon: "👥", t: "التزامات حجم الشركة", d: "أول ما توصل 50 موظف، يفكّرك بسياسة التحرش ولجنة السلامة الإلزامية." },
  { icon: "🌴", t: "التزام الإجازات", d: "يحسب رصيد الإجازات المتراكم كالتزام مالي، وينبّهك للي ممكن يتحوّل لمخالفة." },
  { icon: "🪪", t: "اكتمال البيانات", d: "يكتشف الموظفين الناقصة بياناتهم الحكومية قبل ما تحتاجها في تفتيش." },
  { icon: "💰", t: "تعرّضك بالجنيه", d: "رقم واحد واضح: كام معرّض تدفعه غرامات لو سبت الأمور زي ما هي." },
];

export default function ComplianceShieldLanding() {
  return (
    <div className="min-h-screen bg-white font-cairo flex flex-col">
      <BlogNav />
      <BreadcrumbSchema
        items={[
          { name: "الرئيسية", url: "/" },
          { name: "درع الامتثال", url: "/compliance-shield" },
        ]}
      />

      {/* Hero */}
      <section className="px-6 pt-16 pb-12 bg-gradient-to-b from-slate-900 via-slate-900 to-brand-navy text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 text-[200px] opacity-[0.06] leading-none">🛡️</div>
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="inline-block px-4 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs font-bold mb-6">
            ✦ ميزة حصرية في نِظام
          </div>
          <h1 className="text-3xl md:text-5xl font-black leading-tight mb-5">
            أول نظام HR مصري
            <br />
            <span className="text-cyan-400">بيحميك من الغرامات قبل ما تحصل</span>
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto mb-8">
            مكتب العمل والتأمينات بيكلّفوا الشركات آلاف الجنيهات غرامات سنوياً.
            «درع الامتثال» بيفحص بيانات شركتك تلقائياً وينبّهك قبل أي مخالفة —
            بالقيمة بالجنيه والمادة القانونية.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black text-lg shadow-xl transition"
          >
            🛡️ احمِ شركتك مجاناً
          </Link>
          <p className="text-xs text-slate-400 mt-3">بدون بطاقة ائتمان · يشتغل من أول يوم</p>
        </div>
      </section>

      <main className="flex-1">
        {/* The fear */}
        <section className="px-6 py-16 max-w-3xl mx-auto w-full">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 text-center mb-3">
            الخوف اللي بيقلق كل صاحب شركة
          </h2>
          <p className="text-slate-600 text-center mb-8">
            مخالفة واحدة ممكن تكلّفك أكتر من اشتراك سنة كاملة.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-700">
                  <th className="p-3 text-right font-bold">المخالفة</th>
                  <th className="p-3 text-right font-bold">التكلفة</th>
                </tr>
              </thead>
              <tbody>
                {FINES.map((row) => (
                  <tr key={row.v} className="border-t border-slate-200">
                    <td className="p-3 text-slate-700">{row.v}</td>
                    <td className="p-3 text-rose-700 font-bold whitespace-nowrap">{row.f}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* How it protects */}
        <section className="px-6 py-16 bg-slate-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 text-center mb-3">
              إزاي الدرع بيحميك
            </h2>
            <p className="text-slate-600 text-center mb-10">
              فحص تلقائي مستمر — مش محتاج تعمل حاجة، النظام بيراقب وينبّهك.
            </p>
            <div className="grid md:grid-cols-3 gap-5">
              {SHIELDS.map((s) => (
                <div key={s.t} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="text-3xl mb-3">{s.icon}</div>
                  <h3 className="font-black text-slate-900 mb-1">{s.t}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Difference */}
        <section className="px-6 py-16 max-w-3xl mx-auto w-full">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 text-center mb-8">
            الفرق بين نِظام وأي نظام تاني
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-slate-200 p-6">
              <div className="text-sm font-bold text-slate-400 mb-2">أي نظام HR تاني</div>
              <p className="text-slate-700">بينظّم بياناتك، وبيسيبك إنت تكتشف المخالفات بنفسك — لو اكتشفتها.</p>
            </div>
            <div className="rounded-2xl border-2 border-cyan-300 bg-cyan-50/50 p-6">
              <div className="text-sm font-bold text-brand-cyan-dark mb-2">نِظام + درع الامتثال</div>
              <p className="text-slate-800 font-medium">بينظّم بياناتك، وكمان بيراقبها وينبّهك قبل أي غرامة — حماية فعّالة مش مجرد تنظيم.</p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 pb-20">
          <div className="max-w-3xl mx-auto rounded-3xl bg-gradient-to-br from-brand-cyan to-brand-cyan-dark p-8 md:p-10 text-white shadow-xl text-center">
            <div className="text-4xl mb-3">🛡️</div>
            <h2 className="text-2xl md:text-3xl font-black mb-3">
              خلّي بالك من شغلك — وسيب الغرامات علينا
            </h2>
            <p className="text-cyan-50 mb-6 max-w-xl mx-auto">
              ابدأ مجاناً، ضيف موظفينك، وشوف تعرّضك للغرامات في دقيقة. من غير
              بطاقة ائتمان.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-brand-cyan-dark font-black text-lg shadow-md hover:shadow-lg transition"
            >
              ابدأ الحماية مجاناً ←
            </Link>
          </div>
        </section>
      </main>

      <BlogFooter />
    </div>
  );
}
