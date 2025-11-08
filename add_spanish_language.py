"""
Quick script to add Spanish language to the system
"""
import requests
import json

BASE_URL = "http://localhost:8010"

def add_spanish_language():
    """Add Spanish language to the system"""
    language_data = {
        "code": "es",
        "name": "Spanish",
        "native_name": "Español",
        "flag_emoji": "🇪🇸",
        "is_active": True
    }
    
    try:
        response = requests.post(f"{BASE_URL}/languages", json=language_data)
        
        if response.status_code == 200:
            print("✓ Spanish language added successfully!")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"✗ Failed to add Spanish language")
            print(f"  Status Code: {response.status_code}")
            print(f"  Error: {response.text}")
            
    except Exception as e:
        print(f"✗ Exception occurred: {str(e)}")

if __name__ == "__main__":
    add_spanish_language()
