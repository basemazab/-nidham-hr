from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.hrms import Position
from app.schemas.hrms import PositionCreate, PositionResponse

router = APIRouter(prefix="/positions", tags=["الوظائف"])


@router.get("", response_model=list[PositionResponse])
async def list_positions(
    department_id: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Position).where(Position.is_active == True)
    if department_id:
        query = query.where(Position.department_id == department_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=PositionResponse, status_code=201)
async def create_position(body: PositionCreate, db: AsyncSession = Depends(get_db)):
    position = Position(**body.model_dump())
    db.add(position)
    await db.flush()
    await db.refresh(position)
    return position


@router.get("/{position_id}", response_model=PositionResponse)
async def get_position(position_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Position).where(Position.id == position_id))
    position = result.scalar_one_or_none()
    if not position:
        raise HTTPException(status_code=404, detail="الوظيفة غير موجودة")
    return position


@router.put("/{position_id}", response_model=PositionResponse)
async def update_position(position_id: str, body: PositionCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Position).where(Position.id == position_id))
    position = result.scalar_one_or_none()
    if not position:
        raise HTTPException(status_code=404, detail="الوظيفة غير موجودة")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(position, field, value)
    await db.flush()
    await db.refresh(position)
    return position


@router.delete("/{position_id}")
async def delete_position(position_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Position).where(Position.id == position_id))
    position = result.scalar_one_or_none()
    if not position:
        raise HTTPException(status_code=404, detail="الوظيفة غير موجودة")
    position.is_active = False
    await db.flush()
    return {"status": "deleted"}
