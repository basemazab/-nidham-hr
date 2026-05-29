import uuid
import enum
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import Column, String, Date, DateTime, Text, Boolean, Integer, Float, Enum, ForeignKey, Numeric, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Gender(str, enum.Enum):
    male = "male"
    female = "female"


class MaritalStatus(str, enum.Enum):
    single = "single"
    married = "married"
    divorced = "divorced"
    widowed = "widowed"


class MilitaryStatus(str, enum.Enum):
    completed = "completed"
    exempted = "exempted"
    postponed = "postponed"
    not_required = "not_required"


class EducationLevel(str, enum.Enum):
    primary = "primary"
    preparatory = "preparatory"
    secondary = "secondary"
    diploma = "diploma"
    bachelor = "bachelor"
    master = "master"
    phd = "phd"


class EmploymentType(str, enum.Enum):
    permanent = "permanent"
    temporary = "temporary"
    contract = "contract"
    internship = "internship"
    consultant = "consultant"
    part_time = "part_time"


class ContractType(str, enum.Enum):
    fixed_term = "fixed_term"
    unlimited = "unlimited"


class EmployeeStatus(str, enum.Enum):
    active = "active"
    long_leave = "long_leave"
    suspended = "suspended"
    terminated = "terminated"
    resigned = "resigned"
    dismissed = "dismissed"


class LegalEntity(str, enum.Enum):
    individual = "individual"
    partnership = "partnership"
    corporation = "corporation"
    other = "other"


class PositionGrade(str, enum.Enum):
    manager = "manager"
    senior_manager = "senior_manager"
    head_of_dept = "head_of_dept"
    specialist = "specialist"
    technician = "technician"
    worker = "worker"


class WorkLocationType(str, enum.Enum):
    factory = "factory"
    office = "office"
    branch = "branch"
    warehouse = "warehouse"


class Company(Base):
    __tablename__ = "companies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name_ar = Column(String(255), nullable=False)
    name_en = Column(String(255), nullable=False)
    commercial_register = Column(String(100))
    tax_card = Column(String(100))
    insurance_register = Column(String(100))
    activity = Column(String(255))
    establishment_date = Column(Date)
    legal_entity = Column(Enum(LegalEntity), default=LegalEntity.individual)
    address = Column(Text)
    phone = Column(String(50))
    email = Column(String(255))
    website = Column(String(255))
    logo_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    branches = relationship("Branch", back_populates="company")
    departments = relationship("Department", back_populates="company")


class Branch(Base):
    __tablename__ = "branches"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id"))
    name_ar = Column(String(255), nullable=False)
    name_en = Column(String(255))
    address = Column(Text)
    manager_id = Column(String(36))
    phone = Column(String(50))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="branches")


class Department(Base):
    __tablename__ = "departments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    parent_id = Column(String(36), ForeignKey("departments.id"), nullable=True)
    company_id = Column(String(36), ForeignKey("companies.id"))
    name_ar = Column(String(255), nullable=False)
    name_en = Column(String(255))
    code = Column(String(50), unique=True)
    manager_id = Column(String(36))
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    parent = relationship("Department", remote_side=[id], backref="children")
    company = relationship("Company", back_populates="departments")
    positions = relationship("Position", back_populates="department")
    employees = relationship("Employee", back_populates="department")


class Position(Base):
    __tablename__ = "positions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    department_id = Column(String(36), ForeignKey("departments.id"))
    title_ar = Column(String(255), nullable=False)
    title_en = Column(String(255))
    grade = Column(Enum(PositionGrade))
    job_description = Column(Text)
    requirements = Column(Text)
    salary_range_min = Column(Numeric(12, 2), default=0)
    salary_range_max = Column(Numeric(12, 2))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    department = relationship("Department", back_populates="positions")
    employees = relationship("Employee", back_populates="position")


class WorkLocation(Base):
    __tablename__ = "work_locations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id"))
    name = Column(String(255), nullable=False)
    address = Column(Text)
    location_type = Column(Enum(WorkLocationType))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    employees = relationship("Employee", back_populates="work_location")


class Employee(Base):
    __tablename__ = "employees"
    __table_args__ = (
        Index("idx_employee_code", "employee_code", unique=True),
        Index("idx_employee_national_id", "national_id"),
        Index("idx_employee_department", "department_id"),
        Index("idx_employee_status", "status"),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    employee_code = Column(String(50), unique=True, nullable=False)

    first_name = Column(String(100), nullable=False)
    middle_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    full_name_arabic = Column(String(255))
    full_name_english = Column(String(255))

    national_id = Column(String(14), unique=True)
    date_of_birth = Column(Date)
    gender = Column(Enum(Gender))
    marital_status = Column(Enum(MaritalStatus), default=MaritalStatus.single)
    nationality = Column(String(100), default="Egyptian")
    religion = Column(String(50))
    blood_type = Column(String(10))
    military_status = Column(Enum(MilitaryStatus))

    governorate = Column(String(100))
    city = Column(String(100))
    address = Column(Text)
    home_phone = Column(String(50))
    mobile_phone = Column(String(50))
    mobile_phone_2 = Column(String(50))
    email = Column(String(255), unique=True)

    emergency_contact_name = Column(String(200))
    emergency_contact_relation = Column(String(100))
    emergency_contact_phone = Column(String(50))

    education_level = Column(Enum(EducationLevel))
    university = Column(String(255))
    faculty = Column(String(255))
    graduation_year = Column(Integer)
    grade_value = Column(String(50))

    job_title_arabic = Column(String(255))
    job_title_english = Column(String(255))
    department_id = Column(String(36), ForeignKey("departments.id"))
    position_id = Column(String(36), ForeignKey("positions.id"))
    direct_manager_id = Column(String(36), ForeignKey("employees.id"))
    work_location_id = Column(String(36), ForeignKey("work_locations.id"))
    employment_type = Column(Enum(EmploymentType), default=EmploymentType.permanent)
    contract_type = Column(Enum(ContractType), default=ContractType.unlimited)

    hiring_date = Column(Date)
    contract_start_date = Column(Date)
    contract_end_date = Column(Date)
    probation_end_date = Column(Date)
    actual_termination_date = Column(Date)

    basic_salary = Column(Numeric(12, 2), default=0)
    housing_allowance = Column(Numeric(12, 2), default=0)
    transportation_allowance = Column(Numeric(12, 2), default=0)
    food_allowance = Column(Numeric(12, 2), default=0)
    other_allowances = Column(Numeric(12, 2), default=0)

    is_insured = Column(Boolean, default=False)
    insurance_number = Column(String(100))
    insurance_office = Column(String(200))
    insurance_start_date = Column(Date)
    insurance_salary = Column(Numeric(12, 2))

    bank_name = Column(String(200))
    bank_branch = Column(String(200))
    bank_account_number = Column(String(100))

    status = Column(Enum(EmployeeStatus), default=EmployeeStatus.active)
    photo_url = Column(String(500))
    notes = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(36))

    department = relationship("Department", back_populates="employees")
    position = relationship("Position", back_populates="employees")
    work_location = relationship("WorkLocation", back_populates="employees")
    direct_manager = relationship("Employee", remote_side=[id], backref="subordinates")
    documents = relationship("EmployeeDocument", back_populates="employee", cascade="all, delete-orphan")


class EmployeeDocument(Base):
    __tablename__ = "employee_documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    employee_id = Column(String(36), ForeignKey("employees.id"), nullable=False)
    document_type = Column(String(100), nullable=False)
    document_number = Column(String(100))
    issue_date = Column(Date)
    expiry_date = Column(Date)
    issuer = Column(String(255))
    file_url = Column(String(500))
    is_required = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee", back_populates="documents")
