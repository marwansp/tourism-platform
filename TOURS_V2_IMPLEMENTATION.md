# Tours Service v2 Implementation Guide

## Overview
This document tracks the implementation of Tours Service v2 with fixed-duration tours, group-based pricing, and feature tags.

## Changes Summary

### 1. Fixed Duration Tours
- ✅ Tours have fixed `duration_days` and `base_price`
- ✅ Customers select only `start_date`
- ✅ System calculates `end_date = start_date + duration_days`
- ✅ Price is fixed per tour (not multiplied by duration)

### 2. Group-Based Pricing
- ✅ New `TourGroupPricing` table with pricing tiers
- ✅ Example: 1 pax = €200, 2 pax = €110/person, 7-9 pax = €55/person
- ✅ Price lookup based on participant count
- ✅ Calculation: `total = price_per_person × participants`

### 3. Tour Tags/Features
- ✅ New `Tag` table for features (Free Wi-Fi, Breakfast, etc.)
- ✅ New `TourTag` junction table (many-to-many)
- ✅ Display as badges on tour cards
- ✅ Enable filtering by tags

## Database Changes

### New Tables Created:
1. **tour_group_pricing** - Group pricing tiers
2. **tags** - Feature tags
3. **tour_tags** - Tour-tag associations

### Migration File:
- `tours-service/migrations/add_group_pricing_and_tags.sql`

## API Endpoints to Add

### Tours Service:
- `GET /tours/{id}/group-pricing` - Get pricing table
- `POST /tours/{id}/group-pricing` - Add pricing tier (admin)
- `PUT /tours/{id}/group-pricing/{pricing_id}` - Update tier (admin)
- `DELETE /tours/{id}/group-pricing/{pricing_id}` - Delete tier (admin)
- `GET /tags` - List all available tags
- `POST /tags` - Create new tag (admin)
- `GET /tours/{id}/tags` - Get tags for a tour
- `POST /tours/{id}/tags` - Add tag to tour (admin)
- `DELETE /tours/{id}/tags/{tag_id}` - Remove tag from tour (admin)
- `GET /tours?tag={tag_name}` - Filter tours by tag

### Booking Service:
- `POST /bookings/v2` - New booking endpoint (single start date)
- `POST /bookings/v2/calculate-price` - Calculate price with group pricing
- `POST /bookings/v2/check-availability` - Check availability

## Implementation Steps

### Phase 1: Backend (Tours Service) ✅ COMPLETED
1. ✅ Add new models to `models.py`
2. ✅ Create migration SQL file
3. ✅ Add schemas to `schemas.py`
4. ✅ Add CRUD operations for group pricing
5. ✅ Add CRUD operations for tags
6. ✅ Add new API endpoints to `main.py`
7. ✅ Update existing tour response to include group_pricing and tags

### Phase 2: Backend (Booking Service) ✅ COMPLETED
8. ✅ Create v2 schemas in `schemas_v2.py`
9. ✅ Update pricing service to use group pricing table
10. ✅ Add v2 booking endpoints
11. ✅ Update booking creation to calculate end_date automatically
12. ✅ Add tours client methods for group pricing and seasonal pricing

### Phase 3: Testing ✅ COMPLETED
13. ✅ Created comprehensive test script `test_tours_v2.py`
14. ✅ Test group pricing calculations
15. ✅ Test tag management
16. ✅ Test tour-tag associations
17. ✅ Test booking flow with single date
18. ✅ Test price calculations with group discounts

### Phase 4: Frontend (Next)
19. ⏳ Update BookingPage - single date picker
20. ⏳ Add participant selector with live price update
21. ⏳ Display group pricing table on tour details
22. ⏳ Add tag badges to TourCard component
23. ⏳ Add tag filters to ToursPage
24. ⏳ Update AdminPage - group pricing editor
25. ⏳ Update AdminPage - tag selector

### Phase 5: Production Deployment (Future)
26. ⏳ Run migration on production database
27. ⏳ Deploy updated services
28. ⏳ Verify all functionality

## Backward Compatibility

### Maintained for Smooth Transition:
- Old `start_date` + `end_date` booking endpoints still work
- Legacy `travel_date` field preserved
- Old group discount fields kept (will be deprecated later)
- Seasonal pricing still applies on top of group pricing

### Migration Path:
1. Deploy v2 with both old and new endpoints
2. Update frontend to use v2 endpoints
3. Test thoroughly
4. Deprecate v1 endpoints after 30 days
5. Remove legacy fields in future update

## Testing

### Automated Test Script
Run the comprehensive test suite:
```bash
# Make sure services are running
docker-compose up -d

# Run tests
python test_tours_v2.py
```

### Testing Checklist
- ✅ Create tour with group pricing tiers
- ✅ Add tags to tours
- ✅ Calculate price for different group sizes
- ✅ Book tour with single start date
- ✅ Verify end_date calculated correctly
- ✅ Test seasonal pricing still applies
- ⏳ Filter tours by tags (frontend needed)
- ⏳ Test admin can manage pricing tiers (frontend needed)
- ⏳ Test admin can manage tags (frontend needed)
- ⏳ Verify emails sent correctly

### Manual API Testing
```bash
# 1. Create group pricing tier
curl -X POST http://localhost:8010/tours/{tour_id}/group-pricing \
  -H "Content-Type: application/json" \
  -d '{
    "min_participants": 3,
    "max_participants": 5,
    "price_per_person": 1200
  }'

# 2. Get all pricing tiers
curl http://localhost:8010/tours/{tour_id}/group-pricing

# 3. Calculate price for group
curl "http://localhost:8010/tours/{tour_id}/calculate-price?participants=4"

# 4. List all tags
curl http://localhost:8010/tags

# 5. Add tag to tour
curl -X POST http://localhost:8010/tours/{tour_id}/tags \
  -H "Content-Type: application/json" \
  -d '{"tag_id": "{tag_id}"}'

# 6. Get tour tags
curl http://localhost:8010/tours/{tour_id}/tags

# 7. Calculate v2 booking price
curl -X POST http://localhost:8020/v2/bookings/calculate-price \
  -H "Content-Type: application/json" \
  -d '{
    "tour_id": "{tour_id}",
    "start_date": "2025-06-01",
    "number_of_participants": 4
  }'

# 8. Create v2 booking
curl -X POST http://localhost:8020/v2/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "tour_id": "{tour_id}",
    "start_date": "2025-06-01",
    "number_of_participants": 4,
    "customer_name": "John Doe",
    "email": "john@example.com",
    "phone": "+212600000000"
  }'
```

## Notes
- All prices in EUR (€)
- Group pricing overrides old group_discount_percentage
- Seasonal multipliers still apply to group prices
- Tags are reusable across multiple tours
