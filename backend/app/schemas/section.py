from pydantic import BaseModel, Field


class SectionBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=20)
    branch: str = Field(default="Computer Science", max_length=100)
    semester: int = Field(..., ge=1, le=8)
    academic_year: str = Field(..., min_length=4, max_length=10)


class SectionCreate(SectionBase):
    pass


class SectionUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=20)
    branch: str | None = None
    semester: int | None = Field(None, ge=1, le=8)
    academic_year: str | None = None


class SectionResponse(SectionBase):
    id: int

    class Config:
        from_attributes = True
