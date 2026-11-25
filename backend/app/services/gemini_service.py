"""Wrapper around the official Google Gen AI SDK (google-genai).

The API key is read from the backend environment only and is never logged.
"""
import logging
from typing import Sequence

from google import genai
from google.genai import errors as genai_errors
from google.genai import types

from app.config import get_settings
from app.errors import AppError
from app.services.prompts import system_prompt

logger = logging.getLogger("askanything.gemini")

_client: genai.Client | None = None
_client_key: str | None = None


def _get_client() -> genai.Client:
    """Create (and cache) the Gemini client. Raises a clear error if no key."""
    global _client, _client_key
    settings = get_settings()
    if not settings.gemini_configured:
        raise AppError(
            503,
            "api_key_missing",
            "The Gemini API key is not configured on the server. Add GEMINI_API_KEY "
            "to backend/.env (see .env.example) and restart the backend.",
        )
    key = settings.GEMINI_API_KEY.strip()
    if _client is None or _client_key != key:
        _client = genai.Client(
            api_key=key,
            http_options=types.HttpOptions(api_version="v1beta", timeout=settings.REQUEST_TIMEOUT_SECONDS * 1000),
        )
        _client_key = key
    return _client


def _to_contents(history: Sequence[tuple[str, str]]) -> list[types.Content]:
    return [
        types.Content(
            role="user" if role == "user" else "model",
            parts=[types.Part(text=text)],
        )
        for role, text in history
    ]


def _map_api_error(exc: genai_errors.APIError) -> AppError:
    code = getattr(exc, "code", None)
    text = (getattr(exc, "message", "") or str(exc)).lower()
    if code == 429:
        return AppError(
            429,
            "rate_limited",
            "The AI service is receiving too many requests right now. "
            "Please wait a moment and try again.",
        )
    if code in (401, 403) or ("api key" in text and code == 400):
        return AppError(
            502,
            "api_key_invalid",
            "The Gemini API key was rejected. Check GEMINI_API_KEY in backend/.env.",
        )
    if code == 404:
        return AppError(
            502,
            "model_not_found",
            "The configured Gemini model was not found. Check GEMINI_MODEL in backend/.env.",
        )
    if code == 400:
        return AppError(400, "bad_request", "The AI service could not process this request.")
    if code in (408, 504):
        return AppError(504, "timeout", _TIMEOUT_MSG)
    return AppError(
        502,
        "upstream_error",
        "The AI service is temporarily unavailable. Please try again shortly.",
    )


_TIMEOUT_MSG = (
    "The AI took too long to respond. Please try again, or try a shorter question."
)


def generate_reply(history: Sequence[tuple[str, str]], tool: str | None = None) -> str:
    """Generate an answer from (role, text) history; the last item is the new user message."""
    client = _get_client()
    settings = get_settings()
    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=_to_contents(history),
            config=types.GenerateContentConfig(
                system_instruction=system_prompt(tool),
                temperature=0.7,
            ),
        )
    except AppError:
        raise
    except genai_errors.APIError as exc:
        # Log only the status code; never the key or user content.
        logger.warning("Gemini API error code=%s", getattr(exc, "code", None))
        raise _map_api_error(exc) from None
    except Exception as exc:  # network failures, timeouts, SDK errors
        name = type(exc).__name__.lower()
        logger.warning("Gemini request failed: %s", type(exc).__name__)
        if "timeout" in name or "timedout" in name:
            raise AppError(504, "timeout", _TIMEOUT_MSG) from None
        if "connect" in name or "network" in name or "remoteprotocol" in name or "read" in name:
            raise AppError(
                502,
                "network_error",
                "Could not reach the AI service. Check your connection and try again.",
            ) from None
        raise AppError(
            502, "upstream_error", "Something went wrong while contacting the AI service."
        ) from None

    text = (getattr(response, "text", None) or "").strip()
    if not text:
        raise AppError(
            502,
            "empty_response",
            "The AI returned no answer (it may have been blocked by safety filters). "
            "Try rephrasing your question.",
        )
    return text
