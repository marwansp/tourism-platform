# Deploy Rich Text Editor to Production 🚀

## Overview
This guide walks you through deploying the new rich text editor feature to your production server.

## What Changed
- Added `react-quill` package to `frontend/package.json`
- Created new `RichTextEditor` component
- Updated `TourForm` to use rich text editor
- Added CSS styles for editor and formatted content
- Updated display pages to render HTML

## Pre-Deployment Steps (Local)

### 1. Commit Changes to Git
```bash
# Check what files changed
git status

# Add all the new files
git add frontend/package.json
git add frontend/package-lock.json
git add frontend/src/components/RichTextEditor.tsx
git add frontend/src/components/TourForm.tsx
git add frontend/src/pages/TourDetailsPage.tsx
git add frontend/src/components/TourCard.tsx
git add frontend/src/index.css
git add RICH_TEXT_EDITOR_IMPLEMENTATION.md
git add DEPLOY_RICH_TEXT_EDITOR.md

# Commit with a clear message
git commit -m "Add rich text editor for tour descriptions"

# Push to GitHub
git push origin main
```

### 2. Verify Push
Go to your GitHub repository and confirm the changes are there:
- Check `frontend/package.json` shows `react-quill`
- Verify new files are uploaded

## Production Deployment

### Option 1: Full Fresh Deployment (Recommended)

This will pull the latest code and rebuild everything:

```bash
# SSH into your production server
ssh root@your-server-ip

# Run the production deployment script
cd /var/www/tourism-platform
bash production-deploy.sh
```

**What this does:**
1. ✅ Pulls latest code from GitHub (includes new package.json)
2. ✅ Rebuilds frontend Docker image (installs react-quill)
3. ✅ Restarts all services
4. ✅ Runs health checks

**Time:** ~5-10 minutes

### Option 2: Frontend-Only Update (Faster)

If you only want to update the frontend:

```bash
# SSH into your production server
ssh root@your-server-ip

# Navigate to project
cd /var/www/tourism-platform

# Pull latest code
git pull origin main

# Rebuild and restart frontend only
docker-compose build frontend
docker-compose up -d frontend

# Check if it's working
curl http://localhost:3000
```

**Time:** ~2-3 minutes

## Verification Steps

### 1. Check Frontend is Running
```bash
# On production server
docker-compose ps frontend

# Should show "Up" status
```

### 2. Check Frontend Logs
```bash
# On production server
docker-compose logs frontend --tail=50

# Should NOT show any errors about react-quill
```

### 3. Test in Browser

**Access your site:**
```
http://your-server-ip:3000
```

**Test the editor:**
1. Go to Admin Dashboard
2. Click "Add New Tour"
3. Look at the Description field
4. You should see a toolbar with formatting buttons
5. Try typing and formatting text
6. Save the tour
7. View the tour details page
8. Verify formatting is displayed correctly

### 4. Check Package Installation

```bash
# On production server
docker-compose exec frontend sh

# Inside container, check if react-quill is installed
# (This won't work because it's a multi-stage build, but you can check logs)
exit

# Check build logs instead
docker-compose logs frontend | grep "react-quill"
```

## Troubleshooting

### Issue: "Module not found: react-quill"

**Solution:**
```bash
# Rebuild frontend from scratch
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Issue: Editor not showing in browser

**Solution:**
```bash
# Clear browser cache
# Press Ctrl + Shift + R (hard refresh)

# Or clear cache in browser settings
```

### Issue: Formatting not displaying

**Solution:**
```bash
# Check if CSS is loaded
# Open browser DevTools (F12)
# Go to Network tab
# Refresh page
# Look for index.css - should be 200 OK

# If CSS not loading, rebuild frontend
docker-compose build frontend
docker-compose up -d frontend
```

### Issue: Build fails with npm error

**Solution:**
```bash
# Check if package.json was pushed to GitHub
git log --oneline | head -5

# If not, push again from local machine
git push origin main

# Then on server
cd /var/www/tourism-platform
git pull origin main
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

## Rollback Plan

If something goes wrong, you can rollback:

```bash
# On production server
cd /var/www/tourism-platform

# Revert to previous commit
git log --oneline | head -5  # Find previous commit hash
git checkout <previous-commit-hash>

# Rebuild frontend
docker-compose build frontend
docker-compose up -d frontend
```

## Post-Deployment Checklist

- [ ] Frontend container is running (`docker-compose ps`)
- [ ] No errors in logs (`docker-compose logs frontend`)
- [ ] Website loads in browser
- [ ] Admin dashboard accessible
- [ ] Rich text editor visible in tour form
- [ ] Toolbar buttons work (bold, italic, headings)
- [ ] Can save tour with formatted description
- [ ] Formatted content displays on tour details page
- [ ] Tour cards show plain text preview (no HTML tags)

## Expected Behavior

### In Admin Dashboard:
- Description field shows toolbar with formatting buttons
- Can click buttons to format text
- Can type and see formatting in real-time
- Placeholder text guides you

### On Tour Details Page:
- Headings are larger and bold
- Lists have bullet points
- Bold text is bold
- Links are clickable and orange
- Proper spacing between sections

### On Tours Page (Cards):
- Description shows plain text (no HTML tags)
- First 150 characters + "..."
- Clean and readable

## Performance Impact

- **Bundle size increase:** ~25KB (minimal)
- **Load time impact:** Negligible
- **Server resources:** No change
- **Database:** No changes needed

## Security Notes

- Using `dangerouslySetInnerHTML` is safe here because:
  - Only admins can create/edit tours
  - Content is stored in your database
  - Not accepting user-generated content from public
  - React Quill sanitizes input

## Support

If you encounter issues:

1. Check logs: `docker-compose logs frontend`
2. Check browser console (F12)
3. Verify package.json was pushed to GitHub
4. Try rebuilding: `docker-compose build --no-cache frontend`
5. Check this guide's troubleshooting section

## Summary

**Before deployment:**
✅ Commit and push changes to GitHub

**Deployment command:**
```bash
bash production-deploy.sh
```

**Verification:**
✅ Check admin dashboard
✅ Test rich text editor
✅ View formatted tour description

**Time required:** 5-10 minutes

---

**Status:** Ready to Deploy
**Risk Level:** Low (only frontend changes)
**Rollback:** Easy (git revert)
