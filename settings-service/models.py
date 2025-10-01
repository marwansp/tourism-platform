from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from database import Base
import uuid


class HomepageSettings(Base):
    __tablename__ = "homepage_settings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hero_image_url = Column(String(500), nullable=False)
    hero_title = Column(String(200), nullable=True)
    hero_subtitle = Column(String(500), nullable=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    updated_by = Column(String(100), nullable=True)  # Admin user identifier
    
    def __repr__(self):
        return f"<HomepageSettings(id={self.id}, hero_image_url={self.hero_image_url})>"