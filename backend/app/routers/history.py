"""History and dashboard statistics API routes."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.common import MessageResponse
from app.schemas.history import HistoryItem, HistoryList, StatsResponse
from app.services import history_service

router = APIRouter(prefix="/api", tags=["history"])


@router.get("/history", response_model=HistoryList)
def list_history(
    type: str = Query(default="all", description="all | tts | stt | assistant"),
    search: str = Query(default="", max_length=120),
    limit: int = Query(default=200, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """List history records with optional type filter and text search."""
    records, total = history_service.list_records(
        db, record_type=type, search=search, limit=limit, offset=offset
    )
    return HistoryList(items=[HistoryItem.model_validate(r) for r in records], total=total)


@router.get("/stats", response_model=StatsResponse)
def stats(db: Session = Depends(get_db)):
    """Aggregated counters and recent activity for the dashboard."""
    data = history_service.stats(db)
    return StatsResponse(
        total_tts=data["total_tts"],
        total_stt=data["total_stt"],
        total_assistant=data["total_assistant"],
        total=data["total"],
        recent=[HistoryItem.model_validate(r) for r in data["recent"]],
    )


@router.delete("/history/{record_id}", response_model=MessageResponse)
def delete_history_item(record_id: int, db: Session = Depends(get_db)):
    """Delete a single history record."""
    history_service.delete_record(db, record_id)
    return MessageResponse(message=f"History record {record_id} deleted.")


@router.delete("/history", response_model=MessageResponse)
def clear_history(
    type: str = Query(default="all", description="all | tts | stt | assistant"),
    db: Session = Depends(get_db),
):
    """Clear all history, or only one record type."""
    deleted = history_service.clear_records(db, record_type=type)
    return MessageResponse(message=f"{deleted} history record(s) deleted.")
