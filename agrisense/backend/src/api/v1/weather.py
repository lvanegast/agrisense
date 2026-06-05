from fastapi import APIRouter, Depends
from src.application.services.weather_service import WeatherService
from src.infrastructure.auth.jwt import get_current_user

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("")
async def get_weather(_user: str = Depends(get_current_user)):
    service = WeatherService()
    return {
        "current": service.get_current_weather(),
        "forecast": service.get_forecast(),
    }
