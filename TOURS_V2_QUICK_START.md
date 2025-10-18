# Tours v2 - Quick Start Guide

## 🚀 What is Tours v2?

Tours v2 adds powerful new features to your tourism platform:
- **Group Pricing**: Different prices based on group size (1-2 people, 3-5 people, etc.)
- **Feature Tags**: Highlight tour features (Free Wi-Fi, Breakfast, Private Transport, etc.)
- **Simplified Booking**: Customers select only start date, system calculates end date
- **Smart Pricing**: Automatic price calculation with group discounts and seasonal rates

## ⚡ Quick Deploy (5 Minutes)

### 1. Apply Migration
```powershell
# Windows
.\apply_tours_v2_migration.ps1
```

### 2. Restart Services
```bash
docker-compose restart tours-service booking-service
```

### 3. Test It
```bash
python test_tours_v2.py
```

Done! ✅

## 📖 Usage Examples

### Setup Group Pricing
```bash
# 1-2 people: 1500 MAD/person
curl -X POST http://localhost:8010/tours/{tour_id}/group-pricing \
  -H "Content-Type: application/json" \
  -d '{"min_participants": 1, "max_participants": 2, "price_per_person": 1500}'

# 3-5 people: 1200 MAD/person (20% discount!)
curl -X POST http://localhost:8010/tours/{tour_id}/group-pricing \
  -H "Content-Type: application/json" \
  -d '{"min_participants": 3, "max_participants": 5, "price_per_person": 1200}'
```

### Add Tags to Tour
```bash
# List available tags
curl http://localhost:8010/tags

# Add Free Wi-Fi tag
curl -X POST http://localhost:8010/tours/{tour_id}/tags \
  -H "Content-Type: application/json" \
  -d '{"tag_id": "{wifi_tag_id}"}'
```

### Calculate Price
```bash
# For 4 people
curl "http://localhost:8010/tours/{tour_id}/calculate-price?participants=4"

# Response:
# {
#   "price_per_person": 1200,
#   "total_price": 4800,
#   "participants": 4,
#   "pricing_tier": "3-5 people"
# }
```

### Create V2 Booking
```bash
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

# System automatically:
# - Calculates end date (2025-06-04 for 3-day tour)
# - Applies group pricing (1200 MAD for 4 people)
# - Applies seasonal rates if configured
# - Creates booking with total price
```

## 🏷️ Default Tags

15 tags are pre-configured:
- 🌐 Free Wi-Fi
- 🍳 Breakfast Included
- 🚗 Private Transport
- 🏨 Accommodation Included
- 📸 Photography Allowed
- 🥾 Hiking Included
- 🏜️ Desert Experience
- 🏔️ Mountain Views
- 🌊 Beach Access
- 🍽️ Lunch Included
- 🍷 Dinner Included
- 🎫 Entrance Fees Included
- 👥 Small Group (Max 8)
- 🗣️ English Speaking Guide
- 🌍 Cultural Experience

## 📊 Benefits

### For Customers
- **Simpler**: Pick one date instead of two
- **Clearer**: See group discounts upfront
- **Better**: Know exactly what's included

### For Business
- **More Bookings**: Group discounts encourage larger parties
- **Higher Revenue**: Optimize pricing per group size
- **Better Marketing**: Highlight features with tags

## 🔧 API Endpoints

### Group Pricing
- `POST /tours/{id}/group-pricing` - Create tier
- `GET /tours/{id}/group-pricing` - List tiers
- `PUT /group-pricing/{id}` - Update tier
- `DELETE /group-pricing/{id}` - Delete tier
- `GET /tours/{id}/calculate-price?participants=N` - Calculate

### Tags
- `POST /tags` - Create tag
- `GET /tags` - List all tags
- `GET /tours/{id}/tags` - Get tour's tags
- `POST /tours/{id}/tags` - Add tag to tour
- `DELETE /tours/{id}/tags/{tag_id}` - Remove tag

### V2 Booking
- `POST /v2/bookings/calculate-price` - Calculate with group pricing
- `POST /v2/bookings` - Create booking (auto end date)

## 📚 Full Documentation

- **Implementation Guide**: `TOURS_V2_IMPLEMENTATION.md`
- **API Reference**: `TOURS_V2_API_REFERENCE.md`
- **Deployment Guide**: `DEPLOY_TOURS_V2.md`
- **Completion Summary**: `TOURS_V2_COMPLETION_SUMMARY.md`

## 🧪 Testing

```bash
# Automated tests
python test_tours_v2.py

# Manual API testing
# See TOURS_V2_API_REFERENCE.md for curl commands
```

## ❓ Troubleshooting

### Migration fails?
```bash
# Check if services are running
docker-compose ps

# View logs
docker-compose logs tours-service
```

### Tests fail?
```bash
# Make sure you have at least one tour
curl http://localhost:8010/tours

# Create a tour through admin panel if needed
```

### Can't connect?
```bash
# Restart services
docker-compose restart

# Check health
curl http://localhost:8010/health
curl http://localhost:8020/health
```

## 🎯 Next Steps

1. ✅ Deploy backend (you're done!)
2. ⏳ Update frontend UI
3. ⏳ Add admin interfaces
4. ⏳ Train staff on new features

## 💡 Pro Tips

1. **Start Simple**: Add 2-3 pricing tiers per tour
2. **Use Tags Wisely**: Only add relevant tags
3. **Test Pricing**: Use calculate endpoint before setting live
4. **Monitor Bookings**: Check which tiers are most popular
5. **Adjust Prices**: Update tiers based on demand

## 🎉 You're Ready!

The backend is complete and production-ready. Start adding group pricing and tags to your tours!

Need help? Check the full documentation or run the test script.
