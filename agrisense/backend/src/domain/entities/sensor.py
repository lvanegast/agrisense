from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID, uuid4

from ..value_objects.sensor_type import SensorType


@dataclass
class Sensor:
    name: str
    type: SensorType
    unit: str
    zone_id: UUID
    id: UUID = field(default_factory=uuid4)
    is_active: bool = True
    created_at: datetime = field(default_factory=datetime.utcnow)
