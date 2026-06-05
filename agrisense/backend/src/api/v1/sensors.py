from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from src.infrastructure.auth.jwt import get_current_user
from src.api.deps import get_sensor_repo
from src.domain.ports.sensor_repository import SensorRepository

router = APIRouter(prefix="/sensors", tags=["sensors"])


class CreateSensorRequest(BaseModel):
    name: str
    type: str
    unit: str


class SensorResponse(BaseModel):
    id: str
    name: str
    type: str
    unit: str
    zone_id: str
    is_active: bool

    model_config = {"from_attributes": True}


@router.get("/{sensor_id}", response_model=SensorResponse)
async def get_sensor(
    sensor_id: UUID,
    repo: SensorRepository = Depends(get_sensor_repo),
    _user: str = Depends(get_current_user),
):
    sensor = await repo.get_by_id(sensor_id)
    if not sensor:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Sensor not found")
    return SensorResponse(
        id=str(sensor.id),
        name=sensor.name,
        type=sensor.type.value,
        unit=sensor.unit,
        zone_id=str(sensor.zone_id),
        is_active=sensor.is_active,
    )
