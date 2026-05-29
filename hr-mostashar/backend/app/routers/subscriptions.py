import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.subscription import Subscription, PlanType, SubscriptionStatus
from app.models.user import User
from app.models.usage import Usage, FeatureType
from app.routers.auth import get_current_user, get_current_admin
from app.schemas import SubscriptionRequest, UsageResponse
from app.config import get_settings

router = APIRouter(prefix="/subscriptions", tags=["الاشتراكات"])
settings = get_settings()

PLANS = {
    "free": {"name": "مجاني", "price": 0, "features": ["5 أسئلة/شهر", "3 نماذج/شهر", "حاسبة واحدة"]},
    "pro": {"name": "احترافي", "price": 49, "features": ["أسئلة غير محدودة", "كل النماذج", "كل الحاسبات", "أولوية الرد"]},
    "business": {"name": "أعمال", "price": 299, "features": ["كل مميزات Pro", "5 مستخدمين", "API access", "تقارير"]},
    "lifetime": {"name": "مدى الحياة", "price": 999, "features": ["كل مميزات Pro مدى الحياة"]},
}


@router.get("/plans")
async def get_plans():
    return PLANS


@router.post("/subscribe")
async def subscribe(
    body: SubscriptionRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if body.plan == PlanType.free:
        raise HTTPException(status_code=400, detail="لا يمكن الاشتراك في الخطة المجانية")

    result = await db.execute(select(Subscription).where(Subscription.user_id == user.id).order_by(Subscription.created_at.desc()).limit(1))
    existing = result.scalar_one_or_none()

    if body.plan == PlanType.lifetime:
        expires_at = None
    elif body.plan == PlanType.business:
        expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    else:
        expires_at = datetime.now(timezone.utc) + timedelta(days=30)

    if existing:
        existing.plan = body.plan
        existing.status = SubscriptionStatus.pending
        existing.payment_reference = body.payment_reference
        existing.payment_receipt = body.payment_receipt_url
        existing.expires_at = expires_at
    else:
        subscription = Subscription(
            id=str(uuid.uuid4()),
            user_id=user.id,
            plan=body.plan,
            status=SubscriptionStatus.pending,
            payment_reference=body.payment_reference,
            payment_receipt=body.payment_receipt_url,
            expires_at=expires_at,
        )
        db.add(subscription)

    await db.flush()

    return {"status": "pending", "message": "تم استلام طلبك. سيتم التفعيل خلال 24 ساعة بعد التحقق من الدفع.", "payment_info": {
        "vodafone_cash": settings.vodafone_cash_number,
        "instapay": settings.instapay_number,
        "bank": f"{settings.bank_name} - {settings.bank_account}",
    }}


@router.get("/my-subscription")
async def get_my_subscription(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Subscription).where(Subscription.user_id == user.id).order_by(Subscription.created_at.desc()).limit(1))
    sub = result.scalar_one_or_none()
    if not sub:
        return {"plan": "free", "status": "active", "expires_at": None}
    return {
        "plan": sub.plan.value,
        "status": sub.status.value,
        "started_at": sub.started_at,
        "expires_at": sub.expires_at,
        "payment_reference": sub.payment_reference,
    }


@router.get("/usage")
async def get_usage(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Subscription).where(Subscription.user_id == user.id).order_by(Subscription.created_at.desc()).limit(1))
    sub = result.scalar_one_or_none()
    is_pro = sub and sub.plan != PlanType.free and sub.status == SubscriptionStatus.active

    if is_pro:
        return [
            {"feature": "chat", "count": 0, "limit": -1, "remaining": -1},
            {"feature": "template", "count": 0, "limit": -1, "remaining": -1},
        ]

    from datetime import date
    now = date.today()
    month_start = now.replace(day=1)
    next_month = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)

    usage_data = []
    for feature, limit in [(FeatureType.chat, 5), (FeatureType.template, 3)]:
        result = await db.execute(
            select(Usage).where(
                Usage.user_id == user.id,
                Usage.feature == feature,
                Usage.period_start >= month_start,
            )
        )
        usage = result.scalar_one_or_none()
        count = usage.count if usage else 0
        usage_data.append({
            "feature": feature.value,
            "count": count,
            "limit": limit,
            "remaining": max(0, limit - count),
        })

    return usage_data


@router.post("/upload-receipt")
async def upload_receipt(
    receipt_url: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(Subscription).where(Subscription.user_id == user.id).order_by(Subscription.created_at.desc()).limit(1))
    sub = result.scalar_one_or_none()
    if sub and sub.status == SubscriptionStatus.pending:
        sub.payment_receipt = receipt_url
        await db.flush()
        return {"status": "uploaded", "message": "تم رفع الإيصال. سيتم التفعيل خلال 24 ساعة."}
    raise HTTPException(status_code=400, detail="لا يوجد اشتراك معلق")


# Admin endpoints
@router.get("/admin/pending")
async def get_pending_subscriptions(db: AsyncSession = Depends(get_db), admin: User = Depends(get_current_admin)):
    result = await db.execute(select(Subscription).where(Subscription.status == SubscriptionStatus.pending))
    subs = result.scalars().all()
    return [{"id": s.id, "user_id": s.user_id, "plan": s.plan.value, "payment_reference": s.payment_reference, "created_at": s.created_at} for s in subs]


@router.post("/admin/activate/{subscription_id}")
async def activate_subscription(
    subscription_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    result = await db.execute(select(Subscription).where(Subscription.id == subscription_id))
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="الاشتراك غير موجود")
    sub.status = SubscriptionStatus.active
    if sub.plan == PlanType.lifetime:
        sub.expires_at = None
    else:
        sub.expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    await db.flush()
    return {"status": "activated", "message": "تم تفعيل الاشتراك بنجاح"}


@router.get("/admin/stats")
async def get_stats(db: AsyncSession = Depends(get_db), admin: User = Depends(get_current_admin)):
    users_count = await db.execute(select(func.count(User.id)))
    subs_count = await db.execute(select(func.count(Subscription.id)))
    pending_count = await db.execute(select(func.count(Subscription.id)).where(Subscription.status == SubscriptionStatus.pending))
    active_count = await db.execute(select(func.count(Subscription.id)).where(Subscription.status == SubscriptionStatus.active))
    return {
        "total_users": users_count.scalar(),
        "total_subscriptions": subs_count.scalar(),
        "pending_subscriptions": pending_count.scalar(),
        "active_subscriptions": active_count.scalar(),
    }
