import Link from "next/link";

const plans = [
  { name: "مجاني", price: "0", period: "", features: ["5 أسئلة/شهر", "3 نماذج/شهر", "حاسبة واحدة"], cta: "ابدأ مجاناً" },
  { name: "Pro", price: "49", period: "جنيه/شهر", features: ["أسئلة غير محدودة", "كل النماذج", "كل الحاسبات", "أولوية الرد"], cta: "اشترك الآن", popular: true },
  { name: "أعمال", price: "299", period: "جنيه/شهر", features: ["كل مميزات Pro", "5 مستخدمين", "API access", "تقارير"], cta: "اشترك الآن" },
  { name: "مدى الحياة", price: "999", period: "دفعة واحدة", features: ["كل مميزات Pro مدى الحياة"], cta: "اشترك الآن" },
];

export default function PricingPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <header className="bg-primary py-4 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-accent font-bold text-2xl font-heading">مستشار HR</Link>
          <Link href="/" className="text-white hover:text-accent transition">العودة للرئيسية</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        <h1 className="section-title">خطط الاشتراك</h1>
        <p className="section-subtitle">اختار الخطة المناسبة ليك وابدأ الآن</p>

        <div className="grid md:grid-cols-4 gap-6 mt-8">
          {plans.map((p) => (
            <div key={p.name} className={`card text-center ${p.popular ? "ring-2 ring-accent relative" : ""}`}>
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-primary text-xs font-bold px-3 py-1 rounded-full">
                  الأكثر شعبية
                </div>
              )}
              <h3 className="text-xl font-bold text-primary mb-2">{p.name}</h3>
              <div className="text-3xl font-bold text-accent mb-1">
                {p.price} <span className="text-sm text-gray-500">{p.period}</span>
              </div>
              <ul className="text-right space-y-2 my-6 text-gray-700">
                {p.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-success">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className={`block w-full py-3 rounded-lg font-bold transition ${p.popular ? "btn-accent" : "btn-primary"}`}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="card mt-12 max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-bold text-primary mb-4">💳 طرق الدفع</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">📱</div>
              <p className="text-sm font-bold">فودافون كاش</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">💳</div>
              <p className="text-sm font-bold">إنستاباي</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">🏦</div>
              <p className="text-sm font-bold">تحويل بنكي</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">بعد التحويل، ابعت الإيصال وهنفعّل اشتراكك خلال 24 ساعة</p>
        </div>
      </main>
    </div>
  );
}
