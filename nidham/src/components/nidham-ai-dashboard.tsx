// ============================================================================
// Nidham AI Predictive Engine — Dashboard Component
// ============================================================================

import React from "react";
import { 
  predictEmployeeChurn, 
  calculateReplacementCost, 
  auditLegalCompliance,
  EGYPT_2026_LAWS 
} from "@/lib/nidham-ai-engine";
import { EmployeeSignals } from "@/lib/retention";

type Props = {
  employees: EmployeeSignals[];
};

export function NidhamAIDashboard({ employees }: Props) {
  const churnRisks = employees
    .map(e => predictEmployeeChurn(e))
    .filter(Boolean)
    .sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0));

  const legalUpdates = auditLegalCompliance(employees.map(e => ({ id: e.id, basicSalary: e.basicSalary })));

  return (
    <div className="space-y-6 font-cairo">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800">محرك نيدهام للتنبؤ الاستباقي</h2>
          <p className="text-slate-500 text-sm">ذكاء اصطناعي يحلل البيانات ليحميك من المفاجآت</p>
        </div>
        <div className="bg-indigo-600 text-white px-4 py-2 rounded-full text-xs font-bold animate-pulse">
          Nidham AI Active
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Churn Prediction Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🧠</span>
            <h3 className="text-lg font-bold text-slate-800">التنبؤ بالاستقالات (Churn)</h3>
          </div>
          
          {churnRisks.length > 0 ? (
            <div className="space-y-4">
              {churnRisks.slice(0, 3).map((risk, idx) => {
                const emp = employees.find(e => e.id === risk?.employeeId);
                const cost = emp ? calculateReplacementCost(emp) : null;
                
                return (
                  <div key={idx} className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-bold text-rose-900">{risk?.employeeName}</span>
                        <p className="text-xs text-rose-700">{risk?.jobTitle}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-rose-600">{Math.round(risk?.score ?? 0)}%</span>
                        <p className="text-[10px] text-rose-500 font-bold uppercase">Risk Level</p>
                      </div>
                    </div>
                    
                    <ul className="text-xs space-y-1 mb-3">
                      {risk?.reasoning.map((r, i) => (
                        <li key={i} className="text-rose-800 flex items-center gap-1">
                          <span className="opacity-50">•</span> {r}
                        </li>
                      ))}
                    </ul>

                    {cost && (
                      <div className="mt-3 pt-3 border-t border-rose-200 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-rose-600 uppercase">تكلفة الاستبدال المتوقعة:</span>
                        <span className="text-sm font-black text-rose-900">{cost.totalCost.toLocaleString("ar-EG")} ج</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 italic text-sm">
              لا توجد مخاطر استقالة مرتفعة حالياً. عمل جيد!
            </div>
          )}
        </div>

        {/* 2. Legal Compliance Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">⚖️</span>
            <h3 className="text-lg font-bold text-slate-800">التدقيق القانوني الآلي (2026)</h3>
          </div>

          <div className="space-y-4">
            {legalUpdates.map((update, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border ${update.type === 'minimum_wage' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`font-bold ${update.type === 'minimum_wage' ? 'text-amber-900' : 'text-blue-900'}`}>{update.title}</span>
                  <span className="text-[10px] bg-white px-2 py-1 rounded-md font-bold shadow-sm">
                    {update.effectiveDate}
                  </span>
                </div>
                <p className="text-xs mb-3 text-slate-600 leading-relaxed">
                  {update.description}
                </p>
                <div className="flex justify-between items-center">
                  <div className="text-[10px] font-bold uppercase text-slate-400">الموظفين المتأثرين:</div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-800">{update.impactedEmployeesCount} موظف</span>
                    <button className="text-[10px] bg-slate-800 text-white px-2 py-1 rounded-md hover:bg-slate-700 transition">
                      تعديل الآن
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">تنبيهات مستقبلية</h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-xl">🔔</div>
              <div>
                <p className="text-xs font-bold text-slate-800">تطبيق ضرائب 2026</p>
                <p className="text-[10px] text-slate-500">سيقوم النظام بتحديث شرائح الضرائب تلقائياً في 1 يناير 2026.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
