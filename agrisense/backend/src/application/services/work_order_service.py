from datetime import datetime
from uuid import UUID

from src.domain.entities.work_order import WorkOrder
from src.domain.value_objects.work_order_status import WorkOrderStatus
from src.domain.ports.work_order_repository import WorkOrderRepository


class WorkOrderService:
    def __init__(self, work_order_repo: WorkOrderRepository):
        self._work_order_repo = work_order_repo

    async def list_work_orders(
        self, status: WorkOrderStatus | None = None, zone_id: UUID | None = None
    ) -> list[WorkOrder]:
        if zone_id:
            # Filtrar por zona, luego por estado si es necesario
            wos = await self._work_order_repo.list_by_zone(zone_id)
            if status:
                return [w for w in wos if w.status == status]
            return wos
        elif status:
            return await self._work_order_repo.list_by_status(status)
        return await self._work_order_repo.list_all()

    async def get_work_order(self, id: UUID) -> WorkOrder | None:
        return await self._work_order_repo.get_by_id(id)

    async def create_work_order(
        self, title: str, description: str, zone_id: UUID, sensor_id: UUID | None = None
    ) -> WorkOrder:
        work_order = WorkOrder(
            title=title,
            description=description,
            zone_id=zone_id,
            sensor_id=sensor_id,
            status=WorkOrderStatus.PENDING,
        )
        return await self._work_order_repo.add(work_order)

    async def update_status(self, id: UUID, status: WorkOrderStatus) -> WorkOrder:
        work_order = await self._work_order_repo.get_by_id(id)
        if not work_order:
            raise ValueError("Work order not found")
        work_order.status = status
        work_order.updated_at = datetime.utcnow()
        return await self._work_order_repo.update(work_order)
