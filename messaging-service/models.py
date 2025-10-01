from sqlalchemy import Column, String, Text, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from database import Base
import uuid

class Notification(Base):
    """
    SQLAlchemy model for notifications table
    """
    __tablename__ = "notifications"

    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        index=True
    )
    type = Column(String(20), nullable=False, index=True)  # email, whatsapp
    recipient = Column(String(255), nullable=False, index=True)  # email address or phone number
    subject = Column(String(200), nullable=True)
    message = Column(Text, nullable=False)
    status = Column(
        String(20), 
        nullable=False, 
        default="pending",
        index=True
    )  # pending, sent, failed
    sent_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(),
        nullable=False
    )

    def __repr__(self):
        return f"<Notification(id={self.id}, type='{self.type}', recipient='{self.recipient}', status='{self.status}')>"