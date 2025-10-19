-- Migration: Add tour_info_sections table for custom tour information
-- Date: 2025-10-19
-- Description: Allows admins to add unlimited custom information sections to tours

-- Create tour_info_sections table
CREATE TABLE IF NOT EXISTS tour_info_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    title_en VARCHAR(200) NOT NULL,
    title_fr VARCHAR(200) NOT NULL,
    content_en TEXT NOT NULL,
    content_fr TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_tour_info_sections_tour_id ON tour_info_sections(tour_id);
CREATE INDEX idx_tour_info_sections_order ON tour_info_sections(tour_id, display_order);

-- Add update trigger
CREATE OR REPLACE FUNCTION update_tour_info_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tour_info_sections_updated_at
    BEFORE UPDATE ON tour_info_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_tour_info_sections_updated_at();

-- Verification
SELECT 'tour_info_sections table created successfully' AS status;
