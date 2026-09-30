from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_teacher
from app.db.session import get_db
from app.models.teacher import Teacher
from app.schemas.analytics import AttentionStudent, DashboardResponse, StudentAnalyticsResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/filters/options")
def get_filter_options(
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher),
):
    return AnalyticsService(db).get_filter_options(teacher.id)


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    subject_id: Optional[int] = Query(None),
    section_id: Optional[int] = Query(None),
    semester: Optional[int] = Query(None),
    academic_year: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher),
):
    return AnalyticsService(db).get_dashboard(
        teacher.id, subject_id, section_id, semester, academic_year
    )


@router.get("/at-risk", response_model=list[AttentionStudent])
def get_at_risk_students(
    subject_id: Optional[int] = Query(None),
    section_id: Optional[int] = Query(None),
    semester: Optional[int] = Query(None),
    academic_year: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher),
):
    return AnalyticsService(db).get_at_risk_students(
        teacher.id, subject_id, section_id, semester, academic_year
    )


@router.get("/student/{student_id}", response_model=StudentAnalyticsResponse)
def get_student_analytics(
    student_id: int,
    subject_id: Optional[int] = Query(None),
    academic_year: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher),
):
    return AnalyticsService(db).get_student_analytics(teacher.id, student_id, subject_id, academic_year)
