"""
Script to create a multilingual tour (EN/FR) via API
Simulates what the admin panel would do
"""

import requests
import json

BASE_URL = "http://localhost:8010"

def create_multilingual_tour():
    """Create a tour with both English and French translations"""
    
    tour_data = {
        "price": 2500.00,
        "duration": "5 days / 4 nights",
        "max_participants": 12,
        "difficulty_level": "Moderate",
        "available_dates": ["2025-11-10", "2025-11-25", "2025-12-05", "2025-12-20"],
        "translations": {
            "en": {
                "title": "Imperial Cities Grand Tour",
                "description": """<h2>Discover Morocco's Imperial Cities</h2>
<p>Embark on an unforgettable journey through Morocco's four imperial cities: Rabat, Meknes, Fes, and Marrakech. Each city tells a unique story of Morocco's rich history, from ancient medinas to stunning palaces.</p>

<h3>Highlights:</h3>
<ul>
<li>Explore the Hassan Tower and Royal Palace in Rabat</li>
<li>Visit the ancient Roman ruins of Volubilis</li>
<li>Wander through the medieval medina of Fes</li>
<li>Discover the vibrant souks of Marrakech</li>
<li>Experience traditional Moroccan cuisine</li>
</ul>

<h3>What Makes This Tour Special:</h3>
<p>Our expert guides bring history to life with fascinating stories and insider knowledge. You'll stay in carefully selected riads and hotels that blend comfort with authentic Moroccan charm.</p>

<p><strong>Perfect for:</strong> History enthusiasts, culture lovers, and photographers seeking to capture Morocco's architectural wonders.</p>""",
                "location": "Rabat, Meknes, Fes, Marrakech",
                "includes": "Professional English-speaking guide, 4x4 comfortable transportation, 4 nights accommodation (riads & hotels), All breakfasts and 3 dinners, Entrance fees to monuments, Visit to Volubilis Roman ruins, Traditional Moroccan cooking class, Airport transfers"
            },
            "fr": {
                "title": "Grand Tour des Cités Impériales",
                "description": """<h2>Découvrez les Cités Impériales du Maroc</h2>
<p>Embarquez pour un voyage inoubliable à travers les quatre cités impériales du Maroc : Rabat, Meknès, Fès et Marrakech. Chaque ville raconte une histoire unique de la riche histoire du Maroc, des médinas anciennes aux palais époustouflants.</p>

<h3>Points Forts :</h3>
<ul>
<li>Explorez la Tour Hassan et le Palais Royal à Rabat</li>
<li>Visitez les ruines romaines antiques de Volubilis</li>
<li>Promenez-vous dans la médina médiévale de Fès</li>
<li>Découvrez les souks animés de Marrakech</li>
<li>Découvrez la cuisine traditionnelle marocaine</li>
</ul>

<h3>Ce Qui Rend Cette Visite Spéciale :</h3>
<p>Nos guides experts donnent vie à l'histoire avec des récits fascinants et des connaissances d'initiés. Vous séjournerez dans des riads et hôtels soigneusement sélectionnés qui allient confort et charme marocain authentique.</p>

<p><strong>Parfait pour :</strong> Les passionnés d'histoire, les amateurs de culture et les photographes cherchant à capturer les merveilles architecturales du Maroc.</p>""",
                "location": "Rabat, Meknès, Fès, Marrakech",
                "includes": "Guide professionnel francophone, Transport confortable en 4x4, 4 nuits d'hébergement (riads & hôtels), Tous les petits déjeuners et 3 dîners, Frais d'entrée aux monuments, Visite des ruines romaines de Volubilis, Cours de cuisine marocaine traditionnelle, Transferts aéroport"
            }
        },
        "images": [
            {
                "image_url": "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=800",
                "is_main": True,
                "display_order": 0,
                "alt_text": "Hassan Tower in Rabat"
            },
            {
                "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
                "is_main": False,
                "display_order": 1,
                "alt_text": "Fes Medina"
            },
            {
                "image_url": "https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=800",
                "is_main": False,
                "display_order": 2,
                "alt_text": "Marrakech Souk"
            }
        ]
    }
    
    print("=" * 70)
    print("CREATING MULTILINGUAL TOUR")
    print("=" * 70)
    print("\n📝 Tour Details:")
    print(f"   Price: {tour_data['price']} MAD")
    print(f"   Duration: {tour_data['duration']}")
    print(f"   Max Participants: {tour_data['max_participants']}")
    print(f"   Difficulty: {tour_data['difficulty_level']}")
    print(f"   Available Dates: {len(tour_data['available_dates'])} dates")
    print(f"   Images: {len(tour_data['images'])} images")
    
    print("\n🇬🇧 English Content:")
    print(f"   Title: {tour_data['translations']['en']['title']}")
    print(f"   Location: {tour_data['translations']['en']['location']}")
    print(f"   Description: {len(tour_data['translations']['en']['description'])} characters")
    
    print("\n🇫🇷 French Content:")
    print(f"   Title: {tour_data['translations']['fr']['title']}")
    print(f"   Location: {tour_data['translations']['fr']['location']}")
    print(f"   Description: {len(tour_data['translations']['fr']['description'])} characters")
    
    print("\n🚀 Sending request to API...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/tours/multilingual",
            json=tour_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\n📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            tour = response.json()
            tour_id = tour['id']
            
            print("\n✅ SUCCESS! Tour created successfully!")
            print(f"\n🆔 Tour ID: {tour_id}")
            print(f"📍 Location: {tour['location']}")
            print(f"💰 Price: {tour['price']} MAD")
            
            # Verify by fetching in both languages
            print("\n" + "=" * 70)
            print("VERIFYING TOUR IN BOTH LANGUAGES")
            print("=" * 70)
            
            # Fetch in English
            print("\n🇬🇧 Fetching in English...")
            en_response = requests.get(f"{BASE_URL}/tours/{tour_id}?lang=en")
            if en_response.status_code == 200:
                en_tour = en_response.json()
                print(f"   ✅ Title: {en_tour['title']}")
                print(f"   📍 Location: {en_tour['location']}")
                print(f"   📝 Description: {en_tour['description'][:100]}...")
                print(f"   🖼️  Images: {len(en_tour.get('images', []))} images")
            
            # Fetch in French
            print("\n🇫🇷 Fetching in French...")
            fr_response = requests.get(f"{BASE_URL}/tours/{tour_id}?lang=fr")
            if fr_response.status_code == 200:
                fr_tour = fr_response.json()
                print(f"   ✅ Title: {fr_tour['title']}")
                print(f"   📍 Location: {fr_tour['location']}")
                print(f"   📝 Description: {fr_tour['description'][:100]}...")
                print(f"   🖼️  Images: {len(fr_tour.get('images', []))} images")
            
            # Check database
            print("\n" + "=" * 70)
            print("DATABASE VERIFICATION")
            print("=" * 70)
            print("\n💾 Checking database for translations...")
            print(f"\nRun this command to verify:")
            print(f"docker-compose exec -T tours-db psql -U tours_user -d tours_db -c \"SELECT language, title, location FROM tour_translations WHERE tour_id='{tour_id}';\"")
            
            print("\n" + "=" * 70)
            print("✅ MULTILINGUAL TOUR CREATION COMPLETE!")
            print("=" * 70)
            print(f"\n🌐 View in browser:")
            print(f"   English: http://localhost:3000/tours/{tour_id}")
            print(f"   French:  http://localhost:3000/tours/{tour_id} (switch language)")
            
            return tour_id
            
        else:
            print(f"\n❌ ERROR: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Could not connect to tours service")
        print("Make sure the service is running: docker-compose up tours-service")
        return None
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        return None

def list_all_tours():
    """List all tours to see the new one"""
    print("\n" + "=" * 70)
    print("ALL TOURS IN DATABASE")
    print("=" * 70)
    
    # English
    print("\n🇬🇧 Tours in English:")
    en_response = requests.get(f"{BASE_URL}/tours?lang=en")
    if en_response.status_code == 200:
        tours = en_response.json()
        print(f"   Total: {len(tours)} tours")
        for i, tour in enumerate(tours[-5:], 1):  # Show last 5
            print(f"   {i}. {tour['title']} - {tour['location']}")
    
    # French
    print("\n🇫🇷 Tours in French:")
    fr_response = requests.get(f"{BASE_URL}/tours?lang=fr")
    if fr_response.status_code == 200:
        tours = fr_response.json()
        print(f"   Total: {len(tours)} tours")
        for i, tour in enumerate(tours[-5:], 1):  # Show last 5
            print(f"   {i}. {tour['title']} - {tour['location']}")

if __name__ == "__main__":
    print("\n🌍 MULTILINGUAL TOUR CREATION SCRIPT")
    print("This simulates what an admin would do through the admin panel\n")
    
    # Create the tour
    tour_id = create_multilingual_tour()
    
    if tour_id:
        # List all tours
        list_all_tours()
        
        print("\n" + "=" * 70)
        print("🎉 SUCCESS! Your multilingual tour is live!")
        print("=" * 70)
        print("\n📋 Next Steps:")
        print("   1. Visit http://localhost:3000 to see the tour")
        print("   2. Switch language using the navbar toggle")
        print("   3. Verify content changes between EN/FR")
        print("   4. Check the admin panel to manage the tour")
        print("\n")
