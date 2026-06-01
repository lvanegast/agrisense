from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.rule import Rule
from src.domain.value_objects.sensor_type import SensorType
from src.domain.value_objects.operator import Operator
from src.domain.ports.rule_repository import RuleRepository
from ..models import RuleModel


class SqlAlchemyRuleRepository(RuleRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_by_id(self, id: UUID) -> Rule | None:
        result = await self._session.execute(
            select(RuleModel).where(RuleModel.id == id)
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def list_active(self) -> list[Rule]:
        result = await self._session.execute(
            select(RuleModel).where(RuleModel.is_active == True)
        )
        return [self._to_entity(m) for m in result.scalars().all()]

    async def list_all(self) -> list[Rule]:
        result = await self._session.execute(select(RuleModel).order_by(RuleModel.created_at))
        return [self._to_entity(m) for m in result.scalars().all()]

    async def add(self, rule: Rule) -> Rule:
        model = RuleModel(
            id=rule.id,
            name=rule.name,
            description=rule.description,
            sensor_type=rule.sensor_type.value,
            operator=rule.operator.value,
            threshold=rule.threshold,
            is_active=rule.is_active,
            action_type=rule.action_type,
        )
        self._session.add(model)
        await self._session.flush()
        return rule

    async def update(self, rule: Rule) -> Rule:
        result = await self._session.execute(
            select(RuleModel).where(RuleModel.id == rule.id)
        )
        model = result.scalar_one_or_none()
        if model:
            model.is_active = rule.is_active
            model.name = rule.name
            model.description = rule.description
            model.threshold = rule.threshold
            model.operator = rule.operator.value
            model.action_type = rule.action_type
            await self._session.flush()
        return rule

    @staticmethod
    def _to_entity(model: RuleModel) -> Rule:
        return Rule(
            id=model.id,
            name=model.name,
            description=model.description,
            sensor_type=SensorType(model.sensor_type),
            operator=Operator(model.operator),
            threshold=model.threshold,
            is_active=model.is_active,
            action_type=model.action_type,
            created_at=model.created_at,
        )

