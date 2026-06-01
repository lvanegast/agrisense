from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.work_order import WorkOrder
from src.domain.value_objects.work_order_status import WorkOrderStatus
from src.domain.ports.work_order_repository import WorkOrderRepository
from ..models import WorkOrderModel


class SqlAlchemyWorkOrderRepository(WorkOrderRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_by_id(self, id: UUID) -> WorkOrder | None:
        result = await self._session.execute(
            select(WorkOrderModel).where(WorkOrderModel.id == id)
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def list_all(self) -> list[WorkOrder]:
        result = await self._session.execute(
            select(WorkOrderModel).order_by(WorkOrderModel.created_at.desc())
        )
        return [self._to_entity(m) for m in result.scalars().all()]

    async def list_by_zone(self, zone_id: UUID) -> list[WorkOrder]:
        result = await self._session.execute(
            select(WorkOrderModel)
            .where(WorkOrderModel.zone_id == zone_id)
            .order_by(WorkOrderModel.created_at.desc())
        )
        return [self._to_entity(m) for m in result.scalars().all()]

    async def list_by_status(self, status: WorkOrderStatus) -> list[WorkOrder]:
        result = await self._session.execute(
            select(WorkOrderModel)
            .where(WorkOrderModel.status == str(status))
            .order_by(WorkOrderModel.created_at.desc())
        )
        return [self._to_entity(m) for m in result.scalars().all()]

    async def add(self, work_order: WorkOrder) -> WorkOrder:
        model = WorkOrderModel(
            id=work_order.id,
            title=work_order.title,
            description=work_order.description,
            status=str(work_order.status),
            zone_id=work_order.zone_id,
            sensor_id=work_order.sensor_id,
            created_at=work_order.created_at,
            updated_at=work_order.updated_at,
        )
        self._session.add(model)
        await self._session.flush()
        return work_order

    async def update(self, work_order: WorkOrder) -> WorkOrder:
        result = await self._session.execute(
            select(WorkOrderModel).where(WorkOrderModel.id == work_order.id)
        )
        model = result.scalar_one_or_none()
        if model:
            model.title = work_order.title
            model.description = work_order.description
            model.status = str(work_order.status)
            model.zone_id = work_order.zone_id
            model.sensor_id = work_order.sensor_id
            model.updated_at = datetime.utcnow()
            await self._session.flush()
            work_order.updated_at = model.updated_at
        return work_order

    @staticmethod
    def _to_entity(model: WorkOrderModel) -> WorkOrder:
        return WorkOrder(
            id=model.id,
            title=model.title,
            description=model.description,
            status=WorkOrderStatus(model.status),
            zone_id=model.zone_id,
            sensor_id=model.sensor_id,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )
