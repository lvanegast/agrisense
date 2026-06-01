from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID, uuid4

from ..value_objects.actuator_type import ActuatorType


@dataclass
class Actuator:
    name: str
    type: ActuatorType
    zone_id: UUID
    id: UUID = field(default_factory=uuid4)
    is_on: bool = False
    created_at: datetime = field(default_factory=datetime.utcnow)
