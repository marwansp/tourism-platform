-- Rollback Migration: Remove category column from tags table
-- Purpose: Revert the tag category feature
-- Date: 2025-11-06

-- Drop the index
DROP INDEX IF EXISTS idx_tags_category;

-- Drop the check constraint
ALTER TABLE tags 
DROP CONSTRAINT IF EXISTS check_tag_category;

-- Drop the category column
ALTER TABLE tags 
DROP COLUMN IF EXISTS category;

-- Verify rollback
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tags';
