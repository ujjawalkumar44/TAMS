from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.section_repo import SectionRepository
from app.repositories.student_repo import EnrollmentRepository, StudentRepository
from app.schemas.student import (
    StudentCreate,
    StudentListResponse,
    StudentResponse,
    StudentUpdate,
)


def _to_response(student) -> StudentResponse:
    return StudentResponse(
        id=student.id,
        roll_number=student.roll_number,
        registration_number=student.registration_number,
        name=student.name,
        email=student.email,
        phone=student.phone,
        gender=student.gender,
        section_id=student.section_id,
        semester=student.semester,
        academic_year=student.academic_year,
        section_name=student.section.name if student.section else None,
        created_at=student.created_at,
        updated_at=student.updated_at,
    )


class StudentService:
    def __init__(self, db: Session):
        self.repo = StudentRepository(db)
        self.section_repo = SectionRepository(db)
        self.enrollment_repo = EnrollmentRepository(db)

    def _validate_uniqueness(self, data: StudentCreate | StudentUpdate, exclude_id: int | None = None):
        checks = []
        if isinstance(data, StudentCreate):
            checks = [
                ("roll_number", data.roll_number, self.repo.get_by_roll),
                ("registration_number", data.registration_number, self.repo.get_by_registration),
                ("email", str(data.email), self.repo.get_by_email),
            ]
        else:
            if data.roll_number:
                checks.append(("roll_number", data.roll_number, self.repo.get_by_roll))
            if data.registration_number:
                checks.append(("registration_number", data.registration_number, self.repo.get_by_registration))
            if data.email:
                checks.append(("email", str(data.email), self.repo.get_by_email))

        for field_name, value, fn in checks:
            existing = fn(value, exclude_id)
            if existing:
                raise HTTPException(
                    status_code=409,
                    detail=f"Student with this {field_name.replace('_', ' ')} already exists",
                )

    def list_students(self, **kwargs) -> StudentListResponse:
        page = kwargs.pop("page", 1)
        page_size = kwargs.pop("page_size", 10)
        students, total = self.repo.list_students(page=page, page_size=page_size, **kwargs)
        return StudentListResponse(
            items=[_to_response(s) for s in students],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=self.repo.total_pages(total, page_size),
        )

    def get_student(self, student_id: int) -> StudentResponse:
        student = self.repo.get_by_id(student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        return _to_response(student)

    def create_student(self, data: StudentCreate) -> StudentResponse:
        section = self.section_repo.get_by_id(data.section_id)
        if not section:
            raise HTTPException(status_code=400, detail="Invalid section_id")
        
        # Override student semester and academic_year to match chosen section
        data.semester = section.semester
        data.academic_year = section.academic_year

        self._validate_uniqueness(data)

        payload = data.model_dump()
        payload["semester"] = section.semester
        payload["academic_year"] = section.academic_year
        print("DEBUG PAYLOAD:", payload)

        student = self.repo.create(payload)
        self.enrollment_repo.enroll_student_in_section_subjects(
            student.id, data.section_id, data.academic_year
        )
        student = self.repo.get_by_id(student.id)
        return _to_response(student)

    def update_student(self, student_id: int, data: StudentUpdate) -> StudentResponse:
        student = self.repo.get_by_id(student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        target_section_id = data.section_id if data.section_id is not None else student.section_id
        section = self.section_repo.get_by_id(target_section_id)
        if not section:
            raise HTTPException(status_code=400, detail="Invalid section_id")
        
        # Sync semester and academic_year with section
        data.semester = section.semester
        data.academic_year = section.academic_year

        self._validate_uniqueness(data, exclude_id=student_id)
        old_section = student.section_id
        updated = self.repo.update(student, data)
        if data.section_id and data.section_id != old_section:
            self.enrollment_repo.enroll_student_in_section_subjects(
                updated.id, updated.section_id, updated.academic_year
            )
        updated = self.repo.get_by_id(updated.id)
        return _to_response(updated)

    def delete_student(self, student_id: int) -> None:
        student = self.repo.get_by_id(student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        self.repo.delete(student)

    def get_filter_options(self) -> dict:
        sections = self.section_repo.list_all()
        return {
            "sections": [
                {
                    "id": s.id,
                    "name": s.name,
                    "semester": s.semester,
                    "academic_year": s.academic_year,
                    "branch": s.branch,
                }
                for s in sections
            ],
            "semesters": sorted({s.semester for s in sections}),
            "academic_years": sorted({s.academic_year for s in sections}, reverse=True),
        }
