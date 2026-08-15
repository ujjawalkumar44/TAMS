from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CourseResponse(BaseModel):
    id: int
    code: str
    name: str
    department: str
    semester: int
    credits: int
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
