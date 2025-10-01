from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional
from datetime import datetime
import uuid

from models import Notification
from schemas import NotificationCreate

def get_notifications(db: Session, skip: int = 0, limit: int = 100) -> List[Notification]:
    """
    Retrieve a list of notifications with pagination
    
    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
    
    Returns:
        List of Notification objects
    """
    return db.query(Notification).order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()

def get_notification_by_id(db: Session, notification_id: str) -> Optional[Notification]:
    """
    Retrieve a specific notification by ID
    
    Args:
        db: Database session
        notification_id: UUID string of the notification
    
    Returns:
        Notification object if found, None otherwise
    """
    try:
        # Convert string to UUID for query
        notification_uuid = uuid.UUID(notification_id)
        return db.query(Notification).filter(Notification.id == notification_uuid).first()
    except ValueError:
        # Invalid UUID format
        return None

def get_notifications_by_recipient(db: Session, recipient: str) -> List[Notification]:
    """
    Retrieve all notifications for a specific recipient
    
    Args:
        db: Database session
        recipient: Recipient email or phone number
    
    Returns:
        List of Notification objects
    """
    return db.query(Notification).filter(Notification.recipient == recipient).order_by(Notification.created_at.desc()).all()

def get_notifications_by_status(db: Session, status: str) -> List[Notification]:
    """
    Get notifications by status
    
    Args:
        db: Database session
        status: Notification status (pending, sent, failed)
    
    Returns:
        List of Notification objects with the specified status
    """
    return db.query(Notification).filter(Notification.status == status).order_by(Notification.created_at.desc()).all()

def create_notification(db: Session, notification: NotificationCreate) -> Notification:
    """
    Create a new notification record
    
    Args:
        db: Database session
        notification: NotificationCreate schema with notification data
    
    Returns:
        Created Notification object
    
    Raises:
        SQLAlchemyError: If database operation fails
    """
    try:
        db_notification = Notification(
            type=notification.type,
            recipient=notification.recipient,
            subject=notification.subject,
            message=notification.message,
            status=notification.status
        )
        db.add(db_notification)
        db.commit()
        db.refresh(db_notification)
        return db_notification
    except SQLAlchemyError as e:
        db.rollback()
        raise e

def update_notification_status(db: Session, notification_id: str, status: str, sent_at: Optional[datetime] = None) -> Optional[Notification]:
    """
    Update notification status
    
    Args:
        db: Database session
        notification_id: UUID string of the notification to update
        status: New status (pending, sent, failed)
        sent_at: Timestamp when notification was sent (optional)
    
    Returns:
        Updated Notification object if found, None otherwise
    
    Raises:
        SQLAlchemyError: If database operation fails
    """
    try:
        # Convert string to UUID for query
        notification_uuid = uuid.UUID(notification_id)
        db_notification = db.query(Notification).filter(Notification.id == notification_uuid).first()
        
        if db_notification is None:
            return None
        
        db_notification.status = status
        if sent_at:
            db_notification.sent_at = sent_at
        elif status == "sent":
            db_notification.sent_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_notification)
        return db_notification
    except ValueError:
        # Invalid UUID format
        return None
    except SQLAlchemyError as e:
        db.rollback()
        raise e

def get_notifications_count(db: Session) -> int:
    """
    Get total count of notifications
    
    Args:
        db: Database session
    
    Returns:
        Total number of notifications
    """
    return db.query(Notification).count()

def get_notifications_count_by_status(db: Session, status: str) -> int:
    """
    Get count of notifications by status
    
    Args:
        db: Database session
        status: Notification status
    
    Returns:
        Number of notifications with the specified status
    """
    return db.query(Notification).filter(Notification.status == status).count()