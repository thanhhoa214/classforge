from fastapi import APIRouter
from fastapi.responses import HTMLResponse
from services.db import get_db
from services.loader import get_loader

router = APIRouter()

    # 1. function for route getting latest process id
@router.get("/latest-process-id")
async def get_latest_process_id():
    dl = get_loader()

    process_id = dl.get_last_process_run()
    if process_id is None:
        return {"latest_process_id": "Not found"}
    return {"latest_process_id": process_id}

# Participant count
@router.get("/metrics/participants")
async def get_participant_count():
    try:
        db = get_db()
        cypher = "MATCH (p:Participant) RETURN count(p) AS count"
        df = db.query_to_dataframe(cypher)
        count = int(df.iloc[0]["count"]) if not df.empty else 0
        return {"participant_count": count}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Process Count
@router.get("/metrics/processes")
async def get_process_count():
    try:
        db = get_db()
        cypher = "MATCH (pr:Process) RETURN count(pr) AS count"
        df = db.query_to_dataframe(cypher)
        count = int(df.iloc[0]["count"]) if not df.empty else 0
        return {"process_count": count}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Relationship count
@router.get("/metrics/relationships")
async def get_relationship_count():
    try:
        db = get_db()
        cypher = "MATCH ()-[r]->() RETURN count(r) AS count"
        df = db.query_to_dataframe(cypher)
        count = int(df.iloc[0]["count"]) if not df.empty else 0
        return {"relationship_count": count}
    except Exception as e:
        return {"status": "error", "message": str(e)}