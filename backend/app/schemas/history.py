"""History and statistics schemas."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class HistoryItem(BaseModel):
    id: int
    type: str
    input_text: str
    output_text: str
    audio_path: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class HistoryList(BaseModel):
    items: List[HistoryItem]
    total: int


class StatsResponse(BaseModel):
    total_tts: int
    total_stt: int
    total_assistant: int
    total: int
    recent: List[HistoryItem]
