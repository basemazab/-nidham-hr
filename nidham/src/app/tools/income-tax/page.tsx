import type { Metadata } from "next";
import { IncomeTaxCalculator } from "./calculator";
import { ToolLeadCapture } from "@/components/tool-lead-capture";
import { BlogNav, BlogFooter } from "@/components/blog-chrome";
import { BreadcrumbSchema, HowToSchema } from "@/components/json-ld";

// ============================================================================
// /tools/income-tax — Free Egyptian income-tax (ضريبة كسب العمل) calculator
// ============================================================================
//
// Targets "حاسبة الضريبة على المرتبات" / "ضريبة كسب العمل 2026" — very high
// intent, perennial confusion every January when brackets change. Reuses
// the production tax engine so the numbers are authoritative.

export const metadata: Metadata = {
  title: {
    absolute:
      "حاسبة ضريبة كسب العمل في مصر 2026 — ضريبة المرتبات بالشرائح | نِظام HR",
  },
  description:
    "حاسبة ضريبة كسب العمل (ضريبة المرتبات) في مصر 2026 بالشرائح المتدرجة الجديدة: إعفاء 20,000، أول 40,000 بنسبة 0%، وحتى 27.5%. احسب ضريبتك الشهرية والسنوية مجاناً.",
  alternates: { canonical: "/tools/income-tax" },
  openGraph: {
    type: "website",
    title: "حاسبة ضريبة كسب العمل في مصر 2026 — مجانية",
    description:
      "احسب ضريبة المرتبات بالشرائح المتدرجة 2026 — شهري وسنوي، مع تفصيل كل شريحة.",
    url: "/tools/income-tax",
  },
  twitter: {
    card: "summary_large_image",
    title: "حاسبة ضريبة كسب العمل 2026",
    description: "ضريبة المرتبات بالشرائح المتدرجة الجديدة — مجاناً.",
  },
};

export default function IncomeTaxCalculatorPage() {
  return (
    <div className="min-h-screen bg-white font-cairo flex flex-col">
      <BlogNav />
      <BreadcrumbSchema
        items={[
          { name: "الرئيسية", url: "/" },
          { name: "أدوات مجانية", url: "/tools" },
          { name: "حاسبة ضريبة المرتبات", url: "/tools/income-tax" },
        ]}
      />
      <HowToSchema
        name="كيفية حساب ضريبة كسب العمل في مصر 2026"
        description="خطوات حساب ضريبة المرتبات بالشرائح المتدرجة بعد الإعفاء الشخصي طبقاً لتحديثات 2026."
        steps={[
          { name: "اخصم التأمينات", text: "يُخصم نصيب الموظف من التأمينات الاجتماعية (11%) من الراتب الإجمالي للوصول للدخل الخاضع." },
          { name: "احسب الدخل السنوي الخاضع", text: "اضرب الدخل الشهري الخاضع × 12 للحصول على الوعاء السنوي." },
          { name: "اخصم الإعفاء الشخصي", text: "يُخصم الإعفاء الشخصي السنوي 20,000 جنيه قبل تطبيق الشرائح." },
          { name: "طبّق الشرائح المتدرجة", text: "أول 40,000 بنسبة 0%، ثم 10% و15% و20% و22.5% و25% وحتى 27.5% للشريحة الأعلى." },
        ]}
      />

      <header className="px-6 pt-12 pb-6 max-w-3xl mx-auto w-full">
        <nav aria-label="breadcrumb" className="text-xs text-slate-500 mb-5">
          <a href="/" className="hover:text-brand-cyan-dark">الرئيسية</a>
          <span className="mx-2">›</span>
          <a href="/tools" className="hover:text-brand-cyan-dark">الأدوات</a>
          <span className="mx-2">›</span>
          <span className="text-slate-700">حاسبة ضريبة المرتبات</span>
        </nav>

        <div className="inline-block px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold mb-4">
          ⚡ أداة مجانية · بدون تسجيل
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-4">
          حاسبة ضريبة كسب العمل في مصر 2026
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed mb-2">
          احسب ضريبة المرتبات الشهرية والسنوية بالشرائح المتدرجة الجديدة
          لسنة 2026 — مع تفصيل كل شريحة ونسبتها.
        </p>
      </header>

      <main className="px-6 pb-12 max-w-3xl mx-auto w-full flex-1">
        <IncomeTaxCalculator />
        <ToolLeadCapture source="income-tax" />

        <section className="mt-12 prose-ar">
          <h2>شرائح ضريبة كسب العمل في مصر 2026</h2>
          <p>
            تطبّق الضريبة على الدخل السنوي الخاضع (بعد خصم التأمينات) وبعد
            استبعاد الإعفاء الشخصي 20,000 جنيه، حسب الشرائح المتدرجة:
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>الشريحة السنوية (بعد الإعفاء)</th>
                  <th>النسبة</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>أول 40,000</td><td>0%</td></tr>
                <tr><td>40,001 – 55,000</td><td>10%</td></tr>
                <tr><td>55,001 – 70,000</td><td>15%</td></tr>
                <tr><td>70,001 – 200,000</td><td>20%</td></tr>
                <tr><td>200,001 – 400,000</td><td>22.5%</td></tr>
                <tr><td>400,001 – 1,200,000</td><td>25%</td></tr>
                <tr><td>أكثر من 1,200,000</td><td>27.5%</td></tr>
              </tbody>
            </table>
          </div>

          <div className="callout">
            <div className="callout-title">💡 ملاحظة</div>
            <p>
              الحاسبة بتطبّق نفس معادلة محرّك المرتبات في نِظام. لحساب
              الضريبة آلياً لكل موظفينك + إقرار النموذج 4 ربع السنوي
              والنموذج 27 السنوي، <a href="/signup">جرّب نِظام مجاناً</a>.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-12">
          <div className="rounded-3xl bg-gradient-to-br from-brand-cyan to-brand-cyan-dark p-8 text-white shadow-xl">
            <h2 className="text-2xl md:text-3xl font-black mb-3">
              عايز الضريبة تتحسب وتتقدّم تلقائياً؟
            </h2>
            <p className="text-cyan-50 mb-5">
              نِظام HR بيحسب ضريبة كل موظفينك شهرياً، ويجهّز إقرارات
              النموذج 4 والنموذج 27 جاهزة للتقديم. 14 يوم مجاناً.
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
