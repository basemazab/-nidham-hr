from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.hrms import WorkLocation
from app.schemas.hrms import WorkLocationCreate, WorkLocationResponse

router = APIRouter(prefix="/work-locations", tags=["مواقع العمل"])


@router.get("", response_model=list[WorkLocationResponse])
async def list_work_locations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WorkLocation).where(WorkLocation.is_active == True))
    return result.scalars().all()


@router.post("", response_model=WorkLocationResponse, status_code=201)
async def create_work_location(body: WorkLocationCreate, db: AsyncSession = Depends(get_db)):
    location = WorkLocation(**body.model_dump())
    db.add(location)
    await db.flush()
    await db.refresh(location)
    return location


@router.get("/{location_id}", response_model=WorkLocationResponse)
async def get_work_location(location_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WorkLocation).where(WorkLocation.id == location_id))
    location = result.scalar_one_or_none()
    if not location:
        raise HTTPException(status_code=404, detail="موقع العمل غير موجود")
    return location


@router.put("/{location_id}", response_model=WorkLocationResponse)
async def update_work_location(location_id: str, body: WorkLocationCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WorkLocation).where(WorkLocation.id == location_id))
    location = result.scalar_one_or_none()
    if not location:
        raise HTTPException(status_code=404, detail="موقع العمل غير موجود")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(location, field, value)
    await db.flush()
    await db.refresh(location)
    return location


@router.delete("/{location_id}")
async def delete_work_location(location_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WorkLocation).where(WorkLocation.id == location_id))
    location = result.scalar_one_or_none()
    if not location:
        raise HTTPException(status_code=404, detail="موقع العمل غير موجود")
    location.is_active = False
    await db.flush()
    return {"status": "deleted"}
