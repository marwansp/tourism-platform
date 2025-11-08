-- Migration: Add languages table for dynamic multi-language system
-- This creates a languages table to store all available languages in the system

-- Create languages table
CREATE TABLE IF NOT EXISTS languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(2) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    native_name VARCHAR(100) NOT NULL,
    flag_emoji VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_default BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_languages_code ON languages(code);
CREATE INDEX idx_languages_active ON languages(is_active);

-- Add unique constraint on code column (already defined in table, but explicit for clarity)
-- The UNIQUE constraint on code is already enforced in the column definition above

-- Add constraint to ensure only one language can be default
CREATE UNIQUE INDEX idx_languages_single_default ON languages(is_default) WHERE is_default = TRUE;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Languages table created successfully!';
    RAISE NOTICE 'Indexes created: idx_languages_code, idx_languages_active';
    RAISE NOTICE 'Unique constraint enforced on code column';
    RAISE NOTICE 'Single default language constraint added';
END $$;
