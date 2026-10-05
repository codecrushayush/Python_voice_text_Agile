"""Tests for the meta endpoints (health check and API root)."""


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "version" in body


def test_root_endpoint_lists_routes(client):
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert "/api/tts" in body["endpoints"]
    assert body["docs"] == "/docs"
