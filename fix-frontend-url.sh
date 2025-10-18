#!/bin/bash

# Fix FRONTEND_URL environment variable for review emails

echo "🔧 Fixing FRONTEND_URL configuration on production server..."
echo ""

# Copy updated docker-compose.yml to server
echo "📤 Uploading updated docker-compose.yml..."
scp docker-compose.yml root@159.89.1.127:/var/www/tourism-platform/

# SSH and restart booking service
echo "🔄 Restarting booking service with new configuration..."
ssh root@159.89.1.127 << 'ENDSSH'
cd /var/www/tourism-platform

# Restart booking service to pick up new environment variable
docker-compose up -d booking-service

# Wait a moment for service to start
sleep 3

# Check if service is running
echo ""
echo "📊 Service status:"
docker-compose ps booking-service

# Check the environment variables inside the container
echo ""
echo "🔍 Checking FRONTEND_URL inside container:"
docker-compose exec -T booking-service printenv | grep FRONTEND_URL

echo ""
echo "✅ Configuration updated!"
echo "📧 New review emails will use the correct domain"

ENDSSH

echo ""
echo "🎉 Fix completed!"
echo "💡 Test by completing a new booking"
