from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.domain.entities.reading import Reading
from src.domain.ports.reading_repository import ReadingRepository
from ..models import ReadingModel, SensorModel


class SqlAlchemyReadingRepository(ReadingRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    async def add(self, reading: Reading) -> Reading:
        model = ReadingModel(
            id=reading.id,
            sensor_id=reading.sensor_id,
            value=reading.value,
            timestamp=reading.timestamp,
        )
        self._session.add(model)
        await self._session.flush()
        return reading

    async def list_by_sensor(
        self, sensor_id: UUID, since: datetime | None = None, limit: int = 100
    ) -> list[Reading]:
        query = select(ReadingModel).where(ReadingModel.sensor_id == sensor_id)
        if since:
            query = query.where(ReadingModel.timestamp > since)
        query = query.order_by(ReadingModel.timestamp.desc()).limit(limit)
        result = await self._session.execute(query)
        return [self._to_entity(m) for m in result.scalars().all()]

    async def get_latest_by_sensor(self, sensor_id: UUID) -> Reading | None:
        result = await self._session.execute(
            select(ReadingModel)
            .where(ReadingModel.sensor_id == sensor_id)
            .order_by(ReadingModel.timestamp.desc())
            .limit(1)
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_latest_by_zone(self, zone_id: UUID) -> dict[UUID, Reading]:
        sensors_query = select(SensorModel.id).where(SensorModel.zone_id == zone_id)
        sensor_ids = (await self._session.execute(sensors_query)).scalars().all()

        if not sensor_ids:
            return {}

        from sqlalchemy import distinct, func

        subq = (
            select(
                ReadingModel.sensor_id,
                func.max(ReadingModel.timestamp).label("max_ts"),
            )
            .where(ReadingModel.sensor_id.in_(sensor_ids))
            .group_by(ReadingModel.sensor_id)
            .subquery()
        )

        result = await self._session.execute(
            select(ReadingModel).join(
                subq,
                (ReadingModel.sensor_id == subq.c.sensor_id)
                & (ReadingModel.timestamp == subq.c.max_ts),
            )
        )
        return {m.sensor_id: self._to_entity(m) for m in result.scalars().all()}

    @staticmethod
    def _to_entity(model: ReadingModel) -> Reading:
        return Reading(
            id=model.id,
            sensor_id=model.sensor_id,
            value=model.value,
            timestamp=model.timestamp,
        )
