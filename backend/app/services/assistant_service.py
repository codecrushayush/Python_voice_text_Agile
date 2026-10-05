"""Rule-based Virtual Assistant service.

The assistant only executes predefined commands using plain Python conditions,
dictionaries and handlers. It contains no AI model, no LLM and no chatbot.
"""

from __future__ import annotations

import re
import webbrowser
from datetime import datetime
from typing import Callable, Dict, List, Optional, Tuple
from urllib.parse import quote_plus

from app.utils.exceptions import AssistantError, ValidationError
from app.utils.validators import validate_text

ABOUT_TEXT = (
    "Python Text-to-Speech, Speech-to-Text and Virtual Assistant. "
    "A rule based academic project built with FastAPI and React."
)

HELP_TEXT = (
    "Available commands: hello, what time is it, what is today's date, "
    "open Google, open YouTube, search Google for ..., help, about application, clear."
)

COMMAND_TYPES = ("greeting", "time", "date", "open_url", "search", "help", "about", "clear", "unknown")


def _open_url(url: str) -> bool:
    """Open a URL in the default browser (patched in the test suite)."""
    try:
        return bool(webbrowser.open(url))
    except Exception:
        return False


def _now() -> datetime:
    return datetime.now()


def _handle_greeting(text: str, now: datetime) -> str:
    return "Hello! I am your virtual assistant. Say help to see what I can do."


def _handle_time(text: str, now: datetime) -> str:
    return f"The current time is {now.strftime('%I:%M %p')}."


def _handle_date(text: str, now: datetime) -> str:
    return f"Today's date is {now.strftime('%A, %d %B %Y')}."


def _handle_open_google(text: str, now: datetime) -> str:
    opened = _open_url("https://www.google.com")
    return "Opening Google in your browser." if opened else "I could not open Google in your browser."


def _handle_open_youtube(text: str, now: datetime) -> str:
    opened = _open_url("https://www.youtube.com")
    return "Opening YouTube in your browser." if opened else "I could not open YouTube in your browser."


def _handle_help(text: str, now: datetime) -> str:
    return HELP_TEXT


def _handle_about(text: str, now: datetime) -> str:
    return ABOUT_TEXT


def _handle_clear(text: str, now: datetime) -> str:
    return "Conversation cleared. How can I help you next?"


def _search_query(text: str) -> Optional[str]:
    patterns = [
        r"^search\s+google\s+for\s+(?P<q>.+)$",
        r"^google\s+(?P<q>.+)$",
        r"^search\s+for\s+(?P<q>.+)$",
        r"^search\s+(?P<q>.+)$",
    ]
    for pattern in patterns:
        match = re.match(pattern, text, flags=re.IGNORECASE)
        if match:
            query = match.group("q").strip()
            if query:
                return query
    return None


def _handle_search(text: str, now: datetime) -> str:
    query = _search_query(text) or ""
    _open_url(f"https://www.google.com/search?q={quote_plus(query)}")
    return f"Searching Google for {query}."


# Ordered rules: first match wins. Callable receives (normalised text, now).
RULES: List[Tuple[str, str, Callable[[str, datetime], str]]] = [
    ("clear", "clear", lambda t, n: _handle_clear(t, n)),
    ("about", "about", lambda t, n: _handle_about(t, n)),
    ("help", "help", lambda t, n: _handle_help(t, n)),
    ("time", "time", lambda t, n: _handle_time(t, n)),
    ("date", "date", lambda t, n: _handle_date(t, n)),
    ("open_url", "open url", lambda t, n: _handle_open_google(t, n) if "google" in t else _handle_open_youtube(t, n)),
    ("search", "search", lambda t, n: _handle_search(t, n)),
    ("greeting", "greeting", lambda t, n: _handle_greeting(t, n)),
]

GREETINGS = {"hello", "hi", "hey", "good morning", "good evening", "namaste"}
UNKNOWN_RESPONSE = (
    "Sorry, I did not understand that command. Say 'help' to see the list of supported commands."
)


def match_command(text: str) -> Tuple[str, str]:
    """Return ``(command_type, response)`` for a normalised command string."""
    normalised = " ".join(text.lower().split())
    normalised = normalised.rstrip("?!.") if normalised not in {"what time is it", "what is today's date"} else normalised

    if normalised in GREETINGS or normalised.startswith(("hello", "hi ", "hey")):
        return "greeting", _handle_greeting(normalised, _now())
    if _search_query(normalised):
        return "search", _handle_search(normalised, _now())
    if normalised in {"what time is it", "time", "current time", "tell me the time"}:
        return "time", _handle_time(normalised, _now())
    if normalised in {"what is today's date", "date", "today's date", "what date is it"}:
        return "date", _handle_date(normalised, _now())
    if "youtube" in normalised and normalised.startswith("open"):
        return "open_url", _handle_open_youtube(normalised, _now())
    if normalised.startswith("open") and "google" in normalised:
        return "open_url", _handle_open_google(normalised, _now())
    if normalised in {"help", "commands", "what can you do"}:
        return "help", _handle_help(normalised, _now())
    if normalised in {"about", "about application", "about this app", "who are you"}:
        return "about", _handle_about(normalised, _now())
    if normalised in {"clear", "clear conversation", "reset"}:
        return "clear", _handle_clear(normalised, _now())

    return "unknown", UNKNOWN_RESPONSE


def execute(command: str) -> dict:
    """Validate a command and return the rule based response."""
    cleaned = validate_text(command, max_length=500, field="text")
    command_type, response = match_command(cleaned)
    if command_type not in COMMAND_TYPES:  # pragma: no cover - defensive
        raise AssistantError("Unsupported command.")
    return {"command": cleaned, "response": response, "command_type": command_type}


def available_commands() -> List[Dict[str, str]]:
    """List of documented commands exposed for the UI helper panel."""
    return [
        {"command": "hello / hi", "description": "Greet the assistant"},
        {"command": "what time is it", "description": "Show the current time"},
        {"command": "what is today's date", "description": "Show today's date"},
        {"command": "open Google", "description": "Open google.com in the browser"},
        {"command": "open YouTube", "description": "Open youtube.com in the browser"},
        {"command": "search Google for python", "description": "Search Google for a keyword"},
        {"command": "help", "description": "List all supported commands"},
        {"command": "about application", "description": "Show information about this project"},
        {"command": "clear", "description": "Clear the conversation"},
    ]
