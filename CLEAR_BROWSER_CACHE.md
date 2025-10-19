# Clear Browser Cache - Translation Not Showing

## The Issue
The translations are deployed but your browser is showing the old cached version.

## Quick Fix - Hard Refresh

### Windows/Linux:
- **Chrome/Edge:** Press `Ctrl + Shift + R` or `Ctrl + F5`
- **Firefox:** Press `Ctrl + Shift + R` or `Ctrl + F5`

### Mac:
- **Chrome/Edge:** Press `Cmd + Shift + R`
- **Firefox:** Press `Cmd + Shift + R`
- **Safari:** Press `Cmd + Option + R`

## Alternative: Clear Cache Manually

### Chrome/Edge:
1. Press `F12` to open DevTools
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Firefox:
1. Press `Ctrl + Shift + Delete`
2. Select "Cached Web Content"
3. Click "Clear Now"
4. Refresh the page

## Verify It's Working

After clearing cache:

1. **Visit:** http://localhost:3000/tours/d47953be-f1be-45a9-8367-475b9c6eb48a

2. **Check English (default):**
   - Should see "Ready to Book?" in the right sidebar
   - Should see "Questions?" below it

3. **Switch to French (click 🇫🇷 in navbar):**
   - Should see "Prêt à Réserver ?" 
   - Should see "Des Questions ?"

4. **If still showing English:**
   - Open DevTools (F12)
   - Go to Network tab
   - Check "Disable cache" checkbox
   - Refresh the page

## Check if Translation Files Are Loaded

1. Open DevTools (F12)
2. Go to Console tab
3. Type: `localStorage.getItem('i18nextLng')`
4. Should show "en" or "fr"

If it shows "en-US" or something else, the language switcher might not be working correctly.

## Force Language in URL

You can also test by adding the language to localStorage:

1. Open DevTools Console (F12)
2. Type: `localStorage.setItem('i18nextLng', 'fr')`
3. Refresh the page
4. Should now show French

To switch back to English:
```javascript
localStorage.setItem('i18nextLng', 'en')
```
Then refresh.

## Still Not Working?

If after all this it's still showing English, let me know and I'll check:
1. If the translation files are correctly built into the container
2. If there's a syntax error in the JSON files
3. If the i18n configuration is correct
