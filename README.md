# 🌍 Tourism Platform - Professional Booking System

A comprehensive, production-ready tourism and travel booking platform built with modern microservices architecture.

![Tourism Platform](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Docker](https://img.shields.io/badge/Docker-Containerized-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### 🎯 **Core Platform**
- ✅ **Complete Booking System** - End-to-end reservation workflow
- ✅ **Multi-language Support** - English/French internationalization
- ✅ **Admin Dashboard** - Comprehensive management interface
- ✅ **Guest Review System** - No-account reviews with verification
- ✅ **Email Notifications** - Automated customer communication
- ✅ **Image Gallery** - Multi-image tours with cloud storage
- ✅ **Responsive Design** - Mobile-first, works on all devices

### 🚀 **Advanced Features**
- ✅ **Microservices Architecture** - Scalable and maintainable
- ✅ **Date Range Pricing** - Seasonal pricing and availability
- ✅ **Professional UI/UX** - Modern, clean interface
- ✅ **Real-time Notifications** - Instant booking confirmations
- ✅ **SEO Optimized** - Search engine friendly
- ✅ **Security First** - CORS, XSS protection, input validation

## 🏗️ **Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Tours Service  │    │ Booking Service │
│   (React)       │    │   (FastAPI)     │    │   (FastAPI)     │
│   Port: 3000    │    │   Port: 8010    │    │   Port: 8020    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Messaging       │    │  Media Service  │    │ Settings        │
│ Service         │    │   (FastAPI)     │    │ Service         │
│ Port: 8030      │    │   Port: 8040    │    │ Port: 8050      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   Databases     │
                    └─────────────────┘
```

## 🛠️ **Tech Stack**

### **Frontend**
- **React 18** + TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Hook Form** for forms
- **React Hot Toast** for notifications
- **Lucide React** for icons

### **Backend**
- **Python FastAPI** microservices
- **SQLAlchemy** ORM with PostgreSQL
- **Pydantic** for data validation
- **HTTPX** for inter-service communication
- **Uvicorn** ASGI server

### **Infrastructure**
- **Docker** & **Docker Compose**
- **Nginx** reverse proxy
- **PostgreSQL** databases
- **SMTP** email integration
- **Object Storage** for media files

## 🚀 **Quick Start**

### **Prerequisites**
- Docker & Docker Compose
- Git
- 4GB+ RAM recommended

### **Local Development**
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/tourism-platform.git
cd tourism-platform

# Copy environment file
cp .env.example .env

# Configure your email settings in .env
# SMTP_SERVER=smtp.gmail.com
# SMTP_USERNAME=your-email@gmail.com
# SMTP_PASSWORD=your-app-password

# Start all services
docker-compose up -d

# Visit your application
open http://localhost:3000
```

### **Admin Dashboard**
- Visit: `http://localhost:3000/admin`
- Manage tours, bookings, and customer messages
- View analytics and system health

## 📦 **Services Overview**

| Service | Port | Description |
|---------|------|-------------|
| **Frontend** | 3000 | React application with admin dashboard |
| **Tours Service** | 8010 | Tour management, pricing, reviews |
| **Booking Service** | 8020 | Reservations, payments, notifications |
| **Messaging Service** | 8030 | Email notifications, contact forms |
| **Media Service** | 8040 | Image uploads, gallery management |
| **Settings Service** | 8050 | Configuration and system settings |

## 🌐 **Production Deployment**

### **DigitalOcean (Recommended)**
- **Cost**: ~$45/month
- **Free Credits**: $200 (4+ months free)
- **Setup Time**: 2-3 hours
- **Guide**: See `DIGITALOCEAN_DEPLOYMENT_GUIDE.md`

### **Google Cloud Platform**
- **Cost**: ~$50-80/month  
- **Free Credits**: $300 (6+ months free)
- **Auto-scaling**: Built-in
- **Enterprise**: Production-ready

## 📊 **Business Features**

### **For Tour Operators**
- ✅ **Complete Tour Management** - Create, edit, pricing
- ✅ **Booking Dashboard** - Real-time reservations
- ✅ **Customer Communication** - Automated emails
- ✅ **Review Management** - Guest feedback system
- ✅ **Analytics** - Booking trends and revenue
- ✅ **Multi-language** - Serve international customers

### **For Customers**
- ✅ **Easy Booking** - Simple 3-step process
- ✅ **Instant Confirmation** - Email notifications
- ✅ **Review System** - Share experiences
- ✅ **Mobile Friendly** - Book from any device
- ✅ **Secure** - Professional-grade security

## 🔧 **Development**

### **Project Structure**
```
tourism-platform/
├── frontend/                 # React application
├── tours-service/           # Tour management API
├── booking-service/         # Booking and reservations
├── messaging-service/       # Email notifications
├── media-service/          # Image and file management
├── settings-service/       # Configuration management
├── docker-compose.yml      # Development environment
└── README.md              # This file
```

### **Development Commands**
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart tours-service

# Stop all services
docker-compose down

# Reset databases (WARNING: Deletes all data)
docker-compose down -v
```

## 🔒 **Security**

- ✅ **HTTPS/SSL** encryption
- ✅ **Input validation** and sanitization
- ✅ **CORS** protection
- ✅ **XSS** prevention
- ✅ **SQL injection** protection
- ✅ **Rate limiting** on APIs
- ✅ **Secure headers** configuration

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Ready to launch your tourism business? This platform has everything you need!** 🚀

### 📊 **Stats**
- **Lines of Code**: 10,000+
- **Services**: 6 microservices
- **Languages**: Python, TypeScript, SQL
- **Containers**: Docker-ready
- **Production**: Deployment-ready

**Start taking bookings today!** 🌍✈️