from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from models import HomepageSettings
from schemas import HomepageSettingsCreate, HomepageSettingsUpdate
from typing import Optional


class SettingsCRUD:
    
    @staticmethod
    def get_homepage_settings(db: Session) -> Optional[HomepageSettings]:
        """Get the current homepage settings (there should only be one record)"""
        return db.query(HomepageSettings).first()
    
    @staticmethod
    def create_homepage_settings(db: Session, settings: HomepageSettingsCreate) -> HomepageSettings:
        """Create initial homepage settings"""
        db_settings = HomepageSettings(
            hero_image_url=settings.hero_image_url,
            hero_title=settings.hero_title,
            hero_subtitle=settings.hero_subtitle,
            updated_by=settings.updated_by
        )
        db.add(db_settings)
        db.commit()
        db.refresh(db_settings)
        return db_settings
    
    @staticmethod
    def update_hero_image(db: Session, hero_image_url: str, updated_by: Optional[str] = None) -> HomepageSettings:
        """Update the hero image URL"""
        settings = db.query(HomepageSettings).first()
        
        if not settings:
            # Create initial settings if none exist
            settings_create = HomepageSettingsCreate(
                hero_image_url=hero_image_url,
                updated_by=updated_by
            )
            return SettingsCRUD.create_homepage_settings(db, settings_create)
        
        # Update existing settings
        settings.hero_image_url = hero_image_url
        settings.updated_by = updated_by
        settings.updated_at = func.now()
        
        db.commit()
        db.refresh(settings)
        return settings
    
    @staticmethod
    def update_homepage_settings(db: Session, settings_update: dict) -> HomepageSettings:
        """Update homepage settings with multiple fields"""
        settings = db.query(HomepageSettings).first()
        
        if not settings:
            # Create initial settings if none exist
            settings_create = HomepageSettingsCreate(**settings_update)
            return SettingsCRUD.create_homepage_settings(db, settings_create)
        
        # Update existing settings
        for field, value in settings_update.items():
            if hasattr(settings, field) and value is not None:
                setattr(settings, field, value)
        
        settings.updated_at = func.now()
        db.commit()
        db.refresh(settings)
        return settings
    
    @staticmethod
    def delete_homepage_settings(db: Session) -> bool:
        """Delete homepage settings (mainly for testing)"""
        settings = db.query(HomepageSettings).first()
        if settings:
            db.delete(settings)
            db.commit()
            return True
        return False