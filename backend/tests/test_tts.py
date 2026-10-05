"""Tests for the Text-to-Speech endpoint (Red/Green/Refactor - TDD example)."""


def test_tts_rejects_empty_text(client):
    """Red step: an empty submission must not create audio."""
    response = client.post("/api/tts", json={"text": "   "})
    assert response.status_code == 422
    assert "empty" in response.json()["detail"].lower()


def test_tts_rejects_missing_text(client):
    response = client.post("/api/tts", json={})
    assert response.status_code == 422


def test_tts_rejects_text_over_limit(client):
    response = client.post("/api/tts", json={"text": "a" * 5001})
    assert response.status_code == 422


def test_tts_generates_audio_and_history(client):
    """Green step: valid text returns an audio URL and a history record."""
    response = client.post(
        "/api/tts",
        json={"text": "Welcome to my university project.", "language": "en", "rate": 175},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["text"] == "Welcome to my university project."
    assert body["audio_url"].startswith("/static/audio/")
    assert body["id"] > 0

    audio = client.get(body["audio_url"])
    assert audio.status_code == 200

    history = client.get("/api/history", params={"type": "tts"}).json()
    assert history["total"] == 1
    assert history["items"][0]["type"] == "tts"


def test_tts_languages_endpoint(client):
    response = client.get("/api/tts/languages")
    assert response.status_code == 200
    codes = [lang["code"] for lang in response.json()["languages"]]
    assert "en" in codes
