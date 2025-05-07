import os 
from neo4j import GraphDatabase
from dotenv import load_dotenv
from dataloading.api import DB
from typing import Optional

_db: Optional[DB] = None

def get_db() -> DB:
    global _db
    if _db is None:
        env = os.getenv("DB_ENV_PATH", "dataloading/db.env")
        _db = DB()
        _db.connect(env)
    return _db

