"""Speech-to-Text service.

Uses the standard ``SpeechRecognition`` library with the free Google Web Speech
recogniser. No custom AI model, no paid API key and no LLM is involved.
"""

from __future__ import annotations

import io
import tempfile
import wave
from pathlib import Path
from typing import Tuple

from app.utils.exceptions import STTError, ValidationError
from app.utils.audio_utils import ALLOWED_AUDIO_EXTENSIONS, MAX_UPLOAD_BYTES, safe_filename

# Language codes understood by the recogniser.
RECOGNIZER_LANGUAGES = {
    "en": "en-US",
    "hi": "hi-IN",
    "es": "es-ES",
    "fr": "fr-FR",
    "de": "de-DE",
    "it": "it-IT",
    "pt": "pt-BR",
    "ja": "ja-JP",
    "zh-CN": "zh-CN",
    "ar": "ar-SA",
}

# Formats that SpeechRecognition can decode without ffmpeg.
_NATIVE_FORMATS = {".wav", ".aiff", ".aif", ".flac"}
# Formats that require pydub + ffmpeg for conversion to WAV.
_CONVERTIBLE_FORMATS = {".mp3", ".ogg", ".webm", ".m4a", ".aac"}


def _wav_duration(data: bytes) -> float | None:
    """Return the duration of a PCM WAV payload in seconds."""
    try:
        with wave.open(io.BytesIO(data), "rb") as wav:
            frames = wav.getnframes()
            rate = wav.getframerate()
            return round(frames / float(rate), 2) if rate else None
    except Exception:
        return None


def _to_wav(data: bytes, filename: str) -> bytes:
    """Return WAV bytes for any supported upload, converting when needed."""
    suffix = Path(filename).suffix.lower()

    if suffix == ".wav":
        return data
    if suffix in _NATIVE_FORMATS:
        return data

    if suffix not in _CONVERTIBLE_FORMATS:
        raise ValidationError(
            f"Unsupported audio file '{filename}'. Allowed formats: "
            f"{', '.join(sorted(ALLOWED_AUDIO_EXTENSIONS))}."
        )

    try:
        from pydub import AudioSegment
    except Exception as exc:  # pragma: no cover - dependency guard
        raise STTError("pydub is not installed. Run 'pip install pydub'.") from exc

    try:
        segment = AudioSegment.from_file(io.BytesIO(data), format=suffix.lstrip("."))
    except Exception as exc:
        raise STTError(
            "Could not decode this audio file. Install ffmpeg to convert MP3/OGG/WebM "
            "uploads, or upload a WAV file instead."
        ) from exc

    buffer = io.BytesIO()
    segment.export(buffer, format="wav")
    return buffer.getvalue()


def _recognize(wav_data: bytes, language: str) -> str:
    """Run speech recognition over WAV bytes and return the transcript."""
    try:
        import speech_recognition as sr
    except Exception as exc:  # pragma: no cover - dependency guard
        raise STTError("SpeechRecognition is not installed. Run 'pip install SpeechRecognition'.") from exc

    recognizer = sr.Recognizer()
    lang = RECOGNIZER_LANGUAGES.get(language, "en-US")

    try:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as handle:
            handle.write(wav_data)
            temp_path = handle.name
        try:
            with sr.AudioFile(temp_path) as source:
                audio = recognizer.record(source)
        finally:
            Path(temp_path).unlink(missing_ok=True)
    except Exception as exc:
        raise STTError("The audio file could not be read. Please upload a valid audio file.") from exc

    try:
        return recognizer.recognize_google(audio, language=lang)
    except sr.UnknownValueError as exc:
        raise STTError("Speech was not recognised. Please speak clearly and try again.") from exc
    except sr.RequestError as exc:
        raise STTError(
            "The speech recognition service is unavailable. Check your internet connection and try again."
        ) from exc
    except Exception as exc:
        raise STTError("Speech recognition failed. Please try a different recording.") from exc


def transcribe(data: bytes, filename: str, language: str = "en") -> dict:
    """Transcribe an uploaded/recorded audio file.

    Returns ``{"text": ..., "duration": ..., "filename": ...}``.
    """
    if not data:
        raise ValidationError("The uploaded file is empty.")
    if len(data) > MAX_UPLOAD_BYTES:
        raise ValidationError("The uploaded file is too large. Maximum size is 10 MB.")

    name = safe_filename(filename)
    suffix = Path(name).suffix.lower()
    if suffix not in ALLOWED_AUDIO_EXTENSIONS:
        raise ValidationError(
            f"Unsupported audio file '{name}'. Allowed formats: {', '.join(sorted(ALLOWED_AUDIO_EXTENSIONS))}."
        )

    wav_data = _to_wav(data, name)
    text = _recognize(wav_data, language)

    if not text or not text.strip():
        raise STTError("Speech was not recognised. Please speak clearly and try again.")

    return {"text": text.strip(), "duration": _wav_duration(wav_data), "filename": name}
