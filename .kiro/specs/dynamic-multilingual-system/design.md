# Dynamic Multi-Language System - Design Document

## Overview

This design document outlines the technical architecture for transforming the tourism platform from a hardcoded 2-language system to a fully dynamic multi-language system. The solution enables administrators to add unlimited languages while maintaining backward compatibility with existing English and French content.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Navbar (Dynamic Language Switcher)                         │
│  Admin Panel (Language Management UI)                       │
│  Tour Forms (Dynamic Translation Tabs)                      │
│  Tour Display Pages (Multi-language Content)                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                         API Layer                            │
├─────────────────────────────────────────────────────────────┤
│  GET    /api/languages                                       │
│  POST   /api/languages                                       │
│  PUT    /api/languages/:id                                   │
│  DELETE /api/languages/:id                                   │
│  GET    /api/tours?lang=XX                                   │
│  GET    /api/tours/:id/available-languages                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                          │
├─────────────────────────────────────────────────────────────┤
│  languages (NEW)                                             │
│  tour_translations (MODIFIED)                                │
│  tours (UNCHANGED)                                           │
└─────────────────────────────────────────────────────────────┘
```

## Data Models

### Language Model (NEW)

```python
class Language(Base):
    __tablename__ = "languages"
    
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    code = Column(String(2), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)  # English name: "Spanish"
    native_name = Column(String(100), nullable=False)  # Native: "Español"
    flag_emoji = Column(String(10), nullable=False)  # "🇪🇸"
    is_active = Column(Boolean, default=True, nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    translations = relationship("TourTranslation", back_populates="language")
```

**Indexes:**
- `code` (unique index for fast lookups)
- `is_active` (for filtering active languages)

**Constraints:**
- Only one language can have `is_default=True`
- `code` must be exactly 2 characters (ISO 639-1)
- `code` must be lowercase

### TourTranslation Model (MODIFIED)

**Before:**
```python
class TourTranslation(Base):
    tour_id = Column(UUID, ForeignKey("tours.id"))
    language = Column(String(2))  # Hardcoded 'en' or 'fr'
    title = Column(String(200))
    description = Column(Text)
```

**After:**
```python
class TourTranslation(Base):
    __tablename__ = "tour_translations"
    
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    tour_id = Column(UUID, ForeignKey("tours.id"), nullable=False)
    language_code = Column(String(2), ForeignKey("languages.code"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    itinerary = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tour = relationship("Tour", back_populates="translations")
    language = relationship("Language", back_populates="translations")
    
    # Composite unique constraint
    __table_args__ = (
        UniqueConstraint('tour_id', 'language_code', name='uq_tour_language'),
        Index('idx_tour_language', 'tour_id', 'language_code'),
    )
```

**Key Changes:**
- `language` → `language_code` (foreign key to languages table)
- Added foreign key constraint to `languages.code`
- Added composite unique constraint (one translation per tour per language)
- Added index for performance

## Database Migration Strategy

### Step 1: Create Languages Table

```sql
CREATE TABLE languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(2) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    native_name VARCHAR(100) NOT NULL,
    flag_emoji VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_default BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_languages_code ON languages(code);
CREATE INDEX idx_languages_active ON languages(is_active);
```

### Step 2: Seed Default Languages

```sql
INSERT INTO languages (code, name, native_name, flag_emoji, is_active, is_default) VALUES
('en', 'English', 'English', '🇺🇸', TRUE, TRUE),
('fr', 'French', 'Français', '🇫🇷', TRUE, FALSE);
```

### Step 3: Modify Tour Translations Table

```sql
-- Add new column
ALTER TABLE tour_translations 
ADD COLUMN language_code VARCHAR(2);

-- Migrate existing data
UPDATE tour_translations 
SET language_code = language 
WHERE language IN ('en', 'fr');

-- Add foreign key constraint
ALTER TABLE tour_translations
ADD CONSTRAINT fk_tour_translations_language 
FOREIGN KEY (language_code) REFERENCES languages(code);

-- Drop old column
ALTER TABLE tour_translations 
DROP COLUMN language;

-- Add unique constraint
ALTER TABLE tour_translations
ADD CONSTRAINT uq_tour_language UNIQUE (tour_id, language_code);

-- Add index
CREATE INDEX idx_tour_language ON tour_translations(tour_id, language_code);
```

## API Specifications

### Language Management Endpoints

#### GET /api/languages
**Description:** Retrieve all languages (active or all)

**Query Parameters:**
- `active_only` (boolean, default: true) - Filter active languages only

**Response:**
```json
{
  "languages": [
    {
      "id": "uuid",
      "code": "en",
      "name": "English",
      "native_name": "English",
      "flag_emoji": "🇺🇸",
      "is_active": true,
      "is_default": true,
      "created_at": "2025-01-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "code": "es",
      "name": "Spanish",
      "native_name": "Español",
      "flag_emoji": "🇪🇸",
      "is_active": true,
      "is_default": false,
      "created_at": "2025-01-02T00:00:00Z"
    }
  ]
}
```

#### POST /api/languages
**Description:** Create a new language (Admin only)

**Request Body:**
```json
{
  "code": "es",
  "name": "Spanish",
  "native_name": "Español",
  "flag_emoji": "🇪🇸",
  "is_active": true
}
```

**Validation:**
- `code`: Required, exactly 2 lowercase letters, unique
- `name`: Required, max 100 characters
- `native_name`: Required, max 100 characters
- `flag_emoji`: Required, valid emoji
- `is_active`: Optional, default true

**Response:** 201 Created
```json
{
  "id": "uuid",
  "code": "es",
  "name": "Spanish",
  "native_name": "Español",
  "flag_emoji": "🇪🇸",
  "is_active": true,
  "is_default": false,
  "created_at": "2025-01-02T00:00:00Z"
}
```

#### PUT /api/languages/:id
**Description:** Update an existing language (Admin only)

**Request Body:**
```json
{
  "name": "Spanish (Spain)",
  "native_name": "Español (España)",
  "flag_emoji": "🇪🇸",
  "is_active": false
}
```

**Notes:**
- Cannot change `code` after creation
- Cannot set `is_default` to false for default language
- Cannot deactivate default language

**Response:** 200 OK (same structure as POST)

#### DELETE /api/languages/:id
**Description:** Delete a language (Admin only)

**Validation:**
- Cannot delete default language
- Cannot delete if tours have translations in this language (returns 409 Conflict)

**Response:** 204 No Content

#### GET /api/tours/:id/available-languages
**Description:** Get list of languages that have translations for a specific tour

**Response:**
```json
{
  "tour_id": "uuid",
  "available_languages": ["en", "fr", "es"]
}
```

### Modified Tour Endpoints

#### GET /api/tours?lang=XX
**Changes:**
- Accept any valid language code (not just en/fr)
- Return tours with translations in requested language
- Fallback to default language if translation missing
- Include `available_languages` array in response

**Response:**
```json
{
  "tours": [
    {
      "id": "uuid",
      "title": "Sahara Desert Tour",
      "description": "...",
      "price": 150,
      "available_languages": ["en", "fr", "es"],
      "current_language": "es",
      "is_fallback": false
    }
  ]
}
```

## Frontend Components

### 1. Dynamic Language Switcher (Navbar)

**File:** `frontend/src/components/Navbar.tsx`

**Changes:**
```typescript
// Before: Hardcoded
const languages = ['en', 'fr'];

// After: Dynamic
const [languages, setLanguages] = useState<Language[]>([]);

useEffect(() => {
  const fetchLanguages = async () => {
    const langs = await languagesService.getActiveLanguages();
    setLanguages(langs);
  };
  fetchLanguages();
}, []);

// Render
{languages.map(lang => (
  <button onClick={() => changeLanguage(lang.code)}>
    <span>{lang.flag_emoji}</span>
    <span>{lang.code.toUpperCase()}</span>
  </button>
))}
```

### 2. Language Management UI (Admin Panel)

**File:** `frontend/src/components/LanguageManager.tsx`

**Features:**
- Table displaying all languages
- Add Language button → Opens modal/form
- Edit icon per language → Opens edit form
- Toggle switch for is_active
- Delete icon (with confirmation)
- Flag emoji picker/input

**Component Structure:**
```typescript
const LanguageManager = () => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  
  // CRUD operations
  const handleAddLanguage = async (data: LanguageCreate) => { ... };
  const handleUpdateLanguage = async (id: string, data: LanguageUpdate) => { ... };
  const handleDeleteLanguage = async (id: string) => { ... };
  const handleToggleActive = async (id: string, isActive: boolean) => { ... };
  
  return (
    <div>
      <button onClick={() => setShowAddForm(true)}>Add Language</button>
      <table>
        {/* Language list */}
      </table>
      {showAddForm && <LanguageForm onSubmit={handleAddLanguage} />}
    </div>
  );
};
```

### 3. Dynamic Tour Translation Form

**File:** `frontend/src/components/TourForm.tsx` (Modified)

**Changes:**
```typescript
// Before: Hardcoded tabs
<Tabs>
  <Tab label="English">...</Tab>
  <Tab label="French">...</Tab>
</Tabs>

// After: Dynamic tabs
const [activeLanguages, setActiveLanguages] = useState<Language[]>([]);
const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en']);

<div>
  <h3>Select Languages for Translation:</h3>
  {activeLanguages.map(lang => (
    <Checkbox
      key={lang.code}
      checked={selectedLanguages.includes(lang.code)}
      onChange={() => toggleLanguage(lang.code)}
      label={`${lang.flag_emoji} ${lang.name}`}
    />
  ))}
</div>

<Tabs>
  {selectedLanguages.map(langCode => {
    const lang = activeLanguages.find(l => l.code === langCode);
    return (
      <Tab key={langCode} label={`${lang.flag_emoji} ${lang.name}`}>
        <input name={`title_${langCode}`} />
        <textarea name={`description_${langCode}`} />
      </Tab>
    );
  })}
</Tabs>
```

## API Service Layer

### Language Service

**File:** `frontend/src/api/languages.ts`

```typescript
export interface Language {
  id: string;
  code: string;
  name: string;
  native_name: string;
  flag_emoji: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

export interface LanguageCreate {
  code: string;
  name: string;
  native_name: string;
  flag_emoji: string;
  is_active?: boolean;
}

export interface LanguageUpdate {
  name?: string;
  native_name?: string;
  flag_emoji?: string;
  is_active?: boolean;
}

class LanguagesService {
  private baseURL = '/api/languages';
  
  async getActiveLanguages(): Promise<Language[]> {
    const response = await axios.get(`${this.baseURL}?active_only=true`);
    return response.data.languages;
  }
  
  async getAllLanguages(): Promise<Language[]> {
    const response = await axios.get(`${this.baseURL}?active_only=false`);
    return response.data.languages;
  }
  
  async createLanguage(data: LanguageCreate): Promise<Language> {
    const response = await axios.post(this.baseURL, data);
    return response.data;
  }
  
  async updateLanguage(id: string, data: LanguageUpdate): Promise<Language> {
    const response = await axios.put(`${this.baseURL}/${id}`, data);
    return response.data;
  }
  
  async deleteLanguage(id: string): Promise<void> {
    await axios.delete(`${this.baseURL}/${id}`);
  }
  
  async getTourLanguages(tourId: string): Promise<string[]> {
    const response = await axios.get(`/api/tours/${tourId}/available-languages`);
    return response.data.available_languages;
  }
}

export const languagesService = new LanguagesService();
```

## Error Handling

### Backend Errors

1. **Language Code Already Exists**
   - Status: 409 Conflict
   - Message: "Language code 'es' already exists"

2. **Cannot Delete Default Language**
   - Status: 400 Bad Request
   - Message: "Cannot delete the default language"

3. **Cannot Delete Language With Translations**
   - Status: 409 Conflict
   - Message: "Cannot delete language 'es'. 15 tours have translations in this language."

4. **Invalid Language Code**
   - Status: 400 Bad Request
   - Message: "Language code must be exactly 2 lowercase letters"

### Frontend Error Handling

```typescript
try {
  await languagesService.deleteLanguage(id);
  showSuccess("Language deleted successfully");
} catch (error) {
  if (error.response?.status === 409) {
    showError("Cannot delete: Tours are using this language");
  } else {
    showError("Failed to delete language");
  }
}
```

## Testing Strategy

### Backend Tests

1. **Language CRUD Tests**
   - Create language with valid data
   - Create language with duplicate code (should fail)
   - Update language
   - Delete language without translations
   - Delete language with translations (should fail)
   - Get active languages only
   - Get all languages

2. **Tour Translation Tests**
   - Create tour with multiple language translations
   - Fetch tour in specific language
   - Fetch tour in non-existent language (should fallback)
   - Get available languages for tour

### Frontend Tests

1. **Language Switcher Tests**
   - Displays all active languages
   - Switches language on click
   - Updates tour content after switch

2. **Language Manager Tests**
   - Displays language list
   - Creates new language
   - Edits existing language
   - Deletes language
   - Toggles active status

3. **Tour Form Tests**
   - Displays language checkboxes
   - Shows translation tabs for selected languages
   - Saves translations for multiple languages

## Performance Considerations

1. **Caching**
   - Cache active languages list in frontend (refresh every 5 minutes)
   - Cache language list in backend (invalidate on language changes)

2. **Database Indexes**
   - Index on `languages.code` for fast lookups
   - Index on `languages.is_active` for filtering
   - Composite index on `tour_translations(tour_id, language_code)`

3. **Query Optimization**
   - Use JOIN to fetch tour with translation in one query
   - Eager load language data with translations

## Security Considerations

1. **Admin-Only Operations**
   - All language management endpoints require admin authentication
   - Validate admin role before allowing CRUD operations

2. **Input Validation**
   - Sanitize language code (only lowercase letters)
   - Validate flag emoji (prevent XSS)
   - Limit name/native_name length

3. **SQL Injection Prevention**
   - Use parameterized queries
   - ORM handles escaping

## Deployment Strategy

### Phase 1: Database Migration
1. Create `languages` table
2. Seed EN and FR
3. Add `language_code` column to `tour_translations`
4. Migrate existing data
5. Add foreign key constraints

### Phase 2: Backend Deployment
1. Deploy new API endpoints
2. Update tour endpoints to support dynamic languages
3. Test backward compatibility

### Phase 3: Frontend Deployment
1. Deploy language management UI (admin only)
2. Update language switcher
3. Update tour forms
4. Test end-to-end

### Rollback Plan
- Keep old `language` column temporarily
- Can revert to hardcoded EN/FR if issues arise
- Database backup before migration

## Future Enhancements

1. **RTL Language Support**
   - Add `text_direction` field (ltr/rtl)
   - Apply RTL CSS for Arabic, Hebrew, etc.

2. **Language-Specific SEO**
   - Generate sitemaps per language
   - Add hreflang tags

3. **Translation Status**
   - Track translation completion percentage
   - Show "Translation needed" badges

4. **Bulk Translation Import**
   - Import translations from CSV/Excel
   - Integration with translation services

5. **Language Analytics**
   - Track which languages users prefer
   - Show popular languages in admin dashboard
