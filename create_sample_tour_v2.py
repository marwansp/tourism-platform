"""
Create a sample tour with v2 features (group pricing and tags)
"""
import requests
import json

TOURS_URL = "http://localhost:8010"

def create_tour_with_v2_features():
    print("=" * 60)
    print("  Creating Sample Tour with v2 Features")
    print("=" * 60)
    
    # Step 1: Create the tour
    print("\n1. Creating tour...")
    tour_data = {
        "title": "3-Day Sahara Desert Adventure",
        "description": """Experience the magic of Morocco's Sahara Desert on this unforgettable 3-day journey. 

Day 1: Depart from Marrakech, cross the High Atlas Mountains, visit Ait Benhaddou (UNESCO World Heritage site), and arrive in Dades Valley.

Day 2: Explore Todra Gorge, visit a Berber village, and reach Merzouga. Enjoy a camel trek into the desert and spend the night in a traditional Berber camp under the stars.

Day 3: Watch the sunrise over the dunes, return by camel, and journey back to Marrakech with stops at scenic viewpoints.

This tour includes comfortable accommodations, traditional meals, and experienced local guides who will share the rich culture and history of the region.""",
        "price": 1500,
        "duration": "3 days / 2 nights",
        "location": "Sahara Desert, Morocco",
        "max_participants": 12,
        "difficulty_level": "Moderate",
        "includes": [
            "Professional English-speaking guide",
            "Comfortable 4x4 transportation",
            "2 nights accommodation (hotel + desert camp)",
            "All meals (breakfast, lunch, dinner)",
            "Camel trekking experience",
            "Sandboarding in the dunes",
            "Visit to Ait Benhaddou",
            "Visit to Todra Gorge"
        ],
        "available_dates": [
            "2025-06-01",
            "2025-06-15",
            "2025-07-01",
            "2025-07-15",
            "2025-08-01",
            "2025-08-15"
        ],
        "images": [
            {
                "image_url": "https://images.unsplash.com/photo-1509003878541-a2f6e6e2b1f6?w=800&h=600&fit=crop",
                "is_main": True,
                "display_order": 0,
                "alt_text": "Sahara Desert sand dunes at sunset"
            },
            {
                "image_url": "https://images.unsplash.com/photo-1558862107-d49ef2a04d72?w=800&h=600&fit=crop",
                "is_main": False,
                "display_order": 1,
                "alt_text": "Camel caravan in the desert"
            },
            {
                "image_url": "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=600&fit=crop",
                "is_main": False,
                "display_order": 2,
                "alt_text": "Traditional Berber camp under stars"
            }
        ]
    }
    
    response = requests.post(f"{TOURS_URL}/tours", json=tour_data)
    if response.status_code != 200:
        print(f"❌ Failed to create tour: {response.text}")
        return None
    
    tour = response.json()
    tour_id = tour['id']
    print(f"✅ Tour created: {tour['title']}")
    print(f"   ID: {tour_id}")
    
    # Step 2: Add group pricing tiers
    print("\n2. Adding group pricing tiers...")
    pricing_tiers = [
        {"min_participants": 1, "max_participants": 2, "price_per_person": 1500},
        {"min_participants": 3, "max_participants": 5, "price_per_person": 1200},
        {"min_participants": 6, "max_participants": 8, "price_per_person": 1000},
        {"min_participants": 9, "max_participants": 12, "price_per_person": 850}
    ]
    
    for tier in pricing_tiers:
        response = requests.post(
            f"{TOURS_URL}/tours/{tour_id}/group-pricing",
            json=tier
        )
        if response.status_code == 200:
            print(f"   ✅ {tier['min_participants']}-{tier['max_participants']} people: {tier['price_per_person']} MAD/person")
        else:
            print(f"   ❌ Failed to add pricing tier: {response.text}")
    
    # Step 3: Get available tags
    print("\n3. Getting available tags...")
    response = requests.get(f"{TOURS_URL}/tags")
    if response.status_code != 200:
        print(f"❌ Failed to get tags: {response.text}")
        return tour_id
    
    tags = response.json()
    print(f"   ✅ Found {len(tags)} tags")
    
    # Step 4: Add relevant tags to the tour
    print("\n4. Adding tags to tour...")
    relevant_tag_names = [
        "Free Wi-Fi",
        "Breakfast Included",
        "Private Transport",
        "Accommodation Included",
        "Lunch Included",
        "Dinner Included",
        "English Speaking Guide",
        "Desert Experience",
        "Cultural Experience",
        "Small Group (Max 8)"
    ]
    
    for tag in tags:
        if tag['name'] in relevant_tag_names:
            response = requests.post(
                f"{TOURS_URL}/tours/{tour_id}/tags",
                json={"tag_id": tag['id']}
            )
            if response.status_code == 200:
                print(f"   ✅ Added tag: {tag['name']}")
            else:
                print(f"   ❌ Failed to add tag {tag['name']}: {response.text}")
    
    # Step 5: Display summary
    print("\n" + "=" * 60)
    print("  ✅ Tour Created Successfully!")
    print("=" * 60)
    print(f"\nTour ID: {tour_id}")
    print(f"Title: {tour['title']}")
    print(f"Base Price: {tour['price']} MAD")
    print(f"\nGroup Pricing:")
    for tier in pricing_tiers:
        savings = tour['price'] - tier['price_per_person']
        print(f"  • {tier['min_participants']}-{tier['max_participants']} people: {tier['price_per_person']} MAD/person (Save {savings} MAD!)")
    
    print(f"\nTags Added: {len([t for t in tags if t['name'] in relevant_tag_names])}")
    
    print(f"\n🌐 View on Frontend:")
    print(f"   http://localhost/tours/{tour_id}")
    
    print(f"\n📊 Test Price Calculation:")
    print(f"   curl http://localhost:8010/tours/{tour_id}/calculate-price?participants=4")
    
    return tour_id

if __name__ == "__main__":
    try:
        tour_id = create_tour_with_v2_features()
        if tour_id:
            print("\n🎉 Success! Your tour is ready to view on the frontend!")
    except requests.exceptions.ConnectionError:
        print("\n❌ Connection Error: Make sure Docker services are running")
        print("   Run: docker-compose up -d")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
