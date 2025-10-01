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
from schemas import EmailRequest, NotificationResponse, NotificationCreate
from crud import (
    get_notifications,
    get_notification_by_id,
    create_notification,
    update_notification_status
)
from services.email_service import EmailService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Messaging & Notification Service",
    description="Microservice for sending email notifications and managing communication",
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

# Initialize email service
email_service = EmailService()

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
    return {"status": "healthy", "service": "messaging-service"}

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "Messaging & Notification Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "notify": "/notify",
            "notifications": "/notifications"
        }
    }

# Email notification endpoint
@app.post("/notify/email")
async def send_email_notification(email_request: EmailRequest, db: Session = Depends(get_db)):
    """Send email notification"""
    try:
        # Create notification record
        notification_data = NotificationCreate(
            type="email",
            recipient=email_request.to,
            subject=email_request.subject,
            message=email_request.get_message_content(),
            status="pending"
        )
        
        db_notification = create_notification(db=db, notification=notification_data)
        
        # Send email
        success = await email_service.send_email(
            to=email_request.to,
            subject=email_request.subject,
            template=email_request.template,
            data=email_request.data
        )
        
        # Update notification status
        new_status = "sent" if success else "failed"
        update_notification_status(db=db, notification_id=str(db_notification.id), status=new_status)
        
        if success:
            return {"message": "Email sent successfully", "notification_id": str(db_notification.id)}
        else:
            raise HTTPException(status_code=500, detail="Failed to send email")
            
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        # Update notification status to failed if it was created
        if 'db_notification' in locals():
            update_notification_status(db=db, notification_id=str(db_notification.id), status="failed")
        raise HTTPException(status_code=500, detail="Failed to send email notification")

# Get notifications endpoint (for debugging and monitoring)
@app.get("/notifications", response_model=List[NotificationResponse])
async def list_notifications(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get list of all notifications with pagination"""
    notifications = get_notifications(db, skip=skip, limit=limit)
    return notifications

@app.get("/notifications/{notification_id}", response_model=NotificationResponse)
async def get_notification_details(notification_id: str, db: Session = Depends(get_db)):
    """Get detailed information about a specific notification"""
    notification = get_notification_by_id(db, notification_id=notification_id)
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification

# Contact form endpoint
@app.post("/contact")
async def send_contact_message(email_request: EmailRequest, db: Session = Depends(get_db)):
    """Send contact form message to admin"""
    try:
        # Override recipient to admin email for contact forms
        admin_email = email_service.get_admin_email()
        
        # Create notification record
        notification_data = NotificationCreate(
            type="email",
            recipient=admin_email,
            subject=f"Contact Form: {email_request.subject}",
            message=email_request.get_message_content(),
            status="pending"
        )
        
        db_notification = create_notification(db=db, notification=notification_data)
        
        # Send email to admin
        success = await email_service.send_email(
            to=admin_email,
            subject=f"Contact Form: {email_request.subject}",
            template="contact_form",
            data=email_request.data
        )
        
        # Update notification status
        new_status = "sent" if success else "failed"
        update_notification_status(db=db, notification_id=str(db_notification.id), status=new_status)
        
        if success:
            return {"message": "Contact message sent successfully", "notification_id": str(db_notification.id)}
        else:
            raise HTTPException(status_code=500, detail="Failed to send contact message")
            
    except Exception as e:
        logger.error(f"Error sending contact message: {str(e)}")
        if 'db_notification' in locals():
            update_notification_status(db=db, notification_id=str(db_notification.id), status="failed")
        raise HTTPException(status_code=500, detail="Failed to send contact message")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8030)