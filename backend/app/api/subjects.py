from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_teacher
from app.db.session import get_db
from app.models.teacher import Teacher
from app.schemas.subject import SubjectCreate, SubjectResponse, SubjectUpdate
from app.services.academic_service import SubjectService

router = APIRouter(prefix="/subjects", tags=["Subjects"])


@router.get("", response_model=list[SubjectResponse])
def list_subjects(
    semester: Optional[int] = Query(None),
    branch: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: Teacher = Depends(get_current_teacher),
):
    return SubjectService(db).list_subjects(semester, branch)


@router.post("", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(
    data: SubjectCreate,
    db: Session = Depends(get_db),
    _: Teacher = Depends(get_current_teacher),
):
    return SubjectService(db).create_subject(data)


@router.put("/{subject_id}", response_model=SubjectResponse)
def update_subject(
    subject_id: int,
    data: SubjectUpdate,
    db: Session = Depends(get_db),
    _: Teacher = Depends(get_current_teacher),
):
    return SubjectService(db).update_subject(subject_id, data)


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    _: Teacher = Depends(get_current_teacher),
):
    SubjectService(db).delete_subject(subject_id)
