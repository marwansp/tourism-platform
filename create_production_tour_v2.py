#!/usr/bin/env python3
"""
Create professional tours with group pricing, tags, and multiple images on production server
"""
import requests
import json
import time

# Production server URL
BASE_URL = "http://159.89.1.127:8010"

def delete_all_tours():
    """Delete all existing tours"""
    print("🗑️  Deleting all existing tours...")
    try:
        response = requests.get(f"{BASE_URL}/tours")
        response.raise_for_status()
        tours = response.json()
        
        for tour in tours:
            try:
                delete_response = requests.delete(f"{BASE_URL}/tours/{tour['id']}")
                delete_response.raise_for_status()
                print(f"   ✅ Deleted: {tour['title']}")
            except Exception as e:
                print(f"   ❌ Error deleting {tour['title']}: {e}")
        
        print(f"   ✅ Deleted {len(tours)} tours\n")
    except Exception as e:
        print(f"   ❌ Error fetching tours: {e}\n")

def create_all_professional_tours():
    """Create all professional tours with images, pricing, and tags"""
    
    tours_data = [
        {
            "title": "Marrakech Imperial City Discovery",
            "description": "Immerse yourself in the vibrant heart of Morocco. Explore the bustling souks of the medina, marvel at the intricate architecture of Bahia Palace, wander through the serene Majorelle Gardens, and experience the electric atmosphere of Jemaa el-Fnaa square. This comprehensive tour showcases the best of Marrakech's rich history, culture, and traditions.",
            "price": 85.00,
            "duration": "1 day",
            "location": "Marrakech",
            "max_participants": 20,
            "difficulty_level": "Easy",
            "includes": [
                "Expert local guide",
                "All entrance fees",
                "Traditional Moroccan lunch",
                "Hotel pickup and drop-off",
                "Bottled water",
                "Visit to Bahia Palace",
                "Majorelle Gardens tour",
                "Souk shopping experience"
            ],
            "images": [
                "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=1200&q=90",
                "https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=1200&q=90",
                "https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1200&q=90",
                "https://images.unsplash.com/photo-1555993539-1732b0258235?w=1200&q=90"
            ],
            "pricing_tiers": [
                {"min": 1, "max": 2, "price": 120.00},
                {"min": 3, "max": 5, "price": 95.00},
                {"min": 6, "max": 10, "price": 75.00},
                {"min": 11, "max": 20, "price": 65.00}
            ],
            "tags": ["Professional Guide", "Lunch Included", "Cultural Tour", "Family Friendly", "Private Transport"]
        },
        {
            "title": "Sahara Desert 3-Day Expedition",
            "description": "Embark on an unforgettable journey into the golden dunes of the Sahara Desert. Experience authentic camel trekking at sunset, sleep under a blanket of stars in a traditional Berber camp, enjoy live music around the campfire, and witness the magical sunrise over the endless dunes. This adventure includes visits to ancient kasbahs and remote desert villages.",
            "price": 280.00,
            "duration": "3 days / 2 nights",
            "location": "Merzouga, Sahara Desert",
            "max_participants": 12,
            "difficulty_level": "Moderate",
            "includes": [
                "Professional desert guide",
                "Camel trekking experience",
                "2 nights luxury desert camping",
                "All meals (6 meals total)",
                "4WD transportation",
                "Traditional Berber music",
                "Sandboarding equipment",
                "Stargazing experience"
            ],
            "images": [
                "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&q=90",
                "https://images.unsplash.com/photo-1682686581551-867e0b208bd1?w=1200&q=90",
                "https://images.unsplash.com/photo-1513415756668-eb4f8b6e7e3a?w=1200&q=90",
                "https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1200&q=90"
            ],
            "pricing_tiers": [
                {"min": 1, "max": 2, "price": 350.00},
                {"min": 3, "max": 5, "price": 280.00},
                {"min": 6, "max": 10, "price": 240.00},
                {"min": 11, "max": 12, "price": 220.00}
            ],
            "tags": ["Camel Ride", "Desert Camp", "Breakfast Included", "Lunch Included", "Dinner Included", "Adventure", "Professional Guide"]
        },
        {
            "title": "Chefchaouen Blue Pearl Experience",
            "description": "Discover the enchanting blue-washed streets of Chefchaouen, Morocco's most photogenic town. Nestled in the Rif Mountains, this magical city offers stunning mountain views, artisan workshops, and a peaceful atmosphere. Explore the medina's blue alleyways, visit local craft shops, enjoy panoramic views from the Spanish Mosque, and savor authentic mountain cuisine.",
            "price": 95.00,
            "duration": "1 day",
            "location": "Chefchaouen",
            "max_participants": 15,
            "difficulty_level": "Easy",
            "includes": [
                "Professional photographer guide",
                "Hotel pickup and drop-off",
                "Traditional lunch",
                "Medina walking tour",
                "Spanish Mosque visit",
                "Artisan workshop visits",
                "Photography tips and spots",
                "Free time for shopping"
            ],
            "images": [
                "https://images.unsplash.com/photo-1570939274717-7eda259b50ed?w=1200&q=90",
                "https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1200&q=90",
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=90",
                "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1200&q=90"
            ],
            "pricing_tiers": [
                {"min": 1, "max": 2, "price": 130.00},
                {"min": 3, "max": 5, "price": 100.00},
                {"min": 6, "max": 10, "price": 80.00},
                {"min": 11, "max": 15, "price": 70.00}
            ],
            "tags": ["Photography Tour", "Cultural Tour", "Lunch Included", "Professional Guide", "Family Friendly", "Private Transport"]
        },
        {
            "title": "Fes Medieval Medina Journey",
            "description": "Step back in time in Fes, Morocco's spiritual and cultural capital. Explore the UNESCO World Heritage medina, the world's largest car-free urban area. Visit the ancient Al-Qarawiyyin University, witness traditional craftsmen at work in the tanneries, discover hidden palaces, and navigate the labyrinthine souks filled with spices, textiles, and treasures.",
            "price": 90.00,
            "duration": "1 day",
            "location": "Fes",
            "max_participants": 18,
            "difficulty_level": "Easy",
            "includes": [
                "Expert historian guide",
                "All entrance fees",
                "Traditional Moroccan lunch",
                "Hotel pickup and drop-off",
                "Tannery visit",
                "Pottery workshop demonstration",
                "Al-Qarawiyyin University visit",
                "Spice market tour"
            ],
            "images": [
                "https://images.unsplash.com/photo-1544967919-6e4b999de2a9?w=1200&q=90",
                "https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1200&q=90",
                "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1200&q=90",
                "https://images.unsplash.com/photo-1591825729269-caeb344f6df2?w=1200&q=90"
            ],
            "pricing_tiers": [
                {"min": 1, "max": 2, "price": 125.00},
                {"min": 3, "max": 5, "price": 95.00},
                {"min": 6, "max": 10, "price": 75.00},
                {"min": 11, "max": 18, "price": 65.00}
            ],
            "tags": ["Cultural Tour", "Professional Guide", "Lunch Included", "Family Friendly", "Private Transport", "Luxury"]
        }
    ]
    
    print("🚀 Creating Professional Tours with V2 Features")
    print("=" * 70)
    
    created_tours = []
    
    for tour_data in tours_data:
        print(f"\n{'='*70}")
        print(f"Creating: {tour_data['title']}")
        print(f"{'='*70}")
        
        # Step 1: Create the tour
        print("\n1️⃣  Creating tour...")
        
        # Extract duration days from duration string (e.g., "3 days / 2 nights" -> 3)
        duration_days = 1
        if "day" in tour_data["duration"].lower():
            import re
            match = re.search(r'(\d+)\s*day', tour_data["duration"], re.IGNORECASE)
            if match:
                duration_days = int(match.group(1))
        
        # Prepare images list
        images_list = []
        for idx, image_url in enumerate(tour_data["images"], 1):
            images_list.append({
                "image_url": image_url,
                "alt_text": f"{tour_data['location']} - View {idx}",
                "display_order": idx,
                "is_main": (idx == 1)  # First image is main
            })
        
        tour_payload = {
            "title": tour_data["title"],
            "description": tour_data["description"],
            "base_price": tour_data["price"],  # Use base_price
            "price": tour_data["price"],  # Legacy field
            "duration_description": tour_data["duration"],  # Use duration_description
            "duration": tour_data["duration"],  # Legacy field
            "duration_days": duration_days,
            "location": tour_data["location"],
            "max_participants": tour_data["max_participants"],
            "min_participants": 1,
            "difficulty_level": tour_data["difficulty_level"],
            "includes": tour_data["includes"],
            "images": images_list  # Include images in tour creation
        }
        
        try:
            response = requests.post(f"{BASE_URL}/tours", json=tour_payload)
            response.raise_for_status()
            tour = response.json()
            tour_id = tour["id"]
            print(f"   ✅ Tour created with {len(images_list)} images! ID: {tour_id}")
        except Exception as e:
            print(f"   ❌ Error creating tour: {e}")
            print(f"   Response: {e.response.text if hasattr(e, 'response') else 'No response'}")
            continue
        
        # Step 2: Add group pricing tiers
        print("\n2️⃣  Adding group pricing tiers...")
        for tier in tour_data["pricing_tiers"]:
            try:
                pricing_payload = {
                    "min_participants": tier["min"],
                    "max_participants": tier["max"],
                    "price_per_person": tier["price"]
                }
                response = requests.post(f"{BASE_URL}/tours/{tour_id}/group-pricing", json=pricing_payload)
                response.raise_for_status()
                print(f"   ✅ {tier['min']}-{tier['max']} people: ${tier['price']}/person")
            except Exception as e:
                print(f"   ⚠️  Error adding pricing tier: {e}")
        
        # Step 3: Add tags
        print("\n3️⃣  Adding tags...")
        try:
            response = requests.get(f"{BASE_URL}/tags")
            response.raise_for_status()
            all_tags = response.json()
            
            for tag in all_tags:
                if tag["name"] in tour_data["tags"]:
                    try:
                        response = requests.post(f"{BASE_URL}/tours/{tour_id}/tags/{tag['id']}")
                        response.raise_for_status()
                        print(f"   ✅ {tag['icon']} {tag['name']}")
                    except Exception as e:
                        print(f"   ⚠️  Error adding tag {tag['name']}: {e}")
        except Exception as e:
            print(f"   ⚠️  Error fetching tags: {e}")
        
        created_tours.append({
            "id": tour_id,
            "title": tour_data["title"],
            "location": tour_data["location"]
        })
        
        time.sleep(0.5)  # Small delay between tours
    
    # Summary
    print(f"\n{'='*70}")
    print("✅ ALL TOURS CREATED SUCCESSFULLY!")
    print(f"{'='*70}\n")
    
    for tour in created_tours:
        print(f"🏜️  {tour['title']}")
        print(f"   📍 {tour['location']}")
        print(f"   🌐 View: http://159.89.1.127:3000/tours/{tour['id']}")
        print(f"   📝 Book: http://159.89.1.127:3000/booking-v2?tour={tour['id']}\n")
    
    print(f"{'='*70}")
    print(f"Total tours created: {len(created_tours)}")
    print(f"{'='*70}\n")

if __name__ == "__main__":
    # Delete existing tours
    delete_all_tours()
    
    # Create new professional tours
    create_all_professional_tours()
    
    print("🎉 Tour setup completed successfully!")


