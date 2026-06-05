"""Seed database with demo data and optionally start the sensor simulator."""

import asyncio
from datetime import datetime, timedelta
from uuid import UUID

from src.infrastructure.db.config import async_session
from src.infrastructure.db.models import Base
from src.infrastructure.db.config import engine
from src.infrastructure.db.repositories import (
    SqlAlchemyAlertRepository,
    SqlAlchemyReadingRepository,
    SqlAlchemyRuleRepository,
    SqlAlchemySensorRepository,
    SqlAlchemyZoneRepository,
    SqlAlchemyActuatorRepository,
    SqlAlchemyWorkOrderRepository,
)
from src.application.services.reading_service import ReadingService
from src.application.services.rule_engine import RuleEngine
from src.domain.entities.zone import Zone
from src.domain.entities.sensor import Sensor
from src.domain.entities.rule import Rule
from src.domain.entities.actuator import Actuator
from src.domain.entities.work_order import WorkOrder
from src.domain.value_objects.sensor_type import SensorType
from src.domain.value_objects.operator import Operator
from src.domain.value_objects.actuator_type import ActuatorType
from src.domain.value_objects.work_order_status import WorkOrderStatus
from src.infrastructure.sensor_simulator import SensorSimulator

ZONES = [
    {
        "name": "Invernadero Tomates",
        "crop_type": "Tomate Cherry",
        "location": "Sector Norte",
        "area": 2.5,
        "days_ago": 15,
        "stage": "Crecimiento Vegetativo",
    },
    {
        "name": "Invernadero Lechugas",
        "crop_type": "Lechuga Hidropónica",
        "location": "Sector Central",
        "area": 1.8,
        "days_ago": 32,
        "stage": "Floración",
    },
    {
        "name": "Campo Exterior Maíz",
        "crop_type": "Maíz Dulce",
        "location": "Sector Sur",
        "area": 5.0,
        "days_ago": 5,
        "stage": "Germinación",
    },
    {
        "name": "Módulo de Bio-Insumos",
        "crop_type": "Lombrices & Compost",
        "location": "Eco-Sector",
        "area": 0.8,
        "days_ago": 60,
        "stage": "Madurez",
    },
]

SENSORS = [
    # Invernadero Tomates (zone index 0)
    {"name": "Temp. Tomates", "type": "temperature", "unit": "°C"},
    {"name": "Hum. Suelo Tomates", "type": "soil_moisture", "unit": "%"},
    {"name": "pH Tomates", "type": "ph", "unit": "pH"},
    # Invernadero Lechugas (zone index 1)
    {"name": "Temp. Lechugas", "type": "temperature", "unit": "°C"},
    {"name": "Hum. Ambiente Lechugas", "type": "humidity", "unit": "%"},
    {"name": "Luz Lechugas", "type": "light", "unit": "lux"},
    # Campo Exterior Maíz (zone index 2)
    {"name": "Temp. Exterior", "type": "temperature", "unit": "°C"},
    {"name": "Hum. Suelo Maíz", "type": "soil_moisture", "unit": "%"},
    {"name": "pH Maíz", "type": "ph", "unit": "pH"},
    # Módulo de Bio-Insumos (zone index 3)
    {"name": "Temp. Lombrices", "type": "temperature", "unit": "°C"},
    {"name": "Hum. Lombrices", "type": "soil_moisture", "unit": "%"},
    {"name": "pH Lombrices", "type": "ph", "unit": "pH"},
    {"name": "Temp. Compost", "type": "temperature", "unit": "°C"},
    {"name": "Oxígeno Compost", "type": "humidity", "unit": "%"},
]

RULES = [
    {
        "name": "Alerta Sequía",
        "description": "Humedad del suelo por debajo del 25%",
        "sensor_type": "soil_moisture",
        "operator": "lt",
        "threshold": 25.0,
        "action_type": "both",
    },
    {
        "name": "Temp. Alta Invernadero",
        "description": "Temperatura superior a 32°C en invernadero",
        "sensor_type": "temperature",
        "operator": "gt",
        "threshold": 32.0,
        "action_type": "alert",
    },
    {
        "name": "pH Anómalo",
        "description": "pH fuera de rango óptimo (5.5-7.0)",
        "sensor_type": "ph",
        "operator": "lt",
        "threshold": 5.5,
        "action_type": "both",
    },
    {
        "name": "Baja Luminosidad",
        "description": "Luz insuficiente para fotosíntesis",
        "sensor_type": "light",
        "operator": "lt",
        "threshold": 300.0,
        "action_type": "work_order",
    },
    {
        "name": "Estrés Lombrices",
        "description": "Humedad del lombricultivo por debajo del 65%",
        "sensor_type": "soil_moisture",
        "operator": "lt",
        "threshold": 65.0,
        "action_type": "both",
    },
    {
        "name": "Riego Inteligente Automático",
        "description": "Temp > 28°C y Humedad Suelo < 45% y Prob. Lluvia < 40% (No regar si va a llover)",
        "sensor_type": "soil_moisture",
        "operator": "lt",
        "threshold": 45.0,
        "action_type": "both",
        "conditions": [
            {"sensor_type": "soil_moisture", "operator": "lt", "threshold": 45.0},
            {"sensor_type": "temperature", "operator": "gt", "threshold": 28.0},
            {
                "sensor_type": "weather_rain_probability",
                "operator": "lt",
                "threshold": 40.0,
            },
        ],
    },
]


ACTUATORS = [
    # Invernadero Tomates (zone index 0)
    {"name": "Bomba Riego Tomates", "type": "irrigation_pump", "zone_index": 0},
    {"name": "Válvula Nutrientes Tomates", "type": "nutrient_valve", "zone_index": 0},
    # Invernadero Lechugas (zone index 1)
    {"name": "Extractor Aire Lechugas", "type": "ventilation_fan", "zone_index": 1},
    # Campo Exterior Maíz (zone index 2)
    {"name": "Bomba Riego Maíz", "type": "irrigation_pump", "zone_index": 2},
    # Módulo de Bio-Insumos (zone index 3)
    {"name": "Aspersor Lombrices", "type": "irrigation_pump", "zone_index": 3},
    {"name": "Aireador Compost", "type": "ventilation_fan", "zone_index": 3},
]

WORK_ORDERS = [
    {
        "title": "Mantenimiento Bombas",
        "description": "Revisar presión de bomba de agua y válvulas solenoides.",
        "status": "pending",
        "zone_index": 0,
    },
    {
        "title": "Calibración Sensores pH",
        "description": "Calibrar los electrodos de los sensores de pH de tomates y maíz.",
        "status": "in_progress",
        "zone_index": 1,
    },
    {
        "title": "Volteo de Compostera",
        "description": "Realizar volteo manual de la compostera para oxigenar los microorganismos.",
        "status": "pending",
        "zone_index": 3,
    },
]


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        zone_repo = SqlAlchemyZoneRepository(session)
        sensor_repo = SqlAlchemySensorRepository(session)
        rule_repo = SqlAlchemyRuleRepository(session)
        actuator_repo = SqlAlchemyActuatorRepository(session)
        work_order_repo = SqlAlchemyWorkOrderRepository(session)

        zone_ids: list[UUID] = []
        for z in ZONES:
            p_date = datetime.utcnow() - timedelta(days=z["days_ago"])
            zone = Zone(
                name=z["name"],
                crop_type=z["crop_type"],
                location=z["location"],
                area=z["area"],
                planting_date=p_date,
                current_stage=z["stage"],
            )
            await zone_repo.add(zone)
            zone_ids.append(zone.id)

        sensor_ids_per_type: dict[str, list[UUID]] = {}
        zone_sensor_map = [
            (0, 0),
            (1, 0),
            (2, 0),
            (3, 1),
            (4, 1),
            (5, 1),
            (6, 2),
            (7, 2),
            (8, 2),
            (9, 3),
            (10, 3),
            (11, 3),
            (12, 3),
            (13, 3),
        ]

        for sensor_index, zone_index in zone_sensor_map:
            s = SENSORS[sensor_index]
            sensor = Sensor(
                name=s["name"],
                type=SensorType(s["type"]),
                unit=s["unit"],
                zone_id=zone_ids[zone_index],
            )
            await sensor_repo.add(sensor)
            sensor_type = s["type"]
            if sensor_type not in sensor_ids_per_type:
                sensor_ids_per_type[sensor_type] = []
            sensor_ids_per_type[sensor_type].append(sensor.id)

        for r in RULES:
            rule = Rule(
                name=r["name"],
                description=r["description"],
                sensor_type=SensorType(r["sensor_type"])
                if not r["sensor_type"].startswith("weather_")
                else r["sensor_type"],
                operator=Operator(r["operator"]),
                threshold=r["threshold"],
                action_type=r["action_type"],
                conditions=r.get("conditions", []),
            )
            await rule_repo.add(rule)

        for a in ACTUATORS:
            actuator = Actuator(
                name=a["name"],
                type=ActuatorType(a["type"]),
                zone_id=zone_ids[a["zone_index"]],
            )
            await actuator_repo.add(actuator)

        for w in WORK_ORDERS:
            work_order = WorkOrder(
                title=w["title"],
                description=w["description"],
                status=WorkOrderStatus(w["status"]),
                zone_id=zone_ids[w["zone_index"]],
            )
            await work_order_repo.add(work_order)

        await session.commit()

    print(
        f"Seeded {len(ZONES)} zones, {len(SENSORS)} sensors, {len(RULES)} rules, {len(ACTUATORS)} actuators, {len(WORK_ORDERS)} work orders."
    )
    return sensor_ids_per_type


async def run_simulator(sensor_ids_per_type: dict[str, list[UUID]]):
    async with async_session() as session:
        reading_service = ReadingService(SqlAlchemyReadingRepository(session))
        rule_engine = RuleEngine(
            rule_repo=SqlAlchemyRuleRepository(session),
            alert_repo=SqlAlchemyAlertRepository(session),
            sensor_repo=SqlAlchemySensorRepository(session),
            reading_repo=SqlAlchemyReadingRepository(session),
            work_order_repo=SqlAlchemyWorkOrderRepository(session),
        )
        simulator = SensorSimulator(reading_service, rule_engine)
        print("Starting sensor simulator...")
        await simulator.run(sensor_ids_per_type, interval=3.0)


async def main():
    sensor_ids = await seed()
    await run_simulator(sensor_ids)


if __name__ == "__main__":
    asyncio.run(main())
