# 🧪 Complete Booking Flow Testing Instructions

## ✅ Issues Fixed

1. **Database Schema**: Added missing `special_requests` and `status_updated_at` columns
2. **Test Data**: Created booking #13 for current logged-in traveller (ID 2)

## 📋 STEP-BY-STEP TESTING

### Step 1: Test Traveller Trips Page

1. **Open Traveller Frontend**: http://localhost:5173/bookings
2. **Hard Refresh**: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
3. **Expected Result**: ✅ You should see booking for "Charming House Near SJSU"
   - Dates: Oct 28-31, 2025
   - Total: $435.00
   - Status: "Pending Host Approval"
   - Property: Charming House Near SJSU
   - Guests: 3

**If you DON'T see it**:
- Check browser console for errors (F12 → Console tab)
- Verify you're logged in as the correct traveller
- Check the Network tab (F12 → Network) - look for `/api/bookings/traveler/2`

---

### Step 2: Test Host Bookings Page

**IMPORTANT**: You MUST be logged in as **Host One** (email: `host1@example.com`)

1. **Open Host Frontend**: http://localhost:5174/host/bookings
2. **Hard Refresh**: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
3. **Click "Requests" tab**
4. **Expected Result**: ✅ You should see booking request from traveller
   - Property: Charming House Near SJSU
   - Guest: Shashidhar Babu Pasupuleti Venkata Durga  
   - Dates: Oct 28-31, 2025
   - Guests: 3
   - Total: $435.00
   - Special Requests: "fvrfgvre"

**If you DON'T see it**:
- **Check which owner you're logged in as**:
  - Click on your profile icon (top right)
  - You should be logged in as "Host One"
- The test booking is for properties owned by Host One (owner_id = 1)
- If you're logged in as a different owner, you won't see this booking

---

### Step 3: Create a NEW Booking (End-to-End Test)

#### 3A. On Traveller Side:

1. Go to: http://localhost:5173
2. Click on **any property** (e.g., "UMBC", "Cozy Loft", or any San Jose property)
3. **Select dates** (e.g., Nov 1-3, 2025)
4. **Select guests** (e.g., 2 guests)
5. **Add special requests** (optional): "Test booking request"
6. Click **"Request to Book"**
7. **Verify**: You should see a success message

#### 3B. Check Traveller Trips:

1. Go to: http://localhost:5173/bookings
2. **Refresh** the page
3. **Expected**: Your new booking should appear at the top

#### 3C. Check Host Bookings:

1. Go to: http://localhost:5174/host/bookings
2. **Refresh** the page
3. **Click "Requests" tab**
4. **Expected**: Your new booking request should appear

---

### Step 4: Accept/Reject Booking (Host Side)

1. On http://localhost:5174/host/bookings (Requests tab)
2. Find booking #13 or your new booking
3. Click **"Accept"** button
4. **Expected**:
   - Booking should move to "Upcoming" tab
   - Status should change to "ACCEPTED"

#### Verify on Traveller Side:

1. Go to: http://localhost:5173/bookings
2. **Refresh** the page
3. Click **"Confirmed"** tab
4. **Expected**: The accepted booking should now show as "Confirmed"

---

## 🔍 Debugging Checklist

### If Traveller Trips Page is Empty:

- [ ] Check browser console (F12) for errors
- [ ] Verify traveller backend is running: http://localhost:5001
- [ ] Check Network tab: Look for `/api/bookings/traveler/2` 
- [ ] Check the API response - should return JSON with bookings array
- [ ] Run SQL query to verify booking exists:
  ```sql
  SELECT * FROM bookings WHERE traveler_id = 2;
  ```

### If Host Bookings Page is Empty:

- [ ] **VERIFY** you're logged in as Host One (host1@example.com)
- [ ] Check browser console (F12) for errors
- [ ] Verify host backend is running: http://localhost:4000
- [ ] Check Network tab: Look for `/bookings/incoming?status=PENDING`
- [ ] Check which owner you're logged in as (look at session/profile)
- [ ] Run SQL query:
  ```sql
  SELECT b.*, p.owner_id, o.name as owner_name 
  FROM bookings b 
  JOIN properties p ON p.id = b.property_id 
  JOIN owners o ON o.id = p.owner_id 
  WHERE b.status = 'PENDING' 
  ORDER BY b.created_at DESC;
  ```

### If Creating New Booking Fails:

- [ ] Check browser console for error messages
- [ ] Open Network tab (F12) and look for the POST request to `/api/bookings`
- [ ] Check the response - should be 201 Created with booking details
- [ ] Common errors:
  - 401 Unauthorized: Not logged in
  - 400 Bad Request: Invalid dates or missing required fields
  - 409 Conflict: Property not available for selected dates

---

## 📊 Database Verification Queries

### Check All Bookings:
```sql
SELECT 
  b.id,
  b.property_id,
  p.name AS property,
  p.owner_id,
  o.name AS owner,
  b.traveler_id,
  b.traveler_name,
  b.status,
  b.start_date,
  b.end_date,
  b.total_price
FROM bookings b
JOIN properties p ON p.id = b.property_id
JOIN owners o ON o.id = p.owner_id
WHERE b.status = 'PENDING'
ORDER BY b.created_at DESC;
```

### Check Your Traveller ID:
```sql
SELECT id, name, email, role 
FROM users 
WHERE email = 'YOUR_EMAIL@example.com';
```

### Check Your Owner ID:
```sql
SELECT id, name, email 
FROM owners 
WHERE email = 'YOUR_EMAIL@example.com';
```

---

## 🚀 Expected Results Summary

| Action | Expected Result |
|--------|----------------|
| Traveller creates booking | ✅ Booking created with PENDING status |
| Traveller views trips | ✅ Sees booking in "Pending" tab |
| Host views bookings | ✅ Sees booking in "Requests" tab |
| Host accepts booking | ✅ Booking moves to "Upcoming" tab |
| Traveller checks trips | ✅ Booking shows as "Confirmed" |
| Host rejects booking | ✅ Booking moves to "Cancelled" tab |
| Traveller checks trips | ✅ Booking shows as "Cancelled" |

---

## 📞 Still Having Issues?

1. **Check all backends are running**:
   - Host backend: http://localhost:4000
   - Traveller backend: http://localhost:5001

2. **Check frontend ports**:
   - Host frontend: http://localhost:5174
   - Traveller frontend: http://localhost:5173

3. **Clear browser cache**:
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - Or clear all cookies and reload

4. **Check database connection**:
   ```bash
   mysql -u root -pVirendersehwag@2001 airbnb_core -e "SELECT 1;"
   ```

5. **Check backend logs**:
   ```bash
   tail -f /tmp/traveller-backend-new.log
   ```

---

## ✨ Testing Completed Successfully When:

- [ ] Traveller can see their bookings in trips page
- [ ] Host can see incoming booking requests
- [ ] New bookings created from traveller side appear on host side
- [ ] Host can accept/reject bookings
- [ ] Status changes reflect on both sides
- [ ] No console errors on either frontend
- [ ] API calls return 200 OK responses

---

**Last Updated**: October 27, 2025
**Database**: airbnb_core
**Test Booking ID**: 13

