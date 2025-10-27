# Favorites 500 Error - FIXED ✅

## Issue
The Favorites page was showing a 500 Internal Server Error:
```
GET http://localhost:5001/api/favorites/traveler/2?page=1&limit=20 500 (Internal Server Error)
API error: 500 /api/favorites/traveler/2 Request failed with status code 500
Error: Unknown column 'p.price' in 'field list'
```

## Root Cause
The `favorites.js` backend route had **two problems**:

1. Using **old column names** from before the database schema was unified
2. Using `conn.execute()` instead of `conn.query()` which causes "Incorrect arguments to mysqld_stmt_execute" errors with complex queries

### Wrong Column Names:
1. ❌ `p.price` → Should be `p.price_per_night`
2. ❌ `p.type` → Should be `p.property_type`
3. ❌ `p.amenities_json` → Should be `p.amenities`
4. ❌ `p.images_json` → Doesn't exist (images are in `property_photos` table)
5. ❌ `LEFT JOIN users u WHERE u.role = 'HOST'` → Should join with `owners` table

## Solution

### File: `backend/traveller/src/routes/favorites.js`

**Updated the SQL query** in the `GET /traveler/:id` endpoint:

#### Before (Broken):
```sql
SELECT 
  f.id as favorite_id,
  f.created_at as favorited_at,
  p.id as property_id,
  p.name as property_name,
  p.description,
  p.location,
  p.price as price_per_night,              -- ❌ Wrong column
  p.bedrooms,
  p.bathrooms,
  p.max_guests,
  p.type as property_type,                 -- ❌ Wrong column
  p.amenities_json as amenities,           -- ❌ Wrong column
  u.name as owner_name,                    -- ❌ Wrong table
  JSON_EXTRACT(p.images_json, '$[0]') as main_photo  -- ❌ Wrong column
FROM favorites f
LEFT JOIN properties p ON f.property_id = p.id
LEFT JOIN users u ON p.owner_id = u.id AND u.role = 'HOST'  -- ❌ Wrong table
WHERE f.traveler_id = ?
ORDER BY f.created_at DESC
LIMIT ? OFFSET ?
```

#### After (Fixed):
```javascript
// Changed from conn.execute() to conn.query() ✅
const [favorites] = await conn.query(`
  SELECT 
    f.id as favorite_id,
    f.created_at as favorited_at,
    p.id as property_id,
    p.name as property_name,
    p.description,
    p.location,
    p.price_per_night,              -- ✅ Correct column
    p.bedrooms,
    p.bathrooms,
    p.max_guests,
    p.property_type,                -- ✅ Correct column
    p.amenities,                    -- ✅ Correct column
    o.name as owner_name            -- ✅ Correct table
  FROM favorites f
  LEFT JOIN properties p ON f.property_id = p.id
  LEFT JOIN owners o ON p.owner_id = o.id  -- ✅ Correct join
  WHERE f.traveler_id = ?
  ORDER BY f.created_at DESC
  LIMIT ? OFFSET ?
`, [travelerId, parseInt(limit), offset]);
```

### Added Photo Fetching Logic:
```javascript
// Fetch the main photo for each favorite
for (const favorite of favorites) {
  if (favorite.property_id) {
    const [photos] = await conn.query(
      `SELECT file_path FROM property_photos 
       WHERE property_id = ? 
       ORDER BY id ASC
       LIMIT 1`,
      [favorite.property_id]
    );
    
    favorite.main_photo = photos.length > 0 ? photos[0].file_path : null;
  }
}
```

## Changes Made

### Files Modified
```
backend/traveller/src/routes/favorites.js
  └── GET /traveler/:id endpoint
      ├── Fixed: conn.execute() → conn.query() (critical!)
      ├── Fixed: p.price → p.price_per_night
      ├── Fixed: p.type → p.property_type
      ├── Fixed: p.amenities_json → p.amenities
      ├── Fixed: JOIN users → JOIN owners
      └── Added: Photo fetching from property_photos table
```

### Backend Restart
- Traveller backend was restarted to apply the changes
- Running on `http://localhost:5001`

## Testing

### 1. Navigate to Favorites Page
Go to: `http://localhost:5173/favorites`

### 2. Check for Errors
Open browser console (F12):
- ✅ No 500 errors
- ✅ No "Unknown column" errors
- ✅ Favorites load successfully

### 3. Test Favorites Functionality

**Add a favorite:**
1. Go to home page or dashboard
2. Click the heart icon on any property
3. Go to Favorites page
4. Verify the property appears with:
   - Property image
   - Property name
   - Location
   - Price per night
   - Property type
   - Bedrooms/bathrooms/guests
   - Owner name

**Remove a favorite:**
1. On Favorites page, click the heart icon (or remove button)
2. Verify the property is removed
3. Refresh the page
4. Verify the property is still removed (persisted to database)

### 4. Verify Database
```bash
# Check favorites in the database
mysql -u root -pVirendersehwag@2001 airbnb_core -e "
  SELECT f.id, f.traveler_id, f.property_id, p.name as property_name 
  FROM favorites f 
  LEFT JOIN properties p ON f.property_id = p.id 
  WHERE f.traveler_id = 2;
"
```

### 5. Test API Directly
```bash
# Test the favorites API endpoint (replace 2 with your traveler ID)
curl "http://localhost:5001/api/favorites/traveler/2?page=1&limit=20"
```

Expected response:
```json
{
  "favorites": [
    {
      "favorite_id": 1,
      "favorited_at": "2025-10-27T...",
      "property_id": 31,
      "property_name": "Test 2",
      "description": "...",
      "location": "San Jose, California",
      "price_per_night": "200.00",
      "bedrooms": 1,
      "bathrooms": 1,
      "max_guests": 2,
      "property_type": "House",
      "amenities": ["Wifi", "TV", ...],
      "owner_name": "Host One",
      "main_photo": "/uploads/property-photos/xxx.png"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

## Impact

### ✅ Before This Fix
- Favorites page showed 500 error
- Could not load any favorites
- Database queries were failing
- Old schema column names causing SQL errors

### ✅ After This Fix
- Favorites page loads successfully
- All favorites display with correct data
- Property images display correctly
- Owner information shows correctly
- Data matches the unified database schema

## Database Schema Alignment

This fix ensures the traveller backend's favorites route uses the **unified database schema**:

| Feature | Old (Broken) | New (Fixed) |
|---------|-------------|-------------|
| Price column | `p.price` | `p.price_per_night` |
| Type column | `p.type` | `p.property_type` |
| Amenities column | `p.amenities_json` | `p.amenities` |
| Images source | `p.images_json` | `property_photos` table |
| Owner source | `users` table with role filter | `owners` table |

## Related Components

All traveller backend routes now use the unified schema:
- ✅ `properties.js` - Uses correct schema
- ✅ `bookings.js` - Uses correct schema
- ✅ `favorites.js` - Uses correct schema (FIXED)

## Data Flow

```
User clicks Favorites tab
    ↓
Frontend: GET /api/favorites/traveler/:id
    ↓
Backend: favorites.js route
    ↓
SQL Query:
  - JOIN properties (with price_per_night, property_type, amenities)
  - JOIN owners (for owner_name)
  - Query property_photos (for main_photo)
    ↓
MySQL Database (airbnb_core)
    ↓
Response: favorites array with complete data
    ↓
Frontend: Display favorites page
```

---

**Status:** ✅ FIXED - Favorites page now works correctly
**Date:** 2025-10-27
**Error:** Unknown column 'p.price' - RESOLVED
**Backend:** Traveller backend restarted

