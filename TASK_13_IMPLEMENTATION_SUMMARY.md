# Task 13 Implementation Summary: Dynamic Language Support for Tour Creation/Update

## Overview
Successfully implemented dynamic multi-language support for tour creation and update operations. Tours can now be created and updated with translations in any active language configured in the system.

## Changes Made

### 1. Updated CRUD Functions (`tours-service/crud.py`)

#### `create_tour()` Function
- **Added Parameter**: `translations: Optional[List[dict]]` - accepts array of translation dictionaries
- **Translation Structure**: Each translation contains:
  - `language_code`: ISO 639-1 code (e.g., 'en', 'fr', 'es')
  - `title`: Translated tour title
  - `description`: Translated tour description
  - `location`: Translated location (optional)
  - `itinerary`: Translated itinerary/includes (optional)
- **Validation**: Validates each `language_code` exists in the `languages` table
- **Error Handling**: Raises `ValueError` if language code doesn't exist
- **Backward Compatibility**: Works without translations parameter for legacy support

#### `update_tour()` Function
- **Added Parameter**: `translations: Optional[List[dict]]` - accepts array of translation dictionaries
- **Smart Update Logic**:
  - Compares existing translations with new translations
  - **Deletes** translations that are no longer in the new list
  - **Updates** existing translations with new data
  - **Inserts** new translations for languages not previously translated
- **Validation**: Validates each `language_code` exists in the `languages` table
- **Error Handling**: Raises `ValueError` if language code doesn't exist

#### `get_tour_with_dynamic_language()` Function (Fixed)
- **Fixed Bug**: Now correctly returns `current_language` as the actual language used (not requested)
- When fallback occurs, `current_language` reflects the default language (e.g., 'en')
- `is_fallback` flag correctly indicates when fallback was used

### 2. New Schemas (`tours-service/schemas.py`)

#### `TourTranslationInput`
```python
class TourTranslationInput(BaseModel):
    language_code: str  # 2-letter ISO code
    title: str
    description: str
    location: Optional[str]
    itinerary: Optional[str]
```

#### `TourCreateDynamic`
```python
class TourCreateDynamic(BaseModel):
    # Non-translatable fields
    price: Decimal
    duration: str
    max_participants: int
    difficulty_level: str
    includes: Optional[List[str]]
    available_dates: Optional[List[str]]
    
    # Translations array
    translations: List[TourTranslationInput]
    
    # Images
    images: Optional[List[TourImageCreate]]
```

#### `TourUpdateDynamic`
```python
class TourUpdateDynamic(BaseModel):
    # All fields optional for partial updates
    price: Optional[Decimal]
    duration: Optional[str]
    max_participants: Optional[int]
    difficulty_level: Optional[str]
    includes: Optional[List[str]]
    available_dates: Optional[List[str]]
    translations: Optional[List[TourTranslationInput]]
    images: Optional[List[TourImageCreate]]
```

### 3. New API Endpoints (`tours-service/main.py`)

#### `POST /tours/v2`
- **Purpose**: Create tour with dynamic language support
- **Request Body**: `TourCreateDynamic`
- **Response**: `TourResponse` with first translation language
- **Validation**: 
  - Validates all language codes exist
  - Returns 400 if invalid language code
  - Returns 500 on database errors

#### `PUT /tours/v2/{tour_id}`
- **Purpose**: Update tour with dynamic language support
- **Request Body**: `TourUpdateDynamic`
- **Response**: `TourResponse` with updated data
- **Features**:
  - Partial updates supported
  - Can add new language translations
  - Can remove language translations (by omitting them)
  - Can update existing translations
- **Validation**:
  - Validates all language codes exist
  - Returns 404 if tour not found
  - Returns 400 if invalid language code

### 4. Updated Legacy Endpoints
- `POST /tours` - Added `ValueError` exception handling
- `PUT /tours/{tour_id}` - Added `ValueError` exception handling
- Both endpoints remain backward compatible

## Key Features

### 1. Language Validation
- All language codes are validated against the `languages` table
- Prevents creating translations for non-existent languages
- Clear error messages when validation fails

### 2. Smart Translation Management
- **Create**: Inserts all provided translations
- **Update**: 
  - Adds new translations
  - Updates existing translations
  - Removes translations not in the update list
- **Delete**: Cascade deletes when tour is deleted

### 3. Fallback Handling
- When requesting a tour in a language without translation:
  - Returns content in default language (English)
  - Sets `is_fallback: true`
  - Sets `current_language` to actual language used (e.g., 'en')
  - Includes `available_languages` array

### 4. Backward Compatibility
- Legacy endpoints (`POST /tours`, `PUT /tours/{tour_id}`) still work
- Old `create_tour_with_translations` endpoint still functional
- Can create tours without translations

## Testing

### Unit Tests Created
File: `test_crud_dynamic_languages.py`

**Test Coverage**:
1. ✓ Create tour with multiple translations (en, fr, es)
2. ✓ Retrieve tour in different languages
3. ✓ Verify fallback to default language (de → en)
4. ✓ Get available languages for a tour
5. ✓ Update tour - remove translation (Spanish)
6. ✓ Update tour - add translation (German)
7. ✓ Validation - reject invalid language code

**All tests passing**: 100% success rate

### Integration Test Created
File: `test_dynamic_tour_creation.py`
- Tests API endpoints (requires service running)
- Covers full request/response cycle

## Database Schema

### TourTranslation Table
```sql
CREATE TABLE tour_translations (
    id UUID PRIMARY KEY,
    tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
    language_code VARCHAR(2) REFERENCES languages(code) ON DELETE RESTRICT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(100) NOT NULL,
    includes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tour_id, language_code)
);
```

## Example Usage

### Create Tour with Multiple Languages
```python
POST /tours/v2
{
    "price": 250.00,
    "duration": "3 days / 2 nights",
    "max_participants": 15,
    "difficulty_level": "Moderate",
    "translations": [
        {
            "language_code": "en",
            "title": "Sahara Desert Adventure",
            "description": "Experience the magic...",
            "location": "Merzouga, Morocco",
            "itinerary": "Day 1: Arrival..."
        },
        {
            "language_code": "fr",
            "title": "Aventure dans le Désert",
            "description": "Découvrez la magie...",
            "location": "Merzouga, Maroc",
            "itinerary": "Jour 1: Arrivée..."
        }
    ]
}
```

### Update Tour - Add Spanish Translation
```python
PUT /tours/v2/{tour_id}
{
    "translations": [
        {
            "language_code": "en",
            "title": "Updated English Title",
            "description": "Updated description...",
            "location": "Merzouga, Morocco"
        },
        {
            "language_code": "fr",
            "title": "Titre français mis à jour",
            "description": "Description mise à jour...",
            "location": "Merzouga, Maroc"
        },
        {
            "language_code": "es",
            "title": "Título en español",
            "description": "Descripción en español...",
            "location": "Merzouga, Marruecos"
        }
    ]
}
```

### Update Tour - Remove French Translation
```python
PUT /tours/v2/{tour_id}
{
    "translations": [
        {
            "language_code": "en",
            "title": "English Title",
            "description": "English description...",
            "location": "Merzouga, Morocco"
        }
        // French translation omitted - will be deleted
    ]
}
```

## Requirements Satisfied

✓ **Requirement 6.5**: Tour APIs validate language_code exists in languages table
✓ **Requirement 3.3**: Tour translations stored with corresponding language code
✓ **Requirement 3.4**: Administrator can remove language translations

## Next Steps

The following tasks can now proceed:
- **Task 14**: Create languages API service (frontend)
- **Task 15**: Update tours API service for dynamic languages (frontend)
- **Task 21-23**: Update TourForm with dynamic language selection (frontend)

## Notes

- The `itinerary` field in the translation input maps to the `includes` field in the database
- Location is optional in translations; if not provided, uses the tour's base location
- All translations are stored in the `tour_translations` table with foreign key to `languages.code`
- Deleting a language with existing translations is prevented by the system (handled in Task 9)
