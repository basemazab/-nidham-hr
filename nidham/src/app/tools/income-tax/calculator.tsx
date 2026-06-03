"use client";

import { useState, useMemo } from "react";
import {
  calculateAnnualIncomeTax,
  calculateSocialInsurance,
  formatEGP,
  PERSONAL_EXEMPTION,
  TAX_BRACKETS_2026,
} from "@/lib/payroll";

// ============================================================================
// Interactive income-tax (ضريبة كسب العمل) calculator — 2026 brackets
// ============================================================================
//
// Reuses the production calculateAnnualIncomeTax + the exact TAX_BRACKETS_2026
// schedule so results match the payroll engine byte-for-byte. Computes a
// per-bracket breakdown for display (which slice of income paid which rate),
// which is the part people actually want to SEE — not just a final number.
//
// Flow: monthly gross → deduct employee social insurance (production fn) →
// annualize → subtract personal exemption (20,000) → walk brackets.

export function IncomeTaxCalculator() {
  const [monthlyGross, setMonthlyGross] = useState<number>(15000);

  const result = useMemo(() => {
    const gross = Number.isFinite(monthlyGross) && monthlyGross > 0 ? monthlyGross : 0;
    const insurance = calculateSocialInsurance(gross);
    const monthlyTaxable = Math.max(0, gross - insurance);
    const annualTaxable = monthlyTaxable * 12;
    const annualTax = calculateAnnualIncomeTax(annualTaxable);
    const monthlyTax = annualTax / 12;
    const effectiveRate = gross > 0 ? (monthlyTax / gross) * 100 : 0;

    // Per-bracket breakdown (after personal exemption), for display only.
    const afterExemption = Math.max(0, annualTaxable - PERSONAL_EXEMPTION);
    let remaining = afterExemption;
    let prev = 0;
    const slices: Array<{ label: string; rate: number; amount: number; tax: number }> =
      [];
    for (const [upper, rate] of TAX_BRACKETS_2026) {
      if (remaining <= 0) break;
      const width = upper - prev;
      const amount = Math.min(remaining, width);
      if (amount > 0) {
        slices.push({
          label:
            upper === Number.POSITIVE_INFINITY
              ? `أكثر من ${formatEGP(prev)}`
              : `${formatEGP(prev)} – ${formatEGP(upper)}`,
          rate,
          amount,
          tax: amount * rate,
        });
      }
      remaining -= amount;
      prev = upper;
    }

    return {
      gross,
      insurance,
      monthlyTaxable,
      annualTaxable,
      annualTax,
      monthlyTax,
      effectiveRate,
      slices,
    };
  }, [monthlyGross]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Input */}
      <div className="p-6 md:p-8 bg-gradient-to-br from-cyan-50/50 to-white border-b border-slate-200">
        <h2 className="text-lg font-black text-slate-900 mb-5">الراتب الشهري</h2>
        <div className="max-w-xs">
          <label className="block">
            <span className="block text-sm font-bold text-slate-900 mb-1">
              الراتب الشهري الإجمالي
            </span>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step={500}
                value={monthlyGross || ""}
                onChange={(e) => setMonthlyGross(Number(e.target.value))}
                className="w-full px-4 py-3 pr-14 text-lg font-bold text-slate-900 rounded-lg border border-slate-300 bg-white focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/30 outline-none transition"
                placeholder="0"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                ج.م
              </span>
            </div>
            <span className="block text-xs text-slate-500 mt-1">
              بنخصم التأمينات تلقائياً قبل حساب الضريبة
            </span>
          </label>
        </div>
      </div>

      {/* Results */}
      <div className="p-6 md:p-8">
        <h2 className="text-lg font-black text-slate-900 mb-5">الضريبة المستحقة</h2>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100 border-2 border-rose-200">
            <div className="text-sm font-bold text-rose-700 mb-1">ضريبة شهرية</div>
            <div className="text-3xl md:text-4xl font-black text-rose-900">
              {formatEGP(result.monthlyTax)}
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200">
            <div className="text-sm font-bold text-slate-600 mb-1">
              ضريبة سنوية · النسبة الفعلية
            </div>
            <div className="text-2xl md:text-3xl font-black text-slate-900">
              {formatEGP(result.annualTax)}
            </div>
            <div className="text-sm text-slate-500 mt-1">
              {result.effectiveRate.toFixed(1)}% من الراتب
            </div>
          </div>
        </div>

        {/* Pre-tax breakdown */}
        <div className="rounded-xl border border-slate-200 overflow-hidden mb-5">
          <table className="w-full text-sm">
            <tbody>
              <Row label="الراتب الشهري الإجمالي" value={result.gross} />
              <Row label="− التأمينات الاجتماعية (11%)" value={result.insurance} muted />
              <Row label="= الدخل الشهري الخاضع للضريبة" value={result.monthlyTaxable} />
              <Row label="الدخل السنوي الخاضع" value={result.annualTaxable} muted />
              <Row label="− الإعفاء الشخصي السنوي" value={PERSONAL_EXEMPTION} muted />
            </tbody>
          </table>
        </div>

        {/* Bracket breakdown */}
        <div className="text-sm font-bold text-slate-900 mb-2">
          تفصيل الضريبة على الشرائح (سنوي)
        </div>
        {result.slices.length === 0 ? (
          <div className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
            ✅ الدخل ده معفى بالكامل من ضريبة كسب العمل (تحت حد الإعفاء + الشريحة الصفرية).
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="p-2 text-right font-bold">الشريحة</th>
                  <th className="p-2 text-center font-bold">النسبة</th>
                  <th className="p-2 text-end font-bold">الضريبة</th>
                </tr>
              </thead>
              <tbody>
                {result.slices.map((s, i) => (
                  <tr key={i} className="border-t border-slate-200">
                    <td className="p-2 text-slate-700">{s.label}</td>
                    <td className="p-2 text-center font-bold text-slate-700">
                      {(s.rate * 100).toFixed(s.rate * 100 % 1 === 0 ? 0 : 1)}%
                    </td>
                    <td className="p-2 text-end font-bold text-rose-700">
                      {formatEGP(s.tax)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <tr
      className={`border-b border-slate-200 last:border-b-0 ${
        muted ? "bg-slate-50" : "bg-white"
      }`}
    >
      <td className={`px-4 py-2.5 ${muted ? "text-slate-600" : "text-slate-800 font-bold"}`}>
        {label}
      </td>
      <td className="px-4 py-2.5 text-end whitespace-nowrap font-bold text-slate-900">
        {formatEGP(value)}
      </td>
    </tr>
  );
}
