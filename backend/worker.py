from redis import Redis
from rq import Worker, Queue
import pandas as pd
import os


listen = ['default']
print(os.getenv("REDIS_HOST", "localhost"))
redis_conn = Redis(
    # host=os.getenv("REDIS_HOST", "localhost"),
    host="redis",
    port=6379
)

if __name__ == "__main__":
    w = Worker(listen, connection=redis_conn)
    w.work()