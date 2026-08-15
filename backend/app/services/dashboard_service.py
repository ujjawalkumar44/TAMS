from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.student import Student
from app.repositories.attendance_repo import AttendanceRepository
from app.repositories.marks_repo import MarksRepository
from app.repositories.student_repo import StudentRepository
from app.schemas.dashboard import (
    ChartDataPoint,
    DashboardResponse,
    DashboardStats,
    RecentStudent,
)


class DashboardService:
    def __init__(self, db: Session):
        self.db = db
        self.student_repo = StudentRepository(db)
        self.attendance_repo = AttendanceRepository(db)
        self.marks_repo = MarksRepository(db)

    def get_dashboard_data(self) -> DashboardResponse:
        stats = DashboardStats(
            total_students=self.student_repo.count_all(),
            active_students=self.student_repo.count_active(),
            departments=self.student_repo.count_departments(),
            average_attendance=self.attendance_repo.get_average_attendance(),
            average_marks=self.marks_repo.get_average_marks(),
        )

        dept_data = (
            self.db.query(Student.department, func.count(Student.id))
            .group_by(Student.department)
            .all()
        )
        students_by_department = [
            ChartDataPoint(name=dept, value=count) for dept, count in dept_data
        ]

        sem_data = (
            self.db.query(Student.semester, func.count(Student.id))
            .group_by(Student.semester)
            .order_by(Student.semester)
            .all()
        )
        students_by_semester = [
            ChartDataPoint(name=f"Sem {sem}", value=count) for sem, count in sem_data
        ]

        gender_data = (
            self.db.query(Student.gender, func.count(Student.id))
            .group_by(Student.gender)
            .all()
        )
        gender_distribution = [
            ChartDataPoint(name=gender, value=count) for gender, count in gender_data
        ]

        attendance_overview = [
            ChartDataPoint(name=item["name"], value=item["value"])
            for item in self.attendance_repo.get_overview_stats()
        ]

        recent = self.student_repo.get_recent(5)
        recent_students = [
            RecentStudent(
                id=s.id,
                roll_number=s.roll_number,
                full_name=s.full_name,
                department=s.department,
                course=s.course,
                created_at=s.created_at.isoformat() if s.created_at else "",
            )
            for s in recent
        ]

        return DashboardResponse(
            stats=stats,
            students_by_department=students_by_department,
            students_by_semester=students_by_semester,
            gender_distribution=gender_distribution,
            attendance_overview=attendance_overview,
            recent_students=recent_students,
        )
