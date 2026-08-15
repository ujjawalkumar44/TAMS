from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class StudentBase(BaseModel):
    roll_number: str = Field(..., min_length=1, max_length=20)
    registration_number: str = Field(..., min_length=1, max_length=30)
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=15)
    gender: str = Field(default="Male", pattern="^(Male|Female|Other)$")
    section_id: int
    semester: int = Field(..., ge=1, le=8)
    academic_year: str = Field(..., min_length=4, max_length=10)


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    roll_number: Optional[str] = None
    registration_number: Optional[str] = None
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    section_id: Optional[int] = None
    semester: Optional[int] = Field(None, ge=1, le=8)
    academic_year: Optional[str] = None


class StudentResponse(StudentBase):
    id: int
    section_name: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StudentListResponse(BaseModel):
    items: list[StudentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
