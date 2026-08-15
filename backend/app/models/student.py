from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    roll_number = Column(String(20), unique=True, nullable=False, index=True)
    registration_number = Column(String(30), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(15), nullable=False)
    gender = Column(String(10), nullable=False, default="Male")
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="RESTRICT"), nullable=False, index=True)
    semester = Column(Integer, nullable=False, index=True)
    academic_year = Column(String(10), nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    section = relationship("Section", back_populates="students")
    enrollments = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")
    marks_records = relationship("MarkRecord", back_populates="student", cascade="all, delete-orphan")
    attendance_records = relationship("AttendanceRecord", back_populates="student", cascade="all, delete-orphan")
