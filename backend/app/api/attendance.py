from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_teacher
from app.db.session import get_db
from app.models.teacher import Teacher
from app.schemas.attendance import (
    AttendanceSheetResponse,
    AttendanceSummaryResponse,
    AttendanceThresholds,
    BulkAttendanceSaveRequest,
    BulkAttendanceSaveResponse,
)
from app.services.attendance_service import AttendanceService

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.get("/config", response_model=AttendanceThresholds)
def get_attendance_config(
    db: Session = Depends(get_db),
    _: Teacher = Depends(get_current_teacher),
):
    return AttendanceService(db).get_thresholds()


@router.get("/sheet", response_model=AttendanceSheetResponse)
def get_attendance_sheet(
    subject_id: int = Query(...),
    section_id: int = Query(...),
    date: date = Query(..., alias="date"),
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher),
):
    return AttendanceService(db).get_attendance_sheet(teacher.id, subject_id, section_id, date)


@router.post("/bulk", response_model=BulkAttendanceSaveResponse)
def bulk_save_attendance(
    data: BulkAttendanceSaveRequest,
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher),
):
    return AttendanceService(db).bulk_save(teacher.id, data)


@router.get("/summary", response_model=list[AttendanceSummaryResponse])
def get_attendance_summary(
    subject_id: int = Query(...),
    section_id: int = Query(...),
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher),
):
    return AttendanceService(db).get_summary_list(teacher.id, subject_id, section_id)
