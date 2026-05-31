import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireHR } from "@/lib/permissions";
import { NidhamAIDashboard } from "@/components/nidham-ai-dashboard";
import { loadNidhamAISignals } from "../nidham-ai-actions";

export const dynamic = "force-dynamic";

export default async function NidhamAIPage() {
  const { profile } = await requireHR();
  const supabase = await createClient();

  // Fetch company info
  const { data: company } = await supabase
    .from("companies")
    .select("name, industry")
    .eq("id", profile.company_id)
    .maybeSingle();

  // Load AI signals
  const aiSignals = await loadNidhamAISignals();

  return (
    <main className="flex-1 px-6 py-8 min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-3xl">🧠</span>
            </div>
            <div>
              <h1 className="text-4xl font-black font-cairo text-slate-800">
                محرك نيدهام للتنبؤ الاستباقي
              </h1>
              <p className="text-slate-500 text-sm font-cairo mt-1">
                ذكاء اصطناعي متقدم يحلل بيانات الموظفين ويتنبأ بالمشاكل قبل حدوثها
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <div className="text-sm text-slate-500 font-bold mb-2 font-cairo">الشركة</div>
              <div className="text-2xl font-black text-slate-800 font-cairo">{company?.name ?? "—"}</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <div className="text-sm text-slate-500 font-bold mb-2 font-cairo">عدد الموظفين المحللين</div>
              <div className="text-2xl font-black text-slate-800 font-cairo">{aiSignals.length}</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <div className="text-sm text-slate-500 font-bold mb-2 font-cairo">آخر تحديث</div>
              <div className="text-2xl font-black text-slate-800 font-cairo">{new Date().toLocaleDateString("ar-EG")}</div>
            </div>
          </div>
        </div>

        {/* Main AI Dashboard */}
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
          <NidhamAIDashboard employees={aiSignals} />
        </div>

        {/* Feature Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* Churn Prediction Card */}
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl border border-rose-100 p-6">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-lg font-bold text-rose-900 font-cairo mb-2">التنبؤ بالاستقالات</h3>
            <p className="text-sm text-rose-800 font-cairo leading-relaxed mb-4">
              يحلل النظام أنماط الغياب والتفاعل والراتب ليعطيك احتمالية دقيقة لترك الموظف العمل.
            </p>
            <div className="text-xs text-rose-700 font-bold font-cairo">
              ✓ يحسب احتمالية الاستقالة<br/>
              ✓ يحدد الأسباب المحتملة<br/>
              ✓ يقترح تدخلات استباقية
            </div>
          </div>

          {/* Replacement Cost Card */}
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border border-amber-100 p-6">
            <div className="text-3xl mb-3">💰</div>
            <h3 className="text-lg font-bold text-amber-900 font-cairo mb-2">حساب تكلفة الاستبدال</h3>
            <p className="text-sm text-amber-800 font-cairo leading-relaxed mb-4">
              يحسب بدقة كم ستخسر الشركة إذا رحل الموظف (توظيف، تدريب، إنتاجية).
            </p>
            <div className="text-xs text-amber-700 font-bold font-cairo">
              ✓ تكلفة التوظيف البديل<br/>
              ✓ تكلفة التدريب والتهيئة<br/>
              ✓ خسارة الإنتاجية المتوقعة
            </div>
          </div>

          {/* Legal Compliance Card */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100 p-6">
            <div className="text-3xl mb-3">⚖️</div>
            <h3 className="text-lg font-bold text-blue-900 font-cairo mb-2">التدقيق القانوني الآلي</h3>
            <p className="text-sm text-blue-800 font-cairo leading-relaxed mb-4">
              مراقبة فورية لأي تغيير قانوني (أجور، ضرائب) وتنبيهك لتعديل الرواتب فوراً.
            </p>
            <div className="text-xs text-blue-700 font-bold font-cairo">
              ✓ تحديثات الحد الأدنى للأجور<br/>
              ✓ تغييرات الضرائب 2026<br/>
              ✓ تنبيهات فورية للامتثال
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-8 bg-slate-900 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-black font-cairo mb-6">كيف يعمل المحرك؟</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold font-cairo mb-3 flex items-center gap-2">
                <span className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">1</span>
                جمع البيانات
              </h3>
              <p className="text-slate-300 text-sm font-cairo">
                يجمع النظام بيانات الحضور والرواتب والإجازات والتطور الوظيفي لكل موظف على مدار 90 يوم الماضية.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold font-cairo mb-3 flex items-center gap-2">
                <span className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">2</span>
                التحليل الذكي
              </h3>
              <p className="text-slate-300 text-sm font-cairo">
                يحلل النظام الأنماط والاتجاهات باستخدام خوارزميات متقدمة لحساب مؤشرات المخاطر.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold font-cairo mb-3 flex items-center gap-2">
                <span className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">3</span>
                التنبؤ والتنبيه
              </h3>
              <p className="text-slate-300 text-sm font-cairo">
                ينتج التنبيهات والتوصيات مع نسب احتمالية دقيقة وأسباب واضحة.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold font-cairo mb-3 flex items-center gap-2">
                <span className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">4</span>
                التدخل الاستباقي
              </h3>
              <p className="text-slate-300 text-sm font-cairo">
                توفر توصيات عملية للتدخل قبل حدوث المشكلة (زيادة راتب، مقابلة 1:1، إلخ).
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-8 bg-white rounded-2xl border border-slate-100 p-8">
          <h2 className="text-2xl font-black font-cairo mb-6">أسئلة شائعة</h2>
          <div className="space-y-4">
            <details className="group border-b border-slate-100 pb-4">
              <summary className="font-bold font-cairo cursor-pointer flex items-center justify-between">
                كم مرة يتم تحديث التنبؤات؟
                <span className="group-open:rotate-180 transition">▼</span>
              </summary>
              <p className="text-slate-600 font-cairo mt-3 text-sm">
                يتم تحديث التنبؤات يومياً تلقائياً بناءً على آخر بيانات الحضور والرواتب. يمكنك أيضاً تحديثها يدوياً من لوحة التحكم.
              </p>
            </details>
            <details className="group border-b border-slate-100 pb-4">
              <summary className="font-bold font-cairo cursor-pointer flex items-center justify-between">
                هل البيانات آمنة؟
                <span className="group-open:rotate-180 transition">▼</span>
              </summary>
              <p className="text-slate-600 font-cairo mt-3 text-sm">
                نعم، جميع البيانات مشفرة ومحمية بمعايير الأمان الدولية. لا يتم مشاركة البيانات مع أي طرف ثالث.
              </p>
            </details>
            <details className="group border-b border-slate-100 pb-4">
              <summary className="font-bold font-cairo cursor-pointer flex items-center justify-between">
                ماذا لو لم أتفق مع التنبؤ؟
                <span className="group-open:rotate-180 transition">▼</span>
              </summary>
              <p className="text-slate-600 font-cairo mt-3 text-sm">
                يمكنك رفض أي توصية بسهولة. سيتعلم النظام من قراراتك ويحسّن التنبؤات مع الوقت.
              </p>
            </details>
          </div>
        </div>
      </div>
    </main>
  );
}
