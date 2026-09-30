from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base import Base


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    subject_code = Column(String(20), unique=True, nullable=False, index=True)
    subject_name = Column(String(100), nullable=False)
    credits = Column(Integer, default=3)
    semester = Column(Integer, nullable=False, index=True)
    branch = Column(String(100), nullable=False, default="Computer Science")

    assignments = relationship("TeacherSubjectSection", back_populates="subject")
    enrollments = relationship("Enrollment", back_populates="subject")
    marks_records = relationship("MarkRecord", back_populates="subject")
    attendance_records = relationship("AttendanceRecord", back_populates="subject")
