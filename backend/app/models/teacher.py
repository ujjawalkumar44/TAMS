from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    department = Column(String(100), nullable=False, default="Computer Science")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    assignments = relationship("TeacherSubjectSection", back_populates="teacher")
