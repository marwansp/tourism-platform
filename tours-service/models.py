from sqlalchemy import Column, String, Text, DECIMAL, DateTime, Integer, JSON, Boolean, ForeignKey, func, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base
import uuid

class Tour(Base):
    """
    SQLAlchemy model for tours table
    """
    __tablename__ = "tours"

    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        index=True
    )
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=False)
    base_price = Column(DECIMAL(10, 2), nullable=False)  # Renamed from 'price' to 'base_price'
    duration_days = Column(Integer, nullable=False, default=1)  # Duration in days instead of string
    duration_description = Column(String(50), nullable=False)  # Keep original duration string for display
    location = Column(String(100), nullable=False)
    max_participants = Column(Integer, nullable=False, default=10)
    min_participants = Column(Integer, nullable=False, default=1)
    difficulty_level = Column(String(20), nullable=False, default='Easy')
    includes = Column(JSON, nullable=True)
    available_dates = Column(JSON, nullable=True)
    
    # Group discount settings
    group_discount_threshold = Column(Integer, nullable=False, default=5)  # Minimum people for group discount
    group_discount_percentage = Column(DECIMAL(5, 2), nullable=False, default=0.00)  # Discount percentage
    
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

    # Relationships
    images = relationship("TourImage", back_populates="tour", cascade="all, delete-orphan", order_by="TourImage.display_order")
    seasonal_prices = relationship("TourSeasonalPrice", back_populates="tour", cascade="all, delete-orphan")
    availability = relationship("TourAvailability", back_populates="tour", cascade="all, delete-orphan")
    reviews = relationship("TourReview", back_populates="tour", cascade="all, delete-orphan", order_by="TourReview.created_at.desc()")

    # Legacy field for backward compatibility
    price = Column(DECIMAL(10, 2), nullable=True)
    duration = Column(String(50), nullable=True)

    def __repr__(self):
        return f"<Tour(id={self.id}, title='{self.title}', base_price={self.base_price})>"


class TourSeasonalPrice(Base):
    """
    SQLAlchemy model for seasonal pricing
    """
    __tablename__ = "tour_seasonal_prices"

    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        index=True
    )
    tour_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("tours.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    season_name = Column(String(50), nullable=False)  # e.g., "Peak Season", "Low Season"
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=False, index=True)
    price_multiplier = Column(DECIMAL(5, 2), nullable=False, default=1.00)  # 1.0 = base price, 1.5 = 50% increase
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(),
        nullable=False
    )

    # Relationship
    tour = relationship("Tour", back_populates="seasonal_prices")

    def __repr__(self):
        return f"<TourSeasonalPrice(tour_id={self.tour_id}, season='{self.season_name}', multiplier={self.price_multiplier})>"


class TourAvailability(Base):
    """
    SQLAlchemy model for tour availability calendar
    """
    __tablename__ = "tour_availability"

    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        index=True
    )
    tour_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("tours.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    date = Column(Date, nullable=False, index=True)
    available_spots = Column(Integer, nullable=False)
    is_available = Column(Boolean, nullable=False, default=True)
    notes = Column(Text, nullable=True)
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

    # Relationship
    tour = relationship("Tour", back_populates="availability")

    def __repr__(self):
        return f"<TourAvailability(tour_id={self.tour_id}, date={self.date}, spots={self.available_spots})>"


class TourImage(Base):
    """
    SQLAlchemy model for tour images table
    """
    __tablename__ = "tour_images"

    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        index=True
    )
    tour_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("tours.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    image_url = Column(Text, nullable=False)
    is_main = Column(Boolean, nullable=False, default=False, index=True)
    display_order = Column(Integer, nullable=False, default=0, index=True)
    alt_text = Column(String(255), nullable=True)
    created_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(),
        nullable=False
    )

    # Relationship to tour
    tour = relationship("Tour", back_populates="images")

    def __repr__(self):
        return f"<TourImage(id={self.id}, tour_id={self.tour_id}, is_main={self.is_main})>"


class TourReview(Base):
    """
    SQLAlchemy model for tour reviews (guest reviews without accounts)
    """
    __tablename__ = "tour_reviews"

    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4,
        index=True
    )
    tour_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("tours.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    booking_id = Column(
        UUID(as_uuid=True), 
        nullable=False,
        unique=True,  # One review per booking
        index=True
    )
    customer_name = Column(String(100), nullable=False)
    customer_email = Column(String(255), nullable=False, index=True)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    review_text = Column(Text, nullable=True)
    review_token = Column(String(64), nullable=False, unique=True, index=True)  # Unique token for review access
    is_verified = Column(Boolean, nullable=False, default=False)
    is_approved = Column(Boolean, nullable=False, default=True)  # Admin can moderate reviews
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

    # Relationship to tour
    tour = relationship("Tour", back_populates="reviews")

    def __repr__(self):
        return f"<TourReview(id={self.id}, tour_id={self.tour_id}, rating={self.rating})>"