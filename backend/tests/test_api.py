"""Backend tests. Gemini is mocked, so no API key or network is needed."""
import os
import tempfile

_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/test.db"
os.environ["GEMINI_API_KEY"] = ""

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.config import get_settings  # noqa: E402
from app.errors import AppError  # noqa: E402
from app.main import app  # noqa: E402
from app.services import gemini_service  # noqa: E402


@pytest.fixture()
def client():
    from app.database import Base, engine

    Base.metadata.drop_all(bind=engine)  # fresh database for every test
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def fake_ai(monkeypatch):
    calls = []

    def fake(history, tool=None):
        calls.append((list(history), tool))
        return f"reply-{len(calls)}"

    monkeypatch.setattr(gemini_service, "generate_reply", fake)
    return calls


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
    assert r.json()["gemini_configured"] is False


def test_missing_key_gives_config_error(client):
    r = client.post("/api/chat", json={"message": "hi"})
    assert r.status_code == 503
    assert r.json()["error"]["code"] == "api_key_missing"
    assert client.get("/api/conversations").json() == []  # nothing stored on failure


def test_chat_flow_and_context(client, fake_ai):
    r = client.post("/api/chat", json={"message": "What is Python?", "tool": "coding"})
    assert r.status_code == 200
    data = r.json()
    cid = data["conversation"]["id"]
    assert data["assistant_message"]["content"] == "reply-1"
    assert data["conversation"]["title"] == "What is Python?"
    assert data["conversation"]["tool"] == "coding"

    r2 = client.post("/api/chat", json={"message": "And Java?", "conversation_id": cid})
    assert r2.status_code == 200
    history, tool = fake_ai[1]
    assert [h[0] for h in history] == ["user", "assistant", "user"]  # context was sent
    assert tool == "coding"  # tool persists for the conversation

    detail = client.get(f"/api/conversations/{cid}").json()
    assert [m["role"] for m in detail["messages"]] == ["user", "assistant", "user", "assistant"]
    assert detail["messages"][0]["created_at"].endswith("Z")


def test_conversations_independent(client, fake_ai):
    a = client.post("/api/chat", json={"message": "A"}).json()["conversation"]["id"]
    b = client.post("/api/chat", json={"message": "B"}).json()["conversation"]["id"]
    client.post("/api/chat", json={"message": "A2", "conversation_id": a})
    history, _ = fake_ai[-1]
    assert [h[1] for h in history if h[0] == "user"] == ["A", "A2"]
    assert a != b


def test_regenerate(client, fake_ai):
    cid = client.post("/api/chat", json={"message": "Q"}).json()["conversation"]["id"]
    r = client.post("/api/chat", json={"conversation_id": cid, "regenerate": True})
    assert r.status_code == 200
    assert r.json()["assistant_message"]["content"] == "reply-2"
    assert r.json()["user_message"] is None
    msgs = client.get(f"/api/conversations/{cid}").json()["messages"]
    assert [m["role"] for m in msgs] == ["user", "assistant"]
    assert msgs[1]["content"] == "reply-2"
    history, _ = fake_ai[-1]
    assert history == [("user", "Q")]


def test_rename_delete(client, fake_ai):
    cid = client.post("/api/chat", json={"message": "Hello"}).json()["conversation"]["id"]
    r = client.patch(f"/api/conversations/{cid}", json={"title": "  My chat "})
    assert r.status_code == 200 and r.json()["title"] == "My chat"
    assert client.patch(f"/api/conversations/{cid}", json={"title": "  "}).status_code == 422
    assert client.delete(f"/api/conversations/{cid}").status_code == 204
    assert client.get(f"/api/conversations/{cid}").status_code == 404
    assert client.delete(f"/api/conversations/{cid}").status_code == 404


def test_validation(client, fake_ai):
    assert client.post("/api/chat", json={"message": "   "}).status_code == 422
    assert client.post("/api/chat", json={"message": "x", "tool": "nope"}).status_code == 422
    assert client.post("/api/chat", json={"message": "x", "conversation_id": "missing"}).status_code == 404
    too_long = "x" * (get_settings().MAX_MESSAGE_CHARS + 1)
    assert client.post("/api/chat", json={"message": too_long}).status_code == 422
    r = client.post("/api/chat", content=b"x" * 200_000,
                    headers={"content-type": "application/json"})
    assert r.status_code == 413


def test_upstream_errors_are_friendly(client, monkeypatch):
    def boom(history, tool=None):
        raise AppError(429, "rate_limited", "slow down")

    monkeypatch.setattr(gemini_service, "generate_reply", boom)
    r = client.post("/api/chat", json={"message": "hi"})
    assert r.status_code == 429
    assert r.json()["error"]["code"] == "rate_limited"
    assert client.get("/api/conversations").json() == []
