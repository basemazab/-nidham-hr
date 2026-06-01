// ============================================================================
// Nidham Strategic AI Dashboard — Component (V2)
// ============================================================================

"use client";

import React, { useState, useMemo } from "react";
import { 
  predictEmployeeChurn, 
  calculateReplacementCost, 
  auditStrategicCompliance,
  simulateExpansion,
  ExpansionSimulationResult
} from "@/lib/nidham-ai-engine";
import { EmployeeSignals } from "@/lib/retention";

type Props = {
  employees: EmployeeSignals[];
};

type Region = "Egypt" | "KSA" | "UAE";
type Role = "tech" | "sales" | "ops";

export function NidhamAIDashboard({ employees }: Props) {
  const [activeTab, setActiveTab] = useState<"predictions" | "compliance" | "simulation">("predictions");
  const [simParams, setSimParams] = useState<{ role: Role; count: number; region: Region }>({
    role: "tech",
    count: 5,
    region: "Egypt",
  });
  
  const tabs = [
    { id: "predictions" as const, label: "التنبؤات", icon: "🧠" },
    { id: "compliance" as const, label: "الالتزام", icon: "⚖️" },
    { id: "simulation" as const, label: "المحاكاة", icon: "🚀" },
  ];

  const churnRisks = useMemo(
    () =>
      employees
        .map((e) => predictEmployeeChurn(e))
        .filter(Boolean)
        .sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0)),
    [employees],
  );

  const legalUpdates = useMemo(
    () => (activeTab === "compliance" ? auditStrategicCompliance(employees.map((e) => ({ id: e.id, basicSalary: e.basicSalary }))) : []),
    [employees, activeTab],
  );

  const simulation = useMemo(
    () => (activeTab === "simulation" ? simulateExpansion(simParams.role, simParams.count, simParams.region) : null),
    [simParams, activeTab],
  );

  return (
    <div className="space-y-6 font-cairo bg-slate-50/50 p-6 rounded-[2rem] border border-slate-200/60 shadow-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
            <h2 className="text-2xl font-black text-slate-900">محرك نيدهام الاستراتيجي</h2>
          </div>
          <p className="text-slate-500 text-sm">تحليل استباقي مدعوم بالذكاء الاصطناعي لنمو شركتك</p>
        </div>

        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Predictions Tab */}
      {activeTab === "predictions" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDuration: "200ms" }}>
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span>⚠️</span> موظفون تحت خطر الاستقالة
            </h3>
            {churnRisks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {churnRisks.slice(0, 4).map((risk, idx) => {
                  const emp = employees.find((e) => e.id === risk?.employeeId);
                  const cost = emp ? calculateReplacementCost(emp) : null;
                  return (
                    <div key={risk?.employeeId ?? idx} className="bg-white p-5 rounded-3xl border border-rose-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-black text-slate-900">{risk?.employeeName}</div>
                          <div className="text-xs text-slate-500">{risk?.jobTitle}</div>
                        </div>
                        <div className="bg-rose-600 text-white px-3 py-1 rounded-full text-xs font-black">
                          {Math.round(risk?.score ?? 0)}%
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        {risk?.reasoning.slice(1, 3).map((r, i) => (
                          <div key={i} className="text-[11px] text-rose-700 bg-rose-50 px-2 py-1 rounded-lg">
                            • {r}
                          </div>
                        ))}
                      </div>
                      {cost && (
                        <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-400">تكلفة الاستبدال:</span>
                          <span className="text-sm font-black text-rose-600">
                            {(cost.totalCost / 1000).toFixed(1)}k ج
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white py-20 rounded-3xl border border-slate-200 text-center">
                <span className="text-4xl mb-4 block">✨</span>
                <p className="text-slate-500 font-bold">بيئة العمل مستقرة جداً حالياً!</p>
              </div>
            )}
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
            <h3 className="text-lg font-bold mb-4">نصيحة الذكاء الاصطناعي 💡</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              بناءً على تحليل البيانات، يظهر تراجع في الحضور بنسبة 8% في قسم &quot;المبيعات&quot; أيام الخميس. نقترح تفعيل &quot;نظام العمل المرن&quot; أو &quot;العمل عن بعد&quot; في هذا اليوم لرفع الروح المعنوية وتقليل مخاطر الاستقالة.
            </p>
            <div className="space-y-3">
              <div className="bg-white/10 p-3 rounded-2xl">
                <div className="text-[10px] text-slate-400 uppercase font-bold">العائد المتوقع (ROI)</div>
                <div className="text-xl font-black text-emerald-400">توفير 145,000 ج</div>
                <div className="text-[10px] text-slate-400">سنوياً من تكاليف الاستبدال</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Compliance Tab */}
      {activeTab === "compliance" && (
        <div className="space-y-6 animate-fade-in-up" style={{ animationDuration: "200ms" }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(legalUpdates).map((update, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600" />
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-black text-slate-900">{update.title}</h4>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg font-bold">{update.effectiveDate}</span>
                </div>
                <p className="text-sm text-slate-600 mb-4">{update.description}</p>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">رأي المستشار الاستراتيجي:</div>
                  <p className="text-xs text-indigo-900 font-bold">{update.strategicAdvice}</p>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-slate-500">
                    تأثير على <span className="font-black text-slate-900">{update.impactedEmployeesCount} موظف</span>
                  </div>
                  <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:scale-105 transition">
                    تطبيق التعديلات
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Simulation Tab */}
      {activeTab === "simulation" && simulation && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDuration: "200ms" }}>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6">إعدادات سيناريو التوسع</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">الدولة / المنطقة</label>
                <select
                  value={simParams.region}
                  onChange={(e) => setSimParams({ ...simParams, region: e.target.value as Region })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Egypt">مصر (EGP)</option>
                  <option value="KSA">السعودية (SAR)</option>
                  <option value="UAE">الإمارات (AED)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">نوع الوظائف</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["tech", "sales", "ops"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setSimParams({ ...simParams, role: r as Role })}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${
                        simParams.role === r ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      {r === "tech" ? "تقني" : r === "sales" ? "مبيعات" : "عمليات"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">
                  عدد الموظفين الجدد: {simParams.count}
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={simParams.count}
                  onChange={(e) => setSimParams({ ...simParams, count: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-4 bg-indigo-50 rounded-2xl">
                <div className="text-[10px] font-bold text-indigo-400 uppercase mb-1">الزيادة الشهرية (رواتب)</div>
                <div className="text-2xl font-black text-indigo-900">
                  {simulation.estimatedMonthlyPayrollIncrease.toLocaleString()}
                  <span className="text-xs mr-1 font-normal opacity-60">
                    {simulation.currency === "EGP" ? "ج" : simulation.currency === "SAR" ? "ر.س" : "د.إ"}
                  </span>
                </div>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl">
                <div className="text-[10px] font-bold text-emerald-400 uppercase mb-1">التكلفة السنوية الإجمالية</div>
                <div className="text-2xl font-black text-emerald-900">
                  {(simulation.estimatedAnnualCost / 1000000).toFixed(2)}M
                </div>
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl">
                <div className="text-[10px] font-bold text-amber-400 uppercase mb-1">تعقيد التشغيل</div>
                <div className="text-2xl font-black text-amber-900">
                  {simulation.onboardingComplexity === "High" ? "مرتفع ⚠️" : "متوسط ✅"}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-900">توصيات نيدهام الاستراتيجية:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {simulation.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-indigo-600 font-bold">#</span>
                    <p className="text-xs text-slate-700 leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
