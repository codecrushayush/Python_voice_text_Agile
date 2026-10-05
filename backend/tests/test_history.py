"""Tests for history listing, filtering, deletion and dashboard statistics."""

from tests.conftest import build_wav


def _seed(client):
    client.post("/api/tts", json={"text": "First text to speech conversion"})
    client.post(
        "/api/stt",
        files={"file": ("seed.wav", build_wav(), "audio/wav")},
        data={"language": "en"},
    )
    client.post("/api/assistant", json={"text": "hello"})


def test_history_returns_all_types(client):
    _seed(client)
    response = client.get("/api/history")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 3
    assert {item["type"] for item in body["items"]} == {"tts", "stt", "assistant"}


def test_history_filter_by_type(client):
    _seed(client)
    body = client.get("/api/history", params={"type": "assistant"}).json()
    assert body["total"] == 1
    assert body["items"][0]["type"] == "assistant"


def test_history_search(client):
    _seed(client)
    body = client.get("/api/history", params={"search": "First text"}).json()
    assert body["total"] == 1


def test_history_invalid_filter_rejected(client):
    response = client.get("/api/history", params={"type": "unknown"})
    assert response.status_code == 422


def test_delete_single_history_record(client):
    _seed(client)
    record_id = client.get("/api/history").json()["items"][-1]["id"]

    response = client.delete(f"/api/history/{record_id}")
    assert response.status_code == 200

    remaining = client.get("/api/history").json()
    assert remaining["total"] == 2
    assert all(item["id"] != record_id for item in remaining["items"])


def test_delete_missing_history_record_returns_404(client):
    response = client.delete("/api/history/9999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_clear_all_history(client):
    _seed(client)
    response = client.delete("/api/history")
    assert response.status_code == 200
    assert client.get("/api/history").json()["total"] == 0


def test_stats_endpoint(client):
    _seed(client)
    body = client.get("/api/stats").json()
    assert body["total_tts"] == 1
    assert body["total_stt"] == 1
    assert body["total_assistant"] == 1
    assert body["total"] == 3
    assert len(body["recent"]) == 3
