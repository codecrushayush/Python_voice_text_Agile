"""FastAPI application entry point."""

from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app import __version__
from app.database import init_db
from app.routers import assistant, history, stt, tts
from app.utils.exceptions import DomainError

BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(
    title="Python Text-to-Speech, Speech-to-Text and Virtual Assistant",
    description=(
        "Academic project: convert text to speech, convert speech to text and run a "
        "simple rule based virtual assistant. No AI/LLM is used."
    ),
    version=__version__,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")

app.include_router(tts.router)
app.include_router(stt.router)
app.include_router(assistant.router)
app.include_router(history.router)


@app.on_event("startup")
def on_startup() -> None:
    """Create the SQLite database and tables automatically."""
    init_db()


@app.exception_handler(DomainError)
def domain_error_handler(request: Request, exc: DomainError) -> JSONResponse:
    """Turn expected domain errors into clean JSON responses."""
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


@app.get("/", tags=["meta"])
def root():
    """API root with a short description of the project."""
    return {
        "name": "Python Text-to-Speech, Speech-to-Text and Virtual Assistant",
        "version": __version__,
        "docs": "/docs",
        "endpoints": ["/api/tts", "/api/stt", "/api/assistant", "/api/history", "/api/stats"],
    }


@app.get("/health", tags=["meta"])
def health():
    """Lightweight health check used by the CI pipeline and the frontend."""
    return {"status": "ok", "version": __version__}
