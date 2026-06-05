from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID, uuid4


@dataclass
class Zone:
    name: str
    crop_type: str
    location: str = ""
    area: float = 0.0
    planting_date: datetime | None = None
    current_stage: str = "Germinación"
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=datetime.utcnow)
