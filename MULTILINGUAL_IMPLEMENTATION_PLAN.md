# Multilingual Support Implementation Plan 🌐

## ✅ Phase 1: Database - COMPLETE!

**What was done:**
- Created `tour_translations` table
- Migrated 11 existing tours to English translations
- Created 11 default French translations
- Added indexes for performance
- Added update triggers

**Database Structure:**
```sql
tour_translations
├── id (UUID)
├── tour_id (FK to tours)
├── language ('en' or 'fr')
├── title
├── description
├── location
├── includes
├── created_at
└── updated_at
```

**Verification:**
```bash
# Check translations
docker-compose exec -T tours-db psql -U tours_user -d tours_db -c "SELECT COUNT(*) as total, language FROM tour_translations GROUP BY language;"
```

---

## 🔄 Phase 2: Backend API (Next Steps)

### 2.1 Update Tours Service Schemas

**File:** `tours-service/schemas.py`

Add translation schemas:
```python
class TourTranslationBase(BaseModel):
    language: str
    title: str
    description: str
    location: str
    includes: Optional[str]

class TourTranslationCreate(TourTranslationBase):
    pass

class TourTranslationResponse(TourTranslationBase):
    id: str
    tour_id: str
    created_at: datetime
    updated_at: datetime

class TourWithTranslations(TourResponse):
    translations: List[TourTranslationResponse]
```

### 2.2 Update CRUD Operations

**File:** `tours-service/crud.py`

Add functions:
```python
def get_tour_translation(db: Session, tour_id: str, language: str):
    """Get tour translation for specific language"""
    
def create_tour_translations(db: Session, tour_id: str, translations: dict):
    """Create translations when creating tour"""
    
def update_tour_translations(db: Session, tour_id: str, translations: dict):
    """Update translations when updating tour"""
    
def get_tours_with_language(db: Session, language: str, skip: int = 0, limit: int = 100):
    """Get all tours with translations in specified language"""
```

### 2.3 Update API Endpoints

**File:** `tours-service/main.py`

Modify endpoints:
```python
@app.get("/tours")
async def get_tours(
    lang: str = Query("en", regex="^(en|fr)$"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get tours with translations in specified language"""
    
@app.get("/tours/{tour_id}")
async def get_tour(
    tour_id: str,
    lang: str = Query("en", regex="^(en|fr)$"),
    db: Session = Depends(get_db)
):
    """Get single tour with translation"""
    
@app.post("/tours")
async def create_tour(
    tour: TourCreate,
    translations: dict,  # {"en": {...}, "fr": {...}}
    db: Session = Depends(get_db)
):
    """Create tour with translations"""
```

---

## 🎨 Phase 3: Admin Panel (Frontend)

### 3.1 Update MultiImageTourForm

**File:** `frontend/src/components/MultiImageTourForm.tsx`

Add language tabs:
```tsx
const [activeLanguage, setActiveLanguage] = useState<'en' | 'fr'>('en')
const [translations, setTranslations] = useState({
  en: { title: '', description: '', location: '', includes: '' },
  fr: { title: '', description: '', location: '', includes: '' }
})

// Add tabs UI
<div className="flex gap-2 mb-4">
  <button 
    onClick={() => setActiveLanguage('en')}
    className={activeLanguage === 'en' ? 'active' : ''}
  >
    🇬🇧 English
  </button>
  <button 
    onClick={() => setActiveLanguage('fr')}
    className={activeLanguage === 'fr' ? 'active' : ''}
  >
    🇫🇷 Français
  </button>
</div>

// Show fields based on active language
{activeLanguage === 'en' && (
  <div>
    <input name="title_en" value={translations.en.title} />
    <RichTextEditor value={translations.en.description} />
    // ... other fields
  </div>
)}

{activeLanguage === 'fr' && (
  <div>
    <input name="title_fr" value={translations.fr.title} />
    <RichTextEditor value={translations.fr.description} />
    // ... other fields
  </div>
)}
```

### 3.2 Update API Calls

**File:** `frontend/src/api/tours.ts`

Add language parameter:
```typescript
async getTours(lang: string = 'en'): Promise<Tour[]> {
  const response = await toursApi.get(`/tours?lang=${lang}`)
  return response.data
}

async getTourById(id: string, lang: string = 'en'): Promise<Tour> {
  const response = await toursApi.get(`/tours/${id}?lang=${lang}`)
  return response.data
}

async createTour(tour: TourCreate, translations: Translations): Promise<Tour> {
  const response = await toursApi.post('/tours', { ...tour, translations })
  return response.data
}
```

---

## 🌍 Phase 4: Frontend Display

### 4.1 Update Tour Pages

**Files to modify:**
- `frontend/src/pages/ToursPage.tsx`
- `frontend/src/pages/TourDetailsPage.tsx`
- `frontend/src/pages/HomePage.tsx`

Get current language from i18n:
```typescript
import { useTranslation } from 'react-i18next'

const { i18n } = useTranslation()
const currentLang = i18n.language // 'en' or 'fr'

// Fetch tours with current language
useEffect(() => {
  const fetchTours = async () => {
    const tours = await toursService.getTours(currentLang)
    setTours(tours)
  }
  fetchTours()
}, [currentLang])
```

### 4.2 Language Switcher

The Navbar already has a language switcher! Just need to ensure it triggers tour refetch.

---

## 📋 Testing Checklist

### Backend Tests
- [ ] Create tour with both EN and FR translations
- [ ] Get tours with `?lang=en`
- [ ] Get tours with `?lang=fr`
- [ ] Update tour translations
- [ ] Delete tour (cascades to translations)

### Frontend Tests
- [ ] Admin can switch between EN/FR tabs
- [ ] Admin can fill both languages
- [ ] Admin can save tour with both translations
- [ ] Users see tours in selected language
- [ ] Language switcher updates tour content
- [ ] SEO works with both languages

---

## 🚀 Deployment Steps

1. **Apply migration** (DONE ✅)
   ```bash
   powershell ./apply_translations_migration.ps1
   ```

2. **Restart tours-service**
   ```bash
   docker-compose restart tours-service
   ```

3. **Rebuild frontend**
   ```bash
   docker-compose build frontend
   docker-compose up -d frontend
   ```

4. **Test locally**
   - Create tour with both languages
   - Switch language and verify content changes

5. **Deploy to production**
   - Push to GitHub
   - Run safe-deploy.sh on server
   - Apply migration on production database

---

## 📊 Current Status

✅ **Phase 1: Database** - COMPLETE
- Migration applied
- 11 tours with EN/FR translations
- Database structure ready

🔄 **Phase 2: Backend API** - TODO
- Update schemas
- Update CRUD
- Update endpoints

🔄 **Phase 3: Admin Panel** - TODO
- Add language tabs
- Duplicate form fields
- Handle translations

🔄 **Phase 4: Frontend Display** - TODO
- Fetch tours by language
- Display in current language
- Update on language switch

---

## 💡 Tips for Implementation

1. **Start with Backend** - Get API working first
2. **Test with Postman** - Verify endpoints before frontend
3. **One language at a time** - Get English working, then add French
4. **Fallback to English** - If French translation missing, show English
5. **Admin UX** - Make it easy to copy EN to FR as starting point

---

## 🎯 Next Session Goals

1. Implement Phase 2 (Backend API)
2. Test API endpoints
3. Start Phase 3 (Admin Panel)

**Estimated time:** 2-3 hours for complete implementation

---

**Status:** Phase 1 Complete! Ready for Phase 2! 🚀
