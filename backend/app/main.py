"""FastAPI application entry point."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import get_settings
from app.database import init_db
from app.errors import AppError
from app.routes import api_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("askanything")
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    if not settings.gemini_configured:
        logger.warning("GEMINI_API_KEY is not set - chat requests will return a configuration error.")
    yield


app = FastAPI(title="AskAnything AI API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
)


def _error(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(status_code=status, content={"error": {"code": code, "message": message}})


@app.middleware("http")
async def limit_body_size(request: Request, call_next):
    """Reject oversized request bodies early (basic request size limit)."""
    length = request.headers.get("content-length")
    if length and length.isdigit() and int(length) > settings.MAX_BODY_BYTES:
        return _error(413, "payload_too_large", "Request body is too large.")
    return await call_next(request)


@app.exception_handler(AppError)
async def app_error_handler(_: Request, exc: AppError):
    return _error(exc.status_code, exc.code, exc.message)


@app.exception_handler(RequestValidationError)
async def validation_handler(_: Request, exc: RequestValidationError):
    return _error(422, "validation_error", "Invalid request. Please check your input.")


@app.exception_handler(StarletteHTTPException)
async def http_handler(_: Request, exc: StarletteHTTPException):
    msg = "Resource not found." if exc.status_code == 404 else "Request failed."
    return _error(exc.status_code, "http_error", msg)


@app.exception_handler(Exception)
async def unhandled_handler(_: Request, exc: Exception):
    logger.error("Unhandled error: %s", type(exc).__name__)  # no sensitive data
    return _error(500, "internal_error", "Something went wrong on the server. Please try again.")


app.include_router(api_router)


@app.get("/", include_in_schema=False)
def root():
    return {"name": "AskAnything AI API", "docs": "/docs", "health": "/api/health"}
