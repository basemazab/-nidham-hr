import Link from "next/link";

export default function Home() {
  return (
    <main>
      <Header />
      <HeroSection />
      <ProblemSolution />
      <Features />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTAFooter />
      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="bg-primary py-4 px-6">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="text-accent font-bold text-2xl font-heading">مستشار HR</div>
        <nav className="hidden md:flex gap-6 text-white">
          <Link href="#features" className="hover:text-accent transition">المميزات</Link>
          <Link href="#pricing" className="hover:text-accent transition">الاسعار</Link>
          <Link href="#faq" className="hover:text-accent transition">الاسئلة</Link>
        </nav>
        <div className="flex gap-3">
          <Link href="/chat" className="text-white border border-accent px-4 py-2 rounded-lg hover:bg-accent hover:text-primary transition">
            تسجيل الدخول
          </Link>
          <Link href="/register" className="bg-accent text-primary px-4 py-2 rounded-lg font-bold hover:bg-accent-light transition">
            ابدأ مجاناً
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="bg-gradient-to-b from-primary to-primary-dark text-white py-24 px-6 text-center">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold font-heading mb-6">
          تعبت من البحث في <span className="text-accent">قوانين العمل</span>؟
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
          مستشارك الذكي لقانون العمل المصري والتأمينات الاجتماعية. اسأل، احسب، حمّل نماذج جاهزة.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/chat" className="bg-accent text-primary px-8 py-4 rounded-xl text-xl font-bold hover:bg-accent-light transition">
            ابدأ مجاناً
          </Link>
          <Link href="#features" className="border-2 border-accent text-accent px-8 py-4 rounded-xl text-xl font-bold hover:bg-accent hover:text-primary transition">
            اكتشف المميزات
          </Link>
        </div>
      </div>
    </section>
  );
}

function ProblemSolution() {
  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="section-title">ليه مستشار HR؟</h2>
        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div className="card border-r-4 border-error">
            <h3 className="text-xl font-bold text-error mb-3">❌ المشكلة</h3>
            <ul className="text-right text-gray-700 space-y-2">
              <li>قوانين معقدة وصعبة الفهم</li>
              <li>محتاج محامي لكل سؤال</li>
              <li>حسابات يدوية ومعرضة للخطأ</li>
              <li>نماذج HR مش متوفرة بسهولة</li>
            </ul>
          </div>
          <div className="card border-r-4 border-success">
            <h3 className="text-xl font-bold text-success mb-3">✅ الحل</h3>
            <ul className="text-right text-gray-700 space-y-2">
              <li>ردود فورية بالعامية المصرية</li>
              <li>حسابات دقيقة بنقرة واحدة</li>
              <li>20 نموذج جاهز للتحميل</li>
              <li>تحديثات قانونية مستمرة</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { icon: "💬", title: "محادثة ذكية", desc: "اسأل أي سؤال قانوني واحصل على إجابة دقيقة فوراً" },
    { icon: "🧮", title: "4 حاسبات تفاعلية", desc: "نهاية الخدمة، التأمينات، الإجازات، الراتب الصافي" },
    { icon: "📄", title: "20 نموذج جاهز", desc: "عقود، إنذارات، شهادات، نماذج HR متخصصة" },
    { icon: "🔄", title: "تحديثات قانونية", desc: "كل التعديلات القانونية الجديدة في مكان واحد" },
    { icon: "⚡", title: "سرعة فائقة", desc: "ردود في أقل من 5 ثواني" },
    { icon: "🇪🇬", title: "عربي بالكامل", desc: "واجهة RTL + عامية مصرية + خط Cairo" },
  ];

  return (
    <section id="features" className="py-20 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="section-title">المميزات</h2>
        <p className="section-subtitle">كل اللي محتاجه عشان تدير HR في مكان واحد</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="card text-center">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-xl font-bold text-primary mb-2">{f.title}</h3>
              <p className="text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const testimonials = [
    { name: "أحمد محمد", role: "مدير HR", text: "وفّر عليّ وقت كبير في البحث عن القوانين والرد على استفسارات الموظفين." },
    { name: "سارة علي", role: "محامية", text: "أداة ممتازة للرد السريع على الأسئلة الشائعة في قانون العمل." },
    { name: "محمود حسن", role: "صاحب شركة", text: "الحاسبات دقيقة جداً والجاهزة للنماذج وفّرت عليّ مصاريف المحامي." },
  ];

  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="section-title">آراء المستخدمين</h2>
        <p className="section-subtitle">شوف اللي بيقولوه عن مستشار HR</p>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="card">
              <p className="text-gray-700 mb-4 italic">&ldquo;{t.text}&rdquo;</p>
              <div className="border-t pt-4">
                <strong className="text-primary">{t.name}</strong>
                <p className="text-sm text-gray-500">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    { name: "مجاني", price: "0", period: "", features: ["5 أسئلة/شهر", "3 نماذج/شهر", "حاسبة واحدة"], cta: "ابدأ مجاناً", popular: false },
    { name: "Pro", price: "49", period: "جنيه/شهر", features: ["أسئلة غير محدودة", "كل النماذج", "كل الحاسبات", "أولوية الرد"], cta: "اشترك الآن", popular: true },
    { name: "أعمال", price: "299", period: "جنيه/شهر", features: ["كل مميزات Pro", "5 مستخدمين", "API access", "تقارير"], cta: "اشترك الآن", popular: false },
    { name: "مدى الحياة", price: "999", period: "دفعة واحدة", features: ["كل مميزات Pro مدى الحياة"], cta: "اشترك الآن", popular: false },
  ];

  return (
    <section id="pricing" className="py-20 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="section-title">خطط الاشتراك</h2>
        <p className="section-subtitle">اختار الخطة المناسبة ليك</p>
        <div className="grid md:grid-cols-4 gap-6">
          {plans.map((p, i) => (
            <div key={i} className={`card text-center ${p.popular ? "ring-2 ring-accent relative" : ""}`}>
              {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-primary text-xs font-bold px-3 py-1 rounded-full">الأكثر شعبية</div>}
              <h3 className="text-xl font-bold text-primary mb-2">{p.name}</h3>
              <div className="text-3xl font-bold text-accent mb-1">{p.price} <span className="text-sm text-gray-500">{p.period}</span></div>
              <ul className="text-right space-y-2 my-6 text-gray-700">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2">
                    <span className="text-success">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/chat" className={`block w-full py-3 rounded-lg font-bold transition ${p.popular ? "btn-accent" : "btn-primary"}`}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    { q: "هل التطبيق مجاني؟", a: "أيوه، فيه خطة مجانية فيها 5 أسئلة و3 نماذج كل شهر." },
    { q: "هل الردود قانونية دقيقة؟", a: "الردود مبنية على نصوص قانون العمل والتأمينات، لكن هي استشارة عامة مش بديلة عن محامي." },
    { q: "إزاي أدفع الاشتراك؟", a: "تقدر تحول على فودافون كاش أو إنستاباي ونبفعّل اشتراكك خلال 24 ساعة." },
    { q: "هل فيه تطبيق موبايل؟", a: "حالياً فيه موقع وتليجرام بوت. تطبيق الموبايل قريب." },
    { q: "هل البيانات آمنة؟", a: "أيوه، بنستخدم تشفير لكلمات المرور وجلسات آمنة." },
    { q: "هل فيه دعم للشركات؟", a: "أيوه، خطة الأعمال فيها 5 مستخدمين وAPI access وتقارير." },
    { q: "هل الحاسبات دقيقة؟", a: "أيوه، الحاسبات مبنية على القانون المصري وبتحدث مع أي تغييرات." },
    { q: "إزاي أتواصل معاكم؟", a: "من خلال بوت التليجرام أو صفحة تواصل معنا." },
  ];

  return (
    <section id="faq" className="py-20 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="section-title">الأسئلة الشائعة</h2>
        <div className="space-y-4 mt-8">
          {faqs.map((f, i) => (
            <details key={i} className="card cursor-pointer">
              <summary className="font-bold text-primary text-lg">{f.q}</summary>
              <p className="mt-3 text-gray-700">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTAFooter() {
  return (
    <section className="bg-primary text-white py-16 px-6 text-center">
      <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">جرّب مجاناً دلوقتي!</h2>
      <p className="text-xl text-gray-300 mb-8">بدون تسجيل بطاقة ائتمان - ابدأ فوراً</p>
      <Link href="/chat" className="bg-accent text-primary px-10 py-4 rounded-xl text-xl font-bold hover:bg-accent-light transition inline-block">
        ابدأ الآن
      </Link>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-primary-dark text-gray-400 py-8 px-6 text-center">
      <p>جميع الحقوق محفوظة © 2026 مستشار HR - HR BASEM AZAB</p>
      <p className="mt-2 text-sm">⚠️ تنويه: ده استشارة عامة. للحالات الخاصة، استشر محامي متخصص.</p>
    </footer>
  );
}
