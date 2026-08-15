from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class Section(Base):
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(20), unique=True, nullable=False, index=True)
    branch = Column(String(100), nullable=False, default="Computer Science")
    semester = Column(Integer, nullable=False, index=True)
    academic_year = Column(String(10), nullable=False, index=True)

    students = relationship("Student", back_populates="section")
    assignments = relationship("TeacherSubjectSection", back_populates="section")
    enrollments = relationship("Enrollment", back_populates="section")
