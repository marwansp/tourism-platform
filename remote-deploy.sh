#!/bin/bash

# Tourism Platform Remote Deployment Script
# Run this script on your DigitalOcean server

echo "🚀 Starting Tourism Platform Deployment..."
echo "📍 Current directory: $(pwd)"

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found!"
    echo "Please run this script from /var/www/tourism-platform"
    exit 1
fi

# Create production environment file
echo "📝 Creating production environment file..."
if [ ! -f ".env.production" ]; then
    cp .env.example .env.production
    echo "✅ Created .env.production from template"
    echo "⚠️  Please edit .env.production with your database settings!"
else
    echo "✅ .env.production already exists"
fi

# Check Docker is running
echo "🐳 Checking Docker status..."
if ! docker --version > /dev/null 2>&1; then
    echo "❌ Docker is not installed or not running!"
    exit 1
fi

if ! docker-compose --version > /dev/null 2>&1; then
    echo "❌ Docker Compose is not installed!"
    exit 1
fi

echo "✅ Docker is ready"

# Stop any existing services
echo "🛑 Stopping existing services..."
docker-compose down 2>/dev/null || true

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up -d --build

# Wait for services to start
echo "⏳ Waiting for services to initialize..."
sleep 30

# Check service status
echo "📊 Checking service status..."
docker-compose ps

# Check if services are healthy
echo "🏥 Health check..."
RUNNING_SERVICES=$(docker-compose ps --services --filter "status=running" | wc -l)
TOTAL_SERVICES=$(docker-compose ps --services | wc -l)

echo "📈 Services running: $RUNNING_SERVICES/$TOTAL_SERVICES"

if [ "$RUNNING_SERVICES" -eq "$TOTAL_SERVICES" ]; then
    echo "✅ All services are running!"
else
    echo "⚠️  Some services may have issues. Check logs with:"
    echo "   docker-compose logs"
fi

# Get server IP
echo "🌐 Getting server IP..."
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "Unable to get IP")

echo ""
echo "🎉 Deployment Complete!"
echo "================================"
echo "🌍 Website: http://$SERVER_IP:3000"
echo "🔧 Admin: http://$SERVER_IP:3000/admin"
echo "📊 API Docs: http://$SERVER_IP:8010/docs"
echo "================================"
echo ""
echo "📋 Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  Restart: docker-compose restart"
echo "  Stop: docker-compose down"
echo "  Status: docker-compose ps"
echo ""
echo "🎯 Next steps:"
echo "1. Edit .env.production with your database settings"
echo "2. Test your website at the URLs above"
echo "3. Configure your domain name (optional)"