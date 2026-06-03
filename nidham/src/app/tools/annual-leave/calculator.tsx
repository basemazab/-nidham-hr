"use client";

import { useState, useMemo } from "react";

// ============================================================================
// Interactive annual-leave entitlement calculator — Labour Law Art. 47
// ============================================================================
//
// Egyptian Labour Law 12/2003, Article 47:
//   • < 6 months service          → not yet entitled
//   • 6–12 months                 → pro-rated 21 days × (months ÷ 12)
//   • 1–10 years                  → 21 days/year
//   • ≥ 10 years OR age ≥ 50      → 30 days/year
//   • + 7 days for hazardous / arduous work or remote areas
//
// Pure law logic (no production fn to reuse — leave entitlement isn't in
// the payroll lib), implemented here with explicit comments so the result
// is auditable.

const BASE_DAYS = 21;
const SENIOR_DAYS = 30;
const HAZARD_BONUS = 7;

export function AnnualLeaveCalculator() {
  const [years, setYears] = useState<number>(3);
  const [months, setMonths] = useState<number>(0);
  const [age, setAge] = useState<number>(35);
  const [hazardous, setHazardous] = useState<boolean>(false);

  const result = useMemo(() => {
    const y = Number.isFinite(years) && years > 0 ? Math.floor(years) : 0;
    const m = Number.isFinite(months) && months > 0 ? Math.floor(months) : 0;
    const a = Number.isFinite(age) && age > 0 ? age : 0;
    const totalMonths = y * 12 + m;

    let days = 0;
    let rule = "";
    let entitled = true;

    if (totalMonths < 6) {
      days = 0;
      entitled = false;
      rule = "أقل من 6 شهور خدمة — الإجازة السنوية لسه مش مستحقة قانوناً.";
    } else {
      const senior = y >= 10 || a >= 50;
      const base = senior ? SENIOR_DAYS : BASE_DAYS;
      if (totalMonths < 12) {
        // First year, after the 6-month qualifying period → pro-rated.
        days = Math.round((base * totalMonths) / 12);
        rule = `السنة الأولى — إجازة بنسبة مدة الخدمة: ${base} يوم × (${totalMonths} شهر ÷ 12).`;
      } else {
        days = base;
        rule = senior
          ? a >= 50
            ? "السن 50 سنة أو أكثر — تستحق 30 يوم في السنة."
            : "10 سنوات خدمة أو أكثر — تستحق 30 يوم في السنة."
          : "من سنة حتى 10 سنوات — تستحق 21 يوم في السنة.";
      }
    }

    const bonus = entitled && hazardous ? HAZARD_BONUS : 0;
    const total = days + bonus;

    return { totalMonths, days, bonus, total, rule, entitled };
  }, [years, months, age, hazardous]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Inputs */}
      <div className="p-6 md:p-8 bg-gradient-to-br from-cyan-50/50 to-white border-b border-slate-200">
        <h2 className="text-lg font-black text-slate-900 mb-5">بيانات الموظف</h2>

        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <NumberInput label="سنوات الخدمة" hint="سنوات كاملة" value={years} onChange={setYears} suffix="سنة" />
          <NumberInput label="شهور إضافية" hint="0 – 11" value={months} onChange={setMonths} suffix="شهر" />
          <NumberInput label="عمر الموظف" hint="للقاعدة 50+" value={age} onChange={setAge} suffix="سنة" />
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hazardous}
            onChange={(e) => setHazardous(e.target.checked)}
            className="w-5 h-5 rounded border-slate-300 text-brand-cyan focus:ring-brand-cyan"
          />
          <span className="text-sm font-bold text-slate-800">
            عمل شاق / خطر أو منطقة نائية
            <span className="text-slate-500 font-normal"> (+7 أيام)</span>
          </span>
        </label>
      </div>

      {/* Results */}
      <div className="p-6 md:p-8">
        <h2 className="text-lg font-black text-slate-900 mb-5">
          رصيد الإجازة السنوية المستحق
        </h2>

        {result.entitled ? (
          <div className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-300">
            <div className="text-sm font-bold text-emerald-700 mb-2">
              الإجازة السنوية المستحقة
            </div>
            <div className="text-4xl md:text-5xl font-black text-emerald-900">
              {result.total} يوم
            </div>
            <div className="text-sm text-emerald-700 mt-2">{result.rule}</div>
          </div>
        ) : (
          <div className="mb-6 p-6 rounded-2xl bg-amber-50 border-2 border-amber-200">
            <div className="text-2xl font-black text-amber-900 mb-1">
              غير مستحقة بعد
            </div>
            <div className="text-sm text-amber-800">{result.rule}</div>
          </div>
        )}

        {result.entitled && (
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <Row label="الرصيد الأساسي" value={`${result.days} يوم`} />
                {result.bonus > 0 && (
                  <Row label="+ علاوة عمل شاق/نائي" value={`${result.bonus} يوم`} />
                )}
                <Row label="الإجمالي السنوي" value={`${result.total} يوم`} result />
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">
          ℹ️ حسب المادة 47 من قانون العمل 12/2003: 21 يوم بعد 6 شهور خدمة،
          و30 يوم بعد 10 سنوات أو لمن تجاوز 50 سنة، +7 أيام للأعمال الشاقة
          والمناطق النائية.
        </div>
      </div>
    </div>
  );
}

function NumberInput({
  label,
  hint,
  value,
  onChange,
  suffix,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
  suffix: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-bold text-slate-900 mb-1">{label}</span>
      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full px-4 py-3 pr-14 text-lg font-bold text-slate-900 rounded-lg border border-slate-300 bg-white focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/30 outline-none transition"
          placeholder="0"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
          {suffix}
        </span>
      </div>
      <span className="block text-xs text-slate-500 mt-1">{hint}</span>
    </label>
  );
}

function Row({
  label,
  value,
  result,
}: {
  label: string;
  value: string;
  result?: boolean;
}) {
  return (
    <tr
      className={`border-b border-slate-200 last:border-b-0 ${
        result ? "bg-emerald-50" : "bg-white"
      }`}
    >
      <td className={`px-4 py-3 ${result ? "text-emerald-900 font-bold" : "text-slate-700"}`}>
        {label}
      </td>
      <td
        className={`px-4 py-3 text-end whitespace-nowrap ${
          result ? "text-emerald-900 font-black text-lg" : "text-slate-900 font-bold"
        }`}
      >
        {value}
      </td>
    </tr>
  );
}
