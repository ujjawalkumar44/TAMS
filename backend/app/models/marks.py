from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.base import Base


class MarkRecord(Base):
    __tablename__ = "mark_records"
    __table_args__ = (
        UniqueConstraint("student_id", "subject_id", "section_id", name="uq_mark_record"),
    )

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True)

    assignment_marks = Column(Float, default=0)
    quiz_marks = Column(Float, default=0)
    internal_marks = Column(Float, default=0)
    midterm_marks = Column(Float, default=0)
    endterm_marks = Column(Float, default=0)
    total_marks = Column(Float, default=0)
    percentage = Column(Float, default=0)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    student = relationship("Student", back_populates="marks_records")
    subject = relationship("Subject", back_populates="marks_records")

    @staticmethod
    def compute_totals(
        internal: float, midterm: float, endterm: float,
        max_internal=30, max_midterm=20, max_endterm=50,
    ) -> tuple[float, float]:
        total_obtained = internal + midterm + endterm
        total_max = max_internal + max_midterm + max_endterm

        if total_max == 0:
            return 0.0, 0.0

        percentage = (total_obtained / total_max) * 100
        return round(total_obtained, 2), round(percentage, 2)
