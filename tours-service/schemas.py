from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class TourImageBase(BaseModel):
    """Base schema for tour images"""
    image_url: str = Field(..., description="URL to the image")
    is_main: bool = Field(False, description="Whether this is the main image")
    display_order: int = Field(0, description="Display order for image gallery")
    alt_text: Optional[str] = Field(None, max_length=255, description="Alt text for accessibility")

class TourImageCreate(TourImageBase):
    """Schema for creating a new tour image"""
    pass

class TourImageResponse(TourImageBase):
    """Schema for tour image response"""
    id: str
    tour_id: str
    created_at: datetime

    class Config:
        from_attributes = True
    
    @validator('id', 'tour_id', pre=True)
    def convert_uuid_to_string(cls, v):
        """Convert UUID to string for JSON serialization"""
        return str(v) if v else None

class TourBase(BaseModel):
    """Base tour schema with common fields"""
    title: str = Field(..., min_length=1, max_length=200, description="Tour title")
    description: str = Field(..., min_length=10, description="Detailed tour description")
    price: Decimal = Field(..., gt=0, description="Price per person in MAD")
    duration: str = Field(..., min_length=1, max_length=50, description="Tour duration (e.g., '3 days / 2 nights')")
    location: str = Field(..., min_length=1, max_length=100, description="Tour location")
    max_participants: int = Field(..., gt=0, le=50, description="Maximum number of participants")
    difficulty_level: str = Field(..., description="Difficulty level: Easy, Moderate, or Challenging")
    includes: Optional[List[str]] = Field(None, description="List of what's included in the tour")
    available_dates: Optional[List[str]] = Field(None, description="List of available dates")

    @validator('price')
    def validate_price(cls, v):
        """Ensure price has maximum 2 decimal places"""
        if v.as_tuple().exponent < -2:
            raise ValueError('Price cannot have more than 2 decimal places')
        return v

    @validator('difficulty_level')
    def validate_difficulty(cls, v):
        """Validate difficulty level"""
        allowed_levels = ['Easy', 'Moderate', 'Challenging']
        if v not in allowed_levels:
            raise ValueError(f'Difficulty level must be one of: {", ".join(allowed_levels)}')
        return v

class TourCreate(TourBase):
    """Schema for creating a new tour"""
    images: Optional[List[TourImageCreate]] = Field(None, description="List of tour images")

class TourUpdate(BaseModel):
    """Schema for updating an existing tour (all fields optional)"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=10)
    price: Optional[Decimal] = Field(None, gt=0)
    duration: Optional[str] = Field(None, min_length=1, max_length=50)
    location: Optional[str] = Field(None, min_length=1, max_length=100)
    max_participants: Optional[int] = Field(None, gt=0, le=50)
    difficulty_level: Optional[str] = None
    includes: Optional[List[str]] = None
    available_dates: Optional[List[str]] = None
    images: Optional[List[TourImageCreate]] = Field(None, description="List of tour images")

    @validator('price')
    def validate_price(cls, v):
        """Ensure price has maximum 2 decimal places"""
        if v and v.as_tuple().exponent < -2:
            raise ValueError('Price cannot have more than 2 decimal places')
        return v

    @validator('difficulty_level')
    def validate_difficulty(cls, v):
        """Validate difficulty level"""
        if v is not None:
            allowed_levels = ['Easy', 'Moderate', 'Challenging']
            if v not in allowed_levels:
                raise ValueError(f'Difficulty level must be one of: {", ".join(allowed_levels)}')
        return v

class TourResponse(TourBase):
    """Schema for tour response (includes ID and timestamps)"""
    id: str
    created_at: datetime
    updated_at: datetime
    images: List[TourImageResponse] = Field(default_factory=list, description="List of tour images")

    class Config:
        from_attributes = True
    
    @validator('id', pre=True)
    def convert_uuid_to_string(cls, v):
        """Convert UUID to string for JSON serialization"""
        return str(v) if v else None

class TourReviewBase(BaseModel):
    """Base schema for tour reviews"""
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5 stars")
    review_text: Optional[str] = Field(None, max_length=1000, description="Review text (optional)")

class TourReviewCreate(TourReviewBase):
    """Schema for creating a new review"""
    customer_name: str = Field(..., min_length=1, max_length=100, description="Customer name")

class TourReviewResponse(TourReviewBase):
    """Schema for review response"""
    id: str
    customer_name: str
    created_at: datetime
    is_verified: bool

    class Config:
        from_attributes = True
    
    @validator('id', pre=True)
    def convert_uuid_to_string(cls, v):
        """Convert UUID to string for JSON serialization"""
        return str(v) if v else None

class TourDetailResponse(TourResponse):
    """Schema for detailed tour response with full image gallery and reviews"""
    reviews: List[TourReviewResponse] = Field(default_factory=list, description="List of tour reviews")
    average_rating: Optional[float] = Field(None, description="Average rating from reviews")
    total_reviews: int = Field(0, description="Total number of reviews")
    
    @validator('id', pre=True)
    def convert_uuid_to_string(cls, v):
        """Convert UUID to string for JSON serialization"""
        return str(v) if v else None

# ============================================================================
# Group Pricing Schemas (v2)
# ============================================================================

class TourGroupPricingBase(BaseModel):
    """Base schema for group pricing"""
    min_participants: int = Field(..., gt=0, description="Minimum number of participants")
    max_participants: int = Field(..., gt=0, description="Maximum number of participants")
    price_per_person: Decimal = Field(..., gt=0, description="Price per person for this group size")

    @validator('max_participants')
    def validate_max_greater_than_min(cls, v, values):
        """Ensure max_participants >= min_participants"""
        if 'min_participants' in values and v < values['min_participants']:
            raise ValueError('max_participants must be greater than or equal to min_participants')
        return v

class TourGroupPricingCreate(TourGroupPricingBase):
    """Schema for creating group pricing"""
    pass

class TourGroupPricingUpdate(BaseModel):
    """Schema for updating group pricing"""
    min_participants: Optional[int] = Field(None, gt=0)
    max_participants: Optional[int] = Field(None, gt=0)
    price_per_person: Optional[Decimal] = Field(None, gt=0)

class TourGroupPricingResponse(TourGroupPricingBase):
    """Schema for group pricing response"""
    id: str
    tour_id: str
    created_at: datetime

    class Config:
        from_attributes = True
    
    @validator('id', 'tour_id', pre=True)
    def convert_uuid_to_string(cls, v):
        """Convert UUID to string for JSON serialization"""
        return str(v) if v else None


# ============================================================================
# Tag Schemas (v2)
# ============================================================================

class TagBase(BaseModel):
    """Base schema for tags"""
    name: str = Field(..., min_length=1, max_length=100, description="Tag name")
    icon: Optional[str] = Field(None, max_length=50, description="Icon emoji or class")

class TagCreate(TagBase):
    """Schema for creating a tag"""
    pass

class TagUpdate(BaseModel):
    """Schema for updating a tag"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    icon: Optional[str] = Field(None, max_length=50)

class TagResponse(TagBase):
    """Schema for tag response"""
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
    
    @validator('id', pre=True)
    def convert_uuid_to_string(cls, v):
        """Convert UUID to string for JSON serialization"""
        return str(v) if v else None


# ============================================================================
# Tour Tag Association Schemas (v2)
# ============================================================================

class TourTagCreate(BaseModel):
    """Schema for adding a tag to a tour"""
    tag_id: str = Field(..., description="Tag ID to associate with tour")

class TourTagResponse(BaseModel):
    """Schema for tour-tag association response"""
    id: str
    tour_id: str
    tag_id: str
    tag: TagResponse  # Include full tag details
    created_at: datetime

    class Config:
        from_attributes = True
    
    @validator('id', 'tour_id', 'tag_id', pre=True)
    def convert_uuid_to_string(cls, v):
        """Convert UUID to string for JSON serialization"""
        return str(v) if v else None


# ============================================================================
# MULTILINGUAL TRANSLATION SCHEMAS
# ============================================================================

class TourTranslationBase(BaseModel):
    """Base schema for tour translations"""
    language: str = Field(..., pattern="^(en|fr)$", description="Language code: en or fr")
    title: str = Field(..., min_length=1, max_length=200, description="Translated tour title")
    description: str = Field(..., min_length=10, description="Translated tour description")
    location: str = Field(..., min_length=1, max_length=100, description="Translated location")
    includes: Optional[str] = Field(None, description="Translated includes text")

class TourTranslationCreate(TourTranslationBase):
    """Schema for creating a tour translation"""
    pass

class TourTranslationUpdate(BaseModel):
    """Schema for updating a tour translation"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=10)
    location: Optional[str] = Field(None, min_length=1, max_length=100)
    includes: Optional[str] = None

class TourTranslationResponse(TourTranslationBase):
    """Schema for tour translation response"""
    id: str
    tour_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
    
    @validator('id', 'tour_id', pre=True)
    def convert_uuid_to_string(cls, v):
        """Convert UUID to string for JSON serialization"""
        return str(v) if v else None

class TourCreateWithTranslations(BaseModel):
    """Schema for creating a tour with translations"""
    # Non-translatable fields
    price: Decimal = Field(..., gt=0)
    duration: str = Field(..., min_length=1, max_length=50)
    max_participants: int = Field(..., gt=0, le=50)
    difficulty_level: str = Field(...)
    available_dates: Optional[List[str]] = None
    
    # Translations for both languages
    translations: dict = Field(..., description="Translations object with 'en' and 'fr' keys")
    
    # Images
    images: Optional[List[TourImageCreate]] = None

    @validator('translations')
    def validate_translations(cls, v):
        """Ensure both English and French translations are provided"""
        if 'en' not in v or 'fr' not in v:
            raise ValueError('Both English (en) and French (fr) translations are required')
        
        required_fields = ['title', 'description', 'location']
        for lang in ['en', 'fr']:
            for field in required_fields:
                if field not in v[lang] or not v[lang][field]:
                    raise ValueError(f'Missing required field "{field}" in {lang} translation')
        
        return v


# ============================================================================
# TOUR INFO SECTIONS SCHEMAS
# ============================================================================

class TourInfoSectionBase(BaseModel):
    """Base schema for tour information sections"""
    title_en: str = Field(..., min_length=1, max_length=200, description="Section title in English")
    title_fr: str = Field(..., min_length=1, max_length=200, description="Section title in French")
    content_en: str = Field(..., min_length=1, description="Section content in English (supports HTML)")
    content_fr: str = Field(..., min_length=1, description="Section content in French (supports HTML)")
    display_order: int = Field(0, ge=0, description="Display order (0-based)")

class TourInfoSectionCreate(TourInfoSectionBase):
    """Schema for creating a tour information section"""
    pass

class TourInfoSectionUpdate(BaseModel):
    """Schema for updating a tour information section"""
    title_en: Optional[str] = Field(None, min_length=1, max_length=200)
    title_fr: Optional[str] = Field(None, min_length=1, max_length=200)
    content_en: Optional[str] = Field(None, min_length=1)
    content_fr: Optional[str] = Field(None, min_length=1)
    display_order: Optional[int] = Field(None, ge=0)

class TourInfoSectionResponse(TourInfoSectionBase):
    """Schema for tour information section response"""
    id: str
    tour_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
    
    @validator('id', 'tour_id', pre=True)
    def convert_uuid_to_string(cls, v):
        """Convert UUID to string for JSON serialization"""
        return str(v) if v else None
