// ============================================================================
// Nidham Strategic AI Engine — Core Logic (V2)
// ============================================================================

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
}

/**
 * 1. Advanced Churn Prediction
 * Uses weighted signals to predict attrition risk.
 */
export function predictEmployeeChurn(s: EmployeeSignals): RetentionInsight | null {
  const signals: string[] = [];
  let riskProbability = 0;

  if (s.attendanceRateDelta < -0.05) {
    const severity = Math.abs(s.attendanceRateDelta) * 100;
    signals.push(`تراجع ملحوظ في الحضور (${severity.toFixed(1)}%) قد يشير لعدم الرضا.`);
    riskProbability += severity * 2.5;
  }

  if (s.tardinessMinutesAvgPerDay > 30) {
    signals.push(`نمط تأخير متكرر (${Math.round(s.tardinessMinutesAvgPerDay)} د/يوم).`);
    riskProbability += 20;
  }

  if (s.recentLeaveDays > 4) {
    signals.push(`استهلاك مكثف للإجازات مؤخراً (${s.recentLeaveDays} أيام).`);
    riskProbability += 15;
  }

  if (s.monthsSinceLastRaise > 12) {
    signals.push(`تجاوز 12 شهر بدون مراجعة للراتب.`);
    riskProbability += 25;
  }

  riskProbability = Math.min(98, riskProbability);

  if (riskProbability < 45) return null;

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
      "الإجراء المقترح: جلسة استماع خاصة (Stay Interview) لتقييم الوضع."
    ],
    suggestedAmount: null,
    metadata: {
      isAIPrediction: true,
      probability: riskProbability,
    }
  };
}

/**
 * 2. Replacement Cost ROI
 */
export function calculateReplacementCost(s: EmployeeSignals): ReplacementCostResult {
  const monthlySalary = s.basicSalary;
  const recruitmentCost = monthlySalary * 1.8; // Updated for 2026 market rates
  const trainingCost = monthlySalary * 1.2;
  const productivityLoss = monthlySalary * 2.5;
  
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
      `فقدان الإنتاجية: ${productivityLoss.toLocaleString("ar-EG")} ج (فترة التعلم)`
    ]
  };
}

/**
 * 3. Strategic Workforce Expansion Simulator
 * Simulates the cost of hiring new talent in specific regions/roles.
 */
export function simulateExpansion(
  roleType: "tech" | "sales" | "ops", 
  count: number, 
  region: "Egypt" | "KSA" | "UAE" = "Egypt"
): ExpansionSimulationResult {
  const avgSalaries = {
    Egypt: { tech: 45000, sales: 25000, ops: 20000 },
    KSA: { tech: 15000, sales: 8000, ops: 6000 }, // in SAR
    UAE: { tech: 18000, sales: 10000, ops: 7000 }, // in AED
  };

  const baseSalary = avgSalaries[region][roleType];
  const monthlyPayroll = baseSalary * count;
  const annualCost = monthlyPayroll * 12 * 1.25; // Including overheads

  const recommendations = [
    `يُنصح ببدء التوظيف قبل موعد التوسع بـ 45 يوم.`,
    `التكلفة تشمل التأمينات والضرائب المقدرة بـ 25% إضافية.`,
    region === "KSA" ? "يجب مراعاة نسب التوطين (نطاقات) لهذا التوسع." : "يُفضل مراجعة شرائح الضرائب الجديدة لعام 2026."
  ];

  return {
    scenarioName: `توسع ${region} - ${roleType}`,
    totalNewHires: count,
    estimatedMonthlyPayrollIncrease: monthlyPayroll,
    estimatedAnnualCost: annualCost,
    socialInsuranceImpact: monthlyPayroll * 0.11,
    taxImpact: monthlyPayroll * 0.15,
    onboardingComplexity: count > 5 ? "High" : "Medium",
    recommendations
  };
}

/**
 * 4. Advanced Strategic Legal Auditor (MENA Region)
 */
export const ARAB_REGION_LAWS_2026 = {
  EGYPT: {
    MINIMUM_WAGE: 8000,
    EFFECTIVE_DATE: "2026-07-01",
    ADVICE: "يجب تحديث عقود الموظفين الحالية لتتوافق مع الزيادة لتجنب الغرامات العمالية."
  },
  KSA: {
    MINIMUM_WAGE: 4000, // SAR
    EFFECTIVE_DATE: "2026-01-01",
    ADVICE: "تأكد من تحديث بيانات الموظفين في منصة قوى (Qiwa) لضمان الالتزام بنظام حماية الأجور."
  }
};

export function auditStrategicCompliance(employees: { id: string; basicSalary: number }[]): LegalComplianceUpdate[] {
  const updates: LegalComplianceUpdate[] = [];
  
  // Egypt Minimum Wage Check
  const underpaidEgypt = employees.filter(e => e.basicSalary < ARAB_REGION_LAWS_2026.EGYPT.MINIMUM_WAGE);
  if (underpaidEgypt.length > 0) {
    updates.push({
      type: "minimum_wage",
      title: "تحديث الحد الأدنى للأجور (مصر 2026)",
      currentValue: 7000,
      newValue: ARAB_REGION_LAWS_2026.EGYPT.MINIMUM_WAGE,
      effectiveDate: ARAB_REGION_LAWS_2026.EGYPT.EFFECTIVE_DATE,
      description: `رفع الحد الأدنى للأجور رسمياً إلى ${ARAB_REGION_LAWS_2026.EGYPT.MINIMUM_WAGE} ج.`,
      impactedEmployeesCount: underpaidEgypt.length,
      strategicAdvice: ARAB_REGION_LAWS_2026.EGYPT.ADVICE
    });
  }

  // General 2026 Tax Update
  updates.push({
    type: "tax_law",
    title: "تحديث شرائح الضرائب 2026",
    currentValue: "نظام 2025",
    newValue: "نظام 2026 المطور",
    effectiveDate: "2026-01-01",
    description: "تعديلات في الشرائح الضريبية العليا لدعم ذوي الدخل المحدود.",
    impactedEmployeesCount: employees.length,
    strategicAdvice: "سيقوم نيدهام بتعديل الحسابات تلقائياً، ولكن يُنصح بإبلاغ الموظفين بالتغيير في صافي الراتب."
  });

  return updates;
}
