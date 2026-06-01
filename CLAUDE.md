# AgriSense — Monitor de Agricultura de Precisión

Aplicación full-stack demo de agricultura de precisión con sensores IoT, motor de reglas y automatización.

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Python 3.13, FastAPI, SQLAlchemy 2.0 async, Pydantic v2, asyncpg |
| Frontend | React 19, Vite, Tailwind CSS 4, Recharts, Lucide React, React Router v7 |
| Database | PostgreSQL 16 (Docker Compose) |
| Package mgmt | uv |
| Auth | JWT (python-jose + passlib) |

## Estructura del Proyecto

```
agrisense/
├── backend/
│   ├── src/
│   │   ├── api/v1/           # Routers REST (auth, zones, sensors, readings, rules, alerts)
│   │   ├── application/      # Servicios de aplicación (ZoneService, RuleEngine, ReadingService)
│   │   ├── domain/           # Entidades, Value Objects, Puertos (interfaces)
│   │   └── infrastructure/   # SQLAlchemy models, repos, JWT, simulador de sensores
│   ├── tests/
│   ├── alemic/
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/       # Layout, FarmMap (futuro)
│   │   ├── pages/            # Dashboard, ZoneDetail, Alerts, Rules, Login, WorkOrders (futuro)
│   │   ├── context/          # AuthContext (JWT)
│   │   └── services/         # api.js (cliente HTTP)
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

## Arquitectura (Clean Architecture / DDD)

Backend en 4 capas:
- **API** → Routers, dependencias, middleware (CORS, auth)
- **Application** → Casos de uso, servicios, DTOs
- **Domain** → Entidades, Value Objects, Puertos (ABCs), Eventos
- **Infrastructure** → Repositorios SQLAlchemy, modelos ORM, auth JWT, simulador

## Estado Actual (v1)

### Lo que funciona:
- Docker Compose con PostgreSQL + backend + frontend
- Login/Registro con JWT (usuario demo: `demo`/`demo`)
- Dashboard con grid de zonas mostrando sensores (temp, humedad, pH, luz, humedad suelo)
- Colores de estado: verde (ok), ámbar (atención), rojo (crítico)
- ZoneDetail con gráficos time-series (Recharts)
- Páginas de Alertas y Reglas
- Simulador de sensores generando datos en tiempo real (3-5s)
- Seed data: 3 zonas, 9 sensores, 4 reglas pre-cargadas
- Dark theme "forest" con Tailwind CSS 4

### Screenshots tomadas:
- `login-page.png` — Página de login
- `dashboard.png` — Dashboard (sin datos)
- `dashboard-with-data.png` — Dashboard con datos cargados

## Plan de Implementación — v2

**Objetivo:** Transformar de visualizador pasivo a plataforma de gestión agrícola completa.

### Funcionalidades nuevas:
1. **Digital Twin — Mapa Interactivo (FarmMap)**: SVG top-down de la finca con zonas coloreadas por health score, sensores con pulsos animados, zoom/pan, hover con datos en tiempo real
2. **Health Score**: Índice 0-100 por zona (promedio ponderado de humedad, temp, pH, luz)
3. **Actuadores**: Bombas de riego/válvulas controlables (ON/OFF) desde la UI
4. **Work Orders**: Órdenes de trabajo generadas automáticamente desde alertas (PENDING → IN_PROGRESS → COMPLETED)

### Fases:

#### Fase 1: Backend — Nuevas Entidades
- [ ] Crear `ActuatorType` y `WorkOrderStatus` value objects
- [ ] Crear `Actuator` y `WorkOrder` entidades de dominio
- [ ] Crear puertos (ABC repositories)
- [ ] Añadir `ActuatorModel` y `WorkOrderModel` a models.py
- [ ] Añadir `action_type` a `RuleModel` (alert | work_order | both)
- [ ] Implementar repositorios SQLAlchemy
- [ ] Actualizar seed.py con actuadores y work orders de ejemplo

#### Fase 2: Backend — Servicios y API
- [ ] Implementar HealthScoreService (fórmula ponderada)
- [ ] Implementar ActuatorService (list, toggle, get)
- [ ] Implementar WorkOrderService (CRUD + transiciones de estado)
- [ ] Extender RuleEngine para action_type "work_order" y "both"
- [ ] Crear routers: actuators.py, work_orders.py, health score en zones.py
- [ ] Registrar nuevos routers en api/v1/__init__.py

#### Fase 3: Frontend — Componentes Base
- [ ] Crear FarmMap.jsx (SVG interactivo con zonas, sensores, actuadores)
- [ ] Crear HealthScoreBadge.jsx (anillo SVG circular 0-100)
- [ ] Crear ActuatorToggle.jsx (toggle switch ON/OFF)
- [ ] Añadir funciones a api.js para nuevos endpoints

#### Fase 4: Frontend — Páginas
- [ ] Reemplazar Dashboard.jsx con FarmMap + resumen
- [ ] Crear WorkOrders.jsx (lista con filtros por estado)
- [ ] Actualizar ZoneDetail.jsx con health score y breakdown por métrica
- [ ] Actualizar Rules.jsx con selector action_type
- [ ] Actualizar Layout.jsx con nuevos items de navegación
- [ ] Actualizar App.jsx con nuevas rutas

#### Fase 5: Integración y Pruebas
- [ ] Reconstruir contenedores: `docker compose up -d --build`
- [ ] Ejecutar seed actualizado
- [ ] Verificar flujo completo: simulador → lectura → regla dispara → work order → toggle actuador → health score mejora
- [ ] Probar mapa interactivo (zoom, pan, hover, click)

### Nuevos endpoints:
```
GET    /api/v1/actuators?zone_id=<uuid>
POST   /api/v1/actuators
GET    /api/v1/actuators/{id}
POST   /api/v1/actuators/{id}/toggle

GET    /api/v1/work-orders?status=&zone_id=
POST   /api/v1/work-orders
GET    /api/v1/work-orders/{id}
PATCH  /api/v1/work-orders/{id}

GET    /api/v1/zones/{id}/health-score
```

## Cómo Ejecutar

```bash
cd agrisense
docker compose up -d --build
```

- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

## Comandos Útiles

```bash
# Reconstruir sin instalar dependencias de nuevo (solo código)
docker compose up -d --build

# Ver logs
docker compose logs -f backend
docker compose logs -f frontend

# Acceder a la BD
docker compose exec db psql -U agrisense -d agrisense

# Seed manual
docker compose exec backend uv run python -m src.seed
```

## Notas

- El workspace original de brainstorming está en `test_agent`, el proyecto final en `test_agrisense`
- Los datos son simulados — script en `backend/src/infrastructure/sensor_simulator/`
- Las screenshots están en la raíz: `login-page.png`, `dashboard.png`, `dashboard-with-data.png`
- No hay git inicializado en este proyecto aún
