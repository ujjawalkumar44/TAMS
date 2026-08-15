from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.teacher_subject_section import TeacherSubjectSection
from app.repositories.section_repo import SectionRepository
from app.repositories.student_repo import AssignmentRepository, EnrollmentRepository
from app.repositories.subject_repo import SubjectRepository
from app.schemas.assignment import AssignmentCreate, AssignmentResponse
from app.schemas.section import SectionCreate, SectionResponse, SectionUpdate
from app.schemas.subject import SubjectCreate, SubjectResponse, SubjectUpdate


class SectionService:
    def __init__(self, db: Session):
        self.repo = SectionRepository(db)

    def list_sections(self, semester: int | None = None, academic_year: str | None = None):
        return [SectionResponse.model_validate(s) for s in self.repo.list_all(semester, academic_year)]

    def create_section(self, data: SectionCreate) -> SectionResponse:
        if self.repo.get_by_name(data.name):
            raise HTTPException(status_code=409, detail=f"Section '{data.name}' already exists")
        return SectionResponse.model_validate(self.repo.create(data))

    def update_section(self, section_id: int, data: SectionUpdate) -> SectionResponse:
        section = self.repo.get_by_id(section_id)
        if not section:
            raise HTTPException(status_code=404, detail="Section not found")
        return SectionResponse.model_validate(self.repo.update(section, data))

    def delete_section(self, section_id: int) -> None:
        section = self.repo.get_by_id(section_id)
        if not section:
            raise HTTPException(status_code=404, detail="Section not found")
        self.repo.delete(section)


class SubjectService:
    def __init__(self, db: Session):
        self.repo = SubjectRepository(db)

    def list_subjects(self, semester: int | None = None, branch: str | None = None):
        return [SubjectResponse.model_validate(s) for s in self.repo.list_all(semester, branch)]

    def create_subject(self, data: SubjectCreate) -> SubjectResponse:
        if self.repo.get_by_code(data.subject_code):
            raise HTTPException(status_code=409, detail=f"Subject code '{data.subject_code}' already exists")
        return SubjectResponse.model_validate(self.repo.create(data))

    def update_subject(self, subject_id: int, data: SubjectUpdate) -> SubjectResponse:
        subject = self.repo.get_by_id(subject_id)
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
        return SubjectResponse.model_validate(self.repo.update(subject, data))

    def delete_subject(self, subject_id: int) -> None:
        subject = self.repo.get_by_id(subject_id)
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
        self.repo.delete(subject)


class AssignmentService:
    def __init__(self, db: Session):
        self.repo = AssignmentRepository(db)
        self.enrollment_repo = EnrollmentRepository(db)
        self.section_repo = SectionRepository(db)
        self.subject_repo = SubjectRepository(db)
        self.db = db

    def list_assignments(self, teacher_id: int) -> list[AssignmentResponse]:
        assignments = self.repo.list_by_teacher(teacher_id)
        result = []
        for a in assignments:
            subject = self.subject_repo.get_by_id(a.subject_id)
            section = self.section_repo.get_by_id(a.section_id)
            result.append(
                AssignmentResponse(
                    id=a.id,
                    teacher_id=a.teacher_id,
                    subject_id=a.subject_id,
                    section_id=a.section_id,
                    academic_year=a.academic_year,
                    semester=a.semester,
                    subject_name=subject.subject_name if subject else None,
                    subject_code=subject.subject_code if subject else None,
                    section_name=section.name if section else None,
                )
            )
        return result

    def create_assignment(self, teacher_id: int, data: AssignmentCreate) -> AssignmentResponse:
        if self.repo.get_existing(teacher_id, data.subject_id, data.section_id, data.academic_year):
            raise HTTPException(status_code=409, detail="This subject-section assignment already exists")

        assignment = TeacherSubjectSection(
            teacher_id=teacher_id,
            subject_id=data.subject_id,
            section_id=data.section_id,
            academic_year=data.academic_year,
            semester=data.semester,
        )
        created = self.repo.create(assignment)
        enrolled = self.enrollment_repo.enroll_section_students(
            data.section_id, data.subject_id, data.academic_year
        )

        subject = self.subject_repo.get_by_id(data.subject_id)
        section = self.section_repo.get_by_id(data.section_id)
        return AssignmentResponse(
            id=created.id,
            teacher_id=created.teacher_id,
            subject_id=created.subject_id,
            section_id=created.section_id,
            academic_year=created.academic_year,
            semester=created.semester,
            subject_name=subject.subject_name if subject else None,
            subject_code=subject.subject_code if subject else None,
            section_name=section.name if section else None,
        )
