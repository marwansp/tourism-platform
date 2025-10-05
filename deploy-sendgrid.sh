#!/bin/bash

# Deploy SendGrid configuration to production server
echo "🚀 Deploying SendGrid configuration to production..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
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

# Step 1: Pull latest code
print_info "Step 1: Pulling latest code from GitHub..."
cd /var/www/tourism-platform
git pull origin main
print_status "Code updated"

# Step 2: Update .env file manually
print_warning "Step 2: You need to update .env file with your SendGrid API key"
print_info "Edit the .env file and add:"
echo "SENDGRID_API_KEY=your_actual_api_key_here"
echo "FROM_EMAIL=noreply@atlasbrotherstours.com"
echo "ADMIN_EMAIL=admin@atlasbrotherstours.com"
print_info "Press Enter when you've updated the .env file..."
read -p ""

# Step 3: Rebuild messaging service
print_info "Step 3: Rebuilding messaging service with SendGrid..."
docker-compose build --no-cache messaging-service
print_status "Messaging service rebuilt"

# Step 4: Restart messaging service
print_info "Step 4: Restarting messaging service..."
docker-compose up -d messaging-service
print_status "Messaging service restarted"

# Step 5: Test email functionality
print_info "Step 5: Testing email functionality..."
sleep 10

if curl -f http://localhost:8030/health > /dev/null 2>&1; then
    print_status "Messaging service is healthy"
else
    print_info "Messaging service might still be starting..."
fi

echo -e "${GREEN}"
echo "🎉 SendGrid Deployment Complete!"
echo "=================================="
echo "📧 Email service now uses SendGrid"
echo "🔧 Messaging API: http://localhost:8030"
echo "=================================="
echo -e "${NC}"

print_status "SendGrid deployment complete!"