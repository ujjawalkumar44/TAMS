from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.teacher import Teacher
from app.repositories.teacher_repo import TeacherRepository
from app.schemas.auth import LoginRequest, TokenResponse, TeacherResponse


class AuthService:
    def __init__(self, db: Session):
        self.repo = TeacherRepository(db)

    def login(self, credentials: LoginRequest) -> TokenResponse:
        teacher = self.repo.get_by_email(credentials.email)
        if not teacher or not verify_password(credentials.password, teacher.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )
        token = create_access_token(data={"sub": teacher.email})
        return TokenResponse(access_token=token)

    def create_teacher(self, name: str, email: str, password: str, department: str) -> Teacher:
        existing = self.repo.get_by_email(email)
        if existing:
            return existing
        teacher = Teacher(
            name=name,
            email=email,
            password_hash=get_password_hash(password),
            department=department,
        )
        return self.repo.create(teacher)

    def get_profile(self, teacher: Teacher) -> TeacherResponse:
        return TeacherResponse.model_validate(teacher)
