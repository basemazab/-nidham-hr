import Link from "next/link";

// ============================================================================
// Post: "بديل Odoo HR للشركات المصرية 2026 — مقارنة"
// Target keyword: "بديل اودو" / "Odoo HR Egypt" / "Odoo payroll Egypt"
// ============================================================================

export default function Post() {
  return (
    <>
      <div className="key-takeaway">
        <div className="key-takeaway-label">الخلاصة في 30 ثانية</div>
        <p>
          <strong>Odoo</strong> نظام ERP مفتوح المصدر قوي جداً وشامل، لكن
          موديول الـ HR والمرتبات فيه عام وبيحتاج تخصيص (localization) وشريك
          تنفيذ عشان يتوافق مع قانون المرتبات والتأمينات المصري. للشركات
          اللي محتاجة HR ومرتبات مصرية شغّالة من اليوم الأول من غير تعقيد،{" "}
          <Link href="/">نِظام HR</Link> بديل أبسط وأرخص ومتوافق أصلاً.
        </p>
      </div>

      <h2>Odoo نظام عظيم — بس HR فيه محتاج شغل</h2>
      <p>
        Odoo اختيار ممتاز لو شركتك محتاجة ERP كامل (مخازن، حسابات، مبيعات،
        تصنيع) وعندك ميزانية ووقت للتنفيذ. لكن لو كل اللي محتاجه هو إدارة
        موارد بشرية ومرتبات مصرية، Odoo بيجيب تحديات:
      </p>
      <ol>
        <li>
          <strong>المرتبات المصرية مش جاهزة out-of-the-box</strong> — قواعد
          التأمينات 148/2019 وشرايح الضريبة المصرية محتاجة إعداد (Salary
          Rules) أو موديول localization مدفوع/مخصص.
        </li>
        <li>
          <strong>محتاج شريك تنفيذ</strong> — معظم شركات Odoo في مصر بتطلب
          رسوم تنفيذ واستضافة وصيانة سنوية، غير اشتراك المستخدمين.
        </li>
        <li>
          <strong>منحنى تعلّم أعلى</strong> — Odoo قوي لكن معقّد؛ مدير HR
          العادي محتاج تدريب، عكس أداة HR مخصصة وبسيطة.
        </li>
        <li>
          <strong>مزايا مصرية مفقودة</strong> — حضور GPS+سيلفي بدون أجهزة،
          بوت واتساب، ونماذج التأمينات المصرية الجاهزة مش موجودة افتراضياً.
        </li>
      </ol>

      <h2>المقارنة: Odoo HR vs نِظام HR</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>المعيار</th>
              <th>Odoo HR</th>
              <th>نِظام HR (مصري)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>التكلفة الحقيقية</strong></td>
              <td>اشتراك + تنفيذ + صيانة</td>
              <td>اشتراك واحد — يبدأ مجاناً</td>
            </tr>
            <tr>
              <td><strong>المرتبات المصرية</strong></td>
              <td>إعداد/تخصيص مطلوب</td>
              <td>جاهزة تلقائياً</td>
            </tr>
            <tr>
              <td><strong>التأمينات 148/2019 + ضريبة 2026</strong></td>
              <td>Salary Rules يدوية</td>
              <td>مدمجة + تحديث سنوي</td>
            </tr>
            <tr>
              <td><strong>وقت التشغيل</strong></td>
              <td>أسابيع (تنفيذ)</td>
              <td>نفس اليوم</td>
            </tr>
            <tr>
              <td><strong>حضور GPS + سيلفي بدون جهاز</strong></td>
              <td>إضافة/تخصيص</td>
              <td>مدمج</td>
            </tr>
            <tr>
              <td><strong>بوت واتساب + نماذج تأمينات مصرية</strong></td>
              <td>❌ افتراضياً</td>
              <td>✅</td>
            </tr>
            <tr>
              <td><strong>سهولة الاستخدام للـ HR</strong></td>
              <td>منحنى تعلّم أعلى</td>
              <td>بسيط ومخصص</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>إمتى Odoo يكون الأنسب؟</h2>
      <p>
        لو شركتك محتاجة ERP متكامل يربط المخازن والحسابات والتصنيع والـ HR
        في منظومة واحدة، وعندك ميزانية ووقت تنفيذ — Odoo اختيار قوي. لكن لو
        احتياجك هو HR ومرتبات مصرية تشتغل بسرعة وببساطة وتكلفة أقل، أداة
        متخصصة زي نِظام بتوصلك أسرع وأرخص.
      </p>

      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 my-8">
        <h3 className="text-lg font-black font-cairo text-emerald-800 dark:text-emerald-200 mb-2">
          محتاج HR ومرتبات مصرية تشتغل النهاردة؟
        </h3>
        <p className="text-sm text-emerald-700 dark:text-emerald-300 font-cairo mb-4">
          نِظام جاهز من غير تنفيذ ولا تخصيص. ابدأ بالباقة المجانية وشغّل
          أول مرتب بتأمينات وضرائب محسوبة تلقائياً.
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
        Odoo حل ERP شامل وممتاز لمن يحتاجه، لكنه ثقيل ومكلّف لو كل احتياجك HR
        ومرتبات. الشركة المصرية اللي عايزة بساطة وسرعة وتوافق قانوني جاهز
        بتكسب من أداة متخصصة. جرّب <Link href="/">نِظام</Link> مجاناً وقارن.
      </p>
    </>
  );
}
