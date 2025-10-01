from fastapi import FastAPI, HTTPException, Depends, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional
import uvicorn
import logging
import os

from database import get_db, engine
from models import Base
from schemas import MediaItemResponse, MediaItemCreate, MediaUploadResponse
from crud import (
    get_media_items,
    get_media_item_by_id,
    create_media_item,
    delete_media_item
)
from services.storage_service import StorageService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Media & Gallery Service",
    description="Microservice for managing media assets and gallery images",
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

# Initialize storage service
storage_service = StorageService()

# Create uploads directory if it doesn't exist
uploads_dir = "/app/uploads"
os.makedirs(uploads_dir, exist_ok=True)

# Mount static files for serving uploaded media
app.mount("/media", StaticFiles(directory=uploads_dir), name="media")

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
    # Check storage service health
    storage_healthy = await storage_service.health_check()
    
    return {
        "status": "healthy" if storage_healthy else "degraded",
        "service": "media-service",
        "storage": "healthy" if storage_healthy else "unavailable"
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "Media & Gallery Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "gallery": "/gallery",
            "upload": "/gallery/upload"
        }
    }

# Gallery endpoints
@app.get("/gallery", response_model=List[MediaItemResponse])
async def get_gallery(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get list of all media items in gallery"""
    media_items = get_media_items(db, skip=skip, limit=limit)
    return media_items

@app.get("/gallery/{media_id}", response_model=MediaItemResponse)
async def get_media_item(media_id: str, db: Session = Depends(get_db)):
    """Get specific media item by ID"""
    media_item = get_media_item_by_id(db, media_id=media_id)
    if media_item is None:
        raise HTTPException(status_code=404, detail="Media item not found")
    return media_item

@app.post("/gallery/upload", response_model=MediaUploadResponse)
async def upload_media(
    file: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Upload new media file to gallery (admin only)"""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Only image files are allowed")
        
        # Validate file size (10MB limit)
        max_size = 10 * 1024 * 1024  # 10MB
        file_content = await file.read()
        if len(file_content) > max_size:
            raise HTTPException(status_code=400, detail="File size too large (max 10MB)")
        
        # Reset file pointer
        await file.seek(0)
        
        # Upload to storage
        file_info = await storage_service.upload_file(file, file_content)
        
        # Create database record
        media_data = MediaItemCreate(
            url=file_info["url"],
            caption=caption,
            file_size=file_info["file_size"],
            mime_type=file_info["mime_type"],
            filename=file_info["filename"]
        )
        
        db_media_item = create_media_item(db=db, media_item=media_data)
        
        return MediaUploadResponse(
            id=str(db_media_item.id),
            url=db_media_item.url,
            caption=db_media_item.caption,
            file_size=db_media_item.file_size,
            mime_type=db_media_item.mime_type,
            filename=db_media_item.filename,
            message="File uploaded successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload file")

@app.delete("/gallery/{media_id}")
async def delete_media(media_id: str, db: Session = Depends(get_db)):
    """Delete media item from gallery (admin only)"""
    try:
        # Get media item to get file URL for deletion
        media_item = get_media_item_by_id(db, media_id=media_id)
        if media_item is None:
            raise HTTPException(status_code=404, detail="Media item not found")
        
        # Delete from storage
        await storage_service.delete_file(media_item.url)
        
        # Delete from database
        success = delete_media_item(db=db, media_id=media_id)
        if not success:
            raise HTTPException(status_code=404, detail="Media item not found")
        
        return {"message": "Media item deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting media item {media_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete media item")

# Get media statistics
@app.get("/stats")
async def get_media_stats(db: Session = Depends(get_db)):
    """Get media gallery statistics"""
    try:
        from crud import get_media_items_count
        total_items = get_media_items_count(db)
        storage_stats = await storage_service.get_storage_stats()
        
        return {
            "total_items": total_items,
            "storage_used": storage_stats.get("used", 0),
            "storage_available": storage_stats.get("available", 0)
        }
    except Exception as e:
        logger.error(f"Error getting media stats: {str(e)}")
        return {
            "total_items": 0,
            "storage_used": 0,
            "storage_available": 0
        }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8040)