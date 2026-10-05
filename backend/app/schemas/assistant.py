"""Virtual assistant request/response schemas."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class AssistantRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500, description="Command typed or spoken by the user")
    speak: bool = Field(default=False, description="Generate a speech file for the response")
    language: str = Field(default="en", max_length=10)

    model_config = {
        "json_schema_extra": {"examples": [{"text": "what time is it", "speak": True}]}
    }


class AssistantTurn(BaseModel):
    id: int
    command: str
    response: str
    audio_url: Optional[str] = None
    created_at: datetime


class AssistantResponse(AssistantTurn):
    command_type: str = "unknown"
