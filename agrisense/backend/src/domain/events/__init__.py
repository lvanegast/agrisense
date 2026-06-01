from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class ThresholdExceeded:
    sensor_id: UUID
    zone_id: UUID
    sensor_type: str
    value: float
    threshold: float
    timestamp: datetime


@dataclass
class RuleTriggered:
    rule_id: UUID
    zone_id: UUID
    sensor_id: UUID
    message: str
    timestamp: datetime
