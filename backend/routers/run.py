from enum import Enum
from fastapi import APIRouter, Depends, HTTPException
from services.loader import get_loader
from services.queue import queue
from algofunction import run_algorithm
from pydantic import BaseModel
router = APIRouter()


class OptionEnum(str, Enum):
    balanced = "balanced"
    academic = "academic"
    mental   = "mental"
    social   = "social"

# run balance algorithm
class RunAlgorithmRequest(BaseModel):
    option: OptionEnum = OptionEnum.balanced
    save_data: bool = True


class RunAlgorithmResponse(BaseModel):
    job_id: str
    status: str

@router.post("/run")
async def run_algo(
    req: RunAlgorithmRequest,
    dl = Depends(get_loader)
):
    """
    Run the algorithm with the given option and save data if specified.
    There are 4 options: balanced, academic, mental, social.
    The algorithm will be run in the background and a job ID will be returned.
    use save_data to save the data to the database or not.
    Use the job ID to check the status of the job.

    """
    try:
        last = dl.get_last_process_run()
        next_id = (last + 1) if last is not None else 0
        job_id = str(next_id)

        # don't re-enqueue if it's already queued or running
        existing = queue.fetch_job(job_id)
        if existing and (existing.is_started or existing.is_finished):
            return {"status": f"Job already submitted", "job_id": job_id}

        # enqueue your function, passing option & save_data
        queue.enqueue(
            run_algorithm,
            req.option.value,
            req.save_data,
            job_id=job_id
        )
        return {"job_id": job_id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


    

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