-- Migration: Seed default languages (English and French)
-- This inserts the default languages that the system starts with

-- Insert English as the default language
INSERT INTO languages (code, name, native_name, flag_emoji, is_active, is_default)
VALUES ('en', 'English', 'English', '🇺🇸', TRUE, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Insert French as an active language
INSERT INTO languages (code, name, native_name, flag_emoji, is_active, is_default)
VALUES ('fr', 'French', 'Français', '🇫🇷', TRUE, FALSE)
ON CONFLICT (code) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Default languages seeded successfully!';
    RAISE NOTICE 'English (en) - Default language: ✓';
    RAISE NOTICE 'French (fr) - Active language: ✓';
END $$;
