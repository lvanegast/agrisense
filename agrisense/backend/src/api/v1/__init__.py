from fastapi import APIRouter

from .auth import router as auth_router
from .zones import router as zones_router
from .sensors import router as sensors_router
from .readings import router as readings_router
from .rules import router as rules_router
from .alerts import router as alerts_router
from .actuators import router as actuators_router
from .work_orders import router as work_orders_router
from .rover import router as rover_router
from .weather import router as weather_router
from .copilot import router as copilot_router

router = APIRouter(prefix="/api/v1")
router.include_router(auth_router)
router.include_router(zones_router)
router.include_router(sensors_router)
router.include_router(readings_router)
router.include_router(rules_router)
router.include_router(alerts_router)
router.include_router(actuators_router)
router.include_router(work_orders_router)
router.include_router(rover_router)
router.include_router(weather_router)
router.include_router(copilot_router)
