-- Rollback Migration: Remove languages table
-- This rollback script reverses the add_languages_table.sql and seed_default_languages.sql migrations
-- WARNING: This will delete all language data. Only use if you need to completely revert.

-- Step 1: Drop the languages table (this will fail if foreign keys reference it)
-- Make sure to rollback tour_translations first!
DROP TABLE IF EXISTS languages CASCADE;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Languages table rollback completed!';
    RAISE NOTICE 'Dropped languages table and all related constraints';
    RAISE NOTICE 'WARNING: All language configuration data has been deleted';
END $$;
