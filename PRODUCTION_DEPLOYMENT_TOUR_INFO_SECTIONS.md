# 🚀 Production Deployment Guide - Tour Info Sections

## Overview

This guide covers deploying the Tour Info Sections feature to production, including all database changes and service updates.

---

## 📋 What's New in This Deployment

### Database Changes
1. ✅ **tour_info_sections** table - Custom information sections for tours
2. ✅ **tour_translations** table - Multilingual support (if not already deployed)
3. ✅ **tour_reviews** table - Customer reviews (if not already deployed)
4. ✅ **tour_images** table - Multi-image support (if not already deployed)
5. ✅ **tour_group_pricing** table - Group pricing tiers (if not already deployed)
6. ✅ **tags** and **tour_tags** tables - Tour tagging system (if not already deployed)

### Backend Changes
- New API endpoints for info sections CRUD
- Updated models and schemas
- New CRUD operations

### Frontend Changes
- Admin panel for managing info sections
- Display sections on tour details page
- Rich text editor integration

---

## 🗄️ Database Migration Steps

### Option 1: Fresh Database (Recommended for New Production)

If you're setting up a fresh production database:

```bash
# Connect to production database
docker exec -it <production-tours-db-container> psql -U postgres -d tours_db

# Run the complete init.sql
\i /path/to/tours-service/init.sql
```

### Option 2: Incremental Migration (Existing Production)

If you already have a production database with data:

#### Step 1: Backup Current Database
```bash
# Backup before migration
docker exec <production-tours-db-container> pg_dump -U postgres tours_db > tours_db_backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Step 2: Apply Tour Info Sections Migration
```bash
# Copy migration file to container
docker cp tours-service/migrations/add_tour_info_sections.sql <production-tours-db-container>:/tmp/

# Execute migration
docker exec -it <production-tours-db-container> psql -U postgres -d tours_db -f /tmp/add_tour_info_sections.sql
```

#### Step 3: Verify Migration
```bash
# Check if table exists
docker exec -it <production-tours-db-container> psql -U postgres -d tours_db -c "\d tour_info_sections"

# Should show:
# - id (UUID)
# - tour_id (UUID)
# - title_en (TEXT)
# - title_fr (TEXT)
# - content_en (TEXT)
# - content_fr (TEXT)
# - display_order (INTEGER)
# - created_at (TIMESTAMP)
# - updated_at (TIMESTAMP)
```

---

## 🔧 Service Deployment

### Step 1: Update Tours Service

```bash
# Pull latest code
git pull origin main

# Rebuild tours-service
docker-compose build tours-service

# Stop current service
docker-compose stop tours-service

# Start updated service
docker-compose up -d tours-service

# Check logs
docker logs -f tour-tours-service-1
```

### Step 2: Update Frontend

```bash
# Rebuild frontend
docker-compose build frontend

# Stop current frontend
docker-compose stop frontend

# Start updated frontend
docker-compose up -d frontend

# Check logs
docker logs -f tour-frontend-1
```

---

## ✅ Verification Steps

### 1. Check Database Tables

```bash
docker exec -it <production-tours-db-container> psql -U postgres -d tours_db -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'tour_info_sections',
    'tour_translations',
    'tour_reviews',
    'tour_images',
    'tour_group_pricing',
    'tags',
    'tour_tags'
);"
```

Expected output: All 7 tables should be listed.

### 2. Test API Endpoints

```bash
# Get tours
curl https://your-domain.com/api/tours/tours

# Get info sections for a tour (should return empty array initially)
curl https://your-domain.com/api/tours/tours/{tour_id}/info-sections

# Test health
curl https://your-domain.com/api/tours/health
```

### 3. Test Admin Panel

1. Go to `https://your-domain.com/admin`
2. Navigate to **Settings** tab
3. Select a tour
4. Scroll to **Tour Information Sections**
5. Click **Add Section**
6. Fill in EN/FR content
7. Save and verify

### 4. Test Frontend Display

1. Go to tour details page
2. Check that sections appear below image thumbnails
3. Click to expand/collapse
4. Switch language to verify translations

---

## 🔄 Rollback Plan

If something goes wrong:

### Rollback Database

```bash
# Restore from backup
docker exec -i <production-tours-db-container> psql -U postgres tours_db < tours_db_backup_YYYYMMDD_HHMMSS.sql
```

### Rollback Services

```bash
# Checkout previous version
git checkout <previous-commit-hash>

# Rebuild and restart
docker-compose build tours-service frontend
docker-compose up -d tours-service frontend
```

---

## 📊 Database Schema Summary

### tour_info_sections Table

```sql
CREATE TABLE tour_info_sections (
    id UUID PRIMARY KEY,
    tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
    title_en TEXT NOT NULL,
    title_fr TEXT NOT NULL,
    content_en TEXT NOT NULL,
    content_fr TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_tour_info_sections_tour_id` on `tour_id`
- `idx_tour_info_sections_display_order` on `(tour_id, display_order)`

**Triggers:**
- `update_tour_info_sections_updated_at` - Auto-updates `updated_at` on row update

---

## 🔐 Security Considerations

1. **Input Validation**: All HTML content is validated on backend
2. **XSS Protection**: Frontend sanitizes HTML before rendering
3. **SQL Injection**: Using parameterized queries via SQLAlchemy
4. **Access Control**: Admin endpoints should be protected (add authentication if not already)

---

## 📈 Performance Considerations

1. **Indexes**: All foreign keys are indexed for fast lookups
2. **Caching**: Consider adding Redis cache for frequently accessed sections
3. **CDN**: Serve static assets through CDN
4. **Database Connection Pool**: Ensure proper connection pooling in production

---

## 🧪 Post-Deployment Testing Checklist

- [ ] Database tables created successfully
- [ ] All indexes created
- [ ] Triggers working (updated_at auto-updates)
- [ ] API endpoints responding
- [ ] Admin panel accessible
- [ ] Can create info sections
- [ ] Can edit info sections
- [ ] Can delete info sections
- [ ] Can reorder sections
- [ ] Sections display on tour details page
- [ ] Expand/collapse works
- [ ] Language switching works
- [ ] Rich text formatting displays correctly
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Performance acceptable (< 2s page load)

---

## 📝 Environment Variables

Ensure these are set in production `.env`:

```bash
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<secure-password>
POSTGRES_DB=tours_db

# Tours Service
TOURS_SERVICE_PORT=8010
DATABASE_URL=postgresql://postgres:<password>@tours-db:5432/tours_db

# Frontend
VITE_API_BASE_URL=https://your-domain.com/api
```

---

## 🆘 Troubleshooting

### Issue: Table already exists error

**Solution:**
```sql
-- Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'tour_info_sections'
);

-- If true, migration already applied
```

### Issue: Foreign key constraint fails

**Solution:**
```sql
-- Verify tours table exists
SELECT COUNT(*) FROM tours;

-- Check for orphaned records
SELECT * FROM tour_info_sections 
WHERE tour_id NOT IN (SELECT id FROM tours);
```

### Issue: API returns 404

**Solution:**
1. Check tours-service logs: `docker logs tour-tours-service-1`
2. Verify endpoints in main.py
3. Restart service: `docker-compose restart tours-service`

### Issue: Sections not displaying

**Solution:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear browser cache
3. Check browser console for errors
4. Verify API returns data: `curl /api/tours/tours/{id}/info-sections`

---

## 📞 Support

If you encounter issues:

1. Check logs: `docker logs tour-tours-service-1`
2. Check database: `docker exec -it <db-container> psql -U postgres tours_db`
3. Review this guide
4. Check GitHub issues

---

## ✅ Deployment Complete!

Once all checks pass, the Tour Info Sections feature is live in production! 🎉

**Next Steps:**
1. Monitor logs for errors
2. Test with real users
3. Gather feedback
4. Add more sections as needed

---

**Deployment Date:** _____________  
**Deployed By:** _____________  
**Version:** 1.0.0  
**Status:** ✅ Complete
