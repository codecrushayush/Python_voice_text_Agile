"""Text-to-Speech service.

Two engines are supported:

* ``gtts``   - Google Translate TTS (network required, returns MP3)
* ``pyttsx3`` - Offline engine (SAPI5 on Windows, espeak on Linux, returns WAV)

The service only converts text into audio. It contains no AI/ML model.
"""

from __future__ import annotations

import io
import wave
from typing import Callable, Dict, Tuple

from app.utils.exceptions import TTSError
from app.utils.validators import validate_text

# Language codes supported by gTTS (subset shown in the UI, extendable).
SUPPORTED_LANGUAGES: Dict[str, str] = {
    "en": "English",
    "hi": "Hindi",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese",
    "ja": "Japanese",
    "zh-CN": "Chinese (Simplified)",
    "ar": "Arabic",
}

DEFAULT_LANGUAGE = "en"
DEFAULT_RATE = 175


def _synth_gtts(text: str, language: str, rate: int) -> Tuple[bytes, str, str]:
    try:
        from gtts import gTTS
    except ImportError as exc:  # pragma: no cover - dependency guard
        raise TTSError("gTTS is not installed. Run 'pip install gTTS'.") from exc

    try:
        buffer = io.BytesIO()
        gTTS(text=text, lang=language, slow=False).write_to_fp(buffer)
        data = buffer.getvalue()
    except Exception as exc:
        raise TTSError(
            "Could not reach the online speech service. Check your internet connection "
            "or choose the offline engine (pyttsx3)."
        ) from exc

    if not data:
        raise TTSError("The speech service returned an empty audio file.")
    return data, "mp3", "audio/mpeg"


def _synth_pyttsx3(text: str, language: str, rate: int) -> Tuple[bytes, str, str]:
    """Offline speech synthesis. ``rate`` is expressed in words per minute."""
    import os
    import tempfile

    try:
        import pyttsx3
    except Exception as exc:  # pragma: no cover - dependency guard
        raise TTSError("pyttsx3 is not installed. Run 'pip install pyttsx3'.") from exc

    path = None
    try:
        engine = pyttsx3.init()
        engine.setProperty("rate", int(rate))
        fd, path = tempfile.mkstemp(suffix=".wav")
        os.close(fd)
        engine.save_to_file(text, path)
        engine.runAndWait()
        if os.path.exists(path):
            with open(path, "rb") as handle:
                data = handle.read()
        else:
            data = b""
    except Exception as exc:
        raise TTSError(
            "Offline speech engine failed to start. On Linux install 'espeak-ng', "
            "on Windows the SAPI5 voices are used by default."
        ) from exc
    finally:
        if path and os.path.exists(path):
            try:
                os.remove(path)
            except OSError:
                pass

    if not data:
        raise TTSError("The offline speech engine did not produce any audio.")
    return data, "wav", "audio/wav"


ENGINES: Dict[str, Callable[[str, str, int], Tuple[bytes, str, str]]] = {
    "gtts": _synth_gtts,
    "pyttsx3": _synth_pyttsx3,
}


def _synth_auto(text: str, language: str, rate: int) -> Tuple[bytes, str, str, str]:
    """Try the online engine first, then fall back to the offline engine."""
    errors = []
    for name in ("gtts", "pyttsx3"):
        try:
            data, ext, media = ENGINES[name](text, language, rate)
            return data, ext, media, name
        except TTSError as exc:
            errors.append(f"{name}: {exc.message}")
    raise TTSError("Speech generation failed. " + " | ".join(errors))


def synthesize(text: str, language: str = DEFAULT_LANGUAGE, rate: int = DEFAULT_RATE, engine: str = "auto") -> dict:
    """Convert ``text`` into an audio payload.

    Returns a dictionary with ``data``, ``extension``, ``media_type`` and ``engine``.
    """
    cleaned = validate_text(text)
    language = language if language in SUPPORTED_LANGUAGES else DEFAULT_LANGUAGE

    if engine == "auto":
        data, extension, media_type, used = _synth_auto(cleaned, language, rate)
    else:
        synth = ENGINES.get(engine)
        if synth is None:
            raise TTSError(f"Unknown speech engine '{engine}'.")
        data, extension, media_type = synth(cleaned, language, rate)
        used = engine

    return {"data": data, "extension": extension, "media_type": media_type, "engine": used}


def describe_languages() -> list[dict]:
    """Expose the supported language list to the frontend."""
    return [{"code": code, "name": name} for code, name in SUPPORTED_LANGUAGES.items()]
