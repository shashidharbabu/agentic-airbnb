# Special Requests & Total Price - Added to Host Bookings Page

## Problem
When travellers made booking requests with special requests, these requests were saved to the database but were NOT displayed on the host's bookings page. The total price was also missing.

## Solution Implemented

### 1. Backend Changes (`backend/host/src/routes/bookings.js`)

**Updated `serializeBooking` function** to include:
- ✅ `totalPrice` - The total amount for the booking
- ✅ `specialRequests` - Any special requests from the traveller

```javascript
const serializeBooking = (row) => ({
  id: row.id,
  status: row.status,
  startDate: row.start_date,
  endDate: row.end_date,
  guests: row.guests,
  createdAt: row.created_at,
  travelerId: row.traveler_id,
  totalPrice: row.total_price,           // ✅ ADDED
  specialRequests: row.special_requests, // ✅ ADDED
  traveler: {
    name: row.traveler_account_name || row.traveler_name,
    email: row.traveler_account_email || row.traveler_email
  },
  property: {
    id: row.property_id,
    name: row.property_name || 'Untitled listing',
    location: buildLocationLabel(row),
    city: row.property_city,
    state: row.property_state,
    country: row.property_country,
    address: row.property_address
  }
});
```

### 2. Frontend Changes (`frontend/host/src/pages/Bookings.jsx`)

**Added two new display sections** to the booking card:

#### A. Total Price Section
Shows the total booking amount and calculates the per-night rate:
```javascript
{booking.totalPrice && (
  <div className="booking-card__row">
    <span className="booking-card__label">Total</span>
    <div className="booking-card__value">
      <strong>${Number(booking.totalPrice).toFixed(2)}</strong>
      <span>{nights ? `$${(Number(booking.totalPrice) / nights).toFixed(2)} per night` : 'Total amount'}</span>
    </div>
  </div>
)}
```

#### B. Special Requests Section
Displays traveller's special requests in a highlighted box:
```javascript
{booking.specialRequests && (
  <div className="booking-card__row booking-card__row--full">
    <span className="booking-card__label">Special Requests</span>
    <div className="booking-card__value">
      <p style={{ margin: 0, fontStyle: 'italic', color: '#484848' }}>
        {booking.specialRequests}
      </p>
    </div>
  </div>
)}
```

### 3. CSS Styling (`frontend/host/src/styles/Bookings.css`)

**Added full-width styling** for special requests display:
```css
.booking-card__row--full {
  grid-column: 1 / -1;
  background: #f7f7f7;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #ebebeb;
}
```

## What the Host Now Sees

### Booking Card Display (Enhanced)
```
┌─────────────────────────────────────────────────────┐
│  Charming House Near SJSU             [PENDING]     │
│  San Jose, California                                │
├─────────────────────────────────────────────────────┤
│  GUEST                      STAY                     │
│  Shashidhar Babu...         Oct 28 → Oct 31         │
│  host1@example.com          3 nights                 │
│                                                       │
│  GUESTS                     REQUESTED                │
│  3 guests                   Oct 26, 2025             │
│                             Submitted                │
│                                                       │
│  TOTAL                                               │ ✅ NEW
│  $435.00                                             │
│  $145.00 per night                                   │
│                                                       │
│  ┌───────────────────────────────────────────────┐  │ ✅ NEW
│  │ SPECIAL REQUESTS                              │  │
│  │ fvrfgvre                                      │  │
│  └───────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────┤
│  [Accept booking]  [Cancel request]                 │
└─────────────────────────────────────────────────────┘
```

## Features

### Conditional Display
- ✅ **Total Price**: Only shown if `totalPrice` exists in the booking data
- ✅ **Special Requests**: Only shown if `specialRequests` exists and is not empty
- ✅ **Per-Night Rate**: Automatically calculated from total price ÷ number of nights

### Visual Design
- **Total Price**: Standard row format with label and value
- **Special Requests**: Full-width highlighted box with:
  - Light gray background (`#f7f7f7`)
  - Subtle border (`#ebebeb`)
  - Rounded corners (12px)
  - Italic text for emphasis
  - Proper padding (16px)

## Testing

### To Verify the Changes:

1. **Hard Refresh Host Bookings Page**: 
   - Go to: `http://localhost:5174/host/bookings`
   - Press: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

2. **Check Booking #13**:
   - Should see: **Total: $435.00** ($145.00 per night)
   - Should see: **Special Requests: "fvrfgvre"** in a gray box

3. **Create a New Booking**:
   - From traveller side, book a property
   - Add special requests: "Need early check-in"
   - Submit the booking
   - Check host side - should see the special request

## Database Columns Used

```sql
-- These columns are now displayed on host bookings page:
bookings.total_price         -- DECIMAL(10,2) - Total amount
bookings.special_requests    -- TEXT - Traveller's special requests
```

## Files Modified

1. **Backend**: `/backend/host/src/routes/bookings.js`
   - Updated `serializeBooking()` function

2. **Frontend**: `/frontend/host/src/pages/Bookings.jsx`
   - Added total price display
   - Added special requests display

3. **CSS**: `/frontend/host/src/styles/Bookings.css`
   - Added `.booking-card__row--full` styling

## Status

✅ **COMPLETED** - Special requests and total price now display on host bookings page
✅ **TESTED** - Backend API returns the new fields
✅ **STYLED** - Professional Airbnb-like design
✅ **RESPONSIVE** - Works on all screen sizes

## Result

Hosts can now:
- ✅ See the **total booking amount**
- ✅ View the **per-night rate**
- ✅ Read traveller **special requests** before accepting
- ✅ Make informed decisions based on complete booking information

---

**Last Updated**: October 27, 2025
**Booking #13** used for testing

