import asyncio
import math
from datetime import datetime


class RoverSimulatorService:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(RoverSimulatorService, cls).__new__(cls, *args, **kwargs)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self.name = "AgriRover-1"
        self.status = "patrolling"
        self.battery = 100.0
        self.speed = 2.2  # Velocidad de paso
        self.heading = 0.0
        
        # Circuito predefinido sobre la finca en la cuadrícula SVG (0-100)
        self.path = [
            (25.0, 25.0),  # Invernadero Tomates (Cerca del sector)
            (50.0, 25.0),  # Camino Central Norte
            (50.0, 50.0),  # Invernadero Lechugas
            (75.0, 50.0),  # Camino Este
            (75.0, 75.0),  # Campo Exterior Maíz
            (25.0, 75.0),  # Retorno por el Oeste
        ]
        self.current_waypoint_index = 0
        self.x, self.y = self.path[0]
        self.logs = [
            f"[{datetime.utcnow().strftime('%H:%M:%S')}] System initialized. AgriRover navigation nodes online.",
            f"[{datetime.utcnow().strftime('%H:%M:%S')}] LiDAR, RTK GPS and obstacle sensors calibrated.",
            f"[{datetime.utcnow().strftime('%H:%M:%S')}] Starting autonomous coverage path planning loop."
        ]

        self._lock = asyncio.Lock()

    async def update_step(self):
        async with self._lock:
            timestamp = datetime.utcnow().strftime('%H:%M:%S')
            
            # 1. Carga de Batería si está cargando
            if self.status == "charging":
                self.battery += 15.0
                if self.battery >= 100.0:
                    self.battery = 100.0
                    self.status = "patrolling"
                    self.logs.append(f"[{timestamp}] Battery fully charged. Resuming patrol loop.")
                return

            # Descarga de Batería constante
            self.battery -= 0.4
            if self.battery <= 15.0:
                self.status = "charging"
                self.x, self.y = 25.0, 25.0  # Volver a la estación de carga rápida (cerca de la base)
                self.logs.append(f"[{timestamp}] Low battery warning ({self.battery:.1f}%). Returning to Charging Station.")
                return

            # 2. Rutina de Muestreo (Sampling)
            if self.status == "sampling":
                self.status = "patrolling"
                self.logs.append(f"[{timestamp}] Multispectral scan completed. Navigating to next target.")
                return

            # 3. Navegación al waypoint objetivo
            target_x, target_y = self.path[self.current_waypoint_index]
            dx = target_x - self.x
            dy = target_y - self.y
            distance = math.sqrt(dx*dx + dy*dy)

            if distance < 2.5:
                # waypoint alcanzado, pasar al siguiente
                self.current_waypoint_index = (self.current_waypoint_index + 1) % len(self.path)
                self.status = "sampling"
                self.logs.append(f"[{timestamp}] Waypoint {self.current_waypoint_index + 1} reached. Activating LiDAR & NDVI sensor...")
                return

            # Moverse hacia el waypoint
            step_size = self.speed
            ratio = step_size / distance
            self.x += dx * ratio
            self.y += dy * ratio

            # Calcular orientación (heading) en grados para la UI
            self.heading = math.degrees(math.atan2(dy, dx))

            # Limitar logs a 10 líneas para evitar saturar el HUD
            if len(self.logs) > 10:
                self.logs.pop(0)

    def get_telemetry(self) -> dict:
        return {
            "name": self.name,
            "status": self.status,
            "battery": round(self.battery, 1),
            "speed": self.speed if self.status == "patrolling" else 0.0,
            "heading": round(self.heading, 1),
            "x": round(self.x, 2),
            "y": round(self.y, 2),
            "logs": self.logs
        }
