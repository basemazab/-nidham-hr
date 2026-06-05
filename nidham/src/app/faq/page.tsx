import Link from "next/link";
import { FAQPageSchema } from "@/components/json-ld";

export const metadata = {
  title: "الأسئلة الشائعة — نِظام HR | كل ما تريد معرفته عن منصة HR المصرية",
  description:
    "أجوبة شاملة لكل أسئلتك عن نِظام: الأسعار، المميزات، التوافق مع قانون العمل المصري، الأمان، الدعم الفني، المقارنة مع Bayzat و ZenHR، وكيفية البدء.",
  alternates: { canonical: "/faq" },
  openGraph: {
    images: [{ url: "/api/og?title=" + encodeURIComponent("الأسئلة الشائعة — نِظام HR | كل ما تريد معرفته"), width: 1200, height: 630, alt: "الأسئلة الشائعة — نِظام HR" }],
  },
};

const FAQS = [
  // ── General ──
  {
    question: "ما هو نِظام؟",
    answer: "نِظام هي منصة HR + Payroll + CRM + AI متكاملة، مبنية خصيصاً للسوق المصري. بتوفر إدارة الموظفين، حضور بالـ GPS، حساب المرتبات والضرايب، إدارة الإجازات، CRM، توظيف ذكي، واستوديو تسويق — كل حاجة في نظام واحد.",
    category: "عام",
  },
  {
    question: "هل نِظام مناسب للشركات الناشئة والصغيرة؟",
    answer: "بالتأكيد. نِظام مصمم للشركات الناشئة والصغيرة في مصر — يبدأ من 500 جنيه شهرياً، ويوفر حل متكامل بديل لـ Excel، ويوفر وقت الـ HR مع أتمتة الرواتب والحضور والإجازات. في باقة مجانية للأبد لحد 5 موظفين بدون بطاقة ائتمان.",
    category: "عام",
  },
  {
    question: "إيه الفرق بين نِظام و Bayzat؟",
    answer: "Bayzat منصة إماراتية موجهة للخليج، مش متوافقة مع قانون العمل المصري 12/2003 ولا التأمينات 148/2019. نِظام مبني خصيصاً لمصر — بيحسب التأمينات بالشرائح المصرية وضريبة الدخل بـ 7 شرايح. السعر أقل بـ 60%.",
    category: "عام",
  },
  {
    question: "نِظام ولا ZenHR لمصر؟",
    answer: "ZenHR منصة أردنية بتنافس Bayzat في الخليج. أسعار ZenHR تبدأ من 4 دولار/موظف/شهر مع حد أدنى 50 موظف = 10,000+ ج/شهر. نِظام يبدأ من 0 ج (مجاني) و Pro بـ 1,500 ج/شهر لكل الشركة.",
    category: "عام",
  },
  {
    question: "هل يوفر نِظام فحص السير الذاتية بالذكاء الاصطناعي؟",
    answer: "نعم، نِظام يشمل فحص CVs بالـ AI — بيحلل السيرة الذاتية، يحسب درجة التطابق مع الوظيفة (0-100)، ويقترح أسئلة مقابلة شخصية مخصصة لكل مرشح.",
    category: "عام",
  },
  {
    question: "هل نِظام مناسب للشركات الكبيرة أو المؤسسات؟",
    answer: "نعم، باقة Business تدعم حتى 500 موظف، ونسخة Enterprise (On-Premise) متاحة للشركات اللي محتاجة بنية تحتية خاصة. Enterprise تشمل dedicated server، SLA 99.99%، و dedicated account manager.",
    category: "عام",
  },

  // ── Pricing ──
  {
    question: "هل أقدر أبدأ مجاناً قبل ما أدفع؟",
    answer: "أكيد. الباقة المجانية للأبد لحد 5 موظفين. بعدها لو شركتك كبرت، ترقّى للباقة المناسبة. مفيش credit card مطلوبة في البداية.",
    category: "الأسعار",
  },
  {
    question: "كم تكلفة نظام HR للشركات الصغيرة في مصر؟",
    answer: "نِظام يبدأ من 500 جنيه مصري شهرياً لـ 25 موظف (باقة Starter). الباقة Pro 1,500 جنيه لـ 100 موظف، والباقة Business 3,500 جنيه لـ 500 موظف. كل الباقات تشمل دعم فني وتحديثات قانونية.",
    category: "الأسعار",
  },
  {
    question: "هل السعر شامل ضريبة القيمة المضافة؟",
    answer: "السعر المعروض دون ضريبة. الـ VAT 14% بتنضاف على الفاتورة النهائية. لو شركتك مسجلة ضريبياً، تقدر تخصمها كـ input tax.",
    category: "الأسعار",
  },
  {
    question: "ممكن أدفع سنوياً وأخصم؟",
    answer: "أيوه — الدفع السنوي بيخصملك 20%. شركة 100 موظف على Pro: 1,500 ج/شهر ← 1,200 ج/شهر = 14,400 ج/سنة بدل 18,000 ج. بتوفّر 3,600 ج بدفعة واحدة.",
    category: "الأسعار",
  },
  {
    question: "هل عندي ضمان استرداد لو ما عجبنيش؟",
    answer: "أيوه — 30 يوم ضمان استرداد كامل لأول دفعة. مفيش أسئلة، بنرجّع الفلوس + بياناتك تقدر تـ export-ها كاملة.",
    category: "الأسعار",
  },
  {
    question: "هل في رسوم خفية أو مصاريف تركيب؟",
    answer: "لا. مفيش رسوم خفية ولا مصاريف تركيب. السعر اللي تشوفه هو اللي تدفعه. الترقية والباقة المجانية كلها واضحة من البداية.",
    category: "الأسعار",
  },

  // ── Features ──
  {
    question: "ازاي أحسب المرتب في مصر بعد التأمينات والضريبة؟",
    answer: "نِظام يحسب المرتب تلقائياً: خصم التأمينات 14% (11% موظف + 3% شركة) بحد أقصى 11,700 جنيه، وضريبة الدخل حسب الشرائح: أول 45,000 معفى، و10% لـ 45-65 ألف حتى 27.5% لأكثر من 300 ألف.",
    category: "المميزات",
  },
  {
    question: "هل نظام الحضور بالـ GPS قانوني في مصر؟",
    answer: "نعم، الحضور بالـ GPS قانوني في مصر. نِظام يستخدم GPS + سيلفي لتسجيل الحضور، مع geofence قابل للتعديل حول موقع الشركة. القانون لا يشترط طريقة محددة لتسجيل الحضور طالما موثقة.",
    category: "المميزات",
  },
  {
    question: "بنشتغل ZKTeco — هتقدروا تستوردوا منه؟",
    answer: "أيوه، استيراد Excel من جهاز ZKTeco مدمج بـ AI بيقرا الأعمدة العربية تلقائياً ومش بيخسر بصمة. متوسط الاستيراد: 30 ثانية لـ ملف 50 موظف لـ شهر كامل.",
    category: "المميزات",
  },
  {
    question: "هل في تطبيق موبايل للموظفين؟",
    answer: "نعم، في تطبيق موبايل PWA (مش محتاج تحميل من App Store) للموظفين. يقدر يعمل: تسجيل حضور بـ GPS، تقديم إجازات، استئذانات، سلف، مشاهدة القسيمة، والتواصل مع HR.",
    category: "المميزات",
  },
  {
    question: "هل نِظام بيدعم نماذج التأمينات الحكومية (1, 2, 6)؟",
    answer: "أيوه — نِظام بيصدّر نماذج 1 و 2 و 6 جاهزة لـ مكتب التأمينات. كل نموذج متوافق مع قانون 148/2019. نموذج 1 للتحاق العامل، نموذج 2 لإنهاء الخدمة، نموذج 6 لتعديل الأجر.",
    category: "المميزات",
  },

  // ── Legal & Compliance ──
  {
    question: "هل نِظام متوافق مع قانون العمل المصري 12/2003؟",
    answer: "نعم، نِظام مبني من الصفر ليكون متوافقاً مع قانون العمل المصري 12/2003 ولائحته التنفيذية. بيلتزم بكل الأحكام: حد أقصى 8 ساعات عمل، إجازات سنوية 21 يوم، تعويض 15 يوم نهاية الخدمة، وأحكام إنهاء التعاقد.",
    category: "القانون",
  },
  {
    question: "إزاي التأمينات الاجتماعية بتتحسب في نِظام؟",
    answer: "التأمينات الاجتماعية بتتحسب حسب قانون 148/2019: الاشتراك الأساسي 14% من المرتب (الموظف 9%، الشركة 5%) بحد أقصى 11,700 ج كممرتب اشتراك. المرض 1%، وإصابة العمل 2%، والتعطل 2%، والنظام التكميلي إضافي. كل ده بيحصل تلقائياً.",
    category: "القانون",
  },
  {
    question: "البيانات بتاعتي آمنة؟ خصوصاً المرتبات؟",
    answer: "كل البيانات الحساسة (رقم قومي، حساب بنكي) مشفّرة at-rest. بنتبع قانون حماية البيانات الشخصية المصري 151/2020. عندنا 2FA، audit log بـ SHA-256 chain ضد التزوير، و backup يومي على AWS.",
    category: "القانون",
  },
  {
    question: "ممكن أنقل لـ نظام تاني لو قررت؟",
    answer: "أيوه — تقدر تـ export كل بياناتك كـ Excel من /api/export في أي وقت. مفيش lock-in. ده حق محفوظ بـ PDPL Article 17 (right to data portability).",
    category: "القانون",
  },

  // ── Support ──
  {
    question: "في support بالعربي؟",
    answer: "أكيد. الـ support كله عربي مصري. Pro: عبر WhatsApp + Email. Business: priority WhatsApp + ساعات عمل أطول. Enterprise: dedicated account manager + SLA 4 ساعات response.",
    category: "الدعم",
  },
  {
    question: "هل في تدريب على استخدام النظام؟",
    answer: "نعم، مع كل اشتراك Pro و Business، بنعمل تدريب لفريق HR لمدة ساعة مجاناً عبر فيديو كول، وبنشرح كل المميزات خطوة بخطوة.",
    category: "الدعم",
  },
  {
    question: "في دعم فني في الإجازات والعطلات الرسمية؟",
    answer: "Business و Enterprise بياخدوا priority support حتى في العطلات الرسمية. Pro: أوقات العمل الرسمية (9 ص - 9 م) كل الأيام ما عدا الجمعة.",
    category: "الدعم",
  },
  {
    question: "إزاي أتواصل مع support؟",
    answer: "تقدر تتواصل عبر: واتساب 0105 535 6622 (للنظام)، إيميل nidhamhr@proton.me، أو من لوحة التحكم دايركت. الرد في خلال ساعة للـ Business، 4 ساعات للـ Pro.",
    category: "الدعم",
  },

  // ── Hiring / Jobs ──
  {
    question: "إزاي بنشر إعلان وظيفة في نِظام؟",
    answer: "بتعمل \"إعلان وظيفة\" جديد في لوحة التوظيف، بتكتب المسمى والوصف والمتطلبات والراتب، وبعدها بيطلع لينك عام (public) تقدر تشاركه على LinkedIn، Facebook، واتساب، أو تحطه في موقع الشركة. الـ CVs بتدخل تلقائياً للفحص بالـ AI.",
    category: "التوظيف",
  },
  {
    question: "كل شركة تقدر تحط رقم واتساب خاص للتوظيف؟",
    answer: "أيوه — كل شركة ليها رقم واتساب خاص للتوظيف في إعدادات الشركة. المرشحين يتواصلوا مباشرة مع الـ HR على الرقم ده، مش على الرقم الرئيسي للنظام.",
    category: "التوظيف",
  },
  {
    question: "هل فيه تكامل مع LinkedIn أو Wuzzuf؟",
    answer: "حالياً تقدر تشارك لينك الإعلان على أي منصة. التكامل المباشر مع LinkedIn و Wuzzuf تحت التطوير في النسخة الجاية.",
    category: "التوظيف",
  },

  // ── CRM & Marketing ──
  {
    question: "إيه هو استوديو التسويق في نِظام؟",
    answer: "استوديو التسويق (متاح في Enterprise) هو وكالة تسويق كاملة جواه النظام. بيشمل 6 أدوات AI: مصمم حملات، كاتب إعلانات، محسن SEO، مصمم landing pages، Lead capture forms، و Pipeline Kanban مع تحليلات.",
    category: "تسويق",
  },
  {
    question: "إيه الفرق بين CRM و استوديو التسويق؟",
    answer: "CRM لإدارة العملاء الحاليين (pipeline، عقود، تفاعلات). استوديو التسويق لجلب عملاء جدد (حملات، landing pages، leads). الاتنين متكاملين — الـ lead اللي يجي من الاستوديو بيتحول لـ client في الـ CRM.",
    category: "تسويق",
  },
  {
    question: "هل في تقارير وتحليلات في نِظام؟",
    answer: "نعم، في تقارير متعددة: تقرير الحضور الشهري، Bridge Analytics (التزام × إنتاجية)، تقارير مالية (إجمالي الرواتب، التأمينات، الضرايب)، و Marketing Analytics (leads، تحويلات، عائد).",
    category: "تسويق",
  },

  // ── Technical ──
  {
    question: "هل نِظام شغال على الإنترنت فقط (Cloud)؟",
    answer: "لا، نِظام متاح على نسختين: Cloud (اشتراك شهري) و On-Premise (Enterprise). نسخة On-Premise بتنزّل على سيرفر الشركة مباشرة، مناسبة للبنوك والجهات الحكومية والمؤسسات اللي محتاجة تحكم كامل في البيانات.",
    category: "تقني",
  },
  {
    question: "هل في API للتكامل مع أنظمة تانية؟",
    answer: "نعم، في REST API موثق. تقدر تكامل نِظام مع: ERP، المحاسبه، بوابات المرتبات، الأنظمة الداخلية. التوثيق موجود في /api-docs.",
    category: "تقني",
  },
  {
    question: "هل في Audit Log (سجل تدقيق)؟",
    answer: "نعم، كل إجراء في النظام مسجل في Audit Log بـ SHA-256 chain — مين عمل إيه وإمتى. ده بيمنع التلاعب بالبيانات وبيساعد في compliance مع قانون 151/2020.",
    category: "تقني",
  },
];

const CATEGORIES = [
  { key: "عام", icon: "ℹ️", desc: "كل ما تريد معرفته عن نِظام" },
  { key: "الأسعار", icon: "💰", desc: "الأسعار، الباقات، طرق الدفع، الضمان" },
  { key: "المميزات", icon: "⭐", desc: "المميزات التقنية والوظيفية" },
  { key: "القانون", icon: "⚖️", desc: "التوافق مع القوانين المصرية وحماية البيانات" },
  { key: "الدعم", icon: "💬", desc: "الدعم الفني، التواصل، التدريب" },
  { key: "التوظيف", icon: "💼", desc: "نشر الوظائف، فحص CVs، واتساب توظيف" },
  { key: "تسويق", icon: "📢", desc: "استوديو التسويق، CRM، التقارير" },
  { key: "تقني", icon: "⚙️", desc: "API، أمان، On-Premise، Audit Log" },
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-cyan-50/30">
      <FAQPageSchema questions={FAQS} />

      {/* Hero */}
      <section className="px-6 pt-20 pb-12 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black mb-4 font-display text-slate-900">
            الأسئلة الشائعة
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed font-cairo">
            كل ما تريد معرفته عن نِظام — الأسعار، المميزات، القوانين، الدعم، والتقنية.
          </p>
        </div>
      </section>

      {/* Category tabs */}
      <section className="px-6 pb-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => (
            <a
              key={cat.key}
              href={`#${cat.key}`}
              className="group flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 hover:border-brand-cyan/40 hover:shadow-md transition-all"
            >
              <span className="text-xl">{cat.icon}</span>
              <div className="text-right">
                <div className="font-bold font-cairo text-slate-800 group-hover:text-brand-cyan-dark transition-colors">
                  {cat.key}
                </div>
                <div className="text-xs text-slate-500 leading-tight font-cairo">{cat.desc}</div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* FAQ groups */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto space-y-10">
          {CATEGORIES.map((cat) => {
            const items = FAQS.filter((f) => f.category === cat.key);
            return (
              <div key={cat.key} id={cat.key}>
                <h2 className="text-2xl font-black font-cairo text-slate-900 mb-6 flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span>{cat.key}</span>
                </h2>
                <div className="space-y-3">
                  {items.map((faq) => (
                    <details
                      key={faq.question}
                      className="group bg-white rounded-xl border border-slate-200 open:border-brand-cyan/40 open:shadow-md transition-all overflow-hidden"
                    >
                      <summary className="flex items-center justify-between p-5 cursor-pointer list-none text-slate-800 font-bold font-cairo hover:text-brand-cyan-dark transition-colors">
                        <span>{faq.question}</span>
                        <span className="text-slate-400 group-open:rotate-180 group-open:text-brand-cyan-dark transition-transform shrink-0">
                          ▼
                        </span>
                      </summary>
                      <div className="px-5 pb-5 text-slate-600 leading-relaxed font-cairo border-t border-slate-100 pt-4">
                        {faq.answer}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20">
        <div className="max-w-2xl mx-auto text-center bg-gradient-to-br from-brand-cyan/10 to-brand-navy/10 rounded-3xl p-10 border border-brand-cyan/20">
          <h2 className="text-2xl font-black font-cairo text-slate-900 mb-3">
            لسه عندك سؤال؟
          </h2>
          <p className="text-slate-600 font-cairo mb-6">
            فريقنا يرد عليك في خلال ساعة على واتساب.
          </p>
          <a
            href="https://wa.me/201055356622?text=عندي%20استفسار%20عن%20نظام"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all font-cairo"
          >
            💬 تواصل معانا على واتساب
          </a>
        </div>
      </section>
    </main>
  );
}
