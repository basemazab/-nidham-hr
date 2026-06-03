import Link from "next/link";

export default function Post() {
  return (
    <>
      <div className="key-takeaway">
        <div className="key-takeaway-label">الخلاصة في 30 ثانية</div>
        <p>
          <strong>المصانع وشركات المقاولات</strong> في مصر بتواجه تحديات HR
          مختلفة: عمالة موزّعة على مواقع وورديات، حضور صعب المتابعة، وتأمينات
          اجتماعية على أعداد كبيرة. <strong>نِظام</strong> بياخد الحضور بالـGPS
          والسيلفي من موبايل العامل — من غير أجهزة بصمة غالية في كل موقع —
          ويحسب التأمينات والمرتبات تلقائياً حسب قانون 2026. ابدأ مجاناً.
        </p>
      </div>

      <h2>ليه إدارة HR في المصانع والمقاولات أصعب؟</h2>
      <p>
        لو عندك مصنع أو شركة مقاولات في مصر، أنت عارف إن إدارة العمالة حاجة
        تانية خالص عن المكتب العادي:
      </p>
      <ul>
        <li><strong>عمالة موزّعة</strong> — مواقع إنشاءات متعددة أو خطوط إنتاج، صعب تتابع مين حضر فين</li>
        <li><strong>ورديات ودوام ليلي</strong> — شيفتات بتعدّي نص الليل، وحساب التأخير والإضافي معقّد</li>
        <li><strong>أعداد كبيرة</strong> — التأمينات على 50–200 عامل، أي خطأ = غرامات ضخمة</li>
        <li><strong>عمالة يومية ومؤقتة</strong> — دخول وخروج مستمر، وحساب مكافأة نهاية الخدمة</li>
        <li><strong>أجهزة البصمة غالية</strong> — جهاز لكل موقع = آلاف الجنيهات + صيانة + أعطال</li>
      </ul>

      <h2>تكلفة الطريقة اليدوية في المصانع</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800">
              <th className="p-2 text-right font-bold">المشكلة</th>
              <th className="p-2 text-right font-bold">التكلفة المحتملة سنوياً</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-200 dark:border-slate-700">
              <td className="p-2">أجهزة بصمة لـ 4 مواقع + صيانة</td>
              <td className="p-2 text-rose-700 dark:text-rose-400 font-bold">20,000+ ج</td>
            </tr>
            <tr className="border-t border-slate-200 dark:border-slate-700">
              <td className="p-2">أخطاء حساب تأمينات على عمالة كبيرة</td>
              <td className="p-2 text-rose-700 dark:text-rose-400 font-bold">غرامات 50,000+ ج</td>
            </tr>
            <tr className="border-t border-slate-200 dark:border-slate-700">
              <td className="p-2">قضايا عمالية (فصل/مستحقات غير موثّقة)</td>
              <td className="p-2 text-rose-700 dark:text-rose-400 font-bold">100,000+ ج للقضية</td>
            </tr>
            <tr className="border-t border-slate-200 dark:border-slate-700">
              <td className="p-2">وقت موظف HR في حسابات يدوية</td>
              <td className="p-2 text-rose-700 dark:text-rose-400 font-bold">60,000+ ج</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>إزاي نِظام بيحل مشاكل المصانع والمقاولات؟</h2>

      <h3>1. حضور بالـGPS والسيلفي — بدون أجهزة بصمة</h3>
      <p>
        العامل بيفتح لينك من أي موبايل → يسجّل حضور بموقعه (GPS) + صورة سيلفي
        للتأكيد. أنت بتحدّد نطاق كل موقع (geofence)، والنظام بيرفض أي بصمة من
        برّه النطاق تلقائياً. <strong>وفّرت تكلفة أجهزة البصمة في كل المواقع.</strong>
      </p>

      <h3>2. ورديات ودوام ليلي محسوبين صح</h3>
      <p>
        النظام بيتعامل مع الشيفتات اللي بتعدّي نص الليل، ويحسب التأخير والخروج
        المبكر والإضافي (overtime) حسب قانون العمل المصري — 35% نهاري، ساعات
        إضافية ليلية، وأيام الراحة والأعياد بنسبها الصحيحة.
      </p>

      <h3>3. تأمينات ومرتبات تلقائية لأي عدد عمالة</h3>
      <p>
        يحسب التأمينات الاجتماعية حسب قانون 148/2019 (على الأجر التأميني الصحيح)
        وضريبة الدخل حسب شرائح 2026، لكل العمالة دفعة واحدة. استورد العمالة من
        Excel، واطلع كشف المرتبات في دقائق بدل أيام.
      </p>

      <h3>4. مكافأة نهاية الخدمة موثّقة قانونياً</h3>
      <p>
        مع دخول وخروج العمالة المستمر، النظام بيحسب مكافأة نهاية الخدمة حسب
        المادة 122 من قانون 12/2003 (نص شهر لكل سنة في أول 5 سنوات، شهر كامل
        بعدها) ويوثّقها — حماية ليك في أي نزاع.
      </p>

      <h3>5. نماذج رسمية + سجل امتثال</h3>
      <p>
        نموذج 1 و 2 و 6 تأمينات، عقود عمل، شهادات خبرة — كلها جاهزة ومطابقة
        للقانون. سجّل عمالتك في التأمينات خلال المدة القانونية وتجنّب غرامة
        التأخير.
      </p>

      <h2>مقارنة سريعة: نِظام vs الطرق التقليدية للمصانع</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800">
              <th className="p-2 text-right font-bold">المعيار</th>
              <th className="p-2 text-right font-bold">نِظام</th>
              <th className="p-2 text-right font-bold">بصمة + Excel</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-200 dark:border-slate-700">
              <td className="p-2">تكلفة الأجهزة لمواقع متعددة</td>
              <td className="p-2 text-emerald-700 dark:text-emerald-400 font-bold">صفر</td>
              <td className="p-2">20,000+ ج</td>
            </tr>
            <tr className="border-t border-slate-200 dark:border-slate-700">
              <td className="p-2">حساب تأمينات وضرائب</td>
              <td className="p-2 text-emerald-700 dark:text-emerald-400 font-bold">تلقائي 2026</td>
              <td className="p-2">يدوي + أخطاء</td>
            </tr>
            <tr className="border-t border-slate-200 dark:border-slate-700">
              <td className="p-2">حضور مواقع متعددة</td>
              <td className="p-2 text-emerald-700 dark:text-emerald-400 font-bold">GPS لحظي</td>
              <td className="p-2">جهاز لكل موقع</td>
            </tr>
            <tr className="border-t border-slate-200 dark:border-slate-700">
              <td className="p-2">توثيق قانوني للنزاعات</td>
              <td className="p-2 text-emerald-700 dark:text-emerald-400 font-bold">سجل كامل</td>
              <td className="p-2">ورق متفرّق</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>خطة التحوّل لمصنعك أو شركتك</h2>
      <ol>
        <li><strong>اليوم 1:</strong> سجّل في <Link href="/signup">نِظام</Link> مجاناً (دقيقة واحدة)</li>
        <li><strong>اليوم 1:</strong> استورد عمالتك من Excel دفعة واحدة</li>
        <li><strong>اليوم 2:</strong> حدّد مواقعك ونطاقات الـGPS لكل موقع</li>
        <li><strong>اليوم 3:</strong> ابعت لينك الحضور للعمالة — يبدأوا يسجّلوا من موبايلهم</li>
        <li><strong>آخر الشهر:</strong> أول كشف مرتبات بتأمينات وضرائب محسوبة تلقائياً</li>
      </ol>

      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 my-8">
        <h3 className="text-lg font-black font-cairo text-emerald-800 dark:text-emerald-200 mb-2">
          🏭 جرّب نِظام في مصنعك مجاناً
        </h3>
        <p className="text-sm text-emerald-700 dark:text-emerald-300 font-cairo mb-4">
          حضور GPS بدون أجهزة بصمة، تأمينات ومرتبات تلقائية، وتوثيق قانوني يحميك.
          ابدأ بالباقة المجانية — من غير بطاقة ائتمان.
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
        المصانع وشركات المقاولات أكتر القطاعات اللي بتستفيد من نظام HR رقمي —
        لأن التحدي أكبر والمخاطر القانونية أعلى. نِظام بيشيل عنك تكلفة أجهزة
        البصمة، ويحسب التأمينات والمرتبات صح، ويوثّق كل حاجة قانونياً. جرّبه
        مجاناً على جزء من عمالتك وشوف الفرق بنفسك.
      </p>
    </>
  );
}
