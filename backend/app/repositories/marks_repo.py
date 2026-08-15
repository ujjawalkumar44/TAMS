from sqlalchemy.orm import Session, joinedload

from app.core import thresholds as t
from app.models.enrollment import Enrollment
from app.models.marks import MarkRecord
from app.models.student import Student


ASSESSMENT_FIELD_MAP = {
    "assignment": ("assignment_marks", t.MAX_ASSIGNMENT),
    "quiz": ("quiz_marks", t.MAX_QUIZ),
    "internal": ("internal_marks", t.MAX_INTERNAL),
    "midterm": ("midterm_marks", t.MAX_MIDTERM),
    "endterm": ("endterm_marks", t.MAX_ENDTERM),
}


def get_max_marks_config() -> dict:
    return {
        "assignment": t.MAX_ASSIGNMENT,
        "quiz": t.MAX_QUIZ,
        "internal": t.MAX_INTERNAL,
        "midterm": t.MAX_MIDTERM,
        "endterm": t.MAX_ENDTERM,
        "total": t.MAX_ASSIGNMENT + t.MAX_QUIZ + t.MAX_INTERNAL + t.MAX_MIDTERM + t.MAX_ENDTERM,
    }


class MarksRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_enrolled_students(self, subject_id: int, section_id: int) -> list[Student]:
        return (
            self.db.query(Student)
            .join(Enrollment, Enrollment.student_id == Student.id)
            .filter(
                Enrollment.subject_id == subject_id,
                Enrollment.section_id == section_id,
                Student.section_id == section_id,
            )
            .options(joinedload(Student.section))
            .order_by(Student.roll_number)
            .all()
        )

    def get_record(self, student_id: int, subject_id: int, section_id: int) -> MarkRecord | None:
        return (
            self.db.query(MarkRecord)
            .filter(
                MarkRecord.student_id == student_id,
                MarkRecord.subject_id == subject_id,
                MarkRecord.section_id == section_id,
            )
            .first()
        )

    def get_by_id(self, record_id: int) -> MarkRecord | None:
        return self.db.query(MarkRecord).filter(MarkRecord.id == record_id).first()

    def upsert_record(
        self,
        student_id: int,
        subject_id: int,
        section_id: int,
        teacher_id: int,
        assignment: float,
        quiz: float,
        internal: float,
        midterm: float,
        endterm: float,
    ) -> MarkRecord:
        record = self.get_record(student_id, subject_id, section_id)
        total, percentage = MarkRecord.compute_totals(assignment, quiz, internal, midterm, endterm)

        if record:
            record.assignment_marks = assignment
            record.quiz_marks = quiz
            record.internal_marks = internal
            record.midterm_marks = midterm
            record.endterm_marks = endterm
            record.total_marks = total
            record.percentage = percentage
            record.teacher_id = teacher_id
        else:
            record = MarkRecord(
                student_id=student_id,
                subject_id=subject_id,
                section_id=section_id,
                teacher_id=teacher_id,
                assignment_marks=assignment,
                quiz_marks=quiz,
                internal_marks=internal,
                midterm_marks=midterm,
                endterm_marks=endterm,
                total_marks=total,
                percentage=percentage,
            )
            self.db.add(record)

        self.db.commit()
        self.db.refresh(record)
        return record

    def delete(self, record: MarkRecord) -> None:
        self.db.delete(record)
        self.db.commit()
