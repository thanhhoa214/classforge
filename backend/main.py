from fastapi import FastAPI
from contextlib import asynccontextmanager
from services.loader import get_loader
from services.db import get_db
from fastapi.middleware.cors import CORSMiddleware

# Import routers
from routers import metric, run, ws, chat

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
app.include_router(chat.router)

# Add CORS middleware here

origins = [
    "http://localhost:3000",
    "http://localhost:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/delete-data")
async def delete_data():
    db = get_db()
    db.execute_query("Match (n) DETACH DELETE n", {})
    return {"status": "Data deleted"}