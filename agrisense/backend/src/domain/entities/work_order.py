from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID, uuid4

from ..value_objects.work_order_status import WorkOrderStatus


@dataclass
class WorkOrder:
    title: str
    description: str
    zone_id: UUID
    sensor_id: UUID | None = None
    status: WorkOrderStatus = WorkOrderStatus.PENDING
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
