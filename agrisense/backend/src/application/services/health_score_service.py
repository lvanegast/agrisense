from uuid import UUID

from src.domain.ports.sensor_repository import SensorRepository
from src.domain.ports.reading_repository import ReadingRepository


class HealthScoreService:
    def __init__(
        self,
        sensor_repo: SensorRepository,
        reading_repo: ReadingRepository,
    ):
        self._sensor_repo = sensor_repo
        self._reading_repo = reading_repo

    async def calculate_zone_health(self, zone_id: UUID) -> float:
        """Calcula un Health Score de 0 a 100 para una zona basándose en sus lecturas recientes."""
        sensors = await self._sensor_repo.list_by_zone(zone_id)
        active_sensors = [s for s in sensors if s.is_active]
        if not active_sensors:
            return 100.0  # Sin sensores, por defecto está saludable

        latest_readings = await self._reading_repo.get_latest_by_zone(zone_id)
        if not latest_readings:
            return 100.0  # Sin lecturas recientes, por defecto está saludable

        scores = {}
        weights = {
            "soil_moisture": 0.40,
            "temperature": 0.30,
            "humidity": 0.20,
            "ph": 0.15,
            "light": 0.15,
        }

        # Calcular puntuación individual para cada sensor presente
        for sensor in active_sensors:
            reading = latest_readings.get(sensor.id)
            if not reading:
                continue

            val = reading.value
            s_type = sensor.type.value

            # Rangos óptimos y penalizaciones
            if s_type == "temperature":
                # Óptimo: 20°C - 28°C
                if 20.0 <= val <= 28.0:
                    score = 100.0
                else:
                    dist = min(abs(val - 20.0), abs(val - 28.0))
                    score = max(0.0, 100.0 - (dist * 8.0))
                scores["temperature"] = score

            elif s_type == "soil_moisture":
                # Óptimo: 35% - 70%
                if 35.0 <= val <= 70.0:
                    score = 100.0
                else:
                    dist = min(abs(val - 35.0), abs(val - 70.0))
                    score = max(0.0, 100.0 - (dist * 4.0))
                scores["soil_moisture"] = score

            elif s_type == "humidity":
                # Óptimo: 40% - 70%
                if 40.0 <= val <= 70.0:
                    score = 100.0
                else:
                    dist = min(abs(val - 40.0), abs(val - 70.0))
                    score = max(0.0, 100.0 - (dist * 3.0))
                scores["humidity"] = score

            elif s_type == "ph":
                # Óptimo: 6.0 - 7.0
                if 6.0 <= val <= 7.0:
                    score = 100.0
                else:
                    dist = min(abs(val - 6.0), abs(val - 7.0))
                    score = max(0.0, 100.0 - (dist * 75.0))
                scores["ph"] = score

            elif s_type == "light":
                # Óptimo: 400 - 800 lux
                if 400.0 <= val <= 800.0:
                    score = 100.0
                else:
                    dist = min(abs(val - 400.0), abs(val - 800.0))
                    score = max(0.0, 100.0 - (dist * 0.15))
                scores["light"] = score

        if not scores:
            return 100.0

        # Calcular promedio ponderado dinámicamente según sensores activos
        total_weight = 0.0
        weighted_sum = 0.0

        for key, val_score in scores.items():
            w = weights.get(key, 0.10)
            weighted_sum += val_score * w
            total_weight += w

        if total_weight == 0.0:
            return sum(scores.values()) / len(scores)

        return round(weighted_sum / total_weight, 1)
