import math
import time
import random


class WeatherService:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(WeatherService, cls).__new__(cls, *args, **kwargs)
            cls._instance._init_weather()
        return cls._instance

    def _init_weather(self):
        # Initial parameters for weather state simulation
        self.start_time = time.time()
        self.rain_trend = 0.2  # 0 to 1, oscillates slowly

    def get_current_weather(self):
        elapsed = time.time() - self.start_time

        # Simulating a day cycle (one full cycle every 360 seconds for demo purposes)
        # 360 seconds = 24 hours in simulation speed
        # Alternatively, we can use the actual time of day, but simulating a accelerated cycle
        # makes it easy for users to see changes!
        # Let's use an accelerated cycle: 1 hour = 15 seconds. Full day = 360 seconds.
        sim_hour = (elapsed / 15.0) % 24.0

        # Temperature: peaks at 15:00 (sim_hour = 15), lowest at 4:00 (sim_hour = 4)
        rad = (sim_hour - 15.0) * (2 * math.pi / 24.0)
        base_temp = 22.0 + 8.0 * math.cos(rad)

        # Add some random noise
        random.seed(int(elapsed / 10.0))  # changes every 10s
        noise_temp = random.uniform(-1.5, 1.5)
        temperature = round(base_temp + noise_temp, 1)

        # Humidity: inversely related to temp
        base_hum = 60.0 - 20.0 * math.cos(rad)
        noise_hum = random.uniform(-5, 5)
        humidity = round(max(10, min(100, base_hum + noise_hum)), 0)

        # Wind speed
        base_wind = 10.0 + 5.0 * math.sin(elapsed / 60.0)
        wind_speed = round(max(0, base_wind + random.uniform(-3, 3)), 1)

        # Rain probability oscillates with elapsed time
        # We can simulate low pressure fronts passing every 5-10 minutes
        rain_prob_base = 30 + 40 * math.sin(elapsed / 180.0)  # period of 3 minutes
        rain_probability = round(
            max(0, min(100, rain_prob_base + random.uniform(-10, 10))), 0
        )

        # Weather condition
        if rain_probability > 75:
            condition = "Lluvia Fuerte" if wind_speed > 15 else "Lluvia Moderada"
        elif rain_probability > 45:
            condition = "Nublado"
        elif wind_speed > 20:
            condition = "Viento Fuerte"
        else:
            condition = "Soleado" if 6.0 <= sim_hour <= 18.0 else "Despejado (Noche)"

        return {
            "temperature": temperature,
            "humidity": humidity,
            "wind_speed": wind_speed,
            "rain_probability": rain_probability,
            "condition": condition,
            "sim_hour": round(sim_hour, 1),
        }

    def get_forecast(self):
        weather = self.get_current_weather()
        current_sim_hour = weather["sim_hour"]

        forecast = []
        # Generate 4 forecast steps (e.g. +2h, +4h, +6h, +8h)
        for i in range(1, 5):
            hours_ahead = i * 2
            sim_hour = (current_sim_hour + hours_ahead) % 24.0

            # Predict values
            rad = (sim_hour - 15.0) * (2 * math.pi / 24.0)
            pred_temp = round(22.0 + 8.0 * math.cos(rad) + random.uniform(-1, 1), 1)

            elapsed_future = time.time() - self.start_time + (hours_ahead * 15.0)
            rain_prob_base = 30 + 40 * math.sin(elapsed_future / 180.0)
            pred_rain_prob = round(
                max(0, min(100, rain_prob_base + random.uniform(-10, 10))), 0
            )

            if pred_rain_prob > 75:
                pred_condition = "Lluvia"
            elif pred_rain_prob > 45:
                pred_condition = "Nublado"
            else:
                pred_condition = "Soleado" if 6.0 <= sim_hour <= 18.0 else "Despejado"

            forecast.append(
                {
                    "time": f"+{hours_ahead}h",
                    "temperature": pred_temp,
                    "condition": pred_condition,
                    "rain_probability": pred_rain_prob,
                }
            )

        return forecast
