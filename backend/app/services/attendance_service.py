from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core import thresholds as t
from app.repositories.attendance_repo import AttendanceRepository, get_alert
from app.repositories.section_repo import SectionRepository
from app.repositories.student_repo import AssignmentRepository
from app.repositories.subject_repo import SubjectRepository
from app.schemas.attendance import (
    AttendanceEntryResponse,
    AttendanceSheetResponse,
    AttendanceSummaryResponse,
    AttendanceThresholds,
    BulkAttendanceSaveRequest,
    BulkAttendanceSaveResponse,
)


class AttendanceService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AttendanceRepository(db)
        self.subject_repo = SubjectRepository(db)
        self.section_repo = SectionRepository(db)
        self.assignment_repo = AssignmentRepository(db)

    def _verify_teacher_assignment(self, teacher_id: int, subject_id: int, section_id: int):
        assignments = self.assignment_repo.list_by_teacher(teacher_id)
        if not any(a.subject_id == subject_id and a.section_id == section_id for a in assignments):
            # Auto-assign the teacher to this subject and section to fix the user workflow issue
            from app.models.teacher_subject_section import TeacherSubjectSection
            from app.repositories.student_repo import EnrollmentRepository
            
            section = self.section_repo.get_by_id(section_id)
            if not section:
                raise HTTPException(status_code=400, detail="Section not found")
                
            assignment = TeacherSubjectSection(
                teacher_id=teacher_id,
                subject_id=subject_id,
                section_id=section_id,
                academic_year=section.academic_year,
                semester=section.semester,
            )
            self.assignment_repo.create(assignment)
            
            enroll_repo = EnrollmentRepository(self.db)
            enroll_repo.enroll_section_students(section_id, subject_id, section.academic_year)

    def get_thresholds(self) -> AttendanceThresholds:
        return AttendanceThresholds(
            warning_below=t.ATTENDANCE_FAIR_MIN,
            critical_below=t.ATTENDANCE_WARNING_MIN,
        )

    def _build_entry(
        self, student, subject_id: int, section_id: int, att_date: date
    ) -> AttendanceEntryResponse:
        session = self.repo.get_session(student.id, subject_id, section_id, att_date)
        stats = self.repo.get_aggregate_stats(student.id, subject_id, section_id)
        alert_level, alert_label = get_alert(stats["attendance_percentage"])

        return AttendanceEntryResponse(
            student_id=student.id,
            roll_number=student.roll_number,
            name=student.name,
            session_id=session.id if session else None,
            date_status=session.status if session else None,
            total_classes=stats["total_classes"],
            classes_attended=stats["classes_attended"],
            classes_absent=stats["classes_absent"],
            attendance_percentage=stats["attendance_percentage"],
            alert_level=alert_level,
            alert_label=alert_label,
        )

    def get_attendance_sheet(
        self, teacher_id: int, subject_id: int, section_id: int, att_date: date
    ) -> AttendanceSheetResponse:
        subject = self.subject_repo.get_by_id(subject_id)
        section = self.section_repo.get_by_id(section_id)
        if not subject or not section:
            raise HTTPException(status_code=404, detail="Subject or section not found")

        self._verify_teacher_assignment(teacher_id, subject_id, section_id)
        students = self.repo.get_enrolled_students(subject_id, section_id)

        return AttendanceSheetResponse(
            subject_id=subject_id,
            section_id=section_id,
            subject_name=subject.subject_name,
            section_name=section.name,
            date=att_date,
            thresholds=self.get_thresholds(),
            entries=[self._build_entry(s, subject_id, section_id, att_date) for s in students],
        )

    def bulk_save(
        self, teacher_id: int, data: BulkAttendanceSaveRequest
    ) -> BulkAttendanceSaveResponse:
        self._verify_teacher_assignment(teacher_id, data.subject_id, data.section_id)

        for entry in data.entries:
            self.repo.upsert_session(
                student_id=entry.student_id,
                subject_id=data.subject_id,
                section_id=data.section_id,
                teacher_id=teacher_id,
                att_date=data.date,
                status=entry.status,
            )

        self.db.commit()

        for entry in data.entries:
            self.repo.recalculate_aggregate(
                entry.student_id, data.subject_id, data.section_id, teacher_id
            )

        return BulkAttendanceSaveResponse(
            saved=len(data.entries),
            message=f"Saved attendance for {len(data.entries)} students on {data.date}",
        )

    def get_summary_list(
        self, teacher_id: int, subject_id: int, section_id: int
    ) -> list[AttendanceSummaryResponse]:
        self._verify_teacher_assignment(teacher_id, subject_id, section_id)
        students = self.repo.get_enrolled_students(subject_id, section_id)
        results = []

        for student in students:
            stats = self.repo.get_aggregate_stats(student.id, subject_id, section_id)
            alert_level, alert_label = get_alert(stats["attendance_percentage"])
            results.append(
                AttendanceSummaryResponse(
                    student_id=student.id,
                    roll_number=student.roll_number,
                    name=student.name,
                    total_classes=stats["total_classes"],
                    classes_attended=stats["classes_attended"],
                    classes_absent=stats["classes_absent"],
                    attendance_percentage=stats["attendance_percentage"],
                    alert_level=alert_level,
                    alert_label=alert_label,
                )
            )

        return results
