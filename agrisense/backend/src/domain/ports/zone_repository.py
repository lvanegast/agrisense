from abc import ABC, abstractmethod
from uuid import UUID

from ..entities.zone import Zone


class ZoneRepository(ABC):
    @abstractmethod
    async def get_by_id(self, id: UUID) -> Zone | None: ...

    @abstractmethod
    async def list_all(self) -> list[Zone]: ...

    @abstractmethod
    async def add(self, zone: Zone) -> Zone: ...
