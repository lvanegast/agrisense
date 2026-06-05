from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.alert import Alert
from src.domain.ports.alert_repository import AlertRepository
from ..models import AlertModel


class SqlAlchemyAlertRepository(AlertRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_by_id(self, id: UUID) -> Alert | None:
        result = await self._session.execute(
            select(AlertModel).where(AlertModel.id == id)
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def list_all(self, limit: int = 50) -> list[Alert]:
        result = await self._session.execute(
            select(AlertModel).order_by(AlertModel.created_at.desc()).limit(limit)
        )
        return [self._to_entity(m) for m in result.scalars().all()]

    async def list_unacknowledged(self) -> list[Alert]:
        result = await self._session.execute(
            select(AlertModel)
            .where(not AlertModel.acknowledged)
            .order_by(AlertModel.created_at.desc())
        )
        return [self._to_entity(m) for m in result.scalars().all()]

    async def add(self, alert: Alert) -> Alert:
        model = AlertModel(
            id=alert.id,
            rule_id=alert.rule_id,
            zone_id=alert.zone_id,
            sensor_id=alert.sensor_id,
            message=alert.message,
            reading_value=alert.reading_value,
            acknowledged=alert.acknowledged,
        )
        self._session.add(model)
        await self._session.flush()
        return alert

    async def update(self, alert: Alert) -> Alert:
        result = await self._session.execute(
            select(AlertModel).where(AlertModel.id == alert.id)
        )
        model = result.scalar_one_or_none()
        if model:
            model.acknowledged = alert.acknowledged
            await self._session.flush()
        return alert

    @staticmethod
    def _to_entity(model: AlertModel) -> Alert:
        return Alert(
            id=model.id,
            rule_id=model.rule_id,
            zone_id=model.zone_id,
            sensor_id=model.sensor_id,
            message=model.message,
            reading_value=model.reading_value,
            acknowledged=model.acknowledged,
            created_at=model.created_at,
        )
