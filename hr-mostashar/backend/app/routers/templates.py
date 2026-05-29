from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from app.routers.auth import get_current_user
from app.models.user import User
from app.schemas.user import TemplateGenerateRequest
from app.services.pdf_generator import generate_pdf_async, TEMPLATE_MAP

router = APIRouter(prefix="/templates", tags=["النماذج"])

# Updated 6 professional templates
TEMPLATES = [
    {
        "id": "employment_contract",
        "name": "عقد عمل",
        "category": "عقود",
        "fields": [
            "contract_number", "contract_date", "employee_full_name", "national_id",
            "nationality", "employee_address", "mobile_phone", "job_title",
            "department", "direct_manager", "work_location", "start_date",
            "contract_type", "end_date", "contract_duration", "probation_period",
            "working_hours_per_day", "working_days_per_week", "weekly_rest_day",
            "annual_leave_days", "notice_period", "jurisdiction_city",
            "basic_salary", "housing_allowance", "transportation_allowance",
            "food_allowance", "other_allowances", "total_salary",
        ],
    },
    {
        "id": "appointment_letter",
        "name": "خطاب تعيين",
        "category": "إدارية",
        "fields": [
            "reference_number", "letter_date", "employee_full_name", "national_id",
            "job_title", "department", "job_grade", "direct_manager",
            "work_location", "start_date", "probation_period",
            "basic_salary", "housing_allowance", "transportation_allowance",
            "other_allowances", "total_salary",
        ],
    },
    {
        "id": "experience_certificate",
        "name": "شهادة خبرة",
        "category": "إدارية",
        "fields": [
            "reference_number", "certificate_date", "employee_full_name", "national_id",
            "nationality", "job_title", "department", "start_date", "end_date",
            "service_duration", "reason_for_leaving", "responsibilities_description",
            "performance_rating",
        ],
    },
    {
        "id": "salary_certificate",
        "name": "شهادة راتب",
        "category": "إدارية",
        "fields": [
            "reference_number", "certificate_date", "addressee",
            "employee_full_name", "national_id", "job_title", "department",
            "start_date", "employment_status",
            "basic_salary", "housing_allowance", "transportation_allowance",
            "food_allowance", "other_allowances", "deductions", "total_salary",
            "net_salary", "additional_info",
        ],
    },
    {
        "id": "warning_letter",
        "name": "خطاب إنذار",
        "category": "إنذارات",
        "fields": [
            "reference_number", "warning_date", "employee_full_name", "employee_code",
            "department", "warning_number", "warning_level", "violation_date",
            "violation_location", "violation_details", "legal_article", "legal_text",
            "appeal_days",
        ],
    },
    {
        "id": "termination_letter",
        "name": "خطاب إنهاء خدمة",
        "category": "إنذارات",
        "fields": [
            "reference_number", "termination_date", "employee_full_name", "national_id",
            "job_title", "department", "start_date", "end_date", "service_duration",
            "termination_reason", "termination_type", "legal_basis", "payment_deadline",
            "appeal_days",
            "end_of_service_gratuity", "unused_leave_balance", "notice_period_pay",
            "other_entitlements", "total_entitlements",
        ],
    },
]


@router.get("")
async def list_templates(user: User = Depends(get_current_user)):
    categories = {}
    for t in TEMPLATES:
        cat = t["category"]
        if cat not in categories:
            categories[cat] = []
        categories[cat].append({"id": t["id"], "name": t["name"], "fields": t["fields"]})
    return categories


@router.get("/{template_id}")
async def get_template(template_id: str, user: User = Depends(get_current_user)):
    for t in TEMPLATES:
        if t["id"] == template_id:
            return t
    raise HTTPException(status_code=404, detail="النموذج غير موجود")


@router.post("/{template_id}/generate")
async def generate_template(
    template_id: str,
    body: TemplateGenerateRequest,
    user: User = Depends(get_current_user),
):
    # Find template
    template = None
    for t in TEMPLATES:
        if t["id"] == template_id:
            template = t
            break
    if not template:
        raise HTTPException(status_code=404, detail="النموذج غير موجود")

    # Merge with employee data if provided
    data = body.custom_fields.copy()

    try:
        if body.format == "pdf":
            # Get template filename from the map
            template_filename = TEMPLATE_MAP.get(template_id, f"{template_id}.html")
            file_bytes = await generate_pdf_async(template_filename, data)
            return StreamingResponse(
                iter([file_bytes]),
                media_type="application/pdf",
                headers={"Content-Disposition": f'attachment; filename="{template_id}.pdf"'},
            )
        else:
            raise HTTPException(
                status_code=400,
                detail="تنسيق DOCX غير مدعوم حالياً. يُرجى استخدام تنسيق PDF.",
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"خطأ في إنشاء المستند: {str(e)}",
        )
