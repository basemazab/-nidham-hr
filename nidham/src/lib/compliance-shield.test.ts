import { describe, it, expect } from "vitest";
import { scanCompliance, type ComplianceEmployee } from "./compliance-shield";

const TODAY = new Date("2026-06-03");

function emp(over: Partial<ComplianceEmployee>): ComplianceEmployee {
  return {
    id: Math.random().toString(36).slice(2),
    full_name: "موظف",
    status: "active",
    hire_date: "2020-01-01",
    national_id: "29001011234567",
    social_insurance_number: "123456",
    basic_salary: 6000,
    ...over,
  };
}

describe("scanCompliance", () => {
  it("does NOT raise an insurance fine when filing is disabled (the SMB default)", () => {
    const res = scanCompliance({
      employees: [emp({ social_insurance_number: null })],
      company: { social_insurance_enabled: false, income_tax_enabled: false },
      annualBalances: [],
      today: TODAY,
    });
    expect(res.risks.find((r) => r.id === "insurance-late")).toBeUndefined();
    // Instead a soft advisory, with no EGP fine attached.
    const advisory = res.risks.find((r) => r.id === "insurance-disabled");
    expect(advisory?.severity).toBe("low");
    expect(advisory?.estFine).toBeNull();
  });

  it("raises a HIGH insurance risk when filing is ON but a long-tenured employee has no SI number", () => {
    const res = scanCompliance({
      employees: [
        emp({ social_insurance_number: null, hire_date: "2024-01-01" }),
      ],
      company: { social_insurance_enabled: true, income_tax_enabled: false },
      annualBalances: [],
      today: TODAY,
    });
    const risk = res.risks.find((r) => r.id === "insurance-late");
    expect(risk).toBeDefined();
    expect(risk?.severity).toBe("high");
    expect(risk?.estFine).toBeGreaterThan(0);
    expect(res.exposureEGP).toBeGreaterThan(0);
  });

  it("does not flag a freshly-hired employee (within the 7-day window)", () => {
    const res = scanCompliance({
      employees: [
        emp({ social_insurance_number: null, hire_date: "2026-06-01" }),
      ],
      company: { social_insurance_enabled: true, income_tax_enabled: false },
      annualBalances: [],
      today: TODAY,
    });
    expect(res.risks.find((r) => r.id === "insurance-late")).toBeUndefined();
  });

  it("triggers harassment-policy + safety obligations at 50+ active employees", () => {
    const employees = Array.from({ length: 50 }, () => emp({}));
    const res = scanCompliance({
      employees,
      company: { social_insurance_enabled: false, income_tax_enabled: false },
      annualBalances: [],
      today: TODAY,
    });
    expect(res.risks.find((r) => r.id === "harassment-policy")).toBeDefined();
    expect(res.risks.find((r) => r.id === "safety-committee")).toBeDefined();
  });

  it("flags missing national_id as a data-completeness risk", () => {
    const res = scanCompliance({
      employees: [emp({ national_id: null })],
      company: { social_insurance_enabled: false, income_tax_enabled: false },
      annualBalances: [],
      today: TODAY,
    });
    expect(res.risks.find((r) => r.id === "missing-national-id")).toBeDefined();
  });

  it("computes annual-leave liability from remaining days × daily wage", () => {
    const e = emp({ basic_salary: 9000 }); // daily ≈ 300
    const res = scanCompliance({
      employees: [e],
      company: { social_insurance_enabled: false, income_tax_enabled: false },
      annualBalances: [{ employee_id: e.id, entitled_days: 21, used_days: 1 }],
      today: TODAY,
    });
    const risk = res.risks.find((r) => r.id === "leave-liability");
    expect(risk).toBeDefined();
    // 20 remaining × (9000/30=300)/day = ~6000 → large balance ⇒ medium.
    expect(risk?.severity).toBe("medium");
  });

  it("a clean small company has no high-severity risks and a top-tier index", () => {
    const res = scanCompliance({
      employees: [emp({}), emp({})],
      company: { social_insurance_enabled: false, income_tax_enabled: false },
      annualBalances: [],
      today: TODAY,
    });
    expect(res.highCount).toBe(0);
    // Only a single low advisory (insurance disabled) → score stays ≥ 90.
    expect(res.score).toBeGreaterThanOrEqual(90);
    expect(res.grade.label).toBe("ممتاز");
  });

  it("flags employees whose 3-month probation is about to end", () => {
    // 80 days before 2026-06-03 ≈ 2026-03-15 → inside the 75-90 window.
    const res = scanCompliance({
      employees: [emp({ hire_date: "2026-03-15" })],
      company: { social_insurance_enabled: false, income_tax_enabled: false },
      annualBalances: [],
      today: TODAY,
    });
    const risk = res.risks.find((r) => r.id === "probation-ending");
    expect(risk?.severity).toBe("medium");
  });

  it("does not flag probation for a long-tenured employee", () => {
    const res = scanCompliance({
      employees: [emp({ hire_date: "2020-01-01" })],
      company: { social_insurance_enabled: false, income_tax_enabled: false },
      annualBalances: [],
      today: TODAY,
    });
    expect(res.risks.find((r) => r.id === "probation-ending")).toBeUndefined();
  });

  it("flags expired and soon-to-expire documents", () => {
    const res = scanCompliance({
      employees: [emp({})],
      company: { social_insurance_enabled: false, income_tax_enabled: false },
      annualBalances: [],
      documents: [
        { name: "السجل التجاري", expiry_date: "2025-01-01" }, // expired
        { name: "البطاقة الضريبية", expiry_date: "2026-06-20", reminder_days: 30 }, // ~17 days → soon
        { name: "رخصة المصنع", expiry_date: "2027-01-01" }, // fine
      ],
      today: TODAY,
    });
    const expired = res.risks.find((r) => r.id === "documents-expired");
    const soon = res.risks.find((r) => r.id === "documents-expiring");
    expect(expired?.severity).toBe("high");
    expect(soon?.severity).toBe("medium");
  });

  it("computes a compliance index that drops with risk severity", () => {
    const employees = Array.from({ length: 50 }, () => emp({}));
    const res = scanCompliance({
      employees,
      company: { social_insurance_enabled: false, income_tax_enabled: false },
      annualBalances: [],
      today: TODAY,
    });
    // 50+ headcount adds a high (harassment) + medium (safety) + lows.
    expect(res.score).toBeLessThan(75);
    expect(res.score).toBeGreaterThanOrEqual(0);
    expect(["يحتاج إجراء", "خطر"]).toContain(res.grade.label);
  });
});
