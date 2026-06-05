from fastapi import APIRouter, Depends
from pydantic import BaseModel
from src.infrastructure.auth.jwt import get_current_user
from src.api.deps import get_copilot_service
from src.application.services.copilot_service import CopilotService

router = APIRouter(prefix="/copilot", tags=["copilot"])


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


@router.post("/chat", response_model=ChatResponse)
async def copilot_chat(
    body: ChatRequest,
    service: CopilotService = Depends(get_copilot_service),
    _user: str = Depends(get_current_user),
):
    reply = await service.chat(body.message)
    return ChatResponse(reply=reply)
