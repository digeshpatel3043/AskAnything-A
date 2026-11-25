"""Pydantic request/response schemas."""
from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator

ToolId = Literal["study", "career", "content", "email", "coding", "business"]


class _UTCModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    @staticmethod
    def _utc(dt: datetime) -> str:
        if dt.tzinfo is None:  # SQLite returns naive datetimes
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


class MessageOut(_UTCModel):
    id: str
    role: str
    content: str
    created_at: datetime

    @field_serializer("created_at")
    def _ser(self, v: datetime) -> str:
        return self._utc(v)


class ConversationOut(_UTCModel):
    id: str
    title: str
    tool: str | None = None
    created_at: datetime
    updated_at: datetime

    @field_serializer("created_at", "updated_at")
    def _ser(self, v: datetime) -> str:
        return self._utc(v)


class ConversationDetail(ConversationOut):
    messages: list[MessageOut] = []


class ChatRequest(BaseModel):
    message: str = Field(default="", max_length=20000)
    conversation_id: str | None = Field(default=None, max_length=36)
    tool: ToolId | None = None
    regenerate: bool = False

    @field_validator("message")
    @classmethod
    def _strip(cls, v: str) -> str:
        return v.strip()


class ChatResponse(BaseModel):
    conversation: ConversationOut
    user_message: MessageOut | None = None
    assistant_message: MessageOut


class ConversationRename(BaseModel):
    title: str = Field(min_length=1, max_length=120)

    @field_validator("title")
    @classmethod
    def _strip(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Title cannot be empty.")
        return v
