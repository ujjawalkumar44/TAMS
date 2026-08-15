from pydantic import BaseModel


class ChartDataPoint(BaseModel):
    name: str
    value: int


class ScatterPoint(BaseModel):
    student_id: int
    name: str
    section: str
    attendance: float
    marks: float


class DashboardStats(BaseModel):
    total_students: int
    sections: int
    subjects: int
    average_marks: float
    average_attendance: float
    students_at_risk: int
    low_attendance: int
    poor_performance: int


class SectionComparison(BaseModel):
    section_id: int
    section_name: str
    students: int
    avg_marks: float
    avg_attendance: float
    at_risk: int


class SubjectComparison(BaseModel):
    subject_id: int
    subject_name: str
    students: int
    avg_marks: float
    avg_attendance: float
    at_risk: int


class AttentionStudent(BaseModel):
    student_id: int
    name: str
    roll_number: str
    section: str
    subject: str
    marks: float
    attendance: float
    risk_level: str
    risk_score: int = 0
    main_reason: str
    reasons: list[str] = []
    recommended_actions: list[str] = []
    performance_trend: str = "Stable"


class TrendPoint(BaseModel):
    assessment: str
    percentage: float


class SubjectPerformance(BaseModel):
    subject_id: int
    subject_name: str
    section_name: str
    assignment_marks: float
    quiz_marks: float
    internal_marks: float
    midterm_marks: float
    endterm_marks: float
    total_marks: float
    percentage: float
    total_classes: int
    classes_attended: int
    classes_absent: int
    attendance_percentage: float
    performance_trend: str
    trend_data: list[TrendPoint]
    risk_score: int
    risk_level: str
    reasons: list[str]
    recommended_actions: list[str]


class StudentAnalyticsResponse(BaseModel):
    student_id: int
    name: str
    roll_number: str
    section_name: str
    semester: int
    academic_year: str
    subjects: list[SubjectPerformance]


class DashboardFilters(BaseModel):
    subject_id: int | None = None
    section_id: int | None = None
    semester: int | None = None
    academic_year: str | None = None


class DashboardResponse(BaseModel):
    filters: DashboardFilters
    stats: DashboardStats
    performance_distribution: list[ChartDataPoint]
    attendance_distribution: list[ChartDataPoint]
    marks_distribution: list[ChartDataPoint]
    marks_vs_attendance: list[ScatterPoint]
    section_comparison: list[SectionComparison]
    subject_comparison: list[SubjectComparison]
    students_needing_attention: list[AttentionStudent]
