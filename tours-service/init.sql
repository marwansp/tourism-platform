-- Initialize Tours Database
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tours table
CREATE TABLE IF NOT EXISTS tours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    duration TEXT NOT NULL,
    location TEXT NOT NULL,
    max_participants INTEGER NOT NULL DEFAULT 10,
    difficulty_level TEXT NOT NULL DEFAULT 'Easy',
    includes JSONB,
    available_dates JSONB,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for tours table
CREATE TRIGGER update_tours_updated_at 
    BEFORE UPDATE ON tours 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add missing columns for production compatibility
ALTER TABLE tours 
ADD COLUMN IF NOT EXISTS base_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS duration_description VARCHAR(50),
ADD COLUMN IF NOT EXISTS min_participants INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS group_discount_threshold INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS group_discount_percentage DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS tour_type VARCHAR(20) NOT NULL DEFAULT 'tour';

-- Add check constraint for tour_type
ALTER TABLE tours 
ADD CONSTRAINT IF NOT EXISTS check_tour_type 
CHECK (tour_type IN ('tour', 'excursion'));

-- Create index on tour_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_tours_tour_type ON tours(tour_type);

-- Insert sample data with beautiful Moroccan tourism images and complete details
INSERT INTO tours (title, description, price, duration, location, max_participants, difficulty_level, includes, available_dates, image_url) VALUES
('Marrakech City Tour', 'Explore the vibrant souks, historic palaces, and bustling Jemaa el-Fnaa square in Morocco''s red city. Visit the Bahia Palace, Saadian Tombs, and experience traditional Moroccan culture.', 45.00, '1 day', 'Marrakech', 15, 'Easy', '["Professional guide", "Transportation", "Entrance fees", "Traditional lunch"]', '["2024-12-01", "2024-12-05", "2024-12-10", "2024-12-15", "2024-12-20"]', 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'),
('Sahara Desert Adventure', 'Experience camel trekking, desert camping, and stunning sunsets in the Sahara Desert. Sleep under the stars in traditional Berber tents and enjoy authentic desert cuisine.', 180.00, '3 days / 2 nights', 'Merzouga', 8, 'Moderate', '["Camel trekking", "Desert camping", "All meals", "4WD transportation", "Berber guide"]', '["2024-12-03", "2024-12-10", "2024-12-17", "2024-12-24"]', 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'),
('Essaouira Coastal Escape', 'Discover the charming coastal town with its Portuguese architecture and fresh seafood. Explore the medina, ramparts, and enjoy the Atlantic Ocean breeze.', 65.00, '1 day', 'Essaouira', 12, 'Easy', '["Transportation", "Guided tour", "Seafood lunch", "Free time at beach"]', '["2024-12-02", "2024-12-07", "2024-12-14", "2024-12-21"]', 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'),
('Atlas Mountains Trek', 'Hike through Berber villages and enjoy breathtaking mountain scenery in the High Atlas. Experience traditional mountain life and stunning panoramic views.', 120.00, '2 days / 1 night', 'High Atlas Mountains', 10, 'Challenging', '["Mountain guide", "Accommodation", "All meals", "Hiking equipment", "Mule support"]', '["2024-12-06", "2024-12-13", "2024-12-20", "2024-12-27"]', 'https://images.unsplash.com/photo-1544967882-6abec37be2b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'),
('Fes Cultural Journey', 'Discover the ancient medina, traditional crafts, and rich history of Morocco''s spiritual capital. Visit the world''s oldest university and explore medieval streets.', 55.00, '1 day', 'Fes', 15, 'Easy', '["Expert guide", "Medina tour", "Craft workshops", "Traditional lunch", "Transportation"]', '["2024-12-04", "2024-12-11", "2024-12-18", "2024-12-25"]', 'https://images.unsplash.com/photo-1544967919-6e4b999de2a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'),
('Chefchaouen Blue City', 'Wander through the enchanting blue-painted streets of Morocco''s most photogenic town. Discover local crafts, mountain views, and peaceful atmosphere.', 75.00, '1 day', 'Chefchaouen', 12, 'Easy', '["Transportation", "Local guide", "Photography spots", "Traditional lunch", "Free exploration time"]', '["2024-12-08", "2024-12-15", "2024-12-22", "2024-12-29"]', 'https://images.unsplash.com/photo-1570939274717-7eda259b50ed?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')
ON CONFLICT DO NOTHING;

-- Update new columns with data from existing columns
UPDATE tours SET 
  base_price = COALESCE(price, 0),
  duration_description = COALESCE(duration, '1 day'),
  duration_days = 1,
  min_participants = 1,
  group_discount_threshold = 5,
  group_discount_percentage = 0.00
WHERE base_price IS NULL;

-- ============================================
-- Tours V2: Group Pricing and Tags Tables
-- ============================================

-- Create tour_group_pricing table
CREATE TABLE IF NOT EXISTS tour_group_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    min_participants INTEGER NOT NULL,
    max_participants INTEGER NOT NULL,
    price_per_person DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_participants_range CHECK (max_participants >= min_participants),
    CONSTRAINT check_positive_price CHECK (price_per_person > 0)
);

CREATE INDEX IF NOT EXISTS idx_tour_group_pricing_tour_id ON tour_group_pricing(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_group_pricing_participants ON tour_group_pricing(min_participants, max_participants);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50),
    category VARCHAR(20) NOT NULL DEFAULT 'included',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_tag_category CHECK (category IN ('included', 'not_included'))
);

CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_category ON tags(category);

-- Create tour_tags junction table
CREATE TABLE IF NOT EXISTS tour_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(tour_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_tour_tags_tour_id ON tour_tags(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_tags_tag_id ON tour_tags(tag_id);

-- Insert default tags
INSERT INTO tags (name, icon) VALUES
    ('Free Wi-Fi', '📶'),
    ('Breakfast Included', '🍳'),
    ('Private Transport', '🚗'),
    ('Professional Guide', '👨‍🏫'),
    ('Hotel Accommodation', '🏨'),
    ('Lunch Included', '🍽️'),
    ('Dinner Included', '🍴'),
    ('Camel Ride', '🐪'),
    ('Desert Camp', '⛺'),
    ('Mountain Trekking', '⛰️'),
    ('Cultural Tour', '🕌'),
    ('Photography Tour', '📸'),
    ('Family Friendly', '👨‍👩‍👧‍👦'),
    ('Adventure', '🏃'),
    ('Luxury', '⭐')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- Dynamic Languages System
-- ============================================

-- Create languages table for dynamic multi-language system
CREATE TABLE IF NOT EXISTS languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(2) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    native_name VARCHAR(100) NOT NULL,
    flag_emoji VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_default BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_languages_code ON languages(code);
CREATE INDEX IF NOT EXISTS idx_languages_active ON languages(is_active);

-- Add constraint to ensure only one language can be default
CREATE UNIQUE INDEX IF NOT EXISTS idx_languages_single_default ON languages(is_default) WHERE is_default = TRUE;

-- Seed default languages (English and French)
INSERT INTO languages (code, name, native_name, flag_emoji, is_active, is_default)
VALUES 
    ('en', 'English', 'English', '🇺🇸', TRUE, TRUE),
    ('fr', 'French', 'Français', '🇫🇷', TRUE, FALSE)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- Multilingual Support: Tour Translations
-- ============================================

CREATE TABLE IF NOT EXISTS tour_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    language VARCHAR(10) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    includes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(tour_id, language)
);

CREATE INDEX IF NOT EXISTS idx_tour_translations_tour_id ON tour_translations(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_translations_language ON tour_translations(language);

-- Create trigger for tour_translations updated_at
CREATE TRIGGER update_tour_translations_updated_at 
    BEFORE UPDATE ON tour_translations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Tour Info Sections (Custom Information)
-- ============================================

CREATE TABLE IF NOT EXISTS tour_info_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    title_en TEXT NOT NULL,
    title_fr TEXT NOT NULL,
    content_en TEXT NOT NULL,
    content_fr TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tour_info_sections_tour_id ON tour_info_sections(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_info_sections_display_order ON tour_info_sections(tour_id, display_order);

-- Create trigger for tour_info_sections updated_at
CREATE TRIGGER update_tour_info_sections_updated_at 
    BEFORE UPDATE ON tour_info_sections 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Tour Reviews
-- ============================================

CREATE TABLE IF NOT EXISTS tour_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    booking_id UUID,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tour_reviews_tour_id ON tour_reviews(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_reviews_booking_id ON tour_reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_tour_reviews_rating ON tour_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_tour_reviews_verified ON tour_reviews(is_verified);

-- Create trigger for tour_reviews updated_at
CREATE TRIGGER update_tour_reviews_updated_at 
    BEFORE UPDATE ON tour_reviews 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Tour Images (Multi-image support)
-- ============================================

CREATE TABLE IF NOT EXISTS tour_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_main BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    alt_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tour_images_tour_id ON tour_images(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_images_is_main ON tour_images(tour_id, is_main);
CREATE INDEX IF NOT EXISTS idx_tour_images_display_order ON tour_images(tour_id, display_order);

-- Create trigger for tour_images updated_at
CREATE TRIGGER update_tour_images_updated_at 
    BEFORE UPDATE ON tour_images 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
