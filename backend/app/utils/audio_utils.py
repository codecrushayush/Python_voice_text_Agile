"""Helpers for saving, validating and cleaning generated/ uploaded audio files."""

import re
import uuid
from pathlib import Path

from app.utils.exceptions import ValidationError

BASE_DIR = Path(__file__).resolve().parent.parent
AUDIO_DIR = BASE_DIR / "static" / "audio"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_AUDIO_EXTENSIONS = {".wav", ".mp3", ".ogg", ".webm", ".flac", ".m4a", ".aac", ".aiff", ".aif"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB

_SAFE_NAME = re.compile(r"[^a-zA-Z0-9._-]+")


def safe_filename(original_name: str) -> str:
    """Strip directories and dangerous characters from an uploaded file name."""
    name = Path(original_name or "audio.wav").name
    name = _SAFE_NAME.sub("_", name).strip("._") or "audio"
    return name[:80]


def validate_upload(filename: str, size: int) -> str:
    """Validate extension and size of an uploaded audio file."""
    name = safe_filename(filename)
    suffix = Path(name).suffix.lower()
    if suffix not in ALLOWED_AUDIO_EXTENSIONS:
        raise ValidationError(
            f"Unsupported audio file '{name}'. Allowed formats: {', '.join(sorted(ALLOWED_AUDIO_EXTENSIONS))}."
        )
    if size <= 0:
        raise ValidationError("The uploaded file is empty.")
    if size > MAX_UPLOAD_BYTES:
        raise ValidationError("The uploaded file is too large. Maximum size is 10 MB.")
    return name


def store_audio(data: bytes, extension: str) -> str:
    """Persist audio bytes and return the public URL path."""
    if not data:
        raise ValidationError("Could not generate audio for the given text.")
    extension = extension if extension.startswith(".") else f".{extension}"
    filename = f"{uuid.uuid4().hex}{extension.lower()}"
    (AUDIO_DIR / filename).write_bytes(data)
    return f"/static/audio/{filename}"


def audio_url_to_path(url: str) -> Path | None:
    """Convert a public audio URL back to an absolute file path."""
    if not url:
        return None
    name = Path(url).name
    candidate = AUDIO_DIR / name
    return candidate if candidate.exists() else None


def delete_audio(url: str) -> None:
    """Delete a stored audio file, ignoring missing files."""
    path = audio_url_to_path(url)
    if path is not None:
        try:
            path.unlink()
        except OSError:
            pass
