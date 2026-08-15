"""Seed database with teacher, sections, subjects, assignments, and 75 students."""
import random
from datetime import date, timedelta

from app.core.config import get_settings
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models import (
    Teacher, Section, Subject, TeacherSubjectSection,
    Enrollment, Student, MarkRecord, AttendanceRecord, AttendanceSession,
)
from app.models.marks import MarkRecord as MR
from app.services.auth_service import AuthService

settings = get_settings()
ACADEMIC_YEAR = "2025-26"
SEMESTER = 5

FIRST_NAMES = [
    "Aarav", "Vihaan", "Arjun", "Aditya", "Rohan", "Karan", "Dev", "Nikhil",
    "Ananya", "Priya", "Sneha", "Kavya", "Isha", "Meera", "Riya", "Neha",
    "Vikram", "Rajesh", "Amit", "Rahul", "Pooja", "Divya", "Sanjay", "Aman",
    "Lakshmi", "Sunita", "Deepak", "Ashok", "Manish", "Suresh",
]
LAST_NAMES = [
    "Sharma", "Patel", "Kumar", "Singh", "Reddy", "Gupta", "Verma", "Joshi",
    "Rao", "Nair", "Das", "Mishra", "Pandey", "Banerjee", "Choudhury",
]


def init_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("Database recreated.")


def seed_teacher(db):
    auth = AuthService(db)
    teacher = auth.create_teacher(
        name=settings.TEACHER_NAME,
        email=settings.TEACHER_EMAIL,
        password=settings.TEACHER_PASSWORD,
        department="Computer Science",
    )
    print(f"Teacher ready: {teacher.email}")
    return teacher


def seed_sections(db):
    sections = []
    for name in ["CSE-A", "CSE-B", "CSE-C"]:
        s = Section(name=name, branch="Computer Science", semester=SEMESTER, academic_year=ACADEMIC_YEAR)
        db.add(s)
        sections.append(s)
    db.commit()
    for s in sections:
        db.refresh(s)
    print(f"Seeded {len(sections)} sections.")
    return sections


def seed_subjects(db):
    subjects_data = [
        ("CS501", "Data Structures", 4),
        ("CS502", "Database Management Systems", 4),
    ]
    subjects = []
    for code, name, credits in subjects_data:
        s = Subject(
            subject_code=code, subject_name=name, credits=credits,
            semester=SEMESTER, branch="Computer Science",
        )
        db.add(s)
        subjects.append(s)
    db.commit()
    for s in subjects:
        db.refresh(s)
    print(f"Seeded {len(subjects)} subjects.")
    return subjects


def seed_assignments(db, teacher, sections, subjects):
    assignments = []
    for subject in subjects:
        for section in sections:
            a = TeacherSubjectSection(
                teacher_id=teacher.id,
                subject_id=subject.id,
                section_id=section.id,
                academic_year=ACADEMIC_YEAR,
                semester=SEMESTER,
            )
            db.add(a)
            assignments.append(a)
    db.commit()
    print(f"Seeded {len(assignments)} teacher-subject-section assignments.")
    return assignments


def generate_performance_pattern(index: int) -> str:
    """Return performance pattern for varied demo data."""
    patterns = (
        ["high"] * 15 + ["average"] * 20 + ["low"] * 10 +
        ["low_attendance"] * 8 + ["both_low"] * 7 +
        ["declining"] * 8 + ["improving"] * 7
    )
    return patterns[index % len(patterns)]


def generate_marks(pattern: str) -> dict:
    if pattern == "high":
        return {k: random.uniform(0.75, 1.0) for k in ["a", "q", "i", "m", "e"]}
    if pattern == "average":
        return {k: random.uniform(0.55, 0.78) for k in ["a", "q", "i", "m", "e"]}
    if pattern == "low":
        return {k: random.uniform(0.25, 0.48) for k in ["a", "q", "i", "m", "e"]}
    if pattern == "low_attendance":
        return {k: random.uniform(0.60, 0.82) for k in ["a", "q", "i", "m", "e"]}
    if pattern == "both_low":
        return {k: random.uniform(0.20, 0.45) for k in ["a", "q", "i", "m", "e"]}
    if pattern == "declining":
        return {"a": 0.7, "q": 0.65, "i": 0.55, "m": 0.45, "e": 0.35}
    if pattern == "improving":
        return {"a": 0.4, "q": 0.5, "i": 0.6, "m": 0.72, "e": 0.85}
    return {k: random.uniform(0.5, 0.7) for k in ["a", "q", "i", "m", "e"]}


def generate_attendance(pattern: str) -> tuple[int, int]:
    total = random.randint(35, 45)
    if pattern in ("low_attendance", "both_low"):
        attended = int(total * random.uniform(0.45, 0.65))
    elif pattern == "high":
        attended = int(total * random.uniform(0.88, 0.98))
    elif pattern == "low":
        attended = int(total * random.uniform(0.70, 0.82))
    else:
        attended = int(total * random.uniform(0.72, 0.92))
    return total, attended


def seed_students(db, sections, subjects, teacher):
    random.seed(42)
    students = []
    per_section = 25

    for sec_idx, section in enumerate(sections):
        for i in range(per_section):
            idx = sec_idx * per_section + i
            first = FIRST_NAMES[idx % len(FIRST_NAMES)]
            last = LAST_NAMES[idx % len(LAST_NAMES)]
            name = f"{first} {last}"
            pattern = generate_performance_pattern(idx)

            student = Student(
                roll_number=f"CSE{SEMESTER}{section.name[-1]}{1001 + i:04d}",
                registration_number=f"REG{ACADEMIC_YEAR[:4]}{2000 + idx:05d}",
                name=name,
                email=f"{first.lower()}.{last.lower()}{idx}@student.college.edu",
                phone=f"98{70000000 + idx:08d}"[:10],
                gender="Female" if idx % 3 == 0 else "Male",
                section_id=section.id,
                semester=SEMESTER,
                academic_year=ACADEMIC_YEAR,
            )
            db.add(student)
            students.append((student, pattern))

    db.commit()
    all_students = db.query(Student).order_by(Student.id).all()
    print(f"Seeded {len(all_students)} students.")

    for idx, student in enumerate(all_students):
        pattern = generate_performance_pattern(idx)
        for subject in subjects:
            db.add(Enrollment(
                student_id=student.id,
                subject_id=subject.id,
                section_id=student.section_id,
                academic_year=ACADEMIC_YEAR,
            ))

            ratios = generate_marks(pattern)
            assignment = round(ratios["a"] * 20, 1)
            quiz = round(ratios["q"] * 20, 1)
            internal = round(ratios["i"] * 20, 1)
            midterm = round(ratios["m"] * 50, 1)
            endterm = round(ratios["e"] * 100, 1)
            total, pct = MR.compute_totals(assignment, quiz, internal, midterm, endterm)

            db.add(MarkRecord(
                student_id=student.id,
                subject_id=subject.id,
                section_id=student.section_id,
                teacher_id=teacher.id,
                assignment_marks=assignment,
                quiz_marks=quiz,
                internal_marks=internal,
                midterm_marks=midterm,
                endterm_marks=endterm,
                total_marks=total,
                percentage=pct,
            ))

            total_cls, attended = generate_attendance(pattern)
            absent = total_cls - attended
            db.add(AttendanceRecord(
                student_id=student.id,
                subject_id=subject.id,
                section_id=student.section_id,
                teacher_id=teacher.id,
                total_classes=total_cls,
                classes_attended=attended,
                classes_absent=absent,
                attendance_percentage=AttendanceRecord.compute_percentage(attended, total_cls),
            ))

    db.commit()
    print("Seeded enrollments, marks, and attendance records.")


if __name__ == "__main__":
    print("Initializing Teacher Academic Management System database...")
    init_db()
    db = SessionLocal()
    try:
        teacher = seed_teacher(db)
        sections = seed_sections(db)
        subjects = seed_subjects(db)
        seed_assignments(db, teacher, sections, subjects)
        seed_students(db, sections, subjects, teacher)
    finally:
        db.close()
    print("Seed complete!")
