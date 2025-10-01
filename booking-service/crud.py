from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional
import uuid

from models import Booking
from schemas import BookingRequest, BookingUpdate

def get_bookings(db: Session, skip: int = 0, limit: int = 100) -> List[Booking]:
    """
    Retrieve a list of bookings with pagination
    
    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
    
    Returns:
        List of Booking objects
    """
    return db.query(Booking).order_by(Booking.created_at.desc()).offset(skip).limit(limit).all()

def get_booking_by_id(db: Session, booking_id: str) -> Optional[Booking]:
    """
    Retrieve a specific booking by ID
    
    Args:
        db: Database session
        booking_id: UUID string of the booking
    
    Returns:
        Booking object if found, None otherwise
    """
    try:
        # Convert string to UUID for query
        booking_uuid = uuid.UUID(booking_id)
        return db.query(Booking).filter(Booking.id == booking_uuid).first()
    except ValueError:
        # Invalid UUID format
        return None

def get_bookings_by_tour(db: Session, tour_id: str) -> List[Booking]:
    """
    Retrieve all bookings for a specific tour
    
    Args:
        db: Database session
        tour_id: UUID string of the tour
    
    Returns:
        List of Booking objects
    """
    try:
        tour_uuid = uuid.UUID(tour_id)
        return db.query(Booking).filter(Booking.tour_id == tour_uuid).all()
    except ValueError:
        return []

def get_bookings_by_email(db: Session, email: str) -> List[Booking]:
    """
    Retrieve all bookings for a specific customer email
    
    Args:
        db: Database session
        email: Customer email address
    
    Returns:
        List of Booking objects
    """
    return db.query(Booking).filter(Booking.email == email).order_by(Booking.created_at.desc()).all()

def create_booking(db: Session, booking: BookingRequest) -> Booking:
    """
    Create a new booking with price calculation
    
    Args:
        db: Database session
        booking: BookingRequest schema with booking data
    
    Returns:
        Created Booking object
    
    Raises:
        SQLAlchemyError: If database operation fails
    """
    try:
        # Convert tour_id string to UUID
        tour_uuid = uuid.UUID(booking.tour_id)
        
        # Calculate pricing (this should be done via the pricing service in production)
        # For now, we'll use a simple calculation
        from decimal import Decimal
        base_price_per_day = Decimal('100.00')  # This should come from the tour
        duration_days = 1  # Default duration, should come from date range
        price_per_person = base_price_per_day  # Store as per day for backward compatibility
        total_price = base_price_per_day * Decimal(str(duration_days)) * Decimal(str(booking.number_of_participants))
        
        db_booking = Booking(
            customer_name=booking.customer_name,
            email=booking.email,
            phone=booking.phone,
            tour_id=tour_uuid,
            start_date=booking.start_date,
            end_date=booking.end_date,
            number_of_participants=booking.number_of_participants,
            price_per_person=price_per_person,
            total_price=total_price,
            travel_date=booking.start_date,  # Set to start_date for backward compatibility
            status="pending"
        )
        db.add(db_booking)
        db.commit()
        db.refresh(db_booking)
        return db_booking
    except ValueError as e:
        raise ValueError(f"Invalid tour ID format: {str(e)}")
    except SQLAlchemyError as e:
        db.rollback()
        raise e

async def create_booking_with_pricing(db: Session, booking: BookingRequest) -> Booking:
    """
    Create a new booking with proper price calculation
    
    Args:
        db: Database session
        booking: BookingRequest schema with booking data
    
    Returns:
        Created Booking object
    
    Raises:
        SQLAlchemyError: If database operation fails
    """
    from services.pricing_service import pricing_service
    from schemas import PriceCalculationRequest
    
    try:
        # Convert tour_id string to UUID
        tour_uuid = uuid.UUID(booking.tour_id)
        
        # Calculate pricing using the pricing service
        price_request = PriceCalculationRequest(
            tour_id=booking.tour_id,
            start_date=booking.start_date,
            end_date=booking.end_date,
            number_of_participants=booking.number_of_participants
        )
        
        price_info = await pricing_service.calculate_price(price_request, db)
        
        db_booking = Booking(
            customer_name=booking.customer_name,
            email=booking.email,
            phone=booking.phone,
            tour_id=tour_uuid,
            start_date=booking.start_date,
            end_date=booking.end_date,
            number_of_participants=booking.number_of_participants,
            price_per_person=price_info.price_per_person,
            total_price=price_info.total_price,
            travel_date=booking.start_date,  # Set to start_date for backward compatibility
            status="pending"
        )
        db.add(db_booking)
        db.commit()
        db.refresh(db_booking)
        return db_booking
    except ValueError as e:
        raise ValueError(f"Invalid tour ID format: {str(e)}")
    except SQLAlchemyError as e:
        db.rollback()
        raise e

def update_booking(db: Session, booking_id: str, booking: BookingUpdate) -> Optional[Booking]:
    """
    Update an existing booking
    
    Args:
        db: Database session
        booking_id: UUID string of the booking to update
        booking: BookingUpdate schema with updated data
    
    Returns:
        Updated Booking object if found, None otherwise
    
    Raises:
        SQLAlchemyError: If database operation fails
    """
    try:
        # Convert string to UUID for query
        booking_uuid = uuid.UUID(booking_id)
        db_booking = db.query(Booking).filter(Booking.id == booking_uuid).first()
        
        if db_booking is None:
            return None
        
        # Update only provided fields
        update_data = booking.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_booking, field, value)
        
        db.commit()
        db.refresh(db_booking)
        return db_booking
    except ValueError:
        # Invalid UUID format
        return None
    except SQLAlchemyError as e:
        db.rollback()
        raise e

def delete_booking(db: Session, booking_id: str) -> bool:
    """
    Delete a booking by ID
    
    Args:
        db: Database session
        booking_id: UUID string of the booking to delete
    
    Returns:
        True if booking was deleted, False if not found
    
    Raises:
        SQLAlchemyError: If database operation fails
    """
    try:
        # Convert string to UUID for query
        booking_uuid = uuid.UUID(booking_id)
        db_booking = db.query(Booking).filter(Booking.id == booking_uuid).first()
        
        if db_booking is None:
            return False
        
        db.delete(db_booking)
        db.commit()
        return True
    except ValueError:
        # Invalid UUID format
        return False
    except SQLAlchemyError as e:
        db.rollback()
        raise e

def get_bookings_count(db: Session) -> int:
    """
    Get total count of bookings
    
    Args:
        db: Database session
    
    Returns:
        Total number of bookings
    """
    return db.query(Booking).count()

def get_bookings_by_status(db: Session, status: str) -> List[Booking]:
    """
    Get bookings by status
    
    Args:
        db: Database session
        status: Booking status (pending, confirmed, cancelled)
    
    Returns:
        List of Booking objects with the specified status
    """
    return db.query(Booking).filter(Booking.status == status).order_by(Booking.created_at.desc()).all()