"""Validation and error handling tests across all endpoints."""

from app.services import assistant_service, stt_service, tts_service
from app.utils.validators import validate_choice, validate_text
from app.utils.exceptions import ValidationError


def test_validate_text_rejects_blank():
    try:
        validate_text("   ")
        raise AssertionError("expected ValidationError")
    except ValidationError as exc:
        assert "empty" in exc.message.lower()


def test_validate_text_strips_whitespace():
    assert validate_text("  hello  ") == "hello"


def test_validate_choice_rejects_unknown_value():
    try:
        validate_choice("nope", {"en", "hi"}, "language")
        raise AssertionError("expected ValidationError")
    except ValidationError:
        pass


def test_invalid_json_body_returns_422(client):
    response = client.post("/api/tts", json={"text": 123})
    assert response.status_code == 422


def test_unknown_route_returns_404(client):
    assert client.get("/api/does-not-exist").status_code == 404


def test_assistant_unknown_matches_help_text():
    command_type, response = assistant_service.match_command("random unknown phrase")
    assert command_type == "unknown"
    assert "help" in response.lower()


def test_tts_engine_auto_falls_back(monkeypatch):
    from app.utils.exceptions import TTSError

    def broken(text, language, rate):
        raise TTSError("offline")

    monkeypatch.setitem(tts_service.ENGINES, "gtts", broken)
    monkeypatch.setitem(tts_service.ENGINES, "pyttsx3", lambda t, l, r: (b"RIFF", "wav", "audio/wav"))
    result = tts_service.synthesize("hello", engine="auto")
    assert result["engine"] == "pyttsx3"


def test_stt_rejects_oversized_payload(monkeypatch):
    from app.utils.exceptions import ValidationError as AppValidationError

    try:
        stt_service.transcribe(b"x" * (11 * 1024 * 1024), "big.wav")
        raise AssertionError("expected ValidationError")
    except AppValidationError:
        pass
