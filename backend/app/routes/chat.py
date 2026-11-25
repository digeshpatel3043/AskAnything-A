from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.errors import AppError
from app.models import Conversation, Message
from app.schemas import ChatRequest, ChatResponse
from app.services import gemini_service

router = APIRouter(tags=["chat"])


def _title_from(text: str) -> str:
    one_line = " ".join(text.split())
    return one_line if len(one_line) <= 50 else one_line[:47].rstrip() + "..."


@router.post("/chat", response_model=ChatResponse)
def chat(body: ChatRequest, db: Session = Depends(get_db)):
    settings = get_settings()

    if len(body.message) > settings.MAX_MESSAGE_CHARS:
        raise AppError(
            422,
            "message_too_long",
            f"Message is too long (max {settings.MAX_MESSAGE_CHARS} characters).",
        )

    conv: Conversation | None = None
    if body.conversation_id:
        conv = db.get(Conversation, body.conversation_id)
        if conv is None:
            raise AppError(404, "not_found", "Conversation not found.")

    # Existing messages as (role, text) context for the model.
    existing = list(conv.messages) if conv else []

    if body.regenerate:
        if conv is None or not existing:
            raise AppError(400, "bad_request", "Nothing to regenerate.")
        if existing[-1].role != "assistant":
            raise AppError(400, "bad_request", "The last message is not an AI answer.")
        context = existing[:-1]
        if not context or context[-1].role != "user":
            raise AppError(400, "bad_request", "Nothing to regenerate.")
        history = [(m.role, m.content) for m in context]
    else:
        if not body.message:
            raise AppError(422, "empty_message", "Please enter a message.")
        history = [(m.role, m.content) for m in existing]
        history.append(("user", body.message))

    history = history[-settings.MAX_CONTEXT_MESSAGES :]
    # Gemini expects the conversation to start with a user turn.
    while history and history[0][0] != "user":
        history.pop(0)

    tool = conv.tool if conv else body.tool

    # Call the model first: nothing is stored if the request fails, so the
    # client can simply retry the same request.
    answer = gemini_service.generate_reply(history, tool)

    now = datetime.now(timezone.utc)
    user_msg: Message | None = None
    if conv is None:
        conv = Conversation(title=_title_from(body.message), tool=body.tool)
        db.add(conv)
        db.flush()

    if body.regenerate:
        db.delete(existing[-1])
        db.flush()
        seq = len(existing) - 1
    else:
        seq = len(existing)
        user_msg = Message(conversation_id=conv.id, role="user", content=body.message,
                           seq=seq, created_at=now)
        db.add(user_msg)
        seq += 1

    ai_msg = Message(conversation_id=conv.id, role="assistant", content=answer,
                     seq=seq, created_at=datetime.now(timezone.utc))
    db.add(ai_msg)
    conv.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(conv)
    db.refresh(ai_msg)
    if user_msg is not None:
        db.refresh(user_msg)

    return ChatResponse(conversation=conv, user_message=user_msg, assistant_message=ai_msg)
