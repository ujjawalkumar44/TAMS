from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TeacherResponse(BaseModel):
    id: int
    name: str
    email: str
    department: str

    class Config:
        from_attributes = True
