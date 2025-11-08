#!/usr/bin/env python3
"""Clean all tours from database"""

import requests

BASE_URL = "http://localhost:3000/api/tours"

print("\n🗑️  Deleting ALL tours...")
response = requests.get(f"{BASE_URL}/tours")

if response.status_code == 200:
    tours = response.json()
    print(f"Found {len(tours)} tours to delete\n")
    
    success = 0
    failed = 0
    
    for tour in tours:
        try:
            delete_response = requests.delete(f"{BASE_URL}/tours/{tour['id']}")
            if delete_response.status_code in [200, 204]:
                print(f"✅ Deleted: {tour['title']}")
                success += 1
            else:
                print(f"❌ Failed ({delete_response.status_code}): {tour['title']}")
                failed += 1
        except Exception as e:
            print(f"❌ Error deleting {tour['title']}: {e}")
            failed += 1
    
    print(f"\n📊 Summary:")
    print(f"   ✅ Successfully deleted: {success}")
    print(f"   ❌ Failed: {failed}")
else:
    print(f"❌ Failed to fetch tours: {response.status_code}")
