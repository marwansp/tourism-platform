#!/bin/bash
# Insert default tags into production database

echo "🏷️  Inserting default tags into production database..."

docker exec -i tourism-platform_tours-db_1 psql -U tours_user -d tours_db << 'EOF'

-- Insert default tags (will skip if they already exist due to UNIQUE constraint)
INSERT INTO tags (name, icon) VALUES
    ('Free Wi-Fi', '📶'),
    ('Breakfast Included', '🍳'),
    ('Private Transport', '🚗'),
    ('Professional Guide', '👨‍🏫'),
    ('Hotel Accommodation', '🏨'),
    ('Lunch Included', '🍽️'),
    ('Dinner Included', '🍴'),
    ('Camel Ride', '🐪'),
    ('Desert Camp', '⛺'),
    ('Mountain Trekking', '⛰️'),
    ('Cultural Tour', '🕌'),
    ('Photography Tour', '📸'),
    ('Family Friendly', '👨‍👩‍👧‍👦'),
    ('Adventure', '🏃'),
    ('Luxury', '⭐')
ON CONFLICT (name) DO NOTHING;

-- Show all tags
SELECT name, icon FROM tags ORDER BY name;

EOF

echo "✅ Tags inserted successfully!"
