from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

AttendanceStatus = Literal["present", "absent"]
AlertLevel = Literal["none", "warning", "critical"]


class AttendanceThresholds(BaseModel):
    warning_below: float = 75
    critical_below: float = 60


class AttendanceEntryResponse(BaseModel):
    student_id: int
    roll_number: str
    name: str
    session_id: Optional[int] = None
    date_status: Optional[AttendanceStatus] = None
    total_classes: int = 0
    classes_attended: int = 0
    classes_absent: int = 0
    attendance_percentage: float = 0
    alert_level: AlertLevel = "none"
    alert_label: Optional[str] = None


class AttendanceSheetResponse(BaseModel):
    subject_id: int
    section_id: int
    subject_name: str
    section_name: str
    date: date
    thresholds: AttendanceThresholds
    entries: list[AttendanceEntryResponse]


class BulkAttendanceEntry(BaseModel):
    student_id: int
    status: AttendanceStatus


class BulkAttendanceSaveRequest(BaseModel):
    subject_id: int
    section_id: int
    date: date
    entries: list[BulkAttendanceEntry] = Field(..., min_length=1)


class BulkAttendanceSaveResponse(BaseModel):
    saved: int
    message: str


class AttendanceSummaryResponse(BaseModel):
    student_id: int
    roll_number: str
    name: str
    total_classes: int
    classes_attended: int
    classes_absent: int
    attendance_percentage: float
    alert_level: AlertLevel
    alert_label: Optional[str] = None
