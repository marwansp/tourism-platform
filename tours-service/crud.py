from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional
import uuid

from models import Tour, TourImage, TourReview, TourGroupPricing, Tag, TourTag
from schemas import (
    TourCreate, TourUpdate, TourReviewCreate,
    TourGroupPricingCreate, TourGroupPricingUpdate,
    TagCreate, TagUpdate
)

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

def create_tour(db: Session, tour: TourCreate, translations: Optional[List[dict]] = None) -> Tour:
    """
    Create a new tour with images and translations
    
    Args:
        db: Database session
        tour: TourCreate schema with tour data
        translations: Optional list of translation dicts with {language_code, title, description, itinerary}
    
    Returns:
        Created Tour object
    
    Raises:
        ValueError: If validation fails (e.g., invalid language_code)
        SQLAlchemyError: If database operation fails
    """
    from models import Language, TourTranslation
    
    try:
        # If translations are provided, validate language codes exist
        if translations:
            for trans in translations:
                lang_code = trans.get('language_code')
                if not lang_code:
                    raise ValueError("language_code is required for each translation")
                
                # Validate language exists in languages table
                language = db.query(Language).filter(Language.code == lang_code).first()
                if not language:
                    raise ValueError(f"Language code '{lang_code}' does not exist in the system")
        
        # Create tour with non-translatable fields
        # Use first translation for legacy fields if translations provided
        if translations and len(translations) > 0:
            first_trans = translations[0]
            db_tour = Tour(
                title=first_trans.get('title', tour.title),
                description=first_trans.get('description', tour.description),
                location=first_trans.get('location', tour.location) if 'location' in first_trans else tour.location,
                base_price=tour.price,
                duration_days=1,
                duration_description=tour.duration,
                max_participants=tour.max_participants,
                difficulty_level=tour.difficulty_level,
                includes=tour.includes,
                available_dates=tour.available_dates,
                price=tour.price,
                duration=tour.duration
            )
        else:
            # Backward compatibility: create tour with old schema
            db_tour = Tour(
                title=tour.title,
                description=tour.description,
                base_price=tour.price,
                duration_days=1,
                duration_description=tour.duration,
                location=tour.location,
                max_participants=tour.max_participants,
                difficulty_level=tour.difficulty_level,
                includes=tour.includes,
                available_dates=tour.available_dates,
                price=tour.price,
                duration=tour.duration
            )
        
        db.add(db_tour)
        db.flush()  # Get the tour ID without committing
        
        # Add translations if provided
        if translations:
            for trans in translations:
                db_translation = TourTranslation(
                    tour_id=db_tour.id,
                    language_code=trans['language_code'],
                    title=trans['title'],
                    description=trans['description'],
                    location=trans.get('location', tour.location),
                    includes=trans.get('itinerary', '')  # Map itinerary to includes field
                )
                db.add(db_translation)
        
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
    except ValueError as e:
        db.rollback()
        raise e
    except SQLAlchemyError as e:
        db.rollback()
        raise e

def update_tour(db: Session, tour_id: str, tour: TourUpdate, translations: Optional[List[dict]] = None) -> Optional[Tour]:
    """
    Update an existing tour with images and translations
    
    Args:
        db: Database session
        tour_id: UUID string of the tour to update
        tour: TourUpdate schema with updated data
        translations: Optional list of translation dicts with {language_code, title, description, itinerary}
    
    Returns:
        Updated Tour object if found, None otherwise
    
    Raises:
        ValueError: If validation fails (e.g., invalid language_code)
        SQLAlchemyError: If database operation fails
    """
    from models import Language, TourTranslation
    
    try:
        # Convert string to UUID for query
        tour_uuid = uuid.UUID(tour_id)
        db_tour = db.query(Tour).filter(Tour.id == tour_uuid).first()
        
        if db_tour is None:
            return None
        
        # If translations are provided, validate language codes exist
        if translations:
            for trans in translations:
                lang_code = trans.get('language_code')
                if not lang_code:
                    raise ValueError("language_code is required for each translation")
                
                # Validate language exists in languages table
                language = db.query(Language).filter(Language.code == lang_code).first()
                if not language:
                    raise ValueError(f"Language code '{lang_code}' does not exist in the system")
        
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
        
        # Handle translations update if provided
        if translations is not None:
            # Get existing translation language codes
            existing_translations = db.query(TourTranslation).filter(
                TourTranslation.tour_id == tour_uuid
            ).all()
            existing_lang_codes = {t.language_code for t in existing_translations}
            
            # Get new translation language codes
            new_lang_codes = {t['language_code'] for t in translations}
            
            # Delete translations that are no longer in the new list
            removed_lang_codes = existing_lang_codes - new_lang_codes
            if removed_lang_codes:
                db.query(TourTranslation).filter(
                    TourTranslation.tour_id == tour_uuid,
                    TourTranslation.language_code.in_(removed_lang_codes)
                ).delete(synchronize_session=False)
            
            # Insert or update translations
            for trans in translations:
                lang_code = trans['language_code']
                existing_trans = next(
                    (t for t in existing_translations if t.language_code == lang_code),
                    None
                )
                
                if existing_trans:
                    # Update existing translation
                    existing_trans.title = trans['title']
                    existing_trans.description = trans['description']
                    existing_trans.location = trans.get('location', existing_trans.location)
                    existing_trans.includes = trans.get('itinerary', '')
                else:
                    # Create new translation
                    db_translation = TourTranslation(
                        tour_id=tour_uuid,
                        language_code=lang_code,
                        title=trans['title'],
                        description=trans['description'],
                        location=trans.get('location', db_tour.location),
                        includes=trans.get('itinerary', '')
                    )
                    db.add(db_translation)
        
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
    except ValueError as e:
        db.rollback()
        raise e
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

# ============================================================================
# Group Pricing CRUD Operations (v2)
# ============================================================================

def create_group_pricing(db: Session, tour_id: str, pricing: TourGroupPricingCreate) -> Optional[TourGroupPricing]:
    """Create group pricing tier for a tour"""
    try:
        tour_uuid = uuid.UUID(tour_id)
        
        # Verify tour exists
        tour = get_tour_by_id(db, tour_id)
        if not tour:
            return None
        
        db_pricing = TourGroupPricing(
            tour_id=tour_uuid,
            min_participants=pricing.min_participants,
            max_participants=pricing.max_participants,
            price_per_person=pricing.price_per_person
        )
        db.add(db_pricing)
        db.commit()
        db.refresh(db_pricing)
        return db_pricing
    except (ValueError, SQLAlchemyError) as e:
        db.rollback()
        raise e


def get_tour_group_pricing(db: Session, tour_id: str) -> List[TourGroupPricing]:
    """Get all group pricing tiers for a tour"""
    try:
        tour_uuid = uuid.UUID(tour_id)
        return db.query(TourGroupPricing).filter(
            TourGroupPricing.tour_id == tour_uuid
        ).order_by(TourGroupPricing.min_participants).all()
    except ValueError:
        return []


def update_group_pricing(db: Session, pricing_id: str, pricing: TourGroupPricingUpdate) -> Optional[TourGroupPricing]:
    """Update a group pricing tier"""
    try:
        pricing_uuid = uuid.UUID(pricing_id)
        db_pricing = db.query(TourGroupPricing).filter(TourGroupPricing.id == pricing_uuid).first()
        
        if not db_pricing:
            return None
        
        update_data = pricing.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_pricing, field, value)
        
        db.commit()
        db.refresh(db_pricing)
        return db_pricing
    except (ValueError, SQLAlchemyError) as e:
        db.rollback()
        raise e


def delete_group_pricing(db: Session, pricing_id: str) -> bool:
    """Delete a group pricing tier"""
    try:
        pricing_uuid = uuid.UUID(pricing_id)
        db_pricing = db.query(TourGroupPricing).filter(TourGroupPricing.id == pricing_uuid).first()
        
        if not db_pricing:
            return False
        
        db.delete(db_pricing)
        db.commit()
        return True
    except (ValueError, SQLAlchemyError) as e:
        db.rollback()
        raise e


def calculate_group_price(db: Session, tour_id: str, participants: int) -> dict:
    """Calculate price based on group size"""
    try:
        tour_uuid = uuid.UUID(tour_id)
        tour = get_tour_by_id(db, tour_id)
        
        if not tour:
            return {'error': 'Tour not found'}
        
        # Get applicable group pricing
        pricing = db.query(TourGroupPricing).filter(
            TourGroupPricing.tour_id == tour_uuid,
            TourGroupPricing.min_participants <= participants,
            TourGroupPricing.max_participants >= participants
        ).first()
        
        if pricing:
            price_per_person = pricing.price_per_person
            total_price = price_per_person * participants
            return {
                'price_per_person': float(price_per_person),
                'total_price': float(total_price),
                'participants': participants,
                'pricing_tier': f'{pricing.min_participants}-{pricing.max_participants} people'
            }
        else:
            # Use base price if no group pricing found
            base_price = tour.base_price or tour.price
            total_price = base_price * participants
            return {
                'price_per_person': float(base_price),
                'total_price': float(total_price),
                'participants': participants,
                'pricing_tier': 'Standard pricing'
            }
    except ValueError:
        return {'error': 'Invalid tour ID'}


# ============================================================================
# Tag CRUD Operations (v2)
# ============================================================================

def create_tag(db: Session, tag: TagCreate) -> Tag:
    """Create a new tag"""
    try:
        db_tag = Tag(
            name=tag.name,
            icon=tag.icon,
            category=tag.category
        )
        db.add(db_tag)
        db.commit()
        db.refresh(db_tag)
        return db_tag
    except SQLAlchemyError as e:
        db.rollback()
        raise e


def get_all_tags(db: Session, skip: int = 0, limit: int = 100) -> List[Tag]:
    """Get all available tags"""
    return db.query(Tag).offset(skip).limit(limit).all()


def get_tag_by_id(db: Session, tag_id: str) -> Optional[Tag]:
    """Get a specific tag by ID"""
    try:
        tag_uuid = uuid.UUID(tag_id)
        return db.query(Tag).filter(Tag.id == tag_uuid).first()
    except ValueError:
        return None


def update_tag(db: Session, tag_id: str, tag: TagUpdate) -> Optional[Tag]:
    """Update a tag"""
    try:
        tag_uuid = uuid.UUID(tag_id)
        db_tag = db.query(Tag).filter(Tag.id == tag_uuid).first()
        
        if not db_tag:
            return None
        
        update_data = tag.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_tag, field, value)
        
        db.commit()
        db.refresh(db_tag)
        return db_tag
    except (ValueError, SQLAlchemyError) as e:
        db.rollback()
        raise e


def delete_tag(db: Session, tag_id: str) -> bool:
    """Delete a tag"""
    try:
        tag_uuid = uuid.UUID(tag_id)
        db_tag = db.query(Tag).filter(Tag.id == tag_uuid).first()
        
        if not db_tag:
            return False
        
        db.delete(db_tag)
        db.commit()
        return True
    except (ValueError, SQLAlchemyError) as e:
        db.rollback()
        raise e


# ============================================================================
# Tour-Tag Association CRUD Operations (v2)
# ============================================================================

def add_tag_to_tour(db: Session, tour_id: str, tag_id: str) -> Optional[TourTag]:
    """Add a tag to a tour"""
    try:
        tour_uuid = uuid.UUID(tour_id)
        tag_uuid = uuid.UUID(tag_id)
        
        # Check if association already exists
        existing = db.query(TourTag).filter(
            TourTag.tour_id == tour_uuid,
            TourTag.tag_id == tag_uuid
        ).first()
        
        if existing:
            return existing
        
        # Verify tour and tag exist
        tour = get_tour_by_id(db, tour_id)
        tag = get_tag_by_id(db, tag_id)
        
        if not tour or not tag:
            return None
        
        db_tour_tag = TourTag(
            tour_id=tour_uuid,
            tag_id=tag_uuid
        )
        db.add(db_tour_tag)
        db.commit()
        db.refresh(db_tour_tag)
        return db_tour_tag
    except (ValueError, SQLAlchemyError) as e:
        db.rollback()
        raise e


def get_tour_tags(db: Session, tour_id: str) -> List[TourTag]:
    """Get all tags for a tour"""
    try:
        tour_uuid = uuid.UUID(tour_id)
        return db.query(TourTag).filter(TourTag.tour_id == tour_uuid).all()
    except ValueError:
        return []


def remove_tag_from_tour(db: Session, tour_id: str, tag_id: str) -> bool:
    """Remove a tag from a tour"""
    try:
        tour_uuid = uuid.UUID(tour_id)
        tag_uuid = uuid.UUID(tag_id)
        
        db_tour_tag = db.query(TourTag).filter(
            TourTag.tour_id == tour_uuid,
            TourTag.tag_id == tag_uuid
        ).first()
        
        if not db_tour_tag:
            return False
        
        db.delete(db_tour_tag)
        db.commit()
        return True
    except (ValueError, SQLAlchemyError) as e:
        db.rollback()
        raise e


# ============================================================================
# MULTILINGUAL TRANSLATION CRUD OPERATIONS
# ============================================================================

def get_tour_translation(db: Session, tour_id: str, language: str):
    """Get tour translation for specific language"""
    from models import TourTranslation
    return db.query(TourTranslation).filter(
        TourTranslation.tour_id == tour_id,
        TourTranslation.language == language
    ).first()

def get_tour_with_translation(db: Session, tour_id: str, language: str = "en"):
    """Get tour with translation in specified language"""
    from models import Tour, TourTranslation
    import json
    
    tour = db.query(Tour).filter(Tour.id == tour_id).first()
    if not tour:
        return None
    
    translation = get_tour_translation(db, tour_id, language)
    if translation:
        # Merge translation fields into tour object
        tour.title = translation.title
        tour.description = translation.description
        tour.location = translation.location
        # Parse includes if it's a JSON string
        if translation.includes:
            try:
                tour.includes = json.loads(translation.includes) if isinstance(translation.includes, str) else translation.includes
            except:
                tour.includes = [translation.includes]
    
    return tour

def get_tours_with_language(db: Session, language: str = "en", tour_type: str = None, skip: int = 0, limit: int = 100):
    """Get all tours with translations in specified language with fallback to default"""
    from models import Tour, TourTranslation, Language
    from sqlalchemy.orm import joinedload
    import json
    
    # Validate that the requested language exists
    requested_language = db.query(Language).filter(Language.code == language).first()
    if not requested_language:
        # If language doesn't exist, use default language
        default_language = db.query(Language).filter(Language.is_default == True).first()
        if default_language:
            language = default_language.code
        else:
            language = "en"  # Ultimate fallback
    
    # Get default language for fallback
    default_language = db.query(Language).filter(Language.is_default == True).first()
    default_lang_code = default_language.code if default_language else "en"
    
    # Build query with optional tour_type filter
    query = db.query(Tour).options(
        joinedload(Tour.translations),
        joinedload(Tour.images)
    )
    
    # Apply tour_type filter if provided
    if tour_type:
        query = query.filter(Tour.tour_type == tour_type)
    
    # Get tours with their translations
    tours = query.offset(skip).limit(limit).all()
    
    # Apply translations to each tour
    result = []
    for tour in tours:
        # Get available languages for this tour
        available_languages = [t.language_code for t in tour.translations]
        
        # Try to get translation in requested language
        translation = next((t for t in tour.translations if t.language_code == language), None)
        is_fallback = False
        
        # If translation not found, fallback to default language
        if not translation:
            translation = next((t for t in tour.translations if t.language_code == default_lang_code), None)
            is_fallback = True
        
        # Apply translation if found
        if translation:
            tour.title = translation.title
            tour.description = translation.description
            tour.location = translation.location
            # Parse includes if it's a JSON string
            if translation.includes:
                try:
                    tour.includes = json.loads(translation.includes) if isinstance(translation.includes, str) else translation.includes
                except:
                    tour.includes = [translation.includes]
        
        # Add metadata to tour object
        tour.available_languages = available_languages
        tour.current_language = language
        tour.is_fallback = is_fallback
        
        result.append(tour)
    
    return result

def create_tour_with_translations(db: Session, tour_data: dict, translations: dict):
    """Create a new tour with translations"""
    from models import Tour, TourTranslation, TourImage
    import uuid
    
    # Create tour with non-translatable fields
    db_tour = Tour(
        id=uuid.uuid4(),
        title=translations['en']['title'],  # Temporary, will be overridden by translation
        description=translations['en']['description'],  # Temporary
        location=translations['en']['location'],  # Temporary
        includes=translations['en'].get('includes', ''),  # Temporary
        base_price=tour_data['price'],
        duration_days=tour_data.get('duration_days', 1),
        duration_description=tour_data['duration'],
        max_participants=tour_data['max_participants'],
        min_participants=tour_data.get('min_participants', 1),
        difficulty_level=tour_data['difficulty_level'],
        available_dates=tour_data.get('available_dates'),
        group_discount_threshold=tour_data.get('group_discount_threshold', 5),
        group_discount_percentage=tour_data.get('group_discount_percentage', 0),
        # Set legacy fields for backward compatibility
        price=tour_data['price'],
        duration=tour_data['duration']
    )
    
    db.add(db_tour)
    db.flush()  # Get the tour ID
    
    # Create translations for both languages
    for lang, trans_data in translations.items():
        db_translation = TourTranslation(
            id=uuid.uuid4(),
            tour_id=db_tour.id,
            language=lang,
            title=trans_data['title'],
            description=trans_data['description'],
            location=trans_data['location'],
            includes=trans_data.get('includes', '')
        )
        db.add(db_translation)
    
    # Add images if provided
    if 'images' in tour_data and tour_data['images']:
        for img_data in tour_data['images']:
            db_image = TourImage(
                id=uuid.uuid4(),
                tour_id=db_tour.id,
                image_url=img_data['image_url'],
                is_main=img_data.get('is_main', False),
                display_order=img_data.get('display_order', 0),
                alt_text=img_data.get('alt_text')
            )
            db.add(db_image)
    
    db.commit()
    db.refresh(db_tour)
    
    return db_tour

def update_tour_translations(db: Session, tour_id: str, translations: dict):
    """Update tour translations"""
    from models import TourTranslation
    
    for lang, trans_data in translations.items():
        translation = get_tour_translation(db, tour_id, lang)
        
        if translation:
            # Update existing translation
            if 'title' in trans_data:
                translation.title = trans_data['title']
            if 'description' in trans_data:
                translation.description = trans_data['description']
            if 'location' in trans_data:
                translation.location = trans_data['location']
            if 'includes' in trans_data:
                translation.includes = trans_data['includes']
        else:
            # Create new translation
            db_translation = TourTranslation(
                id=uuid.uuid4(),
                tour_id=tour_id,
                language=lang,
                title=trans_data['title'],
                description=trans_data['description'],
                location=trans_data['location'],
                includes=trans_data.get('includes', '')
            )
            db.add(db_translation)
    
    db.commit()
    return True


# ============================================================================
# TOUR INFO SECTIONS CRUD OPERATIONS
# ============================================================================

def get_tour_info_sections(db: Session, tour_id: str):
    """Get all information sections for a tour, ordered by display_order"""
    from models import TourInfoSection
    
    return db.query(TourInfoSection).filter(
        TourInfoSection.tour_id == tour_id
    ).order_by(TourInfoSection.display_order).all()

def get_tour_info_section(db: Session, section_id: str):
    """Get a specific tour information section by ID"""
    from models import TourInfoSection
    
    return db.query(TourInfoSection).filter(
        TourInfoSection.id == section_id
    ).first()

def create_tour_info_section(db: Session, tour_id: str, section_data: dict):
    """Create a new tour information section"""
    from models import TourInfoSection
    import uuid
    
    db_section = TourInfoSection(
        id=uuid.uuid4(),
        tour_id=tour_id,
        title_en=section_data['title_en'],
        title_fr=section_data['title_fr'],
        content_en=section_data['content_en'],
        content_fr=section_data['content_fr'],
        display_order=section_data.get('display_order', 0)
    )
    
    db.add(db_section)
    db.commit()
    db.refresh(db_section)
    return db_section

def update_tour_info_section(db: Session, section_id: str, section_data: dict):
    """Update a tour information section"""
    from models import TourInfoSection
    
    db_section = db.query(TourInfoSection).filter(
        TourInfoSection.id == section_id
    ).first()
    
    if not db_section:
        return None
    
    # Update only provided fields
    for field, value in section_data.items():
        if value is not None and hasattr(db_section, field):
            setattr(db_section, field, value)
    
    db.commit()
    db.refresh(db_section)
    return db_section

def delete_tour_info_section(db: Session, section_id: str):
    """Delete a tour information section"""
    from models import TourInfoSection
    
    db_section = db.query(TourInfoSection).filter(
        TourInfoSection.id == section_id
    ).first()
    
    if db_section:
        db.delete(db_section)
        db.commit()
        return True
    return False

def reorder_tour_info_sections(db: Session, tour_id: str, section_orders: list):
    """Reorder tour information sections
    
    Args:
        tour_id: Tour ID
        section_orders: List of dicts with 'id' and 'display_order'
    """
    from models import TourInfoSection
    
    for order_data in section_orders:
        section_id = order_data['id']
        new_order = order_data['display_order']
        
        db.query(TourInfoSection).filter(
            TourInfoSection.id == section_id,
            TourInfoSection.tour_id == tour_id
        ).update({'display_order': new_order})
    
    db.commit()
    return True


# ============================================================================
# LANGUAGE CRUD OPERATIONS
# ============================================================================

def get_all_languages(db: Session, active_only: bool = True) -> List:
    """
    Get all languages, optionally filtered by active status
    
    Args:
        db: Database session
        active_only: If True, return only active languages
    
    Returns:
        List of Language objects sorted by is_default desc, name asc
    """
    from models import Language
    
    query = db.query(Language)
    
    if active_only:
        query = query.filter(Language.is_active == True)
    
    # Sort by is_default descending (default language first), then by name ascending
    return query.order_by(Language.is_default.desc(), Language.name.asc()).all()


def create_language(db: Session, language_data: dict):
    """
    Create a new language
    
    Args:
        db: Database session
        language_data: Dictionary with language data (code, name, native_name, flag_emoji, is_active)
    
    Returns:
        Created Language object
    
    Raises:
        ValueError: If validation fails
        SQLAlchemyError: If database operation fails
    """
    from models import Language
    import re
    
    # Validate code is exactly 2 lowercase letters
    code = language_data.get('code', '').strip()
    if not code:
        raise ValueError("Language code is required")
    if len(code) != 2:
        raise ValueError("Language code must be exactly 2 characters")
    if not re.match(r'^[a-z]{2}$', code):
        raise ValueError("Language code must be exactly 2 lowercase letters")
    
    # Validate required fields
    if not language_data.get('name'):
        raise ValueError("Language name is required")
    if not language_data.get('native_name'):
        raise ValueError("Native name is required")
    if not language_data.get('flag_emoji'):
        raise ValueError("Flag emoji is required")
    
    # Check if language code already exists
    existing = db.query(Language).filter(Language.code == code).first()
    if existing:
        raise ValueError(f"Language code '{code}' already exists")
    
    try:
        db_language = Language(
            code=code,
            name=language_data['name'].strip(),
            native_name=language_data['native_name'].strip(),
            flag_emoji=language_data['flag_emoji'].strip(),
            is_active=language_data.get('is_active', True),
            is_default=False  # New languages are never default
        )
        
        db.add(db_language)
        db.commit()
        db.refresh(db_language)
        return db_language
    except SQLAlchemyError as e:
        db.rollback()
        raise e


def update_language(db: Session, language_id: str, language_data: dict):
    """
    Update an existing language
    
    Args:
        db: Database session
        language_id: UUID string of the language to update
        language_data: Dictionary with updated language data (name, native_name, flag_emoji, is_active)
    
    Returns:
        Updated Language object if found, None otherwise
    
    Raises:
        ValueError: If validation fails
        SQLAlchemyError: If database operation fails
    """
    from models import Language
    
    try:
        language_uuid = uuid.UUID(language_id)
        db_language = db.query(Language).filter(Language.id == language_uuid).first()
        
        if not db_language:
            return None
        
        # Prevent changing code after creation
        if 'code' in language_data:
            raise ValueError("Cannot change language code after creation")
        
        # Prevent deactivating default language
        if 'is_active' in language_data and not language_data['is_active']:
            if db_language.is_default:
                raise ValueError("Cannot deactivate the default language")
        
        # Prevent removing default status if this is the only default language
        if 'is_default' in language_data and not language_data['is_default']:
            if db_language.is_default:
                # Check if there are other default languages
                other_defaults = db.query(Language).filter(
                    Language.is_default == True,
                    Language.id != language_uuid
                ).count()
                if other_defaults == 0:
                    raise ValueError("Cannot remove default status. At least one language must be default")
        
        # Validate is_default constraint (only one default)
        if 'is_default' in language_data and language_data['is_default']:
            # If setting this language as default, unset any other default
            if not db_language.is_default:
                db.query(Language).filter(Language.is_default == True).update({'is_default': False})
        
        # Update only provided fields
        update_fields = ['name', 'native_name', 'flag_emoji', 'is_active', 'is_default']
        for field in update_fields:
            if field in language_data:
                value = language_data[field]
                if isinstance(value, str):
                    value = value.strip()
                setattr(db_language, field, value)
        
        db.commit()
        db.refresh(db_language)
        return db_language
    except ValueError as e:
        db.rollback()
        raise e
    except SQLAlchemyError as e:
        db.rollback()
        raise e


def delete_language(db: Session, language_id: str) -> bool:
    """
    Delete a language
    
    Args:
        db: Database session
        language_id: UUID string of the language to delete
    
    Returns:
        True if language was deleted, False if not found
    
    Raises:
        ValueError: If language is default or has translations
        SQLAlchemyError: If database operation fails
    """
    from models import Language, TourTranslation
    
    try:
        # Convert string to UUID
        try:
            language_uuid = uuid.UUID(language_id)
        except (ValueError, AttributeError) as e:
            raise ValueError(f"Invalid UUID format: {str(e)}")
        
        db_language = db.query(Language).filter(Language.id == language_uuid).first()
        
        if not db_language:
            return False
        
        # Check if language is default
        if db_language.is_default:
            raise ValueError("Cannot delete the default language")
        
        # Check if tours have translations in this language
        translation_count = db.query(TourTranslation).filter(
            TourTranslation.language_code == db_language.code
        ).count()
        
        if translation_count > 0:
            raise ValueError(
                f"Cannot delete language '{db_language.code}'. "
                f"{translation_count} tour(s) have translations in this language."
            )
        
        # Delete the language
        db.delete(db_language)
        db.commit()
        return True
    except ValueError as e:
        # Don't rollback for ValueError (validation errors)
        raise e
    except SQLAlchemyError as e:
        db.rollback()
        raise e


def get_tour_available_languages(db: Session, tour_id: str) -> List[str]:
    """
    Get list of language codes that have translations for a specific tour
    
    Args:
        db: Database session
        tour_id: UUID string of the tour
    
    Returns:
        List of language codes (e.g., ['en', 'fr', 'es'])
    """
    from models import TourTranslation
    
    try:
        tour_uuid = uuid.UUID(tour_id)
        
        # Query distinct language_code values for this tour
        language_codes = db.query(TourTranslation.language_code).filter(
            TourTranslation.tour_id == tour_uuid
        ).distinct().all()
        
        # Extract language codes from query result tuples
        return [code[0] for code in language_codes]
    except ValueError:
        # Invalid UUID format
        return []


def get_tour_with_dynamic_language(db: Session, tour_id: str, language: str = "en"):
    """
    Get tour with translation in specified language with dynamic language support
    
    Args:
        db: Database session
        tour_id: UUID string of the tour
        language: Language code (e.g., 'en', 'fr', 'es')
    
    Returns:
        Tour object with translation applied, or None if tour not found
        Adds metadata: available_languages, current_language, is_fallback
    """
    from models import Tour, TourTranslation, Language
    from sqlalchemy.orm import joinedload
    from sqlalchemy import inspect
    import json
    
    try:
        tour_uuid = uuid.UUID(tour_id)
    except ValueError:
        return None
    
    # Get the tour with relationships
    tour = db.query(Tour).options(
        joinedload(Tour.translations),
        joinedload(Tour.images)
    ).filter(Tour.id == tour_uuid).first()
    
    if not tour:
        return None
    
    # Check if we're using the new schema (language_code) or old schema (language)
    # by inspecting the TourTranslation model columns
    inspector = inspect(TourTranslation)
    column_names = [c.key for c in inspector.columns]
    use_new_schema = 'language_code' in column_names
    lang_field = 'language_code' if use_new_schema else 'language'
    
    # Store the originally requested language for fallback detection
    requested_lang = language
    
    # Validate that the requested language exists (only if using new schema with Language table)
    if use_new_schema:
        requested_language = db.query(Language).filter(Language.code == language).first()
        if not requested_language:
            # If language doesn't exist, use default language
            default_language = db.query(Language).filter(Language.is_default == True).first()
            if default_language:
                language = default_language.code
            else:
                language = "en"  # Ultimate fallback
        
        # Get default language for fallback
        default_language = db.query(Language).filter(Language.is_default == True).first()
        default_lang_code = default_language.code if default_language else "en"
    else:
        # Old schema: just use 'en' as default
        default_lang_code = "en"
    
    # Get available languages for this tour
    available_languages = [getattr(t, lang_field) for t in tour.translations]
    
    # Try to get translation in requested language
    translation = next((t for t in tour.translations if getattr(t, lang_field) == language), None)
    is_fallback = False
    actual_language = language
    
    # If translation not found, fallback to default language
    if not translation:
        translation = next((t for t in tour.translations if getattr(t, lang_field) == default_lang_code), None)
        is_fallback = True
        actual_language = default_lang_code  # Update to reflect actual language used
    
    # Also mark as fallback if the requested language was changed due to not existing
    if requested_lang != language:
        is_fallback = True
    
    # Apply translation if found
    if translation:
        tour.title = translation.title
        tour.description = translation.description
        tour.location = translation.location
        # Parse includes if it's a JSON string
        if translation.includes:
            try:
                tour.includes = json.loads(translation.includes) if isinstance(translation.includes, str) else translation.includes
            except:
                tour.includes = [translation.includes]
    
    # Add metadata to tour object
    tour.available_languages = available_languages
    tour.current_language = actual_language  # Use actual language, not requested
    tour.is_fallback = is_fallback
    
    return tour
