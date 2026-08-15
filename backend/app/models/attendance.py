from datetime import date, datetime, timezone

from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.base import Base


class AttendanceRecord(Base):
    """Aggregated attendance per student/subject/section."""
    __tablename__ = "attendance_records"
    __table_args__ = (
        UniqueConstraint("student_id", "subject_id", "section_id", name="uq_attendance_record"),
    )

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True)

    total_classes = Column(Integer, default=0)
    classes_attended = Column(Integer, default=0)
    classes_absent = Column(Integer, default=0)
    attendance_percentage = Column(Float, default=0)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    student = relationship("Student", back_populates="attendance_records")
    subject = relationship("Subject", back_populates="attendance_records")

    @staticmethod
    def compute_percentage(attended: int, total: int) -> float:
        return round((attended / total) * 100, 1) if total > 0 else 0.0


class AttendanceSession(Base):
    """Daily attendance entry for a subject/section on a specific date."""
    __tablename__ = "attendance_sessions"
    __table_args__ = (
        UniqueConstraint("student_id", "subject_id", "section_id", "date", name="uq_attendance_session"),
    )

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True)
    date = Column(Date, nullable=False, index=True)
    status = Column(String(10), nullable=False, default="present")  # present | absent
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
