from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.enrollment import Enrollment
from app.models.student import Student
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
        if self.repo.get_by_details(data.name, data.semester, data.academic_year, data.branch):
            raise HTTPException(
                status_code=409,
                detail=f"Section '{data.name}' already exists for Semester {data.semester} ({data.academic_year})"
            )
        return SectionResponse.model_validate(self.repo.create(data))

    def update_section(self, section_id: int, data: SectionUpdate) -> SectionResponse:
        section = self.repo.get_by_id(section_id)
        if not section:
            raise HTTPException(status_code=404, detail="Section not found")
        
        target_name = data.name if data.name is not None else section.name
        target_sem = data.semester if data.semester is not None else section.semester
        target_ay = data.academic_year if data.academic_year is not None else section.academic_year
        target_branch = data.branch if data.branch is not None else section.branch

        existing = self.repo.get_by_details(target_name, target_sem, target_ay, target_branch, exclude_id=section_id)
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"Section '{target_name}' already exists for Semester {target_sem} ({target_ay})"
            )

        sem_changed = data.semester is not None and data.semester != section.semester
        ay_changed = data.academic_year is not None and data.academic_year != section.academic_year

        updated = self.repo.update(section, data)

        if sem_changed or ay_changed:
            self.repo.db.query(Student).filter(Student.section_id == section_id).update({
                "semester": updated.semester,
                "academic_year": updated.academic_year
            })
            self.repo.db.query(Enrollment).filter(Enrollment.section_id == section_id).update({
                "academic_year": updated.academic_year
            })
            self.repo.db.query(TeacherSubjectSection).filter(TeacherSubjectSection.section_id == section_id).update({
                "semester": updated.semester,
                "academic_year": updated.academic_year
            })
            self.repo.db.commit()

        return SectionResponse.model_validate(updated)

    def delete_section(self, section_id: int) -> None:
        section = self.repo.get_by_id(section_id)
        if not section:
            raise HTTPException(status_code=404, detail="Section not found")
        
        student_count = self.repo.db.query(Student).filter(Student.section_id == section_id).count()
        if student_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete section '{section.name}' because it contains {student_count} student(s)."
            )
        
        assignment_count = self.repo.db.query(TeacherSubjectSection).filter(TeacherSubjectSection.section_id == section_id).count()
        if assignment_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete section '{section.name}' because it has active subject assignments."
            )

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
        
        enrollment_count = self.repo.db.query(Enrollment).filter(Enrollment.subject_id == subject_id).count()
        if enrollment_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete subject '{subject.subject_name}' because students are enrolled in it."
            )

        assignment_count = self.repo.db.query(TeacherSubjectSection).filter(TeacherSubjectSection.subject_id == subject_id).count()
        if assignment_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete subject '{subject.subject_name}' because it has active teacher assignments."
            )

        self.repo.delete(subject)


class AssignmentService:
    def __init__(self, db: Session):
        self.repo = AssignmentRepository(db)
        self.enrollment_repo = EnrollmentRepository(db)
        self.section_repo = SectionRepository(db)
        self.subject_repo = SubjectRepository(db)
        self.db = db

    def list_assignments(self, teacher_id: int, academic_year: str | None = None) -> list[AssignmentResponse]:
        assignments = self.repo.list_by_teacher(teacher_id, academic_year)
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
