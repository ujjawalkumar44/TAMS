from pydantic import BaseModel


class AssignmentCreate(BaseModel):
    subject_id: int
    section_id: int
    academic_year: str
    semester: int


class AssignmentResponse(BaseModel):
    id: int
    teacher_id: int
    subject_id: int
    section_id: int
    academic_year: str
    semester: int
    subject_name: str | None = None
    subject_code: str | None = None
    section_name: str | None = None

    class Config:
        from_attributes = True
