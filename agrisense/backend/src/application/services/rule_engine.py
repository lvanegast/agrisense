from uuid import UUID

from src.domain.entities.alert import Alert
from src.domain.entities.reading import Reading
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
        rules = await self._rule_repo.list_active()
        triggered: list[Alert] = []

        for rule in rules:
            sensors = await self._sensor_repo.list_all()
            matching_sensors = [s for s in sensors if s.type == rule.sensor_type]

            for sensor in matching_sensors:
                latest = await self._reading_repo.get_latest_by_sensor(sensor.id)
                if latest is None:
                    continue

                if rule.operator.evaluate(latest.value, rule.threshold):
                    # 1. Ejecutar Acción: Alert (Alerta estándar)
                    # Se dispara si action_type es "alert" o "both" (o por defecto para retrocompatibilidad)
                    is_alert = rule.action_type in ("alert", "both") or not hasattr(rule, "action_type")
                    alert = None

                    if is_alert:
                        alert = Alert(
                            rule_id=rule.id,
                            zone_id=sensor.zone_id,
                            sensor_id=sensor.id,
                            message=f"{rule.name}: {sensor.name} {rule.operator.value} {rule.threshold} (actual: {latest.value:.1f}{sensor.unit})",
                            reading_value=latest.value,
                        )
                        await self._alert_repo.add(alert)
                        triggered.append(alert)

                    # 2. Ejecutar Acción: Work Order (Orden de trabajo)
                    # Se dispara si action_type es "work_order" o "both"
                    is_work_order = hasattr(rule, "action_type") and rule.action_type in ("work_order", "both")
                    if is_work_order and self._work_order_repo:
                        # Evitar duplicados: verificar si ya hay una orden pendiente o en proceso para este sensor
                        existing = await self._work_order_repo.list_by_zone(sensor.zone_id)
                        has_active = any(
                            w.sensor_id == sensor.id
                            and w.status in (WorkOrderStatus.PENDING, WorkOrderStatus.IN_PROGRESS)
                            for w in existing
                        )

                        if not has_active:
                            title = f"Intervención: {rule.name}"
                            description = (
                                f"La regla de automatización '{rule.name}' detectó una lectura anómala "
                                f"en {sensor.name}: {latest.value:.1f}{sensor.unit} (umbral crítico: {rule.operator.value} {rule.threshold}). "
                                f"Requiere inspección y activación manual de actuadores."
                            )
                            work_order = WorkOrder(
                                title=title,
                                description=description,
                                zone_id=sensor.zone_id,
                                sensor_id=sensor.id,
                                status=WorkOrderStatus.PENDING,
                            )
                            await self._work_order_repo.add(work_order)

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
