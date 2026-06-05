from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from src.infrastructure.auth.jwt import get_current_user
from src.api.deps import get_actuator_service
from src.application.services.actuator_service import ActuatorService

router = APIRouter(prefix="/actuators", tags=["actuators"])


class ActuatorResponse(BaseModel):
    id: str
    name: str
    type: str
    is_on: bool
    zone_id: str
    created_at: str

    model_config = {"from_attributes": True}


@router.get("", response_model=list[ActuatorResponse])
async def list_actuators(
    zone_id: UUID | None = None,
    service: ActuatorService = Depends(get_actuator_service),
    _user: str = Depends(get_current_user),
):
    if zone_id:
        actuators = await service.list_by_zone(zone_id)
    else:
        # Si no hay zone_id, retornar lista de todos los actuadores del sistema
        # Para simplificar y mantener compatibilidad, listamos todos desde el repo del servicio
        actuators = await service._actuator_repo.list_all()

    return [
        ActuatorResponse(
            id=str(a.id),
            name=a.name,
            type=a.type.value,
            is_on=a.is_on,
            zone_id=str(a.zone_id),
            created_at=a.created_at.isoformat(),
        )
        for a in actuators
    ]


@router.post("/{actuator_id}/toggle", response_model=ActuatorResponse)
async def toggle_actuator(
    actuator_id: UUID,
    service: ActuatorService = Depends(get_actuator_service),
    _user: str = Depends(get_current_user),
):
    try:
        actuator = await service.toggle(actuator_id)
        return ActuatorResponse(
            id=str(actuator.id),
            name=actuator.name,
            type=actuator.type.value,
            is_on=actuator.is_on,
            zone_id=str(actuator.zone_id),
            created_at=actuator.created_at.isoformat(),
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
