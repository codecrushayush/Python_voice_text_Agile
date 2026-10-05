"""History service: persistence helpers for conversion records and statistics."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy import desc, func, or_
from sqlalchemy.orm import Session

from app.models.history import TYPE_ASSISTANT, TYPE_STT, TYPE_TTS, VALID_TYPES, ConversionHistory
from app.utils.exceptions import NotFoundError, ValidationError


def add_record(
    db: Session,
    record_type: str,
    input_text: str = "",
    output_text: str = "",
    audio_path: Optional[str] = None,
) -> ConversionHistory:
    """Persist one conversion/assistant record and return it."""
    if record_type not in VALID_TYPES:
        raise ValidationError(f"Invalid history type '{record_type}'.")

    record = ConversionHistory(
        type=record_type,
        input_text=input_text or "",
        output_text=output_text or "",
        audio_path=audio_path,
        created_at=datetime.utcnow(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def list_records(
    db: Session,
    record_type: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 200,
    offset: int = 0,
) -> tuple[List[ConversionHistory], int]:
    """Return filtered records plus the total count."""
    if record_type and record_type != "all":
        if record_type not in VALID_TYPES:
            raise ValidationError(f"Invalid filter '{record_type}'. Use one of: all, {', '.join(VALID_TYPES)}.")
        query = db.query(ConversionHistory).filter(ConversionHistory.type == record_type)
    else:
        query = db.query(ConversionHistory)

    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                ConversionHistory.input_text.like(pattern),
                ConversionHistory.output_text.like(pattern),
            )
        )

    total = query.count()
    records = (
        query.order_by(desc(ConversionHistory.created_at), desc(ConversionHistory.id))
        .offset(max(offset, 0))
        .limit(min(max(limit, 1), 500))
        .all()
    )
    return records, total


def get_record(db: Session, record_id: int) -> ConversionHistory:
    """Fetch a single record or raise a 404 style error."""
    record = db.query(ConversionHistory).filter(ConversionHistory.id == record_id).first()
    if record is None:
        raise NotFoundError(f"History record {record_id} was not found.")
    return record


def delete_record(db: Session, record_id: int) -> ConversionHistory:
    """Delete one record by id."""
    record = get_record(db, record_id)
    db.delete(record)
    db.commit()
    return record


def clear_records(db: Session, record_type: Optional[str] = None) -> int:
    """Delete every record (optionally only one type). Return rows removed."""
    query = db.query(ConversionHistory)
    if record_type and record_type != "all":
        if record_type not in VALID_TYPES:
            raise ValidationError(f"Invalid filter '{record_type}'.")
        query = query.filter(ConversionHistory.type == record_type)
    deleted = query.delete(synchronize_session=False)
    db.commit()
    return int(deleted or 0)


def stats(db: Session) -> dict:
    """Aggregate counters used by the dashboard."""
    rows = (
        db.query(ConversionHistory.type, func.count(ConversionHistory.id))
        .group_by(ConversionHistory.type)
        .all()
    )
    counts = {row_type: int(count) for row_type, count in rows}
    recent, _ = list_records(db, limit=8)
    total = sum(counts.values())
    return {
        "total_tts": counts.get(TYPE_TTS, 0),
        "total_stt": counts.get(TYPE_STT, 0),
        "total_assistant": counts.get(TYPE_ASSISTANT, 0),
        "total": total,
        "recent": recent,
    }
