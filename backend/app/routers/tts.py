"""Text-to-Speech API routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.history import TYPE_TTS
from app.schemas.tts import TTSRequest, TTSResponse
from app.services import history_service, tts_service
from app.utils.audio_utils import store_audio

router = APIRouter(prefix="/api/tts", tags=["text-to-speech"])


@router.get("/languages")
def languages():
    """Languages supported by the Text-to-Speech engine."""
    return {"languages": tts_service.describe_languages()}


@router.post("", response_model=TTSResponse, status_code=201)
def convert_text_to_speech(payload: TTSRequest, db: Session = Depends(get_db)):
    """Convert text into an audio file and store the conversion in history."""
    result = tts_service.synthesize(
        text=payload.text,
        language=payload.language,
        rate=payload.rate,
        engine=payload.engine,
    )
    audio_url = store_audio(result["data"], result["extension"])

    record = history_service.add_record(
        db,
        record_type=TYPE_TTS,
        input_text=payload.text.strip(),
        output_text=f"[audio generated with {result['engine']}]",
        audio_path=audio_url,
    )

    return TTSResponse(
        id=record.id,
        text=record.input_text,
        language=payload.language,
        rate=payload.rate,
        engine=result["engine"],
        audio_url=audio_url,
        created_at=record.created_at,
    )
