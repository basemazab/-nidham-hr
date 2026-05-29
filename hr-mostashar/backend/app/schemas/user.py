import uuid
from datetime import datetime, date
from enum import Enum
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class PlanType(str, Enum):
    free = "free"
    pro = "pro"
    business = "business"
    lifetime = "lifetime"


class SubscriptionStatus(str, Enum):
    active = "active"
    expired = "expired"
    pending = "pending"
    cancelled = "cancelled"


class FeatureType(str, Enum):
    chat = "chat"
    calculator = "calculator"
    template = "template"


class UserRegister(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    password: str = Field(..., min_length=6)
    phone: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    phone: str | None = None
    is_active: bool
    is_admin: bool
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000)
    conversation_id: str | None = None


class ChatResponse(BaseModel):
    answer: str
    references: list[str] = []
    tokens_used: int = 0
    conversation_id: str


class CalculatorInput(BaseModel):
    fields: dict


class TemplateGenerateRequest(BaseModel):
    custom_fields: dict
    format: str = Field(..., pattern="^(docx|pdf)$")


class SubscriptionRequest(BaseModel):
    plan: PlanType
    payment_reference: str | None = None
    payment_receipt_url: str | None = None


class UsageResponse(BaseModel):
    feature: FeatureType
    count: int
    limit: int
    remaining: int


class ConversationMessage(BaseModel):
    id: str
    question: str
    answer: str
    references: list[str] = []
    created_at: datetime


class ConversationSummary(BaseModel):
    conversation_id: str
    last_message: str
    message_count: int
    created_at: datetime
