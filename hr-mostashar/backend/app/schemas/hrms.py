from datetime import datetime, date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, EmailStr, ConfigDict, validator
import re

from app.models.hrms import (
    Gender, MaritalStatus, MilitaryStatus, EducationLevel, EmploymentType,
    ContractType, EmployeeStatus, LegalEntity, PositionGrade, WorkLocationType,
)


class CompanyCreate(BaseModel):
    name_ar: str = Field(..., min_length=2, max_length=255)
    name_en: str = Field(..., min_length=2, max_length=255)
    commercial_register: Optional[str] = None
    tax_card: Optional[str] = None
    insurance_register: Optional[str] = None
    activity: Optional[str] = None
    establishment_date: Optional[date] = None
    legal_entity: Optional[LegalEntity] = LegalEntity.individual
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None


class CompanyUpdate(BaseModel):
    name_ar: Optional[str] = None
    name_en: Optional[str] = None
    commercial_register: Optional[str] = None
    tax_card: Optional[str] = None
    insurance_register: Optional[str] = None
    activity: Optional[str] = None
    establishment_date: Optional[date] = None
    legal_entity: Optional[LegalEntity] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    is_active: Optional[bool] = None


class CompanyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name_ar: str
    name_en: str
    commercial_register: Optional[str] = None
    tax_card: Optional[str] = None
    insurance_register: Optional[str] = None
    activity: Optional[str] = None
    establishment_date: Optional[date] = None
    legal_entity: Optional[LegalEntity] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None


class BranchCreate(BaseModel):
    company_id: Optional[str] = None
    name_ar: str = Field(..., min_length=2, max_length=255)
    name_en: Optional[str] = None
    address: Optional[str] = None
    manager_id: Optional[str] = None
    phone: Optional[str] = None


class BranchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    company_id: Optional[str] = None
    name_ar: str
    name_en: Optional[str] = None
    address: Optional[str] = None
    manager_id: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None


class DepartmentCreate(BaseModel):
    parent_id: Optional[str] = None
    company_id: Optional[str] = None
    name_ar: str = Field(..., min_length=2, max_length=255)
    name_en: Optional[str] = None
    code: Optional[str] = Field(None, max_length=50)
    manager_id: Optional[str] = None
    description: Optional[str] = None


class DepartmentUpdate(BaseModel):
    parent_id: Optional[str] = None
    name_ar: Optional[str] = None
    name_en: Optional[str] = None
    code: Optional[str] = None
    manager_id: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class DepartmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    parent_id: Optional[str] = None
    company_id: Optional[str] = None
    name_ar: str
    name_en: Optional[str] = None
    code: Optional[str] = None
    manager_id: Optional[str] = None
    description: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None


class PositionCreate(BaseModel):
    department_id: Optional[str] = None
    title_ar: str = Field(..., min_length=2, max_length=255)
    title_en: Optional[str] = None
    grade: Optional[PositionGrade] = None
    job_description: Optional[str] = None
    requirements: Optional[str] = None
    salary_range_min: Optional[Decimal] = Decimal(0)
    salary_range_max: Optional[Decimal] = None


class PositionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    department_id: Optional[str] = None
    title_ar: str
    title_en: Optional[str] = None
    grade: Optional[PositionGrade] = None
    job_description: Optional[str] = None
    requirements: Optional[str] = None
    salary_range_min: Optional[Decimal] = None
    salary_range_max: Optional[Decimal] = None
    is_active: bool
    created_at: Optional[datetime] = None


class WorkLocationCreate(BaseModel):
    company_id: Optional[str] = None
    name: str = Field(..., min_length=2, max_length=255)
    address: Optional[str] = None
    location_type: Optional[WorkLocationType] = None


class WorkLocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    company_id: Optional[str] = None
    name: str
    address: Optional[str] = None
    location_type: Optional[WorkLocationType] = None
    is_active: bool
    created_at: Optional[datetime] = None


class EmployeeDocumentCreate(BaseModel):
    document_type: str = Field(..., min_length=2, max_length=100)
    document_number: Optional[str] = None
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    issuer: Optional[str] = None
    file_url: Optional[str] = None
    is_required: bool = False
    is_verified: bool = False
    notes: Optional[str] = None


class EmployeeDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    employee_id: str
    document_type: str
    document_number: Optional[str] = None
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    issuer: Optional[str] = None
    file_url: Optional[str] = None
    is_required: bool
    is_verified: bool
    notes: Optional[str] = None
    created_at: Optional[datetime] = None


def validate_national_id(v):
    if v is None:
        return v
    v = str(v).strip()
    if not re.match(r"^\d{14}$", v):
        raise ValueError("الرقم القومي يجب ان يكون 14 رقم")
    if v[0] not in ("2", "3"):
        raise ValueError("الرقم القومي غير صحيح (يبدأ بـ 2 او 3)")
    return v


def validate_mobile(v):
    if v is None:
        return v
    v = str(v).strip()
    if not re.match(r"^01\d{9}$", v):
        raise ValueError("رقم الموبايل غير صحيح (يبدأ بـ 01 ويتكون من 11 رقم)")
    return v


class EmployeeCreate(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=100)
    middle_name: str = Field(..., min_length=2, max_length=100)
    last_name: str = Field(..., min_length=2, max_length=100)
    full_name_arabic: Optional[str] = None
    full_name_english: Optional[str] = None

    national_id: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    marital_status: Optional[MaritalStatus] = MaritalStatus.single
    nationality: str = "Egyptian"
    religion: Optional[str] = None
    blood_type: Optional[str] = None
    military_status: Optional[MilitaryStatus] = None

    governorate: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    home_phone: Optional[str] = None
    mobile_phone: Optional[str] = None
    mobile_phone_2: Optional[str] = None
    email: Optional[str] = None

    emergency_contact_name: Optional[str] = None
    emergency_contact_relation: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

    education_level: Optional[EducationLevel] = None
    university: Optional[str] = None
    faculty: Optional[str] = None
    graduation_year: Optional[int] = None
    grade_value: Optional[str] = None

    job_title_arabic: Optional[str] = None
    job_title_english: Optional[str] = None
    department_id: Optional[str] = None
    position_id: Optional[str] = None
    direct_manager_id: Optional[str] = None
    work_location_id: Optional[str] = None
    employment_type: Optional[EmploymentType] = EmploymentType.permanent
    contract_type: Optional[ContractType] = ContractType.unlimited

    hiring_date: Optional[date] = None
    contract_start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    probation_end_date: Optional[date] = None

    basic_salary: Decimal = Decimal(0)
    housing_allowance: Decimal = Decimal(0)
    transportation_allowance: Decimal = Decimal(0)
    food_allowance: Decimal = Decimal(0)
    other_allowances: Decimal = Decimal(0)

    is_insured: bool = False
    insurance_number: Optional[str] = None
    insurance_office: Optional[str] = None
    insurance_start_date: Optional[date] = None
    insurance_salary: Optional[Decimal] = None

    bank_name: Optional[str] = None
    bank_branch: Optional[str] = None
    bank_account_number: Optional[str] = None

    status: Optional[EmployeeStatus] = EmployeeStatus.active
    photo_url: Optional[str] = None
    notes: Optional[str] = None

    @validator("national_id")
    def check_national_id(cls, v):
        return validate_national_id(v)

    @validator("mobile_phone")
    def check_mobile(cls, v):
        return validate_mobile(v)

    @validator("email")
    def check_email(cls, v):
        if v is None:
            return v
        if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", v):
            raise ValueError("البريد الإلكتروني غير صحيح")
        return v.lower()


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name_arabic: Optional[str] = None
    full_name_english: Optional[str] = None

    national_id: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    marital_status: Optional[MaritalStatus] = None
    nationality: Optional[str] = None
    religion: Optional[str] = None
    blood_type: Optional[str] = None
    military_status: Optional[MilitaryStatus] = None

    governorate: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    home_phone: Optional[str] = None
    mobile_phone: Optional[str] = None
    mobile_phone_2: Optional[str] = None
    email: Optional[str] = None

    emergency_contact_name: Optional[str] = None
    emergency_contact_relation: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

    education_level: Optional[EducationLevel] = None
    university: Optional[str] = None
    faculty: Optional[str] = None
    graduation_year: Optional[int] = None
    grade_value: Optional[str] = None

    job_title_arabic: Optional[str] = None
    job_title_english: Optional[str] = None
    department_id: Optional[str] = None
    position_id: Optional[str] = None
    direct_manager_id: Optional[str] = None
    work_location_id: Optional[str] = None
    employment_type: Optional[EmploymentType] = None
    contract_type: Optional[ContractType] = None

    hiring_date: Optional[date] = None
    contract_start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    probation_end_date: Optional[date] = None
    actual_termination_date: Optional[date] = None

    basic_salary: Optional[Decimal] = None
    housing_allowance: Optional[Decimal] = None
    transportation_allowance: Optional[Decimal] = None
    food_allowance: Optional[Decimal] = None
    other_allowances: Optional[Decimal] = None

    is_insured: Optional[bool] = None
    insurance_number: Optional[str] = None
    insurance_office: Optional[str] = None
    insurance_start_date: Optional[date] = None
    insurance_salary: Optional[Decimal] = None

    bank_name: Optional[str] = None
    bank_branch: Optional[str] = None
    bank_account_number: Optional[str] = None

    status: Optional[EmployeeStatus] = None
    photo_url: Optional[str] = None
    notes: Optional[str] = None

    @validator("national_id")
    def check_national_id(cls, v):
        return validate_national_id(v)

    @validator("mobile_phone")
    def check_mobile(cls, v):
        return validate_mobile(v)


class EmployeeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    employee_code: str
    first_name: str
    middle_name: str
    last_name: str
    full_name_arabic: Optional[str] = None
    full_name_english: Optional[str] = None
    national_id: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    marital_status: Optional[MaritalStatus] = None
    nationality: Optional[str] = None
    religion: Optional[str] = None
    blood_type: Optional[str] = None
    military_status: Optional[MilitaryStatus] = None
    governorate: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    home_phone: Optional[str] = None
    mobile_phone: Optional[str] = None
    mobile_phone_2: Optional[str] = None
    email: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_relation: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    education_level: Optional[EducationLevel] = None
    university: Optional[str] = None
    faculty: Optional[str] = None
    graduation_year: Optional[int] = None
    grade_value: Optional[str] = None
    job_title_arabic: Optional[str] = None
    job_title_english: Optional[str] = None
    department_id: Optional[str] = None
    position_id: Optional[str] = None
    direct_manager_id: Optional[str] = None
    work_location_id: Optional[str] = None
    employment_type: Optional[EmploymentType] = None
    contract_type: Optional[ContractType] = None
    hiring_date: Optional[date] = None
    contract_start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    probation_end_date: Optional[date] = None
    actual_termination_date: Optional[date] = None
    basic_salary: Optional[Decimal] = None
    housing_allowance: Optional[Decimal] = None
    transportation_allowance: Optional[Decimal] = None
    food_allowance: Optional[Decimal] = None
    other_allowances: Optional[Decimal] = None
    is_insured: bool = False
    insurance_number: Optional[str] = None
    insurance_office: Optional[str] = None
    insurance_start_date: Optional[date] = None
    insurance_salary: Optional[Decimal] = None
    bank_name: Optional[str] = None
    bank_branch: Optional[str] = None
    bank_account_number: Optional[str] = None
    status: Optional[EmployeeStatus] = None
    photo_url: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    department_name: Optional[str] = None
    position_name: Optional[str] = None
    manager_name: Optional[str] = None


class EmployeeListResponse(BaseModel):
    items: list[EmployeeResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class EmployeeFilter(BaseModel):
    department_id: Optional[str] = None
    status: Optional[EmployeeStatus] = None
    employment_type: Optional[EmploymentType] = None
    contract_type: Optional[ContractType] = None
    gender: Optional[Gender] = None
    work_location_id: Optional[str] = None
    search: Optional[str] = None
    page: int = 1
    page_size: int = 20
