#!/bin/bash

# Production-Ready Tourism Platform Deployment Script
# This script handles all the issues we encountered during development

echo "🚀 Starting Production Tourism Platform Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Clean existing deployment
print_info "Step 1: Cleaning existing deployment..."
cd /var/www/
if [ -d "tourism-platform" ]; then
    cd tourism-platform
    docker-compose down --volumes --remove-orphans 2>/dev/null || true
    cd ..
    rm -rf tourism-platform
    print_status "Cleaned existing deployment"
fi

# Step 2: Clean Docker system
print_info "Step 2: Cleaning Docker system..."
docker system prune -af --volumes
print_status "Docker system cleaned"

# Step 3: Clone fresh code from GitHub
print_info "Step 3: Cloning fresh code from GitHub..."
git clone https://github.com/marwansp/tourism-platform.git
cd tourism-platform
print_status "Fresh code cloned"

# Step 4: Set up environment
print_info "Step 4: Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    print_status "Environment file created from example"
    print_warning "Please update .env with your email credentials before running services"
else
    print_status "Environment file exists"
fi

# Check if email is configured
if grep -q "your-email@gmail.com" .env 2>/dev/null; then
    print_warning "Email not configured! Update SMTP settings in .env file"
    print_info "Edit .env and set: SMTP_USERNAME, SMTP_PASSWORD, FROM_EMAIL, ADMIN_EMAIL"
fi

# Step 5: Start database services first
print_info "Step 5: Starting database services..."
docker-compose up -d tours-db booking-db messaging-db media-db
print_info "Waiting for databases to initialize..."
sleep 30

# Step 6: Check database health
print_info "Step 6: Checking database health..."
for i in {1..10}; do
    if docker-compose exec tours-db pg_isready -U tours_user -d tours_db > /dev/null 2>&1; then
        print_status "Tours database is ready"
        break
    fi
    print_info "Waiting for tours database... ($i/10)"
    sleep 5
done

for i in {1..10}; do
    if docker-compose exec booking-db pg_isready -U booking_user -d booking_db > /dev/null 2>&1; then
        print_status "Booking database is ready"
        break
    fi
    print_info "Waiting for booking database... ($i/10)"
    sleep 5
done

# Step 7: Start backend services
print_info "Step 7: Starting backend services..."
docker-compose up -d tours-service booking-service messaging-service media-service minio
print_info "Waiting for backend services to start..."
sleep 30

# Step 8: Test backend services
print_info "Step 8: Testing backend services..."
for i in {1..10}; do
    if curl -f http://localhost:8010/health > /dev/null 2>&1; then
        print_status "Tours service is healthy"
        break
    fi
    print_info "Waiting for tours service... ($i/10)"
    sleep 5
done

for i in {1..10}; do
    if curl -f http://localhost:8020/health > /dev/null 2>&1; then
        print_status "Booking service is healthy"
        break
    fi
    print_info "Waiting for booking service... ($i/10)"
    sleep 5
done

# Step 9: Start frontend
print_info "Step 9: Starting frontend..."
docker-compose --profile full up -d frontend
print_info "Waiting for frontend to start..."
sleep 30

# Step 10: Final health checks
print_info "Step 10: Running final health checks..."

# Check tours API
if curl -f http://localhost:8010/tours > /dev/null 2>&1; then
    print_status "Tours API is working"
else
    print_error "Tours API failed"
fi

# Check booking API
if curl -f http://localhost:8020/health > /dev/null 2>&1; then
    print_status "Booking API is working"
else
    print_error "Booking API failed"
fi

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status "Frontend is working"
else
    print_error "Frontend failed"
fi

# Check proxy endpoints
if curl -f http://localhost:3000/api/tours/tours > /dev/null 2>&1; then
    print_status "Frontend proxy is working"
else
    print_error "Frontend proxy failed"
fi

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)

echo -e "${GREEN}"
echo "🎉 Production Deployment Complete!"
echo "=================================="
echo "🌐 Your Tourism Platform is ready!"
echo "📱 Frontend: http://$SERVER_IP:3000"
echo "🔧 Tours API: http://$SERVER_IP:8010"
echo "📋 Booking API: http://$SERVER_IP:8020"
echo "📚 API Docs: http://$SERVER_IP:8010/docs"
echo "=================================="
echo -e "${NC}"

# Show running services
print_info "Running services:"
docker-compose ps

print_status "All services are ready for production use!"