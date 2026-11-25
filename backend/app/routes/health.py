from fastapi import APIRouter

from app.config import get_settings

router = APIRouter()


@router.get("/health")
def health():
    s = get_settings()
    return {
        "status": "ok",
        "gemini_configured": s.gemini_configured,
        "model": s.GEMINI_MODEL,
        "database": "sqlite" if s.sqlalchemy_url.startswith("sqlite") else "postgresql",
    }
