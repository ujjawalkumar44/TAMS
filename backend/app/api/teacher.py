from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_teacher
from app.db.session import get_db
from app.models.teacher import Teacher
from app.schemas.auth import TeacherResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/teacher", tags=["Teacher"])


@router.get("/profile", response_model=TeacherResponse)
def get_profile(
    teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    return AuthService(db).get_profile(teacher)
