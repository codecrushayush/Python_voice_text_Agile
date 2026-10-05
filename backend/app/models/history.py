"""SQLAlchemy model for stored conversions."""

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

TYPE_TTS = "tts"
TYPE_STT = "stt"
TYPE_ASSISTANT = "assistant"
VALID_TYPES = (TYPE_TTS, TYPE_STT, TYPE_ASSISTANT)


class ConversionHistory(Base):
    """Single table that stores Text-to-Speech, Speech-to-Text and assistant activity."""

    __tablename__ = "conversion_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    input_text: Mapped[str] = mapped_column(Text, nullable=False, default="")
    output_text: Mapped[str] = mapped_column(Text, nullable=False, default="")
    audio_path: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<ConversionHistory id={self.id} type={self.type}>"
