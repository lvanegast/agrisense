from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.zone import Zone
from src.domain.ports.zone_repository import ZoneRepository
from ..models import ZoneModel


class SqlAlchemyZoneRepository(ZoneRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_by_id(self, id: UUID) -> Zone | None:
        result = await self._session.execute(
            select(ZoneModel).where(ZoneModel.id == id)
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def list_all(self) -> list[Zone]:
        result = await self._session.execute(
            select(ZoneModel).order_by(ZoneModel.created_at)
        )
        return [self._to_entity(m) for m in result.scalars().all()]

    async def add(self, zone: Zone) -> Zone:
        model = ZoneModel(
            id=zone.id,
            name=zone.name,
            crop_type=zone.crop_type,
            location=zone.location,
            area=zone.area,
            planting_date=zone.planting_date,
            current_stage=zone.current_stage,
        )
        self._session.add(model)
        await self._session.flush()
        return zone

    async def update(self, zone: Zone) -> Zone:
        result = await self._session.execute(
            select(ZoneModel).where(ZoneModel.id == zone.id)
        )
        model = result.scalar_one_or_none()
        if model:
            model.name = zone.name
            model.crop_type = zone.crop_type
            model.location = zone.location
            model.area = zone.area
            model.planting_date = zone.planting_date
            model.current_stage = zone.current_stage
            await self._session.flush()
        return zone

    @staticmethod
    def _to_entity(model: ZoneModel) -> Zone:
        return Zone(
            id=model.id,
            name=model.name,
            crop_type=model.crop_type,
            location=model.location,
            area=model.area,
            planting_date=model.planting_date,
            current_stage=model.current_stage,
            created_at=model.created_at,
        )
