from redis import Redis
from rq import Queue
from config import REDIS_HOST, REDIS_PORT

redis_conn = Redis(host=REDIS_HOST, port=REDIS_PORT)
queue = Queue(connection=redis_conn)