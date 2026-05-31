// ============================================================================
// Nidham AI Predictive Engine — Core Logic
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
  type: "minimum_wage" | "tax_law";
  title: string;
  currentValue: number;
  newValue: number;
  effectiveDate: string;
  description: string;
  impactedEmployeesCount: number;
}

/**
 * 1. Churn Prediction (Nidham AI Predictive Engine)
 * Enhances the basic flight risk logic with a more granular probability score.
 */
export function predictEmployeeChurn(s: EmployeeSignals): RetentionInsight | null {
  // Logic: Combining attendance trends, tenure, and salary staleness
  const signals: string[] = [];
  let riskProbability = 0;

  // Signal: Attendance Decline
  if (s.attendanceRateDelta < -0.05) {
    const severity = Math.abs(s.attendanceRateDelta) * 100;
    signals.push(`تراجع في نسبة الحضور بمعدل ${severity.toFixed(1)}%`);
    riskProbability += severity * 2; // Weight: 2x delta
  }

  // Signal: High Tardiness
  if (s.tardinessMinutesAvgPerDay > 30) {
    signals.push(`متوسط تأخير يومي ${Math.round(s.tardinessMinutesAvgPerDay)} دقيقة`);
    riskProbability += 15;
  }

  // Signal: Leave Spikes
  if (s.recentLeaveDays > 3) {
    signals.push(`زيادة في الإجازات المفاجئة (${s.recentLeaveDays} أيام مؤخراً)`);
    riskProbability += 10;
  }

  // Signal: Salary Staleness
  if (s.monthsSinceLastRaise > 18) {
    signals.push(`لم يحصل على زيادة منذ ${Math.floor(s.monthsSinceLastRaise)} شهر`);
    riskProbability += 20;
  }

  // Normalize probability to 0-100
  riskProbability = Math.min(95, riskProbability);

  if (riskProbability < 40) return null;

  return {
    employeeId: s.id,
    employeeName: s.fullName,
    jobTitle: s.jobTitle,
    department: s.department,
    insightType: "flight_risk",
    score: riskProbability,
    reasoning: [
      `احتمالية ترك العمل: ${Math.round(riskProbability)}%`,
      ...signals,
      "توصية: يفضل إجراء مقابلة استباقية لفهم أسباب التراجع."
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
 * Calculates the financial impact of losing an employee.
 */
export function calculateReplacementCost(s: EmployeeSignals): ReplacementCostResult {
  const monthlySalary = s.basicSalary;
  
  // Egyptian Market Estimates:
  // Recruitment: ~1.5x monthly salary (Ads, HR time, interviews)
  const recruitmentCost = monthlySalary * 1.5;
  
  // Training: ~1x monthly salary (Onboarding, shadow period)
  const trainingCost = monthlySalary * 1.0;
  
  // Productivity Loss: ~2x monthly salary (Gap period + new hire learning curve)
  const productivityLoss = monthlySalary * 2.0;
  
  const totalCost = recruitmentCost + trainingCost + productivityLoss;

  return {
    employeeId: s.id,
    recruitmentCost,
    trainingCost,
    productivityLoss,
    totalCost,
    currency: "EGP",
    reasoning: [
      `تكلفة التوظيف البديل: ${recruitmentCost.toLocaleString("ar-EG")} ج (إعلانات ومقابلات)`,
      `تكلفة التدريب والتهيئة: ${trainingCost.toLocaleString("ar-EG")} ج`,
      `خسارة الإنتاجية المتوقعة: ${productivityLoss.toLocaleString("ar-EG")} ج (فترة الفراغ ومنحنى التعلم)`
    ]
  };
}

/**
 * 3. Auto-Compliance Auditor (Egypt 2026)
 * Checks for upcoming legal changes and their impact.
 */
export const EGYPT_2026_LAWS = {
  MINIMUM_WAGE: 8000, // EGP (Effective July 2026)
  PERSONAL_EXEMPTION: 20000, // EGP (Annual)
  EFFECTIVE_DATE: "2026-07-01"
};

export function auditLegalCompliance(employees: { id: string; basicSalary: number }[]): LegalComplianceUpdate[] {
  const updates: LegalComplianceUpdate[] = [];
  
  // Check Minimum Wage
  const underpaid = employees.filter(e => e.basicSalary < EGYPT_2026_LAWS.MINIMUM_WAGE);
  if (underpaid.length > 0) {
    updates.push({
      type: "minimum_wage",
      title: "تعديل الحد الأدنى للأجور 2026",
      currentValue: 7000,
      newValue: EGYPT_2026_LAWS.MINIMUM_WAGE,
      effectiveDate: EGYPT_2026_LAWS.EFFECTIVE_DATE,
      description: `تم الإعلان عن رفع الحد الأدنى للأجور إلى ${EGYPT_2026_LAWS.MINIMUM_WAGE} ج بدءاً من يوليو 2026.`,
      impactedEmployeesCount: underpaid.length
    });
  }

  // Personal Exemption Update
  updates.push({
    type: "tax_law",
    title: "تحديث حد الإعفاء الشخصي",
    currentValue: 15000,
    newValue: EGYPT_2026_LAWS.PERSONAL_EXEMPTION,
    effectiveDate: "2026-01-01",
    description: "رفع حد الإعفاء الشخصي السنوي للموظفين لتقليل العبء الضريبي.",
    impactedEmployeesCount: employees.length
  });

  return updates;
}
