from sqlalchemy import Column, Integer, String, UniqueConstraint, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base import Base


class Section(Base):
    __tablename__ = "sections"
    __table_args__ = (
        UniqueConstraint("name", "semester", "academic_year", "branch", name="uq_section_name_sem_year_branch"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(20), nullable=False, index=True)
    branch = Column(String(100), nullable=False, default="Computer Science")
    semester = Column(Integer, nullable=False, index=True)
    academic_year = Column(String(10), nullable=False, index=True)

    students = relationship("Student", back_populates="section")
    assignments = relationship("TeacherSubjectSection", back_populates="section")
    enrollments = relationship("Enrollment", back_populates="section")

