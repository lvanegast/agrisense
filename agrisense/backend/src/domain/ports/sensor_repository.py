from abc import ABC, abstractmethod
from uuid import UUID

from ..entities.sensor import Sensor


class SensorRepository(ABC):
    @abstractmethod
    async def get_by_id(self, id: UUID) -> Sensor | None: ...

    @abstractmethod
    async def list_by_zone(self, zone_id: UUID) -> list[Sensor]: ...

    @abstractmethod
    async def list_all(self) -> list[Sensor]: ...

    @abstractmethod
    async def add(self, sensor: Sensor) -> Sensor: ...
