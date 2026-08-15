from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.marks import MarkRecord
from app.repositories.marks_repo import ASSESSMENT_FIELD_MAP, MarksRepository, get_max_marks_config
from app.repositories.section_repo import SectionRepository
from app.repositories.student_repo import AssignmentRepository
from app.repositories.subject_repo import SubjectRepository
from app.schemas.marks import (
    AssessmentConfig,
    BulkMarksSaveRequest,
    BulkMarksSaveResponse,
    MarkEntryResponse,
    MarkRecordResponse,
    MarkRecordUpdate,
    MarksSheetResponse,
)


class MarksService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = MarksRepository(db)
        self.subject_repo = SubjectRepository(db)
        self.section_repo = SectionRepository(db)
        self.assignment_repo = AssignmentRepository(db)

    def _verify_teacher_assignment(self, teacher_id: int, subject_id: int, section_id: int):
        assignments = self.assignment_repo.list_by_teacher(teacher_id)
        if not any(a.subject_id == subject_id and a.section_id == section_id for a in assignments):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not assigned to teach this subject in this section",
            )

    def _validate_marks(self, field: str, value: float):
        if field not in ASSESSMENT_FIELD_MAP:
            raise HTTPException(status_code=400, detail=f"Invalid assessment type: {field}")
        _, max_val = ASSESSMENT_FIELD_MAP[field]
        if value > max_val:
            raise HTTPException(
                status_code=400,
                detail=f"{field.replace('_marks', '').title()} marks cannot exceed {max_val}",
            )

    def get_config(self) -> AssessmentConfig:
        return AssessmentConfig(**get_max_marks_config())

    def get_marks_sheet(self, teacher_id: int, subject_id: int, section_id: int) -> MarksSheetResponse:
        subject = self.subject_repo.get_by_id(subject_id)
        section = self.section_repo.get_by_id(section_id)
        if not subject or not section:
            raise HTTPException(status_code=404, detail="Subject or section not found")

        self._verify_teacher_assignment(teacher_id, subject_id, section_id)
        students = self.repo.get_enrolled_students(subject_id, section_id)

        entries = []
        for student in students:
            record = self.repo.get_record(student.id, subject_id, section_id)
            entries.append(
                MarkEntryResponse(
                    student_id=student.id,
                    roll_number=student.roll_number,
                    name=student.name,
                    mark_record_id=record.id if record else None,
                    assignment_marks=record.assignment_marks if record else 0,
                    quiz_marks=record.quiz_marks if record else 0,
                    internal_marks=record.internal_marks if record else 0,
                    midterm_marks=record.midterm_marks if record else 0,
                    endterm_marks=record.endterm_marks if record else 0,
                    total_marks=record.total_marks if record else 0,
                    percentage=record.percentage if record else 0,
                )
            )

        return MarksSheetResponse(
            subject_id=subject_id,
            section_id=section_id,
            subject_name=subject.subject_name,
            section_name=section.name,
            max_marks=self.get_config(),
            entries=entries,
        )

    def bulk_save(self, teacher_id: int, data: BulkMarksSaveRequest) -> BulkMarksSaveResponse:
        self._verify_teacher_assignment(teacher_id, data.subject_id, data.section_id)
        saved = 0

        for entry in data.entries:
            existing = self.repo.get_record(entry.student_id, data.subject_id, data.section_id)

            if data.assessment_type:
                field_name, max_val = ASSESSMENT_FIELD_MAP[data.assessment_type]
                if entry.marks is None:
                    raise HTTPException(status_code=400, detail="marks field required for single assessment update")
                if entry.marks > max_val:
                    raise HTTPException(
                        status_code=400,
                        detail=f"{data.assessment_type.title()} marks cannot exceed {max_val}",
                    )

                assignment = existing.assignment_marks if existing else 0
                quiz = existing.quiz_marks if existing else 0
                internal = existing.internal_marks if existing else 0
                midterm = existing.midterm_marks if existing else 0
                endterm = existing.endterm_marks if existing else 0

                if field_name == "assignment_marks":
                    assignment = entry.marks
                elif field_name == "quiz_marks":
                    quiz = entry.marks
                elif field_name == "internal_marks":
                    internal = entry.marks
                elif field_name == "midterm_marks":
                    midterm = entry.marks
                elif field_name == "endterm_marks":
                    endterm = entry.marks
            else:
                assignment = entry.assignment_marks if entry.assignment_marks is not None else (existing.assignment_marks if existing else 0)
                quiz = entry.quiz_marks if entry.quiz_marks is not None else (existing.quiz_marks if existing else 0)
                internal = entry.internal_marks if entry.internal_marks is not None else (existing.internal_marks if existing else 0)
                midterm = entry.midterm_marks if entry.midterm_marks is not None else (existing.midterm_marks if existing else 0)
                endterm = entry.endterm_marks if entry.endterm_marks is not None else (existing.endterm_marks if existing else 0)

                for fname, val in [
                    ("assignment_marks", assignment),
                    ("quiz_marks", quiz),
                    ("internal_marks", internal),
                    ("midterm_marks", midterm),
                    ("endterm_marks", endterm),
                ]:
                    self._validate_marks(fname, val)

            self.repo.upsert_record(
                student_id=entry.student_id,
                subject_id=data.subject_id,
                section_id=data.section_id,
                teacher_id=teacher_id,
                assignment=assignment,
                quiz=quiz,
                internal=internal,
                midterm=midterm,
                endterm=endterm,
            )
            saved += 1

        label = data.assessment_type or "all assessments"
        return BulkMarksSaveResponse(saved=saved, message=f"Saved {saved} student mark records ({label})")

    def update_record(self, teacher_id: int, record_id: int, data: MarkRecordUpdate) -> MarkRecordResponse:
        record = self.repo.get_by_id(record_id)
        if not record:
            raise HTTPException(status_code=404, detail="Mark record not found")

        self._verify_teacher_assignment(teacher_id, record.subject_id, record.section_id)

        assignment = data.assignment_marks if data.assignment_marks is not None else record.assignment_marks
        quiz = data.quiz_marks if data.quiz_marks is not None else record.quiz_marks
        internal = data.internal_marks if data.internal_marks is not None else record.internal_marks
        midterm = data.midterm_marks if data.midterm_marks is not None else record.midterm_marks
        endterm = data.endterm_marks if data.endterm_marks is not None else record.endterm_marks

        for fname, val in [
            ("assignment_marks", assignment),
            ("quiz_marks", quiz),
            ("internal_marks", internal),
            ("midterm_marks", midterm),
            ("endterm_marks", endterm),
        ]:
            self._validate_marks(fname, val)

        updated = self.repo.upsert_record(
            student_id=record.student_id,
            subject_id=record.subject_id,
            section_id=record.section_id,
            teacher_id=teacher_id,
            assignment=assignment,
            quiz=quiz,
            internal=internal,
            midterm=midterm,
            endterm=endterm,
        )
        return MarkRecordResponse.model_validate(updated)

    def delete_record(self, teacher_id: int, record_id: int) -> None:
        record = self.repo.get_by_id(record_id)
        if not record:
            raise HTTPException(status_code=404, detail="Mark record not found")
        self._verify_teacher_assignment(teacher_id, record.subject_id, record.section_id)
        self.repo.delete(record)
