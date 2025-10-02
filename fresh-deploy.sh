#!/bin/bash

# Fresh Tourism Platform Deployment Script
# This script will clean everything and deploy fresh from GitHub

echo "🚀 Starting Fresh Tourism Platform Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Clean existing deployment
echo -e "${YELLOW}Step 1: Cleaning existing deployment...${NC}"
cd /var/www/
if [ -d "tourism-platform" ]; then
    cd tourism-platform
    docker-compose down --volumes --remove-orphans 2>/dev/null || true
    cd ..
    rm -rf tourism-platform
    echo -e "${GREEN}✅ Cleaned existing deployment${NC}"
fi

# Step 2: Clean Docker system
echo -e "${YELLOW}Step 2: Cleaning Docker system...${NC}"
docker system prune -af --volumes
echo -e "${GREEN}✅ Docker system cleaned${NC}"

# Step 3: Clone fresh code from GitHub
echo -e "${YELLOW}Step 3: Cloning fresh code from GitHub...${NC}"
git clone https://github.com/marwansp/tourism-platform.git
cd tourism-platform
echo -e "${GREEN}✅ Fresh code cloned${NC}"

# Step 4: Set up environment
echo -e "${YELLOW}Step 4: Setting up environment...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ Environment file created${NC}"
else
    echo -e "${GREEN}✅ Environment file exists${NC}"
fi

# Step 5: Start backend services first
echo -e "${YELLOW}Step 5: Starting backend services...${NC}"
docker-compose up -d tours-service
echo "⏳ Waiting for backend to be ready..."
sleep 30

# Test backend
echo -e "${YELLOW}Testing backend...${NC}"
if curl -f http://localhost:8010/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    exit 1
fi

# Step 6: Start all services
echo -e "${YELLOW}Step 6: Starting all services...${NC}"
docker-compose --profile full up -d
echo "⏳ Waiting for all services to start..."
sleep 60

# Step 7: Final health checks
echo -e "${YELLOW}Step 7: Running final health checks...${NC}"

# Check backend API
if curl -f http://localhost:8010/tours > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Tours API is working${NC}"
else
    echo -e "${RED}❌ Tours API failed${NC}"
fi

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is working${NC}"
else
    echo -e "${RED}❌ Frontend failed${NC}"
fi

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)

echo -e "${GREEN}"
echo "🎉 Deployment Complete!"
echo "=================================="
echo "🌐 Your Tourism Platform is ready!"
echo "📱 Frontend: http://$SERVER_IP:3000"
echo "🔧 API: http://$SERVER_IP:8010"
echo "📚 API Docs: http://$SERVER_IP:8010/docs"
echo "=================================="
echo -e "${NC}"

# Show running services
echo -e "${YELLOW}Running services:${NC}"
docker-compose ps