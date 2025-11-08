# Production Deployment Checklist

## ✅ Database Schema Updates Completed

### Changes Made to `tours-service/init.sql`

#### 1. **Languages Table** (Dynamic Multilingual System)
- ✅ Created `languages` table with columns:
  - `id`, `code`, `name`, `native_name`, `flag_emoji`
  - `is_active`, `is_default`, `created_at`
- ✅ Added indexes: `idx_languages_code`, `idx_languages_active`
- ✅ Added unique constraint for single default language
- ✅ Seeded default languages:
  - English (en) - Default
  - French (fr) - Active

#### 2. **Tour Translations Table**
- ✅ Already exists in init.sql
- ✅ Properly references languages system
- ✅ Includes trigger for `updated_at`

#### 3. **Tags Table Enhancement**
- ✅ Added `category` column (VARCHAR(20))
  - Values: 'included' or 'not_included'
  - Default: 'included'
- ✅ Added check constraint: `check_tag_category`
- ✅ Added index: `idx_tags_category`

#### 4. **Tours Table Enhancement**
- ✅ Added `tour_type` column (VARCHAR(20))
  - Values: 'tour' or 'excursion'
  - Default: 'tour'
- ✅ Added check constraint: `check_tour_type`
- ✅ Added index: `idx_tours_tour_type`

## 📋 Services Modified

### Frontend Service
- ✅ Updated hero slider images (Pexels URLs)
- ✅ Fixed "View Details" button navigation
- ✅ Dynamic language switcher
- ✅ Multilingual tour forms
- ✅ Tag category management UI
- ✅ Tour type filtering (Tours vs Excursions)

### Tours Service (Backend)
- ✅ Language management API endpoints
- ✅ Tour translations CRUD operations
- ✅ Tag category support
- ✅ Tour type filtering
- ✅ Enhanced tour creation/update with translations

## 🚀 Deployment Steps

### 1. Pre-Deployment Verification
```bash
# Verify init.sql has all changes
cat tours-service/init.sql | grep -E "(languages|tag_category|tour_type)"
```

### 2. Push to GitHub
```bash
git add .
git commit -m "Production ready: Added languages table, tag categories, and tour types to init.sql"
git push origin main
```

### 3. Deploy to Production Server
```bash
# SSH into production server
ssh user@your-server

# Run deployment script
cd /var/www/
bash production-deploy.sh
```

### 4. Post-Deployment Verification
```bash
# Check if languages table exists and has data
docker-compose exec tours-db psql -U tours_user -d tours_db -c "SELECT * FROM languages;"

# Check if tags have category column
docker-compose exec tours-db psql -U tours_user -d tours_db -c "SELECT name, category FROM tags LIMIT 5;"

# Check if tours have tour_type column
docker-compose exec tours-db psql -U tours_user -d tours_db -c "SELECT title, tour_type FROM tours LIMIT 5;"

# Test API endpoints
curl http://your-server:8010/languages
curl http://your-server:8010/tours
curl http://your-server:3000
```

## 🔍 What Gets Created on Fresh Deployment

When `init.sql` runs on a fresh database, it will create:

1. **Core Tables**
   - `tours` (with tour_type column)
   - `tour_group_pricing`
   - `tags` (with category column)
   - `tour_tags`
   - `languages` ⭐ NEW
   - `tour_translations`
   - `tour_info_sections`
   - `tour_reviews`
   - `tour_images`

2. **Default Data**
   - 6 sample tours (Marrakech, Sahara, Essaouira, Atlas, Fes, Chefchaouen)
   - 15 default tags (with 'included' category)
   - 2 default languages (English, French) ⭐ NEW

3. **Indexes & Constraints**
   - All performance indexes
   - Foreign key constraints
   - Check constraints for data validation
   - Unique constraints

## ⚠️ Important Notes

### Database Compatibility
- ✅ `init.sql` is now fully compatible with current codebase
- ✅ All migrations have been incorporated
- ✅ No manual migration needed after deployment

### Backward Compatibility
- ✅ Existing tours will have `tour_type='tour'` by default
- ✅ Existing tags will have `category='included'` by default
- ✅ System works with or without translations

### Environment Variables
Make sure `.env` file on production has:
```env
# Database
POSTGRES_USER=tours_user
POSTGRES_PASSWORD=tours_password
POSTGRES_DB=tours_db

# Email (update with real credentials)
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
ADMIN_EMAIL=admin@yourdomain.com
```

## 🎯 Success Criteria

After deployment, verify:
- [ ] Frontend loads at http://your-server:3000
- [ ] Hero slider shows new Pexels images
- [ ] Tours API returns data: http://your-server:8010/tours
- [ ] Languages API works: http://your-server:8010/languages
- [ ] Can create tours with translations
- [ ] Can manage tags with categories
- [ ] Can filter tours by type (tour/excursion)
- [ ] "View Details" button works on tour cards

## 📞 Troubleshooting

### If languages table is missing:
```bash
docker-compose exec tours-db psql -U tours_user -d tours_db -f /docker-entrypoint-initdb.d/init.sql
```

### If services won't start:
```bash
docker-compose logs tours-service
docker-compose logs frontend
```

### If database needs reset:
```bash
docker-compose down -v
docker-compose up -d
```

---

**Status**: ✅ Ready for Production Deployment
**Last Updated**: 2025-11-08
**Version**: 2.0 (Multilingual + Enhanced Features)
