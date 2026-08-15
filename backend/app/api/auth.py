from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_teacher
from app.db.session import get_db
from app.models.teacher import Teacher
from app.schemas.auth import LoginRequest, TeacherResponse, TokenResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    return AuthService(db).login(credentials)


@router.get("/me", response_model=TeacherResponse)
def get_me(teacher: Teacher = Depends(get_current_teacher)):
    return TeacherResponse.model_validate(teacher)
