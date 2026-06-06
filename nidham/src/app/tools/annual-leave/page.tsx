import type { Metadata } from "next";
import { AnnualLeaveCalculator } from "./calculator";
import { ToolLeadCapture } from "@/components/tool-lead-capture";
import { BlogNav, BlogFooter } from "@/components/blog-chrome";
import { BreadcrumbSchema, HowToSchema } from "@/components/json-ld";

// ============================================================================
// /tools/annual-leave — Free Egyptian annual-leave entitlement calculator
// ============================================================================
//
// Targets "حساب رصيد الإجازات السنوية" / "الإجازة السنوية قانون العمل" —
// recurring HR + employee question. Encodes Article 47 of Law 12/2003.

export const metadata: Metadata = {
  title: {
    absolute:
      "حاسبة رصيد الإجازة السنوية في مصر — قانون العمل المادة 47 | نِظام HR",
  },
  description:
    "احسب رصيد الإجازة السنوية المستحق لأي موظف حسب المادة 47 من قانون العمل المصري 12/2003: 21 يوم بعد 6 شهور، 30 يوم بعد 10 سنوات أو فوق 50 سنة، +7 أيام للأعمال الشاقة. مجاناً.",
  alternates: { canonical: "/tools/annual-leave" },
  openGraph: {
    type: "website",
    title: "حاسبة رصيد الإجازة السنوية في مصر — مجانية",
    description:
      "احسب الإجازة السنوية المستحقة حسب سنوات الخدمة والعمر طبقاً لقانون العمل.",
    url: "/tools/annual-leave",
  },
  twitter: {
    card: "summary_large_image",
    title: "حاسبة رصيد الإجازة السنوية في مصر",
    description: "21 / 30 يوم حسب المادة 47 من قانون العمل — مجاناً.",
  },
};

export default function AnnualLeaveCalculatorPage() {
  return (
    <div className="min-h-screen bg-white font-cairo flex flex-col">
      <BlogNav />
      <BreadcrumbSchema
        items={[
          { name: "الرئيسية", url: "/" },
          { name: "أدوات مجانية", url: "/tools" },
          { name: "حاسبة الإجازة السنوية", url: "/tools/annual-leave" },
        ]}
      />
      <HowToSchema
        name="كيفية حساب رصيد الإجازة السنوية في مصر"
        description="خطوات حساب الإجازة السنوية المستحقة طبقاً للمادة 47 من قانون العمل المصري 12/2003."
        steps={[
          { name: "احسب مدة الخدمة", text: "اجمع سنوات وشهور الخدمة المتصلة لدى صاحب العمل." },
          { name: "حدد الفئة", text: "أقل من 6 شهور: غير مستحقة. من 6 شهور حتى 10 سنوات: 21 يوم. 10 سنوات أو فوق 50 سنة: 30 يوم." },
          { name: "أضف علاوة العمل الشاق", text: "تُضاف 7 أيام للأعمال الشاقة أو الخطرة أو في المناطق النائية." },
          { name: "اعرض الرصيد", text: "الناتج هو رصيد الإجازة السنوية المستحق للموظف." },
        ]}
      />

      <header className="px-6 pt-12 pb-6 max-w-3xl mx-auto w-full">
        <nav aria-label="breadcrumb" className="text-xs text-slate-500 mb-5">
          <a href="/" className="hover:text-brand-cyan-dark">الرئيسية</a>
          <span className="mx-2">›</span>
          <a href="/tools" className="hover:text-brand-cyan-dark">الأدوات</a>
          <span className="mx-2">›</span>
          <span className="text-slate-700">حاسبة الإجازة السنوية</span>
        </nav>

        <div className="inline-block px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold mb-4">
          ⚡ أداة مجانية · بدون تسجيل
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-4">
          حاسبة رصيد الإجازة السنوية في مصر
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed mb-2">
          احسب رصيد الإجازة السنوية المستحق لأي موظف حسب المادة 47 من قانون
          العمل 12/2003 — بناءً على مدة الخدمة والعمر ونوع العمل.
        </p>
      </header>

      <main className="px-6 pb-12 max-w-3xl mx-auto w-full flex-1">
        <AnnualLeaveCalculator />
        <ToolLeadCapture source="annual-leave" />

        <section className="mt-12 prose-ar">
          <h2>قواعد الإجازة السنوية في قانون العمل المصري</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>الحالة</th>
                  <th>الرصيد السنوي</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>أقل من 6 شهور خدمة</td><td>غير مستحقة</td></tr>
                <tr><td>من 6 شهور حتى أقل من سنة</td><td>بنسبة مدة الخدمة</td></tr>
                <tr><td>من سنة حتى 10 سنوات</td><td>21 يوم</td></tr>
                <tr><td>10 سنوات خدمة فأكثر</td><td>30 يوم</td></tr>
                <tr><td>السن 50 سنة فأكثر</td><td>30 يوم</td></tr>
                <tr><td>أعمال شاقة / مناطق نائية</td><td>+7 أيام</td></tr>
              </tbody>
            </table>
          </div>

          <div className="callout">
            <div className="callout-title">💡 ملاحظة</div>
            <p>
              عدم منح الإجازة السنوية المستحقة مخالفة عمالية (تعويض ضعف الأجر
              + غرامة). نِظام HR بيتابع رصيد كل موظف تلقائياً ويرحّل المتبقي
              لآخر السنة. <a href="/signup">جرّب نِظام مجاناً</a>.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-12">
          <div className="rounded-3xl bg-gradient-to-br from-brand-cyan to-brand-cyan-dark p-8 text-white shadow-xl">
            <h2 className="text-2xl md:text-3xl font-black mb-3">
              عايز رصيد الإجازات يتحسب لكل موظفينك تلقائياً؟
            </h2>
            <p className="text-cyan-50 mb-5">
              نِظام HR بيحسب رصيد كل موظف حسب أقدميته، يتابع الطلبات
              والمستخدم، ويرحّل المتبقي لآخر السنة. 14 يوم مجاناً.
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
