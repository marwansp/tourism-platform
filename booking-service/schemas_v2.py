"""
Booking Service Schemas v2
Updated for fixed-duration tours with single start date selection
"""
from pydantic import BaseModel, Field, validator, EmailStr
from typing import Optional
from datetime import datetime, date
from decimal import Decimal

class BookingRequestV2(BaseModel):
    """
    v2 Booking Request - Single start date only
    End date is calculated automatically based on tour duration
    """
    customer_name: str = Field(..., min_length=2, max_length=100, description="Customer full name")
    email: EmailStr = Field(..., description="Customer email address")
    phone: Optional[str] = Field(None, max_length=20, description="Customer phone number")
    tour_id: str = Field(..., description="UUID of the tour being booked")
    start_date: date = Field(..., description="Start date of travel (end date calculated automatically)")
    number_of_participants: int = Field(..., ge=1, le=50, description="Number of participants")
    special_requests: Optional[str] = Field(None, max_length=500, description="Special requests or notes")

    @validator('customer_name')
    def validate_customer_name(cls, v):
        """Validate customer name"""
        import re
        if not re.match(r"^[a-zA-Z0-9\s\-'.]+$", v.strip()):
            raise ValueError('Customer name contains invalid characters')
        return v.strip().title()

    @validator('phone')
    def validate_phone(cls, v):
        """Basic phone number validation"""
        if v:
            cleaned = v.replace(' ', '').replace('-', '').replace('(', '').replace(')', '').replace('+', '')
            if not cleaned.isdigit():
                raise ValueError('Phone number must contain only digits and common separators')
            if len(cleaned) < 8 or len(cleaned) > 15:
                raise ValueError('Phone number must be between 8 and 15 digits')
        return v

class PriceCalculationRequestV2(BaseModel):
    """
    v2 Price Calculation Request - Single start date
    """
    tour_id: str = Field(..., description="UUID of the tour")
    start_date: date = Field(..., description="Start date of travel")
    number_of_participants: int = Field(..., ge=1, le=50, description="Number of participants")

class PriceCalculationResponseV2(BaseModel):
    """
    v2 Price Calculation Response with group pricing breakdown
    """
    tour_id: str
    start_date: date
    end_date: date  # Calculated automatically
    duration_days: int
    number_of_participants: int
    price_per_person: Decimal
    total_price: Decimal
    breakdown: dict = Field(..., description="Detailed pricing breakdown")
    
    class Config:
        json_encoders = {
            Decimal: lambda v: float(v),
            date: lambda v: v.isoformat()
        }
