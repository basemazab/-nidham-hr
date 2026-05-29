from datetime import datetime, date
from dateutil.relativedelta import relativedelta


def calculate_end_of_service(
    start_date: str,
    end_date: str,
    total_salary: float,
    contract_type: str = "unlimited",
    reason: str = "resignation",
) -> dict:
    start = datetime.strptime(start_date, "%Y-%m-%d").date()
    end = datetime.strptime(end_date, "%Y-%m-%d").date()
    delta = relativedelta(end, start)
    years = delta.years + delta.months / 12.0

    if years <= 5:
        reward = years * total_salary * 0.5
    else:
        reward = 5 * total_salary * 0.5 + (years - 5) * total_salary * 1.0

    extra = 0.0
    if reason == "arbitrary_dismissal":
        extra = reward * 0.5
        reward += extra

    breakdown = []
    if years <= 5:
        breakdown.append(f"أول 5 سنوات: {years:.1f} × {total_salary:.0f} × 0.5 = {years * total_salary * 0.5:.0f} جنيه")
    else:
        breakdown.append(f"أول 5 سنوات: 5 × {total_salary:.0f} × 0.5 = {5 * total_salary * 0.5:.0f} جنيه")
        breakdown.append(f"بعد 5 سنوات: {years - 5:.1f} × {total_salary:.0f} × 1.0 = {(years - 5) * total_salary:.1f} جنيه")

    if extra > 0:
        breakdown.append(f"تعويض فصل تعسفي: {extra:.0f} جنيه")

    return {
        "years_of_service": round(years, 1),
        "total_salary": total_salary,
        "reward": round(reward, 2),
        "breakdown": breakdown,
        "legal_reference": "المادة 122 من قانون العمل رقم 12 لسنة 2003",
        "contract_type": contract_type,
        "reason": reason,
    }


def calculate_insurance(
    gross_salary: float,
    employment_type: str = "permanent",
) -> dict:
    min_base = 2300
    max_base = 14500

    insurance_base = max(min_base, min(max_base, gross_salary))

    employee_pension = insurance_base * 0.09
    employee_unemployment = insurance_base * 0.01
    employee_medical = insurance_base * 0.01
    employee_total = employee_pension + employee_unemployment + employee_medical

    employer_pension = insurance_base * 0.1575
    employer_unemployment = insurance_base * 0.02
    employer_medical = insurance_base * 0.01
    employer_injury = insurance_base * 0.015
    employer_total = employer_pension + employer_unemployment + employer_medical + employer_injury

    total_monthly = employee_total + employer_total

    return {
        "gross_salary": gross_salary,
        "insurance_base": insurance_base,
        "base_limits": {"minimum": min_base, "maximum": max_base},
        "employee_deductions": {
            "pension_9": round(employee_pension, 2),
            "unemployment_1": round(employee_unemployment, 2),
            "medical_1": round(employee_medical, 2),
            "total": round(employee_total, 2),
        },
        "employer_contributions": {
            "pension_15_75": round(employer_pension, 2),
            "unemployment_2": round(employer_unemployment, 2),
            "medical_1": round(employer_medical, 2),
            "injury_1_5": round(employer_injury, 2),
            "total": round(employer_total, 2),
        },
        "total_monthly_contribution": round(total_monthly, 2),
        "net_salary_after_insurance": round(gross_salary - employee_total, 2),
        "legal_reference": "قانون التأمينات الاجتماعية رقم 148 لسنة 2019",
    }


def calculate_leaves(
    start_date: str,
    current_date: str,
    taken_days: int = 0,
    employee_age: int = 30,
) -> dict:
    start = datetime.strptime(start_date, "%Y-%m-%d").date()
    current = datetime.strptime(current_date, "%Y-%m-%d").date()
    delta = relativedelta(current, start)
    years_of_service = delta.years

    if employee_age >= 50:
        annual_leave = 45
    elif years_of_service >= 10:
        annual_leave = 30
    else:
        annual_leave = 21

    casual_leave = 6
    sick_leave_max = 180

    taken_annual = min(taken_days, annual_leave)
    taken_casual = min(max(0, taken_days - annual_leave), casual_leave)
    remaining_annual = annual_leave - taken_annual
    remaining_casual = casual_leave - taken_casual

    return {
        "years_of_service": years_of_service,
        "employee_age": employee_age,
        "annual_leave": {
            "total": annual_leave,
            "taken": taken_annual,
            "remaining": remaining_annual,
            "legal_rule": "21 يوم (أقل من 10 سنوات) | 30 يوم (أكثر من 10 سنوات) | 45 يوم (فوق 50 سنة)",
        },
        "casual_leave": {
            "total": casual_leave,
            "taken": taken_casual,
            "remaining": remaining_casual,
            "legal_rule": "6 أيام عارضة سنوياً - المادة 50 من قانون العمل",
        },
        "sick_leave": {
            "maximum_days": sick_leave_max,
            "legal_rule": "حتى 180 يوم (المادة 54 من قانون العمل)",
        },
        "legal_reference": "المواد 47-58 من قانون العمل رقم 12 لسنة 2003",
    }


TAX_BRACKETS_2026 = [
    (40000, 0, 0),
    (55000, 40000, 0.10),
    (70000, 55000, 0.15),
    (200000, 70000, 0.20),
    (400000, 200000, 0.225),
    (1200000, 400000, 0.25),
    (float("inf"), 1200000, 0.275),
]

PERSONAL_EXEMPTION = 20000

SOCIAL_INSURANCE_RATE = 0.11


def calculate_net_salary(
    gross_salary: float,
    marital_status: str = "single",
    dependents: int = 0,
) -> dict:
    annual_gross = gross_salary * 12

    monthly_insurance = gross_salary * SOCIAL_INSURANCE_RATE
    annual_insurance = monthly_insurance * 12

    taxable_annual = annual_gross - annual_insurance - PERSONAL_EXEMPTION

    tax_annual = 0.0
    tax_breakdown = []
    remaining = taxable_annual

    for bracket_end, bracket_start, rate in TAX_BRACKETS_2026:
        if remaining <= 0:
            break
        bracket_size = bracket_end - bracket_start
        taxable_in_bracket = min(remaining, bracket_size)
        tax_in_bracket = taxable_in_bracket * rate
        if tax_in_bracket > 0:
            tax_annual += tax_in_bracket
            tax_breakdown.append({
                "range": f"{bracket_start:,.0f} - {bracket_end:,.0f}" if bracket_end != float("inf") else f"أكثر من {bracket_start:,.0f}",
                "rate": f"{rate * 100:.1f}%",
                "amount": round(tax_in_bracket, 2),
            })
        remaining -= taxable_in_bracket

    family_discount = 0
    if marital_status == "married":
        family_discount += 1000
    family_discount += dependents * 1000
    tax_annual = max(0, tax_annual - family_discount)

    monthly_tax = tax_annual / 12
    net_monthly = gross_salary - monthly_insurance - monthly_tax

    return {
        "gross_monthly": round(gross_salary, 2),
        "gross_annual": round(annual_gross, 2),
        "insurance_deductions": {
            "monthly": round(monthly_insurance, 2),
            "annual": round(annual_insurance, 2),
            "rate": f"{SOCIAL_INSURANCE_RATE * 100:.0f}%",
        },
        "personal_exemption": PERSONAL_EXEMPTION,
        "taxable_annual": round(taxable_annual, 2),
        "tax": {
            "annual": round(tax_annual, 2),
            "monthly": round(monthly_tax, 2),
            "breakdown": tax_breakdown,
        },
        "family_discount": round(family_discount, 2),
        "net_monthly": round(net_monthly, 2),
        "net_annual": round(net_monthly * 12, 2),
        "legal_reference": "قانون الضريبة على الدخل رقم 91 لسنة 2005 والتعديلات",
    }
