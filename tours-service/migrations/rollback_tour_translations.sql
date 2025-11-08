-- Rollback Migration: Revert tour_translations table to use language column
-- This rollback script reverses the migrate_tour_translations.sql migration
-- WARNING: This should only be used if you need to revert the migration

-- Step 1: Add back the old language column
ALTER TABLE tour_translations 
ADD COLUMN language VARCHAR(2);

-- Step 2: Copy data from language_code back to language
UPDATE tour_translations 
SET language = language_code;

-- Step 3: Make language NOT NULL
ALTER TABLE tour_translations 
ALTER COLUMN language SET NOT NULL;

-- Step 4: Drop the composite index
DROP INDEX IF EXISTS idx_tour_language;

-- Step 5: Drop the composite unique constraint
ALTER TABLE tour_translations
DROP CONSTRAINT IF EXISTS uq_tour_language;

-- Step 6: Drop the foreign key constraint
ALTER TABLE tour_translations
DROP CONSTRAINT IF EXISTS fk_tour_translations_language;

-- Step 7: Drop the language_code column
ALTER TABLE tour_translations 
DROP COLUMN language_code;

-- Step 8: Re-add the old unique constraint
ALTER TABLE tour_translations
ADD CONSTRAINT tour_translations_tour_id_language_key UNIQUE (tour_id, language);

-- Step 9: Re-add the old language index
CREATE INDEX idx_tour_translations_language ON tour_translations(language);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Tour translations table rollback completed!';
    RAISE NOTICE 'Restored language column';
    RAISE NOTICE 'Removed language_code column and foreign key';
    RAISE NOTICE 'Restored old unique constraint and index';
END $$;
