from sqlalchemy.orm import Session

from app.models.teacher import Teacher


class TeacherRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> Teacher | None:
        return self.db.query(Teacher).filter(Teacher.email == email).first()

    def get_by_id(self, teacher_id: int) -> Teacher | None:
        return self.db.query(Teacher).filter(Teacher.id == teacher_id).first()

    def create(self, teacher: Teacher) -> Teacher:
        self.db.add(teacher)
        self.db.commit()
        self.db.refresh(teacher)
        return teacher
