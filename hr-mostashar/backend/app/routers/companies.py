from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.hrms import Company
from app.schemas.hrms import CompanyCreate, CompanyUpdate, CompanyResponse

router = APIRouter(prefix="/companies", tags=["الشركات"])


@router.get("", response_model=list[CompanyResponse])
async def list_companies(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Company).where(Company.is_active == True))
    return result.scalars().all()


@router.post("", response_model=CompanyResponse, status_code=201)
async def create_company(body: CompanyCreate, db: AsyncSession = Depends(get_db)):
    company = Company(**body.model_dump())
    db.add(company)
    await db.flush()
    await db.refresh(company)
    return company


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(company_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="الشركة غير موجودة")
    return company


@router.put("/{company_id}", response_model=CompanyResponse)
async def update_company(company_id: str, body: CompanyUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="الشركة غير موجودة")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(company, field, value)
    await db.flush()
    await db.refresh(company)
    return company


@router.delete("/{company_id}")
async def delete_company(company_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="الشركة غير موجودة")
    company.is_active = False
    await db.flush()
    return {"status": "deleted"}
