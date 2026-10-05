"""Tests for the rule-based virtual assistant."""


def test_assistant_greeting(client):
    response = client.post("/api/assistant", json={"text": "hello"})
    assert response.status_code == 201
    body = response.json()
    assert body["command_type"] == "greeting"
    assert "Hello" in body["response"]


def test_assistant_time_command(client):
    response = client.post("/api/assistant", json={"text": "what time is it"})
    assert response.status_code == 201
    assert "current time" in response.json()["response"].lower()


def test_assistant_date_command(client):
    response = client.post("/api/assistant", json={"text": "what is today's date"})
    assert response.status_code == 201
    assert "today's date" in response.json()["response"].lower()


def test_assistant_open_google(client):
    response = client.post("/api/assistant", json={"text": "open Google"})
    assert response.status_code == 201
    assert response.json()["command_type"] == "open_url"
    assert "google" in response.json()["response"].lower()


def test_assistant_search_command(client):
    response = client.post("/api/assistant", json={"text": "search Google for python fastapi"})
    assert response.status_code == 201
    assert "python fastapi" in response.json()["response"].lower()


def test_assistant_unknown_command(client):
    response = client.post("/api/assistant", json={"text": "please do my homework"})
    assert response.status_code == 201
    body = response.json()
    assert body["command_type"] == "unknown"
    assert "did not understand" in body["response"]


def test_assistant_help_command(client):
    response = client.post("/api/assistant", json={"text": "help"})
    assert "help" in response.json()["response"].lower()


def test_assistant_empty_command_rejected(client):
    response = client.post("/api/assistant", json={"text": ""})
    assert response.status_code == 422


def test_assistant_with_speech_returns_audio_url(client):
    response = client.post("/api/assistant", json={"text": "about application", "speak": True})
    assert response.status_code == 201
    assert response.json()["audio_url"].startswith("/static/audio/")


def test_assistant_commands_endpoint(client):
    response = client.get("/api/assistant/commands")
    assert response.status_code == 200
    assert len(response.json()["commands"]) >= 5
