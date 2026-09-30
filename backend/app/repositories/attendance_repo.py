from datetime import date

from sqlalchemy.orm import Session, joinedload

from app.core import thresholds as t
from app.models.attendance import AttendanceRecord, AttendanceSession
from app.models.enrollment import Enrollment
from app.models.student import Student


def get_alert(percentage: float) -> tuple[str, str | None]:
    if percentage < t.ATTENDANCE_WARNING_MIN:
        return "critical", "Critical Attendance"
    if percentage < t.ATTENDANCE_FAIR_MIN:
        return "warning", "Attendance Warning"
    return "none", None


class AttendanceRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_enrolled_students(self, subject_id: int, section_id: int) -> list[Student]:
        students = (
            self.db.query(Student)
            .filter(Student.section_id == section_id)
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

    def get_session(
        self, student_id: int, subject_id: int, section_id: int, att_date: date
    ) -> AttendanceSession | None:
        return (
            self.db.query(AttendanceSession)
            .filter(
                AttendanceSession.student_id == student_id,
                AttendanceSession.subject_id == subject_id,
                AttendanceSession.section_id == section_id,
                AttendanceSession.date == att_date,
            )
            .first()
        )

    def get_sessions_for_student(
        self, student_id: int, subject_id: int, section_id: int
    ) -> list[AttendanceSession]:
        return (
            self.db.query(AttendanceSession)
            .filter(
                AttendanceSession.student_id == student_id,
                AttendanceSession.subject_id == subject_id,
                AttendanceSession.section_id == section_id,
            )
            .all()
        )

    def get_aggregate_record(
        self, student_id: int, subject_id: int, section_id: int
    ) -> AttendanceRecord | None:
        return (
            self.db.query(AttendanceRecord)
            .filter(
                AttendanceRecord.student_id == student_id,
                AttendanceRecord.subject_id == subject_id,
                AttendanceRecord.section_id == section_id,
            )
            .first()
        )

    def upsert_session(
        self,
        student_id: int,
        subject_id: int,
        section_id: int,
        teacher_id: int,
        att_date: date,
        status: str,
    ) -> AttendanceSession:
        session = self.get_session(student_id, subject_id, section_id, att_date)
        if session:
            session.status = status
            session.teacher_id = teacher_id
        else:
            session = AttendanceSession(
                student_id=student_id,
                subject_id=subject_id,
                section_id=section_id,
                teacher_id=teacher_id,
                date=att_date,
                status=status,
            )
            self.db.add(session)
        self.db.flush()
        return session

    def recalculate_aggregate(
        self,
        student_id: int,
        subject_id: int,
        section_id: int,
        teacher_id: int,
    ) -> AttendanceRecord:
        sessions = self.get_sessions_for_student(student_id, subject_id, section_id)
        total = len(sessions)
        attended = sum(1 for s in sessions if s.status == "present")
        absent = sum(1 for s in sessions if s.status == "absent")
        percentage = AttendanceRecord.compute_percentage(attended, total)

        record = self.get_aggregate_record(student_id, subject_id, section_id)
        if record:
            record.total_classes = total
            record.classes_attended = attended
            record.classes_absent = absent
            record.attendance_percentage = percentage
            record.teacher_id = teacher_id
        else:
            record = AttendanceRecord(
                student_id=student_id,
                subject_id=subject_id,
                section_id=section_id,
                teacher_id=teacher_id,
                total_classes=total,
                classes_attended=attended,
                classes_absent=absent,
                attendance_percentage=percentage,
            )
            self.db.add(record)

        self.db.commit()
        self.db.refresh(record)
        return record

    def get_aggregate_stats(
        self, student_id: int, subject_id: int, section_id: int
    ) -> dict:
        sessions = self.get_sessions_for_student(student_id, subject_id, section_id)
        if sessions:
            total = len(sessions)
            attended = sum(1 for s in sessions if s.status == "present")
            absent = sum(1 for s in sessions if s.status == "absent")
            percentage = AttendanceRecord.compute_percentage(attended, total)
            return {
                "total_classes": total,
                "classes_attended": attended,
                "classes_absent": absent,
                "attendance_percentage": percentage,
            }

        record = self.get_aggregate_record(student_id, subject_id, section_id)
        if record:
            return {
                "total_classes": record.total_classes,
                "classes_attended": record.classes_attended,
                "classes_absent": record.classes_absent,
                "attendance_percentage": record.attendance_percentage,
            }

        return {
            "total_classes": 0,
            "classes_attended": 0,
            "classes_absent": 0,
            "attendance_percentage": 0.0,
        }
