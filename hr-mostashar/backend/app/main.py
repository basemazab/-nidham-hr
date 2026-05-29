from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import get_settings
from app.database import engine, Base
from app.routers import auth, ai, calculators, templates, subscriptions, companies, departments, positions, employees, work_locations
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

settings = get_settings()

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    from app.database import async_session
    from app.models.user import User
    from app.utils.auth_utils import hash_password
    from app.models.subscription import Subscription, PlanType, SubscriptionStatus
    from datetime import datetime, timezone, timedelta
    import uuid

    async with async_session() as session:
        from sqlalchemy import select
        result = await session.execute(select(User).where(User.email == settings.admin_email))
        admin = result.scalar_one_or_none()
        if not admin:
            admin = User(
                id=str(uuid.uuid4()),
                email=settings.admin_email,
                full_name="Admin",
                password_hash=hash_password(settings.admin_password),
                is_admin=True,
            )
            session.add(admin)
            await session.flush()
            sub = Subscription(
                id=str(uuid.uuid4()),
                user_id=admin.id,
                plan=PlanType.lifetime,
                status=SubscriptionStatus.active,
                expires_at=None,
            )
            session.add(sub)
            await session.commit()
            print(f"[OK] Admin account created: {settings.admin_email}")
        else:
            print(f"[OK] Admin account ready: {settings.admin_email}")

    yield


app = FastAPI(
    title=settings.app_name,
    description="مستشار HR - مساعد قانون العمل المصري الذكي",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    max_age=3600,
)

app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(ai.router, prefix=settings.api_prefix)
app.include_router(calculators.router, prefix=settings.api_prefix)
app.include_router(templates.router, prefix=settings.api_prefix)
app.include_router(subscriptions.router, prefix=settings.api_prefix)
app.include_router(companies.router, prefix=f"{settings.api_prefix}/hrms")
app.include_router(departments.router, prefix=f"{settings.api_prefix}/hrms")
app.include_router(positions.router, prefix=f"{settings.api_prefix}/hrms")
app.include_router(work_locations.router, prefix=f"{settings.api_prefix}/hrms")
app.include_router(employees.router, prefix=f"{settings.api_prefix}/hrms")


@app.get("/")
async def root():
    return {"message": "مستشار HR API", "version": "1.0.0", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
