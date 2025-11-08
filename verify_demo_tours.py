#!/usr/bin/env python3
"""Verify demo tours setup"""

import requests

BASE_URL = "http://localhost:3000/api/tours"

# Get all tours
response = requests.get(f"{BASE_URL}/tours")
tours = response.json()

print("\n" + "=" * 70)
print("📋 DEMO TOURS VERIFICATION")
print("=" * 70)
print(f"\n✅ Total tours: {len(tours)}\n")

for i, tour in enumerate(tours, 1):
    print(f"{i}. {tour['title']}")
    print(f"   💰 Price: €{tour['price']}")
    print(f"   ⏱️  Duration: {tour['duration']}")
    print(f"   🌐 Languages: {', '.join(tour.get('available_languages', ['en']))}")
    print(f"   📍 Location: {tour['location']}")
    
    # Get tour tags
    try:
        tags_response = requests.get(f"{BASE_URL}/tours/{tour['id']}/tags")
        if tags_response.status_code == 200:
            tour_tags = tags_response.json()
            included = [t['tag']['name'] for t in tour_tags if t['tag']['category'] == 'included']
            not_included = [t['tag']['name'] for t in tour_tags if t['tag']['category'] == 'not_included']
            
            if included:
                print(f"   ✅ Included: {', '.join(included)}")
            if not_included:
                print(f"   ❌ NOT Included: {', '.join(not_included)}")
    except:
        pass
    
    print()

print("=" * 70)
