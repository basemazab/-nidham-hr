from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.hrms import Employee, Department, Position
from app.schemas.hrms import (
    EmployeeCreate, EmployeeUpdate, EmployeeResponse,
    EmployeeListResponse, EmployeeFilter,
)
import math

router = APIRouter(prefix="/employees", tags=["الموظفون"])


@router.get("", response_model=EmployeeListResponse)
async def list_employees(
    department_id: str = Query(None),
    status: str = Query(None),
    employment_type: str = Query(None),
    search: str = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Employee)
    count_query = select(func.count(Employee.id))

    if department_id:
        query = query.where(Employee.department_id == department_id)
        count_query = count_query.where(Employee.department_id == department_id)
    if status:
        query = query.where(Employee.status == status)
        count_query = count_query.where(Employee.status == status)
    if employment_type:
        query = query.where(Employee.employment_type == employment_type)
        count_query = count_query.where(Employee.employment_type == employment_type)
    if search:
        like = f"%{search}%"
        search_cond = or_(
            Employee.first_name.like(like),
            Employee.middle_name.like(like),
            Employee.last_name.like(like),
            Employee.employee_code.like(like),
            Employee.national_id.like(like),
            Employee.email.like(like),
        )
        query = query.where(search_cond)
        count_query = count_query.where(search_cond)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    total_pages = math.ceil(total / page_size)

    query = query.order_by(Employee.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    employees = result.scalars().all()

    items = []
    for emp in employees:
        emp_dict = {
            c.name: getattr(emp, c.name) for c in Employee.__table__.columns
        }
        items.append(EmployeeResponse(**emp_dict))

    return EmployeeListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("", response_model=EmployeeResponse, status_code=201)
async def create_employee(body: EmployeeCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(func.coalesce(func.max(Employee.employee_code), "EMP-0000")))
    last_code = result.scalar()
    next_num = int(last_code.split("-")[1]) + 1
    employee_code = f"EMP-{str(next_num).zfill(4)}"

    emp_data = body.model_dump()
    emp_data["employee_code"] = employee_code

    employee = Employee(**emp_data)
    db.add(employee)
    await db.flush()
    await db.refresh(employee)

    emp_dict = {c.name: getattr(employee, c.name) for c in Employee.__table__.columns}
    return EmployeeResponse(**emp_dict)


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    total_result = await db.execute(select(func.count(Employee.id)))
    total = total_result.scalar() or 0

    active_result = await db.execute(select(func.count(Employee.id)).where(Employee.status == "active"))
    active = active_result.scalar() or 0

    leave_result = await db.execute(select(func.count(Employee.id)).where(Employee.status == "long_leave"))
    on_leave = leave_result.scalar() or 0

    male_result = await db.execute(select(func.count(Employee.id)).where(Employee.gender == "male"))
    male = male_result.scalar() or 0

    female_result = await db.execute(select(func.count(Employee.id)).where(Employee.gender == "female"))
    female = female_result.scalar() or 0

    salary_result = await db.execute(
        select(func.avg(Employee.basic_salary)).where(Employee.status == "active")
    )
    avg_salary = salary_result.scalar() or 0

    payroll_result = await db.execute(
        select(func.sum(Employee.basic_salary)).where(Employee.status == "active")
    )
    total_payroll = payroll_result.scalar() or 0

    return {
        "total_employees": total,
        "active_employees": active,
        "on_leave": on_leave,
        "new_this_month": 0,
        "male": male,
        "female": female,
        "avg_salary": str(avg_salary),
        "total_payroll": str(total_payroll),
    }


@router.get("/{employee_id}", response_model=EmployeeResponse)
async def get_employee(employee_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="الموظف غير موجود")
    emp_dict = {c.name: getattr(employee, c.name) for c in Employee.__table__.columns}
    return EmployeeResponse(**emp_dict)


@router.put("/{employee_id}", response_model=EmployeeResponse)
async def update_employee(employee_id: str, body: EmployeeUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="الموظف غير موجود")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(employee, field, value)
    await db.flush()
    await db.refresh(employee)
    emp_dict = {c.name: getattr(employee, c.name) for c in Employee.__table__.columns}
    return EmployeeResponse(**emp_dict)


@router.delete("/{employee_id}")
async def delete_employee(employee_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="الموظف غير موجود")
    employee.status = "terminated"
    await db.flush()
    return {"status": "deleted"}
