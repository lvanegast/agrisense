from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.actuator import Actuator
from src.domain.value_objects.actuator_type import ActuatorType
from src.domain.ports.actuator_repository import ActuatorRepository
from ..models import ActuatorModel


class SqlAlchemyActuatorRepository(ActuatorRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_by_id(self, id: UUID) -> Actuator | None:
        result = await self._session.execute(
            select(ActuatorModel).where(ActuatorModel.id == id)
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def list_all(self) -> list[Actuator]:
        result = await self._session.execute(select(ActuatorModel).order_by(ActuatorModel.created_at))
        return [self._to_entity(m) for m in result.scalars().all()]

    async def list_by_zone(self, zone_id: UUID) -> list[Actuator]:
        result = await self._session.execute(
            select(ActuatorModel).where(ActuatorModel.zone_id == zone_id).order_by(ActuatorModel.created_at)
        )
        return [self._to_entity(m) for m in result.scalars().all()]

    async def add(self, actuator: Actuator) -> Actuator:
        model = ActuatorModel(
            id=actuator.id,
            name=actuator.name,
            type=str(actuator.type),
            is_on=actuator.is_on,
            zone_id=actuator.zone_id,
            created_at=actuator.created_at,
        )
        self._session.add(model)
        await self._session.flush()
        return actuator

    async def update(self, actuator: Actuator) -> Actuator:
        result = await self._session.execute(
            select(ActuatorModel).where(ActuatorModel.id == actuator.id)
        )
        model = result.scalar_one_or_none()
        if model:
            model.name = actuator.name
            model.type = str(actuator.type)
            model.is_on = actuator.is_on
            model.zone_id = actuator.zone_id
            await self._session.flush()
        return actuator

    @staticmethod
    def _to_entity(model: ActuatorModel) -> Actuator:
        return Actuator(
            id=model.id,
            name=model.name,
            type=ActuatorType(model.type),
            is_on=model.is_on,
            zone_id=model.zone_id,
            created_at=model.created_at,
        )
