from sqlalchemy.orm import Session, joinedload

from app.core import thresholds as t
from app.models.enrollment import Enrollment
from app.models.marks import MarkRecord
from app.models.student import Student


ASSESSMENT_FIELD_MAP = {
    "internal": ("internal_marks", t.MAX_INTERNAL),
    "midterm": ("midterm_marks", t.MAX_MIDTERM),
    "endterm": ("endterm_marks", t.MAX_ENDTERM),
}


def get_max_marks_config() -> dict:
    return {
        "internal": t.MAX_INTERNAL,
        "midterm": t.MAX_MIDTERM,
        "endterm": t.MAX_ENDTERM,
        "total": t.MAX_INTERNAL + t.MAX_MIDTERM + t.MAX_ENDTERM,
    }


class MarksRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_enrolled_students(self, subject_id: int, section_id: int) -> list[Student]:
        students = (
            self.db.query(Student)
            .filter(Student.section_id == section_id)
            .options(joinedload(Student.section))
            .order_by(Student.roll_number)
            .all()
        )
        for s in students:
            exists = (
                self.db.query(Enrollment)
                .filter(
                    Enrollment.student_id == s.id,
                    Enrollment.subject_id == subject_id,
                    Enrollment.section_id == section_id,
                )
                .first()
            )
            if not exists:
                self.db.add(
                    Enrollment(
                        student_id=s.id,
                        subject_id=subject_id,
                        section_id=section_id,
                        academic_year=s.academic_year,
                    )
                )
        if students:
            self.db.commit()
        return students

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
        internal: float,
        midterm: float,
        endterm: float,
    ) -> MarkRecord:
        record = self.get_record(student_id, subject_id, section_id)
        total, percentage = MarkRecord.compute_totals(internal, midterm, endterm)

        if record:
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
