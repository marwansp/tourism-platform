# Multilingual Admin Panel - User Guide 🌍

## Overview
The admin panel now supports creating tours in both English and French simultaneously!

---

## How to Create a Multilingual Tour

### Step 1: Access Admin Panel
1. Navigate to http://localhost:3000/admin
2. Click on the "Tours" tab

### Step 2: Enable Multilingual Mode
1. Click "Add New Tour" button
2. You'll see a checkbox labeled **"Multilingual (EN/FR)"**
3. ✅ Check this box to enable multilingual mode
4. You'll see language tabs appear: 🇬🇧 English | 🇫🇷 Français

### Step 3: Fill English Content
1. Click on the **🇬🇧 English** tab (selected by default)
2. Fill in the English fields:
   - **Title (EN)**: e.g., "Sahara Desert Adventure"
   - **Description (EN)**: Full tour description in English
   - **Location (EN)**: e.g., "Merzouga, Morocco"
   - **Includes (EN)**: e.g., "Transportation, meals, camping equipment, guide"

### Step 4: Fill French Content
1. Click on the **🇫🇷 Français** tab
2. Fill in the French fields:
   - **Title (FR)**: e.g., "Aventure dans le Désert du Sahara"
   - **Description (FR)**: Full tour description in French
   - **Location (FR)**: e.g., "Merzouga, Maroc"
   - **Includes (FR)**: e.g., "Transport, repas, équipement de camping, guide"

### Step 5: Fill Non-Translatable Fields
These fields are the same for both languages:
- **Price**: Tour price in MAD
- **Duration**: e.g., "3 days / 2 nights"
- **Max Participants**: Maximum number of people
- **Difficulty Level**: Easy, Moderate, or Challenging
- **Available Dates**: Comma-separated dates

### Step 6: Add Images
1. Click "Add Image" button
2. Either:
   - Paste image URL directly, OR
   - Click "Upload" to upload from your computer
3. Set one image as "Main Image" (checkbox)
4. Add alt text for accessibility
5. Repeat for multiple images

### Step 7: Submit
1. Click "Save Tour" button
2. The tour will be created with both English and French translations
3. Users can now view this tour in either language!

---

## Features

### Language Tabs
- Switch between English and French tabs while filling the form
- Each tab shows the appropriate language fields
- Fields are clearly labeled with (EN) or (FR)

### Validation
The form validates that you've filled:
- ✅ Title in both languages
- ✅ Description in both languages
- ✅ Location in both languages
- ✅ At least one image

### Single-Language Mode
If you uncheck "Multilingual (EN/FR)":
- Form reverts to single-language mode
- Only English fields are shown
- Tour will be created without French translation
- You can add French translation later via API

---

## Tips

### 1. Use Rich Text Editor
- The description field supports rich text formatting
- Add bold, italic, lists, and links
- Same formatting tools available in both languages

### 2. Consistent Translations
- Keep the same meaning across languages
- Adapt cultural references appropriately
- Use proper French grammar and accents

### 3. Image Alt Text
- Provide descriptive alt text for accessibility
- Can be in English (used for both languages)

### 4. Includes Field
- Use comma-separated values
- Example EN: "Transportation, meals, guide"
- Example FR: "Transport, repas, guide"

---

## Example: Creating a Desert Tour

### English Tab (🇬🇧)
```
Title: 3-Day Sahara Desert Adventure
Description: Experience the magic of the Sahara Desert with camel rides, 
overnight camping under the stars, and traditional Berber hospitality. 
This unforgettable journey takes you deep into the golden dunes...

Location: Merzouga, Morocco
Includes: 4x4 transportation, camel trekking, desert camping, all meals, 
Berber guide, sandboarding
```

### French Tab (🇫🇷)
```
Title: Aventure de 3 Jours dans le Désert du Sahara
Description: Découvrez la magie du désert du Sahara avec des promenades 
à dos de chameau, un camping nocturne sous les étoiles et l'hospitalité 
berbère traditionnelle. Ce voyage inoubliable vous emmène au cœur des 
dunes dorées...

Location: Merzouga, Maroc
Includes: Transport 4x4, randonnée à dos de chameau, camping dans le 
désert, tous les repas, guide berbère, sandboard
```

### Common Fields
```
Price: 1500 (MAD)
Duration: 3 days / 2 nights
Max Participants: 15
Difficulty: Moderate
Available Dates: 2025-11-01, 2025-11-15, 2025-12-01
```

---

## Viewing Your Multilingual Tour

### As Admin
1. After creating, the tour appears in the tours list
2. You can edit it later (currently single-language edit only)

### As User
1. Users visit the website
2. Click language switcher (🇬🇧/🇫🇷) in navbar
3. Tour content automatically updates to selected language
4. All fields (title, description, location, includes) are translated

---

## API Endpoint Used

When you submit a multilingual tour, it calls:
```
POST /tours/multilingual
```

With data structure:
```json
{
  "price": 1500,
  "duration": "3 days / 2 nights",
  "max_participants": 15,
  "difficulty_level": "Moderate",
  "available_dates": ["2025-11-01", "2025-11-15"],
  "translations": {
    "en": {
      "title": "...",
      "description": "...",
      "location": "...",
      "includes": "..."
    },
    "fr": {
      "title": "...",
      "description": "...",
      "location": "...",
      "includes": "..."
    }
  },
  "images": [...]
}
```

---

## Troubleshooting

### "Please provide titles in both languages"
- Make sure you've filled the Title field in BOTH English and French tabs
- Switch to each tab and verify the field is not empty

### "Please provide descriptions in both languages"
- Fill the Description field in both language tabs
- Use the rich text editor in both tabs

### "Please provide locations in both languages"
- Enter location in both English and French tabs
- Example: "Marrakech" (EN) and "Marrakech" (FR) - can be the same!

### Images not uploading
- Check file size (should be < 5MB)
- Supported formats: JPG, PNG, WebP
- Try pasting URL directly if upload fails

---

## Future Enhancements

Coming soon:
- Edit multilingual tours (currently can only create)
- Copy content from one language to another
- Auto-translate suggestions
- Preview in both languages before saving
- Bulk import/export translations

---

## Support

Need help?
- Check the console for error messages (F12 in browser)
- Verify all required fields are filled
- Test with a simple tour first
- Contact support if issues persist

---

**Happy multilingual tour creating!** 🌍✨

**Admin Panel:** http://localhost:3000/admin
**Test Frontend:** http://localhost:3000
