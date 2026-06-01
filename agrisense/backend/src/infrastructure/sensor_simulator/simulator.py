import asyncio
import math
import random
import time
from datetime import datetime, timezone
from uuid import UUID

from src.domain.entities.reading import Reading
from src.domain.value_objects.sensor_type import SensorType
from src.application.services.reading_service import ReadingService
from src.application.services.rule_engine import RuleEngine


class SensorSimulator:
    def __init__(self, reading_service: ReadingService, rule_engine: RuleEngine):
        self._reading_service = reading_service
        self._rule_engine = rule_engine

    async def run(self, sensor_ids: dict[str, list[UUID]], interval: float = 3.0):
        """Run continuous simulation. sensor_ids maps sensor_type -> list of sensor UUIDs."""
        t = 0.0
        while True:
            for sensor_type_str, ids in sensor_ids.items():
                sensor_type = SensorType(sensor_type_str)
                for sid in ids:
                    value = self._generate_value(sensor_type, t, str(sid))
                    await self._reading_service.add_reading(sid, value)

            await self._rule_engine.evaluate()
            
            # Commit the session to make readings visible to the rest of the application
            if hasattr(self._reading_service._reading_repo, "_session"):
                await self._reading_service._reading_repo._session.commit()
                
            t += interval
            await asyncio.sleep(interval)


    def _generate_value(self, sensor_type: SensorType, t: float, sensor_id: str) -> float:
        seed = hash(sensor_id) % 100
        noise = random.gauss(0, 1)

        match sensor_type:
            case SensorType.TEMPERATURE:
                base = 25 + 8 * math.sin(t / 30 + seed)
                return round(base + noise * 1.5, 2)

            case SensorType.HUMIDITY:
                base = 65 + 15 * math.sin(t / 45 + seed)
                return round(max(0, min(100, base + noise * 3)), 2)

            case SensorType.SOIL_MOISTURE:
                # Trending down to trigger drought alert
                base = 40 - t / 20 + 10 * math.sin(t / 25 + seed)
                return round(max(0, min(100, base + noise * 2)), 2)

            case SensorType.PH:
                base = 6.5 + 0.8 * math.sin(t / 60 + seed)
                return round(max(0, min(14, base + noise * 0.3)), 2)

            case SensorType.LIGHT:
                base = 600 + 400 * math.sin(t / 20 + seed)
                return round(max(0, base + noise * 30), 2)

            case _:
                return round(noise, 2)
