// ============================================================================
// Compliance Shield — proactive Egyptian HR fine-prevention engine
// ============================================================================
//
// Scans a company's REAL HR data against Egyptian labour / insurance / tax
// obligations and surfaces risks BEFORE they become fines — each with a
// quantified EGP exposure estimate and the legal reference. This is the
// product's headline differentiator: it turns "HR software" into "insurance
// against government fines", which is the #1 buying driver in the market.
//
// DESIGN NOTES (accuracy is non-negotiable — we must never cry wolf):
//   • Social insurance + income tax are OPT-IN per company (mig 023:
//     social_insurance_enabled / income_tax_enabled default false — most
//     Egyptian SMBs don't file). So we only raise an insurance FINE risk
//     when the company has switched filing ON but data is missing. When it's
//     OFF we show a soft, non-fine advisory instead.
//   • We never claim a fine was incurred — estimates are explicitly تقديري
//     and framed as "exposure if ignored".
//   • Every check runs on columns we KNOW exist (employees: status, hire_date,
//     national_id, social_insurance_number, basic_salary; leave_balances:
//     entitled_days, used_days). No termination_date (not a column).
// ============================================================================

export type Severity = "high" | "medium" | "low";

export type ComplianceRisk = {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  legalRef: string;
  /** Estimated EGP exposure if ignored, or null when not quantifiable. */
  estFine: number | null;
  actionLabel: string;
  actionHref: string;
};

export type ComplianceEmployee = {
  id: string;
  full_name: string | null;
  status: "active" | "on_leave" | "terminated";
  hire_date: string | null;
  national_id: string | null;
  social_insurance_number: string | null;
  basic_salary: number | null;
};

export type ComplianceCompany = {
  social_insurance_enabled: boolean | null;
  income_tax_enabled: boolean | null;
};

export type LeaveBalanceRow = {
  employee_id: string;
  entitled_days: number;
  used_days: number;
};

export type ComplianceScanInput = {
  employees: ComplianceEmployee[];
  company: ComplianceCompany;
  annualBalances: LeaveBalanceRow[];
  /** today, injected so the function stays pure/testable */
  today: Date;
};

export type ComplianceScanResult = {
  risks: ComplianceRisk[];
  /** Sum of quantifiable estFine values — the headline "exposure" number. */
  exposureEGP: number;
  /** How many distinct obligations were checked (for the "we monitor N" line). */
  monitoredCount: number;
  highCount: number;
  mediumCount: number;
};

const MONITORED_OBLIGATIONS = 7;

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

export function scanCompliance(input: ComplianceScanInput): ComplianceScanResult {
  const { employees, company, annualBalances, today } = input;
  const risks: ComplianceRisk[] = [];

  const active = employees.filter((e) => e.status === "active");
  const activeCount = active.length;

  // ── 1. Data completeness — missing national_id blocks insurance/contracts ──
  const noNationalId = active.filter(
    (e) => !e.national_id || e.national_id.trim() === "",
  );
  if (noNationalId.length > 0) {
    risks.push({
      id: "missing-national-id",
      severity: "medium",
      title: `${noNationalId.length} موظف بدون رقم قومي`,
      detail:
        "بدون الرقم القومي مش هتقدر تسجّلهم في التأمينات أو تعمل عقود رسمية أو نماذج حكومية. أكمل بياناتهم.",
      legalRef: "متطلب أساسي للتسجيل الحكومي",
      estFine: null,
      actionLabel: "أكمل بيانات الموظفين",
      actionHref: "/dashboard/employees",
    });
  }

  // ── 2. Social insurance ────────────────────────────────────────────────
  if (company.social_insurance_enabled) {
    // Filing is ON → missing SI number on someone hired > 7 days ago is a
    // real late-registration exposure (نموذج 1 خلال 7 أيام، غرامة ~100 ج/يوم).
    const lateInsured = active.filter((e) => {
      if (e.social_insurance_number && e.social_insurance_number.trim() !== "")
        return false;
      if (!e.hire_date) return true; // no hire date + no SI number → risky
      return daysBetween(today, new Date(e.hire_date)) > 7;
    });
    if (lateInsured.length > 0) {
      // Conservative estimate: 100 ج/يوم × an assumed 30-day exposure window,
      // per employee. Clearly تقديري in the UI copy.
      const est = lateInsured.length * 100 * 30;
      risks.push({
        id: "insurance-late",
        severity: "high",
        title: `${lateInsured.length} موظف غير مسجّل في التأمينات`,
        detail:
          "شركتك مفعّلة التأمينات، لكن دول لسه ما اتسجلوش (نموذج 1 لازم خلال 7 أيام من التعيين). كل يوم تأخير غرامة.",
        legalRef: "قانون التأمينات 148/2019 — نموذج 1",
        estFine: est,
        actionLabel: "سجّلهم الآن",
        actionHref: "/dashboard/employees",
      });
    }
  } else {
    // Filing is OFF — many SMBs run this way, so this is an advisory, NOT a
    // fine. We surface it honestly so the owner makes an informed choice.
    if (activeCount > 0) {
      risks.push({
        id: "insurance-disabled",
        severity: "low",
        title: "التأمينات الاجتماعية غير مفعّلة",
        detail:
          "شركتك مش بتسجّل التأمينات حالياً. لو نشاطك أو حجمك بيلزمك قانوناً، ده تعرّض كبير لو حصل تفتيش. راجع وضعك وفعّلها لو لازم.",
        legalRef: "قانون التأمينات 148/2019",
        estFine: null,
        actionLabel: "إعدادات المرتبات",
        actionHref: "/dashboard/payroll",
      });
    }
  }

  // ── 3. End-of-service settlement for terminated employees ───────────────
  const terminated = employees.filter((e) => e.status === "terminated");
  if (terminated.length > 0) {
    risks.push({
      id: "eos-settlement",
      severity: "medium",
      title: `${terminated.length} موظف مفصول — تأكد من تسوية المستحقات`,
      detail:
        "الموظف المفصول لازم ياخد مكافأة نهاية الخدمة + مخالصة موقّعة. عدم التسوية الموثّقة = خطر قضية عمالية بتكلّف أضعاف المبلغ.",
      legalRef: "قانون العمل 12/2003 — المادة 122",
      estFine: null,
      actionLabel: "احسب نهاية الخدمة",
      actionHref: "/dashboard/eos-calculator",
    });
  }

  // ── 4. Headcount-triggered obligations (very reliable — count-based) ─────
  if (activeCount >= 50) {
    risks.push({
      id: "harassment-policy",
      severity: "high",
      title: "سياسة منع التحرش إلزامية (50+ موظف)",
      detail:
        "وصلت لـ 50 موظف فأكثر — القانون بيلزمك بسياسة منع تحرش مكتوبة ومعلنة + لجنة شكاوى. غيابها مخالفة.",
      legalRef: "قانون 168/2023",
      estFine: 10000,
      actionLabel: "دليل الامتثال",
      actionHref: "/dashboard/compliance",
    });
    risks.push({
      id: "safety-committee",
      severity: "medium",
      title: "لجنة سلامة ومسؤول سلامة (50+ عامل)",
      detail:
        "الشركات من 50 عامل لازم لجنة سلامة + مسؤول سلامة معتمد + اجتماعات شهرية موثّقة.",
      legalRef: "قانون العمل 12/2003 — السلامة المهنية",
      estFine: 5000,
      actionLabel: "دليل الامتثال",
      actionHref: "/dashboard/compliance",
    });
  }
  if (activeCount >= 10) {
    risks.push({
      id: "penalties-bylaw",
      severity: "low",
      title: "لائحة جزاءات معتمدة",
      detail:
        "الشركات من 10 عمال يُفضّل (وغالباً يُلزم) أن يكون لها لائحة جزاءات معتمدة من مكتب العمل — أساس قانوني لأي خصم أو إنذار.",
      legalRef: "قانون العمل 12/2003",
      estFine: null,
      actionLabel: "دليل الامتثال",
      actionHref: "/dashboard/compliance",
    });
  }

  // ── 5. Annual-leave liability + un-granted leave risk ────────────────────
  const balByEmp = new Map<string, LeaveBalanceRow>();
  for (const b of annualBalances) balByEmp.set(b.employee_id, b);

  let liabilityEGP = 0;
  let atRiskCount = 0;
  for (const e of active) {
    const bal = balByEmp.get(e.id);
    if (!bal) continue;
    const remaining = Math.max(0, bal.entitled_days - bal.used_days);
    if (remaining <= 0) continue;
    // Daily wage ≈ basic_salary / 30. Liability = unpaid earned leave value.
    const daily = (e.basic_salary ?? 0) / 30;
    liabilityEGP += remaining * daily;
    if (remaining >= 15) atRiskCount += 1; // large accrued balance
  }
  liabilityEGP = Math.round(liabilityEGP);
  if (liabilityEGP > 0) {
    risks.push({
      id: "leave-liability",
      severity: atRiskCount > 0 ? "medium" : "low",
      title: `التزام إجازات متراكم ≈ ${liabilityEGP.toLocaleString("ar-EG")} ج`,
      detail:
        (atRiskCount > 0
          ? `${atRiskCount} موظف عندهم رصيد إجازات كبير. `
          : "") +
        "رصيد الإجازات غير المستخدم التزام مالي على الشركة، وعدم منح الإجازة المستحقة مخالفة (تعويض ضعف الأجر). نظّم جدول الإجازات.",
      legalRef: "قانون العمل 12/2003 — المواد 47-50",
      estFine: null,
      actionLabel: "تقويم الإجازات",
      actionHref: "/dashboard/team-calendar",
    });
  }

  // ── Aggregate ────────────────────────────────────────────────────────────
  const exposureEGP = risks.reduce((sum, r) => sum + (r.estFine ?? 0), 0);
  const order: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
  risks.sort((a, b) => order[a.severity] - order[b.severity]);

  return {
    risks,
    exposureEGP,
    monitoredCount: MONITORED_OBLIGATIONS,
    highCount: risks.filter((r) => r.severity === "high").length,
    mediumCount: risks.filter((r) => r.severity === "medium").length,
  };
}
