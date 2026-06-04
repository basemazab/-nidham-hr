import Link from "next/link";

export default function Post() {
  return (
    <>
      <div className="key-takeaway">
        <div className="key-takeaway-label">الخلاصة في 30 ثانية</div>
        <p>
          <strong>نظام HR السحابي</strong> بيوفّر 60% من وقت الـ HR الإداري،
          بيشتغل من أي مكان (موبايل/ lap /تابلت)، وبيتحدّث تلقائياً مع تغييرات
          القوانين المصرية. 7 مميزات تخلي أي شركة مصرية تستغني عن Excel وتتحول
          للسحابة.
        </p>
      </div>

      <h2>إيه هو نظام HR السحابي (Cloud HR)؟</h2>
      <p>
        نظام HR السحابي هو برنامج إدارة موارد بشرية شغال على الإنترنت — مش
        مثبت على سيرفر في شركتك. انت بتفتح المتصفح (أو الموبايل) وبتدخل
        بيانات موظفيك. كل حاجة متخزنة في سحابة آمنة (AES-256) ومتاحة 24 ساعة.
      </p>
      <p>
        الفرق بين Cloud HR والـ On-Premise زي الفرق بين Gmail و Outlook قبل 10
        سنين. الأول شغال من أي مكان وبيتحدّث تلقائياً، والتاني محتاج سيرفر
        وصيانة وفريق IT.
      </p>

      <h2>المميزات السبع اللي بتخلّي Cloud HR أحسن</h2>

      <h3>1. وفر 60% من وقت الـ HR الإداري</h3>
      <p>
        المهام المتكررة في HR بتاخد 40-60% من وقت فريق HR — حساب المرتبات،
        التأمينات، الإجازات، الغياب. نظام سحابي بيعمل كل ده تلقائياً. دراسة
        من <strong>SHRM</strong> بتقول إن الـ Cloud HR بيقلّل وقت المهام
        الإدارية بنسبة 60%.
      </p>
      <p>
        <strong>توفير فعلي:</strong> لو HR بيكسب 8,000 ج/شهر وبيدّي 50% من
        وقته لمهام إدارية، الـ Cloud بيوفّرلك 2,400 ج/شهر من وقت الـ HR ده.
      </p>

      <h3>2. شغال من أي مكان — موبايل، لابتوب، تابلت</h3>
      <p>
        مدير الشركة يشوف تقارير من البيت. الـ HR يدخل بيانات من الموبايل وهو
        في الطريق. الموظف يسجّل حضور من السيلفي بتاعه في الموقع. كل حاجة
        متاحة 24/7 من أي جهاز متصل بالإنترنت.
      </p>

      <h3>3. تحديثات تلقائية للقوانين المصرية</h3>
      <p>
        القانون المصري بيتغير — شرائح الضريبة بتتحدّث، نسب التأمينات بتتغير،
        الحد الأدنى للأجور بيتعدل. في Excel، لازم تعمل التحديثات دي بنفسك
        (وتغلط غالباً). في Cloud HR، النظام بيتحدّث تلقائياً — انت فاتح
        النظام ولقيت كل حاية شغالة صح.
      </p>

      <h3>4. أمان和数据 تشفير AES-256</h3>
      <p>
        بيانات الموظفين من أكثر البيانات حساسية في شركتك — الرقم القومي،
        الرقم التأميني، المرتبات. Cloud HR بيخزّن البيانات في سحابة مشفّرة
        بـ AES-256 (نفس مستوى البنوك)، مع Audit Log كامل (مين دخل، إيه
        اللي شافه، إيه اللي عدّل).
      </p>

      <h3>5. استيراد بيانات من Excel بسهولة</h3>
      <p>
        معظم الشركات المصرية شغالة بـ Excel من سنين. التحول لـ Cloud HR مش
        معناه إنك تكتب بيانات 50 موظف من الأول. تقدر تستورد ملف Excel في
        دقايق — النظام بيقرأ الأعمدة ويحطها في المكان الصح.
      </p>

      <h3>6. تكامل مع CRM والتسويق في نظام واحد</h3>
      <p>
        ميزة مش موجودة في أي نظام HR تاني. بدل ما تشترك في 3 أنظمة منفصلة
        (HR + CRM + تسويق)، Cloud HR المتكامل بيدّيك كل حاجة في نظام واحد.
        بيانات موظفيك مرتبطة بالعملاء، وأداء المبيعات مرتبط بالـ HR analytics.
      </p>

      <h3>7. AI مدمج — مش إضافة منفصلة</h3>
      <p>
        Cloud HR الحديث بيضمن AI: Agent يرد على استفسارات الموظفين، فحص
        السير الذاتية بالذكاء الاصطناعي، توليد محتوى تسويقي. نِظام مثلاً
        عنده AI Agent مدمج — الموظف يكتب "عايز كشف مرتبي" والـ AI يبعتهوله
        على واتساب فوراً.
      </p>

      <h2>مقارنة: Cloud HR vs Excel vs On-Premise</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800">
              <th className="p-2 text-right font-bold">المعيار</th>
              <th className="p-2 text-center font-bold text-emerald-700 dark:text-emerald-400">✦ Cloud HR</th>
              <th className="p-2 text-center font-bold">Excel</th>
              <th className="p-2 text-center font-bold">On-Premise</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-200 dark:border-slate-700">
              <td className="p-2">التكلفة الشهرية (50 موظف)</td>
              <td className="p-2 text-center text-emerald-700 dark:text-emerald-400 font-bold">2,500 ج</td>
              <td className="p-2 text-center text-slate-500">0 ج (بأخطاء بشرية)</td>
              <td className="p-2 text-center text-slate-500">5,000+ ج (سيرفر + IT)</td>
            </tr>
            <tr className="border-t border-slate-200 dark:border-slate-700">
              <td className="p-2">وقت إعداد المرتبات</td>
              <td className="p-2 text-center text-emerald-700 dark:text-emerald-400 font-bold">10 دقايق</td>
              <td className="p-2 text-center text-slate-500">4+ ساعات</td>
              <td className="p-2 text-center text-slate-500">ساعة</td>
            </tr>
            <tr className="border-t border-slate-200 dark:border-slate-700">
              <td className="p-2">تحديثات القوانين</td>
              <td className="p-2 text-center text-emerald-700 dark:text-emerald-400 font-bold">تلقائي</td>
              <td className="p-2 text-center text-slate-500">يدوي (أخطاء)</td>
              <td className="p-2 text-center text-slate-500">يدوي</td>
            </tr>
            <tr className="border-t border-slate-200 dark:border-slate-700">
              <td className="p-2">أمان البيانات</td>
              <td className="p-2 text-center text-emerald-700 dark:text-emerald-400 font-bold">AES-256</td>
              <td className="p-2 text-center text-slate-500">ملف على الـ PC</td>
              <td className="p-2 text-center text-slate-500">سيرفر داخلي</td>
            </tr>
            <tr className="border-t border-slate-200 dark:border-slate-700">
              <td className="p-2">الشغل من أي مكان</td>
              <td className="p-2 text-center text-emerald-700 dark:text-emerald-400 font-bold">✅</td>
              <td className="p-2 text-center text-slate-500">❌</td>
              <td className="p-2 text-center text-slate-500">جزئي (VPN)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>ازاي تتحول من Excel لـ Cloud HR في 7 أيام</h2>
      <ol>
        <li><strong>اليوم 1:</strong> <Link href="/signup">سجّل في نِظام</Link> — الباقة المجانية (دقيقة واحدة)</li>
        <li><strong>اليوم 1-2:</strong> استورد بيانات موظفيك من Excel — النظام بيقراها تلقائياً</li>
        <li><strong>اليوم 2-3:</strong> ضبط إعدادات الشركة — الإجازات، الدوام، الحضور</li>
        <li><strong>اليوم 4:</strong> اطبع نماذج التأمينات من النظام بدل ما تكتبها في Excel</li>
        <li><strong>اليوم 5:</strong> ابدأ حضور وانصراف من الموبايل — الموظفين يستخدموا السيلفي</li>
        <li><strong>اليوم 7:</strong> أول مرتب يتحسب تلقائياً — التأمينات والضرايب مضبوطة</li>
      </ol>

      <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 border border-violet-200 dark:border-violet-800 rounded-2xl p-6 my-8">
        <h3 className="text-lg font-black font-cairo text-violet-800 dark:text-violet-200 mb-2">
          ☁️ حوّل شركتك للسحابة — جرب نِظام 14 يوم
        </h3>
        <p className="text-sm text-violet-700 dark:text-violet-300 font-cairo mb-4">
          من Excel لنظام سحابي متكامل في 7 أيام. مفيش بطاقة ائتمان — مفيش مخاطرة.
        </p>
        <Link
          href="/signup"
          className="inline-block px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black font-cairo text-sm shadow"
        >
          ابدأ التجربة المجانية ←
        </Link>
      </div>

      <h2>الخلاصة</h2>
      <p>
        Cloud HR مش موضة — هو مستقبل إدارة الموارد البشرية. الشركات اللي
        بتستخدم Cloud HR بتوفر 60% وقت، 40% أخطاء، وبتقدر تتوسع بشكل أسرع.
        نِظام هو Cloud HR المصري الوحيد المتكامل مع CRM والتسويق والـ AI.
      </p>
    </>
  );
}
