import pytest
from src.application.services.weather_service import WeatherService

def test_get_current_weather():
    service = WeatherService()
    weather = service.get_current_weather()
    
    assert "temperature" in weather
    assert "humidity" in weather
    assert "wind_speed" in weather
    assert "rain_probability" in weather
    assert "condition" in weather
    assert "sim_hour" in weather
    
    # Check logical ranges
    assert 5.0 <= weather["temperature"] <= 35.0
    assert 0 <= weather["humidity"] <= 100
    assert 0 <= weather["wind_speed"] <= 40
    assert 0 <= weather["rain_probability"] <= 100
    assert isinstance(weather["condition"], str)

def test_get_forecast():
    service = WeatherService()
    forecast = service.get_forecast()
    
    assert len(forecast) == 4
    for f in forecast:
        assert "time" in f
        assert "temperature" in f
        assert "condition" in f
        assert "rain_probability" in f
        assert f["time"].startswith("+")
        assert 0 <= f["rain_probability"] <= 100
