"""Tests for the Speech-to-Text endpoint."""

from tests.conftest import build_wav


def test_stt_transcribes_recorded_wav(client):
    response = client.post(
        "/api/stt",
        files={"file": ("recording.wav", build_wav(), "audio/wav")},
        data={"language": "en", "source": "microphone"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["text"] == "hello from the test suite"
    assert body["source"] == "microphone"
    assert body["filename"] == "recording.wav"


def test_stt_rejects_unsupported_file(client):
    response = client.post(
        "/api/stt",
        files={"file": ("notes.txt", b"not audio", "text/plain")},
        data={"language": "en"},
    )
    assert response.status_code == 422
    assert "unsupported" in response.json()["detail"].lower()


def test_stt_rejects_empty_file(client):
    response = client.post(
        "/api/stt",
        files={"file": ("empty.wav", b"", "audio/wav")},
        data={"language": "en"},
    )
    assert response.status_code == 422


def test_stt_recognizer_failure_returns_friendly_message(client, monkeypatch):
    from app.services import stt_service
    from app.utils.exceptions import STTError

    def broken_recognize(wav_data, language):
        raise STTError("Speech was not recognised. Please speak clearly and try again.")

    monkeypatch.setattr(stt_service, "_recognize", broken_recognize)

    response = client.post(
        "/api/stt",
        files={"file": ("recording.wav", build_wav(), "audio/wav")},
        data={"language": "en"},
    )
    assert response.status_code == 422
    assert "not recognised" in response.json()["detail"]


def test_stt_saves_history(client):
    client.post(
        "/api/stt",
        files={"file": ("upload.wav", build_wav(), "audio/wav")},
        data={"language": "en", "source": "upload"},
    )
    history = client.get("/api/history", params={"type": "stt"}).json()
    assert history["total"] == 1
    assert history["items"][0]["output_text"] == "hello from the test suite"
