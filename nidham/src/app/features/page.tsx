import Link from "next/link";

export const metadata = {
  title:
    "مميزات نظام HR مصري متكامل — إدارة الموظفين، رواتب، حضور، AI وواتساب",
  description:
    "نظام HR مصري 100% بإدارة الموظفين، payroll، حضور GPS + سيلفي، واتساب بوت، فحص CVs بالذكاء الاصطناعي، AI Agent، نماذج رسمية جاهزة، تقارير وتحليلات. جرّب مجاناً 14 يوم.",
  alternates: { canonical: "/features" },
  openGraph: {
    images: [{ url: "/api/og?title=" + encodeURIComponent("مميزات نظام HR مصري — إدارة موظفين، رواتب، حضور، AI"), width: 1200, height: 630, alt: "مميزات نظام HR مصري — إدارة موظفين، رواتب، حضور، AI" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "مميزات نظام HR مصري متكامل | نِظام",
    description: "نظام HR مصري 100%: إدارة موظفين، payroll، حضور GPS + سيلفي، واتساب بوت، فحص CVs بالـ AI، نماذج رسمية. جرّب مجاناً 14 يوم.",
  },
};

const FEATURES = [
  {
    icon: "👥",
    title: "إدارة الموظفين",
    desc: "ملف متكامل لكل موظف: بيانات شخصية، مرتب، تأمينات، بنك، مستندات. رفع Excel أو PDF بالـ AI — النظام بيفرغ ويخزن البيانات تلقائياً. QR code لكل موظف.",
    highlights: ["رفع Excel + CSV", "PDF OCR بالـ AI", "QR Code لكل موظف", "Audit Log كامل"],
  },
  {
    icon: "💰",
    title: "الرواتب والأجور (Payroll)",
    desc: "دورة مرتبات متكاملة: احتساب الغياب، الإضافي، التأمينات 14%، 12%، ضريبة مرتبات، سلف، إجازات، خصومات. كشف مرتب إلكتروني + طباعة. متوافق مع قانون العمل 12/2003.",
    highlights: ["احتساب تلقائي للتأمينات", "ضريبة مرتبات مدمجة", "كشف مرتب PDF", "GFSS-ready"],
  },
  {
    icon: "⏰",
    title: "الحضور والانصراف",
    desc: "نظام حضور متكامل: ربط لحظي لأجهزة ZKTeco/Hikvision (Cloud-Push — البصمة تظهر فورًا بدون تصدير يدوي) + GPS + سيلفي (تسجيل حضور من الموبايل بصورة + موقع)، Geofencing 100م، تسجيل الإجازات بكل أنواعها.",
    highlights: ["ZKTeco لحظي", "GPS + سيلفي", "Geofencing", "إجازات وسلف"],
  },
  {
    icon: "📱",
    title: "واتساب بوت للموظفين",
    desc: "أول HR bot بالعربي على واتساب. الموظف بيكتب: 'عايز كشف مرتبي'، 'أعمل إجازة بكرة'، 'عايز سلفة 500' — البوت يرد فوراً ويخلص المعاملة. بدون تطبيق، بدون تدريب.",
    highlights: ["كشف مرتب فوري", "تسجيل إجازة", "تقديم سلفة", "إستعلام رصيد"],
  },
  {
    icon: "📋",
    title: "النماذج الرسمية",
    desc: "9 نماذج جاهزة للطباعة مطابقة لمتطلبات مكتب العمل والتأمينات والمعاشات: نموذج 1 تأمينات، نموذج 2، نموذج 6، شهادة خبرة، شهادة راتب، عقد عمل (المفردات + النظامي)، إفادة مرتب، خطاب إنذار، محضر جزاء.",
    highlights: ["نموذج 1 و2 و6", "شهادة خبرة + راتب", "عقد عمل قانوني", "طباعة بصمة"],
  },
  {
    icon: "🤖",
    title: "AI Agent الداخلي",
    desc: "مساعد ذكي للموظفين والـ HR. يرد على أسئلة: 'كم باقي من إجازاتي؟' | 'إمتى آخر يوم لاستلام المعاش؟' | 'أرسل كشف مرتب أحمد'. مش شات بوت عادي — Agent بيفهم السياق.",
    highlights: ["أسئلة الموظفين", "تنفيذ إجراءات", "ربط بالبيانات", "بالعربي"],
  },
  {
    icon: "🧠",
    title: "فحص CVs بالذكاء الاصطناعي",
    desc: "ارفع 100 CV دقيقة واحدة — النظام يقرأهم، يستخرج المهارات، الخبرات، المؤهلات، يرتبهم حسب مطابقتهم للوصف الوظيفي، ويطلعك بأفضل 5 مرشحين. متكامل مع إعلانات الوظائف.",
    highlights: ["استخراج تلقائي", "تصنيف مهارات", "توصية مرشحين", "إعلانات وظائف"],
  },
  {
    icon: "🎯",
    title: "التسويق والمبيعات (CRM + Studio)",
    desc: "CRM متكامل مع Pipeline مبيعات: إدارة العملاء المتوقعين، مراحل البيع، عروض أسعار. واستوديو تسويق AI: بوستات، إعلانات، Landing Pages، تحليل سوق. نظام واحد بدل 3 أدوات.",
    highlights: ["CRM + Pipeline", "توليد بوستات", "Landing Pages", "Bridge Analytics"],
  },
  {
    icon: "📊",
    title: "التقارير والتحليلات",
    desc: "تقارير جاهزة: حضور، مرتبات، إجازات، تأمينات. تقارير مخصصة. Bridge Analytics: يربط أداء المبيعات بمعدلات الحضور — تشوف لو في علاقة بين غياب المبيعات والأداء.",
    highlights: ["تقارير حضور", "مرتبات وإجازات", "مخصصة وجاهزة", "Bridge Analytics"],
  },
  {
    icon: "🔒",
    title: "الأمان والحماية",
    desc: "تشفير AES-256، متوافق مع PDPL 151/2020، Audit Log لكل وصول، صلاحيات (HR، مدير، موظف، مشرف)، 2FA، خوادم مصرية (Azure Egypt). معايير الأمان العالمية.",
    highlights: ["AES-256", "PDPL المصري", "صلاحيات و 2FA", "Azure مصر"],
  },
];

const FAQS = [
  { q: "هل نظام HR متوافق مع قانون العمل المصري؟", a: "أيوه. نِظام مبني على قانون العمل 12/2003 وقانون التأمينات 148/2019. كل الحسابات — التأمينات (14% و12% و 11% وكذا شريحة)، ضريبة المرتبات، الإجازات — مضبوطة على القانون المصري." },
  { q: "هل ينفع أربط جهاز بصمة بنظام HR؟", a: "أيوه. أجهزة ZKTeco اللي بتدعم Cloud Server بتبعت البصمات لحظيًا للنظام (بروتوكول ADMS) أول ما الموظف يبصم — تظهر فورًا للمراجعة بدون أي تصدير يدوي؛ بتسجّل الجهاز بالرقم التسلسلي مرة واحدة وخلاص. وللأجهزة الأقدم فيه استيراد ملف ATTLOG بالـ AI. وكمان فيه نظام حضور بديل: GPS + سيلفي من الموبايل بدون جهاز بصمة." },
  { q: "إيه الفرق بين نِظام و Bayzat و ZenHR؟", a: "نِظام مصري 100% بالجنيه المصري وسعره أقل 60-85%. Bayzat و ZenHR بالدولار وأغلى. فيه AI وواتساب بوت و CRM واستوديو تسويق مدمجين — المنافسين عندهم HR بس." },
  { q: "هل في حد أقصى لعدد الموظفين؟", a: "أبداً. الباقات من 5 موظفين (مجاني) لحد 100+ (Pro). لو شركتك كبيرة، تواصل معانا على واتساب وبنظمل لك الخصم." },
  { q: "هل ينفع أستورد بيانات موظفيني من Excel؟", a: "أيوه. فيه رفع Excel مباشر. وكمان رفع PDF بالـ AI — ارفع ملفات PDF والـ AI بيفرغ البيانات ويخزنها تلقائياً." },
  { q: "هل فيه تطبيق موبايل للموظفين؟", a: "الموظفين مش محتاجين تطبيق. كل حاجة على WhatsApp — حضور، إجازات، سلف، كشف مرتب. بدون تحميل، بدون تدريب." },
  { q: "هل في فترة تجربة مجانية؟", a: "أيوه. 14 يوم تجربة مجانية بكل مميزات Pro. مفيش بطاقة ائتمان. تقدر تلغي في أي وقت." },
  { q: "هل تقدر تدعم الـ Payroll للشركات الصناعية والخدمية؟", a: "أيوه. النظام بيدعم الحالتين: تأمينات 14% للصناعي و 12% للخدمي + 11% للشركات بتوع المقاولات. أيام العمل: 26 و 30 يوم. الوضع الليلي حسب القانون." },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((faq) => ({
              "@type": "Question",
              name: faq.q,
              acceptedAnswer: { "@type": "Answer", text: faq.a },
            })),
          }),
        }}
      />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-12 text-center">
        <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 text-xs font-bold font-cairo mb-4">
          🚀 نظام HR متكامل — بالعربي — بالذكاء الاصطناعي
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-cairo text-slate-900 dark:text-slate-50 mb-4 leading-tight">
          مميزات نظام HR مصري متكامل
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 font-cairo max-w-2xl mx-auto mb-6">
          من إدارة الموظفين و payroll لحد واتساب بوت و AI — كل اللي محتاجه في نظام واحد. مصري 100%.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/signup"
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-black font-cairo text-sm shadow-lg hover:shadow-xl transition hover:-translate-y-0.5"
          >
            🚀 ابدأ تجربة مجانية — 14 يوم
          </Link>
          <Link
            href="/compare"
            className="px-8 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold font-cairo text-sm hover:border-indigo-400 transition"
          >
            📊 مقارنة مع Bayzat و ZenHR
          </Link>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/30 dark:to-violet-900/30 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-xl shrink-0">
                  {f.icon}
                </div>
                <h2 className="text-base font-black font-cairo text-slate-800 dark:text-slate-200">{f.title}</h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-cairo leading-relaxed mb-3">{f.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {f.highlights.map((h) => (
                  <span key={h} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-cairo">{h}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Internal links */}
      <section className="max-w-3xl mx-auto px-4 pb-6 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-cairo text-slate-500">
          <Link href="/blog/labor-law-compliance-nidham" className="hover:text-brand-cyan-dark transition underline underline-offset-2">📋 التوافق مع قانون العمل 12/2003</Link>
          <span className="text-slate-300">·</span>
          <Link href="/blog/social-insurance-form-1-egypt" className="hover:text-brand-cyan-dark transition underline underline-offset-2">📄 نموذج 1 تأمينات</Link>
          <span className="text-slate-300">·</span>
          <Link href="/pricing" className="hover:text-brand-cyan-dark transition underline underline-offset-2">💰 الأسعار</Link>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 pb-12 text-center">
        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl p-8 sm:p-12 shadow-xl">
          <h2 className="text-2xl font-black font-cairo text-white mb-3">ابدأ دلوقتي — مجاناً 14 يوم</h2>
          <p className="text-sm text-white/80 font-cairo mb-6 max-w-md mx-auto">
            كل المميزات دي في نظام واحد. جرب بنفسك — مفيش بطاقة ائتمان. لو عجبك، كمل بـ 2,500 ج/شهر.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="px-8 py-3 rounded-xl bg-white text-indigo-700 font-black font-cairo text-sm shadow-lg hover:shadow-xl transition hover:-translate-y-0.5"
            >
              🚀 ابدأ تجربة مجانية
            </Link>
            <a
              href="https://wa.me/201055356622?text=أهلاً، شفت مميزات نِظام وعايز أسأل"
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
