from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.errors import AppError
from app.models import Conversation
from app.schemas import ConversationDetail, ConversationOut, ConversationRename

router = APIRouter(prefix="/conversations", tags=["conversations"])


def _get_or_404(db: Session, conversation_id: str) -> Conversation:
    conv = db.get(Conversation, conversation_id)
    if conv is None:
        raise AppError(404, "not_found", "Conversation not found.")
    return conv


@router.get("", response_model=list[ConversationOut])
def list_conversations(db: Session = Depends(get_db)):
    stmt = select(Conversation).order_by(Conversation.updated_at.desc())
    return db.scalars(stmt).all()


@router.get("/{conversation_id}", response_model=ConversationDetail)
def get_conversation(conversation_id: str, db: Session = Depends(get_db)):
    return _get_or_404(db, conversation_id)


@router.patch("/{conversation_id}", response_model=ConversationOut)
def rename_conversation(
    conversation_id: str, body: ConversationRename, db: Session = Depends(get_db)
):
    conv = _get_or_404(db, conversation_id)
    conv.title = body.title
    db.commit()
    db.refresh(conv)
    return conv


@router.delete("/{conversation_id}", status_code=204)
def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
    conv = _get_or_404(db, conversation_id)
    db.delete(conv)
    db.commit()
    return Response(status_code=204)
