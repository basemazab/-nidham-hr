"use client";

import { useState, useMemo } from "react";
import {
  calculateHourlyRate,
  calculateOvertimePay,
  formatEGP,
  OVERTIME_RATE_DAY,
  OVERTIME_RATE_NIGHT,
  OVERTIME_RATE_REST,
} from "@/lib/payroll";

// ============================================================================
// Interactive overtime calculator — Egyptian Labour Law Article 85
// ============================================================================
//
// Reuses the SAME production functions the Nidham payroll engine uses
// (calculateHourlyRate + calculateOvertimePay) so the numbers a visitor
// sees are byte-for-byte what they'd get inside the product. Live-updates
// via useMemo on every keystroke — no "calculate" button.
//
// Multipliers (Art. 85): day ×1.35, night ×1.70, rest/holiday ×2.00.
// Normal hourly wage = basic / (workingDays × workdayHours), default
// 26 × 8 = 208 hours/month.

export function OvertimeCalculator() {
  const [basicSalary, setBasicSalary] = useState<number>(8000);
  const [workingDays, setWorkingDays] = useState<number>(26);
  const [workdayHours, setWorkdayHours] = useState<number>(8);
  const [dayHours, setDayHours] = useState<number>(10);
  const [nightHours, setNightHours] = useState<number>(0);
  const [restHours, setRestHours] = useState<number>(0);

  const result = useMemo(() => {
    const safe = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);
    const hourlyRate = calculateHourlyRate(
      safe(basicSalary),
      safe(workingDays) || 26,
      safe(workdayHours) || 8,
    );
    const day = safe(dayHours);
    const night = safe(nightHours);
    const rest = safe(restHours);

    const dayPay = calculateOvertimePay(hourlyRate, { day });
    const nightPay = calculateOvertimePay(hourlyRate, { night });
    const restPay = calculateOvertimePay(hourlyRate, { rest });
    const total = calculateOvertimePay(hourlyRate, { day, night, rest });

    return { hourlyRate, day, night, rest, dayPay, nightPay, restPay, total };
  }, [basicSalary, workingDays, workdayHours, dayHours, nightHours, restHours]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Inputs */}
      <div className="p-6 md:p-8 bg-gradient-to-br from-cyan-50/50 to-white border-b border-slate-200">
        <h2 className="text-lg font-black text-slate-900 mb-5">
          بيانات الموظف وساعات الأوفر تايم
        </h2>

        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <NumberInput
            label="الأجر الأساسي الشهري"
            hint="من العقد"
            value={basicSalary}
            onChange={setBasicSalary}
            step={100}
            suffix="ج.م"
          />
          <NumberInput
            label="أيام العمل في الشهر"
            hint="افتراضي 26"
            value={workingDays}
            onChange={setWorkingDays}
            step={1}
            suffix="يوم"
          />
          <NumberInput
            label="ساعات اليوم"
            hint="افتراضي 8"
            value={workdayHours}
            onChange={setWorkdayHours}
            step={1}
            suffix="ساعة"
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <NumberInput
            label="ساعات إضافية نهارية"
            hint="×1.35 (+35%)"
            value={dayHours}
            onChange={setDayHours}
            step={1}
            suffix="ساعة"
          />
          <NumberInput
            label="ساعات إضافية ليلية"
            hint="×1.70 — من 7م لـ 7ص"
            value={nightHours}
            onChange={setNightHours}
            step={1}
            suffix="ساعة"
          />
          <NumberInput
            label="ساعات راحة/عطلة"
            hint="×2.00 (+100%)"
            value={restHours}
            onChange={setRestHours}
            step={1}
            suffix="ساعة"
          />
        </div>
      </div>

      {/* Results */}
      <div className="p-6 md:p-8">
        <h2 className="text-lg font-black text-slate-900 mb-5">
          قيمة الأوفر تايم المستحقة
        </h2>

        <div className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-300">
          <div className="text-sm font-bold text-emerald-700 mb-2">
            إجمالي بدل الأوفر تايم
          </div>
          <div className="text-4xl md:text-5xl font-black text-emerald-900">
            {formatEGP(result.total)}
          </div>
          <div className="text-sm text-emerald-700 mt-2">
            يُضاف لمرتب الموظف هذا الشهر
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              <Row
                label="الأجر بالساعة"
                value={result.hourlyRate}
                kind="neutral"
                hint={`الأساسي ÷ (${workingDays || 26} يوم × ${workdayHours || 8} ساعة)`}
              />
              <Row
                label={`أوفر تايم نهاري (${result.day} ساعة × ${OVERTIME_RATE_DAY})`}
                value={result.dayPay}
                kind="positive"
              />
              <Row
                label={`أوفر تايم ليلي (${result.night} ساعة × ${OVERTIME_RATE_NIGHT})`}
                value={result.nightPay}
                kind="positive"
              />
              <Row
                label={`راحة/عطلة (${result.rest} ساعة × ${OVERTIME_RATE_REST})`}
                value={result.restPay}
                kind="positive"
              />
              <Row label="إجمالي الأوفر تايم" value={result.total} kind="result" />
            </tbody>
          </table>
        </div>

        <div className="mt-4 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">
          ℹ️ النسب حسب المادة 85 من قانون العمل 12/2003: نهاري +35%، ليلي
          +70% (من 7 مساءً لـ 7 صباحاً)، وأيام الراحة والعطلات +100%.
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function NumberInput({
  label,
  hint,
  value,
  onChange,
  step = 1,
  suffix = "ج.م",
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-bold text-slate-900 mb-1">
        {label}
      </span>
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={step}
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
  kind,
  hint,
}: {
  label: string;
  value: number;
  kind: "positive" | "neutral" | "result";
  hint?: string;
}) {
  const styles = {
    positive: {
      bg: "bg-white",
      label: "text-slate-700",
      value: "text-slate-900 font-bold",
      sign: "+",
    },
    neutral: {
      bg: "bg-slate-50",
      label: "text-slate-600",
      value: "text-slate-700",
      sign: "",
    },
    result: {
      bg: "bg-emerald-50",
      label: "text-emerald-900 font-bold",
      value: "text-emerald-900 font-black text-lg",
      sign: "=",
    },
  }[kind];

  return (
    <tr className={`${styles.bg} border-b border-slate-200 last:border-b-0`}>
      <td className="px-4 py-3 align-top">
        <div className={styles.label}>{label}</div>
        {hint && (
          <div className="text-xs text-slate-500 mt-0.5 font-normal">{hint}</div>
        )}
      </td>
      <td className="px-4 py-3 text-end whitespace-nowrap">
        <span className={styles.value}>
          {styles.sign && (
            <span className="text-slate-400 ml-1 font-normal">
              {styles.sign}
            </span>
          )}
          {formatEGP(value)}
        </span>
      </td>
    </tr>
  );
}
