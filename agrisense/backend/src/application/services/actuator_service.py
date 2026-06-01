from uuid import UUID

from src.domain.entities.actuator import Actuator
from src.domain.value_objects.actuator_type import ActuatorType
from src.domain.ports.actuator_repository import ActuatorRepository


class ActuatorService:
    def __init__(self, actuator_repo: ActuatorRepository):
        self._actuator_repo = actuator_repo

    async def list_by_zone(self, zone_id: UUID) -> list[Actuator]:
        return await self._actuator_repo.list_by_zone(zone_id)

    async def get_actuator(self, actuator_id: UUID) -> Actuator | None:
        return await self._actuator_repo.get_by_id(actuator_id)

    async def toggle(self, actuator_id: UUID) -> Actuator:
        actuator = await self._actuator_repo.get_by_id(actuator_id)
        if not actuator:
            raise ValueError("Actuator not found")
        
        actuator.is_on = not actuator.is_on
        return await self._actuator_repo.update(actuator)

    async def create_actuator(self, name: str, type: ActuatorType, zone_id: UUID) -> Actuator:
        actuator = Actuator(name=name, type=type, zone_id=zone_id)
        return await self._actuator_repo.add(actuator)
