# Frontend Tour Creation Debug Guide

## Issue
Images uploaded during tour creation don't appear on tour cards, but the backend test shows images ARE being saved correctly.

## Backend Test Results ✅
- Created tour with 3 images via API
- All 3 images saved to database
- All 3 images returned when fetching tour
- **Backend is working correctly!**

## Problem Location
The issue is in the **frontend** - specifically in how data flows from TourForm to DynamicTourAdminPage.

## Debug Steps

### 1. Check Browser Console
When creating a tour with images:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Create a new tour with images
4. Look for any errors or warnings

### 2. Check Network Tab
1. Open DevTools Network tab
2. Create a tour with images
3. Find the POST request to `/tours/v2`
4. Click on it and check the "Payload" or "Request" tab
5. **Verify the `images` array is present in the request**

Expected payload should look like:
```json
{
  "translations": [...],
  "price": 100,
  "duration": "2 days",
  ...
  "images": [
    {
      "image_url": "https://...",
      "is_main": true,
      "display_order": 0,
      "alt_text": "..."
    }
  ]
}
```

### 3. Add Console Logging

Add temporary logging to `DynamicTourAdminPage.tsx` in the `handleAddTour` function:

```typescript
const handleAddTour = async (data: TourFormData) => {
  try {
    // ADD THIS LINE:
    console.log('📸 TourForm data received:', data);
    console.log('📸 Images in data:', data.images);
    console.log('📸 Image URL in data:', data.image_url);
    
    const tourData = {
      // ... rest of code
    }
    
    // ADD THIS LINE:
    console.log('📤 Sending to API:', tourData);
    
    await toursService.createTourDynamic(tourData)
    // ...
  }
}
```

### 4. Check TourForm Submission

Add logging to `TourForm.tsx` in the `handleSubmit` function:

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  
  // ... existing code ...
  
  const submitData = {
    ...formData,
    translations: translationsArray,
    images: images.length > 0 ? images : undefined
  }
  
  // ADD THIS LINE:
  console.log('📋 TourForm submitting:', submitData);
  console.log('📋 Images array:', images);
  
  onSubmit(submitData)
}
```

## Expected Flow

1. **TourForm**: User uploads images → `images` state is updated
2. **TourForm**: User clicks Save → `handleSubmit` creates `submitData` with `images` array
3. **TourForm**: Calls `onSubmit(submitData)` 
4. **DynamicTourAdminPage**: `handleAddTour` receives `data` with `images` array
5. **DynamicTourAdminPage**: Creates `tourData` with `images` array
6. **API**: Sends POST to `/tours/v2` with images
7. **Backend**: Saves tour and images to database

## Possible Issues

### Issue A: Images not in TourForm state
- Check if `images` state is being updated when uploading
- Verify `handleFileUpload` and `handleAddImageUrl` are working

### Issue B: Images not passed to onSubmit
- Check if `submitData` includes `images` array
- Verify the condition: `images.length > 0 ? images : undefined`

### Issue C: Images lost in DynamicTourAdminPage
- Check if `data.images` exists in `handleAddTour`
- Verify the condition: `data.images && data.images.length > 0`

### Issue D: Images not sent to API
- Check Network tab to see actual request payload
- Verify `toursService.createTourDynamic` is called with correct data

## Quick Test

Run this in browser console after creating a tour:
```javascript
// Get the last created tour
fetch('http://localhost:3000/api/tours?lang=en')
  .then(r => r.json())
  .then(tours => {
    const lastTour = tours[0];
    console.log('Last tour images:', lastTour.images);
  });
```

## Solution Checklist

- [ ] Verify images are in `images` state in TourForm
- [ ] Verify images are in `submitData` when submitting
- [ ] Verify images are in `data` parameter in handleAddTour
- [ ] Verify images are in `tourData` sent to API
- [ ] Verify images are in POST request payload (Network tab)
- [ ] Verify images are returned when fetching tour
