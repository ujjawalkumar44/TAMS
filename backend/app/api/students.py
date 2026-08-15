from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_teacher
from app.db.session import get_db
from app.models.teacher import Teacher
from app.schemas.student import StudentCreate, StudentListResponse, StudentResponse, StudentUpdate
from app.services.student_service import StudentService

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("", response_model=StudentListResponse)
def list_students(
    search: Optional[str] = Query(None),
    section_id: Optional[int] = Query(None),
    semester: Optional[int] = Query(None),
    subject_id: Optional[int] = Query(None),
    academic_year: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    _: Teacher = Depends(get_current_teacher),
):
    return StudentService(db).list_students(
        search=search,
        section_id=section_id,
        semester=semester,
        subject_id=subject_id,
        academic_year=academic_year,
        page=page,
        page_size=page_size,
    )


@router.get("/filters/options")
def get_filter_options(
    db: Session = Depends(get_db),
    _: Teacher = Depends(get_current_teacher),
):
    return StudentService(db).get_filter_options()


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    _: Teacher = Depends(get_current_teacher),
):
    return StudentService(db).get_student(student_id)


@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    data: StudentCreate,
    db: Session = Depends(get_db),
    _: Teacher = Depends(get_current_teacher),
):
    return StudentService(db).create_student(data)


@router.put("/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: int,
    data: StudentUpdate,
    db: Session = Depends(get_db),
    _: Teacher = Depends(get_current_teacher),
):
    return StudentService(db).update_student(student_id, data)


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    _: Teacher = Depends(get_current_teacher),
):
    StudentService(db).delete_student(student_id)
