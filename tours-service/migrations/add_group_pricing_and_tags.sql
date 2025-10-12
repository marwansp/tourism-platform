-- Migration: Add Group Pricing and Tags Tables
-- Date: 2025-10-07
-- Description: Adds TourGroupPricing, Tag, and TourTag tables for v2 specification

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

CREATE INDEX idx_tour_group_pricing_tour_id ON tour_group_pricing(tour_id);
CREATE INDEX idx_tour_group_pricing_participants ON tour_group_pricing(min_participants, max_participants);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_tags_name ON tags(name);

-- Create tour_tags junction table
CREATE TABLE IF NOT EXISTS tour_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(tour_id, tag_id)
);

CREATE INDEX idx_tour_tags_tour_id ON tour_tags(tour_id);
CREATE INDEX idx_tour_tags_tag_id ON tour_tags(tag_id);

-- Insert some default tags
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

COMMENT ON TABLE tour_group_pricing IS 'Group-based pricing tiers for tours';
COMMENT ON TABLE tags IS 'Feature tags for tours (e.g., Free Wi-Fi, Breakfast included)';
COMMENT ON TABLE tour_tags IS 'Many-to-many relationship between tours and tags';
