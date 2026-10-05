"""Shared pytest fixtures: isolated in-memory database and patched speech engines."""

import io
import wave

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.services import assistant_service, stt_service, tts_service


def build_wav(seconds: float = 0.2, rate: int = 16000) -> bytes:
    """Create a tiny valid mono 16-bit PCM WAV file in memory."""
    import math
    import struct

    frames = int(seconds * rate)
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(rate)
        payload = b"".join(
            struct.pack("<h", int(1200 * math.sin(2 * math.pi * 440 * i / rate))) for i in range(frames)
        )
        wav.writeframes(payload)
    return buffer.getvalue()


@pytest.fixture()
def fake_speech_engine(monkeypatch):
    """Replace the real TTS engines so tests never need network/audio hardware."""

    def fake_gtts(text: str, language: str, rate: int):
        return build_wav(), "wav", "audio/wav"

    def fake_pyttsx3(text: str, language: str, rate: int):
        return build_wav(), "wav", "audio/wav"

    monkeypatch.setitem(tts_service.ENGINES, "gtts", fake_gtts)
    monkeypatch.setitem(tts_service.ENGINES, "pyttsx3", fake_pyttsx3)


@pytest.fixture()
def fake_recognizer(monkeypatch):
    """Replace the network speech recogniser with a deterministic transcript."""

    def fake_recognize(wav_data: bytes, language: str) -> str:
        return "hello from the test suite"

    monkeypatch.setattr(stt_service, "_recognize", fake_recognize)


@pytest.fixture()
def no_browser(monkeypatch):
    """Prevent the assistant from opening a real browser during tests."""
    monkeypatch.setattr(assistant_service, "_open_url", lambda url: True)


@pytest.fixture()
def client(monkeypatch, fake_speech_engine, fake_recognizer, no_browser):
    """TestClient bound to an isolated in-memory SQLite database."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        session = TestingSession()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
