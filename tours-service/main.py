from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List
import uvicorn
import logging

from database import get_db, engine
from models import Base
from schemas import TourResponse, TourDetailResponse, TourCreate, TourUpdate, TourReviewCreate, TourReviewResponse
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
    create_review_token
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
async def list_tours(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get list of all tours with pagination"""
    tours = get_tours(db, skip=skip, limit=limit)
    return tours

@app.get("/tours/{tour_id}", response_model=TourDetailResponse)
async def get_tour_details(tour_id: str, db: Session = Depends(get_db)):
    """Get detailed information about a specific tour with reviews"""
    tour = get_tour_by_id(db, tour_id=tour_id)
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
    """Create a new tour (admin only)"""
    try:
        return create_tour(db=db, tour=tour)
    except SQLAlchemyError as e:
        logger.error(f"Error creating tour: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create tour. Please try again."
        )

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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8010)