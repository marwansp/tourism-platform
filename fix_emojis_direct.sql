-- Fix flag emojis for English and French
UPDATE languages SET flag_emoji = E'\U0001F1FA\U0001F1F8' WHERE code = 'en';  -- 🇺🇸
UPDATE languages SET flag_emoji = E'\U0001F1EB\U0001F1F7' WHERE code = 'fr';  -- 🇫🇷

-- Verify
SELECT code, name, flag_emoji FROM languages ORDER BY code;
