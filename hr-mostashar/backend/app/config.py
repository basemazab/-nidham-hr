from pydantic_settings import BaseSettings
from pydantic import ConfigDict, model_validator
from functools import lru_cache
import warnings


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", case_sensitive=False)
    app_name: str = "مستشار HR"
    app_env: str = "development"
    debug: bool = True
    secret_key: str = "dev-secret-key-change-in-production"
    api_prefix: str = "/api"

    database_url: str = "sqlite+aiosqlite:///./hr_mostashar.db"

    redis_url: str = "redis://localhost:6379/0"

    jwt_secret_key: str = "dev-jwt-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440  # 24 hours (reduced from 30 days)

    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"

    rate_limit_free_questions_per_month: int = 5
    rate_limit_free_templates_per_month: int = 3

    admin_email: str = "admin@hrmostashar.com"
    admin_password: str = "admin123"

    allowed_origins: str = "http://localhost:3000,http://localhost:8000"

    telegram_bot_token: str = ""

    vodafone_cash_number: str = ""
    instapay_number: str = ""
    bank_account: str = ""
    bank_name: str = ""

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    @model_validator(mode="after")
    def validate_secrets(self):
        """Validate that secrets are changed from defaults in production."""
        if self.app_env == "production":
            if self.secret_key == "dev-secret-key-change-in-production":
                warnings.warn(
                    "CRITICAL: SECRET_KEY is using default value! Set SECRET_KEY in .env",
                    RuntimeWarning,
                )
            if self.jwt_secret_key == "dev-jwt-secret-key-change-in-production":
                warnings.warn(
                    "CRITICAL: JWT_SECRET_KEY is using default value! Set JWT_SECRET_KEY in .env",
                    RuntimeWarning,
                )
            if self.admin_password == "admin123":
                warnings.warn(
                    "CRITICAL: ADMIN_PASSWORD is using default value! Set ADMIN_PASSWORD in .env",
                    RuntimeWarning,
                )
            if not self.gemini_api_key:
                warnings.warn(
                    "WARNING: GEMINI_API_KEY is not set. AI features will not work.",
                    RuntimeWarning,
                )
        return self


@lru_cache()
def get_settings() -> Settings:
    return Settings()
