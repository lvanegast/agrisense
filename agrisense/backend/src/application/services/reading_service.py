from datetime import datetime
from uuid import UUID

from src.domain.entities.reading import Reading
from src.domain.ports.reading_repository import ReadingRepository


class ReadingService:
    def __init__(self, reading_repo: ReadingRepository):
        self._reading_repo = reading_repo

    async def add_reading(self, sensor_id: UUID, value: float, timestamp: datetime | None = None) -> Reading:
        reading = Reading(
            sensor_id=sensor_id,
            value=value,
            timestamp=timestamp or datetime.utcnow(),
        )
        return await self._reading_repo.add(reading)

    async def get_readings(
        self, sensor_id: UUID, since: datetime | None = None, limit: int = 100
    ) -> list[Reading]:
        return await self._reading_repo.list_by_sensor(sensor_id, since=since, limit=limit)

    async def get_latest_by_zone(self, zone_id: UUID) -> dict[UUID, Reading]:
        return await self._reading_repo.get_latest_by_zone(zone_id)
