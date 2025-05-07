from fastapi import FastAPI
from rq import Queue
from redis import Redis
import os
import uuid
import time
from dataloading.dataloader import DataLoader
from dataloading.api import DB
from contextlib import asynccontextmanager
from algofunction import run_algorithm

db = DB()
db.connect('dataloading/db.env')
loaded_rela = ['net_0_friends', 'net_1_influential', 'net_2_feedback', 'net_3_moretime','net_4_advice', 'net_5_disrespect', 'net_affiliation']
loaded_sheet = ["participants", "affiliations", "survey_data"]

dl = DataLoader(db, folder = 'data',loaded_sheet = loaded_sheet
                , loaded_relationship= loaded_rela)

REDIS = os.getenv("REDIS_HOST", "localhost")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the data when the app starts
    dl.load_test_data("test_data_load.xlsx")
    dl.agent_sample_load()
    yield

app = FastAPI(lifespan=lifespan)

redis_conn = Redis(host=REDIS, port=6379)
queue = Queue(connection=redis_conn)

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/run")
async def run():
    job_id = dl.get_last_process_run()
    print("job_id", job_id)
    if job_id is None:
        job_id = 0
    else:
        job_id += 1
    job_id = str(job_id)
    
    # Check if the job is already in the queue or is runnign
    if queue.fetch_job(job_id) and (queue.fetch_job(job_id).is_finished or queue.fetch_job(job_id).is_started):
            return {"status": "Algorithm already run - job_id: " + job_id}
    
    queue.enqueue(run_algorithm, job_id=job_id)

    return {"job_id": job_id}

@app.get("/job-status/{job_id}")
def job_status(job_id: str):
    job = queue.fetch_job(job_id)
    if job is None:
        return {"status": "not_found"}
    if job.is_finished:
        return {"status": "completed", "result": job.result}
    if job.is_failed:
        return {"status": "failed"}
    return {"status": "processing"}

@app.post("/delete-data")
async def delete_data():
    db.execute_query("Match (n) DETACH DELETE n", {})
    return {"status": "Data deleted"}


    # 1. function for route getting latest process id
@app.get("/latest-process-id")
async def get_latest_process_id():
    process_id = dl.get_last_process_run()
    if process_id is None:
        return {"latest_process_id": "Not found"}
    return {"latest_process_id": process_id}

    # 2. Route function for metrics of a process id


# Participant count
@app.get("/metrics/participants")
async def get_participant_count():
    try:
        cypher = "MATCH (p:Participant) RETURN count(p) AS count"
        df = db.query_to_dataframe(cypher)
        count = int(df.iloc[0]["count"]) if not df.empty else 0
        return {"participant_count": count}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Process Count
@app.get("/metrics/processes")
async def get_process_count():
    try:
        cypher = "MATCH (pr:Process) RETURN count(pr) AS count"
        df = db.query_to_dataframe(cypher)
        count = int(df.iloc[0]["count"]) if not df.empty else 0
        return {"process_count": count}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Relationship count
@app.get("/metrics/relationships")
async def get_relationship_count():
    try:
        cypher = "MATCH ()-[r]->() RETURN count(r) AS count"
        df = db.query_to_dataframe(cypher)
        count = int(df.iloc[0]["count"]) if not df.empty else 0
        return {"relationship_count": count}
    except Exception as e:
        return {"status": "error", "message": str(e)}