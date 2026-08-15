from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_teacher
from app.db.session import get_db
from app.models.teacher import Teacher
from app.services.reports_service import ReportsService

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/preview")
def preview_report(
    report_type: str = Query(...),
    subject_id: Optional[int] = Query(None),
    section_id: Optional[int] = Query(None),
    semester: Optional[int] = Query(None),
    academic_year: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher),
):
    count = ReportsService(db).get_preview_count(
        teacher.id, report_type, subject_id, section_id, semester, academic_year
    )
    return {"report_type": report_type, "count": count}


@router.get("/{report_type}/export")
def export_report(
    report_type: str,
    format: str = Query("csv", pattern="^(csv|xlsx)$"),
    subject_id: Optional[int] = Query(None),
    section_id: Optional[int] = Query(None),
    semester: Optional[int] = Query(None),
    academic_year: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher),
):
    return ReportsService(db).export_report(
        teacher.id,
        report_type,
        format,
        subject_id,
        section_id,
        semester,
        academic_year,
    )
