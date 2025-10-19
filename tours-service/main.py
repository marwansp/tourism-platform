from fastapi import FastAPI, HTTPException, Depends, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List
import uvicorn
import logging

from database import get_db, engine
from models import Base
from schemas import (
    TourResponse, TourDetailResponse, TourCreate, TourUpdate, 
    TourReviewCreate, TourReviewResponse,
    TourGroupPricingCreate, TourGroupPricingUpdate, TourGroupPricingResponse,
    TagCreate, TagUpdate, TagResponse,
    TourTagCreate, TourTagResponse,
    TourCreateWithTranslations, TourTranslationResponse,
    TourInfoSectionCreate, TourInfoSectionUpdate, TourInfoSectionResponse
)
from crud import (
    get_tours,
    get_tour_by_id,
    create_tour,
    update_tour,
    delete_tour,
    submit_review,
    get_review_by_token,
    get_tour_reviews,
    get_tour_rating_stats,
    create_review_token,
    # Group pricing
    create_group_pricing,
    get_tour_group_pricing,
    update_group_pricing,
    delete_group_pricing,
    calculate_group_price,
    # Tags
    create_tag,
    get_all_tags,
    get_tag_by_id,
    update_tag,
    delete_tag,
    # Tour-Tag associations
    add_tag_to_tour,
    get_tour_tags,
    remove_tag_from_tour
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Tours & Packages Service",
    description="Microservice for managing tour packages and travel experiences",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler for SQLAlchemy errors
@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """Handle database errors globally"""
    logger.error(f"Database error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Database Error",
            "message": "An error occurred while processing your request",
            "details": None  # Don't expose internal error details
        }
    )

# Global exception handler for validation errors
@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """Handle validation errors"""
    logger.error(f"Validation error: {str(exc)}")
    return JSONResponse(
        status_code=400,
        content={
            "error": "Validation Error",
            "message": str(exc),
            "details": None
        }
    )

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for container monitoring"""
    return {"status": "healthy", "service": "tours-service"}

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "Tours & Packages Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "tours": "/tours"
        }
    }

# Tours endpoints
@app.get("/tours", response_model=List[TourResponse])
async def list_tours(
    lang: str = Query("en", pattern="^(en|fr)$", description="Language code: en or fr"),
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """Get list of all tours with translations in specified language"""
    from crud import get_tours_with_language
    tours = get_tours_with_language(db, language=lang, skip=skip, limit=limit)
    return tours

@app.get("/tours/{tour_id}", response_model=TourDetailResponse)
async def get_tour_details(
    tour_id: str,
    lang: str = Query("en", pattern="^(en|fr)$", description="Language code: en or fr"),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific tour with reviews and translation"""
    from crud import get_tour_with_translation
    tour = get_tour_with_translation(db, tour_id=tour_id, language=lang)
    if tour is None:
        raise HTTPException(status_code=404, detail="Tour not found")
    
    # Get reviews and rating stats
    reviews = get_tour_reviews(db, tour_id)
    rating_stats = get_tour_rating_stats(db, tour_id)
    
    # Convert to response format
    tour_dict = {
        "id": str(tour.id),
        "title": tour.title,
        "description": tour.description,
        "price": tour.base_price or tour.price,
        "duration": tour.duration_description or tour.duration,
        "location": tour.location,
        "max_participants": tour.max_participants,
        "difficulty_level": tour.difficulty_level,
        "includes": tour.includes,
        "available_dates": tour.available_dates,
        "created_at": tour.created_at,
        "updated_at": tour.updated_at,
        "images": tour.images,
        "reviews": reviews,
        "average_rating": rating_stats['average_rating'],
        "total_reviews": rating_stats['total_reviews']
    }
    
    return tour_dict

@app.post("/tours", response_model=TourResponse)
async def create_new_tour(tour: TourCreate, db: Session = Depends(get_db)):
    """Create a new tour (admin only - legacy endpoint)"""
    try:
        return create_tour(db=db, tour=tour)
    except SQLAlchemyError as e:
        logger.error(f"Error creating tour: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create tour. Please try again."
        )

@app.post("/tours/multilingual", response_model=TourResponse)
async def create_multilingual_tour(tour_data: TourCreateWithTranslations, db: Session = Depends(get_db)):
    """Create a new tour with multilingual support (admin only)"""
    try:
        from crud import create_tour_with_translations
        
        # Extract non-translatable fields
        tour_fields = {
            'price': tour_data.price,
            'duration': tour_data.duration,
            'max_participants': tour_data.max_participants,
            'difficulty_level': tour_data.difficulty_level,
            'available_dates': tour_data.available_dates,
            'images': [img.dict() for img in tour_data.images] if tour_data.images else []
        }
        
        # Create tour with translations
        tour = create_tour_with_translations(
            db=db, 
            tour_data=tour_fields, 
            translations=tour_data.translations
        )
        
        # Return tour with English translation by default
        from crud import get_tour_with_translation
        return get_tour_with_translation(db, str(tour.id), "en")
        
    except Exception as e:
        logger.error(f"Error creating multilingual tour: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/tours/{tour_id}", response_model=TourResponse)
async def update_existing_tour(tour_id: str, tour: TourUpdate, db: Session = Depends(get_db)):
    """Update an existing tour (admin only)"""
    try:
        db_tour = update_tour(db=db, tour_id=tour_id, tour=tour)
        if db_tour is None:
            raise HTTPException(status_code=404, detail="Tour not found")
        return db_tour
    except SQLAlchemyError as e:
        logger.error(f"Error updating tour {tour_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update tour. Please try again."
        )

@app.delete("/tours/{tour_id}")
async def delete_existing_tour(tour_id: str, db: Session = Depends(get_db)):
    """Delete a tour (admin only)"""
    try:
        success = delete_tour(db=db, tour_id=tour_id)
        if not success:
            raise HTTPException(status_code=404, detail="Tour not found")
        return {"message": "Tour deleted successfully"}
    except SQLAlchemyError as e:
        logger.error(f"Error deleting tour {tour_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete tour. Please try again."
        )

# Pricing and availability endpoints
@app.get("/tours/{tour_id}/seasonal-pricing")
async def get_seasonal_pricing(
    tour_id: str, 
    start_date: str, 
    end_date: str, 
    db: Session = Depends(get_db)
):
    """Get seasonal pricing for a tour within date range"""
    from datetime import datetime
    from crud import get_seasonal_pricing_for_dates
    
    try:
        start = datetime.strptime(start_date, '%Y-%m-%d').date()
        end = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        pricing = get_seasonal_pricing_for_dates(db, tour_id, start, end)
        return pricing
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        logger.error(f"Error getting seasonal pricing: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get pricing information")

@app.get("/tours/{tour_id}/availability")
async def check_tour_availability(
    tour_id: str,
    start_date: str,
    end_date: str,
    participants: int,
    db: Session = Depends(get_db)
):
    """Check tour availability for given dates and participant count"""
    from datetime import datetime
    from crud import check_tour_availability_for_dates
    
    try:
        start = datetime.strptime(start_date, '%Y-%m-%d').date()
        end = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        availability = check_tour_availability_for_dates(db, tour_id, start, end, participants)
        return availability
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        logger.error(f"Error checking availability: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to check availability")

# Review endpoints
@app.get("/reviews/form/{token}")
async def get_review_form(token: str, db: Session = Depends(get_db)):
    """Get review form data using token (for displaying review form)"""
    review = get_review_by_token(db, token)
    if not review:
        raise HTTPException(status_code=404, detail="Review token not found or expired")
    
    # Get tour details for the review form
    tour = get_tour_by_id(db, str(review.tour_id))
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    
    return {
        "tour_id": str(review.tour_id),
        "tour_title": tour.title,
        "customer_name": review.customer_name,
        "customer_email": review.customer_email,
        "booking_id": str(review.booking_id),
        "already_submitted": review.is_verified and review.rating > 0
    }

@app.post("/reviews/submit/{token}", response_model=TourReviewResponse)
async def submit_tour_review(token: str, review: TourReviewCreate, db: Session = Depends(get_db)):
    """Submit a review using the review token"""
    try:
        db_review = submit_review(db, token, review)
        if not db_review:
            raise HTTPException(status_code=404, detail="Review token not found or expired")
        
        return db_review
    except SQLAlchemyError as e:
        logger.error(f"Error submitting review: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to submit review")

@app.get("/tours/{tour_id}/reviews", response_model=List[TourReviewResponse])
async def get_tour_reviews_endpoint(tour_id: str, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """Get all reviews for a specific tour"""
    reviews = get_tour_reviews(db, tour_id, skip=skip, limit=limit)
    return reviews

@app.get("/tours/{tour_id}/rating-stats")
async def get_tour_rating_stats_endpoint(tour_id: str, db: Session = Depends(get_db)):
    """Get rating statistics for a tour"""
    stats = get_tour_rating_stats(db, tour_id)
    return stats

@app.post("/reviews/create-token")
async def create_review_token_endpoint(
    request: dict,
    db: Session = Depends(get_db)
):
    """Create a review token for a booking"""
    try:
        token = create_review_token(
            db=db,
            booking_id=request["booking_id"],
            tour_id=request["tour_id"],
            customer_name=request["customer_name"],
            customer_email=request["customer_email"]
        )
        
        if not token:
            raise HTTPException(status_code=400, detail="Failed to create review token")
        
        return {"token": token}
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing required field: {str(e)}")
    except Exception as e:
        logger.error(f"Error creating review token: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create review token")


# ============================================================================
# Group Pricing Endpoints (v2)
# ============================================================================

@app.post("/tours/{tour_id}/group-pricing", response_model=TourGroupPricingResponse)
async def create_tour_group_pricing(
    tour_id: str,
    pricing: TourGroupPricingCreate,
    db: Session = Depends(get_db)
):
    """Create a group pricing tier for a tour"""
    try:
        db_pricing = create_group_pricing(db, tour_id, pricing)
        if not db_pricing:
            raise HTTPException(status_code=404, detail="Tour not found")
        return db_pricing
    except SQLAlchemyError as e:
        logger.error(f"Error creating group pricing: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create group pricing")


@app.get("/tours/{tour_id}/group-pricing", response_model=List[TourGroupPricingResponse])
async def get_tour_group_pricing_endpoint(tour_id: str, db: Session = Depends(get_db)):
    """Get all group pricing tiers for a tour"""
    pricing = get_tour_group_pricing(db, tour_id)
    return pricing


@app.put("/group-pricing/{pricing_id}", response_model=TourGroupPricingResponse)
async def update_tour_group_pricing(
    pricing_id: str,
    pricing: TourGroupPricingUpdate,
    db: Session = Depends(get_db)
):
    """Update a group pricing tier"""
    try:
        db_pricing = update_group_pricing(db, pricing_id, pricing)
        if not db_pricing:
            raise HTTPException(status_code=404, detail="Group pricing not found")
        return db_pricing
    except SQLAlchemyError as e:
        logger.error(f"Error updating group pricing: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update group pricing")


@app.delete("/group-pricing/{pricing_id}")
async def delete_tour_group_pricing(pricing_id: str, db: Session = Depends(get_db)):
    """Delete a group pricing tier"""
    try:
        success = delete_group_pricing(db, pricing_id)
        if not success:
            raise HTTPException(status_code=404, detail="Group pricing not found")
        return {"message": "Group pricing deleted successfully"}
    except SQLAlchemyError as e:
        logger.error(f"Error deleting group pricing: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete group pricing")


@app.get("/tours/{tour_id}/calculate-price")
async def calculate_tour_price(
    tour_id: str,
    participants: int,
    db: Session = Depends(get_db)
):
    """Calculate total price based on group size"""
    result = calculate_group_price(db, tour_id, participants)
    if 'error' in result:
        raise HTTPException(status_code=404, detail=result['error'])
    return result


# ============================================================================
# Tag Endpoints (v2)
# ============================================================================

@app.post("/tags", response_model=TagResponse)
async def create_new_tag(tag: TagCreate, db: Session = Depends(get_db)):
    """Create a new tag"""
    try:
        return create_tag(db, tag)
    except SQLAlchemyError as e:
        logger.error(f"Error creating tag: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create tag")


@app.get("/tags", response_model=List[TagResponse])
async def list_all_tags(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all available tags"""
    return get_all_tags(db, skip=skip, limit=limit)


@app.get("/tags/{tag_id}", response_model=TagResponse)
async def get_tag(tag_id: str, db: Session = Depends(get_db)):
    """Get a specific tag"""
    tag = get_tag_by_id(db, tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag


@app.put("/tags/{tag_id}", response_model=TagResponse)
async def update_existing_tag(tag_id: str, tag: TagUpdate, db: Session = Depends(get_db)):
    """Update a tag"""
    try:
        db_tag = update_tag(db, tag_id, tag)
        if not db_tag:
            raise HTTPException(status_code=404, detail="Tag not found")
        return db_tag
    except SQLAlchemyError as e:
        logger.error(f"Error updating tag: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update tag")


@app.delete("/tags/{tag_id}")
async def delete_existing_tag(tag_id: str, db: Session = Depends(get_db)):
    """Delete a tag"""
    try:
        success = delete_tag(db, tag_id)
        if not success:
            raise HTTPException(status_code=404, detail="Tag not found")
        return {"message": "Tag deleted successfully"}
    except SQLAlchemyError as e:
        logger.error(f"Error deleting tag: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete tag")


# ============================================================================
# Tour-Tag Association Endpoints (v2)
# ============================================================================

@app.post("/tours/{tour_id}/tags", response_model=TourTagResponse)
async def add_tag_to_tour_endpoint(
    tour_id: str,
    tag_data: TourTagCreate,
    db: Session = Depends(get_db)
):
    """Add a tag to a tour"""
    try:
        tour_tag = add_tag_to_tour(db, tour_id, tag_data.tag_id)
        if not tour_tag:
            raise HTTPException(status_code=404, detail="Tour or tag not found")
        return tour_tag
    except SQLAlchemyError as e:
        logger.error(f"Error adding tag to tour: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to add tag to tour")


@app.get("/tours/{tour_id}/tags", response_model=List[TourTagResponse])
async def get_tour_tags_endpoint(tour_id: str, db: Session = Depends(get_db)):
    """Get all tags for a tour"""
    return get_tour_tags(db, tour_id)


@app.delete("/tours/{tour_id}/tags/{tag_id}")
async def remove_tag_from_tour_endpoint(
    tour_id: str,
    tag_id: str,
    db: Session = Depends(get_db)
):
    """Remove a tag from a tour"""
    try:
        success = remove_tag_from_tour(db, tour_id, tag_id)
        if not success:
            raise HTTPException(status_code=404, detail="Tour-tag association not found")
        return {"message": "Tag removed from tour successfully"}
    except SQLAlchemyError as e:
        logger.error(f"Error removing tag from tour: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to remove tag from tour")


# ============================================================================
# TOUR INFO SECTIONS ENDPOINTS
# ============================================================================

@app.get("/tours/{tour_id}/info-sections", response_model=List[TourInfoSectionResponse])
async def get_tour_info_sections_endpoint(tour_id: str, db: Session = Depends(get_db)):
    """Get all information sections for a tour"""
    try:
        from crud import get_tour_info_sections
        sections = get_tour_info_sections(db, tour_id)
        return sections
    except Exception as e:
        logger.error(f"Error fetching tour info sections: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch tour information sections")

@app.post("/tours/{tour_id}/info-sections", response_model=TourInfoSectionResponse)
async def create_tour_info_section_endpoint(
    tour_id: str, 
    section: TourInfoSectionCreate, 
    db: Session = Depends(get_db)
):
    """Create a new information section for a tour"""
    try:
        from crud import create_tour_info_section, get_tour_by_id
        
        # Verify tour exists
        tour = get_tour_by_id(db, tour_id)
        if not tour:
            raise HTTPException(status_code=404, detail="Tour not found")
        
        section_data = section.dict()
        db_section = create_tour_info_section(db, tour_id, section_data)
        return db_section
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating tour info section: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create tour information section")

@app.put("/info-sections/{section_id}", response_model=TourInfoSectionResponse)
async def update_tour_info_section_endpoint(
    section_id: str, 
    section: TourInfoSectionUpdate, 
    db: Session = Depends(get_db)
):
    """Update a tour information section"""
    try:
        from crud import update_tour_info_section
        
        section_data = section.dict(exclude_unset=True)
        db_section = update_tour_info_section(db, section_id, section_data)
        
        if not db_section:
            raise HTTPException(status_code=404, detail="Tour information section not found")
        
        return db_section
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating tour info section: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update tour information section")

@app.delete("/info-sections/{section_id}")
async def delete_tour_info_section_endpoint(section_id: str, db: Session = Depends(get_db)):
    """Delete a tour information section"""
    try:
        from crud import delete_tour_info_section
        
        success = delete_tour_info_section(db, section_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Tour information section not found")
        
        return {"message": "Tour information section deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting tour info section: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete tour information section")

@app.post("/tours/{tour_id}/info-sections/reorder")
async def reorder_tour_info_sections_endpoint(
    tour_id: str,
    section_orders: List[dict],
    db: Session = Depends(get_db)
):
    """Reorder tour information sections
    
    Body should be: [{"id": "section_id", "display_order": 0}, ...]
    """
    try:
        from crud import reorder_tour_info_sections, get_tour_by_id
        
        # Verify tour exists
        tour = get_tour_by_id(db, tour_id)
        if not tour:
            raise HTTPException(status_code=404, detail="Tour not found")
        
        success = reorder_tour_info_sections(db, tour_id, section_orders)
        
        if success:
            return {"message": "Tour information sections reordered successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to reorder sections")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reordering tour info sections: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to reorder tour information sections")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8010)