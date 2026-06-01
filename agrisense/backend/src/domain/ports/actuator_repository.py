from abc import ABC, abstractmethod
from uuid import UUID

from ..entities.actuator import Actuator


class ActuatorRepository(ABC):
    @abstractmethod
    async def get_by_id(self, id: UUID) -> Actuator | None: ...

    @abstractmethod
    async def list_all(self) -> list[Actuator]: ...

    @abstractmethod
    async def list_by_zone(self, zone_id: UUID) -> list[Actuator]: ...

    @abstractmethod
    async def add(self, actuator: Actuator) -> Actuator: ...

    @abstractmethod
    async def update(self, actuator: Actuator) -> Actuator: ...
