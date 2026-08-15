from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_teacher
from app.db.session import get_db
from app.models.teacher import Teacher
from app.schemas.marks import (
    AssessmentConfig,
    BulkMarksSaveRequest,
    BulkMarksSaveResponse,
    MarkRecordResponse,
    MarkRecordUpdate,
    MarksSheetResponse,
)
from app.services.marks_service import MarksService

router = APIRouter(prefix="/marks", tags=["Marks"])


@router.get("/config", response_model=AssessmentConfig)
def get_marks_config(
    db: Session = Depends(get_db),
    _: Teacher = Depends(get_current_teacher),
):
    return MarksService(db).get_config()


@router.get("/sheet", response_model=MarksSheetResponse)
def get_marks_sheet(
    subject_id: int = Query(...),
    section_id: int = Query(...),
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher),
):
    return MarksService(db).get_marks_sheet(teacher.id, subject_id, section_id)


@router.post("/bulk", response_model=BulkMarksSaveResponse)
def bulk_save_marks(
    data: BulkMarksSaveRequest,
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher),
):
    return MarksService(db).bulk_save(teacher.id, data)


@router.put("/{record_id}", response_model=MarkRecordResponse)
def update_mark_record(
    record_id: int,
    data: MarkRecordUpdate,
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher),
):
    return MarksService(db).update_record(teacher.id, record_id, data)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_mark_record(
    record_id: int,
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher),
):
    MarksService(db).delete_record(teacher.id, record_id)
