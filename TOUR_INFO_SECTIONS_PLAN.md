# Tour Custom Information Sections - Implementation Plan

## Overview
Allow admins to add unlimited custom information sections to tours (e.g., Driver Info, Pick-up Method, What to Bring, etc.) that display as collapsible accordions below the image slider on tour details page.

## Requirements
✅ **Content Type:** Rich text with formatting (using RichTextEditor)
✅ **Display:** Collapsible/Accordion style
✅ **Icons:** Not required
✅ **Limit:** Unlimited sections per tour
✅ **Multilingual:** Support EN/FR translations
✅ **Location:** Below image slider on TourDetailsPage

---

## Database Schema

### New Table: `tour_info_sections`
```sql
CREATE TABLE tour_info_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    title_en VARCHAR(200) NOT NULL,
    title_fr VARCHAR(200) NOT NULL,
    content_en TEXT NOT NULL,
    content_fr TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tour_info_sections_tour_id ON tour_info_sections(tour_id);
CREATE INDEX idx_tour_info_sections_order ON tour_info_sections(tour_id, display_order);
```

---

## Backend Implementation

### 1. Models (`tours-service/models.py`)
```python
class TourInfoSection(Base):
    __tablename__ = "tour_info_sections"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tour_id = Column(UUID(as_uuid=True), ForeignKey('tours.id', ondelete='CASCADE'))
    title_en = Column(String(200), nullable=False)
    title_fr = Column(String(200), nullable=False)
    content_en = Column(Text, nullable=False)
    content_fr = Column(Text, nullable=False)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    tour = relationship("Tour", back_populates="info_sections")
```

### 2. Schemas (`tours-service/schemas.py`)
```python
class TourInfoSectionBase(BaseModel):
    title_en: str
    title_fr: str
    content_en: str
    content_fr: str
    display_order: int = 0

class TourInfoSectionCreate(TourInfoSectionBase):
    pass

class TourInfoSectionUpdate(BaseModel):
    title_en: Optional[str]
    title_fr: Optional[str]
    content_en: Optional[str]
    content_fr: Optional[str]
    display_order: Optional[int]

class TourInfoSectionResponse(TourInfoSectionBase):
    id: str
    tour_id: str
    created_at: datetime
    updated_at: datetime
```

### 3. CRUD Operations (`tours-service/crud.py`)
- `get_tour_info_sections(db, tour_id)`
- `create_tour_info_section(db, tour_id, section)`
- `update_tour_info_section(db, section_id, section)`
- `delete_tour_info_section(db, section_id)`
- `reorder_tour_info_sections(db, tour_id, section_orders)`

### 4. API Endpoints (`tours-service/main.py`)
```python
GET    /tours/{tour_id}/info-sections
POST   /tours/{tour_id}/info-sections
PUT    /info-sections/{section_id}
DELETE /info-sections/{section_id}
POST   /tours/{tour_id}/info-sections/reorder
```

---

## Frontend Implementation

### 1. Admin Panel Component
**File:** `frontend/src/components/TourInfoSectionsManager.tsx`

Features:
- List all sections for selected tour
- Add new section with EN/FR titles and content
- Edit existing sections
- Delete sections
- Drag-and-drop reordering
- RichTextEditor for content (both languages)
- Language tabs (EN/FR) for editing

### 2. Tour Details Display
**File:** `frontend/src/pages/TourDetailsPage.tsx`

Location: Below image slider, before "About This Tour"

Display:
- Collapsible accordion sections
- Show title in current language
- Expand/collapse animation
- Rich text content rendering
- Ordered by display_order

### 3. API Client
**File:** `frontend/src/api/tours.ts`

Add methods:
```typescript
getTourInfoSections(tourId: string): Promise<TourInfoSection[]>
createTourInfoSection(tourId: string, data: TourInfoSectionCreate): Promise<TourInfoSection>
updateTourInfoSection(sectionId: string, data: TourInfoSectionUpdate): Promise<TourInfoSection>
deleteTourInfoSection(sectionId: string): Promise<void>
reorderTourInfoSections(tourId: string, orders: {id: string, order: number}[]): Promise<void>
```

---

## UI/UX Design

### Admin Panel
```
┌─────────────────────────────────────────────┐
│ Tour Information Sections                   │
│                                             │
│ [+ Add New Section]                         │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ 🔽 Driver Information          [Edit][X]│
│ │    Order: 1                           │
│ └─────────────────────────────────────┘   │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ 🔽 Pick-up Method             [Edit][X]│
│ │    Order: 2                           │
│ └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Tour Details Page (Public)
```
┌─────────────────────────────────────────────┐
│ [Image Slider]                              │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ ▶ Driver Information                        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ ▼ Pick-up Method                            │
│                                             │
│ We offer convenient hotel pick-up from      │
│ Marrakech city center. Our driver will...  │
└─────────────────────────────────────────────┘

About This Tour
...
```

---

## Implementation Steps

### Phase 1: Database & Backend
1. ✅ Create migration file
2. ✅ Add model to models.py
3. ✅ Add schemas to schemas.py
4. ✅ Add CRUD operations
5. ✅ Add API endpoints
6. ✅ Test with Postman/curl

### Phase 2: Frontend Display
1. ✅ Update TourDetailsPage to fetch sections
2. ✅ Create collapsible accordion component
3. ✅ Display sections below image slider
4. ✅ Handle multilingual display
5. ✅ Test on tour details page

### Phase 3: Admin Panel
1. ✅ Create TourInfoSectionsManager component
2. ✅ Add to AdminPage
3. ✅ Implement add/edit/delete functionality
4. ✅ Add RichTextEditor for content
5. ✅ Implement reordering
6. ✅ Test full workflow

---

## Example Data

```json
{
  "title_en": "Driver Information",
  "title_fr": "Informations sur le Chauffeur",
  "content_en": "<p>Our professional drivers have <strong>10+ years of experience</strong> and are fully licensed. They speak English, French, and Arabic.</p>",
  "content_fr": "<p>Nos chauffeurs professionnels ont <strong>plus de 10 ans d'expérience</strong> et sont entièrement licenciés. Ils parlent anglais, français et arabe.</p>",
  "display_order": 1
}
```

---

## Testing Checklist

### Backend
- [ ] Create section via API
- [ ] Get sections for tour
- [ ] Update section
- [ ] Delete section
- [ ] Reorder sections
- [ ] Cascade delete when tour deleted

### Frontend Display
- [ ] Sections appear below image slider
- [ ] Collapsible accordion works
- [ ] Content displays with formatting
- [ ] Switches language correctly
- [ ] Ordered correctly

### Admin Panel
- [ ] Can add new section
- [ ] Can edit section
- [ ] Can delete section
- [ ] Can reorder sections
- [ ] RichTextEditor works for both languages
- [ ] Validation works

---

## Estimated Time
- Database & Backend: 1 hour
- Frontend Display: 1 hour
- Admin Panel: 2 hours
- Testing & Polish: 1 hour
**Total: ~5 hours**

---

Ready to implement! 🚀
