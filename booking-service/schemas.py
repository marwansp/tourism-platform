from pydantic import BaseModel, Field, validator, EmailStr
from typing import Optional, Union
from datetime import datetime, date
from decimal import Decimal
from enum import Enum

class BookingStatus(str, Enum):
    """Booking status enumeration"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class BookingBase(BaseModel):
    """Base booking schema with common fields"""
    customer_name: str = Field(..., min_length=2, max_length=100, description="Customer full name")
    email: EmailStr = Field(..., description="Customer email address")
    phone: Optional[str] = Field(None, max_length=20, description="Customer phone number")
    tour_id: str = Field(..., description="UUID of the tour being booked")
    
    # Date range fields
    start_date: Union[datetime, date, str] = Field(..., description="Start date of travel")
    end_date: Union[datetime, date, str] = Field(..., description="End date of travel")
    
    # Participant and pricing
    number_of_participants: int = Field(..., ge=1, le=50, description="Number of participants")
    
    # Legacy field for backward compatibility
    travel_date: Optional[Union[datetime, date, str]] = Field(None, description="Legacy travel date field")

    @validator('customer_name')
    def validate_customer_name(cls, v):
        """Validate customer name - allow letters, numbers, spaces, common punctuation"""
        import re
        # Allow letters, numbers, spaces, hyphens, apostrophes, periods
        if not re.match(r"^[a-zA-Z0-9\s\-'.]+$", v.strip()):
            raise ValueError('Customer name contains invalid characters')
        return v.strip().title()

    @validator('phone')
    def validate_phone(cls, v):
        """Basic phone number validation"""
        if v:
            # Remove common phone number characters
            cleaned = v.replace(' ', '').replace('-', '').replace('(', '').replace(')', '').replace('+', '')
            if not cleaned.isdigit():
                raise ValueError('Phone number must contain only digits and common separators')
            if len(cleaned) < 8 or len(cleaned) > 15:
                raise ValueError('Phone number must be between 8 and 15 digits')
        return v

    @validator('start_date', pre=True)
    def validate_start_date(cls, v):
        """Parse and validate start date"""
        if isinstance(v, str):
            try:
                parsed_date = datetime.strptime(v, '%Y-%m-%d').date()
                v = datetime.combine(parsed_date, datetime.min.time())
            except ValueError:
                try:
                    v = datetime.fromisoformat(v.replace('Z', '+00:00'))
                except ValueError:
                    raise ValueError('Invalid start date format. Use YYYY-MM-DD or ISO format')
        elif isinstance(v, date) and not isinstance(v, datetime):
            v = datetime.combine(v, datetime.min.time())
        
        # Ensure start date is in the future
        now = datetime.now()
        if v.date() <= now.date():
            raise ValueError('Start date must be in the future')
        return v

    @validator('end_date', pre=True)
    def validate_end_date(cls, v):
        """Parse and validate end date"""
        if isinstance(v, str):
            try:
                parsed_date = datetime.strptime(v, '%Y-%m-%d').date()
                v = datetime.combine(parsed_date, datetime.min.time())
            except ValueError:
                try:
                    v = datetime.fromisoformat(v.replace('Z', '+00:00'))
                except ValueError:
                    raise ValueError('Invalid end date format. Use YYYY-MM-DD or ISO format')
        elif isinstance(v, date) and not isinstance(v, datetime):
            v = datetime.combine(v, datetime.min.time())
        return v

    @validator('end_date')
    def validate_date_range(cls, v, values):
        """Ensure end date is after start date"""
        if 'start_date' in values and v:
            start_date = values['start_date']
            if isinstance(start_date, datetime) and isinstance(v, datetime):
                if v.date() < start_date.date():
                    raise ValueError('End date must be after start date')
        return v

    @validator('travel_date', pre=True)
    def validate_travel_date(cls, v):
        """Parse and validate legacy travel date (for backward compatibility)"""
        if v is None:
            return v
        if isinstance(v, str):
            try:
                parsed_date = datetime.strptime(v, '%Y-%m-%d').date()
                v = datetime.combine(parsed_date, datetime.min.time())
            except ValueError:
                try:
                    v = datetime.fromisoformat(v.replace('Z', '+00:00'))
                except ValueError:
                    raise ValueError('Invalid date format. Use YYYY-MM-DD or ISO format')
        elif isinstance(v, date) and not isinstance(v, datetime):
            v = datetime.combine(v, datetime.min.time())
        return v

class BookingRequest(BookingBase):
    """Schema for creating a new booking"""
    pass

class PriceCalculationRequest(BaseModel):
    """Schema for calculating tour price"""
    tour_id: str = Field(..., description="UUID of the tour")
    start_date: Union[datetime, date, str] = Field(..., description="Start date of travel")
    end_date: Union[datetime, date, str] = Field(..., description="End date of travel")
    number_of_participants: int = Field(..., ge=1, le=50, description="Number of participants")

    @validator('start_date', 'end_date', pre=True)
    def validate_dates(cls, v):
        """Parse dates"""
        if isinstance(v, str):
            try:
                return datetime.strptime(v, '%Y-%m-%d').date()
            except ValueError:
                raise ValueError('Invalid date format. Use YYYY-MM-DD')
        elif isinstance(v, datetime):
            return v.date()
        return v

class PriceCalculationResponse(BaseModel):
    """Schema for price calculation response"""
    tour_id: str
    base_price_per_person: Decimal
    seasonal_multiplier: Decimal
    group_discount_percentage: Decimal
    price_per_person: Decimal
    total_price: Decimal
    number_of_participants: int
    duration_days: int
    season_name: Optional[str] = None
    breakdown: dict

class BookingUpdate(BaseModel):
    """Schema for updating an existing booking (all fields optional)"""
    customer_name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    start_date: Optional[Union[datetime, date, str]] = None
    end_date: Optional[Union[datetime, date, str]] = None
    number_of_participants: Optional[int] = Field(None, ge=1, le=50)
    status: Optional[BookingStatus] = None
    admin_viewed: Optional[bool] = None
    
    # Legacy field
    travel_date: Optional[Union[datetime, date, str]] = None

    @validator('customer_name')
    def validate_customer_name(cls, v):
        """Validate customer name - allow letters, numbers, spaces, common punctuation"""
        import re
        if v and not re.match(r"^[a-zA-Z0-9\s\-'.]+$", v.strip()):
            raise ValueError('Customer name contains invalid characters')
        return v.strip().title() if v else v

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

    @validator('start_date', 'end_date', 'travel_date', pre=True)
    def validate_dates(cls, v):
        """Parse and validate dates"""
        if v:
            if isinstance(v, str):
                try:
                    parsed_date = datetime.strptime(v, '%Y-%m-%d').date()
                    v = datetime.combine(parsed_date, datetime.min.time())
                except ValueError:
                    try:
                        v = datetime.fromisoformat(v.replace('Z', '+00:00'))
                    except ValueError:
                        raise ValueError('Invalid date format. Use YYYY-MM-DD or ISO format')
            elif isinstance(v, date) and not isinstance(v, datetime):
                v = datetime.combine(v, datetime.min.time())
        return v

class BookingResponse(BaseModel):
    """Schema for booking response (includes ID, status, and timestamps)"""
    id: str
    customer_name: str
    email: str
    phone: Optional[str] = None
    tour_id: str
    start_date: datetime
    end_date: datetime
    number_of_participants: int
    price_per_person: Decimal
    total_price: Decimal
    status: BookingStatus
    admin_viewed: bool
    created_at: datetime
    updated_at: datetime
    
    # Legacy field for backward compatibility
    travel_date: Optional[datetime] = None

    class Config:
        from_attributes = True
    
    @validator('id', pre=True)
    def convert_id_to_string(cls, v):
        """Convert UUID to string for JSON serialization"""
        return str(v) if v else None
    
    @validator('tour_id', pre=True)
    def convert_tour_id_to_string(cls, v):
        """Convert tour_id UUID to string for JSON serialization"""
        return str(v) if v else None

class BookingNotification(BaseModel):
    """Schema for booking notification data"""
    booking_id: str
    customer_name: str
    customer_email: str
    tour_title: str
    tour_price: str
    travel_date: datetime
    status: BookingStatus