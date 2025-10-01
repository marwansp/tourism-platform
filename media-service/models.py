from sqlalchemy import Column, String, Text, Integer, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from database import Base
import uuid

class MediaItem(Base):
    """
    SQLAlchemy model for media_items table
    """
    __tablename__ = "media_items"

    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        index=True
    )
    url = Column(Text, nullable=False)
    caption = Column(String(500), nullable=True)
    file_size = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)
    filename = Column(String(255), nullable=True)
    created_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(),
        nullable=False
    )

    def __repr__(self):
        return f"<MediaItem(id={self.id}, filename='{self.filename}', mime_type='{self.mime_type}')>"