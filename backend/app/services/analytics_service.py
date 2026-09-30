from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.analytics.repository import AnalyticsRepository
from app.analytics.risk import (
    calculate_risk,
    get_assessment_series,
    get_recommended_actions,
    is_at_risk,
    main_reason,
)
from app.core import thresholds as t
from app.schemas.analytics import (
    AttentionStudent,
    ChartDataPoint,
    DashboardFilters,
    DashboardResponse,
    DashboardStats,
    ScatterPoint,
    SectionComparison,
    StudentAnalyticsResponse,
    SubjectComparison,
    SubjectPerformance,
    TrendPoint,
)


class AnalyticsService:
    def __init__(self, db: Session):
        self.repo = AnalyticsRepository(db)

    def get_filter_options(self, teacher_id: int) -> dict:
        return self.repo.get_filter_options(teacher_id)

    @staticmethod
    def _analyze_row(row) -> tuple[int, str, list[str], str, list[str]]:
        score, level, reasons, trend = calculate_risk(
            row.marks_pct,
            row.attendance_pct,
            row.internal,
            row.midterm,
            row.endterm,
        )
        actions = get_recommended_actions(reasons, row.marks_pct, row.attendance_pct, trend)
        return score, level, reasons, trend, actions

    @classmethod
    def _row_to_attention(cls, row) -> AttentionStudent:
        score, level, reasons, trend, actions = cls._analyze_row(row)
        return AttentionStudent(
            student_id=row.student_id,
            name=row.student_name,
            roll_number=row.roll_number,
            section=row.section_name,
            subject=row.subject_name,
            marks=row.marks_pct,
            attendance=row.attendance_pct,
            risk_level=level,
            risk_score=score,
            main_reason=main_reason(reasons, row.marks_pct, row.attendance_pct),
            reasons=reasons,
            recommended_actions=actions,
            performance_trend=trend,
        )

    @classmethod
    def _row_to_subject_performance(cls, row) -> SubjectPerformance:
        score, level, reasons, trend, actions = cls._analyze_row(row)
        trend_data = [
            TrendPoint(assessment=name, percentage=pct)
            for name, pct in get_assessment_series(
                row.internal, row.midterm, row.endterm
            )
        ]
        return SubjectPerformance(
            subject_id=row.subject_id,
            subject_name=row.subject_name,
            section_name=row.section_name,
            internal_marks=row.internal,
            midterm_marks=row.midterm,
            endterm_marks=row.endterm,
            total_marks=row.total_marks,
            percentage=row.marks_pct,
            total_classes=row.total_classes,
            classes_attended=row.classes_attended,
            classes_absent=row.classes_absent,
            attendance_percentage=row.attendance_pct,
            performance_trend=trend,
            trend_data=trend_data,
            risk_score=score,
            risk_level=level,
            reasons=reasons,
            recommended_actions=actions,
        )

    def get_dashboard(
        self,
        teacher_id: int,
        subject_id: Optional[int] = None,
        section_id: Optional[int] = None,
        semester: Optional[int] = None,
        academic_year: Optional[str] = None,
    ) -> DashboardResponse:
        rows = self.repo.get_teacher_rows(
            teacher_id, subject_id, section_id, semester, academic_year
        )

        unique_students = {r.student_id for r in rows}
        unique_sections = {r.section_id for r in rows}
        unique_subjects = {r.subject_id for r in rows}

        marks_vals = [r.marks_pct for r in rows]
        att_vals = [r.attendance_pct for r in rows]
        avg_marks = round(sum(marks_vals) / len(marks_vals), 1) if marks_vals else 0.0
        avg_att = round(sum(att_vals) / len(att_vals), 1) if att_vals else 0.0

        at_risk_count = 0
        low_att = 0
        poor_perf = 0
        attention: list[AttentionStudent] = []

        for r in rows:
            score, _, _, _, _ = self._analyze_row(r)
            if is_at_risk(score):
                at_risk_count += 1
                attention.append(self._row_to_attention(r))
            if r.attendance_pct < t.ATTENDANCE_FAIR_MIN:
                low_att += 1
            if r.marks_pct < t.AVERAGE_MIN:
                poor_perf += 1

        attention.sort(key=lambda x: (-x.risk_score, x.marks, x.attendance))
        attention = attention[:10]

        from app.models.student import Student
        from app.models.section import Section
        from app.models.subject import Subject
        from app.models.enrollment import Enrollment
        from app.models.teacher_subject_section import TeacherSubjectSection

        # Calculate exact entity counts matching the filters for the Dashboard KPIs
        # This fixes the bug where newly created sections/students showed 0 because they had no assignments yet.
        
        # Students count
        sq = self.repo.db.query(Student)
        if section_id: sq = sq.filter(Student.section_id == section_id)
        if semester: sq = sq.filter(Student.semester == semester)
        if academic_year: sq = sq.filter(Student.academic_year == academic_year)
        if subject_id: sq = sq.join(Enrollment).filter(Enrollment.subject_id == subject_id)
        
        # Sections count
        sec_q = self.repo.db.query(Section)
        if section_id: sec_q = sec_q.filter(Section.id == section_id)
        if semester: sec_q = sec_q.filter(Section.semester == semester)
        if academic_year: sec_q = sec_q.filter(Section.academic_year == academic_year)

        # Subjects count
        sub_q = self.repo.db.query(Subject)
        if subject_id: sub_q = sub_q.filter(Subject.id == subject_id)
        if semester: sub_q = sub_q.filter(Subject.semester == semester)
        if section_id or academic_year:
            # If section or academic year is specified, we must join assignments to see what subjects are taught there
            sub_q = sub_q.join(TeacherSubjectSection, TeacherSubjectSection.subject_id == Subject.id)
            if section_id: sub_q = sub_q.filter(TeacherSubjectSection.section_id == section_id)
            if academic_year: sub_q = sub_q.filter(TeacherSubjectSection.academic_year == academic_year)

        stats = DashboardStats(
            total_students=sq.count(),
            sections=sec_q.count(),
            subjects=sub_q.count(),
            average_marks=avg_marks,
            average_attendance=avg_att,
            students_at_risk=at_risk_count,
            low_attendance=low_att,
            poor_performance=poor_perf,
        )

        return DashboardResponse(
            filters=DashboardFilters(
                subject_id=subject_id,
                section_id=section_id,
                semester=semester,
                academic_year=academic_year,
            ),
            stats=stats,
            performance_distribution=self._performance_distribution(rows),
            attendance_distribution=self._attendance_distribution(rows),
            marks_distribution=self._marks_distribution(rows),
            marks_vs_attendance=self._scatter(rows),
            section_comparison=self._section_comparison(rows),
            subject_comparison=self._subject_comparison(rows),
            students_needing_attention=attention,
        )

    @staticmethod
    def _performance_distribution(rows) -> list[ChartDataPoint]:
        buckets = {"Excellent": 0, "Good": 0, "Average": 0, "Poor": 0}
        for r in rows:
            if r.marks_pct >= t.EXCELLENT_MIN:
                buckets["Excellent"] += 1
            elif r.marks_pct >= t.GOOD_MIN:
                buckets["Good"] += 1
            elif r.marks_pct >= t.AVERAGE_MIN:
                buckets["Average"] += 1
            else:
                buckets["Poor"] += 1
        return [ChartDataPoint(name=k, value=v) for k, v in buckets.items()]

    @staticmethod
    def _attendance_distribution(rows) -> list[ChartDataPoint]:
        buckets = {"Above 85%": 0, "75–85%": 0, "60–75%": 0, "Below 60%": 0}
        for r in rows:
            p = r.attendance_pct
            if p >= t.ATTENDANCE_GOOD_MIN:
                buckets["Above 85%"] += 1
            elif p >= t.ATTENDANCE_FAIR_MIN:
                buckets["75–85%"] += 1
            elif p >= t.ATTENDANCE_WARNING_MIN:
                buckets["60–75%"] += 1
            else:
                buckets["Below 60%"] += 1
        return [ChartDataPoint(name=k, value=v) for k, v in buckets.items()]

    @staticmethod
    def _marks_distribution(rows) -> list[ChartDataPoint]:
        buckets = [
            ("0–40", 0, 40),
            ("40–50", 40, 50),
            ("50–60", 50, 60),
            ("60–70", 60, 70),
            ("70–80", 70, 80),
            ("80–90", 80, 90),
            ("90–100", 90, 101),
        ]
        result = []
        for label, lo, hi in buckets:
            count = sum(1 for r in rows if lo <= r.marks_pct < hi)
            result.append(ChartDataPoint(name=label, value=count))
        return result

    @staticmethod
    def _scatter(rows) -> list[ScatterPoint]:
        return [
            ScatterPoint(
                student_id=r.student_id,
                name=r.student_name,
                section=r.section_name,
                attendance=r.attendance_pct,
                marks=r.marks_pct,
            )
            for r in rows
        ]

    @classmethod
    def _section_comparison(cls, rows) -> list[SectionComparison]:
        sections: dict[int, dict] = {}
        for r in rows:
            if r.section_id not in sections:
                sections[r.section_id] = {
                    "name": r.section_name,
                    "marks": [],
                    "att": [],
                    "at_risk": 0,
                    "students": set(),
                }
            s = sections[r.section_id]
            s["marks"].append(r.marks_pct)
            s["att"].append(r.attendance_pct)
            s["students"].add(r.student_id)
            score, _, _, _, _ = cls._analyze_row(r)
            if is_at_risk(score):
                s["at_risk"] += 1

        return [
            SectionComparison(
                section_id=sid,
                section_name=data["name"],
                students=len(data["students"]),
                avg_marks=round(sum(data["marks"]) / len(data["marks"]), 1) if data["marks"] else 0,
                avg_attendance=round(sum(data["att"]) / len(data["att"]), 1) if data["att"] else 0,
                at_risk=data["at_risk"],
            )
            for sid, data in sorted(sections.items(), key=lambda x: x[1]["name"])
        ]

    @classmethod
    def _subject_comparison(cls, rows) -> list[SubjectComparison]:
        subjects: dict[int, dict] = {}
        for r in rows:
            if r.subject_id not in subjects:
                subjects[r.subject_id] = {
                    "name": r.subject_name,
                    "marks": [],
                    "att": [],
                    "at_risk": 0,
                    "students": set(),
                }
            s = subjects[r.subject_id]
            s["marks"].append(r.marks_pct)
            s["att"].append(r.attendance_pct)
            s["students"].add(r.student_id)
            score, _, _, _, _ = cls._analyze_row(r)
            if is_at_risk(score):
                s["at_risk"] += 1

        return [
            SubjectComparison(
                subject_id=sid,
                subject_name=data["name"],
                students=len(data["students"]),
                avg_marks=round(sum(data["marks"]) / len(data["marks"]), 1) if data["marks"] else 0,
                avg_attendance=round(sum(data["att"]) / len(data["att"]), 1) if data["att"] else 0,
                at_risk=data["at_risk"],
            )
            for sid, data in sorted(subjects.items(), key=lambda x: x[1]["name"])
        ]

    def get_at_risk_students(
        self,
        teacher_id: int,
        subject_id: Optional[int] = None,
        section_id: Optional[int] = None,
        semester: Optional[int] = None,
        academic_year: Optional[str] = None,
    ) -> list[AttentionStudent]:
        rows = self.repo.get_teacher_rows(teacher_id, subject_id, section_id, semester, academic_year)
        attention = []
        for r in rows:
            score, _, _, _, _ = self._analyze_row(r)
            if is_at_risk(score):
                attention.append(self._row_to_attention(r))
        attention.sort(key=lambda x: (-x.risk_score, x.marks, x.attendance))
        return attention

    def get_student_analytics(
        self,
        teacher_id: int,
        student_id: int,
        subject_id: Optional[int] = None,
        academic_year: Optional[str] = None,
    ) -> StudentAnalyticsResponse:
        rows = self.repo.get_teacher_rows(teacher_id, subject_id=subject_id, academic_year=academic_year)
        student_rows = [r for r in rows if r.student_id == student_id]

        if not student_rows:
            raise HTTPException(status_code=404, detail="Student analytics not found")

        first = student_rows[0]
        subjects = [self._row_to_subject_performance(r) for r in student_rows]

        return StudentAnalyticsResponse(
            student_id=first.student_id,
            name=first.student_name,
            roll_number=first.roll_number,
            section_name=first.section_name,
            semester=first.semester,
            academic_year=first.academic_year,
            subjects=subjects,
        )
