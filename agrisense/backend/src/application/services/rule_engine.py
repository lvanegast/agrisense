from uuid import UUID

from src.domain.entities.alert import Alert
from src.domain.ports.rule_repository import RuleRepository
from src.domain.ports.alert_repository import AlertRepository
from src.domain.ports.sensor_repository import SensorRepository
from src.domain.ports.reading_repository import ReadingRepository


from src.domain.ports.work_order_repository import WorkOrderRepository
from src.domain.entities.work_order import WorkOrder
from src.domain.value_objects.work_order_status import WorkOrderStatus


class RuleEngine:
    def __init__(
        self,
        rule_repo: RuleRepository,
        alert_repo: AlertRepository,
        sensor_repo: SensorRepository,
        reading_repo: ReadingRepository,
        work_order_repo: WorkOrderRepository | None = None,
    ):
        self._rule_repo = rule_repo
        self._alert_repo = alert_repo
        self._sensor_repo = sensor_repo
        self._reading_repo = reading_repo
        self._work_order_repo = work_order_repo

    async def evaluate(self) -> list[Alert]:
        from src.domain.value_objects.operator import Operator
        from src.application.services.weather_service import WeatherService

        rules = await self._rule_repo.list_active()
        triggered: list[Alert] = []

        sensors = await self._sensor_repo.list_all()
        # Group sensors by zone_id
        sensors_by_zone = {}
        for sensor in sensors:
            if sensor.zone_id not in sensors_by_zone:
                sensors_by_zone[sensor.zone_id] = []
            sensors_by_zone[sensor.zone_id].append(sensor)

        weather_service = WeatherService()
        weather = weather_service.get_current_weather()

        for zone_id, zone_sensors in sensors_by_zone.items():
            latest_readings = await self._reading_repo.get_latest_by_zone(zone_id)

            for rule in rules:
                is_triggered = False
                trigger_details = []
                primary_sensor_id = None
                primary_reading_value = 0.0
                message = ""

                # Check if it is a complex rule (has conditions list)
                if hasattr(rule, "conditions") and rule.conditions:
                    conditions_met = True
                    for cond in rule.conditions:
                        s_type = cond.get("sensor_type")
                        op_val = cond.get("operator")
                        threshold = cond.get("threshold")

                        op = Operator(op_val)

                        if str(s_type).startswith("weather_"):
                            # Weather condition
                            field = str(s_type).replace("weather_", "")
                            actual_val = weather.get(field)
                            unit = (
                                "°C"
                                if "temperature" in field
                                else (" km/h" if "wind" in field else "%")
                            )

                            if actual_val is None or not op.evaluate(
                                actual_val, threshold
                            ):
                                conditions_met = False
                                break
                            trigger_details.append(
                                f"Clima {field}: {actual_val}{unit} ({op.value} {threshold})"
                            )
                        else:
                            # Sensor condition
                            matching_sensor = next(
                                (s for s in zone_sensors if s.type == s_type), None
                            )
                            if not matching_sensor:
                                conditions_met = False
                                break

                            latest = latest_readings.get(matching_sensor.id)
                            if latest is None or not op.evaluate(
                                latest.value, threshold
                            ):
                                conditions_met = False
                                break

                            if primary_sensor_id is None:
                                primary_sensor_id = matching_sensor.id
                                primary_reading_value = latest.value
                            trigger_details.append(
                                f"{matching_sensor.name}: {latest.value:.1f}{matching_sensor.unit} ({op.value} {threshold})"
                            )

                    if conditions_met:
                        is_triggered = True
                        message_detail = ", ".join(trigger_details)
                        message = f"{rule.name} (Multi-Condición): {message_detail}"
                        if primary_sensor_id is None and zone_sensors:
                            primary_sensor_id = zone_sensors[0].id
                            primary_reading_value = 0.0
                else:
                    # Single condition rule (original logic)
                    matching_sensor = next(
                        (s for s in zone_sensors if s.type == rule.sensor_type), None
                    )
                    if matching_sensor:
                        latest = latest_readings.get(matching_sensor.id)
                        if latest is not None and rule.operator.evaluate(
                            latest.value, rule.threshold
                        ):
                            is_triggered = True
                            primary_sensor_id = matching_sensor.id
                            primary_reading_value = latest.value
                            message = f"{rule.name}: {matching_sensor.name} {rule.operator.value} {rule.threshold} (actual: {latest.value:.1f}{matching_sensor.unit})"

                if is_triggered and primary_sensor_id:
                    # 1. Ejecutar Acción: Alert
                    is_alert = rule.action_type in ("alert", "both") or not hasattr(
                        rule, "action_type"
                    )
                    if is_alert:
                        alert = Alert(
                            rule_id=rule.id,
                            zone_id=zone_id,
                            sensor_id=primary_sensor_id,
                            message=message,
                            reading_value=primary_reading_value,
                        )
                        await self._alert_repo.add(alert)
                        triggered.append(alert)

                    # 2. Ejecutar Acción: Work Order
                    is_work_order = hasattr(
                        rule, "action_type"
                    ) and rule.action_type in ("work_order", "both")
                    if is_work_order and self._work_order_repo:
                        existing = await self._work_order_repo.list_by_zone(zone_id)
                        has_active = any(
                            w.sensor_id == primary_sensor_id
                            and w.status
                            in (WorkOrderStatus.PENDING, WorkOrderStatus.IN_PROGRESS)
                            for w in existing
                        )
                        if not has_active:
                            title = f"Intervención: {rule.name}"
                            description = (
                                f"La regla compleja '{rule.name}' ha sido disparada. Detalles:\n"
                                f"{message}.\n"
                                f"Requiere inspección en zona."
                            )
                            work_order = WorkOrder(
                                title=title,
                                description=description,
                                zone_id=zone_id,
                                sensor_id=primary_sensor_id,
                                status=WorkOrderStatus.PENDING,
                            )
                            await self._work_order_repo.add(work_order)

        return triggered

        return triggered

    async def list_alerts(self, limit: int = 50) -> list[Alert]:
        return await self._alert_repo.list_all(limit=limit)

    async def list_unacknowledged_alerts(self) -> list[Alert]:
        return await self._alert_repo.list_unacknowledged()

    async def acknowledge_alert(self, alert_id: UUID) -> Alert | None:
        alert = await self._alert_repo.get_by_id(alert_id)
        if alert is None:
            return None
        alert.acknowledged = True
        return await self._alert_repo.update(alert)
