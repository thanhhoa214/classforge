from fastapi import FastAPI
from contextlib import asynccontextmanager
from services.loader import get_loader
from services.db import get_db

# Import routers
from routers import metric, run, ws

@asynccontextmanager
async def lifespan(app: FastAPI):
    dl = get_loader()
    # Load the data when the app starts
    dl.load_test_data("test_data_load.xlsx")
    dl.agent_sample_load()
    yield

app = FastAPI(lifespan=lifespan)
app.include_router(metric.router)
app.include_router(run.router)
app.include_router(ws.router)


@app.post("/delete-data")
async def delete_data():
    db = get_db()
    db.execute_query("Match (n) DETACH DELETE n", {})
    return {"status": "Data deleted"}



