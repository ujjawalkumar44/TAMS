from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_students: int
    active_students: int
    departments: int
    average_attendance: float
    average_marks: float


class ChartDataPoint(BaseModel):
    name: str
    value: int


class RecentStudent(BaseModel):
    id: int
    roll_number: str
    full_name: str
    department: str
    course: str
    created_at: str


class DashboardResponse(BaseModel):
    stats: DashboardStats
    students_by_department: list[ChartDataPoint]
    students_by_semester: list[ChartDataPoint]
    gender_distribution: list[ChartDataPoint]
    attendance_overview: list[ChartDataPoint]
    recent_students: list[RecentStudent]
