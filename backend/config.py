import os

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
DB_ENV_PATH = os.getenv("DB_ENV_PATH", "dataloading/db.env")