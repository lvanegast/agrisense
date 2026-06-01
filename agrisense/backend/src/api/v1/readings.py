from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from src.infrastructure.auth.jwt import get_current_user
from src.api.deps import get_reading_service
from src.application.services.reading_service import ReadingService

router = APIRouter(prefix="/readings", tags=["readings"])


class CreateReadingRequest(BaseModel):
    value: float
    timestamp: datetime | None = None


class ReadingResponse(BaseModel):
    id: str
    sensor_id: str
    value: float
    timestamp: str

    model_config = {"from_attributes": True}


@router.get("/sensor/{sensor_id}", response_model=list[ReadingResponse])
async def list_readings(
    sensor_id: UUID,
    since: datetime | None = Query(default=None),
    limit: int = Query(default=100, le=500),
    service: ReadingService = Depends(get_reading_service),
    _user: str = Depends(get_current_user),
):
    readings = await service.get_readings(sensor_id, since=since, limit=limit)
    return [
        ReadingResponse(
            id=str(r.id),
            sensor_id=str(r.sensor_id),
            value=r.value,
            timestamp=r.timestamp.isoformat(),
        )
        for r in readings
    ]


@router.post("/sensor/{sensor_id}", response_model=ReadingResponse)
async def create_reading(
    sensor_id: UUID,
    body: CreateReadingRequest,
    service: ReadingService = Depends(get_reading_service),
):
    reading = await service.add_reading(sensor_id, body.value, body.timestamp)
    return ReadingResponse(
        id=str(reading.id),
        sensor_id=str(reading.sensor_id),
        value=reading.value,
        timestamp=reading.timestamp.isoformat(),
    )
