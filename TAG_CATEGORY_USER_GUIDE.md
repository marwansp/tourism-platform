# Tag Category User Guide

## How to Create Tags with Categories

### Step 1: Access Tag Management
1. Go to **Admin Dashboard** (http://localhost:3000/admin)
2. Click on the **Settings** tab in the top navigation
3. Scroll down to the **"Global Tag Management"** section at the bottom

### Step 2: View Existing Tags
You should see tags organized in two sections:

#### ✅ What's Included (Green Section)
- Tags that represent services/items included in the tour
- Examples: Meals, Transport, Guide, Accommodation, Entrance Fees
- These appear with a green background when assigned to tours

#### ❌ What's NOT Included (Red Section)
- Tags that represent things tourists need to arrange separately
- Examples: Flights, Travel Insurance, Personal Expenses, Tips
- These appear with a red background when assigned to tours

### Step 3: Create a New Tag

1. Click the **"New Tag"** button (top right of Global Tag Management section)

2. Fill in the form with 3 fields:
   - **Tag Name**: e.g., "Airport Transfer"
   - **Icon (emoji)**: e.g., "🚕"
   - **Category**: Select from dropdown:
     - ✅ What's Included
     - ❌ What's NOT Included

3. Click **"Save"** button

### Step 4: Edit Existing Tags

1. Find the tag you want to edit
2. Click the **Edit** icon (pencil) next to the tag
3. You can now edit:
   - Icon (emoji)
   - Tag name
   - Category (dropdown to switch between Included/NOT Included)
4. Click the **Save** icon (checkmark) to save changes
5. Click the **X** icon to cancel

### Step 5: Assign Tags to Tours

1. In the Settings tab, use the **"Select Tour to Manage"** dropdown at the top
2. Choose a tour from the list
3. In the **Tag Manager** section (right side), you'll see:
   - All available tags grouped by category
   - Tags already assigned to this tour are highlighted
4. Click **"Add"** to assign a tag to the tour
5. Click **"Remove"** to unassign a tag from the tour

## Visual Guide

### Tag Display in Global Management

```
┌─────────────────────────────────────────┐
│ Global Tag Management          [New Tag]│
├─────────────────────────────────────────┤
│                                         │
│ ✅ What's Included                      │
│ ┌─────────────────────────────────────┐ │
│ │ 🍽️  Meals              [Edit] [Del] │ │
│ │ 🚗  Transport           [Edit] [Del] │ │
│ │ 👨‍🏫  Guide              [Edit] [Del] │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ❌ What's NOT Included                  │
│ ┌─────────────────────────────────────┐ │
│ │ ✈️  Flights            [Edit] [Del] │ │
│ │ 🛡️  Travel Insurance   [Edit] [Del] │ │
│ │ 💰  Personal Expenses  [Edit] [Del] │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### New Tag Form

```
┌─────────────────────────────────────────┐
│ New Tag                                 │
├─────────────────────────────────────────┤
│ Tag Name:     [Airport Transfer      ] │
│ Icon (emoji): [🚕                    ] │
│ Category:     [✅ What's Included ▼  ] │
│                                         │
│ [💾 Save]  [✖ Cancel]                  │
└─────────────────────────────────────────┘
```

## Common Use Cases

### Creating "What's Included" Tags
Perfect for:
- 🍽️ Meals (Breakfast, Lunch, Dinner)
- 🚗 Transport (Private car, Bus, Train)
- 👨‍🏫 Guide (English-speaking, Local expert)
- 🏨 Accommodation (Hotel, Riad, Camp)
- 🎫 Entrance Fees (Museums, Parks, Sites)
- 📸 Photography (Photo stops, Professional photos)
- 🎒 Equipment (Hiking gear, Camping equipment)

### Creating "What's NOT Included" Tags
Perfect for:
- ✈️ Flights (International, Domestic)
- 🛡️ Travel Insurance
- 💰 Personal Expenses (Shopping, Souvenirs)
- 💵 Tips (Guide tips, Driver tips)
- 🍷 Alcoholic Beverages
- 🎟️ Optional Activities
- 💳 Visa Fees

## Troubleshooting

### I don't see the category sections
**Solution**: Refresh your browser with Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

### Tags are not grouped by category
**Solution**: 
1. Make sure you've refreshed the browser
2. Check that tags have a category assigned (edit them if needed)
3. Old tags created before the update may need to be edited to add a category

### Can't change a tag's category
**Solution**: 
1. Click the Edit icon (pencil) next to the tag
2. You'll see a dropdown to change the category
3. Click Save (checkmark icon) to apply changes

## Benefits

### For Tour Operators
- Clear organization of what's provided vs. what's not
- Easy to manage and update across all tours
- Consistent messaging to customers

### For Customers
- Immediately understand what's included in the price
- Know what additional costs to expect
- Make informed booking decisions
- No surprises after booking

## Tips

1. **Be Specific**: Instead of just "Meals", use "Breakfast Included", "Lunch Included", etc.
2. **Use Emojis**: They make tags more visual and easier to scan
3. **Be Honest**: Clearly mark what's NOT included to avoid customer disappointment
4. **Keep Updated**: Review tags regularly and update as your offerings change
5. **Consistency**: Use the same tags across similar tours for consistency

## Need Help?

If you're still having trouble seeing the tag categories:
1. Clear your browser cache
2. Hard refresh the page (Ctrl+F5)
3. Check the browser console for any errors (F12)
4. Verify the backend migration was applied successfully
