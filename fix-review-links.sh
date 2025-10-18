#!/bin/bash

# Fix review email links to use correct domain instead of localhost

SERVER="root@159.89.1.127"
PROJECT_DIR="/var/www/tourism-platform"

echo "🔧 Fixing review email links on production server..."
echo ""

# SSH into server and update .env file
ssh $SERVER << 'ENDSSH'
cd /var/www/tourism-platform

# Add FRONTEND_URL to .env file if it doesn't exist
if ! grep -q "FRONTEND_URL" .env; then
    echo "" >> .env
    echo "# Frontend URL for email links" >> .env
    echo "FRONTEND_URL=http://159.89.1.127:3000" >> .env
    echo "✅ Added FRONTEND_URL to .env"
else
    # Update existing FRONTEND_URL
    sed -i 's|FRONTEND_URL=.*|FRONTEND_URL=http://159.89.1.127:3000|' .env
    echo "✅ Updated FRONTEND_URL in .env"
fi

# Show the updated .env file
echo ""
echo "📄 Current .env configuration:"
cat .env
echo ""

# Restart booking service to pick up new environment variable
echo "🔄 Restarting booking service..."
docker-compose restart booking-service

echo ""
echo "✅ Done! Review emails will now use: http://159.89.1.127:3000"
echo "📧 Test by completing a new booking"

ENDSSH

echo ""
echo "🎉 Fix applied successfully!"
