from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

AssessmentType = Literal["internal", "midterm", "endterm"]


class AssessmentConfig(BaseModel):
    internal: float = 30
    midterm: float = 20
    endterm: float = 50
    total: float = 100


class MarkEntryResponse(BaseModel):
    student_id: int
    roll_number: str
    name: str
    mark_record_id: Optional[int] = None
    internal_marks: float = 0
    midterm_marks: float = 0
    endterm_marks: float = 0
    total_marks: float = 0
    percentage: float = 0


class MarksSheetResponse(BaseModel):
    subject_id: int
    section_id: int
    subject_name: str
    section_name: str
    max_marks: AssessmentConfig
    entries: list[MarkEntryResponse]


class BulkMarkEntry(BaseModel):
    student_id: int
    marks: Optional[float] = Field(None, ge=0)
    internal_marks: Optional[float] = Field(None, ge=0)
    midterm_marks: Optional[float] = Field(None, ge=0)
    endterm_marks: Optional[float] = Field(None, ge=0)


class BulkMarksSaveRequest(BaseModel):
    subject_id: int
    section_id: int
    assessment_type: Optional[AssessmentType] = None
    entries: list[BulkMarkEntry] = Field(..., min_length=1)


class BulkMarksSaveResponse(BaseModel):
    saved: int
    message: str


class MarkRecordResponse(BaseModel):
    id: int
    student_id: int
    subject_id: int
    section_id: int
    internal_marks: float
    midterm_marks: float
    endterm_marks: float
    total_marks: float
    percentage: float
    updated_at: datetime

    class Config:
        from_attributes = True


class MarkRecordUpdate(BaseModel):
    internal_marks: Optional[float] = Field(None, ge=0)
    midterm_marks: Optional[float] = Field(None, ge=0)
    endterm_marks: Optional[float] = Field(None, ge=0)
