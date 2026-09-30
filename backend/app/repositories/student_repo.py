import math
from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.models.enrollment import Enrollment
from app.models.section import Section
from app.models.student import Student
from app.models.subject import Subject
from app.models.teacher_subject_section import TeacherSubjectSection
from app.schemas.student import StudentCreate, StudentUpdate


class StudentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, student_id: int) -> Student | None:
        return (
            self.db.query(Student)
            .options(joinedload(Student.section))
            .filter(Student.id == student_id)
            .first()
        )

    def get_by_roll(self, roll_number: str, exclude_id: int | None = None) -> Student | None:
        q = self.db.query(Student).filter(Student.roll_number == roll_number)
        if exclude_id:
            q = q.filter(Student.id != exclude_id)
        return q.first()

    def get_by_registration(self, reg: str, exclude_id: int | None = None) -> Student | None:
        q = self.db.query(Student).filter(Student.registration_number == reg)
        if exclude_id:
            q = q.filter(Student.id != exclude_id)
        return q.first()

    def get_by_email(self, email: str, exclude_id: int | None = None) -> Student | None:
        q = self.db.query(Student).filter(Student.email == email)
        if exclude_id:
            q = q.filter(Student.id != exclude_id)
        return q.first()

    def list_students(
        self,
        search: Optional[str] = None,
        section_id: Optional[int] = None,
        semester: Optional[int] = None,
        subject_id: Optional[int] = None,
        academic_year: Optional[str] = None,
        page: int = 1,
        page_size: int = 10,
    ) -> tuple[list[Student], int]:
        query = self.db.query(Student).options(joinedload(Student.section))

        if subject_id:
            query = query.join(Enrollment).filter(Enrollment.subject_id == subject_id)

        if search:
            term = f"%{search}%"
            query = query.filter(
                or_(
                    Student.name.ilike(term),
                    Student.roll_number.ilike(term),
                    Student.registration_number.ilike(term),
                    Student.email.ilike(term),
                )
            )
        if section_id:
            query = query.filter(Student.section_id == section_id)
        if semester:
            query = query.filter(Student.semester == semester)
        if academic_year:
            query = query.filter(Student.academic_year == academic_year)

        total = query.count()
        students = (
            query.order_by(Student.roll_number)
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return students, total

    def get_by_section(self, section_id: int) -> list[Student]:
        return (
            self.db.query(Student)
            .filter(Student.section_id == section_id)
            .order_by(Student.roll_number)
            .all()
        )

    def create(self, data: StudentCreate | dict) -> Student:
        payload = data if isinstance(data, dict) else data.model_dump()
        student = Student(**payload)
        self.db.add(student)
        self.db.commit()
        self.db.refresh(student)
        return student

    def update(self, student: Student, data: StudentUpdate) -> Student:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(student, field, value)
        self.db.commit()
        self.db.refresh(student)
        return student

    def delete(self, student: Student) -> None:
        self.db.delete(student)
        self.db.commit()

    @staticmethod
    def total_pages(total: int, page_size: int) -> int:
        return max(1, math.ceil(total / page_size))


class AssignmentRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_by_teacher(self, teacher_id: int, academic_year: str | None = None) -> list[TeacherSubjectSection]:
        q = self.db.query(TeacherSubjectSection).filter(TeacherSubjectSection.teacher_id == teacher_id)
        if academic_year:
            q = q.filter(TeacherSubjectSection.academic_year == academic_year)
        return q.all()

    def create(self, assignment: TeacherSubjectSection) -> TeacherSubjectSection:
        self.db.add(assignment)
        self.db.commit()
        self.db.refresh(assignment)
        return assignment

    def get_existing(
        self, teacher_id: int, subject_id: int, section_id: int, academic_year: str
    ) -> TeacherSubjectSection | None:
        return (
            self.db.query(TeacherSubjectSection)
            .filter(
                TeacherSubjectSection.teacher_id == teacher_id,
                TeacherSubjectSection.subject_id == subject_id,
                TeacherSubjectSection.section_id == section_id,
                TeacherSubjectSection.academic_year == academic_year,
            )
            .first()
        )


class EnrollmentRepository:
    def __init__(self, db: Session):
        self.db = db

    def enroll_section_students(
        self, section_id: int, subject_id: int, academic_year: str
    ) -> int:
        students = self.db.query(Student).filter(Student.section_id == section_id).all()
        count = 0
        for student in students:
            exists = (
                self.db.query(Enrollment)
                .filter(
                    Enrollment.student_id == student.id,
                    Enrollment.subject_id == subject_id,
                    Enrollment.section_id == section_id,
                    Enrollment.academic_year == academic_year,
                )
                .first()
            )
            if not exists:
                self.db.add(
                    Enrollment(
                        student_id=student.id,
                        subject_id=subject_id,
                        section_id=section_id,
                        academic_year=academic_year,
                    )
                )
                count += 1
        self.db.commit()
        return count

    def enroll_student_in_section_subjects(
        self, student_id: int, section_id: int, academic_year: str
    ) -> None:
        assignments = (
            self.db.query(TeacherSubjectSection)
            .filter(
                TeacherSubjectSection.section_id == section_id,
                TeacherSubjectSection.academic_year == academic_year,
            )
            .all()
        )
        for assignment in assignments:
            exists = (
                self.db.query(Enrollment)
                .filter(
                    Enrollment.student_id == student_id,
                    Enrollment.subject_id == assignment.subject_id,
                    Enrollment.section_id == section_id,
                    Enrollment.academic_year == academic_year,
                )
                .first()
            )
            if not exists:
                self.db.add(
                    Enrollment(
                        student_id=student_id,
                        subject_id=assignment.subject_id,
                        section_id=section_id,
                        academic_year=academic_year,
                    )
                )
        self.db.commit()
