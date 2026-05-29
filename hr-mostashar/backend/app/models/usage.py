import uuid
import enum
from datetime import date
from sqlalchemy import String, Integer, Date, Enum as SAEnum, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class FeatureType(enum.Enum):
    chat = "chat"
    calculator = "calculator"
    template = "template"


class Usage(Base):
    __tablename__ = "usage_tracking"
    __table_args__ = (
        UniqueConstraint("user_id", "feature", "period_start", name="uq_usage_user_feature_period"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    feature: Mapped[FeatureType] = mapped_column(SAEnum(FeatureType), nullable=False)
    count: Mapped[int] = mapped_column(Integer, default=0)
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
