#!/bin/bash

echo "=========================================="
echo "  Applying Tours v2 Migration"
echo "=========================================="

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if tours database container is running
if ! docker ps | grep -q tourism-tours-db; then
    echo "❌ Tours database container is not running."
    echo "   Run: docker-compose up -d"
    exit 1
fi

echo ""
echo "📊 Applying migration to tours database..."
docker exec -i tourism-tours-db psql -U postgres -d tours_db < tours-service/migrations/add_group_pricing_and_tags.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "📋 What was added:"
    echo "   - tour_group_pricing table"
    echo "   - tags table (with 15 default tags)"
    echo "   - tour_tags table"
    echo ""
    echo "🎉 Tours v2 is ready to use!"
    echo ""
    echo "Next steps:"
    echo "   1. Restart tours service: docker-compose restart tours-service"
    echo "   2. Run tests: python test_tours_v2.py"
else
    echo ""
    echo "❌ Migration failed. Check the error above."
    exit 1
fi
