from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from src.infrastructure.auth.jwt import get_current_user
from src.api.deps import get_zone_service, get_actuator_service
from src.application.services.zone_service import ZoneService
from src.application.services.actuator_service import ActuatorService

router = APIRouter(prefix="/zones", tags=["zones"])


class CreateZoneRequest(BaseModel):
    name: str
    crop_type: str
    location: str = ""
    area: float = 0.0


class SensorSummary(BaseModel):
    id: str
    name: str
    type: str
    unit: str
    is_active: bool
    latest_value: float | None
    latest_timestamp: str | None

    model_config = {"from_attributes": True}


class ActuatorSummary(BaseModel):
    id: str
    name: str
    type: str
    is_on: bool

    model_config = {"from_attributes": True}


class ZoneStatsResponse(BaseModel):
    id: str
    name: str
    crop_type: str
    location: str
    area: float
    planting_date: str | None = None
    current_stage: str = "Germinación"
    health_score: float
    sensors: list[SensorSummary]
    actuators: list[ActuatorSummary] = []

    model_config = {"from_attributes": True}


class ZoneResponse(BaseModel):
    id: str
    name: str
    crop_type: str
    location: str
    area: float
    planting_date: str | None = None
    current_stage: str = "Germinación"
    created_at: str

    model_config = {"from_attributes": True}


class UpdateZonePhenologyRequest(BaseModel):
    planting_date: datetime | None = None
    current_stage: str | None = None


@router.get("", response_model=list[ZoneResponse])
async def list_zones(
    service: ZoneService = Depends(get_zone_service),
    _user: str = Depends(get_current_user),
):
    zones = await service.list_zones()
    return [
        ZoneResponse(
            id=str(z.id),
            name=z.name,
            crop_type=z.crop_type,
            location=z.location,
            area=z.area,
            planting_date=z.planting_date.isoformat() if z.planting_date else None,
            current_stage=z.current_stage,
            created_at=z.created_at.isoformat(),
        )
        for z in zones
    ]


@router.post("", response_model=ZoneResponse)
async def create_zone(
    body: CreateZoneRequest,
    service: ZoneService = Depends(get_zone_service),
    _user: str = Depends(get_current_user),
):
    zone = await service.create_zone(
        name=body.name, crop_type=body.crop_type, location=body.location, area=body.area
    )
    return ZoneResponse(
        id=str(zone.id),
        name=zone.name,
        crop_type=zone.crop_type,
        location=zone.location,
        area=zone.area,
        planting_date=zone.planting_date.isoformat() if zone.planting_date else None,
        current_stage=zone.current_stage,
        created_at=zone.created_at.isoformat(),
    )


@router.get("/{zone_id}", response_model=ZoneResponse)
async def get_zone(
    zone_id: UUID,
    service: ZoneService = Depends(get_zone_service),
    _user: str = Depends(get_current_user),
):
    zone = await service.get_zone(zone_id)
    if not zone:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Zone not found")
    return ZoneResponse(
        id=str(zone.id),
        name=zone.name,
        crop_type=zone.crop_type,
        location=zone.location,
        area=zone.area,
        planting_date=zone.planting_date.isoformat() if zone.planting_date else None,
        current_stage=zone.current_stage,
        created_at=zone.created_at.isoformat(),
    )


@router.post("/{zone_id}/phenology", response_model=ZoneResponse)
async def update_zone_phenology(
    zone_id: UUID,
    body: UpdateZonePhenologyRequest,
    service: ZoneService = Depends(get_zone_service),
    _user: str = Depends(get_current_user),
):
    zone = await service.update_zone_phenology(
        zone_id=zone_id, planting_date=body.planting_date, stage=body.current_stage
    )
    if not zone:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Zone not found")
    return ZoneResponse(
        id=str(zone.id),
        name=zone.name,
        crop_type=zone.crop_type,
        location=zone.location,
        area=zone.area,
        planting_date=zone.planting_date.isoformat() if zone.planting_date else None,
        current_stage=zone.current_stage,
        created_at=zone.created_at.isoformat(),
    )


@router.get("/{zone_id}/stats", response_model=ZoneStatsResponse)
async def get_zone_stats(
    zone_id: UUID,
    service: ZoneService = Depends(get_zone_service),
    actuator_service: ActuatorService = Depends(get_actuator_service),
    _user: str = Depends(get_current_user),
):
    stats = await service.get_zone_stats(zone_id)
    if not stats:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Zone not found")
    # Attach actuators to the stats dict before serialization
    actuators = await actuator_service.list_by_zone(zone_id)
    stats["actuators"] = [
        {"id": str(a.id), "name": a.name, "type": a.type.value, "is_on": a.is_on}
        for a in actuators
    ]
    return stats


@router.get("/{zone_id}/health-score")
async def get_zone_health_score(
    zone_id: UUID,
    service: ZoneService = Depends(get_zone_service),
    _user: str = Depends(get_current_user),
):
    stats = await service.get_zone_stats(zone_id)
    if not stats:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Zone not found")
    return {"health_score": stats.get("health_score", 100.0)}
