from abc import ABC, abstractmethod
from datetime import datetime
from uuid import UUID

from ..entities.reading import Reading


class ReadingRepository(ABC):
    @abstractmethod
    async def add(self, reading: Reading) -> Reading: ...

    @abstractmethod
    async def list_by_sensor(
        self, sensor_id: UUID, since: datetime | None = None, limit: int = 100
    ) -> list[Reading]: ...

    @abstractmethod
    async def get_latest_by_sensor(self, sensor_id: UUID) -> Reading | None: ...

    @abstractmethod
    async def get_latest_by_zone(self, zone_id: UUID) -> dict[UUID, Reading]: ...
