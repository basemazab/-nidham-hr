import Link from "next/link";

export default function Post() {
  return (
    <>
      <div className="key-takeaway">
        <div className="key-takeaway-label">الخلاصة في 30 ثانية</div>
        <p>
          <strong>نظام HR للشركات الناشئة</strong> مش رفاهية — هو ضرورة من أول
          موظف. نِظام يوفّر باقة مجانية (5 موظفين) بحسابات تأمينات وضرايب
          تلقائية، ونماذج رسمية جاهزة. وفر 80% من وقت الـ HR الإداري وركز على
          نموّ شركتك.
        </p>
      </div>

      <h2>متى تحتاج نظام HR في شركتك الناشئة؟</h2>
      <p>
        كتير من مؤسسي الشركات الناشئة في مصر بيعتقدوا إن "نظام HR" ده حاجة
        للشركات الكبيرة. الحقيقة إن من أول ما توظّف شخص واحد، أنت محتاج:
      </p>
      <ul>
        <li><strong>عقد عمل قانوني</strong> — يحمي حقوقك وحقوق الموظف</li>
        <li><strong>تسجيل تأمينات</strong> — نموذج 1 خلال 7 أيام من التعيين (الغرامة 100 ج/يوم تأخير)</li>
        <li><strong>حضور وانصراف</strong> — عشان تحسب المرتب بدقة</li>
        <li><strong>إجازات</strong> — توثيق الرصيد والطلبات</li>
      </ul>
      <p>
        من غير نظام، هتضطر تعمل كل ده في Excel — وExcel بيكلفك وقت + أخطاء +
        مخاطر قانونية.
      </p>

      <h2>تكلفة عدم وجود نظام HR</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800">
              <th className="p-2 text-right font-bold">المخاطرة</th>
              <th className="p-2 text-right font-bold">التكلفة المحتملة</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-200 dark:border-slate-700">
              <td className="p-2">نموذج 1 متأخر</td>
              <td className="p-2 text-rose-700 dark:text-rose-400 font-bold">100 ج/يوم غرامة</td>
            </tr>
            <tr className="border-t border-slate-200 dark:border-slate-700">
              <td className="p-2">عقد عمل غير قانوني</td>
              <td className="p-2 text-rose-700 dark:text-rose-400 font-bold">50,000+ ج في قضية عمالية</td>
            </tr>
            <tr className="border-t border-slate-200 dark:border-slate-700">
              <td className="p-2">أخطاء في حساب التأمينات</td>
              <td className="p-2 text-rose-700 dark:text-rose-400 font-bold">10,000+ ج غرامات</td>
            </tr>
            <tr className="border-t border-slate-200 dark:border-slate-700">
              <td className="p-2">وقت HR مهدر في Excel</td>
              <td className="p-2 text-rose-700 dark:text-rose-400 font-bold">40 ساعة/شهر = 5,000+ ج/شهر</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>إزاي نِظام بيساعد شركتك الناشئة؟</h2>

      <h3>1. باقة مجانية للأبد</h3>
      <p>
        نِظام عنده باقة <strong>Free</strong> مجانية للأبد لحد 5 موظفين. مفيش
        بطاقة ائتمان، مفيش فترة محدودة. تشمل إدارة الموظفين، حضور وانصراف،
        وطلبات إجازات. الميزانية محدودة والـ HR مش أولوية؟ جرب ببلاش.
      </p>

      <h3>2. حساب التأمينات والضرايب تلقائياً</h3>
      <p>
        الـ Starter بـ 750 ج/شهر (حتى 25 موظف) بيحسب التأمينات الاجتماعية
        حسب قانون 148/2019 وضريبة الدخل حسب الشرايح المصرية. مش محتاج محاسب
        متخصص — النظام بيعمل كل حاجة.
      </p>

      <h3>3. 9 نماذج رسمية جاهزة</h3>
      <p>
        نماذج 1، 2، 6 تأمينات، شهادات خبرة وعمل وراتب، عقود توظيف — كلها
        جاهزة ومطابقة للقانون المصري. اطبعها في 30 ثانية بدل ما تكتبها من
        الصفر.
      </p>

      <h3>4. تطبيق موبايل للموظفين</h3>
      <p>
        بدون تنزيل تطبيق (PWA). الموظف بيفتح لينك من موبايله → يسجّل حضور
        بـ GPS + سيلفي → يطلّع رصيد إجازاته → يطلب إجازة. كل ده من الموبايل.
      </p>

      <h3>5. بوت واتساب</h3>
      <p>
        الموظفين يتفاعلوا عبر واتساب — "كم رصيد إجازاتي؟"، "عايز أطلب إجازة
        بكره"، "كشف مرتب". 95% من المصريين بيستخدموا واتساب يومياً — خلّي
        الـ HR في نفس القناة.
      </p>

      <h2>خطة الانتقال لنظام HR في شركتك الناشئة</h2>
      <ol>
        <li><strong>اليوم 1:</strong> سجّل في <Link href="/signup">نِظام</Link> — الباقة المجانية (دقيقة واحدة)</li>
        <li><strong>اليوم 1:</strong> ضيف موظفيك (يدوي أو استيراد Excel)</li>
        <li><strong>اليوم 2:</strong> اطبع العقود من نماذج النظام وخليهم يوقعوا</li>
        <li><strong>اليوم 3:</strong> ابدأ تسجيل حضور وانصراف عبر الموبايل</li>
        <li><strong>الأسبوع 1:</strong> اول مرتب يتحسب تلقائياً</li>
      </ol>

      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 my-8">
        <h3 className="text-lg font-black font-cairo text-emerald-800 dark:text-emerald-200 mb-2">
          🚀 جرب نِظام مجاناً — حتى 5 موظفين
        </h3>
        <p className="text-sm text-emerald-700 dark:text-emerald-300 font-cairo mb-4">
          شركتك الناشئة تستحق نظام HR محترف من أول يوم. مفيش بطاقة ائتمان — مفيش مخاطرة.
        </p>
        <Link
          href="/signup"
          className="inline-block px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black font-cairo text-sm shadow"
        >
          ابدأ مجاناً ←
        </Link>
      </div>

      <h2>الخلاصة</h2>
      <p>
        نظام HR مش تكلفة — هو استثمار. البداية الصح من أول يوم توفّر فلوس +
        وقت + مخاطر قانونية. نِظام مصمم خصيصاً للشركات المصرية الناشئة:
        مجاني للـ 5 موظفين الأوائل، وسهل للغاية في الاستخدام.
      </p>
    </>
  );
}
