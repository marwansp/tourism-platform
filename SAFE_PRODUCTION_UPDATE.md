# 🛡️ Safe Production Update Guide

## ⚠️ IMPORTANT: This Update Preserves Your Data!

Unlike the full deployment script, this update script:
- ✅ **KEEPS all your existing tours**
- ✅ **KEEPS all your existing bookings**
- ✅ **Creates automatic backup before changes**
- ✅ **Only adds new features**
- ✅ **No downtime for database**

## What Will Be Added:

1. **Languages Table** - For dynamic multilingual support
2. **tour_type Column** - To distinguish tours from excursions
3. **tag_category Column** - To categorize tags as included/not_included
4. **Updated Frontend** - New hero images and fixed navigation
5. **Updated Backend** - New API endpoints for languages

## 📋 Pre-Update Checklist

Before running the update, verify:

```bash
# 1. Check you're in the right directory
cd /var/www/tourism-platform

# 2. Check current tour count
docker-compose exec tours-db psql -U tours_user -d tours_db -c "SELECT COUNT(*) FROM tours;"

# 3. Check if services are running
docker-compose ps
```

## 🚀 Update Steps

### Step 1: Upload the Update Script

From your local machine, copy the script to production:

```bash
scp production-update.sh root@your-server-ip:/var/www/tourism-platform/
```

Or create it directly on the server:

```bash
# SSH to server
ssh root@your-server-ip

# Navigate to project
cd /var/www/tourism-platform

# Create the script (copy content from production-update.sh)
nano production-update.sh

# Make it executable
chmod +x production-update.sh
```

### Step 2: Run the Update

```bash
cd /var/www/tourism-platform
sudo bash production-update.sh
```

The script will:
1. ✅ Create database backup
2. ✅ Pull latest code from GitHub
3. ✅ Apply database migrations
4. ✅ Rebuild services
5. ✅ Restart services
6. ✅ Run health checks
7. ✅ Verify data integrity

### Step 3: Verify Everything Works

After the update completes, test:

```bash
# 1. Check tour count (should be same as before)
docker-compose exec tours-db psql -U tours_user -d tours_db -c "SELECT COUNT(*) FROM tours;"

# 2. Check new tour_type column
docker-compose exec tours-db psql -U tours_user -d tours_db -c "SELECT title, tour_type FROM tours LIMIT 5;"

# 3. Check languages table
docker-compose exec tours-db psql -U tours_user -d tours_db -c "SELECT * FROM languages;"

# 4. Test APIs
curl http://localhost:8010/tours
curl http://localhost:8010/languages

# 5. Test frontend
curl http://localhost:3000
```

## 🔍 What Gets Changed

### Database Changes:

```sql
-- New table
CREATE TABLE languages (...)

-- New columns
ALTER TABLE tours ADD COLUMN tour_type VARCHAR(20) DEFAULT 'excursion';
ALTER TABLE tags ADD COLUMN category VARCHAR(20) DEFAULT 'included';
```

### Your Existing Tours:
- ✅ All tours preserved
- ✅ Automatically classified as 'excursion' (since they're 1-day tours)
- ✅ All relationships maintained
- ✅ All bookings preserved

### New Features Available:
- 🌐 Language management API
- 🏷️ Tag categories (included/not_included)
- 🎯 Tour type filtering (tour/excursion)
- 🖼️ Updated hero slider images
- 🔗 Fixed "View Details" button

## 🆘 Rollback Plan

If something goes wrong, you can restore from backup:

```bash
# Find your backup file
ls -lh tours_backup_*.sql

# Restore from backup
docker-compose exec -T tours-db psql -U tours_user -d tours_db < tours_backup_YYYYMMDD_HHMMSS.sql

# Restart services
docker-compose restart tours-service
```

## 📊 Expected Results

After update, your database will have:

### Tours Table:
```
- All existing tours ✅
- New column: tour_type = 'excursion' (for 1-day tours)
```

### Languages Table (NEW):
```
code | name    | is_default
-----|---------|------------
en   | English | true
fr   | French  | false
```

### Tags Table:
```
- All existing tags ✅
- New column: category = 'included'
```

## ⏱️ Estimated Time

- Backup: ~30 seconds
- Code pull: ~10 seconds
- Migration: ~5 seconds
- Rebuild: ~2-3 minutes
- Restart: ~30 seconds
- Health checks: ~30 seconds

**Total: ~4-5 minutes**

## 🎯 Success Indicators

You'll know the update succeeded when:

1. ✅ Script shows "🎉 Production Update Complete!"
2. ✅ Tour count matches pre-update count
3. ✅ Languages API returns 2 languages (en, fr)
4. ✅ Tours API still works
5. ✅ Frontend loads with new hero images
6. ✅ No errors in logs

## 🔧 Troubleshooting

### If migration fails:
```bash
# Check logs
docker-compose logs tours-service

# Restore from backup
docker-compose exec -T tours-db psql -U tours_user -d tours_db < tours_backup_*.sql
```

### If services won't start:
```bash
# Check what's wrong
docker-compose logs tours-service
docker-compose logs frontend

# Restart everything
docker-compose restart
```

### If API returns errors:
```bash
# Check database connection
docker-compose exec tours-db psql -U tours_user -d tours_db -c "SELECT 1;"

# Restart tours service
docker-compose restart tours-service
```

## 📞 Support

If you encounter issues:

1. Check the backup file exists: `ls -lh tours_backup_*.sql`
2. Check service logs: `docker-compose logs tours-service`
3. Verify database: `docker-compose exec tours-db psql -U tours_user -d tours_db -c "\dt"`

## ✅ Post-Update Tasks

After successful update:

1. Test creating a new tour with translations
2. Test language switcher on frontend
3. Test tour type filtering
4. Verify all existing tours still work
5. Keep backup file for at least 7 days

---

**Remember**: This update is **SAFE** and **NON-DESTRUCTIVE**. Your data will be preserved! 🛡️
