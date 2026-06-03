import type { Metadata } from "next";
import { OvertimeCalculator } from "./calculator";
import { BlogNav, BlogFooter } from "@/components/blog-chrome";
import { BreadcrumbSchema, HowToSchema } from "@/components/json-ld";

// ============================================================================
// /tools/overtime — Free Egyptian overtime calculator (link magnet)
// ============================================================================
//
// Server shell: metadata + chrome + SEO body. Interactive form is the
// client component in ./calculator.tsx. Targets "حاسبة الأوفر تايم" /
// "حساب الساعات الإضافية مصر" — high-intent, low-quality competition
// (most results are outdated articles, not working calculators).

export const metadata: Metadata = {
  title: {
    absolute:
      "حاسبة الأوفر تايم في مصر 2026 — حساب الساعات الإضافية قانون العمل | نِظام HR",
  },
  description:
    "حاسبة الأوفر تايم (الساعات الإضافية) في مصر طبقاً للمادة 85 من قانون العمل 12/2003: نهاري +35%، ليلي +70%، أيام الراحة +100%. احسب بدل الأوفر تايم لأي موظف مجاناً.",
  alternates: { canonical: "/tools/overtime" },
  openGraph: {
    type: "website",
    title: "حاسبة الأوفر تايم في مصر 2026 — مجانية",
    description:
      "احسب بدل الساعات الإضافية (نهاري/ليلي/عطلات) حسب قانون العمل المصري.",
    url: "/tools/overtime",
  },
  twitter: {
    card: "summary_large_image",
    title: "حاسبة الأوفر تايم في مصر 2026",
    description: "ساعات إضافية نهاري +35% · ليلي +70% · عطلات +100%.",
  },
};

export default function OvertimeCalculatorPage() {
  return (
    <div className="min-h-screen bg-white font-cairo flex flex-col">
      <BlogNav />
      <BreadcrumbSchema
        items={[
          { name: "الرئيسية", url: "/" },
          { name: "أدوات مجانية", url: "/tools" },
          { name: "حاسبة الأوفر تايم", url: "/tools/overtime" },
        ]}
      />
      <HowToSchema
        name="كيفية حساب الأوفر تايم في مصر 2026"
        description="خطوات حساب بدل الساعات الإضافية طبقاً للمادة 85 من قانون العمل المصري 12/2003."
        steps={[
          { name: "احسب الأجر بالساعة", text: "الأجر الأساسي الشهري مقسوماً على (أيام العمل × ساعات اليوم)، الافتراضي 26 يوم × 8 ساعات = 208 ساعة." },
          { name: "أدخل الساعات الإضافية", text: "اكتب عدد الساعات الإضافية النهارية والليلية وأيام الراحة كلٌّ على حدة." },
          { name: "طبّق نسب القانون", text: "نهاري ×1.35، ليلي ×1.70 (من 7 مساءً لـ 7 صباحاً)، أيام الراحة والعطلات ×2.00." },
          { name: "اجمع الإجمالي", text: "الناتج هو إجمالي بدل الأوفر تايم الذي يُضاف لمرتب الموظف." },
        ]}
      />

      <header className="px-6 pt-12 pb-6 max-w-3xl mx-auto w-full">
        <nav aria-label="breadcrumb" className="text-xs text-slate-500 mb-5">
          <a href="/" className="hover:text-brand-cyan-dark">الرئيسية</a>
          <span className="mx-2">›</span>
          <a href="/tools" className="hover:text-brand-cyan-dark">الأدوات</a>
          <span className="mx-2">›</span>
          <span className="text-slate-700">حاسبة الأوفر تايم</span>
        </nav>

        <div className="inline-block px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold mb-4">
          ⚡ أداة مجانية · بدون تسجيل
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-4">
          حاسبة الأوفر تايم في مصر 2026
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed mb-2">
          احسب بدل الساعات الإضافية لأي موظف حسب المادة 85 من قانون العمل
          12/2003 — نهاري، ليلي، وأيام الراحة والعطلات.
        </p>
      </header>

      <main className="px-6 pb-12 max-w-3xl mx-auto w-full flex-1">
        <OvertimeCalculator />

        <section className="mt-12 prose-ar">
          <h2>إزاي بيتحسب الأوفر تايم في مصر؟</h2>
          <p>
            المادة 85 من قانون العمل المصري بتحدد إن أي ساعة عمل إضافية
            بتتحسب بأجر الساعة العادي + علاوة إضافية حسب توقيت الساعة:
          </p>

          <h3>1. الأجر بالساعة العادي</h3>
          <p>
            بالنسبة للموظف بمرتب شهري، الأجر بالساعة = الأجر الأساسي ÷ (عدد
            أيام العمل × ساعات اليوم). الافتراضي المصري 26 يوم × 8 ساعات =
            208 ساعة شهرياً.
          </p>

          <h3>2. نسب العلاوة الإضافية</h3>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>نوع الساعة الإضافية</th>
                  <th>المُعامل</th>
                  <th>العلاوة</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>نهارية</td><td>×1.35</td><td>+35%</td></tr>
                <tr><td>ليلية (7م – 7ص)</td><td>×1.70</td><td>+70%</td></tr>
                <tr><td>أيام الراحة والعطلات الرسمية</td><td>×2.00</td><td>+100%</td></tr>
              </tbody>
            </table>
          </div>

          <h3>3. الإجمالي</h3>
          <p>
            <strong>
              بدل الأوفر تايم = (ساعات نهارية × أجر الساعة × 1.35) + (ساعات
              ليلية × أجر الساعة × 1.70) + (ساعات راحة × أجر الساعة × 2.00)
            </strong>
          </p>

          <div className="callout">
            <div className="callout-title">💡 ملاحظة</div>
            <p>
              الحاسبة دي للحساب التقريبي لموظف واحد. نِظام HR بيحسب الأوفر
              تايم تلقائياً لكل موظفينك من بيانات الحضور الفعلية ويضيفه
              لقسيمة المرتب. <a href="/signup">جرّب نِظام مجاناً</a>.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-12">
          <div className="rounded-3xl bg-gradient-to-br from-brand-cyan to-brand-cyan-dark p-8 text-white shadow-xl">
            <h2 className="text-2xl md:text-3xl font-black mb-3">
              عايز الأوفر تايم يتحسب تلقائياً من الحضور؟
            </h2>
            <p className="text-cyan-50 mb-5">
              نِظام HR بيربط بصمة الحضور بالمرتبات ويحسب الساعات الإضافية
              لكل موظف بنسبها الصحيحة — من غير أي حساب يدوي. 14 يوم مجاناً.
            </p>
            <a
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-brand-cyan-dark font-bold shadow-md hover:shadow-lg transition"
            >
              🚀 ابدأ تجربة مجانية
            </a>
          </div>
        </section>
      </main>

      <BlogFooter />
    </div>
  );
}
