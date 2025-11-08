-- Migration: Add category column to tags table
-- Purpose: Allow tags to be categorized as "included" or "not_included"
-- Date: 2025-11-06

-- Add category column with default value 'included'
ALTER TABLE tags 
ADD COLUMN IF NOT EXISTS category VARCHAR(20) NOT NULL DEFAULT 'included';

-- Add check constraint to ensure only valid categories
ALTER TABLE tags 
ADD CONSTRAINT check_tag_category 
CHECK (category IN ('included', 'not_included'));

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_tags_category ON tags(category);

-- Update existing tags to have 'included' category (already default, but explicit)
UPDATE tags SET category = 'included' WHERE category IS NULL;

-- Verify migration
SELECT 
    COUNT(*) as total_tags,
    COUNT(CASE WHEN category = 'included' THEN 1 END) as included_tags,
    COUNT(CASE WHEN category = 'not_included' THEN 1 END) as not_included_tags
FROM tags;
