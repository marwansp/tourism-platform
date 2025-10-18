#!/bin/bash

# Restart booking service to pick up new FRONTEND_URL environment variable

echo "🔄 Restarting booking service..."
docker-compose restart booking-service

echo "✅ Booking service restarted!"
echo "📧 New review emails will now use: http://159.89.1.127:3000"
