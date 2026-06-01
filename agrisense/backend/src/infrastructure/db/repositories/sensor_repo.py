from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.sensor import Sensor
from src.domain.value_objects.sensor_type import SensorType
from src.domain.ports.sensor_repository import SensorRepository
from ..models import SensorModel


class SqlAlchemySensorRepository(SensorRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_by_id(self, id: UUID) -> Sensor | None:
        result = await self._session.execute(
            select(SensorModel).where(SensorModel.id == id)
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def list_by_zone(self, zone_id: UUID) -> list[Sensor]:
        result = await self._session.execute(
            select(SensorModel).where(SensorModel.zone_id == zone_id)
        )
        return [self._to_entity(m) for m in result.scalars().all()]

    async def list_all(self) -> list[Sensor]:
        result = await self._session.execute(select(SensorModel))
        return [self._to_entity(m) for m in result.scalars().all()]

    async def add(self, sensor: Sensor) -> Sensor:
        model = SensorModel(
            id=sensor.id,
            name=sensor.name,
            type=sensor.type.value,
            unit=sensor.unit,
            zone_id=sensor.zone_id,
            is_active=sensor.is_active,
        )
        self._session.add(model)
        await self._session.flush()
        return sensor

    @staticmethod
    def _to_entity(model: SensorModel) -> Sensor:
        return Sensor(
            id=model.id,
            name=model.name,
            type=SensorType(model.type),
            unit=model.unit,
            zone_id=model.zone_id,
            is_active=model.is_active,
            created_at=model.created_at,
        )
