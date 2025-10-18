# Deploy Tours v2 - Complete Guide

## Quick Start (Local Docker)

### Step 1: Apply Database Migration
```powershell
# Windows PowerShell
.\apply_tours_v2_migration.ps1
```

```bash
# Linux/Mac
./apply_tours_v2_migration.sh
```

### Step 2: Restart Services
```bash
docker-compose restart tours-service booking-service
```

### Step 3: Verify Installation
```bash
python test_tours_v2.py
```

## What's New in v2

### Backend Changes
✅ **Tours Service**
- Group pricing tiers (1-2 people, 3-5 people, 6-10 people, etc.)
- Feature tags (Free Wi-Fi, Breakfast, Private Transport, etc.)
- Price calculation API based on group size
- Tag management endpoints

✅ **Booking Service**
- V2 booking endpoints with single start date
- Automatic end date calculation
- Group pricing integration
- Seasonal pricing multipliers

✅ **Database**
- `tour_group_pricing` table
- `tags` table with 15 default tags
- `tour_tags` junction table

### Frontend Updates (API Ready)
✅ **API Methods Added** (`frontend/src/api/tours.ts`)
- `getGroupPricing()` - Get pricing tiers
- `createGroupPricing()` - Create pricing tier
- `calculatePrice()` - Calculate price for group
- `getAllTags()` - List all tags
- `getTourTags()` - Get tour's tags
- `addTagToTour()` - Add tag to tour

⏳ **UI Components** (To be implemented)
- Group pricing display on tour details
- Tag badges on tour cards
- Admin group pricing manager
- Admin tag manager

## Detailed Deployment Steps

### 1. Backup Current Database
```bash
# Backup tours database
docker exec tourism-tours-db pg_dump -U postgres tours_db > backup_tours_$(date +%Y%m%d).sql

# Backup bookings database
docker exec tourism-bookings-db pg_dump -U postgres bookings_db > backup_bookings_$(date +%Y%m%d).sql
```

### 2. Apply Migration
```powershell
# Windows
.\apply_tours_v2_migration.ps1
```

Expected output:
```
==========================================
  Applying Tours v2 Migration
==========================================

📊 Applying migration to tours database...
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE INDEX
CREATE INDEX
INSERT 0 15

✅ Migration applied successfully!

📋 What was added:
   - tour_group_pricing table
   - tags table (with 15 default tags)
   - tour_tags table

🎉 Tours v2 is ready to use!
```

### 3. Restart Services
```bash
# Restart affected services
docker-compose restart tours-service booking-service

# Or restart all services
docker-compose restart
```

### 4. Verify Services
```bash
# Check tours service
curl http://localhost:8010/health

# Check booking service
curl http://localhost:8020/health

# List tags
curl http://localhost:8010/tags
```

### 5. Run Tests
```bash
python test_tours_v2.py
```

Expected output:
```
============================================================
  TOURS V2 FEATURE TESTS
============================================================

============================================================
  Testing Group Pricing
============================================================

✓ Using tour: Desert Safari (ID: ...)
✓ Created pricing tier: 1-2 people @ 1500 MAD
✓ Created pricing tier: 3-5 people @ 1200 MAD
✓ Created pricing tier: 6-10 people @ 1000 MAD

✓ Retrieved 3 pricing tiers
  - 1-2 people: 1500 MAD
  - 3-5 people: 1200 MAD
  - 6-10 people: 1000 MAD

📊 Price Calculations:
  1 people: 1500 MAD/person = 1500 MAD total (1-2 people)
  4 people: 1200 MAD/person = 4800 MAD total (3-5 people)
  8 people: 1000 MAD/person = 8000 MAD total (6-10 people)

============================================================
  Testing Tags
============================================================

✓ Found 15 existing tags
  - Free Wi-Fi 🌐
  - Breakfast Included 🍳
  - Private Transport 🚗
  - Accommodation Included 🏨
  - Photography Allowed 📸

...

🎉 All tests completed!
```

## API Usage Examples

### 1. Setup Group Pricing for a Tour
```bash
# Get tour ID
TOUR_ID="your-tour-id-here"

# Add pricing tiers
curl -X POST http://localhost:8010/tours/$TOUR_ID/group-pricing \
  -H "Content-Type: application/json" \
  -d '{"min_participants": 1, "max_participants": 2, "price_per_person": 1500}'

curl -X POST http://localhost:8010/tours/$TOUR_ID/group-pricing \
  -H "Content-Type: application/json" \
  -d '{"min_participants": 3, "max_participants": 5, "price_per_person": 1200}'

curl -X POST http://localhost:8010/tours/$TOUR_ID/group-pricing \
  -H "Content-Type: application/json" \
  -d '{"min_participants": 6, "max_participants": 10, "price_per_person": 1000}'
```

### 2. Add Tags to a Tour
```bash
# Get available tags
curl http://localhost:8010/tags

# Add tags to tour
curl -X POST http://localhost:8010/tours/$TOUR_ID/tags \
  -H "Content-Type: application/json" \
  -d '{"tag_id": "tag-id-for-free-wifi"}'

curl -X POST http://localhost:8010/tours/$TOUR_ID/tags \
  -H "Content-Type: application/json" \
  -d '{"tag_id": "tag-id-for-breakfast"}'
```

### 3. Calculate Price for Booking
```bash
# Calculate price for 4 people
curl "http://localhost:8010/tours/$TOUR_ID/calculate-price?participants=4"

# Response:
# {
#   "price_per_person": 1200,
#   "total_price": 4800,
#   "participants": 4,
#   "pricing_tier": "3-5 people"
# }
```

### 4. Create V2 Booking
```bash
curl -X POST http://localhost:8020/v2/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "tour_id": "'$TOUR_ID'",
    "start_date": "2025-06-01",
    "number_of_participants": 4,
    "customer_name": "John Doe",
    "email": "john@example.com",
    "phone": "+212600000000"
  }'

# Response includes auto-calculated end_date and group pricing
```

## Troubleshooting

### Migration Fails
```bash
# Check if tables already exist
docker exec -it tourism-tours-db psql -U postgres -d tours_db -c "\dt"

# If tables exist, you may need to drop them first (CAUTION!)
docker exec -it tourism-tours-db psql -U postgres -d tours_db -c "DROP TABLE IF EXISTS tour_group_pricing, tags, tour_tags CASCADE;"

# Then rerun migration
.\apply_tours_v2_migration.ps1
```

### Services Not Responding
```bash
# Check service logs
docker-compose logs tours-service
docker-compose logs booking-service

# Restart services
docker-compose restart tours-service booking-service
```

### Test Script Fails
```bash
# Make sure services are running
docker-compose ps

# Check if you have tours in the database
curl http://localhost:8010/tours

# If no tours, create one first through the admin panel
```

## Production Deployment

### 1. Backup Production Database
```bash
# SSH to production server
ssh user@your-server

# Backup database
pg_dump -U postgres tours_db > backup_tours_$(date +%Y%m%d).sql
```

### 2. Apply Migration
```bash
# Copy migration file to server
scp tours-service/migrations/add_group_pricing_and_tags.sql user@your-server:/tmp/

# SSH to server and apply
ssh user@your-server
psql -U postgres -d tours_db < /tmp/add_group_pricing_and_tags.sql
```

### 3. Deploy Updated Code
```bash
# Pull latest code
git pull origin main

# Rebuild and restart services
docker-compose build tours-service booking-service
docker-compose up -d tours-service booking-service
```

### 4. Verify Production
```bash
# Check health
curl https://your-domain.com/api/tours/health
curl https://your-domain.com/api/bookings/health

# Test endpoints
curl https://your-domain.com/api/tours/tags
```

## Rollback Plan

If something goes wrong:

### 1. Restore Database
```bash
# Restore from backup
psql -U postgres -d tours_db < backup_tours_YYYYMMDD.sql
```

### 2. Revert Code
```bash
# Checkout previous version
git checkout <previous-commit-hash>

# Rebuild services
docker-compose build tours-service booking-service
docker-compose up -d
```

## Next Steps

### Frontend Implementation
1. **Tour Details Page**
   - Display group pricing table
   - Show feature tags with icons
   - Highlight applicable pricing tier

2. **Booking Page**
   - Single date picker (start date only)
   - Show calculated end date
   - Live price updates based on participants
   - Display group discount savings

3. **Admin Dashboard**
   - Group pricing manager
   - Tag manager
   - Assign tags to tours
   - Visual pricing tier editor

### Example Frontend Components
See `TOURS_V2_COMPLETION_SUMMARY.md` for detailed frontend requirements.

## Support

- **Documentation**: `TOURS_V2_IMPLEMENTATION.md`
- **API Reference**: `TOURS_V2_API_REFERENCE.md`
- **Test Script**: `test_tours_v2.py`
- **Issues**: Check service logs with `docker-compose logs`

## Summary

✅ **Completed**:
- Database migration
- Backend API endpoints
- CRUD operations
- Test suite
- API client methods

⏳ **Pending**:
- Frontend UI components
- Admin interfaces
- User-facing displays

The backend is production-ready. Frontend updates can be implemented incrementally without affecting existing functionality.
