import type { Metadata } from "next";
import Link from "next/link";
import { FAQPageSchema, HowToSchema, BreadcrumbSchema } from "@/components/json-ld";

// ============================================================================
// /integrations/odoo — "ربط نِظام بـ Odoo" landing (inbound SEO)
// ============================================================================
//
// Different intent from the /blog "بديل Odoo" comparison post: this page is for
// companies that ALREADY run Odoo (inventory/accounting/manufacturing) and want
// to KEEP it but add Nidham's Egyptian-compliant HR + payroll, syncing data via
// the REST API. Captures the deal-killer question "can it connect to my Odoo?".

const TITLE = "ربط نِظام بـ Odoo — مزامنة الموظفين والحضور والمرتبات عبر API";
const DESC =
  "عندك Odoo وعايز HR ومرتبات مصرية متوافقة؟ اربط نِظام بـ Odoo عبر REST API موثّق (OpenAPI): اسحب الموظفين والحضور والمرتبات تلقائيًا، أو استورد/صدّر CSV. دليل عملي بمثال Python.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  keywords: [
    "ربط نظام HR بـ Odoo",
    "Odoo HR integration Egypt",
    "Odoo attendance sync",
    "Odoo payroll Egypt API",
    "تكامل Odoo موارد بشرية",
    "نظام حضور يتكامل مع Odoo",
  ],
  alternates: { canonical: "/integrations/odoo" },
  openGraph: {
    title: TITLE,
    description: DESC,
    url: "/integrations/odoo",
    images: [
      {
        url: "/api/og?title=" + encodeURIComponent("ربط نِظام بـ Odoo"),
        width: 1200,
        height: 630,
        alt: "ربط نِظام بـ Odoo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ربط نِظام بـ Odoo | نِظام HR",
    description: "اربط نِظام بـ Odoo عبر REST API — اسحب الموظفين والحضور والمرتبات.",
  },
};

const FAQS = [
  {
    question: "هل فيه موصل (connector) جاهز لـ Odoo في الـ App Store؟",
    answer:
      "لأ، مفيش موديول جاهز في Odoo App Store حاليًا. الربط بيتم عبر REST API الرسمي بتاع نِظام (سحب الموظفين والحضور والمرتبات بمفتاح API)، أو باستيراد/تصدير CSV، أو تكامل مخصص يبنيه فريق نِظام لعملاء Enterprise.",
  },
  {
    question: "أقدر أسحب الحضور من نِظام لـ Odoo تلقائيًا؟",
    answer:
      "أيوه. نِظام عنده endpoint رسمي GET /api/v1/attendance بيرجّع سجلات الحضور بفلترة بالتاريخ والموظف، وتقدر تعمل Scheduled Action في Odoo (Python) تسحب البيانات يوميًا وتحوّلها hr.attendance.",
  },
  {
    question: "إيه البيانات اللي الـ API بيغطيها؟",
    answer:
      "حاليًا: الموظفين (قراءة وكتابة)، الحضور (قراءة)، والمرتبات (قراءة) — كلها موثّقة بمواصفة OpenAPI 3.1 على /api-docs. كل مفتاح API له صلاحيات محددة (read/write) ومربوط بشركتك فقط.",
  },
  {
    question: "أربط ولا أستبدل Odoo؟",
    answer:
      "لو Odoo شغّال عندك للمخازن والحسابات والتصنيع، خليه — واربط نِظام معاه للـ HR والمرتبات المصرية المتوافقة. لو كل اللي محتاجه HR ومرتبات بس، نِظام بديل أبسط وأرخص (شوف مقارنة بديل Odoo HR في المدونة).",
  },
  {
    question: "محتاج مبرمج عشان أربط؟",
    answer:
      "للربط التلقائي بالـ API: أيوه يفضّل مبرمج (أو فريقك التقني). من غير برمجة: استخدم استيراد/تصدير CSV للمزامنة الدورية اليدوية. ولعملاء Enterprise: فريق نِظام بيبني الربط على سيرفرك.",
  },
];

const HOWTO_STEPS = [
  {
    name: "اطلع مفتاح API",
    text: "من Dashboard ← الإعدادات ← مفاتيح API، أنشئ مفتاح بصلاحيات employees:read و attendance:read و payroll:read وانسخه (بيظهر مرة واحدة).",
  },
  {
    name: "اربط كود الموظف",
    text: "اتأكد إن كود الموظف في نِظام مطابق لحقل barcode (أو أي حقل) في Odoo عشان المطابقة تشتغل صح.",
  },
  {
    name: "أنشئ Scheduled Action في Odoo",
    text: "أضف Server Action نوعها Python تستدعي GET /api/v1/attendance يوميًا وتنشئ سجلات hr.attendance في Odoo.",
  },
];

const PY_EXAMPLE = `import requests
BASE = "https://www.nidhamhr.com/api/v1"
HEADERS = {"Authorization": "Bearer nidham_pro_xxx"}

# اسحب حضور اليوم من نِظام
r = requests.get(f"{BASE}/attendance", headers=HEADERS,
                 params={"from": "2026-06-14", "to": "2026-06-14", "limit": 100})

for rec in r.json()["data"]:
    code = rec["employees"]["employee_code"]
    emp = env["hr.employee"].search([("barcode", "=", code)], limit=1)
    if emp and rec["check_in"]:
        env["hr.attendance"].create({
            "employee_id": emp.id,
            "check_in":  f"{rec['date']} {rec['check_in']}",
            "check_out": f"{rec['date']} {rec['check_out']}" if rec["check_out"] else False,
        })`;

const ENDPOINTS = [
  { m: "GET", path: "/employees", desc: "قائمة الموظفين (ترقيم + تصفية)", scope: "employees:read" },
  { m: "GET", path: "/attendance", desc: "سجلات الحضور (from/to/employee/status)", scope: "attendance:read" },
  { m: "POST", path: "/attendance", desc: "تسجيل/تحديث حضور دفعة (Odoo يبعت لنِظام)", scope: "attendance:write" },
  { m: "GET", path: "/payroll", desc: "بيانات المرتبات والتأمينات", scope: "payroll:read" },
];

const METHODS = [
  {
    emoji: "🔌",
    title: "REST API (الموصى به)",
    body: "اسحب الموظفين والحضور والمرتبات من نِظام بمفتاح API. مثالي للمزامنة التلقائية اليومية مع Odoo.",
    tag: "للمبرمجين / IT",
  },
  {
    emoji: "📊",
    title: "استيراد / تصدير CSV",
    body: "صدّر البيانات من نِظام Excel/CSV واستوردها في Odoo بـ mapping للأعمدة. من غير أي برمجة.",
    tag: "أي مستخدم",
  },
  {
    emoji: "🛠",
    title: "تكامل مخصص (Enterprise)",
    body: "فريق نِظام بيبني الموصل على سيرفرك — ربط ثنائي الاتجاه أو on-prem حسب احتياجك.",
    tag: "بدعم الفريق",
  },
];

export default function OdooIntegrationPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 py-12 px-6">
      <FAQPageSchema questions={FAQS} />
      <HowToSchema
        name="ربط نِظام بـ Odoo عبر REST API"
        description="خطوات ربط نظام نِظام للموارد البشرية بـ Odoo لمزامنة الموظفين والحضور والمرتبات."
        steps={HOWTO_STEPS}
      />
      <BreadcrumbSchema
        items={[
          { name: "الرئيسية", url: "/" },
          { name: "التكاملات", url: "/integrations" },
          { name: "Odoo", url: "/integrations/odoo" },
        ]}
      />

      <div className="max-w-4xl mx-auto">
        <Link
          href="/integrations"
          className="text-sm text-brand-cyan-dark hover:underline font-cairo mb-6 inline-block"
        >
          ← كل التكاملات
        </Link>

        {/* Hero */}
        <header className="mb-12 text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-cyan-50 border border-cyan-300 text-cyan-700 text-xs font-bold mb-4 font-cairo">
            🔌 تكامل · Odoo + نِظام HR
          </div>
          <h1 className="text-3xl md:text-5xl font-black font-cairo text-slate-900 mb-4 leading-tight">
            عندك Odoo؟ اربطه بـ نِظام للموارد البشرية المصرية
          </h1>
          <p className="text-lg text-slate-600 font-cairo max-w-2xl mx-auto leading-relaxed">
            خلّي Odoo للمخازن والحسابات والتصنيع — وخلّي{" "}
            <Link href="/" className="text-brand-cyan-dark font-bold hover:underline">
              نِظام
            </Link>{" "}
            للـ HR والمرتبات المصرية المتوافقة. اربطهم عبر REST API موثّق وامزِج
            البيانات تلقائيًا.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 justify-center">
            <Link
              href="/signup"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white font-black font-cairo shadow-lg hover:opacity-95 transition"
            >
              جرّب مجانًا 14 يوم
            </Link>
            <a
              href="https://wa.me/201055356622?text=أهلاً، عايز أعرف عن ربط نِظام بـ Odoo"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-white border border-slate-300 text-slate-700 font-black font-cairo hover:border-brand-cyan transition"
            >
              💬 اسأل عن الربط
            </a>
          </div>
        </header>

        {/* 3 methods */}
        <section className="mb-12">
          <h2 className="text-2xl font-black font-cairo text-slate-900 mb-5">
            ٣ طرق للربط — حسب احتياجك
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {METHODS.map((m) => (
              <div
                key={m.title}
                className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-brand-cyan/40 transition"
              >
                <div className="text-4xl mb-3">{m.emoji}</div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="font-black text-slate-900 font-cairo">{m.title}</h3>
                </div>
                <p className="text-sm text-slate-700 font-cairo leading-relaxed mb-3">
                  {m.body}
                </p>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold font-cairo">
                  {m.tag}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* API endpoints */}
        <section className="mb-12">
          <h2 className="text-2xl font-black font-cairo text-slate-900 mb-2">
            الـ API في سطور
          </h2>
          <p className="text-sm text-slate-600 font-cairo mb-5">
            الأساس <code className="bg-slate-100 px-1.5 py-0.5 rounded text-brand-cyan-dark" dir="ltr">https://www.nidhamhr.com/api/v1</code> · مصادقة Bearer · التوثيق الكامل على{" "}
            <Link href="/api-docs" className="text-brand-cyan-dark font-bold hover:underline">/api-docs</Link>
          </p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-right text-sm font-cairo">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-black text-slate-700">Endpoint</th>
                  <th className="px-4 py-3 font-black text-slate-700">الوصف</th>
                  <th className="px-4 py-3 font-black text-slate-700">الصلاحية</th>
                </tr>
              </thead>
              <tbody>
                {ENDPOINTS.map((e) => (
                  <tr key={e.path} className="border-t border-slate-100">
                    <td className="px-4 py-3" dir="ltr">
                      <span className="text-[11px] font-bold text-emerald-600">{e.m}</span>{" "}
                      <code className="text-slate-800">{e.path}</code>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{e.desc}</td>
                    <td className="px-4 py-3" dir="ltr">
                      <code className="text-xs text-slate-500">{e.scope}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Code example */}
        <section className="mb-12">
          <h2 className="text-2xl font-black font-cairo text-slate-900 mb-2">
            مثال: مزامنة الحضور لـ Odoo
          </h2>
          <p className="text-sm text-slate-600 font-cairo mb-4">
            Server Action نوعها Python في Odoo (Settings ← Technical ← Scheduled
            Actions) تسحب حضور اليوم من نِظام وتنشئ <code className="bg-slate-100 px-1 rounded" dir="ltr">hr.attendance</code>:
          </p>
          <pre
            className="bg-slate-900 text-slate-100 p-4 rounded-2xl font-mono text-xs overflow-x-auto leading-relaxed"
            dir="ltr"
          >
            <code>{PY_EXAMPLE}</code>
          </pre>
          <p className="text-xs text-slate-500 font-cairo mt-3">
            اربط <strong>كود الموظف في نِظام</strong> بحقل <code dir="ltr">barcode</code> في Odoo عشان المطابقة تشتغل.
          </p>
        </section>

        {/* Honesty note */}
        <section className="mb-12">
          <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-200">
            <p className="text-sm text-amber-900 font-cairo leading-relaxed">
              <strong>بصراحة:</strong> مفيش موصل Odoo جاهز في الـ App Store حاليًا —
              الربط بيتم بالطرق اللي فوق (API / CSV / تكامل مخصص). لو محتاج ربط
              معيّن، كلّمنا ونشوف أنسب طريقة لشركتك.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl font-black font-cairo text-slate-900 mb-5">
            أسئلة شائعة
          </h2>
          <div className="space-y-3">
            {FAQS.map((f) => (
              <details
                key={f.question}
                className="group p-4 bg-white rounded-2xl border border-slate-100 shadow-sm"
              >
                <summary className="font-bold text-slate-900 font-cairo cursor-pointer list-none flex items-center justify-between gap-3">
                  {f.question}
                  <span className="text-brand-cyan-dark group-open:rotate-45 transition shrink-0">+</span>
                </summary>
                <p className="text-sm text-slate-700 font-cairo leading-relaxed mt-3">
                  {f.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="p-8 rounded-3xl bg-gradient-to-br from-brand-cyan-dark to-brand-navy text-white text-center">
          <h2 className="text-2xl font-black font-cairo mb-3">جرّب نِظام مع Odoo</h2>
          <p className="text-cyan-100 font-cairo mb-6 max-w-xl mx-auto">
            14 يوم مجانًا بدون كارت. ولو محتاج مساعدة في الربط، فريقنا معاك.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/signup"
              className="px-6 py-3 rounded-xl bg-white text-brand-cyan-dark font-black font-cairo hover:bg-cyan-50 transition"
            >
              ابدأ التجربة
            </Link>
            <Link
              href="/blog/odoo-hr-alternative-egypt"
              className="px-6 py-3 rounded-xl bg-white/10 border border-white/30 text-white font-black font-cairo hover:bg-white/20 transition"
            >
              أربط ولا أستبدل؟ (مقارنة)
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
