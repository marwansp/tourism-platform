#!/usr/bin/env python3
"""
Migration script to move existing image_url data to tour_images table
"""
import psycopg2
import uuid
from datetime import datetime

# Database connection parameters
DB_CONFIG = {
    'host': 'localhost',
    'port': '5432',
    'database': 'tours_db',
    'user': 'postgres',
    'password': 'postgres'
}

def migrate_images():
    """Migrate existing image_url data to tour_images table"""
    try:
        # Connect to database
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("🔄 Starting image migration...")
        
        # Get all tours with image_url
        cursor.execute("""
            SELECT id, image_url 
            FROM tours 
            WHERE image_url IS NOT NULL AND image_url != ''
        """)
        
        tours_with_images = cursor.fetchall()
        print(f"📊 Found {len(tours_with_images)} tours with images to migrate")
        
        # Migrate each tour's image
        migrated_count = 0
        for tour_id, image_url in tours_with_images:
            try:
                # Insert into tour_images table
                cursor.execute("""
                    INSERT INTO tour_images (id, tour_id, image_url, is_main, display_order, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    str(uuid.uuid4()),
                    tour_id,
                    image_url,
                    True,  # Mark as main image
                    0,     # First image
                    datetime.now()
                ))
                migrated_count += 1
                print(f"✅ Migrated image for tour {tour_id}")
                
            except Exception as e:
                print(f"❌ Error migrating tour {tour_id}: {e}")
                continue
        
        # Commit the changes
        conn.commit()
        print(f"🎉 Successfully migrated {migrated_count} images!")
        
        # Optional: Remove image_url column (uncomment if you want to clean up)
        # cursor.execute("ALTER TABLE tours DROP COLUMN IF EXISTS image_url")
        # conn.commit()
        # print("🧹 Removed old image_url column")
        
    except Exception as e:
        print(f"💥 Migration failed: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    migrate_images()