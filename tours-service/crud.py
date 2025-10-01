from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional
import uuid

from models import Tour, TourImage, TourReview
from schemas import TourCreate, TourUpdate, TourReviewCreate

def get_tours(db: Session, skip: int = 0, limit: int = 100) -> List[Tour]:
    """
    Retrieve a list of tours with pagination
    
    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
    
    Returns:
        List of Tour objects
    """
    return db.query(Tour).offset(skip).limit(limit).all()

def get_tour_by_id(db: Session, tour_id: str) -> Optional[Tour]:
    """
    Retrieve a specific tour by ID
    
    Args:
        db: Database session
        tour_id: UUID string of the tour
    
    Returns:
        Tour object if found, None otherwise
    """
    try:
        # Convert string to UUID for query
        tour_uuid = uuid.UUID(tour_id)
        return db.query(Tour).filter(Tour.id == tour_uuid).first()
    except ValueError:
        # Invalid UUID format
        return None

def create_tour(db: Session, tour: TourCreate) -> Tour:
    """
    Create a new tour with images
    
    Args:
        db: Database session
        tour: TourCreate schema with tour data
    
    Returns:
        Created Tour object
    
    Raises:
        SQLAlchemyError: If database operation fails
    """
    try:
        db_tour = Tour(
            title=tour.title,
            description=tour.description,
            base_price=tour.price,  # Map price to base_price
            duration_days=1,  # Default to 1 day, can be enhanced later
            duration_description=tour.duration,  # Map duration to duration_description
            location=tour.location,
            max_participants=tour.max_participants,
            difficulty_level=tour.difficulty_level,
            includes=tour.includes,
            available_dates=tour.available_dates,
            # Set legacy fields for backward compatibility
            price=tour.price,
            duration=tour.duration
        )
        db.add(db_tour)
        db.flush()  # Get the tour ID without committing
        
        # Add images if provided
        if tour.images:
            # Ensure at least one image is marked as main
            has_main = any(img.is_main for img in tour.images)
            if not has_main and tour.images:
                tour.images[0].is_main = True
            
            for idx, image_data in enumerate(tour.images):
                db_image = TourImage(
                    tour_id=db_tour.id,
                    image_url=image_data.image_url,
                    is_main=image_data.is_main,
                    display_order=image_data.display_order if image_data.display_order else idx,
                    alt_text=image_data.alt_text
                )
                db.add(db_image)
        
        db.commit()
        db.refresh(db_tour)
        return db_tour
    except SQLAlchemyError as e:
        db.rollback()
        raise e

def update_tour(db: Session, tour_id: str, tour: TourUpdate) -> Optional[Tour]:
    """
    Update an existing tour with images
    
    Args:
        db: Database session
        tour_id: UUID string of the tour to update
        tour: TourUpdate schema with updated data
    
    Returns:
        Updated Tour object if found, None otherwise
    
    Raises:
        SQLAlchemyError: If database operation fails
    """
    try:
        # Convert string to UUID for query
        tour_uuid = uuid.UUID(tour_id)
        db_tour = db.query(Tour).filter(Tour.id == tour_uuid).first()
        
        if db_tour is None:
            return None
        
        # Update tour fields (excluding images)
        update_data = tour.dict(exclude_unset=True, exclude={'images'})
        
        # Map schema fields to database fields
        field_mapping = {
            'price': 'base_price',
            'duration': 'duration_description'
        }
        
        for field, value in update_data.items():
            # Map field names if needed
            db_field = field_mapping.get(field, field)
            setattr(db_tour, db_field, value)
            
            # Also set legacy fields for backward compatibility
            if field == 'price':
                setattr(db_tour, 'price', value)
            elif field == 'duration':
                setattr(db_tour, 'duration', value)
        
        # Handle images update if provided
        if tour.images is not None:
            # Delete existing images
            db.query(TourImage).filter(TourImage.tour_id == tour_uuid).delete()
            
            # Add new images
            if tour.images:
                # Ensure at least one image is marked as main
                has_main = any(img.is_main for img in tour.images)
                if not has_main and tour.images:
                    tour.images[0].is_main = True
                
                for idx, image_data in enumerate(tour.images):
                    db_image = TourImage(
                        tour_id=db_tour.id,
                        image_url=image_data.image_url,
                        is_main=image_data.is_main,
                        display_order=image_data.display_order if image_data.display_order else idx,
                        alt_text=image_data.alt_text
                    )
                    db.add(db_image)
        
        db.commit()
        db.refresh(db_tour)
        return db_tour
    except ValueError:
        # Invalid UUID format
        return None
    except SQLAlchemyError as e:
        db.rollback()
        raise e

def delete_tour(db: Session, tour_id: str) -> bool:
    """
    Delete a tour by ID
    
    Args:
        db: Database session
        tour_id: UUID string of the tour to delete
    
    Returns:
        True if tour was deleted, False if not found
    
    Raises:
        SQLAlchemyError: If database operation fails
    """
    try:
        # Convert string to UUID for query
        tour_uuid = uuid.UUID(tour_id)
        db_tour = db.query(Tour).filter(Tour.id == tour_uuid).first()
        
        if db_tour is None:
            return False
        
        db.delete(db_tour)
        db.commit()
        return True
    except ValueError:
        # Invalid UUID format
        return False
    except SQLAlchemyError as e:
        db.rollback()
        raise e

def get_tours_count(db: Session) -> int:
    """
    Get total count of tours
    
    Args:
        db: Database session
    
    Returns:
        Total number of tours
    """
    return db.query(Tour).count()

def get_seasonal_pricing_for_dates(db: Session, tour_id: str, start_date, end_date):
    """
    Get seasonal pricing for a tour within the given date range
    
    Args:
        db: Database session
        tour_id: UUID string of the tour
        start_date: Start date
        end_date: End date
    
    Returns:
        Dictionary with pricing information
    """
    from models import TourSeasonalPrice
    from decimal import Decimal
    
    try:
        tour_uuid = uuid.UUID(tour_id)
        
        # Find seasonal pricing that overlaps with the requested date range
        seasonal_price = db.query(TourSeasonalPrice).filter(
            TourSeasonalPrice.tour_id == tour_uuid,
            TourSeasonalPrice.is_active == True,
            TourSeasonalPrice.start_date <= end_date,
            TourSeasonalPrice.end_date >= start_date
        ).first()
        
        if seasonal_price:
            return {
                'multiplier': float(seasonal_price.price_multiplier),
                'season_name': seasonal_price.season_name
            }
        else:
            # Return default pricing if no seasonal pricing found
            return {
                'multiplier': 1.0,
                'season_name': 'Regular Season'
            }
    except ValueError:
        return {
            'multiplier': 1.0,
            'season_name': 'Regular Season'
        }

def check_tour_availability_for_dates(db: Session, tour_id: str, start_date, end_date, participants: int):
    """
    Check tour availability for given dates and participant count
    
    Args:
        db: Database session
        tour_id: UUID string of the tour
        start_date: Start date
        end_date: End date
        participants: Number of participants
    
    Returns:
        Dictionary with availability information
    """
    from models import TourAvailability
    from datetime import timedelta
    
    try:
        tour_uuid = uuid.UUID(tour_id)
        
        # Get tour to check max participants
        tour = get_tour_by_id(db, tour_id)
        if not tour:
            return {
                'available': False,
                'message': 'Tour not found'
            }
        
        # Check if participants exceed tour capacity
        if participants > tour.max_participants:
            return {
                'available': False,
                'message': f'Maximum {tour.max_participants} participants allowed'
            }
        
        # Check availability for each date in the range
        current_date = start_date
        unavailable_dates = []
        
        while current_date <= end_date:
            availability = db.query(TourAvailability).filter(
                TourAvailability.tour_id == tour_uuid,
                TourAvailability.date == current_date
            ).first()
            
            if availability:
                if not availability.is_available or availability.available_spots < participants:
                    unavailable_dates.append(current_date.isoformat())
            else:
                # If no availability record exists, assume it's available with max capacity
                pass
            
            current_date += timedelta(days=1)
        
        if unavailable_dates:
            return {
                'available': False,
                'message': f'Not available on: {", ".join(unavailable_dates)}',
                'unavailable_dates': unavailable_dates
            }
        
        return {
            'available': True,
            'message': 'Tour is available for selected dates',
            'max_participants': tour.max_participants
        }
        
    except ValueError:
        return {
            'available': False,
            'message': 'Invalid tour ID'
        }


def create_review_token(db: Session, booking_id: str, tour_id: str, customer_name: str, customer_email: str) -> str:
    """
    Create a unique review token for a booking
    
    Args:
        db: Database session
        booking_id: UUID string of the booking
        tour_id: UUID string of the tour
        customer_name: Customer name
        customer_email: Customer email
    
    Returns:
        Review token string
    """
    import secrets
    
    # Generate a secure random token
    token = secrets.token_urlsafe(32)
    
    try:
        booking_uuid = uuid.UUID(booking_id)
        tour_uuid = uuid.UUID(tour_id)
        
        # Check if review token already exists for this booking
        existing_review = db.query(TourReview).filter(TourReview.booking_id == booking_uuid).first()
        if existing_review:
            return existing_review.review_token
        
        # Create new review record with token (not yet submitted)
        db_review = TourReview(
            tour_id=tour_uuid,
            booking_id=booking_uuid,
            customer_name=customer_name,
            customer_email=customer_email,
            rating=0,  # Placeholder until review is submitted
            review_token=token,
            is_verified=False
        )
        db.add(db_review)
        db.commit()
        
        return token
    except (ValueError, SQLAlchemyError):
        return None


def submit_review(db: Session, token: str, review_data: TourReviewCreate) -> Optional[TourReview]:
    """
    Submit a review using the review token
    
    Args:
        db: Database session
        token: Review token
        review_data: Review data
    
    Returns:
        Updated TourReview object if successful, None otherwise
    """
    try:
        # Find the review by token
        db_review = db.query(TourReview).filter(TourReview.review_token == token).first()
        
        if not db_review:
            return None
        
        # Update the review with submitted data
        db_review.rating = review_data.rating
        db_review.review_text = review_data.review_text
        db_review.customer_name = review_data.customer_name  # Allow customer to update their name
        db_review.is_verified = True
        
        db.commit()
        db.refresh(db_review)
        return db_review
    except SQLAlchemyError as e:
        db.rollback()
        raise e


def get_review_by_token(db: Session, token: str) -> Optional[TourReview]:
    """
    Get review by token (for displaying review form)
    
    Args:
        db: Database session
        token: Review token
    
    Returns:
        TourReview object if found, None otherwise
    """
    return db.query(TourReview).filter(TourReview.review_token == token).first()


def get_tour_reviews(db: Session, tour_id: str, skip: int = 0, limit: int = 50) -> List[TourReview]:
    """
    Get all approved and verified reviews for a tour
    
    Args:
        db: Database session
        tour_id: UUID string of the tour
        skip: Number of records to skip
        limit: Maximum number of records to return
    
    Returns:
        List of TourReview objects
    """
    try:
        tour_uuid = uuid.UUID(tour_id)
        return db.query(TourReview).filter(
            TourReview.tour_id == tour_uuid,
            TourReview.is_verified == True,
            TourReview.is_approved == True,
            TourReview.rating > 0  # Only show submitted reviews
        ).order_by(TourReview.created_at.desc()).offset(skip).limit(limit).all()
    except ValueError:
        return []


def get_tour_rating_stats(db: Session, tour_id: str) -> dict:
    """
    Get rating statistics for a tour
    
    Args:
        db: Database session
        tour_id: UUID string of the tour
    
    Returns:
        Dictionary with rating statistics
    """
    from sqlalchemy import func
    
    try:
        tour_uuid = uuid.UUID(tour_id)
        
        # Get average rating and count
        result = db.query(
            func.avg(TourReview.rating).label('average_rating'),
            func.count(TourReview.id).label('total_reviews')
        ).filter(
            TourReview.tour_id == tour_uuid,
            TourReview.is_verified == True,
            TourReview.is_approved == True,
            TourReview.rating > 0
        ).first()
        
        return {
            'average_rating': float(result.average_rating) if result.average_rating else 0.0,
            'total_reviews': result.total_reviews or 0
        }
    except ValueError:
        return {
            'average_rating': 0.0,
            'total_reviews': 0
        }