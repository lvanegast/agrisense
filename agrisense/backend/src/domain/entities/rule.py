from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID, uuid4

from ..value_objects.sensor_type import SensorType
from ..value_objects.operator import Operator


@dataclass
class Rule:
    name: str
    description: str
    sensor_type: SensorType
    operator: Operator
    threshold: float
    id: UUID = field(default_factory=uuid4)
    is_active: bool = True
    action_type: str = "alert"  # alert | work_order | both
    created_at: datetime = field(default_factory=datetime.utcnow)

