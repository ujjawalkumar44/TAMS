from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.course import Course
from app.models.user import User
from app.schemas.course import CourseResponse

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.get("", response_model=list[CourseResponse])
def list_courses(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    courses = db.query(Course).order_by(Course.department, Course.semester).all()
    return [CourseResponse.model_validate(c) for c in courses]
