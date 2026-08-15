from sqlalchemy.orm import Session

from app.models.section import Section
from app.schemas.section import SectionCreate, SectionUpdate


class SectionRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_all(self, semester: int | None = None, academic_year: str | None = None) -> list[Section]:
        query = self.db.query(Section)
        if semester:
            query = query.filter(Section.semester == semester)
        if academic_year:
            query = query.filter(Section.academic_year == academic_year)
        return query.order_by(Section.name).all()

    def get_by_id(self, section_id: int) -> Section | None:
        return self.db.query(Section).filter(Section.id == section_id).first()

    def get_by_name(self, name: str) -> Section | None:
        return self.db.query(Section).filter(Section.name == name).first()

    def create(self, data: SectionCreate) -> Section:
        section = Section(**data.model_dump())
        self.db.add(section)
        self.db.commit()
        self.db.refresh(section)
        return section

    def update(self, section: Section, data: SectionUpdate) -> Section:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(section, field, value)
        self.db.commit()
        self.db.refresh(section)
        return section

    def delete(self, section: Section) -> None:
        self.db.delete(section)
        self.db.commit()
