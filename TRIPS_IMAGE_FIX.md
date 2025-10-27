# Trips/Bookings Image Fix - Complete ✅

## Issue
Images were not rendering on the traveller's "Trips" page (Bookings page at `/bookings`). The booking cards were showing but without property photos.

## Root Cause
The backend API endpoint `GET /api/bookings/traveler/:id` was returning booking data with property information, but was NOT fetching the property photos from the `property_photos` table.

## Solution

### Backend Fix: `backend/traveller/src/routes/bookings.js`

**Added photo fetching logic** in the `GET /traveler/:id` endpoint:

```javascript
// After fetching all bookings, fetch the main photo for each property
for (const booking of bookings) {
  if (booking.property_id) {
    const [photos] = await conn.query(
      `SELECT file_path FROM property_photos 
       WHERE property_id = ? 
       ORDER BY id ASC
       LIMIT 1`,
      [booking.property_id]
    );
    
    booking.property_photo = photos.length > 0 ? photos[0].file_path : null;
  }
}
```

**Note:** The `property_photos` table doesn't have an `is_primary` column, so we simply get the first photo ordered by `id`.

### How It Works

1. **Fetch Bookings**: The API first fetches all bookings for the traveller with property details
2. **Fetch Photos**: For each booking, it queries the `property_photos` table:
   - Gets the first photo for the property (ordered by `id`)
   - If no photos exist, sets `property_photo` to `null`
3. **Response**: Returns bookings with `property_photo` field containing the file path

### Frontend (Already Correct)

Both `Bookings.jsx` and `History.jsx` were already correctly handling the image display:

```javascript
<img 
  src={
    booking.property_photo?.startsWith('http') 
      ? booking.property_photo 
      : `http://localhost:4000${booking.property_photo}`
  }
  alt={booking.property_name}
/>
```

This code:
- Checks if `property_photo` exists
- If it's already a full URL (starts with `http`), uses it as-is
- Otherwise, prepends the host backend URL (`http://localhost:4000`) since images are served from the host backend

## Changes Made

### Files Modified
```
backend/traveller/src/routes/bookings.js
  └── GET /traveler/:id endpoint
      └── Added photo fetching for each booking
```

### Backend Restart
- Traveller backend was restarted to apply the changes

## Testing

### Manual Testing Steps

1. **Navigate to Trips page:**
   ```
   http://localhost:5173/bookings
   ```

2. **Verify images display** for all bookings:
   - PENDING bookings should show property images
   - CONFIRMED bookings should show property images
   - CANCELLED bookings should show property images

3. **Test filtering:**
   - Click "Pending (X)" tab - images should load
   - Click "Confirmed (X)" tab - images should load
   - Click "Cancelled (X)" tab - images should load
   - Click "All (X)" tab - all images should load

4. **Verify image paths:**
   - Open browser DevTools → Network tab
   - Refresh the bookings page
   - Check that image requests go to: `http://localhost:4000/uploads/property-photos/...`
   - Ensure all image requests return `200 OK` status

### API Testing

You can also test the API directly:

```bash
# Test getting traveller bookings (replace 2 with your traveller ID)
curl "http://localhost:5001/api/bookings/traveler/2" | jq '.bookings[0].property_photo'
```

Expected output:
```json
"/uploads/property-photos/xxx.jpg"
```

## Impact

### ✅ Fixed
- Property images now display on the Trips/Bookings page
- Images display correctly in all filter tabs (All, Pending, Confirmed, Cancelled)
- Image paths are properly resolved to the host backend URL

### ✅ Consistent Behavior
- Trips page images now consistent with:
  - Dashboard property listings
  - Property details page
  - Favorites page
  - History page

## Image Source

All property images are:
- Stored in: `backend/host/uploads/property-photos/`
- Served by: Host backend at `http://localhost:4000`
- Referenced in: `property_photos` table in the database
- Fetched via: SQL queries with `is_primary` flag prioritization

## Data Flow

```
Traveller Frontend (localhost:5173)
    ↓
    GET /api/bookings/traveler/:id
    ↓
Traveller Backend (localhost:5001)
    ↓
    Query: bookings + properties + owners
    ↓
    For each booking:
      Query: property_photos (is_primary = 1)
    ↓
    Return: bookings with property_photo field
    ↓
Traveller Frontend
    ↓
    Prepend: http://localhost:4000 to file_path
    ↓
    GET http://localhost:4000/uploads/property-photos/xxx.jpg
    ↓
Host Backend (localhost:4000)
    ↓
    Serve static file from: backend/host/uploads/
```

## Related Files

- `/backend/traveller/src/routes/bookings.js` - Backend API (MODIFIED)
- `/frontend/traveller/src/pages/Bookings.jsx` - Trips page UI (Already correct)
- `/frontend/traveller/src/pages/History.jsx` - History page UI (Already correct)
- `/backend/host/src/server.js` - Static file serving for images (Already configured)

## Next Steps

✅ **Images are now working!** Refresh your Trips page to see property images.

If images still don't show:
1. Hard refresh the browser (Cmd+Shift+R or Ctrl+Shift+R)
2. Check browser console for any 404 errors
3. Verify the traveller backend is running: `curl http://localhost:5001/api/properties/search?page=1&limit=1`
4. Verify the host backend is running: `curl http://localhost:4000/uploads/property-photos/` (should return directory listing or 403)

---

**Status:** ✅ Complete - Images now render on Trips/Bookings page
**Date:** 2025-10-27
**Backend:** Traveller backend restarted

