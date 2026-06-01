from enum import StrEnum


class ActuatorType(StrEnum):
    IRRIGATION_PUMP = "irrigation_pump"
    VENTILATION_FAN = "ventilation_fan"
    NUTRIENT_VALVE = "nutrient_valve"
    GROW_LIGHT = "grow_light"
