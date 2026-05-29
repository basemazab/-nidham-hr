from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.hrms import Department
from app.schemas.hrms import DepartmentCreate, DepartmentUpdate, DepartmentResponse

router = APIRouter(prefix="/departments", tags=["الاقسام"])


@router.get("", response_model=list[DepartmentResponse])
async def list_departments(
    company_id: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Department).where(Department.is_active == True)
    if company_id:
        query = query.where(Department.company_id == company_id)
    result = await db.execute(query.order_by(Department.code))
    return result.scalars().all()


@router.post("", response_model=DepartmentResponse, status_code=201)
async def create_department(body: DepartmentCreate, db: AsyncSession = Depends(get_db)):
    department = Department(**body.model_dump())
    db.add(department)
    await db.flush()
    await db.refresh(department)
    return department


@router.get("/{department_id}", response_model=DepartmentResponse)
async def get_department(department_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Department).where(Department.id == department_id))
    department = result.scalar_one_or_none()
    if not department:
        raise HTTPException(status_code=404, detail="القسم غير موجود")
    return department


@router.put("/{department_id}", response_model=DepartmentResponse)
async def update_department(department_id: str, body: DepartmentUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Department).where(Department.id == department_id))
    department = result.scalar_one_or_none()
    if not department:
        raise HTTPException(status_code=404, detail="القسم غير موجود")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(department, field, value)
    await db.flush()
    await db.refresh(department)
    return department


@router.delete("/{department_id}")
async def delete_department(department_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Department).where(Department.id == department_id))
    department = result.scalar_one_or_none()
    if not department:
        raise HTTPException(status_code=404, detail="القسم غير موجود")
    department.is_active = False
    await db.flush()
    return {"status": "deleted"}
