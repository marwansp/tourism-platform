# Tour Image Upload Implementation

## Overview
Added file upload functionality for tour images, allowing admins to upload images directly instead of only using external URLs.

## What Was Implemented

### Backend (Media Service)

1. **New Endpoint**: `POST /upload/tour-image`
   - Accepts image file uploads
   - Validates file type and size (max 10MB)
   - Processes and optimizes images
   - Stores in separate MinIO bucket: `tour-images`
   - Returns image URL

2. **Storage Service Updates**
   - Added `upload_tour_image()` method
   - Separate bucket for tour images (`tour-images`)
   - Local storage fallback in `/uploads/tours/` subfolder
   - Image optimization (resize, compress)

### Frontend (Admin Page)

1. **TourForm Component Updates**
   - Added file upload button with icon
   - Image preview functionality
   - Upload progress indicator
   - Keeps external URL option (both methods available)
   - Clean UI with "OR" divider between upload and URL input

2. **API Integration**
   - New `media.ts` API helper
   - `uploadTourImage()` function
   - Proper error handling

## Features

✅ **File Upload**
- Click "Upload from Computer" button
- Select image file (JPG, PNG, WEBP)
- Automatic upload to MinIO
- URL auto-fills after upload

✅ **External URL** (still available)
- Paste external image URL
- Useful for quick testing or external images

✅ **Image Preview**
- Shows preview of uploaded/URL image
- Updates in real-time

✅ **Validation**
- File type check (images only)
- File size limit (10MB)
- Error messages for invalid files

✅ **Separate Storage**
- Tour images in `tour-images` bucket
- Gallery images in `tourism-media` bucket
- Organized and isolated

## How to Use

### For Admins:
1. Go to Admin page
2. Click "Create New Tour" or edit existing tour
3. In the "Tour Image" section:
   - **Option 1**: Click "Upload from Computer" → Select image file
   - **Option 2**: Paste external URL in the text field
4. See image preview
5. Submit tour form

### API Usage:
```bash
# Upload tour image
curl -X POST http://localhost:8040/upload/tour-image \
  -F "file=@/path/to/image.jpg"

# Response:
{
  "url": "http://minio:9000/tour-images/uuid.jpg",
  "filename": "uuid.jpg",
  "file_size": 123456,
  "mime_type": "image/jpeg",
  "message": "Tour image uploaded successfully"
}
```

## Testing

Run the test script:
```bash
python test_tour_image_upload.py
```

## Deployment

1. **Update docker-compose.yml** (already done)
   - Media service configured

2. **Restart services**:
```bash
docker-compose restart media-service
docker-compose restart frontend
```

3. **Verify MinIO bucket**:
   - Access MinIO console: http://localhost:9001
   - Check `tour-images` bucket exists
   - Verify uploaded images

## File Structure

```
media-service/
├── main.py                          # Added /upload/tour-image endpoint
└── services/
    └── storage_service.py           # Added upload_tour_image() method

frontend/
├── src/
│   ├── api/
│   │   └── media.ts                 # New API helper
│   └── components/
│       └── TourForm.tsx             # Updated with file upload UI
```

## Benefits

1. **Better Control**: Images stored on your infrastructure
2. **Reliability**: No broken external links
3. **Performance**: Optimized images, faster loading
4. **Flexibility**: Both upload and URL options available
5. **Organization**: Separate storage for tour vs gallery images

## Next Steps (Optional)

- [ ] Add multiple image upload for tours
- [ ] Add image cropping/editing before upload
- [ ] Add drag-and-drop upload
- [ ] Add bulk image upload
- [ ] Add image management (delete old images)
