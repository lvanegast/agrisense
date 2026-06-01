from abc import ABC, abstractmethod
from uuid import UUID

from ..entities.rule import Rule


class RuleRepository(ABC):
    @abstractmethod
    async def get_by_id(self, id: UUID) -> Rule | None: ...

    @abstractmethod
    async def list_active(self) -> list[Rule]: ...

    @abstractmethod
    async def list_all(self) -> list[Rule]: ...

    @abstractmethod
    async def add(self, rule: Rule) -> Rule: ...

    @abstractmethod
    async def update(self, rule: Rule) -> Rule: ...
