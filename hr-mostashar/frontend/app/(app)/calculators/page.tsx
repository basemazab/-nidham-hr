"use client";

import { useState } from "react";
import AppLayout from "@/components/shared/AppLayout";
import { api } from "@/lib/api";

type CalcType = "endOfService" | "insurance" | "leaves" | "netSalary";

export default function CalculatorsPage() {
  const [activeCalc, setActiveCalc] = useState<CalcType>("endOfService");
  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calcList: { id: CalcType; icon: string; name: string }[] = [
    { id: "endOfService", icon: "💰", name: "نهاية الخدمة" },
    { id: "insurance", icon: "🛡️", name: "التأمينات" },
    { id: "leaves", icon: "🏖️", name: "الإجازات" },
    { id: "netSalary", icon: "💵", name: "الراتب الصافي" },
  ];

  const handleSubmit = async (fields: Record<string, unknown>) => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      let res: Record<string, any>;
      switch (activeCalc) {
        case "endOfService":
          res = await api.calc.endOfService(fields);
          break;
        case "insurance":
          res = await api.calc.insurance(fields);
          break;
        case "leaves":
          res = await api.calc.leaves(fields);
          break;
        case "netSalary":
          res = await api.calc.netSalary(fields);
          break;
      }
      setResult(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <h1 className="text-3xl font-bold text-primary font-heading mb-6">🧮 الحاسبات</h1>

      <div className="grid md:grid-cols-4 gap-3 mb-6">
        {calcList.map((calc) => (
          <button
            key={calc.id}
            onClick={() => { setActiveCalc(calc.id); setResult(null); setError(""); }}
            className={`p-4 rounded-xl text-center transition font-bold ${
              activeCalc === calc.id
                ? "bg-accent text-primary"
                : "bg-white text-primary hover:bg-gray-100"
            }`}
          >
            <div className="text-2xl mb-1">{calc.icon}</div>
            <div>{calc.name}</div>
          </button>
        ))}
      </div>

      <div className="card max-w-2xl">
        {activeCalc === "endOfService" && <EndOfServiceForm onSubmit={handleSubmit} />}
        {activeCalc === "insurance" && <InsuranceForm onSubmit={handleSubmit} />}
        {activeCalc === "leaves" && <LeavesForm onSubmit={handleSubmit} />}
        {activeCalc === "netSalary" && <NetSalaryForm onSubmit={handleSubmit} />}
      </div>

      {loading && (
        <div className="text-center mt-4 text-gray-500">
          جاري الحساب...
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-50 text-red-600 p-4 rounded-xl text-center">
          ⚠️ {error}
        </div>
      )}

      {result && activeCalc === "endOfService" && <EndOfServiceResult data={result} />}
      {result && activeCalc === "insurance" && <InsuranceResult data={result} />}
      {result && activeCalc === "leaves" && <LeavesResult data={result} />}
      {result && activeCalc === "netSalary" && <NetSalaryResult data={result} />}
    </AppLayout>
  );
}

function FormField({ label, type = "text", value, onChange, required = false }: {
  label: string; type?: string; value: string | number; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-bold text-primary mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
        required={required}
      />
    </div>
  );
}

function EndOfServiceForm({ onSubmit }: { onSubmit: (f: Record<string, unknown>) => void }) {
  const [fields, setFields] = useState({ startDate: "", endDate: "", totalSalary: "", contractType: "unlimited", reason: "resignation" });

  return (
    <div>
      <h2 className="text-xl font-bold text-primary mb-4">💰 حاسبة مكافأة نهاية الخدمة</h2>
      <FormField label="تاريخ التعيين" type="date" value={fields.startDate} onChange={(v) => setFields({ ...fields, startDate: v })} required />
      <FormField label="تاريخ ترك العمل" type="date" value={fields.endDate} onChange={(v) => setFields({ ...fields, endDate: v })} required />
      <FormField label="آخر مرتب شامل (جنيه)" type="number" value={fields.totalSalary} onChange={(v) => setFields({ ...fields, totalSalary: v })} required />
      <div className="mb-4">
        <label className="block text-sm font-bold text-primary mb-1">نوع العقد</label>
        <select value={fields.contractType} onChange={(e) => setFields({ ...fields, contractType: e.target.value })} className="input-field">
          <option value="unlimited">غير محدد المدة</option>
          <option value="fixed">محدد المدة</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-bold text-primary mb-1">سبب ترك العمل</label>
        <select value={fields.reason} onChange={(e) => setFields({ ...fields, reason: e.target.value })} className="input-field">
          <option value="resignation">استقالة</option>
          <option value="end_of_contract">انتهاء العقد</option>
          <option value="arbitrary_dismissal">فصل تعسفي</option>
        </select>
      </div>
      <button onClick={() => onSubmit({ start_date: fields.startDate, end_date: fields.endDate, total_salary: parseFloat(fields.totalSalary), contract_type: fields.contractType, reason: fields.reason })} className="btn-accent w-full">احسب المكافأة</button>
    </div>
  );
}

function InsuranceForm({ onSubmit }: { onSubmit: (f: Record<string, unknown>) => void }) {
  const [salary, setSalary] = useState("");

  return (
    <div>
      <h2 className="text-xl font-bold text-primary mb-4">🛡️ حاسبة التأمينات الاجتماعية</h2>
      <FormField label="المرتب الإجمالي (جنيه)" type="number" value={salary} onChange={setSalary} required />
      <button onClick={() => onSubmit({ gross_salary: parseFloat(salary) })} className="btn-accent w-full">احسب التأمينات</button>
    </div>
  );
}

function LeavesForm({ onSubmit }: { onSubmit: (f: Record<string, unknown>) => void }) {
  const [fields, setFields] = useState({ startDate: "", currentDate: "", takenDays: "0", employeeAge: "30" });

  return (
    <div>
      <h2 className="text-xl font-bold text-primary mb-4">🏖️ حاسبة الإجازات</h2>
      <FormField label="تاريخ التعيين" type="date" value={fields.startDate} onChange={(v) => setFields({ ...fields, startDate: v })} required />
      <FormField label="تاريخ اليوم" type="date" value={fields.currentDate} onChange={(v) => setFields({ ...fields, currentDate: v })} required />
      <FormField label="إجازات مأخوذة (أيام)" type="number" value={fields.takenDays} onChange={(v) => setFields({ ...fields, takenDays: v })} />
      <FormField label="عمر الموظف" type="number" value={fields.employeeAge} onChange={(v) => setFields({ ...fields, employeeAge: v })} />
      <button onClick={() => onSubmit({ start_date: fields.startDate, current_date: fields.currentDate, taken_days: parseInt(fields.takenDays), employee_age: parseInt(fields.employeeAge) })} className="btn-accent w-full">احسب الرصيد</button>
    </div>
  );
}

function NetSalaryForm({ onSubmit }: { onSubmit: (f: Record<string, unknown>) => void }) {
  const [fields, setFields] = useState({ grossSalary: "", maritalStatus: "single", dependents: "0" });

  return (
    <div>
      <h2 className="text-xl font-bold text-primary mb-4">💵 حاسبة الراتب الصافي</h2>
      <FormField label="المرتب الإجمالي (جنيه)" type="number" value={fields.grossSalary} onChange={(v) => setFields({ ...fields, grossSalary: v })} required />
      <div className="mb-4">
        <label className="block text-sm font-bold text-primary mb-1">الحالة الاجتماعية</label>
        <select value={fields.maritalStatus} onChange={(e) => setFields({ ...fields, maritalStatus: e.target.value })} className="input-field">
          <option value="single">أعزب</option>
          <option value="married">متزوج</option>
        </select>
      </div>
      <FormField label="عدد المعالين" type="number" value={fields.dependents} onChange={(v) => setFields({ ...fields, dependents: v })} />
      <button onClick={() => onSubmit({ gross_salary: parseFloat(fields.grossSalary), marital_status: fields.maritalStatus, dependents: parseInt(fields.dependents) })} className="btn-accent w-full">احسب الراتب الصافي</button>
    </div>
  );
}

function EndOfServiceResult({ data }: { data: any }) {
  return (
    <div className="card mt-4 max-w-2xl border-r-4 border-accent">
      <h2 className="text-xl font-bold text-primary mb-4">📊 النتيجة</h2>
      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-accent">{data.reward?.toLocaleString()} جنيه</div>
        <p className="text-sm text-gray-500">مكافأة نهاية الخدمة</p>
      </div>
      <div className="space-y-2 mb-4">
        <p><strong>مدة الخدمة:</strong> {data.years_of_service} سنة</p>
        <p><strong>المرتب المستخدم:</strong> {data.total_salary?.toLocaleString()} جنيه</p>
      </div>
      {data.breakdown && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="font-bold text-primary mb-2">تفاصيل الحساب:</p>
          {data.breakdown.map((line: string, i: number) => (
            <p key={i} className="text-sm text-gray-700">• {line}</p>
          ))}
        </div>
      )}
      <p className="text-sm text-gray-500 mt-3">📋 {data.legal_reference}</p>
    </div>
  );
}

function InsuranceResult({ data }: { data: any }) {
  return (
    <div className="card mt-4 max-w-2xl border-r-4 border-accent">
      <h2 className="text-xl font-bold text-primary mb-4">📊 النتيجة</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-primary">{data.employee_deductions?.total?.toLocaleString()} جنيه</div>
          <p className="text-sm text-gray-500">استقطاعات العامل</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-primary">{data.employer_contributions?.total?.toLocaleString()} جنيه</div>
          <p className="text-sm text-gray-500">اشتراكات صاحب العمل</p>
        </div>
      </div>
      <div className="text-center mb-4">
        <div className="text-2xl font-bold text-accent">صافي الراتب: {data.net_salary_after_insurance?.toLocaleString()} جنيه</div>
      </div>
      <p className="text-sm text-gray-500">📋 {data.legal_reference}</p>
    </div>
  );
}

function LeavesResult({ data }: { data: any }) {
  return (
    <div className="card mt-4 max-w-2xl border-r-4 border-accent">
      <h2 className="text-xl font-bold text-primary mb-4">📊 رصيد الإجازات</h2>
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-bold text-primary mb-2">الإجازة السنوية</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><div className="font-bold text-2xl">{data.annual_leave?.total}</div><div className="text-sm text-gray-500">الإجمالي</div></div>
            <div><div className="font-bold text-2xl text-red-500">{data.annual_leave?.taken}</div><div className="text-sm text-gray-500">مأخوذة</div></div>
            <div><div className="font-bold text-2xl text-success">{data.annual_leave?.remaining}</div><div className="text-sm text-gray-500">متبقية</div></div>
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-bold text-primary mb-2">الإجازة العارضة</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><div className="font-bold text-2xl">{data.casual_leave?.total}</div><div className="text-sm text-gray-500">الإجمالي</div></div>
            <div><div className="font-bold text-2xl text-red-500">{data.casual_leave?.taken}</div><div className="text-sm text-gray-500">مأخوذة</div></div>
            <div><div className="font-bold text-2xl text-success">{data.casual_leave?.remaining}</div><div className="text-sm text-gray-500">متبقية</div></div>
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-3">📋 {data.legal_reference}</p>
    </div>
  );
}

function NetSalaryResult({ data }: { data: any }) {
  return (
    <div className="card mt-4 max-w-2xl border-r-4 border-accent">
      <h2 className="text-xl font-bold text-primary mb-4">📊 الراتب الصافي</h2>
      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-accent">{data.net_monthly?.toLocaleString()} جنيه</div>
        <p className="text-sm text-gray-500">صافي الراتب الشهري</p>
      </div>
      <div className="space-y-2 mb-4">
        <div className="flex justify-between py-2 border-b">
          <span>الراتب الإجمالي</span>
          <span className="font-bold">{data.gross_monthly?.toLocaleString()} جنيه</span>
        </div>
        <div className="flex justify-between py-2 border-b text-red-500">
          <span>التأمينات ({data.insurance_deductions?.rate})</span>
          <span className="font-bold">- {data.insurance_deductions?.monthly?.toLocaleString()} جنيه</span>
        </div>
        <div className="flex justify-between py-2 border-b text-red-500">
          <span>الضريبة</span>
          <span className="font-bold">- {data.tax?.monthly?.toLocaleString()} جنيه</span>
        </div>
      </div>
      {data.family_discount > 0 && (
        <p className="text-sm text-green-600">✅ خصم أسرة ومعالين: {data.family_discount?.toLocaleString()} جنيه</p>
      )}
      <p className="text-sm text-gray-500 mt-3">📋 {data.legal_reference}</p>
    </div>
  );
}
