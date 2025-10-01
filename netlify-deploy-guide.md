# 🚀 Netlify Deployment Guide

## Option 1: Frontend Demo with Mock Data

### Step 1: Create Mock Data Mode
Create a demo version that works without backend services.

### Step 2: Update API Configuration
```typescript
// frontend/src/api/config.ts - Add demo mode
const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

const API_BASE_URLS = {
  tours: isDemoMode ? '/mock-data' : '/api/tours',
  bookings: isDemoMode ? '/mock-data' : '/api/bookings',
  messaging: isDemoMode ? '/mock-data' : '/api/messaging',
  media: isDemoMode ? '/mock-data' : '/api/media'
}
```

### Step 3: Create Mock Data Files
```bash
# Create mock data directory
mkdir frontend/public/mock-data
```

### Step 4: Netlify Configuration
```toml
# netlify.toml
[build]
  publish = "frontend/dist"
  command = "cd frontend && npm run build"

[build.environment]
  VITE_DEMO_MODE = "true"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Option 2: Full Stack Deployment

### Recommended Platforms for Full Stack:
1. **Railway** - Easy Docker deployment
2. **Render** - Free tier with databases
3. **DigitalOcean App Platform** - Managed containers
4. **Heroku** - Classic PaaS (paid)
5. **AWS/GCP/Azure** - Full cloud deployment

### Railway Deployment (Easiest):
1. Connect GitHub repo
2. Railway auto-detects Docker Compose
3. Deploys all services automatically
4. Provides public URLs

## Option 3: Hybrid Approach
- **Frontend**: Netlify (static)
- **Backend**: Railway/Render (APIs + databases)
- **Update API URLs** to point to deployed backend