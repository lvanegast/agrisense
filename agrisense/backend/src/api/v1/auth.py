import uuid

from fastapi import APIRouter
from pydantic import BaseModel

from src.infrastructure.auth.jwt import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


class AuthRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/login", response_model=TokenResponse)
async def login(body: AuthRequest):
    user_id = str(uuid.uuid4())
    token = create_access_token(user_id)
    return TokenResponse(access_token=token)


@router.post("/register", response_model=TokenResponse)
async def register(body: AuthRequest):
    user_id = str(uuid.uuid4())
    token = create_access_token(user_id)
    return TokenResponse(access_token=token)
