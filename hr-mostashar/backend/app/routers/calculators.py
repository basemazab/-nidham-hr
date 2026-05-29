from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from app.schemas import CalculatorInput
from app.routers.auth import get_current_user
from app.models.user import User
from app.services.pdf_generator import generate_end_of_service_pdf, generate_insurance_pdf, generate_salary_pdf
from app.services.egyptian_payroll import (
    calculate_end_of_service_gratuity as calculate_end_of_service,
    calculate_insurance,
    calculate_leaves,
    calculate_net_salary,
    calculate_years_of_service,
    generate_payslip,
    generate_insurance_form1_data,
)
from decimal import Decimal
from datetime import datetime

router = APIRouter(prefix="/calc", tags=["الحاسبات"])


# ============================================================
# Legacy Endpoints (backwards compatible)
# ============================================================

@router.post("/end-of-service")
async def calc_end_of_service(body: CalculatorInput, user: User = Depends(get_current_user)):
    fields = body.fields
    try:
        start_date = fields.get("start_date")
        end_date = fields.get("end_date")
        total_salary = float(fields.get("total_salary", 0))
        contract_type = fields.get("contract_type", "unlimited")
        reason = fields.get("reason", "resignation")
        
        # Calculate years of service
        years = calculate_years_of_service(
            datetime.strptime(start_date, "%Y-%m-%d").date(),
            datetime.strptime(end_date, "%Y-%m-%d").date() if end_date else None
        )
        
        # Calculate end of service gratuity
        result = calculate_end_of_service_gratuity(
            basic_salary=Decimal(str(total_salary)),
            years_of_service=years,
            reason=reason,
        )
        
        # Format response to match legacy format
        return {
            "years_of_service": float(result["years_of_service"]),
            "total_salary": total_salary,
            "reward": float(result["final_gratuity"]),
            "breakdown": [
                f"مكافأة نهاية الخدمة: {result['final_gratuity']:.2f} جنيه"
            ],
            "legal_reference": result["legal_reference"],
            "contract_type": contract_type,
            "reason": reason,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"خطأ في البيانات: {str(e)}")


@router.post("/insurance")
async def calc_insurance(body: CalculatorInput, user: User = Depends(get_current_user)):
    fields = body.fields
    try:
        gross_salary = Decimal(str(fields.get("gross_salary", 0)))
        employment_type = fields.get("employment_type", "permanent")
        # For now, we ignore employment_type in egyptian calculation as it's not used in the calculation
        result = calculate_insurance(gross_salary)
        # Format response to match legacy format
        return {
            "gross_salary": float(result["gross_salary"]),
            "insurance_base": float(result["insurance_salary"]),
            "base_limits": result.get("base_limits", {"minimum": 2300, "maximum": 14500}),
            "employee_deductions": {
                "pension_9": float(result["employee"]["pension"]),
                "unemployment_1": float(result["employee"]["unemployment"]),
                "medical_1": float(result["employee"]["medical"]),
                "total": float(result["employee"]["total"]),
            },
            "employer_contributions": {
                "pension_15_75": float(result["employer"]["pension"]),
                "unemployment_2": float(result["employer"]["unemployment"]),
                "medical_1": float(result["employer"]["medical"]),
                "injury_1_5": float(result["employer"]["work_injury"] + result["employer"]["nature_of_work"]),
                "total": float(result["employer"]["total"]),
            },
            "total_monthly_contribution": float(result["total_insurance"] - result["insurance_salary"]),
            "net_salary_after_insurance": float(result["gross_salary"] - result["employee"]["total"]),
            "legal_reference": result.get("legal_reference", "قانون التأمينات الاجتماعية رقم 148 لسنة 2019"),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"خطأ في البيانات: {str(e)}")


@router.post("/leaves")
async def calc_leaves(body: CalculatorInput, user: User = Depends(get_current_user)):
    fields = body.fields
    try:
        result = calculate_leaves(
            start_date=fields.get("start_date"),
            current_date=fields.get("current_date"),
            taken_days=int(fields.get("taken_days", 0)),
            employee_age=int(fields.get("employee_age", 30)),
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"خطأ في البيانات: {str(e)}")


@router.post("/net-salary")
async def calc_net_salary(body: CalculatorInput, user: User = Depends(get_current_user)):
    fields = body.fields
    try:
        gross_salary = Decimal(str(fields.get("gross_salary", 0)))
        marital_status = fields.get("marital_status", "single")
        dependents = int(fields.get("dependents", 0))
        has_family = marital_status != "single" and dependents > 0
        
        result = calculate_net_salary(
            gross_salary=gross_salary,
            has_family=has_family,
        )
        # Format response to match legacy format
        return {
            "gross_monthly": float(result["gross_salary"]),
            "gross_annual": float(result["gross_salary"] * 12),
            "insurance_deductions": {
                "monthly": float(result["insurance"]["employee_deduction"]),
                "annual": float(result["insurance"]["employee_deduction"] * 12),
                "rate": "14%",  # This is approximate - actual is 14% total
            },
            "personal_exemption": 20000,  # from tax config
            "tax": {
                "annual": float(result["tax"]["annual_tax"]),
                "monthly": float(result["tax"]["monthly_tax"]),
                "breakdown": [],  # Simplified for now
            },
            "family_discount": 0.0,  # Simplified
            "net_monthly": float(result["net_salary"]),
            "net_annual": float(result["net_salary"] * 12),
            "legal_reference": "قانون التأمينات الاجتماعية رقم 148 لسنة 2019 وقانون الضريبة على الدخل",
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"خطأ في البيانات: {str(e)}")


# ============================================================
# Egyptian Payroll Endpoints (New)
# ============================================================

@router.post("/egyptian/insurance")
async def calc_egyptian_insurance(body: CalculatorInput, user: User = Depends(get_current_user)):
    """
    حساب التأمينات الاجتماعية حسب قانون 148/2019
    """
    fields = body.fields
    try:
        gross_salary = Decimal(str(fields.get("gross_salary", 0)))
        result = calculate_insurance(gross_salary)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"خطأ في البيانات: {str(e)}")


@router.post("/egyptian/tax")
async def calc_egyptian_tax(body: CalculatorInput, user: User = Depends(get_current_user)):
    """
    حساب ضريبة الدخل حسب الشرائح 2026
    """
    from app.services.egyptian_payroll import calculate_income_tax
    fields = body.fields
    try:
        annual_income = Decimal(str(fields.get("annual_income", 0)))
        has_family = fields.get("has_family", True) in [True, "true", "1", "نعم"]
        result = calculate_income_tax(annual_income, has_family=has_family)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"خطأ في البيانات: {str(e)}")


@router.post("/egyptian/net-salary")
async def calc_egyptian_net_salary(body: CalculatorInput, user: User = Depends(get_current_user)):
    """
    حساب صافي الراتب المصري الشامل
    تأمينات + ضرائب + بدلات + خصومات
    """
    fields = body.fields
    try:
        gross_salary = Decimal(str(fields.get("gross_salary", 0)))
        has_family = fields.get("has_family", True) in [True, "true", "1", "نعم"]
        
        result = calculate_net_salary(
            gross_salary=gross_salary,
            has_family=has_family,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"خطأ في البيانات: {str(e)}")


@router.post("/egyptian/gratuity")
async def calc_egyptian_gratuity(body: CalculatorInput, user: User = Depends(get_current_user)):
    """
    حساب مكافأة نهاية الخدمة
    """
    fields = body.fields
    try:
        basic_salary = Decimal(str(fields.get("basic_salary", 0)))
        years = Decimal(str(fields.get("years_of_service", 0)))
        reason = fields.get("reason", "termination")
        
        result = calculate_end_of_service_gratuity(
            basic_salary=basic_salary,
            years_of_service=years,
            reason=reason,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"خطأ في البيانات: {str(e)}")


@router.post("/egyptian/payslip")
async def calc_egyptian_payslip(body: CalculatorInput, user: User = Depends(get_current_user)):
    """
    توليد كشف راتب مصري كامل
    """
    fields = body.fields
    try:
        now = datetime.now()
        result = generate_payslip(
            employee_name=fields.get("employee_name", ""),
            month=int(fields.get("month", now.month)),
            year=int(fields.get("year", now.year)),
            basic_salary=Decimal(str(fields.get("basic_salary", 0))),
            allowances={
                "housing": fields.get("housing_allowance", 0),
                "transportation": fields.get("transportation_allowance", 0),
                "food": fields.get("food_allowance", 0),
                "other": fields.get("other_allowances", 0),
            },
            has_family=fields.get("has_family", True) in [True, "true", "1", "نعم"],
            is_insured=fields.get("is_insured", True) in [True, "true", "1", "نعم"],
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"خطأ في البيانات: {str(e)}")


@router.post("/egyptian/insurance-form1")
async def calc_insurance_form1(body: CalculatorInput, user: User = Depends(get_current_user)):
    """
    استمارة 1 - بيان المشتركين في التأمينات
    """
    fields = body.fields
    try:
        employees = fields.get("employees", [])
        month = int(fields.get("month", datetime.now().month))
        year = int(fields.get("year", datetime.now().year))
        
        result = generate_insurance_form1_data(employees, month, year)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"خطأ في البيانات: {str(e)}")


# ============================================================
# Legacy PDF Endpoints
# ============================================================

@router.post("/end-of-service/pdf")
async def calc_end_of_service_pdf(body: CalculatorInput, user: User = Depends(get_current_user)):
    fields = body.fields
    data = legacy_eos(
        start_date=fields.get("start_date"),
        end_date=fields.get("end_date"),
        total_salary=float(fields.get("total_salary", 0)),
        contract_type=fields.get("contract_type", "unlimited"),
        reason=fields.get("reason", "resignation"),
    )
    pdf_bytes = generate_end_of_service_pdf({**data, **fields})
    return StreamingResponse(iter([pdf_bytes]), media_type="application/pdf", headers={"Content-Disposition": 'attachment; filename="end_of_service.pdf"'})


@router.post("/insurance/pdf")
async def calc_insurance_pdf(body: CalculatorInput, user: User = Depends(get_current_user)):
    fields = body.fields
    data = legacy_insurance(gross_salary=float(fields.get("gross_salary", 0)))
    pdf_bytes = generate_insurance_pdf(data)
    return StreamingResponse(iter([pdf_bytes]), media_type="application/pdf", headers={"Content-Disposition": 'attachment; filename="insurance.pdf"'})


@router.post("/net-salary/pdf")
async def calc_net_salary_pdf(body: CalculatorInput, user: User = Depends(get_current_user)):
    fields = body.fields
    data = legacy_net_salary(
        gross_salary=float(fields.get("gross_salary", 0)),
        marital_status=fields.get("marital_status", "single"),
        dependents=int(fields.get("dependents", 0)),
    )
    pdf_bytes = generate_salary_pdf(data)
    return StreamingResponse(iter([pdf_bytes]), media_type="application/pdf", headers={"Content-Disposition": 'attachment; filename="net_salary.pdf"'})
