from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional
import uuid

from models import MediaItem
from schemas import MediaItemCreate

def get_media_items(db: Session, skip: int = 0, limit: int = 100) -> List[MediaItem]:
    """
    Retrieve a list of media items with pagination
    
    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
    
    Returns:
        List of MediaItem objects
    """
    return db.query(MediaItem).order_by(MediaItem.created_at.desc()).offset(skip).limit(limit).all()

def get_media_item_by_id(db: Session, media_id: str) -> Optional[MediaItem]:
    """
    Retrieve a specific media item by ID
    
    Args:
        db: Database session
        media_id: UUID string of the media item
    
    Returns:
        MediaItem object if found, None otherwise
    """
    try:
        # Convert string to UUID for query
        media_uuid = uuid.UUID(media_id)
        return db.query(MediaItem).filter(MediaItem.id == media_uuid).first()
    except ValueError:
        # Invalid UUID format
        return None

def get_media_items_by_mime_type(db: Session, mime_type: str) -> List[MediaItem]:
    """
    Retrieve media items by MIME type
    
    Args:
        db: Database session
        mime_type: MIME type to filter by
    
    Returns:
        List of MediaItem objects
    """
    return db.query(MediaItem).filter(MediaItem.mime_type == mime_type).order_by(MediaItem.created_at.desc()).all()

def create_media_item(db: Session, media_item: MediaItemCreate) -> MediaItem:
    """
    Create a new media item record
    
    Args:
        db: Database session
        media_item: MediaItemCreate schema with media data
    
    Returns:
        Created MediaItem object
    
    Raises:
        SQLAlchemyError: If database operation fails
    """
    try:
        db_media_item = MediaItem(
            url=media_item.url,
            caption=media_item.caption,
            file_size=media_item.file_size,
            mime_type=media_item.mime_type,
            filename=media_item.filename
        )
        db.add(db_media_item)
        db.commit()
        db.refresh(db_media_item)
        return db_media_item
    except SQLAlchemyError as e:
        db.rollback()
        raise e

def delete_media_item(db: Session, media_id: str) -> bool:
    """
    Delete a media item by ID
    
    Args:
        db: Database session
        media_id: UUID string of the media item to delete
    
    Returns:
        True if media item was deleted, False if not found
    
    Raises:
        SQLAlchemyError: If database operation fails
    """
    try:
        # Convert string to UUID for query
        media_uuid = uuid.UUID(media_id)
        db_media_item = db.query(MediaItem).filter(MediaItem.id == media_uuid).first()
        
        if db_media_item is None:
            return False
        
        db.delete(db_media_item)
        db.commit()
        return True
    except ValueError:
        # Invalid UUID format
        return False
    except SQLAlchemyError as e:
        db.rollback()
        raise e

def get_media_items_count(db: Session) -> int:
    """
    Get total count of media items
    
    Args:
        db: Database session
    
    Returns:
        Total number of media items
    """
    return db.query(MediaItem).count()

def get_total_storage_used(db: Session) -> int:
    """
    Get total storage used by all media items
    
    Args:
        db: Database session
    
    Returns:
        Total storage used in bytes
    """
    result = db.query(db.func.sum(MediaItem.file_size)).scalar()
    return result or 0

def search_media_items(db: Session, query: str) -> List[MediaItem]:
    """
    Search media items by caption or filename
    
    Args:
        db: Database session
        query: Search query string
    
    Returns:
        List of matching MediaItem objects
    """
    search_pattern = f"%{query}%"
    return db.query(MediaItem).filter(
        db.or_(
            MediaItem.caption.ilike(search_pattern),
            MediaItem.filename.ilike(search_pattern)
        )
    ).order_by(MediaItem.created_at.desc()).all()