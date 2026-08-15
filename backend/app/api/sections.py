from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_teacher
from app.db.session import get_db
from app.models.teacher import Teacher
from app.schemas.section import SectionCreate, SectionResponse, SectionUpdate
from app.services.academic_service import SectionService

router = APIRouter(prefix="/sections", tags=["Sections"])


@router.get("", response_model=list[SectionResponse])
def list_sections(
    semester: Optional[int] = Query(None),
    academic_year: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: Teacher = Depends(get_current_teacher),
):
    return SectionService(db).list_sections(semester, academic_year)


@router.post("", response_model=SectionResponse, status_code=status.HTTP_201_CREATED)
def create_section(
    data: SectionCreate,
    db: Session = Depends(get_db),
    _: Teacher = Depends(get_current_teacher),
):
    return SectionService(db).create_section(data)


@router.put("/{section_id}", response_model=SectionResponse)
def update_section(
    section_id: int,
    data: SectionUpdate,
    db: Session = Depends(get_db),
    _: Teacher = Depends(get_current_teacher),
):
    return SectionService(db).update_section(section_id, data)


@router.delete("/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_section(
    section_id: int,
    db: Session = Depends(get_db),
    _: Teacher = Depends(get_current_teacher),
):
    SectionService(db).delete_section(section_id)
