import type { Metadata } from "next";
import { ComplianceChecklist } from "./checklist";
import { BlogNav, BlogFooter } from "@/components/blog-chrome";
import { BreadcrumbSchema } from "@/components/json-ld";

// ============================================================================
// /tools/compliance-checklist — Free interactive HR compliance checklist
// ============================================================================
//
// Lead magnet. Targets "قائمة امتثال HR" / "التزامات قانون العمل المصري".
// Interactive + persistent (localStorage) so it's sticky and shareable —
// a better organic asset than a gated PDF (ranks + no friction). Every
// unchecked item is a pain Nidham removes.

export const metadata: Metadata = {
  title: {
    absolute:
      "قائمة امتثال HR للشركات المصرية 2026 — تشيك ليست قانون العمل | نِظام HR",
  },
  description:
    "قائمة امتثال HR تفاعلية مجانية للشركات المصرية 2026: التعاقد، التأمينات 148/2019، الضرائب، ساعات العمل والإجازات، اللوائح والسلامة، وإنهاء الخدمة. راجع التزام شركتك بند بند.",
  alternates: { canonical: "/tools/compliance-checklist" },
  openGraph: {
    type: "website",
    title: "قائمة امتثال HR للشركات المصرية 2026 — مجانية",
    description:
      "تشيك ليست تفاعلية لكل التزامات قانون العمل والتأمينات والضرائب المصرية. راجع شركتك.",
    url: "/tools/compliance-checklist",
  },
  twitter: {
    card: "summary_large_image",
    title: "قائمة امتثال HR للشركات المصرية 2026",
    description: "تشيك ليست تفاعلية لكل التزاماتك القانونية — مجاناً.",
  },
};

export default function ComplianceChecklistPage() {
  return (
    <div className="min-h-screen bg-white font-cairo flex flex-col">
      <BlogNav />
      <BreadcrumbSchema
        items={[
          { name: "الرئيسية", url: "/" },
          { name: "أدوات مجانية", url: "/tools" },
          { name: "قائمة امتثال HR", url: "/tools/compliance-checklist" },
        ]}
      />

      <header className="px-6 pt-12 pb-6 max-w-3xl mx-auto w-full">
        <nav aria-label="breadcrumb" className="text-xs text-slate-500 mb-5">
          <a href="/" className="hover:text-brand-cyan-dark">الرئيسية</a>
          <span className="mx-2">›</span>
          <a href="/tools" className="hover:text-brand-cyan-dark">الأدوات</a>
          <span className="mx-2">›</span>
          <span className="text-slate-700">قائمة الامتثال</span>
        </nav>

        <div className="inline-block px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold mb-4">
          ⚡ أداة مجانية · تقدّمك بيتحفظ تلقائياً
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-4">
          قائمة امتثال HR للشركات المصرية 2026
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed mb-2">
          راجع التزام شركتك ببنود قانون العمل 12/2003، التأمينات 148/2019،
          الضرائب، والسلامة — بند بند. علّم اللي خلصته، وشوف نسبة التزامك.
        </p>
      </header>

      <main className="px-6 pb-12 max-w-3xl mx-auto w-full flex-1">
        <ComplianceChecklist />

        <section className="mt-12 prose-ar">
          <h2>ليه الامتثال مهم؟</h2>
          <p>
            مكتب العمل والتأمينات بيراجعوا التزام الشركة، والمخالفات تكلّف
            غرامات كبيرة (تأخير نموذج 1، عدم منح الإجازات، أخطاء التأمينات).
            القائمة دي بتساعدك تكتشف الثغرات قبل ما تتحول لغرامات.
          </p>
          <div className="callout">
            <div className="callout-title">💡 ملاحظة</div>
            <p>
              معظم بنود القائمة دي نِظام HR بيأتمتها لك تلقائياً.{" "}
              <a href="/signup">جرّب مجاناً</a> وحوّل القائمة لنظام شغّال.
            </p>
          </div>
        </section>
      </main>

      <BlogFooter />
    </div>
  );
}
