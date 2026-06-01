from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID, uuid4


@dataclass
class Alert:
    rule_id: UUID
    zone_id: UUID
    sensor_id: UUID
    message: str
    reading_value: float
    id: UUID = field(default_factory=uuid4)
    acknowledged: bool = False
    created_at: datetime = field(default_factory=datetime.utcnow)
