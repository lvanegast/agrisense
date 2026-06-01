from abc import ABC, abstractmethod
from uuid import UUID

from ..entities.work_order import WorkOrder
from ..value_objects.work_order_status import WorkOrderStatus


class WorkOrderRepository(ABC):
    @abstractmethod
    async def get_by_id(self, id: UUID) -> WorkOrder | None: ...

    @abstractmethod
    async def list_all(self) -> list[WorkOrder]: ...

    @abstractmethod
    async def list_by_zone(self, zone_id: UUID) -> list[WorkOrder]: ...

    @abstractmethod
    async def list_by_status(self, status: WorkOrderStatus) -> list[WorkOrder]: ...

    @abstractmethod
    async def add(self, work_order: WorkOrder) -> WorkOrder: ...

    @abstractmethod
    async def update(self, work_order: WorkOrder) -> WorkOrder: ...
