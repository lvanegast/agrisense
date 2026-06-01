from enum import StrEnum


class SensorType(StrEnum):
    TEMPERATURE = "temperature"
    HUMIDITY = "humidity"
    SOIL_MOISTURE = "soil_moisture"
    PH = "ph"
    LIGHT = "light"
