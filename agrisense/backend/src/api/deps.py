from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.db.config import get_session
from src.infrastructure.db.repositories import (
    SqlAlchemyZoneRepository,
    SqlAlchemySensorRepository,
    SqlAlchemyReadingRepository,
    SqlAlchemyRuleRepository,
    SqlAlchemyAlertRepository,
    SqlAlchemyActuatorRepository,
    SqlAlchemyWorkOrderRepository,
)
from src.application.services import (
    ZoneService,
    ReadingService,
    RuleEngine,
    HealthScoreService,
    ActuatorService,
    WorkOrderService,
    RoverSimulatorService,
)


def get_zone_repo(session: AsyncSession = Depends(get_session)):
    return SqlAlchemyZoneRepository(session)


def get_sensor_repo(session: AsyncSession = Depends(get_session)):
    return SqlAlchemySensorRepository(session)


def get_reading_repo(session: AsyncSession = Depends(get_session)):
    return SqlAlchemyReadingRepository(session)


def get_rule_repo(session: AsyncSession = Depends(get_session)):
    return SqlAlchemyRuleRepository(session)


def get_alert_repo(session: AsyncSession = Depends(get_session)):
    return SqlAlchemyAlertRepository(session)


def get_actuator_repo(session: AsyncSession = Depends(get_session)):
    return SqlAlchemyActuatorRepository(session)


def get_work_order_repo(session: AsyncSession = Depends(get_session)):
    return SqlAlchemyWorkOrderRepository(session)


def get_zone_service(session: AsyncSession = Depends(get_session)):
    return ZoneService(
        zone_repo=SqlAlchemyZoneRepository(session),
        sensor_repo=SqlAlchemySensorRepository(session),
        reading_repo=SqlAlchemyReadingRepository(session),
    )


def get_reading_service(session: AsyncSession = Depends(get_session)):
    return ReadingService(reading_repo=SqlAlchemyReadingRepository(session))


def get_rule_engine(session: AsyncSession = Depends(get_session)):
    return RuleEngine(
        rule_repo=SqlAlchemyRuleRepository(session),
        alert_repo=SqlAlchemyAlertRepository(session),
        sensor_repo=SqlAlchemySensorRepository(session),
        reading_repo=SqlAlchemyReadingRepository(session),
        work_order_repo=SqlAlchemyWorkOrderRepository(session),
    )


def get_health_score_service(session: AsyncSession = Depends(get_session)):
    return HealthScoreService(
        sensor_repo=SqlAlchemySensorRepository(session),
        reading_repo=SqlAlchemyReadingRepository(session),
    )


def get_actuator_service(session: AsyncSession = Depends(get_session)):
    return ActuatorService(actuator_repo=SqlAlchemyActuatorRepository(session))


def get_work_order_service(session: AsyncSession = Depends(get_session)):
    return WorkOrderService(work_order_repo=SqlAlchemyWorkOrderRepository(session))


def get_rover_simulator():
    return RoverSimulatorService()
