-- Migration: Add tour_type column to tours table
-- Purpose: Distinguish between multi-day tours and day excursions
-- Date: 2025-11-06

-- Add tour_type column with default value 'tour'
ALTER TABLE tours 
ADD COLUMN IF NOT EXISTS tour_type VARCHAR(20) NOT NULL DEFAULT 'tour';

-- Add check constraint to ensure only valid tour types
ALTER TABLE tours 
ADD CONSTRAINT check_tour_type 
CHECK (tour_type IN ('tour', 'excursion'));

-- Create index on tour_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_tours_tour_type ON tours(tour_type);

-- Update existing tours based on duration (optional - you can skip this)
-- Tours with 1 day duration are likely excursions
UPDATE tours 
SET tour_type = 'excursion' 
WHERE duration_description LIKE '%1 day%' 
   OR duration_description LIKE '%Full Day%'
   OR duration_description LIKE '%Half Day%';

-- Verify migration
SELECT 
    tour_type,
    COUNT(*) as count
FROM tours
GROUP BY tour_type;
