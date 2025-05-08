from fastapi import APIRouter, Depends
from services.loader import get_loader
from services.queue import queue
from algofunction import run_algorithm
from algofunction import run_academic_algorithm
from algofunction import run_mental_algorithm
from algofunction import run_social_algorithm
router = APIRouter()

# run balance algorithm
@router.get("/run/balance")
async def run():
    try:
        dl = get_loader()
        
        job_id = dl.get_last_process_run()
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
    
    except Exception as e:
        return {"status": "error", "message": str(e)}

# run academic algorithm
@router.get("/run/academic")
async def run():
    try:
        dl = get_loader()
        
        job_id = dl.get_last_process_run()
        if job_id is None:
            job_id = 0
        else:
            job_id += 1
        job_id = str(job_id)
        
        # Check if the job is already in the queue or is runnign
        if queue.fetch_job(job_id) and (queue.fetch_job(job_id).is_finished or queue.fetch_job(job_id).is_started):
                return {"status": "Algorithm already run - job_id: " + job_id}
    
        queue.enqueue(run_academic_algorithm, job_id=job_id)

        return {"job_id": job_id}
    
    except Exception as e:
        return {"status": "error", "message": str(e)}
    
# run mental algorithm
@router.get("/run/mental")
async def run():
    try:
        dl = get_loader()
        
        job_id = dl.get_last_process_run()
        if job_id is None:
            job_id = 0
        else:
            job_id += 1
        job_id = str(job_id)
        
        # Check if the job is already in the queue or is runnign
        if queue.fetch_job(job_id) and (queue.fetch_job(job_id).is_finished or queue.fetch_job(job_id).is_started):
                return {"status": "Algorithm already run - job_id: " + job_id}
    
        queue.enqueue(run_mental_algorithm, job_id=job_id)

        return {"job_id": job_id}
    
    except Exception as e:
        return {"status": "error", "message": str(e)}

# run social algorithm
@router.get("/run/social")
async def run():
    try:
        dl = get_loader()
        
        job_id = dl.get_last_process_run()
        if job_id is None:
            job_id = 0
        else:
            job_id += 1
        job_id = str(job_id)
        
        # Check if the job is already in the queue or is runnign
        if queue.fetch_job(job_id) and (queue.fetch_job(job_id).is_finished or queue.fetch_job(job_id).is_started):
                return {"status": "Algorithm already run - job_id: " + job_id}
    
        queue.enqueue(run_social_algorithm, job_id=job_id)

        return {"job_id": job_id}
    
    except Exception as e:
        return {"status": "error", "message": str(e)}
    

@router.get("/job-status/{job_id}")
def job_status(job_id: str):
    job = queue.fetch_job(job_id)
    if job is None:
        return {"status": "not_found"}
    if job.is_finished:
        return {"status": "completed", "result": job.result}
    if job.is_failed:
        return {"status": "failed"}
    return {"status": "processing"}