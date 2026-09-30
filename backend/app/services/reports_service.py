from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.analytics.repository import AnalyticsRepository
from app.models.student import Student
from app.repositories.student_repo import AssignmentRepository
from app.services.analytics_service import AnalyticsService
from app.services.export_utils import build_export_response


class ReportsService:
    REPORT_TYPES = {"enrollment", "marks", "attendance", "at-risk", "section-summary"}

    def __init__(self, db: Session):
        self.db = db
        self.analytics_repo = AnalyticsRepository(db)
        self.analytics_svc = AnalyticsService(db)

    def _teacher_section_ids(self, teacher_id: int) -> set[int]:
        assignments = AssignmentRepository(self.db).list_by_teacher(teacher_id)
        return {a.section_id for a in assignments}

    def _get_analytics_rows(
        self,
        teacher_id: int,
        subject_id: Optional[int] = None,
        section_id: Optional[int] = None,
        semester: Optional[int] = None,
        academic_year: Optional[str] = None,
    ):
        return self.analytics_repo.get_teacher_rows(
            teacher_id, subject_id, section_id, semester, academic_year
        )

    def _enrollment_rows(
        self,
        teacher_id: int,
        section_id: Optional[int] = None,
        semester: Optional[int] = None,
        academic_year: Optional[str] = None,
    ) -> list[list]:
        section_ids = self._teacher_section_ids(teacher_id)
        if not section_ids:
            return []

        if section_id:
            if section_id not in section_ids:
                return []
            section_ids = {section_id}

        query = (
            self.db.query(Student)
            .options(joinedload(Student.section))
            .filter(Student.section_id.in_(section_ids))
        )
        if semester:
            query = query.filter(Student.semester == semester)
        if academic_year:
            query = query.filter(Student.academic_year == academic_year)

        students = query.order_by(Student.roll_number).all()
        return [
            [
                s.roll_number,
                s.name,
                s.registration_number,
                s.section.name if s.section else "",
                s.semester,
                s.academic_year,
                s.email,
                s.phone,
                s.gender,
            ]
            for s in students
        ]

    def _marks_rows(self, rows) -> list[list]:
        return [
            [
                r.roll_number,
                r.student_name,
                r.section_name,
                r.subject_name,
                r.internal,
                r.midterm,
                r.endterm,
                r.total_marks,
                round(r.marks_pct, 1),
            ]
            for r in rows
        ]

    def _attendance_rows(self, rows) -> list[list]:
        return [
            [
                r.roll_number,
                r.student_name,
                r.section_name,
                r.subject_name,
                r.total_classes,
                r.classes_attended,
                r.classes_absent,
                round(r.attendance_pct, 1),
            ]
            for r in rows
        ]

    def _at_risk_rows(
        self,
        teacher_id: int,
        subject_id: Optional[int] = None,
        section_id: Optional[int] = None,
        semester: Optional[int] = None,
        academic_year: Optional[str] = None,
    ) -> list[list]:
        students = self.analytics_svc.get_at_risk_students(
            teacher_id, subject_id, section_id, semester, academic_year
        )
        return [
            [
                s.roll_number,
                s.name,
                s.section,
                s.subject,
                round(s.marks, 1),
                round(s.attendance, 1),
                s.risk_score,
                s.risk_level,
                s.performance_trend,
                s.main_reason,
                "; ".join(s.reasons),
                "; ".join(s.recommended_actions),
            ]
            for s in students
        ]

    def _section_summary_rows(self, rows) -> list[list]:
        comparisons = AnalyticsService._section_comparison(rows)
        return [
            [
                item.section_name,
                item.students,
                item.avg_marks,
                item.avg_attendance,
                item.at_risk,
            ]
            for item in comparisons
        ]

    def get_preview_count(
        self,
        teacher_id: int,
        report_type: str,
        subject_id: Optional[int] = None,
        section_id: Optional[int] = None,
        semester: Optional[int] = None,
        academic_year: Optional[str] = None,
    ) -> int:
        if report_type not in self.REPORT_TYPES:
            raise HTTPException(status_code=400, detail="Invalid report type")

        if report_type == "enrollment":
            return len(self._enrollment_rows(teacher_id, section_id, semester, academic_year))

        rows = self._get_analytics_rows(
            teacher_id, subject_id, section_id, semester, academic_year
        )
        if report_type == "section-summary":
            return len(AnalyticsService._section_comparison(rows))
        if report_type == "at-risk":
            return len(
                self.analytics_svc.get_at_risk_students(
                    teacher_id, subject_id, section_id, semester, academic_year
                )
            )
        return len(rows)

    def export_report(
        self,
        teacher_id: int,
        report_type: str,
        fmt: str = "csv",
        subject_id: Optional[int] = None,
        section_id: Optional[int] = None,
        semester: Optional[int] = None,
        academic_year: Optional[str] = None,
    ):
        if report_type not in self.REPORT_TYPES:
            raise HTTPException(status_code=400, detail="Invalid report type")

        headers_map = {
            "enrollment": [
                "Roll Number",
                "Name",
                "Registration Number",
                "Section",
                "Semester",
                "Academic Year",
                "Email",
                "Phone",
                "Gender",
            ],
            "marks": [
                "Roll Number",
                "Name",
                "Section",
                "Subject",
                "Internal",
                "Midterm",
                "End Term",
                "Total Marks",
                "Percentage",
            ],
            "attendance": [
                "Roll Number",
                "Name",
                "Section",
                "Subject",
                "Total Classes",
                "Classes Attended",
                "Classes Absent",
                "Attendance %",
            ],
            "at-risk": [
                "Roll Number",
                "Name",
                "Section",
                "Subject",
                "Marks %",
                "Attendance %",
                "Risk Score",
                "Risk Level",
                "Trend",
                "Main Reason",
                "Risk Factors",
                "Recommended Actions",
            ],
            "section-summary": [
                "Section",
                "Students",
                "Avg Marks %",
                "Avg Attendance %",
                "At-Risk Count",
            ],
        }

        filename_map = {
            "enrollment": "student_enrollment_report",
            "marks": "marks_report",
            "attendance": "attendance_report",
            "at-risk": "at_risk_students_report",
            "section-summary": "section_summary_report",
        }

        if report_type == "enrollment":
            data_rows = self._enrollment_rows(teacher_id, section_id, semester, academic_year)
        else:
            analytics_rows = self._get_analytics_rows(
                teacher_id, subject_id, section_id, semester, academic_year
            )
            if report_type == "marks":
                data_rows = self._marks_rows(analytics_rows)
            elif report_type == "attendance":
                data_rows = self._attendance_rows(analytics_rows)
            elif report_type == "at-risk":
                data_rows = self._at_risk_rows(
                    teacher_id, subject_id, section_id, semester, academic_year
                )
            else:
                data_rows = self._section_summary_rows(analytics_rows)

        if not data_rows:
            raise HTTPException(status_code=404, detail="No data found for the selected filters")

        try:
            return build_export_response(
                headers_map[report_type],
                data_rows,
                filename_map[report_type],
                fmt,
            )
        except RuntimeError as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc
