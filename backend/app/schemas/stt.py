"""Speech-to-Text response schema."""

from datetime import datetime

from pydantic import BaseModel


class STTResponse(BaseModel):
    id: int
    text: str
    source: str
    filename: str
    duration_seconds: float | None = None
    created_at: datetime
