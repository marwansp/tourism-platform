#!/usr/bin/env python3
"""
Setup Demo Tours Script
- Deletes all existing tours
- Creates 3 demo tours with different language support:
  1. Full multilingual (EN, FR, ES, DE)
  2. Partial multilingual (EN, FR, ES)
  3. Single language (EN only)
- Assigns "What's Included" and "What's NOT Included" tags
"""

import requests
import json

BASE_URL = "http://localhost:3000/api/tours"

def delete_all_tours():
    """Delete all existing tours"""
    print("\n🗑️  Deleting all existing tours...")
    response = requests.get(f"{BASE_URL}/tours")
    if response.status_code == 200:
        tours = response.json()
        for tour in tours:
            delete_response = requests.delete(f"{BASE_URL}/tours/{tour['id']}")
            if delete_response.status_code == 200:
                print(f"   ✅ Deleted: {tour['title']}")
            else:
                print(f"   ❌ Failed to delete: {tour['title']}")
        print(f"   Total deleted: {len(tours)} tours")
    else:
        print("   ❌ Failed to fetch tours")

def get_or_create_tags():
    """Get existing tags or create them if they don't exist"""
    print("\n🏷️  Setting up tags...")
    
    # Get all existing tags
    response = requests.get(f"{BASE_URL}/tags")
    existing_tags = response.json() if response.status_code == 200 else []
    
    # Define required tags
    required_tags = {
        'included': [
            {"name": "Meals", "icon": "🍽️", "category": "included"},
            {"name": "Transport", "icon": "🚗", "category": "included"},
            {"name": "Guide", "icon": "👨‍🏫", "category": "included"},
            {"name": "Accommodation", "icon": "🏨", "category": "included"},
            {"name": "Entrance Fees", "icon": "🎫", "category": "included"},
        ],
        'not_included': [
            {"name": "Flights", "icon": "✈️", "category": "not_included"},
            {"name": "Travel Insurance", "icon": "🛡️", "category": "not_included"},
            {"name": "Personal Expenses", "icon": "💰", "category": "not_included"},
            {"name": "Tips", "icon": "💵", "category": "not_included"},
        ]
    }
    
    tags = {'included': [], 'not_included': []}
    
    # Check and create tags
    for category, tag_list in required_tags.items():
        for tag_data in tag_list:
            # Check if tag exists
            existing = next((t for t in existing_tags if t['name'] == tag_data['name']), None)
            if existing:
                tags[category].append(existing)
                print(f"   ✅ Found existing: {tag_data['icon']} {tag_data['name']}")
            else:
                # Create new tag
                response = requests.post(f"{BASE_URL}/tags", json=tag_data)
                if response.status_code == 200:
                    new_tag = response.json()
                    tags[category].append(new_tag)
                    print(f"   ✅ Created: {tag_data['icon']} {tag_data['name']}")
                else:
                    print(f"   ❌ Failed to create: {tag_data['name']}")
    
    return tags

def create_tour_1_full_multilingual(tags):
    """Create Tour 1: Full multilingual support (EN, FR, ES, DE)"""
    print("\n🌍 Creating Tour 1: Sahara Desert Adventure (4 languages)")
    
    tour_data = {
        "price": 450.00,
        "duration": "3 days / 2 nights",
        "max_participants": 12,
        "difficulty_level": "Moderate",
        "translations": [
            {
                "language_code": "en",
                "title": "Sahara Desert Adventure",
                "description": "Experience the magic of the Sahara Desert with camel trekking, overnight camping under the stars, and traditional Berber hospitality. This 3-day journey takes you through stunning dunes and ancient kasbahs.",
                "location": "Merzouga, Morocco",
                "itinerary": "Day 1: Departure from Marrakech, Atlas Mountains crossing, Ait Ben Haddou visit\nDay 2: Todra Gorges, camel trek into desert, overnight in Berber camp\nDay 3: Sunrise in dunes, return journey via Draa Valley"
            },
            {
                "language_code": "fr",
                "title": "Aventure dans le Désert du Sahara",
                "description": "Découvrez la magie du désert du Sahara avec une randonnée à dos de chameau, un camping nocturne sous les étoiles et l'hospitalité berbère traditionnelle. Ce voyage de 3 jours vous emmène à travers des dunes magnifiques et d'anciennes kasbahs.",
                "location": "Merzouga, Maroc",
                "itinerary": "Jour 1: Départ de Marrakech, traversée de l'Atlas, visite d'Ait Ben Haddou\nJour 2: Gorges du Todra, trek à dos de chameau, nuit au camp berbère\nJour 3: Lever du soleil dans les dunes, retour par la vallée du Draa"
            },
            {
                "language_code": "es",
                "title": "Aventura en el Desierto del Sahara",
                "description": "Experimenta la magia del desierto del Sahara con paseos en camello, acampada nocturna bajo las estrellas y la hospitalidad bereber tradicional. Este viaje de 3 días te lleva a través de impresionantes dunas y antiguas kasbahs.",
                "location": "Merzouga, Marruecos",
                "itinerary": "Día 1: Salida desde Marrakech, cruce del Atlas, visita a Ait Ben Haddou\nDía 2: Gargantas del Todra, paseo en camello al desierto, noche en campamento bereber\nDía 3: Amanecer en las dunas, regreso por el Valle del Draa"
            },
            {
                "language_code": "de",
                "title": "Sahara-Wüsten-Abenteuer",
                "description": "Erleben Sie die Magie der Sahara-Wüste mit Kamelreiten, Übernachtung unter den Sternen und traditioneller Berber-Gastfreundschaft. Diese 3-tägige Reise führt Sie durch atemberaubende Dünen und alte Kasbahs.",
                "location": "Merzouga, Marokko",
                "itinerary": "Tag 1: Abfahrt von Marrakesch, Atlas-Überquerung, Besuch von Ait Ben Haddou\nTag 2: Todra-Schluchten, Kamelritt in die Wüste, Übernachtung im Berber-Camp\nTag 3: Sonnenaufgang in den Dünen, Rückfahrt durch das Draa-Tal"
            }
        ],
        "images": [{
            "image_url": "https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=800",
            "is_main": True,
            "display_order": 0,
            "alt_text": "Sahara Desert dunes at sunset"
        }]
    }
    
    response = requests.post(f"{BASE_URL}/tours/v2", json=tour_data)
    if response.status_code == 200:
        tour = response.json()
        print(f"   ✅ Created tour: {tour['id']}")
        
        # Add tags
        print("   🏷️  Adding tags...")
        # What's Included
        for tag in tags['included'][:4]:  # Meals, Transport, Guide, Accommodation
            requests.post(f"{BASE_URL}/tours/{tour['id']}/tags", json={"tag_id": tag['id']})
            print(f"      ✅ {tag['icon']} {tag['name']}")
        
        # What's NOT Included
        for tag in tags['not_included'][:2]:  # Flights, Insurance
            requests.post(f"{BASE_URL}/tours/{tour['id']}/tags", json={"tag_id": tag['id']})
            print(f"      ❌ {tag['icon']} {tag['name']}")
        
        return tour
    else:
        print(f"   ❌ Failed: {response.text}")
        return None

def create_tour_2_partial_multilingual(tags):
    """Create Tour 2: Partial multilingual support (EN, FR, ES)"""
    print("\n🌍 Creating Tour 2: Atlas Mountains Trek (3 languages)")
    
    tour_data = {
        "price": 280.00,
        "duration": "2 days / 1 night",
        "max_participants": 8,
        "difficulty_level": "Challenging",
        "translations": [
            {
                "language_code": "en",
                "title": "Atlas Mountains Trek",
                "description": "Challenge yourself with a trek through the stunning Atlas Mountains. Visit traditional Berber villages, enjoy panoramic views, and experience authentic mountain life.",
                "location": "Imlil, High Atlas",
                "itinerary": "Day 1: Departure from Marrakech, trek to Berber village, lunch with local family, continue to mountain refuge\nDay 2: Summit attempt (weather permitting), descent and return to Marrakech"
            },
            {
                "language_code": "fr",
                "title": "Trek dans les Montagnes de l'Atlas",
                "description": "Défiez-vous avec une randonnée à travers les magnifiques montagnes de l'Atlas. Visitez des villages berbères traditionnels, profitez de vues panoramiques et découvrez la vie authentique en montagne.",
                "location": "Imlil, Haut Atlas",
                "itinerary": "Jour 1: Départ de Marrakech, trek vers village berbère, déjeuner en famille locale, continuation vers refuge de montagne\nJour 2: Tentative de sommet (selon météo), descente et retour à Marrakech"
            },
            {
                "language_code": "es",
                "title": "Trekking en las Montañas del Atlas",
                "description": "Desafíate con una caminata por las impresionantes montañas del Atlas. Visita pueblos bereberes tradicionales, disfruta de vistas panorámicas y experimenta la auténtica vida de montaña.",
                "location": "Imlil, Alto Atlas",
                "itinerary": "Día 1: Salida desde Marrakech, caminata a pueblo bereber, almuerzo con familia local, continuación al refugio de montaña\nDía 2: Intento de cumbre (según clima), descenso y regreso a Marrakech"
            }
        ],
        "images": [{
            "image_url": "https://images.unsplash.com/photo-1591825729269-caeb344f6df2?w=800",
            "is_main": True,
            "display_order": 0,
            "alt_text": "Atlas Mountains landscape"
        }]
    }
    
    response = requests.post(f"{BASE_URL}/tours/v2", json=tour_data)
    if response.status_code == 200:
        tour = response.json()
        print(f"   ✅ Created tour: {tour['id']}")
        
        # Add tags
        print("   🏷️  Adding tags...")
        # What's Included
        for tag in [tags['included'][0], tags['included'][1], tags['included'][2]]:  # Meals, Transport, Guide
            requests.post(f"{BASE_URL}/tours/{tour['id']}/tags", json={"tag_id": tag['id']})
            print(f"      ✅ {tag['icon']} {tag['name']}")
        
        # What's NOT Included
        for tag in tags['not_included']:  # All not included
            requests.post(f"{BASE_URL}/tours/{tour['id']}/tags", json={"tag_id": tag['id']})
            print(f"      ❌ {tag['icon']} {tag['name']}")
        
        return tour
    else:
        print(f"   ❌ Failed: {response.text}")
        return None

def create_tour_3_single_language(tags):
    """Create Tour 3: Single language support (EN only)"""
    print("\n🌍 Creating Tour 3: Marrakech City Tour (1 language)")
    
    tour_data = {
        "price": 85.00,
        "duration": "1 day",
        "max_participants": 15,
        "difficulty_level": "Easy",
        "translations": [
            {
                "language_code": "en",
                "title": "Marrakech City Discovery",
                "description": "Explore the vibrant city of Marrakech in one day. Visit the famous Jemaa el-Fnaa square, explore the colorful souks, discover the beautiful Bahia Palace, and enjoy traditional Moroccan mint tea.",
                "location": "Marrakech, Morocco",
                "itinerary": "Morning: Koutoubia Mosque, Bahia Palace, Saadian Tombs\nAfternoon: Souks exploration, traditional lunch, Majorelle Garden\nEvening: Jemaa el-Fnaa square, sunset from rooftop café"
            }
        ],
        "images": [{
            "image_url": "https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=800",
            "is_main": True,
            "display_order": 0,
            "alt_text": "Marrakech Jemaa el-Fnaa square"
        }]
    }
    
    response = requests.post(f"{BASE_URL}/tours/v2", json=tour_data)
    if response.status_code == 200:
        tour = response.json()
        print(f"   ✅ Created tour: {tour['id']}")
        
        # Add tags
        print("   🏷️  Adding tags...")
        # What's Included
        for tag in [tags['included'][0], tags['included'][1], tags['included'][2], tags['included'][4]]:  # Meals, Transport, Guide, Entrance Fees
            requests.post(f"{BASE_URL}/tours/{tour['id']}/tags", json={"tag_id": tag['id']})
            print(f"      ✅ {tag['icon']} {tag['name']}")
        
        # What's NOT Included
        for tag in [tags['not_included'][1], tags['not_included'][2], tags['not_included'][3]]:  # Insurance, Personal Expenses, Tips
            requests.post(f"{BASE_URL}/tours/{tour['id']}/tags", json={"tag_id": tag['id']})
            print(f"      ❌ {tag['icon']} {tag['name']}")
        
        return tour
    else:
        print(f"   ❌ Failed: {response.text}")
        return None

def main():
    print("=" * 70)
    print("🚀 DEMO TOURS SETUP")
    print("=" * 70)
    
    # Step 1: Delete all existing tours
    delete_all_tours()
    
    # Step 2: Setup tags
    tags = get_or_create_tags()
    
    # Step 3: Create demo tours
    tour1 = create_tour_1_full_multilingual(tags)
    tour2 = create_tour_2_partial_multilingual(tags)
    tour3 = create_tour_3_single_language(tags)
    
    # Summary
    print("\n" + "=" * 70)
    print("✅ DEMO TOURS SETUP COMPLETE!")
    print("=" * 70)
    print("\n📊 Summary:")
    print(f"   Tour 1: {'✅ Created' if tour1 else '❌ Failed'} - Sahara Desert (EN, FR, ES, DE)")
    print(f"   Tour 2: {'✅ Created' if tour2 else '❌ Failed'} - Atlas Mountains (EN, FR, ES)")
    print(f"   Tour 3: {'✅ Created' if tour3 else '❌ Failed'} - Marrakech City (EN only)")
    print("\n🌐 Language Coverage:")
    print("   • English (EN): 3 tours")
    print("   • French (FR): 2 tours")
    print("   • Spanish (ES): 2 tours")
    print("   • German (DE): 1 tour")
    print("\n🏷️  Tag Usage:")
    print("   • What's Included: Meals, Transport, Guide, Accommodation, Entrance Fees")
    print("   • What's NOT Included: Flights, Insurance, Personal Expenses, Tips")
    print("\n🎉 You can now test the multilingual system with these demo tours!")
    print("=" * 70)

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
