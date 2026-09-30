from dataclasses import dataclass
from typing import Optional

from sqlalchemy.orm import Session, joinedload

from app.models.attendance import AttendanceRecord
from app.models.enrollment import Enrollment
from app.models.marks import MarkRecord
from app.models.student import Student
from app.models.teacher_subject_section import TeacherSubjectSection


@dataclass
class AnalyticsRow:
    student_id: int
    student_name: str
    roll_number: str
    section_id: int
    section_name: str
    subject_id: int
    subject_name: str
    semester: int
    academic_year: str
    marks_pct: float
    attendance_pct: float
    internal: float
    midterm: float
    endterm: float
    total_marks: float = 0
    total_classes: int = 0
    classes_attended: int = 0
    classes_absent: int = 0


class AnalyticsRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_teacher_rows(
        self,
        teacher_id: int,
        subject_id: Optional[int] = None,
        section_id: Optional[int] = None,
        semester: Optional[int] = None,
        academic_year: Optional[str] = None,
    ) -> list[AnalyticsRow]:
        query = (
            self.db.query(TeacherSubjectSection)
            .options(
                joinedload(TeacherSubjectSection.subject),
                joinedload(TeacherSubjectSection.section),
            )
        )

        if subject_id:
            query = query.filter(TeacherSubjectSection.subject_id == subject_id)
        if section_id:
            query = query.filter(TeacherSubjectSection.section_id == section_id)
        if semester:
            query = query.filter(TeacherSubjectSection.semester == semester)
        if academic_year:
            query = query.filter(TeacherSubjectSection.academic_year == academic_year)

        assignments = query.all()
        rows: list[AnalyticsRow] = []

        for assignment in assignments:
            students = (
                self.db.query(Student)
                .join(Enrollment, Enrollment.student_id == Student.id)
                .filter(
                    Enrollment.subject_id == assignment.subject_id,
                    Enrollment.section_id == assignment.section_id,
                    Student.section_id == assignment.section_id,
                )
                .order_by(Student.roll_number)
                .all()
            )

            for student in students:
                mark = (
                    self.db.query(MarkRecord)
                    .filter(
                        MarkRecord.student_id == student.id,
                        MarkRecord.subject_id == assignment.subject_id,
                        MarkRecord.section_id == assignment.section_id,
                    )
                    .first()
                )
                att = (
                    self.db.query(AttendanceRecord)
                    .filter(
                        AttendanceRecord.student_id == student.id,
                        AttendanceRecord.subject_id == assignment.subject_id,
                        AttendanceRecord.section_id == assignment.section_id,
                    )
                    .first()
                )

                total = 0.0
                if mark:
                    total = (
                        mark.internal_marks
                        + mark.midterm_marks + mark.endterm_marks
                    )

                rows.append(
                    AnalyticsRow(
                        student_id=student.id,
                        student_name=student.name,
                        roll_number=student.roll_number,
                        section_id=assignment.section_id,
                        section_name=assignment.section.name,
                        subject_id=assignment.subject_id,
                        subject_name=assignment.subject.subject_name,
                        semester=assignment.semester,
                        academic_year=assignment.academic_year,
                        marks_pct=mark.percentage if mark else 0.0,
                        attendance_pct=att.attendance_percentage if att else 0.0,
                        internal=mark.internal_marks if mark else 0.0,
                        midterm=mark.midterm_marks if mark else 0.0,
                        endterm=mark.endterm_marks if mark else 0.0,
                        total_marks=total,
                        total_classes=att.total_classes if att else 0,
                        classes_attended=att.classes_attended if att else 0,
                        classes_absent=att.classes_absent if att else 0,
                    )
                )

        return rows

    def get_filter_options(self, teacher_id: int) -> dict:
        from app.models.subject import Subject
        from app.models.section import Section
        
        subjects = self.db.query(Subject).all()
        sections = self.db.query(Section).all()
        
        return {
            "subjects": [
                {"id": s.id, "name": s.subject_name} 
                for s in subjects
            ],
            "sections": [
                {
                    "id": s.id, 
                    "name": s.name, 
                    "semester": s.semester, 
                    "academic_year": s.academic_year
                } 
                for s in sections
            ],
            "semesters": sorted(list({s.semester for s in sections})),
            "academic_years": sorted(list({s.academic_year for s in sections}), reverse=True),
        }
