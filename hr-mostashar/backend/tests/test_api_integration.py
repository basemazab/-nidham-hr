import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.database import async_session, Base, engine
import asyncio


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    async def _setup():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)

        from app.models.user import User
        from app.models.subscription import Subscription, PlanType, SubscriptionStatus
        from app.utils.auth_utils import hash_password
        from app.config import get_settings
        import uuid

        settings = get_settings()
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

    asyncio.run(_setup())


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def auth_token(client: AsyncClient):
    import uuid
    email = f"test-{uuid.uuid4().hex[:8]}@test.com"
    resp = await client.post("/api/auth/register", json={
        "email": email,
        "full_name": "Test User",
        "password": "testpass123",
    })
    assert resp.status_code == 200
    return resp.json()["access_token"]


@pytest.fixture
async def admin_token(client: AsyncClient):
    resp = await client.post("/api/auth/login", json={
        "email": "admin@hrmostashar.com",
        "password": "admin123",
    })
    assert resp.status_code == 200
    return resp.json()["access_token"]


def headers(token: str):
    return {"Authorization": f"Bearer {token}"}


class TestAuthEndpoints:
    async def test_register(self, client: AsyncClient):
        import uuid
        email = f"new-{uuid.uuid4().hex[:8]}@test.com"
        resp = await client.post("/api/auth/register", json={
            "email": email,
            "full_name": "New User",
            "password": "newpass123",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["user"]["email"] == email

    async def test_login_wrong_password(self, client: AsyncClient):
        resp = await client.post("/api/auth/login", json={
            "email": "admin@hrmostashar.com",
            "password": "wrongpass",
        })
        assert resp.status_code == 401

    async def test_get_me(self, client: AsyncClient, auth_token: str):
        resp = await client.get("/api/auth/me", headers=headers(auth_token))
        assert resp.status_code == 200
        assert resp.json()["email"] is not None


class TestCalculatorEndpoints:
    async def test_end_of_service(self, client: AsyncClient, auth_token: str):
        resp = await client.post("/api/calc/end-of-service", json={
            "fields": {
                "start_date": "2020-01-01",
                "end_date": "2024-12-31",
                "total_salary": 5000,
            }
        }, headers=headers(auth_token))
        assert resp.status_code == 200
        data = resp.json()
        assert "reward" in data
        assert data["years_of_service"] > 0

    async def test_insurance(self, client: AsyncClient, auth_token: str):
        resp = await client.post("/api/calc/insurance", json={
            "fields": {"gross_salary": 8000}
        }, headers=headers(auth_token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["insurance_base"] == 8000

    async def test_leaves(self, client: AsyncClient, auth_token: str):
        resp = await client.post("/api/calc/leaves", json={
            "fields": {
                "start_date": "2015-01-01",
                "current_date": "2025-12-31",
                "taken_days": 5,
                "employee_age": 40,
            }
        }, headers=headers(auth_token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["annual_leave"]["total"] == 30

    async def test_net_salary(self, client: AsyncClient, auth_token: str):
        resp = await client.post("/api/calc/net-salary", json={
            "fields": {
                "gross_salary": 10000,
                "marital_status": "single",
                "dependents": 0,
            }
        }, headers=headers(auth_token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["net_monthly"] < data["gross_monthly"]


class TestTemplatesEndpoints:
    async def test_list_templates(self, client: AsyncClient, auth_token: str):
        resp = await client.get("/api/templates", headers=headers(auth_token))
        assert resp.status_code == 200
        data = resp.json()
        assert "عقود" in data

    async def test_get_template(self, client: AsyncClient, auth_token: str):
        resp = await client.get("/api/templates/employment-fixed", headers=headers(auth_token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == "employment-fixed"

    async def test_generate_template_docx(self, client: AsyncClient, auth_token: str):
        resp = await client.post("/api/templates/employment-fixed/generate", json={
            "custom_fields": {
                "employee_name": "Test",
                "company_name": "Test Co",
                "start_date": "2024-01-01",
                "end_date": "2025-01-01",
                "salary": "5000",
                "job_title": "Engineer",
            },
            "format": "docx",
        }, headers=headers(auth_token))
        assert resp.status_code == 200


class TestSubscriptionEndpoints:
    async def test_get_plans(self, client: AsyncClient):
        resp = await client.get("/api/subscriptions/plans")
        assert resp.status_code == 200
        data = resp.json()
        assert "pro" in data

    async def test_get_usage(self, client: AsyncClient, auth_token: str):
        resp = await client.get("/api/subscriptions/usage", headers=headers(auth_token))
        assert resp.status_code == 200

    async def test_get_my_subscription(self, client: AsyncClient, auth_token: str):
        resp = await client.get("/api/subscriptions/my-subscription", headers=headers(auth_token))
        assert resp.status_code == 200

    async def test_admin_stats(self, client: AsyncClient, admin_token: str):
        resp = await client.get("/api/subscriptions/admin/stats", headers=headers(admin_token))
        assert resp.status_code == 200
        data = resp.json()
        assert "total_users" in data


class TestHealthEndpoints:
    async def test_root(self, client: AsyncClient):
        resp = await client.get("/")
        assert resp.status_code == 200
        assert "message" in resp.json()

    async def test_health(self, client: AsyncClient):
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"
