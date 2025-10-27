# Booking Flow - Issues Fixed

## Problems Identified

1. **Missing Database Columns**: The `bookings` table was missing two columns that the backend code was trying to use:
   - `special_requests` (TEXT)
   - `status_updated_at` (TIMESTAMP)

2. **User/Owner Mismatch**: The logged-in traveller (traveler_id = 2) had NO bookings, which is why the trips page appeared empty.

3. **Owner Authentication**: The host needs to be logged in as the correct owner to see bookings for their properties.

## Fixes Applied

### 1. Added Missing Database Columns

```sql
-- Added special_requests column
ALTER TABLE bookings 
ADD COLUMN special_requests TEXT NULL 
AFTER total_price;

-- Added status_updated_at column  
ALTER TABLE bookings 
ADD COLUMN status_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP 
AFTER special_requests;
```

### 2. Created Test Booking

Created booking ID 13 for the currently logged-in traveller (ID 2):
- **Property**: 28 - Charming House Near SJSU
- **Owner**: Host One (owner_id = 1) - `host1@example.com`
- **Traveller**: Traveler ID 2 - `host1@example.com`
- **Dates**: Oct 28-31, 2025 (3 nights)
- **Total**: $435.00
- **Status**: PENDING
- **Guests**: 3
- **Special Requests**: "fvrfgvre"

## Current Booking State

### Pending Bookings in Database:

| ID | Property | Owner | Traveler ID | Status | Dates |
|----|----------|-------|-------------|--------|-------|
| 13 | Charming House Near SJSU | Host One (ID 1) | 2 | PENDING | Oct 28-31 |
| 11 | City View Loft | Demo Host (ID 13) | 1 | PENDING | Oct 26-27 |

## How to Test

### Test 1: Verify Booking Appears on Traveller Trips Page

1. **Go to Traveller Frontend**: `http://localhost:5173/bookings`
2. **Expected Result**: You should see booking #13 (Charming House Near SJSU, Oct 28-31, $435)
3. **Status**: Should show "Pending Host Approval"

### Test 2: Verify Booking Appears on Host Bookings Page

**IMPORTANT**: You need to be logged in as **Host One** (email: `host1@example.com`)

1. **Go to Host Frontend**: `http://localhost:5174/host/bookings`
2. **Click on "Requests" tab** (should be selected by default)
3. **Expected Result**: You should see booking #13 from traveller "Shashidhar Babu..."
4. **Details**:
   - Property: Charming House Near SJSU
   - Dates: Oct 28-31, 2025
   - Guests: 3
   - Total: $435.00
   - Special Requests: "fvrfgvre"

### Test 3: Create a New Booking from Traveller Side

1. **Go to**: `http://localhost:5173`
2. **Search** for a property (any property owned by Host One - owner_id 1)
3. Properties owned by Host One (ID 1):
   - Property 1: Cozy Loft
   - Property 25: UMBC
   - Property 28: Charming House Near SJSU
4. **Click** on any property → **Select dates** → **Request to Book**
5. **Verify** the booking appears in:
   - Traveller: `http://localhost:5173/bookings`
   - Host: `http://localhost:5174/host/bookings` (Requests tab)

### Test 4: Accept a Booking from Host Side

1. **Go to**: `http://localhost:5174/host/bookings`
2. **Click** "Accept" on booking #13
3. **Verify**:
   - Host: Booking moves to "Upcoming" tab
   - Traveller: Booking status changes to "Confirmed"

## API Endpoints (Working Correctly)

### Traveller Backend (`http://localhost:5001`)

```
POST   /api/bookings                      - Create new booking
GET    /api/bookings/traveler/:id         - Get traveller's bookings
GET    /api/bookings/:id                  - Get single booking details
PUT    /api/bookings/:id/cancel           - Cancel a booking
```

### Host Backend (`http://localhost:4000`)

```
GET    /bookings/incoming?status=PENDING  - Get pending booking requests
GET    /bookings/property/:propertyId     - Get all bookings for a property
POST   /bookings/:id/accept               - Accept a booking request
POST   /bookings/:id/cancel               - Cancel a booking
```

## Database Schema (Now Complete)

```sql
CREATE TABLE bookings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  property_id BIGINT NOT NULL,
  traveler_id BIGINT NULL,
  traveler_name VARCHAR(255) NOT NULL,
  traveler_email VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  guests INT NOT NULL DEFAULT 1,
  total_price DECIMAL(10,2) NULL,
  special_requests TEXT NULL,                    -- ✅ ADDED
  status ENUM('PENDING','ACCEPTED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  status_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- ✅ ADDED
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_property (property_id),
  INDEX idx_traveler (traveler_id),
  INDEX idx_dates (start_date, end_date),
  INDEX idx_status (status),
  
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (traveler_id) REFERENCES users(id) ON DELETE SET NULL
);
```

## Common Issues & Solutions

### Issue: "No pending bookings" on host side

**Solution**: 
- Check which owner you're logged in as
- Bookings only appear for properties YOU own
- Current test booking (ID 13) is for Host One (owner_id = 1)

### Issue: "No bookings found" on traveller trips page

**Solution**:
- Check which traveller you're logged in as
- Current test booking (ID 13) is for traveler_id = 2
- If you're traveler_id = 1, you'll see booking ID 11 instead

### Issue: Booking not appearing immediately

**Solution**:
- **Refresh the page** (hard refresh: Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
- Check browser console for errors
- Verify the backend is running:
  - Host: `http://localhost:4000`
  - Traveller: `http://localhost:5001`

## Files Modified

1. **Database**: Added 2 columns to `bookings` table
2. **Test Data**: Created booking ID 13 for testing

## Status

✅ **FIXED** - Database schema is now complete
✅ **TESTED** - SQL queries verify bookings can be retrieved by both host and traveller
✅ **READY** - Frontend should now display bookings correctly

## Next Steps for User

1. **Refresh** both frontend pages (Cmd+Shift+R)
2. **Verify** booking #13 appears on traveller trips page
3. **Verify** booking #13 appears on host bookings page (Requests tab)
4. **Test** creating a new booking from traveller side
5. **Test** accepting/cancelling bookings from host side

## Important Notes

- **Host Authentication**: You must be logged in as the owner of the property to see its bookings
- **Traveller Authentication**: You can only see your own bookings
- **Real-time Updates**: Use "Refresh" or implement polling for real-time updates
- **Session Management**: Separate sessions for host and traveller (different cookies)

