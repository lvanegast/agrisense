# 🌾 AgriSense — Control de Mando de Agricultura de Precisión

AgriSense es una plataforma Full-Stack de agricultura de precisión que integra emulaciones de telemetría IoT en tiempo real, un motor predictivo de reglas complejas, integración meteorológica y un copiloto interactivo de asistencia agronómica basado en Inteligencia Artificial.

---

## 🏗️ Arquitectura del Proyecto

El proyecto está diseñado bajo principios de **Clean Architecture** y **Domain-Driven Design (DDD)** en el backend, y un frontend estructurado en componentes modulares y reactivos con TailwindCSS.

```
agrisense/
├── backend/
│   ├── src/
│   │   ├── api/v1/           # Controladores REST (auth, zones, weather, copilot, rules, etc.)
│   │   ├── application/      # Casos de uso y servicios (ZoneService, RuleEngine, WeatherService, CopilotService)
│   │   ├── domain/           # Entidades de dominio, Value Objects y Puertos (repositorios abstractos)
│   │   └── infrastructure/   # Adaptadores: Modelos SQLAlchemy, repositorios concretos, JWT, simulador de sensores
│   ├── tests/                # Pruebas unitarias y de integración
│   ├── pyproject.toml        # Gestión de dependencias con uv
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/       # Layout, FarmMap (Gemelo Digital en SVG), HealthScoreBadge
│   │   ├── pages/            # Dashboard (Control de Mando), Rules, Alerts, Login, Kanban
│   │   ├── context/          # Gestión global de sesión (AuthContext)
│   │   └── services/         # api.js (Cliente HTTP Fetch adaptado a JWT y reintentos)
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

---

## 🌟 Funcionalidades Implementadas (v2)

### 1. 🌤️ Integración Meteorológica (Weather Core)
* **Simulación Atmosférica:** El servicio meteorológico calcula ciclos solares, fluctuación de temperatura, humedad del aire, viento y probabilidad de lluvias de forma cíclica y acelerada.
* **Toma de Decisiones:** Los datos meteorológicos se exponen al Dashboard y se inyectan en el motor de reglas para automatización inteligente.

### 2. 🌱 Módulo de Calendario Fenológico
* **Ciclo de Cosecha:** Monitoreo del desarrollo del cultivo por zonas mediante fecha de siembra y cálculo del ciclo de crecimiento.
* **Stepper Interactivo:** Control visual interactivo en el dashboard que permite cambiar de etapa de crecimiento (*Germinación, Crecimiento Vegetativo, Floración, Fructificación, Madurez*) con recomendaciones agronómicas contextuales.

### 3. 🧠 Motor de Alertas Predictivas & Reglas Complejas
* **Lógica Avanzada:** Soporte para la definición de condiciones múltiples unidas mediante operador lógico `AND` (ej. *Humedad de Suelo < 45% Y Temperatura > 28°C Y Probabilidad de Lluvia < 40%*).
* **Acciones Flexibles:** Permite definir si el disparo de la regla genera una Alerta visual, una Orden de Trabajo en Kanban de mantenimiento, o ambas acciones en simultáneo.

### 4. 🤖 Asistente Virtual / Copiloto AI
* **Análisis de Datos:** El panel de AgriAgent Copilot cuenta con un chat interactivo en tiempo real que responde preguntas en español sobre el estado de la finca, sensores individuales, niveles meteorológicos e indicaciones de cultivo de forma contextualizada.
* **Chips de Acceso Rápido:** Accesos directos a reportes de zonas, alertas activas y pronóstico del tiempo.

---

## 🛠️ Comandos de Ejecución Rápida

### Levantar Contenedores (Docker Compose)
Para compilar y levantar los servicios de base de datos PostgreSQL, Backend FastAPI y Frontend React:
```bash
docker compose up -d --build
```

### Inicializar y Sembrar la Base de Datos (Seed)
Este comando limpia las tablas, aplica el esquema físico con los nuevos campos del ciclo fenológico y las reglas complejas, y arranca el simulador de telemetría IoT en segundo plano:
```bash
docker compose exec backend uv run python -m src.seed
```

### Ejecutar Linter y Formateador (Calidad del Código)
Para auditar la calidad estática del código y aplicar las correcciones automáticas de estilo ruff:
```bash
# Auditar código
uv run ruff check .

# Corregir automáticamente
uv run ruff check . --fix --unsafe-fixes

# Dar formato estético
uv run ruff format .
```

---

## 🟢 Estado de Salud del Proyecto

* **Linter de Python:** `0 errores` detectados. Código formateado y validado mediante Ruff.
* **Estructura Arquitectónica:** Cumplimiento riguroso de límites de acoplamiento de Clean Architecture.
* **Autenticación y Seguridad:** Expiración de tokens JWT expandido a 8 horas con intercepción inteligente de estados de desautorización 401.
