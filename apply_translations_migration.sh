#!/bin/bash

# Script to apply tour translations migration

echo "🌐 Applying Tour Translations Migration..."
echo "This will add multilingual support (English & French) to tours"
echo ""

# Apply migration to tours database
docker-compose exec -T tours-db psql -U tours_user -d tours_db < tours-service/migrations/add_tour_translations.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "📊 Checking results..."
    docker-compose exec -T tours-db psql -U tours_user -d tours_db -c "SELECT COUNT(*) as total_translations, language FROM tour_translations GROUP BY language;"
    echo ""
    echo "🎉 Multilingual support is now active!"
    echo "   - Existing tours migrated to English"
    echo "   - Default French translations created"
    echo "   - Admin can now edit both languages"
else
    echo ""
    echo "❌ Migration failed!"
    echo "Please check the error messages above"
    exit 1
fi
