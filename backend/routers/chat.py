from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse
from services.db import get_db
from services.loader import get_loader
from pydantic import BaseModel
from langGraphAgent import run_agent, handle_reallocate_student
from dataloading.dataloader import DataLoader
from typing import Optional, List

# Revamp all of these stuffs

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

class ReallocateRequest(BaseModel):
    target_id: int
    class_id: int

class ReallocateResponse(BaseModel):
    status: str
    message: str
    process_id: int

class SaveReallocationRequest(BaseModel):
    process_id: Optional[int] = None

class SaveReallocationResponse(BaseModel):
    status: str
    process_id: Optional[int] = None

@router.post("/chat", response_model=ChatResponse)
def chat_endpoint(
    req: ChatRequest,
    loader: DataLoader = Depends(get_loader)
):
    """
    Use this end point to chat with the agent.
    The request should contain the message to be sent to the agent.
    The agent will respond with a message.
    """
    # Extract the message from the request
    message = req.message
    response = run_agent(message)

    return ChatResponse(response=response)

@router.post("/reallocate", response_model=ReallocateResponse)
def reallocate_endpoint(
    req: ReallocateRequest,
    loader: DataLoader = Depends(get_loader)
):
    """"
    Use this end point to reallocate students to a new class.
    The request should contain the target_id and class_id.
    The target_id is the ID of the student to be reallocated.
    The class_id is the ID of the new class to which the student will be reallocated.

    -> Will return the process_id of the reallocation => use that process_id to get changes data
    Use -user_id: 32392 and class_id: 2 for testing
    
    """
    # Extract the target_id and class_id from the request
    target_id = req.target_id
    class_id = req.class_id

    process_id = handle_reallocate_student(target_id, class_id)
    
    return ReallocateResponse(status="success", message="Reallocation created", process_id=process_id)



@router.post("/reallocate/save", response_model=SaveReallocationResponse)
def reallocate_save_endpoint(
    req: SaveReallocationRequest,
    loader: DataLoader = Depends(get_loader)
):
    """
    Save the reallocation process and update the last process run ID.
    if no process_id is provided -> Save the latest process_run
    """
    # 
    process_id = req.process_id
    return_id = loader.update_last_process_run(process_run_id=process_id)

    if return_id is None:
        return SaveReallocationResponse(status="failed", process_id=None)
    
    return_id = int(return_id)
    
    return SaveReallocationResponse(status="success", process_id=return_id)