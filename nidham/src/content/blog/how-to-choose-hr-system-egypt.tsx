import Link from "next/link";

export default function Post() {
  return (
    <>
      <div className="key-takeaway">
        <div className="key-takeaway-label">الخلاصة في 30 ثانية</div>
        <p>
          <strong>اختيار نظام HR لشركتك في مصر</strong> قرار مهم. 10 معايير
          أساسية: التوافق مع قانون العمل، حساب التأمينات والضرايب، السعر،
          الدعم الفني، والتكامل مع CRM والتسويق. مع مقارنة سريعة لـ Bayzat
          و ZenHR و نِظام.
        </p>
      </div>

      <h2>ليه اختيار نظام HR الصح مهم؟</h2>
      <p>
        النظام الغلط بيكلّفك فلوس + وقت + مخاطر قانونية. دراسة حديثة من Gartner
        بتقول إن 40% من الشركات بترجع تختار نظام HR تاني في أول سنتين بسبب
        إن الاختيار الأول كان غلط. عشان كده، احنا عملنا دليل المعايير ده
        عشان تختار صح من أول مرة.
      </p>

      <h2>المعايير العشرة لاختيار نظام HR في مصر</h2>

      <h3>1. التوافق مع قانون العمل المصري</h3>
      <p>
        أهم معيار. القانون المصري 12/2003 ليه خصوصية: 6 أنواع إجازات، 3 نسب
        أوفر تايم، مكافأة نهاية خدمة بمعادلة محددة. لو النظام مش متوافق مع
        ده، هتضطر تعمل حسابات يدوية بره النظام — وده بيضيع فايدة الأتمتة.
      </p>
      <p>
        <strong>اسأل:</strong> "بيحسب مكافأة نهاية الخدمة حسب القانون المصري؟"
        — لو الإجابة "أي نظام تاني"، فهو مش مناسب لمصر.
      </p>

      <h3>2. حساب التأمينات الاجتماعية</h3>
      <p>
        قانون التأمينات 148/2019 ليه شرائح وأساسيات محددة. حصة الموظف 11%
        من الأجر الأساسي (9% تأمينات + 1% مرضى + 1% بطالة) وحصة صاحب العمل
        18.75%. لو النظام مش بيحسب ده تلقائياً، هتضطر تعمله يدوي — وده أكبر
        مصدر أخطاء.
      </p>

      <h3>3. شرائح ضريبة الدخل المصرية</h3>
      <p>
        ضريبة كسب العمل في مصر ليها 7 شرائح (0% لـ 27.5%) وإعفاء شخصي 20,000
        ج/سنة. النظام لازم يطبّق الشرايح دي تلقائياً ويحسب صافي المرتب من
        الإجمالي.
      </p>

      <h3>4. السعر والتكلفة الحقيقية</h3>
      <p>
        أنظمة زي Bayzat و ZenHR أسعارها بالدولار وبتكلف 4-7 دولار/موظف/شهر.
        لشركة 50 موظف، ده 10,000+ ج/شهر. نِظام مصمم للسوق المصري بالجنيه:
        Pro بـ 1,500 ج/شهر للـ 100 موظف — أوفر 85%.
      </p>

      <h3>5. دعم فني بالعربي</h3>
      <p>
        لو حصل مشكلة في المرتبات يوم 29، محتاج دعم فوري بالعربي المصري.
        أنظمة أجنبية بتدعم إيميل أو دردشة إنجليزية. نِظام بيدعم عبر واتساب
        0105 535 6622 — المصري بيشتغل بالواتساب.
      </p>

      <h3>6. نماذج رسمية جاهزة</h3>
      <p>
        نموذج 1 تأمينات، نموذج 2، نموذج 6، شهادة خبرة، شهادة راتب، عقد
        عمل — كلها نماذج مصرية بتنسيق مكتب العمل والتأمينات. لو النظام مش
        عنده، هيبقي مش مفيد للـ HR المصري.
      </p>

      <h3>7. حضور وانصراف</h3>
      <p>
        بصمة GPS + سيلفي هي الأسهل للشركات المصرية. لو معاك أجهزة ZKTeco،
        النظام يستورد البيانات منها. الأهم: الحضور مربوط بالمرتبات — الساعات
        والغياب والأوفر تايم يتخصموا/يُضافوا تلقائياً.
      </p>

      <h3>8. CRM + تسويق مدمجين</h3>
      <p>
        في 2026، نظام HR منفصل عن CRM وعن التسويق = شغل مزدوج. نظام متكامل
        (HR + CRM + تسويق) يوفّر فلوس + وقت بيانات مكررة. نِظام Bridge
        Analytics يربط أداء الموظفين بالعملاء والمبيعات.
      </p>

      <h3>9. تطبيق موبايل وبوت واتساب</h3>
      <p>
        الموظفين المصريين مش بيفتحوا إيميل كل شوية — هم على واتساب. النظام
        لازم يشتغل على واتساب (استعلام عن رصيد، تقديم إجازة) وموبايل (حضور
        GPS، طلبات). لو النظام معمول للـ desktop بس، هيبقي غير عملي.
      </p>

      <h3>10. قابلية التوسع والـ API</h3>
      <p>
        شركتك هتكبر. النظام لازم يكبر معاك — من 5 موظفين لـ 500+ من غير ما
        تحتاج تغيير النظام. ورahي API عشان تربطه بأنظمة تانية (محاسبة،
        تسويق، إدارة مخازن).
      </p>

      <h2>مقارنة سريعة: نِظام vs Bayzat vs ZenHR</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800">
              <th className="p-2 text-right font-bold">المعيار</th>
              <th className="p-2 text-center font-bold text-emerald-700 dark:text-emerald-400">✦ نِظام</th>
              <th className="p-2 text-center font-bold">Bayzat</th>
              <th className="p-2 text-center font-bold">ZenHR</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-200 dark:border-slate-700">
              <td className="p-2">توافق مع قانون 12/2003</td>
              <td className="p-2 text-center text-emerald-700 dark:text-emerald-400 font-bold">✅ آلي</td>
              <td className="p-2 text-center text-slate-500">❌</td>
              <td className="p-2 text-center text-slate-500">❌</td>
            </tr>
            <tr className="border-t border-slate-200 dark:border-slate-700">
              <td className="p-2">حساب التأمينات 148/2019</td>
              <td className="p-2 text-center text-emerald-700 dark:text-emerald-400 font-bold">✅ آلي</td>
              <td className="p-2 text-center text-slate-500">❌</td>
              <td className="p-2 text-center text-slate-500">❌</td>
            </tr>
            <tr className="border-t border-slate-200 dark:border-slate-700">
              <td className="p-2">السعر/شهر (50 موظف)</td>
              <td className="p-2 text-center text-emerald-700 dark:text-emerald-400 font-bold">1,500 ج</td>
              <td className="p-2 text-center text-slate-500">4,500+ ج</td>
              <td className="p-2 text-center text-slate-500">10,000+ ج</td>
            </tr>
            <tr className="border-t border-slate-200 dark:border-slate-700">
              <td className="p-2">دعم بالعربي المصري</td>
              <td className="p-2 text-center text-emerald-700 dark:text-emerald-400 font-bold">✅ واتساب</td>
              <td className="p-2 text-center text-slate-500">❌ إيميل</td>
              <td className="p-2 text-center text-slate-500">❌ إيميل</td>
            </tr>
            <tr className="border-t border-slate-200 dark:border-slate-700">
              <td className="p-2">CRM + AI + تسويق مدمج</td>
              <td className="p-2 text-center text-emerald-700 dark:text-emerald-400 font-bold">✅</td>
              <td className="p-2 text-center text-slate-500">❌</td>
              <td className="p-2 text-center text-slate-500">❌</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>خطة اختيار نظام HR لشركتك</h2>
      <ol>
        <li><strong>حدد احتياجاتك:</strong> كام موظف؟ محتاج مرتبات بس ولا HR كامل؟ محتاج CRM؟</li>
        <li><strong>جرب بنفسك:</strong> استخدم الفترة المجانية — مش مجرد demo. جرب النظام لمدة 14 يوم.</li>
        <li><strong>اختبر الدعم الفني:</strong> ابعت سؤال قبل ما تشترك — شوف سرعة واستجابة الدعم.</li>
        <li><strong>اسأل عن التوسع:</strong> لو كبرت شركتك، هل النظام هيكفي ولا هتضطر تغيره؟</li>
        <li><strong>قارن التكلفة الكاملة:</strong> مش بس سعر الاشتراك — ضيف وقت التدريب، الدعم، وصيانة النظام.</li>
      </ol>

      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/30 border border-cyan-200 dark:border-cyan-800 rounded-2xl p-6 my-8">
        <h3 className="text-lg font-black font-cairo text-cyan-800 dark:text-cyan-200 mb-2">
          🎯 خلّينا نساعدك تختار
        </h3>
        <p className="text-sm text-cyan-700 dark:text-cyan-300 font-cairo mb-4">
          مش عارف تبدأ منين؟ جرب نِظام 14 يوم مجاناً — هندعمك خطوة بخطوة في تجهيز النظام لشركتك.
        </p>
        <Link
          href="/signup"
          className="inline-block px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-black font-cairo text-sm shadow"
        >
          ابدأ تجربة مجانية ←
        </Link>
      </div>

      <h2>الخلاصة</h2>
      <p>
        اختيار نظام HR الصح هو قرار استراتيجي لشركتك. استخدم المعايير العشرة
        دي كـ checklist قبل ما تدفع فلوس. ولو عايز نظام مصري 100% متوافق مع
        القانون المصري وبيعمل HR + CRM + تسويق في واحد — نِظام هو اختيارك.
      </p>
    </>
  );
}
