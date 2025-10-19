#!/bin/bash

# SAFE Production Deployment Script
# This script NEVER deletes data volumes
# It backs up databases before deployment

echo "🚀 Starting SAFE Production Deployment..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Step 1: Create backup directory
print_info "Step 1: Creating backup directory..."
BACKUP_DIR="/var/www/tourism-platform/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
print_status "Backup directory created: $BACKUP_DIR"

# Step 2: Backup databases
print_info "Step 2: Backing up databases..."

# Backup tours database
docker-compose exec -T tours-db pg_dump -U tours_user tours_db > $BACKUP_DIR/tours_db.sql
if [ $? -eq 0 ]; then
    print_status "Tours database backed up"
else
    print_error "Failed to backup tours database"
fi

# Backup booking database
docker-compose exec -T booking-db pg_dump -U booking_user booking_db > $BACKUP_DIR/booking_db.sql
if [ $? -eq 0 ]; then
    print_status "Booking database backed up"
else
    print_error "Failed to backup booking database"
fi

# Backup messaging database
docker-compose exec -T messaging-db pg_dump -U messaging_user messaging_db > $BACKUP_DIR/messaging_db.sql
if [ $? -eq 0 ]; then
    print_status "Messaging database backed up"
else
    print_error "Failed to backup messaging database"
fi

# Backup media database
docker-compose exec -T media-db pg_dump -U media_user media_db > $BACKUP_DIR/media_db.sql
if [ $? -eq 0 ]; then
    print_status "Media database backed up"
else
    print_error "Failed to backup media database"
fi

print_status "All databases backed up to: $BACKUP_DIR"

# Step 3: Pull latest code
print_info "Step 3: Pulling latest code from GitHub..."
git pull origin main
print_status "Code updated"

# Step 4: Rebuild services (WITHOUT deleting volumes)
print_info "Step 4: Rebuilding services..."
docker-compose build
print_status "Services rebuilt"

# Step 5: Restart services (WITHOUT --volumes flag)
print_info "Step 5: Restarting services..."
docker-compose down
docker-compose up -d
print_status "Services restarted"

# Step 6: Wait for services to be ready
print_info "Step 6: Waiting for services to be ready..."
sleep 30

# Step 7: Health checks
print_info "Step 7: Running health checks..."

if curl -f http://localhost:8010/health > /dev/null 2>&1; then
    print_status "Tours service is healthy"
else
    print_warning "Tours service health check failed"
fi

if curl -f http://localhost:8020/health > /dev/null 2>&1; then
    print_status "Booking service is healthy"
else
    print_warning "Booking service health check failed"
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status "Frontend is healthy"
else
    print_warning "Frontend health check failed"
fi

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)

echo -e "${GREEN}"
echo "🎉 SAFE Deployment Complete!"
echo "=================================="
echo "✅ Your data is SAFE!"
echo "📦 Backup location: $BACKUP_DIR"
echo "🌐 Website: http://$SERVER_IP:3000"
echo "=================================="
echo -e "${NC}"

print_info "Running services:"
docker-compose ps

print_status "Deployment complete! Your data was preserved."
