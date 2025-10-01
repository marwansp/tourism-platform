from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime

class MediaItemBase(BaseModel):
    """Base media item schema with common fields"""
    url: str = Field(..., description="URL to access the media file")
    caption: Optional[str] = Field(None, max_length=500, description="Optional caption for the media")
    file_size: Optional[int] = Field(None, description="File size in bytes")
    mime_type: Optional[str] = Field(None, description="MIME type of the file")
    filename: Optional[str] = Field(None, description="Original filename")

    @validator('url')
    def validate_url(cls, v):
        """Basic URL validation"""
        if not v.startswith(('http://', 'https://', '/media/')):
            raise ValueError('URL must be a valid HTTP URL or relative path')
        return v

    @validator('file_size')
    def validate_file_size(cls, v):
        """Validate file size is reasonable"""
        if v is not None and v < 0:
            raise ValueError('File size cannot be negative')
        if v is not None and v > 50 * 1024 * 1024:  # 50MB limit
            raise ValueError('File size too large (max 50MB)')
        return v

    @validator('mime_type')
    def validate_mime_type(cls, v):
        """Validate MIME type for images"""
        if v is not None:
            allowed_types = [
                'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
                'image/webp', 'image/bmp', 'image/tiff'
            ]
            if v not in allowed_types:
                raise ValueError(f'MIME type must be one of: {", ".join(allowed_types)}')
        return v

class MediaItemCreate(MediaItemBase):
    """Schema for creating a new media item"""
    pass

class MediaItemResponse(MediaItemBase):
    """Schema for media item response (includes ID and timestamps)"""
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
    
    @validator('id', pre=True)
    def convert_id_to_string(cls, v):
        """Convert UUID to string for JSON serialization"""
        return str(v) if v else None

class MediaUploadResponse(BaseModel):
    """Schema for file upload response"""
    id: str
    url: str
    caption: Optional[str]
    file_size: int
    mime_type: str
    filename: str
    message: str

class MediaStats(BaseModel):
    """Schema for media statistics"""
    total_items: int
    storage_used: int
    storage_available: int

class FileUploadInfo(BaseModel):
    """Schema for file upload information"""
    url: str
    file_size: int
    mime_type: str
    filename: str