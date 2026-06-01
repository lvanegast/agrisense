from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from src.infrastructure.auth.jwt import get_current_user
from src.api.deps import get_work_order_service
from src.application.services.work_order_service import WorkOrderService
from src.domain.value_objects.work_order_status import WorkOrderStatus

router = APIRouter(prefix="/work-orders", tags=["work-orders"])


class CreateWorkOrderRequest(BaseModel):
    title: str
    description: str
    zone_id: UUID
    sensor_id: UUID | None = None


class UpdateWorkOrderStatusRequest(BaseModel):
    status: str


class WorkOrderResponse(BaseModel):
    id: str
    title: str
    description: str
    status: str
    zone_id: str
    sensor_id: str | None
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


@router.get("", response_model=list[WorkOrderResponse])
async def list_work_orders(
    status: str | None = None,
    zone_id: UUID | None = None,
    service: WorkOrderService = Depends(get_work_order_service),
    _user: str = Depends(get_current_user),
):
    enum_status = None
    if status:
        try:
            enum_status = WorkOrderStatus(status)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status value")

    wos = await service.list_work_orders(status=enum_status, zone_id=zone_id)
    return [
        WorkOrderResponse(
            id=str(w.id),
            title=w.title,
            description=w.description,
            status=w.status.value,
            zone_id=str(w.zone_id),
            sensor_id=str(w.sensor_id) if w.sensor_id else None,
            created_at=w.created_at.isoformat(),
            updated_at=w.updated_at.isoformat(),
        )
        for w in wos
    ]


@router.post("", response_model=WorkOrderResponse)
async def create_work_order(
    body: CreateWorkOrderRequest,
    service: WorkOrderService = Depends(get_work_order_service),
    _user: str = Depends(get_current_user),
):
    wo = await service.create_work_order(
        title=body.title,
        description=body.description,
        zone_id=body.zone_id,
        sensor_id=body.sensor_id,
    )
    return WorkOrderResponse(
        id=str(wo.id),
        title=wo.title,
        description=wo.description,
        status=wo.status.value,
        zone_id=str(wo.zone_id),
        sensor_id=str(wo.sensor_id) if wo.sensor_id else None,
        created_at=wo.created_at.isoformat(),
        updated_at=wo.updated_at.isoformat(),
    )


@router.get("/{work_order_id}", response_model=WorkOrderResponse)
async def get_work_order(
    work_order_id: UUID,
    service: WorkOrderService = Depends(get_work_order_service),
    _user: str = Depends(get_current_user),
):
    wo = await service.get_work_order(work_order_id)
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    return WorkOrderResponse(
        id=str(wo.id),
        title=wo.title,
        description=wo.description,
        status=wo.status.value,
        zone_id=str(wo.zone_id),
        sensor_id=str(wo.sensor_id) if wo.sensor_id else None,
        created_at=wo.created_at.isoformat(),
        updated_at=wo.updated_at.isoformat(),
    )


@router.patch("/{work_order_id}", response_model=WorkOrderResponse)
async def update_work_order_status(
    work_order_id: UUID,
    body: UpdateWorkOrderStatusRequest,
    service: WorkOrderService = Depends(get_work_order_service),
    _user: str = Depends(get_current_user),
):
    try:
        status = WorkOrderStatus(body.status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status value")

    try:
        wo = await service.update_status(work_order_id, status)
        return WorkOrderResponse(
            id=str(wo.id),
            title=wo.title,
            description=wo.description,
            status=wo.status.value,
            zone_id=str(wo.zone_id),
            sensor_id=str(wo.sensor_id) if wo.sensor_id else None,
            created_at=wo.created_at.isoformat(),
            updated_at=wo.updated_at.isoformat(),
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
