from pydantic import BaseModel, Field
from typing import Optional

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)

class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=4)

class DownloadRequest(BaseModel):
    model_id: str = Field(..., min_length=1)
    token: Optional[str] = None

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    limit: int = Field(default=20, ge=1, le=100)
    sort: Optional[str] = "downloads"
    direction: Optional[int] = -1

class HFTokenRequest(BaseModel):
    token: str = Field(..., min_length=1)

class VerifyRequest(BaseModel):
    model_name: str = Field(..., min_length=1)
