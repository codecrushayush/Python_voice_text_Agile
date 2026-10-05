"""Virtual Assistant API routes (rule based, no AI)."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.history import TYPE_ASSISTANT
from app.schemas.assistant import AssistantRequest, AssistantResponse
from app.services import assistant_service, history_service, tts_service
from app.utils.audio_utils import store_audio

router = APIRouter(prefix="/api/assistant", tags=["virtual-assistant"])


@router.get("/commands")
def commands():
    """Documented list of supported assistant commands."""
    return {"commands": assistant_service.available_commands()}


@router.post("", response_model=AssistantResponse, status_code=201)
def run_command(payload: AssistantRequest, db: Session = Depends(get_db)):
    """Execute a predefined command and return the scripted response."""
    result = assistant_service.execute(payload.text)

    audio_url = None
    if payload.speak:
        try:
            speech = tts_service.synthesize(result["response"], language=payload.language, engine="auto")
            audio_url = store_audio(speech["data"], speech["extension"])
        except Exception:
            audio_url = None

    record = history_service.add_record(
        db,
        record_type=TYPE_ASSISTANT,
        input_text=result["command"],
        output_text=result["response"],
        audio_path=audio_url,
    )

    return AssistantResponse(
        id=record.id,
        command=result["command"],
        response=result["response"],
        command_type=result["command_type"],
        audio_url=audio_url,
        created_at=record.created_at,
    )
