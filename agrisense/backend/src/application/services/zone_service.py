from uuid import UUID

from src.domain.entities.zone import Zone
from src.domain.ports.zone_repository import ZoneRepository
from src.domain.ports.sensor_repository import SensorRepository
from src.domain.ports.reading_repository import ReadingRepository
from .health_score_service import HealthScoreService


class ZoneService:
    def __init__(
        self,
        zone_repo: ZoneRepository,
        sensor_repo: SensorRepository,
        reading_repo: ReadingRepository,
        health_score_service: HealthScoreService | None = None,
    ):
        self._zone_repo = zone_repo
        self._sensor_repo = sensor_repo
        self._reading_repo = reading_repo
        self._health_score_service = health_score_service


    async def list_zones(self) -> list[Zone]:
        return await self._zone_repo.list_all()

    async def get_zone(self, zone_id: UUID) -> Zone | None:
        return await self._zone_repo.get_by_id(zone_id)

    async def create_zone(self, name: str, crop_type: str, location: str = "", area: float = 0.0) -> Zone:
        zone = Zone(name=name, crop_type=crop_type, location=location, area=area)
        return await self._zone_repo.add(zone)

    async def get_zone_stats(self, zone_id: UUID) -> dict:
        zone = await self._zone_repo.get_by_id(zone_id)
        if not zone:
            return {}

        sensors = await self._sensor_repo.list_by_zone(zone_id)
        latest_readings = await self._reading_repo.get_latest_by_zone(zone_id)

        health_score = 100.0
        if self._health_score_service:
            health_score = await self._health_score_service.calculate_zone_health(zone_id)

        sensor_data = []
        for sensor in sensors:
            reading = latest_readings.get(sensor.id)
            sensor_data.append({
                "id": str(sensor.id),
                "name": sensor.name,
                "type": sensor.type.value,
                "unit": sensor.unit,
                "is_active": sensor.is_active,
                "latest_value": reading.value if reading else None,
                "latest_timestamp": reading.timestamp.isoformat() if reading and reading.timestamp else None,
            })

        return {
            "id": str(zone.id),
            "name": zone.name,
            "crop_type": zone.crop_type,
            "location": zone.location,
            "area": zone.area,
            "health_score": health_score,
            "sensors": sensor_data,
        }

