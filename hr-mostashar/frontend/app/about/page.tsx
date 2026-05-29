import Link from "next/link";

export default function AboutPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <header className="bg-primary py-4 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-accent font-bold text-2xl font-heading">مستشار HR</Link>
          <Link href="/" className="text-white hover:text-accent transition">العودة للرئيسية</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="section-title">عن مستشار HR</h1>

        <div className="card mt-8">
          <h2 className="text-xl font-bold text-primary mb-4">المهمة</h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            مستشار HR هو منصة ذكية تهدف لتبسيط قانون العمل المصري والتأمينات الاجتماعية. نساعد مسؤولي الموارد
            القانونية في معرفة حقوقهم وواجباتهم بسرعة ودقة.
          </p>

          <h2 className="text-xl font-bold text-primary mb-4">المميزات</h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1">✦</span>
              <span>محادثة ذكية بالذكاء الاصطناعي تجاوب على أسئلتك القانونية بالعامية المصرية</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1">✦</span>
              <span>4 حاسبات تفاعلية: نهاية الخدمة، التأمينات، الإجازات، الراتب الصافي</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1">✦</span>
              <span>20 نموذج جاهز: عقود، إنذارات، شهادات، نماذج HR متخصصة</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1">✦</span>
              <span>بوت تليجرام للتفاعل السريع</span>
            </li>
          </ul>

          <h2 className="text-xl font-bold text-primary mb-4 mt-8">التقنية المستخدمة</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-primary">الواجهة الأمامية</h3>
              <p className="text-sm text-gray-600">Next.js 14 + TypeScript + Tailwind CSS</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-primary">الخلفية</h3>
              <p className="text-sm text-gray-600">FastAPI + Python 3.11 + SQLAlchemy</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-primary">الذكاء الاصطناعي</h3>
              <p className="text-sm text-gray-600">Google Gemini 1.5 Flash</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-primary">قاعدة البيانات</h3>
              <p className="text-sm text-gray-600">SQLite / PostgreSQL</p>
            </div>
          </div>

          <h2 className="text-xl font-bold text-primary mb-4 mt-8">فريق التطوير</h2>
          <p className="text-gray-700 leading-relaxed">
            تم تطوير المشروع بواسطة <strong>HR BASEM AZAB</strong> — متخصص في إدارة الموارد البشرية
            وتطوير حلول تقنية لدعم قطاع الأعمال في مصر والخليج العربي.
          </p>
        </div>

        <div className="text-center mt-8">
          <Link href="/register" className="btn-accent text-lg px-8 py-4">
            جرّب مجاناً الآن
          </Link>
        </div>
      </main>
    </div>
  );
}
