from pydantic import BaseModel, Field


class SubjectBase(BaseModel):
    subject_code: str = Field(..., min_length=2, max_length=20)
    subject_name: str = Field(..., min_length=1, max_length=100)
    credits: int = Field(default=3, ge=1, le=10)
    semester: int = Field(..., ge=1, le=8)
    branch: str = Field(default="Computer Science", max_length=100)


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    subject_code: str | None = Field(None, min_length=2, max_length=20)
    subject_name: str | None = None
    credits: int | None = Field(None, ge=1, le=10)
    semester: int | None = Field(None, ge=1, le=8)
    branch: str | None = None


class SubjectResponse(SubjectBase):
    id: int

    class Config:
        from_attributes = True
