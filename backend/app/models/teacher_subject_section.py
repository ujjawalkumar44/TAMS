from sqlalchemy import Column, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.base import Base


class TeacherSubjectSection(Base):
    __tablename__ = "teacher_subject_sections"
    __table_args__ = (
        UniqueConstraint("teacher_id", "subject_id", "section_id", "academic_year", name="uq_teacher_assignment"),
    )

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=False)
    academic_year = Column(String(10), nullable=False)
    semester = Column(Integer, nullable=False)

    teacher = relationship("Teacher", back_populates="assignments")
    subject = relationship("Subject", back_populates="assignments")
    section = relationship("Section", back_populates="assignments")
