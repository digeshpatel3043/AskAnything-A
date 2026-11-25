# Project Overview

**AskAnything AI** is a ChatGPT-style assistant. A React single-page app talks to a FastAPI REST backend, which calls Google Gemini and stores conversations in a SQL database.

```
Browser (React/Vite)  --HTTPS/JSON-->  FastAPI (Render)  --google-genai-->  Gemini API
                                            |
                                            +--SQLAlchemy--> SQLite (local) / PostgreSQL (Supabase)
```

## Key design decisions

- **Key safety:** only the backend reads `GEMINI_API_KEY`. The frontend only knows the backend URL.
- **Context:** on each request the backend loads the stored conversation, appends the new message and sends the last `MAX_CONTEXT_MESSAGES` messages to Gemini.
- **Atomic saves:** messages are stored only after Gemini succeeds. A failed request leaves nothing half-saved, so "Retry" just resends.
- **Tools:** each of the 6 tools builds a task-specific prompt in the browser and calls the same `POST /api/chat` with a `tool` id. The backend applies a matching system instruction and remembers the tool for that conversation. Tool results appear in chat history and can be continued in chat.
- **Regenerate:** `POST /api/chat` with `regenerate: true` replaces the last AI answer.
- **Errors:** every error is returned as `{"error": {"code", "message"}}` with a user-safe message. Provider error details and chat content are never logged.
- **Database:** tables are created automatically at startup. `DATABASE_URL` selects SQLite or PostgreSQL (`postgres://` and `postgresql://` URLs are normalised).
- **Profile & theme:** the "user profile" is a local display name and theme stored in the browser (there is no login system).

## Data model

- `conversations`: `id` (UUID), `title`, `tool`, `created_at`, `updated_at`
- `messages`: `id` (UUID), `conversation_id` (FK, cascade delete), `role` (`user`/`assistant`), `content`, `seq`, `created_at`

## Known limitations

- No authentication: all conversations on a deployment are visible to anyone who can reach the API. Add auth before sharing a public deployment widely.
- Responses are returned whole (not token-streamed). "Stop" cancels the request in the browser.
- Free hosting tiers have cold starts and quotas (see the deployment guide).
