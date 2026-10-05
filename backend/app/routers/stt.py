"""Speech-to-Text API routes (microphone recording or audio file upload)."""

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.history import TYPE_STT
from app.schemas.stt import STTResponse
from app.services import history_service, stt_service
from app.utils.audio_utils import MAX_UPLOAD_BYTES, validate_upload
from app.utils.exceptions import DomainError

router = APIRouter(prefix="/api/stt", tags=["speech-to-text"])

_CHUNK = 1024 * 1024


async def _read_limited(upload: UploadFile) -> bytes:
    """Read an upload while enforcing the 10 MB size limit."""
    chunks = []
    total = 0
    while True:
        chunk = await upload.read(_CHUNK)
        if not chunk:
            break
        total += len(chunk)
        if total > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="The uploaded file is too large. Maximum size is 10 MB.")
        chunks.append(chunk)
    return b"".join(chunks)


@router.post("", response_model=STTResponse, status_code=201)
async def convert_speech_to_text(
    file: UploadFile = File(..., description="Recorded or uploaded audio file"),
    language: str = Form(default="en"),
    source: str = Form(default="upload"),
    db: Session = Depends(get_db),
):
    """Transcribe a WAV/MP3/OGG/WebM upload into plain text."""
    data = await _read_limited(file)
    try:
        filename = validate_upload(file.filename or "audio.wav", len(data))
        result = stt_service.transcribe(data=data, filename=filename, language=language)
    except DomainError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    record = history_service.add_record(
        db,
        record_type=TYPE_STT,
        input_text=filename,
        output_text=result["text"],
        audio_path=None,
    )

    return STTResponse(
        id=record.id,
        text=result["text"],
        source=source if source in {"microphone", "upload"} else "upload",
        filename=result["filename"],
        duration_seconds=result["duration"],
        created_at=record.created_at,
    )
