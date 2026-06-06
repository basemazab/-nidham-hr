// ============================================================================
// payslip-display — shared registry of optional payslip / report line-items
// ============================================================================
//
// HR can hide any of these lines from the payslip AND the on-screen period
// report (e.g. a cash-paying SMB that doesn't deduct tax/insurance doesn't
// want zero-lines cluttering the employee's payslip).
//
// IMPORTANT: hiding is a DISPLAY choice only. Stored totals
// (gross_salary, total_deductions, net_salary) are always computed from the
// FULL data, so the payslip's "إجمالي" rows stay mathematically correct even
// when individual detail lines are hidden. The accountant export
// (xlsx/csv/sif) is NEVER filtered — it always carries every column.
//
// `basic_salary` is intentionally NOT hideable — it's the spine of the slip.

export type PayslipItemKey =
  | "housing_allowance"
  | "transport_allowance"
  | "other_allowances"
  | "incentive_allowance"
  | "bonuses"
  | "overtime"
  | "eos_gratuity"
  | "absence_deduction"
  | "tardiness_deduction"
  | "social_insurance"
  | "income_tax"
  | "loan_deduction"
  | "other_deductions";

export type PayslipItem = {
  key: PayslipItemKey;
  label: string;
  group: "earning" | "deduction";
  hint: string;
};

// Order here drives the order of checkboxes in the settings UI.
export const PAYSLIP_ITEMS: PayslipItem[] = [
  { key: "housing_allowance", label: "بدل سكن", group: "earning", hint: "بدل السكن الشهري" },
  { key: "transport_allowance", label: "بدل انتقال", group: "earning", hint: "بدل المواصلات اليومية" },
  { key: "other_allowances", label: "بدلات أخرى", group: "earning", hint: "موبايل، أدوات، طبيعة عمل، إلخ" },
  { key: "incentive_allowance", label: "حافز", group: "earning", hint: "حافز إنتاج / أداء شهري" },
  { key: "bonuses", label: "مكافأة", group: "earning", hint: "مكافأة استثنائية — بيظهر سببها لو متكتب" },
  { key: "overtime", label: "الأوفر تايم (الإضافي)", group: "earning", hint: "ساعات العمل الإضافية × المعدل القانوني" },
  { key: "eos_gratuity", label: "مكافأة نهاية الخدمة", group: "earning", hint: "مادة 122 — بتظهر عند إنهاء الخدمة فقط" },
  { key: "absence_deduction", label: "خصم الغياب", group: "deduction", hint: "غياب بدون إذن" },
  { key: "tardiness_deduction", label: "خصم التأخير والانصراف المبكر", group: "deduction", hint: "تأخير عن المواعيد / انصراف مبكر" },
  { key: "social_insurance", label: "التأمينات الاجتماعية", group: "deduction", hint: "حصة الموظف — قانون 148/2019" },
  { key: "income_tax", label: "ضريبة الدخل", group: "deduction", hint: "شرائح الضريبة المصرية" },
  { key: "loan_deduction", label: "قسط السلفة", group: "deduction", hint: "قسط الشهر من السلف النشطة" },
  { key: "other_deductions", label: "جزاءات وخصومات أخرى", group: "deduction", hint: "إنذارات / مخالفات / تلف عهدة" },
];

const VALID_KEYS = new Set<string>(PAYSLIP_ITEMS.map((i) => i.key));

/** Coerce a raw DB value (text[] | null | unknown) into a clean Set of keys. */
export function toHiddenSet(raw: unknown): Set<PayslipItemKey> {
  const out = new Set<PayslipItemKey>();
  if (Array.isArray(raw)) {
    for (const v of raw) {
      if (typeof v === "string" && VALID_KEYS.has(v)) out.add(v as PayslipItemKey);
    }
  }
  return out;
}

/** Filter a submitted form list down to the known, valid keys (drops junk). */
export function sanitizeHiddenKeys(values: string[]): PayslipItemKey[] {
  const seen = new Set<PayslipItemKey>();
  for (const v of values) {
    if (VALID_KEYS.has(v)) seen.add(v as PayslipItemKey);
  }
  return Array.from(seen);
}
