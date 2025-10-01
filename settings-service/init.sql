-- Settings Service Database Initialization

-- Create database if it doesn't exist
-- This should be run by the database administrator or docker-compose

-- Create homepage_settings table
CREATE TABLE IF NOT EXISTS homepage_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hero_image_url VARCHAR(500) NOT NULL,
    hero_title VARCHAR(200),
    hero_subtitle VARCHAR(500),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100)
);

-- Create index on updated_at for performance
CREATE INDEX IF NOT EXISTS idx_homepage_settings_updated_at ON homepage_settings(updated_at);

-- Insert default homepage settings
INSERT INTO homepage_settings (hero_image_url, hero_title, hero_subtitle, updated_by)
VALUES (
    '/images/default-hero.jpg',
    'Welcome to Our Tours',
    'Discover amazing destinations with our guided tours',
    'system'
) ON CONFLICT DO NOTHING;