from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, DECIMAL, func
from sqlalchemy.dialects.postgresql import UUID
from database import Base
import uuid

class Booking(Base):
    """
    SQLAlchemy model for bookings table
    """
    __tablename__ = "bookings"

    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        index=True
    )
    customer_name = Column(String(100), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    tour_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Date range fields
    start_date = Column(DateTime(timezone=True), nullable=False, index=True)
    end_date = Column(DateTime(timezone=True), nullable=False, index=True)
    
    # Participant and pricing fields
    number_of_participants = Column(Integer, nullable=False, default=1)
    price_per_person = Column(DECIMAL(10, 2), nullable=False)  # Snapshot of price at booking time
    total_price = Column(DECIMAL(10, 2), nullable=False)  # Calculated total
    
    # Legacy field for backward compatibility (will be removed later)
    travel_date = Column(DateTime(timezone=True), nullable=True, index=True)
    
    status = Column(
        String(20), 
        nullable=False, 
        default="pending",
        index=True
    )
    admin_viewed = Column(
        Boolean,
        nullable=False,
        default=False,
        index=True
    )
    created_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    def __repr__(self):
        return f"<Booking(id={self.id}, customer='{self.customer_name}', tour_id={self.tour_id}, status='{self.status}')>"