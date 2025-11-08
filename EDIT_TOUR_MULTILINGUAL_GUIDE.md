# Editing Tours with Multiple Languages - User Guide

## Overview
You can now edit existing tours and add translations in multiple languages. The system provides a dedicated edit page with full dynamic language support.

## How to Edit a Tour with Multiple Languages

### Step 1: Access the Admin Page
1. Navigate to **http://localhost:3000/admin**
2. Scroll to the **Tour Management** section
3. Find the tour you want to edit in the tours list

### Step 2: Click Edit on a Tour
1. Click the **Edit** button (pencil icon) next to the tour
2. You'll see a blue information box with two options:
   - **Cancel** - Go back to the tour list
   - **Edit with Full Language Support** - Opens the dedicated edit page

### Step 3: Use the Full Language Edit Page
1. Click **"Edit with Full Language Support"**
2. You'll be redirected to: `/admin/tours/{tour-id}/edit`
3. The page will load the tour's existing data and translations

### Step 4: Edit Tour Information

The edit page shows:

#### Language Selection Section
- All active languages with checkboxes
- Currently translated languages are pre-selected
- You can add new languages by checking additional boxes
- English is always required and cannot be unchecked

#### Translation Tabs
- One tab for each selected language
- Existing translations are pre-filled
- You can edit existing translations
- You can add new translations for newly selected languages

#### Tour Details (Non-translatable)
- Price
- Duration
- Max Participants
- Difficulty Level
- Includes (comma-separated)
- Available Dates (comma-separated)
- Tour Image URL

### Step 5: Make Your Changes

**To Add a New Language:**
1. Check the language checkbox (e.g., Spanish 🇪🇸)
2. A new tab appears for that language
3. Click the tab and fill in the translation fields:
   - Title
   - Location
   - Description
   - Itinerary

**To Edit Existing Translation:**
1. Click on the language tab
2. Modify the fields as needed
3. All changes are saved when you click "Update Tour"

**To Remove a Language:**
1. Uncheck the language checkbox
2. The translation will be removed when you save
3. Note: You cannot remove English (required)

### Step 6: Save Changes
1. Review all your changes
2. Click **"Update Tour"** button
3. Wait for the success message
4. You'll be redirected back to the Admin page

## Example Workflow

### Scenario: Add Spanish and German to an English-only tour

1. **Start**: Tour "Sahara Desert Adventure" exists only in English
2. **Edit**: Click Edit → "Edit with Full Language Support"
3. **Select Languages**: 
   - ✅ English (already selected, required)
   - ☑ French (check this)
   - ☑ Spanish (check this)
   - ☑ German (check this)
4. **Fill Translations**:
   - Click **French tab** → Enter French translations
   - Click **Spanish tab** → Enter Spanish translations
   - Click **German tab** → Enter German translations
5. **Save**: Click "Update Tour"
6. **Result**: Tour now available in 4 languages!

## Features

### ✅ What You Can Do:
- Add new language translations to existing tours
- Edit existing translations
- Remove language translations (except English)
- Update tour details (price, duration, etc.)
- Change tour images
- Modify includes and available dates

### ⚠️ Important Notes:
- **English is required** - You cannot remove or skip English translation
- **Existing translations are preserved** - If you don't change a translation, it stays the same
- **Validation** - All required fields must be filled for each selected language
- **Auto-save** - Changes are only saved when you click "Update Tour"

## API Endpoint Used

The edit page uses the following API endpoint:
```
PUT /tours/v2/{tour_id}
```

Request body format:
```json
{
  "price": 250.00,
  "duration": "3 days / 2 nights",
  "max_participants": 12,
  "difficulty_level": "Moderate",
  "includes": ["Meals", "Transport", "Guide"],
  "available_dates": ["2025-06-01", "2025-07-15"],
  "translations": [
    {
      "language_code": "en",
      "title": "Sahara Desert Adventure",
      "description": "Experience the magic...",
      "location": "Merzouga, Morocco",
      "itinerary": "Day 1: Departure..."
    },
    {
      "language_code": "fr",
      "title": "Aventure dans le Désert du Sahara",
      "description": "Découvrez la magie...",
      "location": "Merzouga, Maroc",
      "itinerary": "Jour 1: Départ..."
    }
  ],
  "images": [
    {
      "image_url": "https://...",
      "is_main": true,
      "display_order": 0,
      "alt_text": "Tour image"
    }
  ]
}
```

## Troubleshooting

### Issue: Edit button doesn't show the edit page
**Solution**: Make sure you're clicking "Edit with Full Language Support" button, not just "Edit"

### Issue: Translations not loading
**Solution**: 
1. Check that the tour has existing translations
2. Refresh the page
3. Check browser console for errors

### Issue: Cannot save changes
**Solution**:
1. Ensure English translation is complete
2. Check that all selected languages have translations
3. Verify all required fields are filled
4. Check network tab for API errors

### Issue: Language checkbox is disabled
**Solution**: English checkbox is always disabled because it's required. This is expected behavior.

## Files Involved

### Frontend Files:
- `frontend/src/pages/EditTourPage.tsx` - Dedicated edit page
- `frontend/src/pages/AdminPage.tsx` - Admin page with edit button
- `frontend/src/components/TourForm.tsx` - Reusable form component
- `frontend/src/App.tsx` - Routing configuration

### Backend Files:
- `tours-service/main.py` - PUT /tours/v2/{tour_id} endpoint
- `tours-service/crud.py` - update_tour function
- `tours-service/schemas.py` - TourUpdateDynamic schema

## Summary

The multilingual tour editing system allows you to:
1. ✅ Edit existing tours
2. ✅ Add new language translations
3. ✅ Update existing translations
4. ✅ Remove language translations
5. ✅ Modify tour details
6. ✅ Manage unlimited languages

All through an intuitive interface that mirrors the tour creation experience!

## Next Steps

After editing a tour:
1. Visit the Tours page to see the updated tour
2. Use the language switcher to view it in different languages
3. Check that all translations display correctly
4. Test the booking flow in different languages

The system is now fully functional for creating and editing multilingual tours!
