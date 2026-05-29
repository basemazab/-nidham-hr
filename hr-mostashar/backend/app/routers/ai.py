import uuid
from datetime import datetime, timezone, timedelta, date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.question import Question
from app.models.subscription import Subscription, PlanType, SubscriptionStatus
from app.schemas import ChatRequest, ChatResponse, ConversationMessage, ConversationSummary
from app.routers.auth import get_current_user
from app.models.user import User
from app.services.ai_service import get_ai_response
from app.models.usage import Usage, FeatureType

router = APIRouter(prefix="/ai", tags=["الذكاء الاصطناعي"])


def get_month_period():
    now = date.today()
    month_start = now.replace(day=1)
    next_month = (month_start + timedelta(days=32)).replace(day=1)
    return month_start, next_month


async def check_chat_limit(user_id: str, db: AsyncSession) -> bool:
    result = await db.execute(select(Subscription).where(Subscription.user_id == user_id).order_by(Subscription.created_at.desc()).limit(1))
    sub = result.scalar_one_or_none()
    if sub and sub.plan != PlanType.free and sub.status == SubscriptionStatus.active:
        return True

    month_start, _ = get_month_period()
    result = await db.execute(
        select(Usage).where(
            Usage.user_id == user_id,
            Usage.feature == FeatureType.chat,
            Usage.period_start >= month_start,
        )
    )
    usage = result.scalar_one_or_none()
    if usage:
        return usage.count < 5
    return True


async def increment_usage(user_id: str, feature: FeatureType, db: AsyncSession):
    month_start, period_end = get_month_period()
    result = await db.execute(
        select(Usage).where(
            Usage.user_id == user_id,
            Usage.feature == feature,
            Usage.period_start >= month_start,
        )
    )
    usage = result.scalar_one_or_none()
    if usage:
        usage.count += 1
    else:
        usage = Usage(
            id=str(uuid.uuid4()),
            user_id=user_id,
            feature=feature,
            count=1,
            period_start=month_start,
            period_end=period_end,
        )
        db.add(usage)


@router.post("/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    limit_ok = await check_chat_limit(user.id, db)
    if not limit_ok:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="تم تجاوز حد الأسئلة المجانية. اشترك في Pro للاستمرار.")

    history = []
    if body.conversation_id:
        result = await db.execute(
            select(Question)
            .where(Question.user_id == user.id, Question.conversation_id == body.conversation_id)
            .order_by(Question.created_at)
            .limit(10)
        )
        questions = result.scalars().all()
        for q in questions:
            history.append({"role": "user", "content": q.question})
            history.append({"role": "assistant", "content": q.answer})

    ai_result = await get_ai_response(body.message, history)

    conv_id = body.conversation_id or str(uuid.uuid4())

    question = Question(
        id=str(uuid.uuid4()),
        user_id=user.id,
        conversation_id=conv_id,
        question=body.message,
        answer=ai_result["answer"],
        references=ai_result["references"],
        tokens_used=ai_result["tokens_used"],
    )
    db.add(question)

    await increment_usage(user.id, FeatureType.chat, db)

    await db.flush()

    return ChatResponse(
        answer=ai_result["answer"],
        references=ai_result["references"],
        tokens_used=ai_result["tokens_used"],
        conversation_id=conv_id,
    )


@router.post("/bot/chat")
async def bot_chat(
    body: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    ai_result = await get_ai_response(body.message, [])

    return {
        "answer": ai_result["answer"],
        "references": ai_result["references"],
        "tokens_used": ai_result["tokens_used"],
    }


@router.get("/conversations")
async def get_conversations(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(
        select(Question.conversation_id, Question.question, Question.created_at)
        .where(Question.user_id == user.id)
        .order_by(Question.created_at.desc())
    )
    rows = result.all()

    seen = set()
    conversations = []
    for conv_id, question, created_at in rows:
        if conv_id not in seen:
            seen.add(conv_id)
            conversations.append(ConversationSummary(
                conversation_id=conv_id,
                last_message=question[:100],
                message_count=0,
                created_at=created_at,
            ))

    for conv in conversations:
        count_result = await db.execute(
            select(func.count()).select_from(Question).where(Question.conversation_id == conv.conversation_id)
        )
        conv.message_count = count_result.scalar()

    return conversations


@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Question)
        .where(Question.user_id == user.id, Question.conversation_id == conversation_id)
        .order_by(Question.created_at)
    )
    questions = result.scalars().all()
    return [
        ConversationMessage(
            id=q.id,
            question=q.question,
            answer=q.answer,
            references=q.references or [],
            created_at=q.created_at,
        )
        for q in questions
    ]
