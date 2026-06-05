from src.domain.ports.zone_repository import ZoneRepository
from src.domain.ports.sensor_repository import SensorRepository
from src.domain.ports.reading_repository import ReadingRepository
from src.domain.ports.alert_repository import AlertRepository
from src.domain.ports.actuator_repository import ActuatorRepository
from src.application.services.health_score_service import HealthScoreService
from src.application.services.weather_service import WeatherService


class CopilotService:
    def __init__(
        self,
        zone_repo: ZoneRepository,
        sensor_repo: SensorRepository,
        reading_repo: ReadingRepository,
        alert_repo: AlertRepository,
        actuator_repo: ActuatorRepository,
        health_score_service: HealthScoreService,
    ):
        self.zone_repo = zone_repo
        self.sensor_repo = sensor_repo
        self.reading_repo = reading_repo
        self.alert_repo = alert_repo
        self.actuator_repo = actuator_repo
        self.health_score_service = health_score_service
        self.weather_service = WeatherService()

    async def chat(self, message: str) -> str:
        msg = message.lower().strip()

        # 1. Check for general help / options
        if any(h in msg for h in ["hola", "ayuda", "qué puedes hacer", "help"]):
            return (
                "👋 ¡Hola! Soy tu **Copiloto Agrónomo AI**. Estoy aquí para ayudarte a monitorear y optimizar tus cultivos.\n\n"
                "Puedes preguntarme cosas como:\n"
                '- 📊 *"¿Cómo está el Sector Norte?"* o *"Estado de los Tomates"* (analiza una zona específica)\n'
                '- 🌡️ *"¿Cómo está el clima?"* (muestra el pronóstico meteorológico externo)\n'
                '- ⚠️ *"¿Tengo alertas activas?"* (lista los problemas críticos actuales)\n'
                '- 🌾 *"¿Qué recomendaciones tienes para el cultivo de tomate?"* (da consejos basados en su etapa fenológica)\n'
                '- 📈 *"Resumen general de la finca"* (muestra salud y estado de todos los sectores)\n\n'
                "¿En qué te puedo asesorar hoy?"
            )

        # 2. Check for Weather inquiry
        if any(
            w in msg
            for w in [
                "clima",
                "tiempo",
                "pronostico",
                "pronóstico",
                "lluvia",
                "temperatura exterior",
            ]
        ):
            w_data = self.weather_service.get_current_weather()
            forecast = self.weather_service.get_forecast()

            response = (
                f"🌤️ **Estado Meteorológico Actual (Simulación Externa)**\n"
                f"- **Condición:** {w_data['condition']}\n"
                f"- **Temperatura:** {w_data['temperature']}°C\n"
                f"- **Humedad Relativa:** {w_data['humidity']}%\n"
                f"- **Velocidad del Viento:** {w_data['wind_speed']} km/h\n"
                f"- **Probabilidad de Lluvia:** {w_data['rain_probability']}%\n\n"
                f"📅 **Pronóstico para las próximas horas:**\n"
            )
            for f in forecast:
                response += f"- **{f['time']}:** {f['temperature']}°C, {f['condition']} (☔ Prob. Lluvia: {f['rain_probability']}%)\n"

            # Add agronomic advice based on weather
            if w_data["rain_probability"] > 60:
                response += "\n⚠️ **Recomendación agronómica:** Hay una alta probabilidad de lluvia en las próximas horas. Sugiero **posponer o reducir el riego automático** en el *Campo Exterior* para evitar saturación de suelo y optimizar el consumo de agua."
            elif w_data["temperature"] > 28:
                response += "\n🔥 **Recomendación agronómica:** La temperatura externa es elevada. Recomiendo verificar los niveles de humedad en suelo de los invernaderos para evitar estrés por calor."
            else:
                response += "\n✅ **Recomendación agronómica:** El clima actual se encuentra dentro de los rangos óptimos de operación."

            return response

        # 3. Check for Alerts inquiry
        if any(
            a in msg
            for a in ["alerta", "alertas", "problema", "crítico", "critico", "error"]
        ):
            alerts = await self.alert_repo.list_unacknowledged()
            if not alerts:
                return "✅ **No tienes alertas críticas activas en este momento.** Todos los sectores operan dentro de los rangos óptimos."

            response = f"🚨 **Alertas Críticas Activas ({len(alerts)}):**\n\n"
            for alert in alerts:
                response += f"- **Zona:** (ID: {str(alert.zone_id)[:8]})\n  *Mensaje:* {alert.message}\n  *Fecha:* {alert.created_at.strftime('%d/%m %H:%M')}\n\n"
            response += "💡 Puedes resolver estas alertas desde el panel de *Alertas* o activando manualmente los actuadores correspondientes."
            return response

        # 4. Check for general summary of the farm
        if any(
            s in msg
            for s in ["resumen", "general", "finca", "campos", "todas las zonas"]
        ):
            zones = await self.zone_repo.list_all()
            response = "🚜 **Resumen Operativo de la Finca AgriSense**\n\n"
            response += "| Zona | Cultivo | Salud | Etapa | Estado |\n"
            response += "| --- | --- | --- | --- | --- |\n"
            for z in zones:
                health = await self.health_score_service.calculate_zone_health(z.id)
                status = (
                    "🟢 Óptimo"
                    if health > 80
                    else ("🟡 Atención" if health > 50 else "🔴 Crítico")
                )
                response += f"| {z.name} | {z.crop_type} | {health:.0f}% | {z.current_stage} | {status} |\n"

            # Check for any active actuators
            actuators = await self.actuator_repo.list_all()
            active_actuators = [a for a in actuators if a.is_on]
            if active_actuators:
                response += "\n⚙️ **Sistemas activos en este momento:**\n"
                for a in active_actuators:
                    response += f"- {a.name} (Encendido)\n"

            return response

        # 5. Check for specific zone inquiry
        zones = await self.zone_repo.list_all()
        matched_zone = None
        for z in zones:
            if (
                z.name.lower() in msg
                or z.location.lower() in msg
                or z.crop_type.lower() in msg
            ):
                matched_zone = z
                break

        # Fallback keyword match for zones if not exact
        if not matched_zone:
            if "tomate" in msg or "cherry" in msg or "norte" in msg:
                matched_zone = next(
                    (
                        z
                        for z in zones
                        if "tomate" in z.name.lower() or "norte" in z.location.lower()
                    ),
                    None,
                )
            elif "lechuga" in msg or "hidropon" in msg or "central" in msg:
                matched_zone = next(
                    (
                        z
                        for z in zones
                        if "lechuga" in z.name.lower()
                        or "central" in z.location.lower()
                    ),
                    None,
                )
            elif "maiz" in msg or "maíz" in msg or "sur" in msg or "exterior" in msg:
                matched_zone = next(
                    (
                        z
                        for z in zones
                        if "maíz" in z.name.lower()
                        or "maiz" in z.name.lower()
                        or "sur" in z.location.lower()
                    ),
                    None,
                )
            elif "lombriz" in msg or "compost" in msg or "eco" in msg or "bio" in msg:
                matched_zone = next(
                    (
                        z
                        for z in zones
                        if "lombrices" in z.name.lower()
                        or "compost" in z.name.lower()
                        or "eco" in z.location.lower()
                    ),
                    None,
                )

        if matched_zone:
            z = matched_zone
            health = await self.health_score_service.calculate_zone_health(z.id)
            sensors = await self.sensor_repo.list_by_zone(z.id)
            latest_readings = await self.reading_repo.get_latest_by_zone(z.id)
            actuators = await self.actuator_repo.list_by_zone(z.id)

            status = (
                "🟢 Saludable"
                if health > 80
                else ("🟡 Requiere Atención" if health > 50 else "🔴 Crítico")
            )
            response = (
                f"📊 **Estado de la Zona: {z.name}** ({z.location})\n"
                f"- **Cultivo:** {z.crop_type}\n"
                f"- **Etapa Fenológica:** {z.current_stage}\n"
                f"- **Salud General:** **{health:.0f}%** ({status})\n\n"
                f"🌡️ **Lecturas de Sensores en Tiempo Real:**\n"
            )
            for s in sensors:
                r = latest_readings.get(s.id)
                val_str = f"{r.value:.1f} {s.unit}" if r else "Sin datos"
                response += f"- **{s.name}:** {val_str}\n"

            response += "\n⚙️ **Actuadores y Automatización:**\n"
            if actuators:
                for a in actuators:
                    state = "💡 ENCENDIDO" if a.is_on else "⚪ APAGADO"
                    response += f"- **{a.name}:** {state}\n"
            else:
                response += "- No hay actuadores configurados en esta zona.\n"

            # Add agronomic advice based on stage and health
            response += (
                f"\n🌱 **Recomendaciones para {z.crop_type} ({z.current_stage}):**\n"
            )
            if z.current_stage == "Germinación":
                response += "- Mantener la humedad del suelo constante entre 65% y 75%.\n- Riego por micro-aspersión de corta duración.\n"
            elif (
                z.current_stage == "Crecimiento Vegetativo"
                or "crecimiento" in z.current_stage.lower()
            ):
                response += "- Fase de desarrollo foliar. Asegurar iluminación óptima (> 500 lux).\n- Riego regular y control de pH óptimo (6.0 - 6.5).\n"
            elif z.current_stage == "Floración":
                response += "- Reducir ligeramente el riego para incentivar la floración y evitar aparición de hongos.\n- Monitorear pH y conductividad eléctrica.\n"
            elif z.current_stage == "Fructificación":
                response += "- Alta demanda de agua y nutrientes. Evitar caídas drásticas de humedad del suelo.\n- Vigilar temperatura interna del invernadero (< 30°C).\n"
            elif z.current_stage == "Madurez" or "cosecha" in z.current_stage.lower():
                response += "- Reducir el riego paulatinamente. Suspender riego 24-48 horas antes de la cosecha para concentrar azúcares.\n"

            # Check if there are active alerts for this zone
            zone_alerts = await self.alert_repo.list_unacknowledged()
            zone_alerts = [al for al in zone_alerts if al.zone_id == z.id]
            if zone_alerts:
                response += "\n🚨 **Alertas activas en esta zona:**\n"
                for al in zone_alerts:
                    response += f"- *{al.message}*\n"

            return response

        # 6. Fallback agronomic question answering
        if "tomate" in msg:
            return (
                "🍅 **Asesoría de Cultivo: Tomates**\n\n"
                "El cultivo de tomate cherry prospera mejor en climas templados. Parámetros recomendados:\n"
                "- **Temperatura óptima:** 18°C a 28°C. Temperaturas superiores a 32°C abortan la floración.\n"
                "- **Humedad de suelo:** 60% a 70%. La fluctuación extrema de humedad causa pudrición apical (*Blossom End Rot*).\n"
                "- **Rango de pH:** 5.8 a 6.8.\n"
                "- **Requisito de Luz:** Alto. Mínimo 6 horas de luz directa.\n\n"
                "¿Deseas que analice el estado actual de tus invernaderos de tomate?"
            )
        elif "lechuga" in msg:
            return (
                "🥬 **Asesoría de Cultivo: Lechugas Hidropónicas**\n\n"
                "Para lechugas en sistema NFT o flotante:\n"
                "- **Temperatura óptima:** 15°C a 22°C (temperaturas frías evitan el espigado prematuro).\n"
                "- **pH óptimo del agua:** 5.5 a 6.0.\n"
                "- **Oxigenación:** Vital. El agua en recirculación debe mantenerse bien aireada.\n"
                "- **Luz:** Moderada. Exceso de sol fuerte quema las hojas."
            )
        elif "lombriz" in msg or "compost" in msg:
            return (
                "🪱 **Manejo de Bio-Insumos (Vermicompost)**\n\n"
                "Para la lombriz roja californiana y compostera:\n"
                "- **Humedad ideal:** 70% a 80%. Las lombrices respiran por la piel, la sequedad es mortal.\n"
                "- **Temperatura ideal:** 15°C a 25°C. Evitar luz directa solar.\n"
                "- **pH óptimo:** 6.5 a 7.5. El compost muy ácido (cítricos en exceso) ahuyenta o mata a las lombrices.\n"
                "- **Aireación:** Voltear regularmente el compost para activar bacterias aeróbicas y evitar malos olores."
            )

        return (
            "💬 Entiendo tu interés. Como tu asistente virtual, puedo darte información de sensores, clima, "
            "alertas o resúmenes de zonas.\n\n"
            'Prueba a preguntarme: *"¿Cuál es el estado de los tomates?"*, *"¿Cómo está el clima?"* o *"Resumen general"*.'
        )
