from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.v1 import router as v1_router
from src.infrastructure.db.config import engine, async_session
from src.infrastructure.db.models import Base
from src.infrastructure.sensor_simulator import SensorSimulator


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


import asyncio
from src.application.services.rover_simulator import RoverSimulatorService


async def rover_simulator_loop():
    rover = RoverSimulatorService()
    while True:
        try:
            await rover.update_step()
        except Exception as e:
            print(f"Error in rover simulator loop: {e}")
        await asyncio.sleep(3.0)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    rover_task = asyncio.create_task(rover_simulator_loop())
    try:
        yield
    finally:
        rover_task.cancel()



app = FastAPI(
    title="AgriSense API",
    description="Precision Agriculture Monitor",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
