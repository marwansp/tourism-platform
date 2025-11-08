-- Rollback Migration: Remove tour_type column from tours table
-- Date: 2025-11-06

-- Drop the index
DROP INDEX IF EXISTS idx_tours_tour_type;

-- Drop the check constraint
ALTER TABLE tours 
DROP CONSTRAINT IF EXISTS check_tour_type;

-- Drop the tour_type column
ALTER TABLE tours 
DROP COLUMN IF EXISTS tour_type;

-- Verify rollback
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tours'
ORDER BY ordinal_position;
