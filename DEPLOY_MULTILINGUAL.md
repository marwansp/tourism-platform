# Deploy Multilingual Support - Quick Guide

## What's Been Completed ✅

Full multilingual support (English/French) for the tours platform:
- Database with translations table
- Backend API with language parameter
- Frontend automatically fetches tours in current language
- Language switcher triggers content updates

---

## Local Testing (Already Done) ✅

```bash
# Test backend API
python test_multilingual_api.py

# Services are running:
# - Tours Service: http://localhost:8010
# - Frontend: http://localhost:3000
```

---

## Production Deployment Steps

### 1. Backup Database
```bash
ssh user@your-server
cd /path/to/tour
./backup-databases.sh
```

### 2. Pull Latest Changes
```bash
git pull origin main
```

### 3. Apply Database Migration
```bash
# Make script executable
chmod +x apply_translations_migration.sh

# Run migration
./apply_translations_migration.sh

# Verify migration
docker-compose exec -T tours-db psql -U tours_user -d tours_db -c "SELECT COUNT(*) as total, language FROM tour_translations GROUP BY language;"
```

Expected output:
```
 total | language 
-------+----------
    11 | en
    11 | fr
```

### 4. Restart Services
```bash
# Restart tours service
docker-compose restart tours-service

# Rebuild and restart frontend
docker-compose build frontend
docker-compose up -d frontend
```

### 5. Verify Deployment
```bash
# Test English endpoint
curl http://localhost:8010/tours?lang=en | jq '.[0].title'

# Test French endpoint
curl http://localhost:8010/tours?lang=fr | jq '.[0].title'

# Check frontend
curl http://localhost:3000
```

### 6. Test in Browser
1. Visit your production URL
2. Browse tours (should show in English)
3. Click language switcher (🇬🇧/🇫🇷 in navbar)
4. Tours should update to French
5. Click on a tour to see details
6. Switch back to English - content updates

---

## Rollback Plan (If Needed)

### If Migration Fails
```bash
# Restore from backup
./restore-databases.sh

# Restart services
docker-compose restart tours-service
```

### If Frontend Issues
```bash
# Revert frontend changes
git checkout HEAD~1 frontend/

# Rebuild
docker-compose build frontend
docker-compose up -d frontend
```

---

## Post-Deployment Checklist

- [ ] Database migration applied successfully
- [ ] Tours service restarted without errors
- [ ] Frontend rebuilt and deployed
- [ ] English tours display correctly
- [ ] French tours display correctly
- [ ] Language switcher works
- [ ] Tour details page shows translations
- [ ] No console errors in browser
- [ ] API responds with correct language

---

## Monitoring

### Check Service Health
```bash
# Tours service logs
docker-compose logs --tail=50 tours-service

# Frontend logs
docker-compose logs --tail=50 frontend

# Database connection
docker-compose exec tours-db psql -U tours_user -d tours_db -c "SELECT version();"
```

### Check API Performance
```bash
# Test response time
time curl http://localhost:8010/tours?lang=en > /dev/null

# Should be < 1 second
```

---

## Troubleshooting

### Issue: Tours not showing in French
**Solution:**
```bash
# Check if translations exist
docker-compose exec -T tours-db psql -U tours_user -d tours_db -c "SELECT * FROM tour_translations WHERE language='fr' LIMIT 1;"

# If empty, re-run migration
./apply_translations_migration.sh
```

### Issue: 500 Error on API
**Solution:**
```bash
# Check logs
docker-compose logs --tail=100 tours-service

# Common issue: includes field parsing
# Already fixed in crud.py with JSON parsing
```

### Issue: Frontend not updating language
**Solution:**
```bash
# Clear browser cache
# Or rebuild frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

---

## Files Changed (For Reference)

### Backend
- `tours-service/schemas.py` - Translation schemas
- `tours-service/crud.py` - Multilingual CRUD functions
- `tours-service/main.py` - Language parameter in endpoints
- `tours-service/migrations/add_tour_translations.sql` - Database migration

### Frontend
- `frontend/src/api/tours.ts` - Language parameter in API calls
- `frontend/src/pages/ToursPage.tsx` - Fetch tours in current language
- `frontend/src/pages/TourDetailsPage.tsx` - Fetch tour details in current language
- `frontend/src/pages/HomePage.tsx` - Fetch featured tours in current language

---

## Success Criteria

✅ All 11 existing tours have English translations
✅ All 11 existing tours have French translations
✅ API responds correctly to ?lang=en and ?lang=fr
✅ Frontend displays tours in selected language
✅ Language switcher triggers content update
✅ No breaking changes to existing functionality
✅ All tests passing

---

## Support

If issues arise:
1. Check logs: `docker-compose logs tours-service`
2. Verify database: `docker-compose exec tours-db psql -U tours_user -d tours_db`
3. Test API directly: `curl http://localhost:8010/tours?lang=en`
4. Run test suite: `python test_multilingual_api.py`

---

**Deployment Time:** ~5-10 minutes
**Downtime:** None (rolling restart)
**Risk Level:** Low (backward compatible)

**Ready to deploy!** 🚀
