"""
Fix flag emojis for languages in the database
"""
import requests

BASE_URL = "http://localhost:8010"

def fix_flag_emojis():
    """Update flag emojis for English and French"""
    
    # Get all languages
    response = requests.get(f"{BASE_URL}/languages")
    if response.status_code != 200:
        print(f"Failed to fetch languages: {response.status_code}")
        return
    
    languages = response.json()
    
    # Find English and French languages
    for lang in languages:
        if lang['code'] == 'en':
            print(f"Updating English flag emoji...")
            print(f"Current: '{lang['flag_emoji']}'")
            update_data = {
                "flag_emoji": "🇺🇸"
            }
            response = requests.put(f"{BASE_URL}/languages/{lang['id']}", json=update_data)
            if response.status_code == 200:
                print(f"✓ English flag updated to 🇺🇸")
            else:
                print(f"✗ Failed to update English: {response.status_code} - {response.text}")
        
        elif lang['code'] == 'fr':
            print(f"\nUpdating French flag emoji...")
            print(f"Current: '{lang['flag_emoji']}'")
            update_data = {
                "flag_emoji": "🇫🇷"
            }
            response = requests.put(f"{BASE_URL}/languages/{lang['id']}", json=update_data)
            if response.status_code == 200:
                print(f"✓ French flag updated to 🇫🇷")
            else:
                print(f"✗ Failed to update French: {response.status_code} - {response.text}")
    
    # Verify the updates
    print("\n" + "="*50)
    print("Verifying updates...")
    print("="*50)
    response = requests.get(f"{BASE_URL}/languages")
    if response.status_code == 200:
        languages = response.json()
        for lang in languages:
            print(f"{lang['flag_emoji']} {lang['name']} ({lang['code'].upper()})")

if __name__ == "__main__":
    fix_flag_emojis()
