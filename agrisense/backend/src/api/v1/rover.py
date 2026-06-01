from fastapi import APIRouter, Depends
from pydantic import BaseModel

from src.infrastructure.auth.jwt import get_current_user
from src.api.deps import get_rover_simulator
from src.application.services.rover_simulator import RoverSimulatorService

router = APIRouter(prefix="/rover", tags=["rover"])


class RoverTelemetryResponse(BaseModel):
    name: str
    status: str
    battery: float
    speed: float
    heading: float
    x: float
    y: float
    logs: list[str]


@router.get("/telemetry", response_model=RoverTelemetryResponse)
async def get_rover_telemetry(
    rover: RoverSimulatorService = Depends(get_rover_simulator),
    _user: str = Depends(get_current_user),
):
    return RoverTelemetryResponse(**rover.get_telemetry())
