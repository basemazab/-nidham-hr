"""
Egyptian Payroll Engine
======================
حساب الرواتب المصرية وفقاً لقانون:
- التأمين الاجتماعي رقم 148 لسنة 2019
- ضريبة الدخل 2026
- قانون العمل المصري رقم 12 لسنة 2003

جميع القيم قابلة للتعديل من الإعدادات.
"""

from dataclasses import dataclass, field
from typing import Optional
from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP

# ============================================================
# Insurance Configuration (Law 148/2019) - Updated 2026
# ============================================================

@dataclass
class InsuranceConfig:
    """إعدادات التأمينات الاجتماعية 2026"""
    min_insurance_salary: Decimal = Decimal("2300")
    max_insurance_salary: Decimal = Decimal("14500")
    employee_rate_total: Decimal = Decimal("0.14")       # 14% حصة العامل
    employer_rate_total: Decimal = Decimal("0.1875")     # 18.75% حصة صاحب العمل
    government_rate: Decimal = Decimal("0.03")           # 3% مساهمة الدولة
    old_age_pension_employee: Decimal = Decimal("0.09")  # 9% معاش
    old_age_pension_employer: Decimal = Decimal("0.13")  # 13% معاش
    death_disability_employee: Decimal = Decimal("0.01") # 1% وفاة وعجز
    death_disability_employer: Decimal = Decimal("0.02") # 2% وفاة وعجز
    medical_insurance_employee: Decimal = Decimal("0.01") # 1% تأمين طبي
    medical_insurance_employer: Decimal = Decimal("0.02") # 2% تأمين طبي
    unemployment_employee: Decimal = Decimal("0.01")     # 1% بطالة
    unemployment_employer: Decimal = Decimal("0.01")     # 1% بطالة
    work_injury_rate: Decimal = Decimal("0.01")          # 1% إصابة عمل (صاحب العمل فقط)
    nature_of_work_rate: Decimal = Decimal("0.0025")     # 0.25% طبيعة عمل (صاحب العمل فقط)


# ============================================================
# Tax Configuration 2026
# ============================================================

@dataclass
class TaxBracket:
    """شريحة ضريبية"""
    lower_limit: Decimal
    upper_limit: Decimal
    rate: Decimal

TAX_BRACKETS_2026 = [
    TaxBracket(Decimal("0"), Decimal("40000"), Decimal("0")),        # معفى
    TaxBracket(Decimal("40000"), Decimal("55000"), Decimal("0.10")), # 10%
    TaxBracket(Decimal("55000"), Decimal("70000"), Decimal("0.15")), # 15%
    TaxBracket(Decimal("70000"), Decimal("200000"), Decimal("0.20")),# 20%
    TaxBracket(Decimal("200000"), Decimal("400000"), Decimal("0.225")), # 22.5%
    TaxBracket(Decimal("400000"), Decimal("1200000"), Decimal("0.25")), # 25%
    TaxBracket(Decimal("1200000"), Decimal("999999999"), Decimal("0.275")), # 27.5%
]

PERSONAL_EXEMPTION_ANNUAL = Decimal("20000")  # إعفاء شخصي سنوي
FAMILY_EXEMPTION_ANNUAL = Decimal("1000") * 12  # إعفاء الأسرة (أساسي + إضافي)
MAX_FAMILY_EXEMPTION = Decimal("1000") * 12


@dataclass
class TaxConfig:
    """إعدادات الضريبة 2026"""
    brackets: list = field(default_factory=lambda: TAX_BRACKETS_2026)
    personal_exemption: Decimal = PERSONAL_EXEMPTION_ANNUAL
    family_exemption: Decimal = FAMILY_EXEMPTION_ANNUAL


# ============================================================
# End of Service Configuration
# ============================================================

@dataclass
class GratuityConfig:
    """إعدادات مكافأة نهاية الخدمة"""
    # أول 5 سنوات: نصف شهر عن كل سنة
    first_5_years_rate: Decimal = Decimal("0.5")
    # بعد 5 سنوات: شهر كامل عن كل سنة
    after_5_years_rate: Decimal = Decimal("1.0")
    # استقالة: نصف المكافأة (أقل من 10 سنوات)
    resignation_below_10: Decimal = Decimal("0.5")
    # استقالة: ثلثي المكافأة (10-15 سنة)
    resignation_10_to_15: Decimal = Decimal("0.6666666666666666")
    # استقالة: كامل المكافأة (15+ سنة)
    resignation_above_15: Decimal = Decimal("1.0")


# ============================================================
# Core Calculation Functions
# ============================================================

def round_2(value: Decimal) -> Decimal:
    """تقريب لأقرب قرش"""
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_insurance(
    gross_salary: Decimal,
    config: Optional[InsuranceConfig] = None,
) -> dict:
    """
    حساب التأمينات الاجتماعية حسب قانون 148/2019
    
    Args:
        gross_salary: الراتب الإجمالي (الخاضع للتأمين)
        config: إعدادات التأمينات (اختياري)
    
    Returns:
        dict: تفصيل الاشتراكات
    """
    config = config or InsuranceConfig()
    
    # تطبيق الحدود الدنيا والعليا
    if gross_salary < config.min_insurance_salary:
        insurance_salary = config.min_insurance_salary
    elif gross_salary > config.max_insurance_salary:
        insurance_salary = config.max_insurance_salary
    else:
        insurance_salary = gross_salary
    
    # حساب الاشتراكات - حصة العامل
    employee_pension = insurance_salary * config.old_age_pension_employee
    employee_death_disability = insurance_salary * config.death_disability_employee
    employee_medical = insurance_salary * config.medical_insurance_employee
    employee_unemployment = insurance_salary * config.unemployment_employee
    employee_total = employee_pension + employee_death_disability + employee_medical + employee_unemployment
    
    # حساب الاشتراكات - حصة صاحب العمل
    employer_pension = insurance_salary * config.old_age_pension_employer
    employer_death_disability = insurance_salary * config.death_disability_employer
    employer_medical = insurance_salary * config.medical_insurance_employer
    employer_unemployment = insurance_salary * config.unemployment_employer
    employer_work_injury = insurance_salary * config.work_injury_rate
    employer_nature_of_work = insurance_salary * config.nature_of_work_rate
    employer_total = (employer_pension + employer_death_disability + employer_medical + 
                     employer_unemployment + employer_work_injury + employer_nature_of_work)
    
    # مساهمة الدولة
    government_share = insurance_salary * config.government_rate
    
    # إجمالي الاشتراك
    total_insurance = employee_total + employer_total + government_share
    
    return {
        "insurance_salary": round_2(insurance_salary),
        "employee": {
            "pension": round_2(employee_pension),
            "death_disability": round_2(employee_death_disability),
            "medical": round_2(employee_medical),
            "unemployment": round_2(employee_unemployment),
            "total": round_2(employee_total),
        },
        "employer": {
            "pension": round_2(employer_pension),
            "death_disability": round_2(employer_death_disability),
            "medical": round_2(employer_medical),
            "unemployment": round_2(employer_unemployment),
            "work_injury": round_2(employer_work_injury),
            "nature_of_work": round_2(employer_nature_of_work),
            "total": round_2(employer_total),
        },
        "government_share": round_2(government_share),
        "total_insurance": round_2(total_insurance),
    }


def calculate_income_tax(
    annual_taxable_income: Decimal,
    config: Optional[TaxConfig] = None,
    has_family: bool = True,
) -> dict:
    """
    حساب ضريبة الدخل حسب الشرائح المصرية 2026
    
    Args:
        annual_taxable_income: الدخل السنوي الخاضع للضريبة
        config: إعدادات الضريبة
        has_family: هل للموظف أسرة (إعفاء إضافي)
    
    Returns:
        dict: تفصيل الضريبة
    """
    config = config or TaxConfig()
    
    # حساب إجمالي الإعفاءات
    total_exemptions = config.personal_exemption
    if has_family:
        total_exemptions += config.family_exemption
    
    # الدخل بعد الإعفاءات
    taxable_after_exemptions = annual_taxable_income - total_exemptions
    
    if taxable_after_exemptions <= 0:
        return {
            "annual_taxable_income": round_2(annual_taxable_income),
            "total_exemptions": round_2(total_exemptions),
            "taxable_after_exemptions": Decimal("0"),
            "annual_tax": Decimal("0"),
            "monthly_tax": Decimal("0"),
            "effective_rate": Decimal("0"),
        }
    
    # حساب الضريبة تصاعدياً
    annual_tax = Decimal("0")
    previous_limit = Decimal("0")
    
    for bracket in config.brackets:
        if taxable_after_exemptions <= bracket.upper_limit:
            taxable_in_bracket = taxable_after_exemptions - previous_limit
            annual_tax += taxable_in_bracket * bracket.rate
            break
        else:
            taxable_in_bracket = bracket.upper_limit - previous_limit
            annual_tax += taxable_in_bracket * bracket.rate
            previous_limit = bracket.upper_limit
    
    # الضريبة الشهرية
    monthly_tax = annual_tax / 12
    
    # معدل الضريبة الفعلي
    effective_rate = (annual_tax / annual_taxable_income * 100) if annual_taxable_income > 0 else Decimal("0")
    
    return {
        "annual_taxable_income": round_2(annual_taxable_income),
        "total_exemptions": round_2(total_exemptions),
        "taxable_after_exemptions": round_2(taxable_after_exemptions),
        "annual_tax": round_2(annual_tax),
        "monthly_tax": round_2(monthly_tax),
        "effective_rate": round_2(effective_rate),
    }


def calculate_net_salary(
    gross_salary: Decimal,
    has_family: bool = True,
    insurance_config: Optional[InsuranceConfig] = None,
    tax_config: Optional[TaxConfig] = None,
) -> dict:
    """
    حساب صافي الراتب الشامل
    
    Args:
        gross_salary: إجمالي الراتب الشهري
        has_family: هل للموظف أسرة
        insurance_config: إعدادات التأمينات
        tax_config: إعدادات الضريبة
    
    Returns:
        dict: كشف راتب كامل
    """
    # حساب التأمينات
    insurance = calculate_insurance(gross_salary, insurance_config)
    
    # الدخل السنوي الخاضع للضريبة (بعد خصم التأمين)
    monthly_insurance_deduction = insurance["employee"]["total"]
    annual_taxable_income = (gross_salary - monthly_insurance_deduction) * 12
    
    # حساب الضريبة
    tax = calculate_income_tax(annual_taxable_income, tax_config, has_family)
    
    # صافي الراتب
    net_salary = gross_salary - monthly_insurance_deduction - tax["monthly_tax"]
    
    # التكلفة الإجمالية على الشركة
    total_cost_to_company = gross_salary + insurance["employer"]["total"]
    
    return {
        "gross_salary": round_2(gross_salary),
        "insurance": {
            "employee_deduction": insurance["employee"]["total"],
            "employer_contribution": insurance["employer"]["total"],
            "insurance_salary": insurance["insurance_salary"],
        },
        "tax": {
            "monthly_tax": tax["monthly_tax"],
            "annual_tax": tax["annual_tax"],
            "effective_rate": tax["effective_rate"],
        },
        "net_salary": round_2(net_salary),
        "total_cost_to_company": round_2(total_cost_to_company),
        "breakdown": {
            "basic_salary": gross_salary,
            "insurance_deduction": insurance["employee"]["total"],
            "tax_deduction": tax["monthly_tax"],
            "net_take_home": net_salary,
        }
    }


def calculate_end_of_service_gratuity(
    basic_salary: Decimal,
    years_of_service: Decimal,
    reason: str = "termination",  # termination, resignation, death, disability
    config: Optional[GratuityConfig] = None,
) -> dict:
    """
    حساب مكافأة نهاية الخدمة
    
    Args:
        basic_salary: آخر راتب أساسي شهري
        years_of_service: سنوات الخدمة
        reason: سبب المغادرة
        config: إعدادات المكافأة
    
    Returns:
        dict: تفصيل المكافأة
    """
    config = config or GratuityConfig()
    
    # حساب المكافأة الأساسية
    if years_of_service <= 5:
        gratuity = basic_salary * config.first_5_years_rate * years_of_service
    else:
        first_5_gratuity = basic_salary * config.first_5_years_rate * 5
        remaining_years = years_of_service - 5
        after_5_gratuity = basic_salary * config.after_5_years_rate * remaining_years
        gratuity = first_5_gratuity + after_5_gratuity
    
    # تطبيق نسبة الاستحقاق حسب السبب
    if reason == "resignation":
        if years_of_service < 2:
            entitlement_rate = Decimal("0")  # أقل من سنتين: لا يستحق
        elif years_of_service < 10:
            entitlement_rate = config.resignation_below_10
        elif years_of_service < 15:
            entitlement_rate = config.resignation_10_to_15
        else:
            entitlement_rate = config.resignation_above_15
    elif reason in ["termination", "death", "disability", "contract_end"]:
        entitlement_rate = Decimal("1.0")  # كامل المكافأة
    else:
        entitlement_rate = Decimal("1.0")
    
    final_gratuity = gratuity * entitlement_rate
    
    return {
        "basic_salary": round_2(basic_salary),
        "years_of_service": round_2(years_of_service),
        "reason": reason,
        "gratuity_before_adjustment": round_2(gratuity),
        "entitlement_rate": round_2(entitlement_rate * 100),
        "final_gratuity": round_2(final_gratuity),
        "legal_reference": "قانون العمل المصري رقم 12 لسنة 2003 - المادة 127",
    }


def calculate_years_of_service(start_date: date, end_date: Optional[date] = None) -> Decimal:
    """
    حساب سنوات الخدمة بدقة
    
    Args:
        start_date: تاريخ الالتحاق
        end_date: تاريخ نهاية الخدمة (اختياري، الافتراضي اليوم)
    
    Returns:
        Decimal: سنوات الخدمة
    """
    if end_date is None:
        end_date = date.today()
    
    delta = end_date - start_date
    years = Decimal(str(delta.days)) / Decimal("365.25")
    return round_2(years)


def generate_payslip(
    employee_name: str,
    month: int,
    year: int,
    basic_salary: Decimal,
    allowances: Optional[dict] = None,
    deductions: Optional[dict] = None,
    has_family: bool = True,
    is_insured: bool = True,
) -> dict:
    """
    توليد كشف راتب شهري كامل
    
    Args:
        employee_name: اسم الموظف
        month: الشهر
        year: السنة
        basic_salary: الراتب الأساسي
        allowances: البدلات (housing, transportation, food, other)
        deductions: خصومات إضافية
        has_family: هل للموظف أسرة
        is_insured: هل المؤمن عليه تأمينات
    
    Returns:
        dict: كشف الراتب
    """
    allowances = allowances or {}
    deductions = deductions or {}
    
    # حساب إجمالي الراتب
    housing = Decimal(str(allowances.get("housing", 0)))
    transportation = Decimal(str(allowances.get("transportation", 0)))
    food = Decimal(str(allowances.get("food", 0)))
    other = Decimal(str(allowances.get("other", 0)))
    
    gross_salary = basic_salary + housing + transportation + food + other
    
    # التأمينات
    if is_insured:
        insurance = calculate_insurance(gross_salary)
    else:
        insurance = {
            "employee": {"total": Decimal("0")},
            "employer": {"total": Decimal("0")},
            "insurance_salary": Decimal("0"),
        }
    
    # الضريبة
    annual_taxable = (gross_salary - insurance["employee"]["total"]) * 12
    tax = calculate_income_tax(annual_taxable, has_family=has_family)
    
    # الخصومات الأخرى
    total_other_deductions = sum(Decimal(str(v)) for v in deductions.values())
    
    # صافي الراتب
    net_salary = (gross_salary - insurance["employee"]["total"] - 
                 tax["monthly_tax"] - total_other_deductions)
    
    return {
        "employee_name": employee_name,
        "month": month,
        "year": year,
        "earnings": {
            "basic_salary": round_2(basic_salary),
            "housing_allowance": round_2(housing),
            "transportation_allowance": round_2(transportation),
            "food_allowance": round_2(food),
            "other_allowances": round_2(other),
            "gross_salary": round_2(gross_salary),
        },
        "deductions": {
            "insurance": insurance["employee"]["total"],
            "income_tax": round_2(tax["monthly_tax"]),
            "other": total_other_deductions,
            "total_deductions": round_2(insurance["employee"]["total"] + tax["monthly_tax"] + total_other_deductions),
        },
        "net_salary": round_2(net_salary),
        "employer_cost": round_2(gross_salary + insurance["employer"]["total"]),
        "insurance_details": insurance if is_insured else None,
        "tax_details": tax,
    }


# ============================================================
# Insurance Forms for Government Reporting
# ============================================================

def generate_insurance_form1_data(employees: list, month: int, year: int) -> dict:
    """
    استمارة 1 - بيانات المشتركين في التأمينات
    تقدم شهرياً للهيئة القومية للتأمين الاجتماعي
    
    Args:
        employees: قائمة بيانات الموظفين
        month: الشهر
        year: السنة
    
    Returns:
        dict: بيانات الاستمارة
    """
    form_data = {
        "form_name": "استمارة 1 - بيان المشتركين",
        "month": month,
        "year": year,
        "employees": [],
        "totals": {
            "total_employees": 0,
            "total_insurance_salary": Decimal("0"),
            "total_employee_share": Decimal("0"),
            "total_employer_share": Decimal("0"),
        }
    }
    
    for idx, emp in enumerate(employees, 1):
        insurance = calculate_insurance(Decimal(str(emp["gross_salary"])))
        
        form_data["employees"].append({
            "idx": idx,
            "national_id": emp.get("national_id", ""),
            "insurance_number": emp.get("insurance_number", ""),
            "employee_name": emp.get("name", ""),
            "job_title": emp.get("job_title", ""),
            "date_of_joining": emp.get("date_of_joining", ""),
            "gross_salary": insurance["insurance_salary"],
            "insurance_salary": insurance["insurance_salary"],
            "employee_share": insurance["employee"]["total"],
            "employer_share": insurance["employer"]["total"],
        })
        
        form_data["totals"]["total_employees"] += 1
        form_data["totals"]["total_insurance_salary"] += insurance["insurance_salary"]
        form_data["totals"]["total_employee_share"] += insurance["employee"]["total"]
        form_data["totals"]["total_employer_share"] += insurance["employer"]["total"]
    
    # تقريب القيم
    form_data["totals"]["total_insurance_salary"] = round_2(form_data["totals"]["total_insurance_salary"])
    form_data["totals"]["total_employee_share"] = round_2(form_data["totals"]["total_employee_share"])
    form_data["totals"]["total_employer_share"] = round_2(form_data["totals"]["total_employer_share"])
    
    return form_data
