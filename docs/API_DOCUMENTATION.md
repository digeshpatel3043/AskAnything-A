# API Documentation

Base URL (local): `http://127.0.0.1:8000`. Interactive docs: `/docs`. All endpoints are under `/api`. Timestamps are ISO-8601 UTC (`2026-01-01T10:00:00Z`).

## Error format

```json
{ "error": { "code": "rate_limited", "message": "The AI service is receiving too many requests right now. Please wait a moment and try again." } }
```

| HTTP | code | Meaning |
|---|---|---|
| 400 | `bad_request` | Nothing to regenerate / unprocessable request |
| 404 | `not_found` | Conversation does not exist |
| 413 | `payload_too_large` | Body larger than `MAX_BODY_BYTES` |
| 422 | `validation_error`, `empty_message`, `message_too_long` | Invalid input |
| 429 | `rate_limited` | Gemini quota / rate limit hit |
| 502 | `upstream_error`, `network_error`, `api_key_invalid`, `model_not_found`, `empty_response` | Problem talking to Gemini |
| 503 | `api_key_missing` | `GEMINI_API_KEY` not configured |
| 504 | `timeout` | Gemini took longer than `REQUEST_TIMEOUT_SECONDS` |
| 500 | `internal_error` | Unexpected server error |

## GET /api/health

```json
{ "status": "ok", "gemini_configured": true, "model": "gemini-2.5-flash", "database": "sqlite" }
```

## POST /api/chat

Send a message (creates a conversation if `conversation_id` is omitted) or regenerate the last answer.

Request:

```json
{
  "message": "Explain recursion simply",
  "conversation_id": null,
  "tool": "coding",
  "regenerate": false
}
```

- `message` - required unless `regenerate` is true; max `MAX_MESSAGE_CHARS`.
- `conversation_id` - optional; continue an existing conversation.
- `tool` - optional: `study`, `career`, `content`, `email`, `coding`, `business`. Only used when creating a conversation.
- `regenerate` - if true, `conversation_id` is required and the last AI answer is replaced.

Response `200`:

```json
{
  "conversation": { "id": "3f2c...", "title": "Explain recursion simply", "tool": "coding",
                    "created_at": "2026-01-01T10:00:00Z", "updated_at": "2026-01-01T10:00:03Z" },
  "user_message": { "id": "a1...", "role": "user", "content": "Explain recursion simply", "created_at": "2026-01-01T10:00:00Z" },
  "assistant_message": { "id": "b2...", "role": "assistant", "content": "Recursion is...", "created_at": "2026-01-01T10:00:03Z" }
}
```

(`user_message` is `null` for regenerate.) Nothing is saved if the request fails.

## GET /api/conversations

Returns conversations, most recently updated first.

```json
[ { "id": "3f2c...", "title": "Explain recursion simply", "tool": "coding",
    "created_at": "2026-01-01T10:00:00Z", "updated_at": "2026-01-01T10:00:03Z" } ]
```

## GET /api/conversations/{id}

Returns the conversation with all messages (oldest first). `404` if not found.

```json
{ "id": "3f2c...", "title": "...", "tool": "coding", "created_at": "...", "updated_at": "...",
  "messages": [ { "id": "a1...", "role": "user", "content": "...", "created_at": "..." },
                { "id": "b2...", "role": "assistant", "content": "...", "created_at": "..." } ] }
```

## PATCH /api/conversations/{id}

Request: `{ "title": "New title" }` (1-120 characters, not blank). Response: the updated conversation object.

## DELETE /api/conversations/{id}

Deletes the conversation and its messages. Response `204` (no body); `404` if not found.

## Example (curl)

```bash
curl -X POST http://127.0.0.1:8000/api/chat -H "Content-Type: application/json" \
  -d '{"message":"Give me 3 resume tips"}'
```
