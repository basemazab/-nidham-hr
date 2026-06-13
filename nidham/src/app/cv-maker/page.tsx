import Link from "next/link";
import { CvMakerClient } from "./maker-client";

export const metadata = {
  title: "صانع السيرة الذاتية المجاني بالذكاء الاصطناعي | نِظام",
  description:
    "اعمل سيرة ذاتية احترافية متوافقة مع أنظمة التوظيف (ATS) في دقايق — مجانًا. ارفع سيرتك القديمة أو اكتب بياناتك، والذكاء الاصطناعي يحوّلها CV قوي بالعربي والإنجليزي. حمّلها PDF أو Word أو لينك تفاعلي.",
  alternates: { canonical: "https://www.nidhamhr.com/cv-maker" },
  openGraph: {
    title: "صانع السيرة الذاتية المجاني بالذكاء الاصطناعي | نِظام",
    description: "اعمل CV احترافي متوافق مع ATS في دقايق — مجانًا.",
  },
};

export const dynamic = "force-dynamic";

export default function CvMakerLanding() {
  const faqs = [
    { q: "هل صانع السيرة الذاتية مجاني؟", a: "نعم، اعمل سيرتك الذاتية وحمّلها مجانًا. كل اللي محتاجه إيميلك علشان نبعتلك النسخة." },
    { q: "يعني إيه سيرة متوافقة مع ATS؟", a: "ATS هي أنظمة الشركات اللي بتفلتر السير الذاتية آليًا قبل ما البشر يشوفوها. نِظام بيبني سيرتك بصيغة وكلمات مفتاحية تعدّي الفلترة دي وتزود فرصتك." },
    { q: "بيدعم العربي والإنجليزي؟", a: "أيوة، اكتب بأي لغة والسيرة هتطلع بنفس اللغة بتنسيق احترافي." },
    { q: "أقدر أحمّلها Word و PDF؟", a: "أيوة، تقدر تطبعها PDF، تحمّلها Word، أو تعملها صفحة تفاعلية بلينك تشاركه مع أصحاب الأعمال." },
  ];
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-cyan-50/30">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <nav className="print:hidden text-xs text-slate-500 mb-6 font-cairo flex items-center justify-between">
          <Link href="/" className="hover:text-brand-cyan-dark">نِظام</Link>
          <Link href="/signup" className="text-brand-cyan-dark font-bold hover:underline">نظام HR كامل لشركتك ←</Link>
        </nav>

        <header className="print:hidden text-center mb-8">
          <div className="inline-block px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-bold mb-3 font-cairo">✦ مجاني · بالذكاء الاصطناعي</div>
          <h1 className="text-3xl md:text-4xl font-black font-cairo text-slate-900 mb-3 leading-tight">
            اعمل سيرة ذاتية احترافية<br />تعدّي أنظمة التوظيف (ATS)
          </h1>
          <p className="text-base text-slate-600 font-cairo max-w-xl mx-auto leading-relaxed">
            ارفع سيرتك القديمة أو اكتب بياناتك بأي شكل — والذكاء الاصطناعي يحوّلها CV قوي
            بصيغة احترافية، يقيّم قوتها، وتحمّلها PDF أو Word أو لينك تفاعلي. في دقايق ومجانًا.
          </p>
        </header>

        <CvMakerClient />

        {/* FAQ for SEO */}
        <section className="print:hidden mt-12">
          <h2 className="text-xl font-black font-cairo text-slate-900 mb-4">أسئلة شائعة</h2>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <details key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                <summary className="font-bold text-slate-800 font-cairo cursor-pointer text-sm">{f.q}</summary>
                <p className="text-sm text-slate-600 font-cairo mt-2 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <footer className="print:hidden mt-10 text-center text-xs text-slate-400 font-cairo">
          صُنع بـ <Link href="/" className="text-brand-cyan-dark font-bold hover:underline">نِظام</Link> — منصة الموارد البشرية والتوظيف المصرية ·{" "}
          <Link href="/signup" className="hover:underline">جرّب نظام شركتك مجانًا</Link>
        </footer>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      </div>
    </main>
  );
}
