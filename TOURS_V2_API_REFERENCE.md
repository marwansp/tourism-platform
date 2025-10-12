# Tours v2 API Reference

Quick reference for all new v2 endpoints.

## Tours Service (Port 8010)

### Group Pricing

#### Create Pricing Tier
```http
POST /tours/{tour_id}/group-pricing
Content-Type: application/json

{
  "min_participants": 3,
  "max_participants": 5,
  "price_per_person": 1200
}

Response: 200 OK
{
  "id": "uuid",
  "tour_id": "uuid",
  "min_participants": 3,
  "max_participants": 5,
  "price_per_person": 1200,
  "created_at": "2025-10-11T..."
}
```

#### List Pricing Tiers
```http
GET /tours/{tour_id}/group-pricing

Response: 200 OK
[
  {
    "id": "uuid",
    "tour_id": "uuid",
    "min_participants": 1,
    "max_participants": 2,
    "price_per_person": 1500,
    "created_at": "2025-10-11T..."
  },
  ...
]
```

#### Update Pricing Tier
```http
PUT /group-pricing/{pricing_id}
Content-Type: application/json

{
  "price_per_person": 1100
}

Response: 200 OK
{
  "id": "uuid",
  "tour_id": "uuid",
  "min_participants": 3,
  "max_participants": 5,
  "price_per_person": 1100,
  "created_at": "2025-10-11T..."
}
```

#### Delete Pricing Tier
```http
DELETE /group-pricing/{pricing_id}

Response: 200 OK
{
  "message": "Group pricing deleted successfully"
}
```

#### Calculate Price
```http
GET /tours/{tour_id}/calculate-price?participants=4

Response: 200 OK
{
  "price_per_person": 1200,
  "total_price": 4800,
  "participants": 4,
  "pricing_tier": "3-5 people"
}
```

### Tags

#### Create Tag
```http
POST /tags
Content-Type: application/json

{
  "name": "Free Wi-Fi",
  "icon": "🌐"
}

Response: 200 OK
{
  "id": "uuid",
  "name": "Free Wi-Fi",
  "icon": "🌐",
  "created_at": "2025-10-11T..."
}
```

#### List All Tags
```http
GET /tags?skip=0&limit=100

Response: 200 OK
[
  {
    "id": "uuid",
    "name": "Free Wi-Fi",
    "icon": "🌐",
    "created_at": "2025-10-11T..."
  },
  ...
]
```

#### Get Tag
```http
GET /tags/{tag_id}

Response: 200 OK
{
  "id": "uuid",
  "name": "Free Wi-Fi",
  "icon": "🌐",
  "created_at": "2025-10-11T..."
}
```

#### Update Tag
```http
PUT /tags/{tag_id}
Content-Type: application/json

{
  "name": "Free WiFi",
  "icon": "📶"
}

Response: 200 OK
{
  "id": "uuid",
  "name": "Free WiFi",
  "icon": "📶",
  "created_at": "2025-10-11T..."
}
```

#### Delete Tag
```http
DELETE /tags/{tag_id}

Response: 200 OK
{
  "message": "Tag deleted successfully"
}
```

### Tour-Tag Associations

#### Add Tag to Tour
```http
POST /tours/{tour_id}/tags
Content-Type: application/json

{
  "tag_id": "uuid"
}

Response: 200 OK
{
  "id": "uuid",
  "tour_id": "uuid",
  "tag_id": "uuid",
  "tag": {
    "id": "uuid",
    "name": "Free Wi-Fi",
    "icon": "🌐",
    "created_at": "2025-10-11T..."
  },
  "created_at": "2025-10-11T..."
}
```

#### Get Tour Tags
```http
GET /tours/{tour_id}/tags

Response: 200 OK
[
  {
    "id": "uuid",
    "tour_id": "uuid",
    "tag_id": "uuid",
    "tag": {
      "id": "uuid",
      "name": "Free Wi-Fi",
      "icon": "🌐",
      "created_at": "2025-10-11T..."
    },
    "created_at": "2025-10-11T..."
  },
  ...
]
```

#### Remove Tag from Tour
```http
DELETE /tours/{tour_id}/tags/{tag_id}

Response: 200 OK
{
  "message": "Tag removed from tour successfully"
}
```

## Booking Service (Port 8020)

### V2 Booking Endpoints

#### Calculate Price (V2)
```http
POST /v2/bookings/calculate-price
Content-Type: application/json

{
  "tour_id": "uuid",
  "start_date": "2025-06-01",
  "number_of_participants": 4
}

Response: 200 OK
{
  "tour_id": "uuid",
  "start_date": "2025-06-01",
  "end_date": "2025-06-04",
  "duration_days": 3,
  "number_of_participants": 4,
  "base_price_per_person": 1200,
  "seasonal_multiplier": 1.2,
  "final_price_per_person": 1440,
  "total_price": 5760,
  "currency": "MAD"
}
```

#### Create Booking (V2)
```http
POST /v2/bookings
Content-Type: application/json

{
  "tour_id": "uuid",
  "start_date": "2025-06-01",
  "number_of_participants": 4,
  "customer_name": "John Doe",
  "email": "john@example.com",
  "phone": "+212600000000",
  "special_requests": "Vegetarian meals please"
}

Response: 200 OK
{
  "id": "uuid",
  "tour_id": "uuid",
  "customer_name": "John Doe",
  "email": "john@example.com",
  "phone": "+212600000000",
  "start_date": "2025-06-01",
  "end_date": "2025-06-04",
  "number_of_participants": 4,
  "total_price": 5760,
  "status": "pending",
  "special_requests": "Vegetarian meals please",
  "admin_viewed": false,
  "created_at": "2025-10-11T...",
  "updated_at": "2025-10-11T..."
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation Error",
  "message": "max_participants must be greater than or equal to min_participants",
  "details": null
}
```

### 404 Not Found
```json
{
  "detail": "Tour not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Database Error",
  "message": "An error occurred while processing your request",
  "details": null
}
```

## Default Tags

The migration creates these 15 default tags:

| Tag | Icon | Description |
|-----|------|-------------|
| Free Wi-Fi | 🌐 | Internet access included |
| Breakfast Included | 🍳 | Morning meal provided |
| Private Transport | 🚗 | Dedicated vehicle |
| Accommodation Included | 🏨 | Lodging provided |
| Photography Allowed | 📸 | Take photos freely |
| Hiking Included | 🥾 | Walking activities |
| Desert Experience | 🏜️ | Sahara adventure |
| Mountain Views | 🏔️ | Scenic landscapes |
| Beach Access | 🌊 | Coastal activities |
| Lunch Included | 🍽️ | Midday meal provided |
| Dinner Included | 🍷 | Evening meal provided |
| Entrance Fees Included | 🎫 | No extra charges |
| Small Group (Max 8) | 👥 | Intimate experience |
| English Speaking Guide | 🗣️ | Language support |
| Cultural Experience | 🌍 | Local immersion |

## Usage Examples

### Complete Tour Setup Flow

```bash
# 1. Create a tour (existing endpoint)
curl -X POST http://localhost:8010/tours \
  -H "Content-Type: application/json" \
  -d '{
    "title": "3-Day Sahara Desert Tour",
    "description": "Experience the magic of the Sahara",
    "price": 1500,
    "duration": "3 days / 2 nights",
    "location": "Merzouga",
    "max_participants": 10,
    "difficulty_level": "Moderate"
  }'

# Save tour_id from response

# 2. Add group pricing tiers
curl -X POST http://localhost:8010/tours/{tour_id}/group-pricing \
  -H "Content-Type: application/json" \
  -d '{"min_participants": 1, "max_participants": 2, "price_per_person": 1500}'

curl -X POST http://localhost:8010/tours/{tour_id}/group-pricing \
  -H "Content-Type: application/json" \
  -d '{"min_participants": 3, "max_participants": 5, "price_per_person": 1200}'

curl -X POST http://localhost:8010/tours/{tour_id}/group-pricing \
  -H "Content-Type: application/json" \
  -d '{"min_participants": 6, "max_participants": 10, "price_per_person": 1000}'

# 3. Get available tags
curl http://localhost:8010/tags

# 4. Add tags to tour
curl -X POST http://localhost:8010/tours/{tour_id}/tags \
  -H "Content-Type: application/json" \
  -d '{"tag_id": "{desert_experience_tag_id}"}'

curl -X POST http://localhost:8010/tours/{tour_id}/tags \
  -H "Content-Type: application/json" \
  -d '{"tag_id": "{accommodation_tag_id}"}'

# 5. Calculate price for booking
curl -X POST http://localhost:8020/v2/bookings/calculate-price \
  -H "Content-Type: application/json" \
  -d '{
    "tour_id": "{tour_id}",
    "start_date": "2025-06-01",
    "number_of_participants": 4
  }'

# 6. Create booking
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

- All IDs are UUIDs
- Dates are in ISO 8601 format (YYYY-MM-DD)
- Prices are in MAD (Moroccan Dirham)
- All timestamps are in ISO 8601 format with timezone
- Group pricing tiers cannot overlap
- Tags are reusable across multiple tours
- V2 endpoints automatically calculate end dates
- Seasonal pricing multipliers still apply to group prices
