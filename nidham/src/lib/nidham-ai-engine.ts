import { EmployeeSignals, RetentionInsight } from "./retention";

export interface ReplacementCostResult {
  employeeId: string;
  recruitmentCost: number;
  trainingCost: number;
  productivityLoss: number;
  totalCost: number;
  currency: string;
  reasoning: string[];
}

export interface LegalComplianceUpdate {
  type: "minimum_wage" | "tax_law" | "labor_law_change" | "saudization_nitaqat";
  title: string;
  currentValue: string | number;
  newValue: string | number;
  effectiveDate: string;
  description: string;
  impactedEmployeesCount: number;
  strategicAdvice: string;
}

export interface ExpansionSimulationResult {
  scenarioName: string;
  totalNewHires: number;
  estimatedMonthlyPayrollIncrease: number;
  estimatedAnnualCost: number;
  socialInsuranceImpact: number;
  taxImpact: number;
  onboardingComplexity: "Low" | "Medium" | "High";
  recommendations: string[];
  currency: "EGP" | "SAR" | "AED";
}

const CHURN = {
  ATTENDANCE_WEIGHT: 2.5,
  TARDINESS_PENALTY: 20,
  LEAVE_SPIKE_PENALTY: 15,
  STALE_RAISE_PENALTY: 25,
  MAX_SCORE: 98,
  MIN_THRESHOLD: 45,
};

const REPLACEMENT = {
  RECRUITMENT_MULTIPLIER: 1.8,
  TRAINING_MULTIPLIER: 1.2,
  PRODUCTIVITY_MULTIPLIER: 2.5,
};

const AVG_SALARIES: Record<string, Record<string, number>> = {
  Egypt: { tech: 45000, sales: 25000, ops: 20000 },
  KSA: { tech: 15000, sales: 8000, ops: 6000 },
  UAE: { tech: 18000, sales: 10000, ops: 7000 },
};

const CURRENCY: Record<string, string> = {
  Egypt: "EGP",
  KSA: "SAR",
  UAE: "AED",
};

export function predictEmployeeChurn(s: EmployeeSignals): RetentionInsight | null {
  if (!s || typeof s.basicSalary !== "number" || isNaN(s.basicSalary)) return null;

  const signals: string[] = [];
  let riskProbability = 0;

  if (s.attendanceRateDelta < -0.05) {
    const severity = Math.abs(s.attendanceRateDelta) * 100;
    signals.push(`تراجع ملحوظ في الحضور (${severity.toFixed(1)}%) قد يشير لعدم الرضا.`);
    riskProbability += severity * CHURN.ATTENDANCE_WEIGHT;
  }

  if (s.tardinessMinutesAvgPerDay > 30) {
    signals.push(`نمط تأخير متكرر (${Math.round(s.tardinessMinutesAvgPerDay)} د/يوم).`);
    riskProbability += CHURN.TARDINESS_PENALTY;
  }

  if (s.recentLeaveDays > 4) {
    signals.push(`استهلاك مكثف للإجازات مؤخراً (${s.recentLeaveDays} أيام).`);
    riskProbability += CHURN.LEAVE_SPIKE_PENALTY;
  }

  if (s.monthsSinceLastRaise > 12) {
    signals.push(`تجاوز 12 شهر بدون مراجعة للراتب.`);
    riskProbability += CHURN.STALE_RAISE_PENALTY;
  }

  riskProbability = Math.min(CHURN.MAX_SCORE, riskProbability);

  if (riskProbability < CHURN.MIN_THRESHOLD) return null;

  return {
    employeeId: s.id,
    employeeName: s.fullName,
    jobTitle: s.jobTitle,
    department: s.department,
    insightType: "flight_risk",
    score: riskProbability,
    reasoning: [
      `درجة الخطورة: ${Math.round(riskProbability)}%`,
      ...signals,
      "الإجراء المقترح: جلسة استماع خاصة (Stay Interview) لتقييم الوضع.",
    ],
    suggestedAmount: null,
    metadata: {
      isAIPrediction: true,
      probability: riskProbability,
    },
  };
}

export function calculateReplacementCost(s: EmployeeSignals): ReplacementCostResult {
  const monthlySalary = s.basicSalary;
  const recruitmentCost = monthlySalary * REPLACEMENT.RECRUITMENT_MULTIPLIER;
  const trainingCost = monthlySalary * REPLACEMENT.TRAINING_MULTIPLIER;
  const productivityLoss = monthlySalary * REPLACEMENT.PRODUCTIVITY_MULTIPLIER;
  const totalCost = recruitmentCost + trainingCost + productivityLoss;

  return {
    employeeId: s.id,
    recruitmentCost,
    trainingCost,
    productivityLoss,
    totalCost,
    currency: "EGP",
    reasoning: [
      `التوظيف: ${recruitmentCost.toLocaleString("ar-EG")} ج (إعلانات، تصفية، مقابلات)`,
      `التدريب: ${trainingCost.toLocaleString("ar-EG")} ج (وقت المشرفين والمواد التعليمية)`,
      `فقدان الإنتاجية: ${productivityLoss.toLocaleString("ar-EG")} ج (فترة التعلم)`,
    ],
  };
}

export function simulateExpansion(
  roleType: "tech" | "sales" | "ops",
  count: number,
  region: "Egypt" | "KSA" | "UAE" = "Egypt",
): ExpansionSimulationResult {
  const baseSalary = AVG_SALARIES[region][roleType];
  const monthlyPayroll = baseSalary * count;
  const annualCost = monthlyPayroll * 12 * 1.25;

  return {
    scenarioName: `توسع ${region} - ${roleType}`,
    totalNewHires: count,
    estimatedMonthlyPayrollIncrease: monthlyPayroll,
    estimatedAnnualCost: annualCost,
    socialInsuranceImpact: monthlyPayroll * 0.11,
    taxImpact: monthlyPayroll * 0.15,
    onboardingComplexity: count > 5 ? "High" : "Medium",
    currency: CURRENCY[region] as "EGP" | "SAR" | "AED",
    recommendations: [
      `يُنصح ببدء التوظيف قبل موعد التوسع بـ 45 يوم.`,
      `التكلفة تشمل التأمينات والضرائب المقدرة بـ 25% إضافية.`,
      region === "KSA"
        ? "يجب مراعاة نسب التوطين (نطاقات) لهذا التوسع."
        : "يُفضل مراجعة شرائح الضرائب الجديدة لعام 2026.",
    ],
  };
}

export const ARAB_REGION_LAWS_2026 = {
  EGYPT: {
    MINIMUM_WAGE: 8000,
    EFFECTIVE_DATE: "2026-07-01",
    ADVICE: "يجب تحديث عقود الموظفين الحالية لتتوافق مع الزيادة لتجنب الغرامات العمالية.",
  },
  KSA: {
    MINIMUM_WAGE: 4000,
    EFFECTIVE_DATE: "2026-01-01",
    ADVICE: "تأكد من تحديث بيانات الموظفين في منصة قوى (Qiwa) لضمان الالتزام بنظام حماية الأجور.",
  },
};

export function auditStrategicCompliance(employees: { id: string; basicSalary: number }[]): LegalComplianceUpdate[] {
  const updates: LegalComplianceUpdate[] = [];
  const now = new Date();

  const underpaidEgypt = employees.filter((e) => e.basicSalary < ARAB_REGION_LAWS_2026.EGYPT.MINIMUM_WAGE);
  if (underpaidEgypt.length > 0) {
    updates.push({
      type: "minimum_wage",
      title: "تحديث الحد الأدنى للأجور (مصر 2026)",
      currentValue: 7000,
      newValue: ARAB_REGION_LAWS_2026.EGYPT.MINIMUM_WAGE,
      effectiveDate: ARAB_REGION_LAWS_2026.EGYPT.EFFECTIVE_DATE,
      description: `رفع الحد الأدنى للأجور رسمياً إلى ${ARAB_REGION_LAWS_2026.EGYPT.MINIMUM_WAGE} ج.`,
      impactedEmployeesCount: underpaidEgypt.length,
      strategicAdvice: ARAB_REGION_LAWS_2026.EGYPT.ADVICE,
    });
  }

  // Only show tax update if we're within 90 days before or after the effective date
  const taxEffectiveDate = new Date("2026-01-01");
  const daysUntilTax = Math.abs(now.getTime() - taxEffectiveDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysUntilTax <= 90) {
    updates.push({
      type: "tax_law",
      title: "تحديث شرائح الضرائب 2026",
      currentValue: "نظام 2025",
      newValue: "نظام 2026 المطور",
      effectiveDate: "2026-01-01",
      description: "تعديلات في الشرائح الضريبية العليا لدعم ذوي الدخل المحدود.",
      impactedEmployeesCount: employees.length,
      strategicAdvice: "سيقوم نيدهام بتعديل الحسابات تلقائياً، ولكن يُنصح بإبلاغ الموظفين بالتغيير في صافي الراتب.",
    });
  }

  return updates;
}
