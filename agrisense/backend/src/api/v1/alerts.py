from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from src.infrastructure.auth.jwt import get_current_user
from src.api.deps import get_rule_engine
from src.application.services.rule_engine import RuleEngine

router = APIRouter(prefix="/alerts", tags=["alerts"])


class AlertResponse(BaseModel):
    id: str
    rule_id: str
    zone_id: str
    sensor_id: str
    message: str
    reading_value: float
    acknowledged: bool
    created_at: str

    model_config = {"from_attributes": True}


@router.get("", response_model=list[AlertResponse])
async def list_alerts(
    limit: int = Query(default=50, le=200),
    unacknowledged_only: bool = Query(default=False),
    engine: RuleEngine = Depends(get_rule_engine),
    _user: str = Depends(get_current_user),
):
    if unacknowledged_only:
        alerts = await engine.list_unacknowledged_alerts()
    else:
        alerts = await engine.list_alerts(limit=limit)
    return [
        AlertResponse(
            id=str(a.id), rule_id=str(a.rule_id), zone_id=str(a.zone_id),
            sensor_id=str(a.sensor_id), message=a.message,
            reading_value=a.reading_value, acknowledged=a.acknowledged,
            created_at=a.created_at.isoformat(),
        )
        for a in alerts
    ]


@router.patch("/{alert_id}", response_model=AlertResponse)
async def acknowledge_alert(
    alert_id: UUID,
    engine: RuleEngine = Depends(get_rule_engine),
    _user: str = Depends(get_current_user),
):
    alert = await engine.acknowledge_alert(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return AlertResponse(
        id=str(alert.id), rule_id=str(alert.rule_id), zone_id=str(alert.zone_id),
        sensor_id=str(alert.sensor_id), message=alert.message,
        reading_value=alert.reading_value, acknowledged=alert.acknowledged,
        created_at=alert.created_at.isoformat(),
    )
