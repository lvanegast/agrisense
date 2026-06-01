from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from src.infrastructure.auth.jwt import get_current_user
from src.api.deps import get_rule_repo
from src.domain.entities.rule import Rule
from src.domain.value_objects.sensor_type import SensorType
from src.domain.value_objects.operator import Operator
from src.domain.ports.rule_repository import RuleRepository

router = APIRouter(prefix="/rules", tags=["rules"])


class CreateRuleRequest(BaseModel):
    name: str
    description: str = ""
    sensor_type: str
    operator: str
    threshold: float


class UpdateRuleRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    threshold: float | None = None
    operator: str | None = None
    is_active: bool | None = None


class RuleResponse(BaseModel):
    id: str
    name: str
    description: str
    sensor_type: str
    operator: str
    threshold: float
    is_active: bool
    created_at: str

    model_config = {"from_attributes": True}


@router.get("", response_model=list[RuleResponse])
async def list_rules(
    repo: RuleRepository = Depends(get_rule_repo),
    _user: str = Depends(get_current_user),
):
    rules = await repo.list_all()
    return [
        RuleResponse(
            id=str(r.id), name=r.name, description=r.description,
            sensor_type=r.sensor_type.value, operator=r.operator.value,
            threshold=r.threshold, is_active=r.is_active,
            created_at=r.created_at.isoformat(),
        )
        for r in rules
    ]


@router.post("", response_model=RuleResponse)
async def create_rule(
    body: CreateRuleRequest,
    repo: RuleRepository = Depends(get_rule_repo),
    _user: str = Depends(get_current_user),
):
    if body.sensor_type not in SensorType.__members__.values():
        raise HTTPException(status_code=400, detail=f"Invalid sensor_type: {body.sensor_type}")
    if body.operator not in Operator.__members__.values():
        raise HTTPException(status_code=400, detail=f"Invalid operator: {body.operator}")

    rule = Rule(
        name=body.name, description=body.description,
        sensor_type=SensorType(body.sensor_type),
        operator=Operator(body.operator), threshold=body.threshold,
    )
    rule = await repo.add(rule)
    return RuleResponse(
        id=str(rule.id), name=rule.name, description=rule.description,
        sensor_type=rule.sensor_type.value, operator=rule.operator.value,
        threshold=rule.threshold, is_active=rule.is_active,
        created_at=rule.created_at.isoformat(),
    )


@router.patch("/{rule_id}", response_model=RuleResponse)
async def update_rule(
    rule_id: UUID,
    body: UpdateRuleRequest,
    repo: RuleRepository = Depends(get_rule_repo),
    _user: str = Depends(get_current_user),
):
    rule = await repo.get_by_id(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    if body.name is not None:
        rule.name = body.name
    if body.description is not None:
        rule.description = body.description
    if body.threshold is not None:
        rule.threshold = body.threshold
    if body.operator is not None:
        if body.operator not in Operator.__members__.values():
            raise HTTPException(status_code=400, detail=f"Invalid operator: {body.operator}")
        rule.operator = Operator(body.operator)
    if body.is_active is not None:
        rule.is_active = body.is_active

    rule = await repo.update(rule)
    return RuleResponse(
        id=str(rule.id), name=rule.name, description=rule.description,
        sensor_type=rule.sensor_type.value, operator=rule.operator.value,
        threshold=rule.threshold, is_active=rule.is_active,
        created_at=rule.created_at.isoformat(),
    )
