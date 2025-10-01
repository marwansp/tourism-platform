from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uvicorn
import os

from database import get_db, engine
from models import Base
from crud import SettingsCRUD
from schemas import HomepageSettingsResponse, HomepageSettingsUpdate

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Settings Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "settings-service"}

@app.get("/settings/homepage", response_model=HomepageSettingsResponse)
async def get_homepage_settings(db: Session = Depends(get_db)):
    """Get current homepage settings"""
    settings = SettingsCRUD.get_homepage_settings(db)
    if not settings:
        raise HTTPException(status_code=404, detail="Homepage settings not found")
    return settings

@app.put("/settings/homepage/hero", response_model=HomepageSettingsResponse)
async def update_hero_image(
    settings_update: HomepageSettingsUpdate,
    db: Session = Depends(get_db)
):
    """Update hero image URL"""
    try:
        settings = SettingsCRUD.update_hero_image(db, settings_update.hero_image_url)
        return settings
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update hero image: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8005)