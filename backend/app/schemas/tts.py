"""Text-to-Speech request/response schemas."""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="Text to convert to speech")
    language: str = Field(default="en", max_length=10, description="Language code, e.g. en, hi, es")
    rate: int = Field(default=175, ge=80, le=300, description="Speech rate in words per minute")
    engine: Literal["auto", "gtts", "pyttsx3"] = "auto"

    model_config = {
        "json_schema_extra": {
            "examples": [{"text": "Hello, welcome to my university project.", "language": "en", "rate": 175}]
        }
    }


class TTSResponse(BaseModel):
    id: int
    text: str
    language: str
    rate: int
    engine: str
    audio_url: str
    created_at: datetime
