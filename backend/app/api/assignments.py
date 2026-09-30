from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_teacher
from app.db.session import get_db
from app.models.teacher import Teacher
from app.schemas.assignment import AssignmentCreate, AssignmentResponse
from app.services.academic_service import AssignmentService

router = APIRouter(prefix="/assignments", tags=["Teacher Assignments"])


@router.get("", response_model=list[AssignmentResponse])
def list_assignments(
    academic_year: str | None = None,
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher),
):
    return AssignmentService(db).list_assignments(teacher.id, academic_year)


@router.post("", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
def create_assignment(
    data: AssignmentCreate,
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher),
):
    return AssignmentService(db).create_assignment(teacher.id, data)
