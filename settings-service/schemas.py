from pydantic import BaseModel, HttpUrl
from datetime import datetime
from typing import Optional
import uuid


class HomepageSettingsBase(BaseModel):
    hero_image_url: str
    hero_title: Optional[str] = None
    hero_subtitle: Optional[str] = None
    updated_by: Optional[str] = None


class HomepageSettingsCreate(HomepageSettingsBase):
    pass


class HomepageSettingsUpdate(BaseModel):
    hero_image_url: str
    updated_by: Optional[str] = None


class HomepageSettingsResponse(HomepageSettingsBase):
    id: uuid.UUID
    updated_at: datetime
    
    model_config = {"from_attributes": True}