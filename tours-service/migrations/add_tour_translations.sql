-- Migration: Add multilingual support for tours
-- This creates a tour_translations table to store tour content in multiple languages

-- Create tour_translations table
CREATE TABLE IF NOT EXISTS tour_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    language VARCHAR(5) NOT NULL CHECK (language IN ('en', 'fr')),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(100) NOT NULL,
    includes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tour_id, language)
);

-- Create index for faster lookups
CREATE INDEX idx_tour_translations_tour_id ON tour_translations(tour_id);
CREATE INDEX idx_tour_translations_language ON tour_translations(language);

-- Migrate existing tours to English translations
INSERT INTO tour_translations (id, tour_id, language, title, description, location, includes)
SELECT 
    gen_random_uuid(),
    id,
    'en' as language,
    title,
    description,
    location,
    includes
FROM tours
WHERE NOT EXISTS (
    SELECT 1 FROM tour_translations 
    WHERE tour_translations.tour_id = tours.id 
    AND tour_translations.language = 'en'
);

-- Add default French translations (copy from English for now, admin can edit later)
INSERT INTO tour_translations (id, tour_id, language, title, description, location, includes)
SELECT 
    gen_random_uuid(),
    id,
    'fr' as language,
    title || ' (FR)' as title,  -- Mark as French version
    description as description,
    location,
    includes
FROM tours
WHERE NOT EXISTS (
    SELECT 1 FROM tour_translations 
    WHERE tour_translations.tour_id = tours.id 
    AND tour_translations.language = 'fr'
);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tour_translation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tour_translations_updated_at
    BEFORE UPDATE ON tour_translations
    FOR EACH ROW
    EXECUTE FUNCTION update_tour_translation_updated_at();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Tour translations table created successfully!';
    RAISE NOTICE 'Existing tours migrated to English translations';
    RAISE NOTICE 'Default French translations created';
END $$;
