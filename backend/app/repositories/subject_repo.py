from sqlalchemy.orm import Session

from app.models.subject import Subject
from app.schemas.subject import SubjectCreate, SubjectUpdate


class SubjectRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_all(self, semester: int | None = None, branch: str | None = None) -> list[Subject]:
        query = self.db.query(Subject)
        if semester:
            query = query.filter(Subject.semester == semester)
        if branch:
            query = query.filter(Subject.branch == branch)
        return query.order_by(Subject.subject_name).all()

    def get_by_id(self, subject_id: int) -> Subject | None:
        return self.db.query(Subject).filter(Subject.id == subject_id).first()

    def get_by_code(self, code: str) -> Subject | None:
        return self.db.query(Subject).filter(Subject.subject_code == code).first()

    def create(self, data: SubjectCreate) -> Subject:
        subject = Subject(**data.model_dump())
        self.db.add(subject)
        self.db.commit()
        self.db.refresh(subject)
        return subject

    def update(self, subject: Subject, data: SubjectUpdate) -> Subject:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(subject, field, value)
        self.db.commit()
        self.db.refresh(subject)
        return subject

    def delete(self, subject: Subject) -> None:
        self.db.delete(subject)
        self.db.commit()
