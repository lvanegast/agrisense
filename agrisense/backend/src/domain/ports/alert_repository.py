from abc import ABC, abstractmethod
from uuid import UUID

from ..entities.alert import Alert


class AlertRepository(ABC):
    @abstractmethod
    async def get_by_id(self, id: UUID) -> Alert | None: ...

    @abstractmethod
    async def list_all(self, limit: int = 50) -> list[Alert]: ...

    @abstractmethod
    async def list_unacknowledged(self) -> list[Alert]: ...

    @abstractmethod
    async def add(self, alert: Alert) -> Alert: ...

    @abstractmethod
    async def update(self, alert: Alert) -> Alert: ...
