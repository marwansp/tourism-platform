from pydantic import BaseModel, Field, validator, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

class NotificationType(str, Enum):
    """Notification type enumeration"""
    EMAIL = "email"
    WHATSAPP = "whatsapp"

class NotificationStatus(str, Enum):
    """Notification status enumeration"""
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"

class EmailRequest(BaseModel):
    """Schema for email notification request"""
    to: EmailStr = Field(..., description="Recipient email address")
    subject: str = Field(..., min_length=1, max_length=200, description="Email subject")
    template: Optional[str] = Field("default", description="Email template name")
    data: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Template data")
    
    def get_message_content(self) -> str:
        """Get message content for logging purposes"""
        if self.template == "booking_confirmation":
            return f"Booking confirmation for {self.data.get('customer_name', 'customer')} - {self.data.get('tour_title', 'tour')}"
        elif self.template == "admin_notification":
            return f"New booking notification for {self.data.get('tour_title', 'tour')} by {self.data.get('customer_name', 'customer')}"
        elif self.template == "contact_form":
            return f"Contact form message from {self.data.get('name', 'visitor')}: {self.data.get('message', 'No message')}"
        else:
            return f"Email notification: {self.subject}"

class NotificationCreate(BaseModel):
    """Schema for creating a new notification record"""
    type: NotificationType
    recipient: str = Field(..., description="Recipient address (email or phone)")
    subject: Optional[str] = Field(None, description="Message subject")
    message: str = Field(..., description="Message content or description")
    status: NotificationStatus = NotificationStatus.PENDING

class NotificationResponse(BaseModel):
    """Schema for notification response"""
    id: str
    type: NotificationType
    recipient: str
    subject: Optional[str]
    message: str
    status: NotificationStatus
    sent_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True
    
    @validator('id', pre=True)
    def convert_id_to_string(cls, v):
        """Convert UUID to string for JSON serialization"""
        return str(v) if v else None

class ContactFormRequest(BaseModel):
    """Schema for contact form submission"""
    name: str = Field(..., min_length=2, max_length=100, description="Contact person name")
    email: EmailStr = Field(..., description="Contact person email")
    subject: str = Field(..., min_length=1, max_length=200, description="Message subject")
    message: str = Field(..., min_length=10, max_length=2000, description="Message content")
    
    @validator('name')
    def validate_name(cls, v):
        """Validate contact name"""
        if not v.replace(' ', '').replace('-', '').replace("'", '').isalpha():
            raise ValueError('Name must contain only letters, spaces, hyphens, and apostrophes')
        return v.strip().title()

class EmailTemplateData(BaseModel):
    """Schema for email template data validation"""
    # Booking confirmation template data
    booking_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    tour_title: Optional[str] = None
    tour_price: Optional[str] = None
    travel_date: Optional[str] = None
    status: Optional[str] = None
    
    # Contact form template data
    name: Optional[str] = None
    email: Optional[str] = None
    message: Optional[str] = None