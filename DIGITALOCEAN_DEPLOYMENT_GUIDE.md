# 🚀 DigitalOcean VPS Deployment Guide

## Complete step-by-step guide to deploy your Tourism Platform on DigitalOcean

---

## 📋 **Pre-Deployment Checklist**

### ✅ What You Have Ready:
- ✅ **Complete Tourism Platform** - All services working locally
- ✅ **Docker Containers** - All services containerized
- ✅ **Database Migrations** - Schema ready for production
- ✅ **Email Configuration** - SMTP settings configured
- ✅ **Admin Dashboard** - Complete management system
- ✅ **Review System** - Guest reviews working

### 📝 What We'll Set Up:
- 🔲 **DigitalOcean Account** with $200 free credits
- 🔲 **VPS Droplet** (4GB RAM, 2 vCPUs)
- 🔲 **Managed PostgreSQL** database
- 🔲 **Spaces Object Storage** for images
- 🔲 **Domain Setup** (when you're ready)
- 🔲 **SSL Certificate** (free)
- 🔲 **Production Environment**

---

## 🏗️ **Step 1: Create DigitalOcean Account**

### 1.1 Sign Up for DigitalOcean
1. **Visit**: [DigitalOcean.com](https://digitalocean.com)
2. **Sign up** with your email
3. **Verify email** and complete profile
4. **Add payment method** (required for $200 free credits)
5. **Get $200 free credits** (valid for 60 days)

### 1.2 Enable Required Features
1. **Go to Account Settings**
2. **Enable**: Droplets, Databases, Spaces
3. **Verify**: Account is in good standing

---

## 🖥️ **Step 2: Create VPS Droplet**

### 2.1 Create New Droplet
1. **Click**: "Create" → "Droplets"
2. **Choose Image**: Ubuntu 22.04 LTS
3. **Choose Plan**: 
   - **Basic Plan**: $24/month
   - **4GB RAM / 2 vCPUs / 80GB SSD**
   - **4TB Transfer**

### 2.2 Droplet Configuration
```
Region: Choose closest to your customers
- New York (for US/Americas)
- Amsterdam (for Europe/Africa)
- Singapore (for Asia)

Authentication: SSH Key (Recommended)
- Generate SSH key on your computer
- Add public key to DigitalOcean

Hostname: tourism-platform
Tags: production, tourism
```

### 2.3 Generate SSH Key (Windows)
```powershell
# Open PowerShell and run:
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Copy public key:
Get-Content ~/.ssh/id_rsa.pub | Set-Clipboard
```

### 2.4 Add SSH Key to DigitalOcean
1. **Go to**: Settings → Security → SSH Keys
2. **Click**: "Add SSH Key"
3. **Paste**: Your public key
4. **Name**: "My Computer"

---

## 🗄️ **Step 3: Create Managed Database**

### 3.1 Create PostgreSQL Database
1. **Click**: "Create" → "Databases"
2. **Choose**: PostgreSQL 15
3. **Plan**: Basic - $15/month (1GB RAM, 1 vCPU, 10GB SSD)
4. **Region**: Same as your droplet
5. **Database Name**: `tourism_platform`
6. **Tags**: production, database

### 3.2 Database Configuration
```
Cluster Name: tourism-db-cluster
Database Name: tourism_platform
User: doadmin (default)
Password: [Auto-generated - save this!]
```

### 3.3 Configure Database Access
1. **Go to**: Database → Settings → Trusted Sources
2. **Add**: Your droplet's IP address
3. **Add**: Your home IP (for management)

---

## 📦 **Step 4: Create Object Storage**

### 4.1 Create Spaces Bucket
1. **Click**: "Create" → "Spaces Object Storage"
2. **Choose Region**: Same as droplet
3. **Bucket Name**: `tourism-platform-media`
4. **File Listing**: Restricted
5. **CDN**: Enable (free)

### 4.2 Generate API Keys
1. **Go to**: API → Spaces Keys
2. **Generate New Key**
3. **Name**: "Tourism Platform"
4. **Save**: Access Key and Secret Key

---

## 🚀 **Step 5: Deploy to VPS**

### 5.1 Connect to Your Droplet
```bash
# Connect via SSH (replace with your droplet IP)
ssh root@YOUR_DROPLET_IP

# Update system
apt update && apt upgrade -y

# Install required packages
apt install -y docker.io docker-compose git nginx certbot python3-certbot-nginx
```

### 5.2 Configure Docker
```bash
# Start Docker service
systemctl start docker
systemctl enable docker

# Add user to docker group (optional)
usermod -aG docker $USER
```

### 5.3 Clone Your Project
```bash
# Create project directory
mkdir -p /var/www/tourism-platform
cd /var/www/tourism-platform

# Clone your project (you'll need to push to GitHub first)
git clone https://github.com/YOUR_USERNAME/tourism-platform.git .
 git clone https://github.com/marwansp/tourism-platform.git 
# Or upload your files via SCP
# scp -r ./your-project root@YOUR_DROPLET_IP:/var/www/tourism-platform/
```

---

## ⚙️ **Step 6: Production Configuration**

### 6.1 Create Production Environment File
```bash
# Create production .env file
nano /var/www/tourism-platform/.env.production
```

### 6.2 Production Environment Variables
```env
# Database Configuration (from DigitalOcean Database)
DATABASE_URL=postgresql://doadmin:YOUR_DB_PASSWORD@YOUR_DB_HOST:25060/tourism_platform?sslmode=require

# Email Configuration (your existing settings)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=hamzaraji868@gmail.com
SMTP_PASSWORD=eyqr yccn eeob yrzf
FROM_EMAIL=hamzaraji868@gmail.com
ADMIN_EMAIL=hamzaraji868@gmail.com

# Production URLs
FRONTEND_URL=http://YOUR_DROPLET_IP
TOURS_SERVICE_URL=http://localhost:8010
BOOKING_SERVICE_URL=http://localhost:8020
MESSAGING_SERVICE_URL=http://localhost:8030
MEDIA_SERVICE_URL=http://localhost:8040

# Object Storage (Spaces)
SPACES_ACCESS_KEY=YOUR_SPACES_ACCESS_KEY
SPACES_SECRET_KEY=YOUR_SPACES_SECRET_KEY
SPACES_BUCKET=tourism-platform-media
SPACES_REGION=nyc3
SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com

# Security
SECRET_KEY=your-super-secret-key-here
DEBUG=false
ENVIRONMENT=production
```

### 6.3 Create Production Docker Compose
```bash
# Create production docker-compose file
nano /var/www/tourism-platform/docker-compose.prod.yml
```

```yaml
version: '3.8'

services:
  # Frontend
  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    networks:
      - tourism-network

  # Tours Service
  tours-service:
    build: 
      context: ./tours-service
      dockerfile: Dockerfile
    ports:
      - "8010:8010"
    env_file:
      - .env.production
    restart: unless-stopped
    networks:
      - tourism-network

  # Booking Service
  booking-service:
    build: 
      context: ./booking-service
      dockerfile: Dockerfile
    ports:
      - "8020:8020"
    env_file:
      - .env.production
    restart: unless-stopped
    networks:
      - tourism-network

  # Messaging Service
  messaging-service:
    build: 
      context: ./messaging-service
      dockerfile: Dockerfile
    ports:
      - "8030:8030"
    env_file:
      - .env.production
    restart: unless-stopped
    networks:
      - tourism-network

  # Media Service
  media-service:
    build: 
      context: ./media-service
      dockerfile: Dockerfile
    ports:
      - "8040:8040"
    env_file:
      - .env.production
    restart: unless-stopped
    networks:
      - tourism-network

  # Settings Service
  settings-service:
    build: 
      context: ./settings-service
      dockerfile: Dockerfile
    ports:
      - "8050:8050"
    env_file:
      - .env.production
    restart: unless-stopped
    networks:
      - tourism-network

networks:
  tourism-network:
    driver: bridge

volumes:
  media_data:
```

---

## 🚀 **Step 7: Deploy Application**

### 7.1 Build and Start Services
```bash
# Navigate to project directory
cd /var/www/tourism-platform

# Build all services
docker-compose -f docker-compose.prod.yml build

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check if all services are running
docker-compose -f docker-compose.prod.yml ps
```

### 7.2 Run Database Migrations
```bash
# Connect to your managed database and run migrations
# (You'll need to upload your SQL migration files)

# For tours database
psql "postgresql://doadmin:YOUR_PASSWORD@YOUR_DB_HOST:25060/tourism_platform?sslmode=require" -f tours-service/init.sql

# For booking database  
psql "postgresql://doadmin:YOUR_PASSWORD@YOUR_DB_HOST:25060/tourism_platform?sslmode=require" -f booking-service/init.sql

# Add other migrations as needed
```

---

## 🔒 **Step 8: Configure Nginx & SSL**

### 8.1 Configure Nginx (Without Domain)
```bash
# Create nginx configuration
nano /etc/nginx/sites-available/tourism-platform
```

```nginx
server {
    listen 80;
    server_name YOUR_DROPLET_IP;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API Routes
    location /api/tours/ {
        proxy_pass http://localhost:8010/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/bookings/ {
        proxy_pass http://localhost:8020/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/messaging/ {
        proxy_pass http://localhost:8030/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/media/ {
        proxy_pass http://localhost:8040/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 8.2 Enable Nginx Configuration
```bash
# Enable site
ln -s /etc/nginx/sites-available/tourism-platform /etc/nginx/sites-enabled/

# Remove default site
rm /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Restart nginx
systemctl restart nginx
```

---

## 🌐 **Step 9: Test Your Deployment**

### 9.1 Access Your Site
1. **Open browser** and go to: `http://YOUR_DROPLET_IP`
2. **Test all pages**:
   - Homepage ✅
   - Tours page ✅
   - Tour details ✅
   - Booking form ✅
   - Admin dashboard ✅
   - Contact form ✅

### 9.2 Test Admin Functions
1. **Go to**: `http://YOUR_DROPLET_IP/admin`
2. **Test**:
   - Create new tour ✅
   - Manage bookings ✅
   - Send emails ✅
   - Upload images ✅

---

## 🔧 **Step 10: Domain Setup (When Ready)**

### 10.1 Buy Domain Name
**Recommended Registrars:**
- **Namecheap** - $8-12/year
- **Google Domains** - $12/year
- **GoDaddy** - $10-15/year

**Good Domain Ideas:**
- `moroccoexplorer.com`
- `atlastours.com`
- `saharaadventures.com`
- `moroccanjourney.com`

### 10.2 Configure DNS
1. **Go to your domain registrar**
2. **Add DNS records**:
```
Type: A
Name: @
Value: YOUR_DROPLET_IP
TTL: 3600

Type: A  
Name: www
Value: YOUR_DROPLET_IP
TTL: 3600
```

### 10.3 Update Nginx for Domain
```bash
# Update nginx configuration
nano /etc/nginx/sites-available/tourism-platform

# Change server_name from IP to domain:
server_name yourdomain.com www.yourdomain.com;
```

### 10.4 Get SSL Certificate
```bash
# Install SSL certificate (after domain is configured)
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
certbot renew --dry-run
```

---

## 📊 **Step 11: Monitoring & Maintenance**

### 11.1 Set Up Monitoring
```bash
# Install monitoring tools
apt install -y htop iotop nethogs

# Check system resources
htop

# Monitor Docker containers
docker stats

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 11.2 Backup Strategy
```bash
# Create backup script
nano /root/backup.sh
```

```bash
#!/bin/bash
# Backup script for tourism platform

# Backup database
pg_dump "postgresql://doadmin:YOUR_PASSWORD@YOUR_DB_HOST:25060/tourism_platform?sslmode=require" > /root/backups/db_$(date +%Y%m%d).sql

# Backup application files
tar -czf /root/backups/app_$(date +%Y%m%d).tar.gz /var/www/tourism-platform

# Keep only last 7 days of backups
find /root/backups -name "*.sql" -mtime +7 -delete
find /root/backups -name "*.tar.gz" -mtime +7 -delete
```

### 11.3 Set Up Automatic Backups
```bash
# Make backup script executable
chmod +x /root/backup.sh

# Add to crontab (daily backup at 2 AM)
crontab -e

# Add this line:
0 2 * * * /root/backup.sh
```

---

## 💰 **Cost Summary**

### Monthly Costs:
```
VPS Droplet (4GB):           $24/month
Managed PostgreSQL:         $15/month
Spaces Object Storage:       $5/month
Domain (annual):             $1/month
Total:                       $45/month

First 2 months: FREE (using $200 credits)
```

---

## 🎉 **Congratulations!**

Your tourism platform is now live on DigitalOcean! 

### 🌟 **What You've Achieved:**
- ✅ **Professional hosting** on enterprise-grade infrastructure
- ✅ **Scalable architecture** ready for growth
- ✅ **Automated backups** and monitoring
- ✅ **Production-ready** with SSL and security
- ✅ **Cost-effective** solution under $50/month

### 🚀 **Next Steps:**
1. **Test everything** thoroughly
2. **Add your first tours** via admin dashboard
3. **Share with friends** for feedback
4. **Buy domain name** when ready
5. **Start marketing** your tourism business!

### � **Need iHelp?**
- **DigitalOcean Docs**: [docs.digitalocean.com](https://docs.digitalocean.com)
- **Community**: [digitalocean.com/community](https://digitalocean.com/community)
- **Support**: Available 24/7 via ticket system

**Your tourism platform is ready to take bookings and serve customers worldwide!** 🌍✈️

---

## 🔧 **Troubleshooting**

### Common Issues:

**Services not starting:**
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs service-name

# Restart specific service
docker-compose -f docker-compose.prod.yml restart service-name
```

**Database connection issues:**
```bash
# Test database connection
psql "postgresql://doadmin:PASSWORD@HOST:25060/tourism_platform?sslmode=require"

# Check firewall rules
ufw status
```

**Nginx issues:**
```bash
# Check nginx status
systemctl status nginx

# Test configuration
nginx -t

# Check error logs
tail -f /var/log/nginx/error.log
```

**SSL certificate issues:**
```bash
# Renew certificate
certbot renew

# Check certificate status
certbot certificates
```