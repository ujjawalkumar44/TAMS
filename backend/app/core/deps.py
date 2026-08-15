from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.teacher import Teacher

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_teacher(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> Teacher:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    email: str | None = payload.get("sub")
    if email is None:
        raise credentials_exception

    teacher = db.query(Teacher).filter(Teacher.email == email).first()
    if teacher is None:
        raise credentials_exception
    return teacher
