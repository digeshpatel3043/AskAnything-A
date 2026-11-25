"""Application configuration loaded from environment variables / .env file."""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env", env_file_encoding="utf-8", extra="ignore"
    )

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    DATABASE_URL: str = "sqlite:///./askanything.db"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    REQUEST_TIMEOUT_SECONDS: int = 60
    MAX_MESSAGE_CHARS: int = 8000
    MAX_CONTEXT_MESSAGES: int = 30
    MAX_BODY_BYTES: int = 100_000

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip().rstrip("/") for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def sqlalchemy_url(self) -> str:
        """Normalise the URL so Supabase/Render style URLs work with SQLAlchemy."""
        url = self.DATABASE_URL.strip()
        if url.startswith("postgres://"):
            url = "postgresql+psycopg2://" + url[len("postgres://"):]
        elif url.startswith("postgresql://"):
            url = "postgresql+psycopg2://" + url[len("postgresql://"):]
        return url

    @property
    def gemini_configured(self) -> bool:
        return bool(self.GEMINI_API_KEY.strip())


@lru_cache
def get_settings() -> Settings:
    return Settings()
