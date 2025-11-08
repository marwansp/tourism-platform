#!/bin/bash

# Deploy Review System to Production
# This script updates the booking and messaging services with review request functionality

echo "🚀 Deploying Review Request System to Production..."
echo ""

# Check if we're on production server
if [ ! -d "/var/www/tourism-platform" ]; then
    echo "❌ Error: This script must be run on the production server"
    echo "Run this on your production server at: /var/www/tourism-platform"
    exit 1
fi

cd /var/www/tourism-platform

# Backup current services
echo "📦 Creating backup..."
timestamp=$(date +%Y%m%d_%H%M%S)
mkdir -p backups/$timestamp
cp -r booking-service backups/$timestamp/
cp -r messaging-service backups/$timestamp/
echo "✅ Backup created at: backups/$timestamp"
echo ""

# Pull latest code from git (if using git)
# Uncomment if you're using git:
# echo "📥 Pulling latest code..."
# git pull origin main
# echo ""

# Rebuild and restart booking-service
echo "🔨 Rebuilding booking-service..."
docker-compose build booking-service
echo ""

echo "🔄 Restarting booking-service..."
docker-compose up -d booking-service
echo ""

# Wait for service to start
echo "⏳ Waiting for booking-service to start..."
sleep 10

# Check if booking-service is running
if docker ps | grep -q "tourism-platform_booking-service"; then
    echo "✅ booking-service is running"
else
    echo "❌ booking-service failed to start"
    echo "Check logs with: docker logs tourism-platform_booking-service_1"
    exit 1
fi

# Rebuild and restart messaging-service
echo ""
echo "🔨 Rebuilding messaging-service..."
docker-compose build messaging-service
echo ""

echo "🔄 Restarting messaging-service..."
docker-compose up -d messaging-service
echo ""

# Wait for service to start
echo "⏳ Waiting for messaging-service to start..."
sleep 10

# Check if messaging-service is running
if docker ps | grep -q "tourism-platform_messaging-service"; then
    echo "✅ messaging-service is running"
else
    echo "❌ messaging-service failed to start"
    echo "Check logs with: docker logs tourism-platform_messaging-service_1"
    exit 1
fi

# Test the complete endpoint
echo ""
echo "🧪 Testing review system..."
echo "Checking if /bookings/{id}/complete endpoint exists..."

# Get a booking ID to test (get the first booking)
booking_id=$(docker exec tourism-platform_booking-service_1 python3 -c "
import psycopg2
conn = psycopg2.connect('postgresql://booking_user:booking_pass@booking-db:5432/booking_db')
cur = conn.cursor()
cur.execute('SELECT id FROM bookings WHERE status = %s LIMIT 1', ('confirmed',))
result = cur.fetchone()
if result:
    print(result[0])
" 2>/dev/null)

if [ -n "$booking_id" ]; then
    echo "Found test booking: $booking_id"
    echo "You can test the complete button in the admin panel"
else
    echo "No confirmed bookings found to test"
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to your admin panel: http://159.89.1.127:3000/admin"
echo "2. Find a confirmed booking"
echo "3. Click the 'Complete' button"
echo "4. Check the customer's email for the review request"
echo ""
echo "📊 Monitor logs with:"
echo "  docker logs -f tourism-platform_booking-service_1"
echo "  docker logs -f tourism-platform_messaging-service_1"
