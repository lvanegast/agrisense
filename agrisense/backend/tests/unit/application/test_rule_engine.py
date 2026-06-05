import pytest
from uuid import uuid4
from unittest.mock import AsyncMock

from src.application.services.rule_engine import RuleEngine
from src.domain.entities.rule import Rule
from src.domain.entities.sensor import Sensor
from src.domain.entities.reading import Reading
from src.domain.value_objects.sensor_type import SensorType
from src.domain.value_objects.operator import Operator

@pytest.mark.asyncio
async def test_rule_engine_evaluate_single_condition_triggers():
    # Setup mocks
    rule_repo = AsyncMock()
    alert_repo = AsyncMock()
    sensor_repo = AsyncMock()
    reading_repo = AsyncMock()
    work_order_repo = AsyncMock()
    
    # 1. Create a mock active rule (Temp > 30)
    rule = Rule(
        name="High Temp",
        description="Trigger when temp is high",
        sensor_type=SensorType.TEMPERATURE,
        operator=Operator.GT,
        threshold=30.0,
        action_type="alert"
    )
    rule_repo.list_active.return_value = [rule]
    
    # 2. Create a mock sensor
    zone_id = uuid4()
    sensor = Sensor(
        name="Temp Sensor",
        type=SensorType.TEMPERATURE,
        unit="°C",
        zone_id=zone_id
    )
    sensor_repo.list_all.return_value = [sensor]
    
    # 3. Create a latest reading (value = 32.5, which is > 30.0)
    latest_reading = Reading(
        sensor_id=sensor.id,
        value=32.5
    )
    reading_repo.get_latest_by_zone.return_value = {sensor.id: latest_reading}
    
    # Instantiate RuleEngine
    engine = RuleEngine(
        rule_repo=rule_repo,
        alert_repo=alert_repo,
        sensor_repo=sensor_repo,
        reading_repo=reading_repo,
        work_order_repo=work_order_repo
    )
    
    # Evaluate
    alerts = await engine.evaluate()
    
    # Verifications
    assert len(alerts) == 1
    assert alerts[0].rule_id == rule.id
    assert alerts[0].zone_id == zone_id
    assert alerts[0].sensor_id == sensor.id
    assert "High Temp" in alerts[0].message
    assert alert_repo.add.call_count == 1
