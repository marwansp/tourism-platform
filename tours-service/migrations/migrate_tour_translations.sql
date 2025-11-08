-- Migration: Migrate tour_translations table to use language_code foreign key
-- This migration transforms the tour_translations table from using a simple language string
-- to using a foreign key reference to the languages table

-- Step 1: Add new language_code column
ALTER TABLE tour_translations 
ADD COLUMN language_code VARCHAR(2);

-- Step 2: Migrate existing data from language column to language_code
-- Map existing 'en' and 'fr' values to the new language codes
UPDATE tour_translations 
SET language_code = CASE 
    WHEN language = 'en' THEN 'en'
    WHEN language = 'fr' THEN 'fr'
    ELSE 'en'  -- Default to English for any unexpected values
END;

-- Step 3: Make language_code NOT NULL now that data is migrated
ALTER TABLE tour_translations 
ALTER COLUMN language_code SET NOT NULL;

-- Step 4: Add foreign key constraint to languages.code
ALTER TABLE tour_translations
ADD CONSTRAINT fk_tour_translations_language 
FOREIGN KEY (language_code) REFERENCES languages(code) ON DELETE RESTRICT;

-- Step 5: Drop the old UNIQUE constraint on (tour_id, language)
ALTER TABLE tour_translations
DROP CONSTRAINT IF EXISTS tour_translations_tour_id_language_key;

-- Step 6: Drop old language column
ALTER TABLE tour_translations 
DROP COLUMN language;

-- Step 7: Add composite unique constraint on (tour_id, language_code)
ALTER TABLE tour_translations
ADD CONSTRAINT uq_tour_language UNIQUE (tour_id, language_code);

-- Step 8: Drop old language index
DROP INDEX IF EXISTS idx_tour_translations_language;

-- Step 9: Add new composite index on (tour_id, language_code) for performance
CREATE INDEX idx_tour_language ON tour_translations(tour_id, language_code);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Tour translations table migration completed successfully!';
    RAISE NOTICE 'Added language_code column with foreign key to languages table';
    RAISE NOTICE 'Migrated existing en/fr data to language_code';
    RAISE NOTICE 'Dropped old language column';
    RAISE NOTICE 'Added composite unique constraint: uq_tour_language (tour_id, language_code)';
    RAISE NOTICE 'Added composite index: idx_tour_language (tour_id, language_code)';
END $$;
