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
from schemas import BookingResponse, BookingRequest, BookingUpdate, PriceCalculationRequest
from schemas_v2 import BookingRequestV2, PriceCalculationRequestV2
from crud import (
    get_bookings,
    get_booking_by_id,
    create_booking,
    create_booking_with_pricing,
    update_booking,
    delete_booking
)
from services.tours_client import ToursClient
from services.messaging_client import MessagingClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Booking & Reservation Service",
    description="Microservice for managing tour bookings and reservations",
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

# Initialize service clients
tours_client = ToursClient()
messaging_client = MessagingClient()

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
            "details": None
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
    return {"status": "healthy", "service": "booking-service"}

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "Booking & Reservation Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "bookings": "/bookings"
        }
    }

# Booking endpoints
@app.get("/bookings", response_model=List[BookingResponse])
async def list_bookings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get list of all bookings with pagination (admin only)"""
    bookings = get_bookings(db, skip=skip, limit=limit)
    return bookings

@app.get("/bookings/{booking_id}", response_model=BookingResponse)
async def get_booking_details(booking_id: str, db: Session = Depends(get_db)):
    """Get detailed information about a specific booking"""
    booking = get_booking_by_id(db, booking_id=booking_id)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking

@app.post("/bookings", response_model=BookingResponse)
async def create_new_booking(booking: BookingRequest, db: Session = Depends(get_db)):
    """Create a new booking"""
    try:
        # Verify tour exists
        tour = await tours_client.get_tour(booking.tour_id)
        if not tour:
            raise HTTPException(status_code=404, detail="Tour not found")
        
        # Create booking with proper pricing
        db_booking = await create_booking_with_pricing(db=db, booking=booking)
        
        # Send notification (async, don't wait for response)
        try:
            await messaging_client.send_booking_notification(db_booking, tour)
        except Exception as e:
            logger.warning(f"Failed to send notification for booking {db_booking.id}: {str(e)}")
            # Don't fail the booking if notification fails
        
        return db_booking
    except SQLAlchemyError as e:
        logger.error(f"Error creating booking: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create booking. Please try again."
        )

@app.put("/bookings/{booking_id}", response_model=BookingResponse)
async def update_existing_booking(booking_id: str, booking: BookingUpdate, db: Session = Depends(get_db)):
    """Update an existing booking (admin only)"""
    try:
        # Get the original booking to check if status changed
        original_booking = get_booking_by_id(db, booking_id)
        if original_booking is None:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        original_status = original_booking.status
        
        # Update the booking
        db_booking = update_booking(db=db, booking_id=booking_id, booking=booking)
        if db_booking is None:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Send notification if status changed
        if booking.status and booking.status != original_status:
            try:
                # Get tour information for the notification
                tour = await tours_client.get_tour(db_booking.tour_id)
                if tour:
                    await messaging_client.send_booking_update_notification(db_booking, tour)
                    logger.info(f"Status change notification sent for booking {booking_id}: {original_status} -> {booking.status}")
            except Exception as e:
                logger.warning(f"Failed to send status change notification for booking {booking_id}: {str(e)}")
                # Don't fail the update if notification fails
        
        return db_booking
    except SQLAlchemyError as e:
        logger.error(f"Error updating booking {booking_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update booking. Please try again."
        )

@app.delete("/bookings/{booking_id}")
async def delete_existing_booking(booking_id: str, db: Session = Depends(get_db)):
    """Delete a booking (admin only)"""
    try:
        success = delete_booking(db=db, booking_id=booking_id)
        if not success:
            raise HTTPException(status_code=404, detail="Booking not found")
        return {"message": "Booking deleted successfully"}
    except SQLAlchemyError as e:
        logger.error(f"Error deleting booking {booking_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete booking. Please try again."
        )

@app.patch("/bookings/{booking_id}/mark-viewed")
async def mark_booking_as_viewed(booking_id: str, db: Session = Depends(get_db)):
    """Mark a booking as viewed by admin"""
    try:
        booking_update = BookingUpdate(admin_viewed=True)
        db_booking = update_booking(db=db, booking_id=booking_id, booking=booking_update)
        if db_booking is None:
            raise HTTPException(status_code=404, detail="Booking not found")
        return {"message": "Booking marked as viewed"}
    except SQLAlchemyError as e:
        logger.error(f"Error marking booking {booking_id} as viewed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to mark booking as viewed. Please try again."
        )

# Price calculation endpoint
@app.post("/bookings/calculate-price")
async def calculate_booking_price(request: PriceCalculationRequest, db: Session = Depends(get_db)):
    """Calculate price for a booking with seasonal and group discounts"""
    from schemas import PriceCalculationRequest, PriceCalculationResponse
    from services.pricing_service import pricing_service
    
    try:
        price_info = await pricing_service.calculate_price(request, db)
        return price_info
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error calculating price: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to calculate price. Please try again."
        )

# Availability check endpoint
@app.post("/bookings/check-availability")
async def check_booking_availability(request: PriceCalculationRequest, db: Session = Depends(get_db)):
    """Check availability for a tour booking"""
    from schemas import PriceCalculationRequest
    from services.pricing_service import pricing_service
    from datetime import datetime
    
    try:
        # Parse dates
        start_date = datetime.strptime(str(request.start_date), '%Y-%m-%d').date() if isinstance(request.start_date, str) else request.start_date
        end_date = datetime.strptime(str(request.end_date), '%Y-%m-%d').date() if isinstance(request.end_date, str) else request.end_date
        
        availability = await pricing_service.check_availability(
            request.tour_id,
            start_date,
            end_date,
            request.number_of_participants
        )
        return availability
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error checking availability: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to check availability. Please try again."
        )

@app.post("/bookings/{booking_id}/complete")
async def complete_booking(booking_id: str, db: Session = Depends(get_db)):
    """Mark booking as completed and send review request"""
    try:
        # Get the booking
        booking = get_booking_by_id(db, booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Check if booking is confirmed
        if booking.status != "confirmed":
            raise HTTPException(status_code=400, detail="Only confirmed bookings can be completed")
        
        # Update booking status to completed
        from schemas import BookingUpdate
        booking_update = BookingUpdate(status="completed")
        updated_booking = update_booking(db=db, booking_id=booking_id, booking=booking_update)
        
        if not updated_booking:
            raise HTTPException(status_code=500, detail="Failed to update booking status")
        
        # Get tour information
        tour = await tours_client.get_tour(str(booking.tour_id))
        if not tour:
            logger.warning(f"Tour not found for booking {booking_id}")
            return {"message": "Booking completed but tour not found for review request"}
        
        # Create review token
        try:
            review_token = await tours_client.create_review_token(
                booking_id=booking_id,
                tour_id=str(booking.tour_id),
                customer_name=booking.customer_name,
                customer_email=booking.email
            )
            
            if review_token:
                # Send review request email
                try:
                    await messaging_client.send_review_request(
                        booking=updated_booking,
                        tour_data=tour,
                        review_token=review_token
                    )
                    logger.info(f"Review request sent for booking {booking_id}")
                except Exception as e:
                    logger.warning(f"Failed to send review request email for booking {booking_id}: {str(e)}")
                
                return {
                    "message": "Booking completed and review request sent",
                    "review_token": review_token
                }
            else:
                logger.warning(f"Failed to create review token for booking {booking_id}")
                return {"message": "Booking completed but failed to create review request"}
                
        except Exception as e:
            logger.error(f"Error creating review token for booking {booking_id}: {str(e)}")
            return {"message": "Booking completed but failed to create review request"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing booking {booking_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to complete booking. Please try again."
        )

# ============================================================================
# V2 Booking Endpoints (Single Date + Group Pricing)
# ============================================================================

@app.post("/v2/bookings/calculate-price")
async def calculate_booking_price_v2(request: PriceCalculationRequestV2, db: Session = Depends(get_db)):
    """Calculate price for a booking with automatic end date and group pricing"""
    from services.pricing_service import pricing_service
    from datetime import timedelta
    
    try:
        # Get tour to determine duration
        tour = await tours_client.get_tour(request.tour_id)
        if not tour:
            raise HTTPException(status_code=404, detail="Tour not found")
        
        # Calculate end date based on tour duration
        duration_days = tour.get('duration_days', 1)
        end_date = request.start_date + timedelta(days=duration_days)
        
        # Get group pricing from tours service
        try:
            group_price = await tours_client.calculate_group_price(
                request.tour_id,
                request.number_of_participants
            )
            base_price = group_price.get('price_per_person', tour.get('price', 0))
        except Exception as e:
            logger.warning(f"Failed to get group pricing, using base price: {str(e)}")
            base_price = tour.get('price', 0)
        
        # Get seasonal pricing
        try:
            seasonal_pricing = await tours_client.get_seasonal_pricing(
                request.tour_id,
                request.start_date.isoformat(),
                end_date.isoformat()
            )
            multiplier = seasonal_pricing.get('multiplier', 1.0)
        except Exception as e:
            logger.warning(f"Failed to get seasonal pricing, using 1.0: {str(e)}")
            multiplier = 1.0
        
        # Calculate final price
        price_per_person = float(base_price) * multiplier
        total_price = price_per_person * request.number_of_participants
        
        return {
            "tour_id": request.tour_id,
            "start_date": request.start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "duration_days": duration_days,
            "number_of_participants": request.number_of_participants,
            "base_price_per_person": float(base_price),
            "seasonal_multiplier": multiplier,
            "final_price_per_person": price_per_person,
            "total_price": total_price,
            "currency": "MAD"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating price v2: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to calculate price. Please try again."
        )


@app.post("/v2/bookings", response_model=BookingResponse)
async def create_booking_v2(booking: BookingRequestV2, db: Session = Depends(get_db)):
    """Create a new booking with automatic end date calculation and group pricing"""
    try:
        # Get tour to determine duration
        tour = await tours_client.get_tour(booking.tour_id)
        if not tour:
            raise HTTPException(status_code=404, detail="Tour not found")
        
        # Calculate end date based on tour duration
        from datetime import timedelta
        duration_days = tour.get('duration_days', 1)
        end_date = booking.start_date + timedelta(days=duration_days)
        
        # Calculate price with group pricing
        price_calc = PriceCalculationRequestV2(
            tour_id=booking.tour_id,
            start_date=booking.start_date,
            number_of_participants=booking.number_of_participants
        )
        price_info = await calculate_booking_price_v2(price_calc, db)
        
        # Convert v2 booking to v1 format for storage
        booking_v1 = BookingRequest(
            tour_id=booking.tour_id,
            customer_name=booking.customer_name,
            email=booking.email,
            phone=booking.phone,
            start_date=booking.start_date,
            end_date=end_date,
            number_of_participants=booking.number_of_participants,
            special_requests=booking.special_requests,
            total_price=price_info['total_price']
        )
        
        # Create booking
        db_booking = await create_booking_with_pricing(db=db, booking=booking_v1)
        
        # Send notification
        try:
            await messaging_client.send_booking_notification(db_booking, tour)
        except Exception as e:
            logger.warning(f"Failed to send notification for booking {db_booking.id}: {str(e)}")
        
        return db_booking
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating booking v2: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create booking. Please try again."
        )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8020)