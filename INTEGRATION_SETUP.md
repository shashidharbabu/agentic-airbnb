# Host-Traveller Integration Setup Guide

## ✅ Integration Complete!

The host and traveller systems have been successfully integrated. Follow these steps to get everything running.

---

## 📋 What Was Integrated

1. **Database Schema Unified** - Both systems now share the same schema
2. **Backend APIs Updated** - Traveller backend now works with host schema
3. **Frontend Fixed** - Removed localStorage fallbacks, using database APIs
4. **Real-time Updates** - Host bookings page polls every 30 seconds
5. **Booking Flow** - Complete end-to-end: Traveller books → Host approves → Status updates

---

## 🚀 Setup Instructions

### Step 1: Create Environment Files

Since `.env` files are gitignored, you need to create them manually. Copy the content below into each file:

#### **1. Backend Host** (`backend/host/.env`)

```env
# Host Backend Configuration
PORT=4000
NODE_ENV=development

# Database (Shared with Traveller Backend)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=airbnb_core

# Session
SESSION_SECRET=host-secret-key-change-in-production
SESSION_COOKIE_NAME=airbnb_host.sid

# CORS
WEB_ORIGIN=http://localhost:5173

# Uploads
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

#### **2. Backend Traveller** (`backend/traveller/.env`)

```env
# Traveller Backend Configuration
PORT=5001
NODE_ENV=development

# Database (Shared with Host Backend)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=airbnb_core

# Session
SESSION_SECRET=traveller-secret-key-change-in-production

# CORS
WEB_ORIGIN=http://localhost:5174

# Uploads
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

#### **3. Frontend Host** (`frontend/host/.env`)

```env
# Host Frontend Configuration
VITE_HOST_API=http://localhost:4000
VITE_AGENT_API=http://localhost:8000
```

#### **4. Frontend Traveller** (`frontend/traveller/.env`)

```env
# Traveller Frontend Configuration
VITE_API_URL=http://localhost:5001
VITE_AGENT_API_URL=http://localhost:8000
```

---

### Step 2: Run Database Migration

**Important:** Run this SQL migration to unify the schemas:

```bash
cd backend/host
mysql -u root -p airbnb_core < sql/unify_schemas.sql
```

This migration will:
- Standardize all ID types to BIGINT
- Add missing columns (total_price, special_requests)
- Ensure foreign key constraints are in place
- Make both systems compatible

---

### Step 3: Start All Services

**Terminal 1 - Host Backend:**
```bash
cd backend/host
npm install  # if needed
npm run dev
```
→ Runs on http://localhost:4000

**Terminal 2 - Traveller Backend:**
```bash
cd backend/traveller
npm install  # if needed
npm run dev
```
→ Runs on http://localhost:5001

**Terminal 3 - Host Frontend:**
```bash
cd frontend/host
npm install  # if needed
npm run dev
```
→ Runs on http://localhost:5173

**Terminal 4 - Traveller Frontend:**
```bash
cd frontend/traveller
npm install  # if needed
npm run dev
```
→ Runs on http://localhost:5174

---

## 🧪 Testing the Integration

### End-to-End Test Flow

1. **Host Creates Property**
   - Go to http://localhost:5173
   - Login as a host
   - Create a new property listing

2. **Traveller Searches Properties**
   - Go to http://localhost:5174
   - Sign up / Login as a traveller
   - Search for properties
   - Should see the host's property

3. **Traveller Books Property**
   - Click on the property
   - Select dates and number of guests
   - Click "Book Now"
   - Booking status: PENDING

4. **Host Receives Booking**
   - Go back to host dashboard (http://localhost:5173)
   - Navigate to "Bookings" page
   - Should see the traveller's booking request
   - Traveller name and email should be visible

5. **Host Accepts Booking**
   - Click "Accept" on the booking
   - Booking status changes to ACCEPTED

6. **Traveller Sees Accepted Booking**
   - Go back to traveller app (http://localhost:5174)
   - Navigate to "My Bookings"
   - Refresh the page
   - Should see booking status changed to "Confirmed"

---

## 🔄 Key Integration Points

### Database Tables

| Table | Purpose | Used By |
|-------|---------|---------|
| `owners` | Host authentication | Host Backend |
| `users` | Traveller authentication | Traveller Backend |
| `properties` | Property listings | Both (Host creates, Traveller reads) |
| `bookings` | Booking requests | Both (Traveller creates, Host manages) |
| `property_photos` | Property images | Both |
| `favorites` | Traveller favorites | Traveller Backend |
| `traveler_profiles` | Traveller profiles | Traveller Backend |

### API Endpoints

**Host Backend (Port 4000):**
- `GET /bookings/incoming?status=PENDING` - Get booking requests
- `POST /bookings/:id/accept` - Accept a booking
- `POST /bookings/:id/cancel` - Cancel a booking
- `GET /properties` - Get host's properties
- `POST /properties` - Create new property

**Traveller Backend (Port 5001):**
- `GET /api/properties/search` - Search properties
- `GET /api/properties/:id` - Get property details
- `POST /api/bookings` - Create booking
- `GET /api/bookings/traveler/:id` - Get traveller's bookings
- `PUT /api/bookings/:id/cancel` - Cancel booking

---

## 🔧 What Was Changed

### Backend Updates

1. **`backend/traveller/src/routes/bookings.js`**
   - Added traveler name/email to booking INSERT
   - Updated to use `price_per_night` instead of `price`
   - Changed to JOIN with `owners` table instead of `users`

2. **`backend/traveller/src/routes/properties.js`**
   - Updated column names to match host schema
   - Changed `price` → `price_per_night`
   - Changed `type` → `property_type`
   - Updated to fetch from `property_photos` table
   - Changed to JOIN with `owners` table

### Frontend Updates

1. **`frontend/traveller/src/pages/Bookings.jsx`**
   - Removed localStorage fallback
   - Now uses database API only
   - Cleaner error handling

2. **`frontend/host/src/pages/Bookings.jsx`**
   - Added 30-second polling for real-time updates
   - Hosts now see new bookings without manual refresh

---

## ⚠️ Important Notes

1. **Separate Authentication:**
   - Hosts use `owners` table
   - Travellers use `users` table
   - Session cookies are different (no conflict)

2. **Shared Database:**
   - Both backends connect to the same `airbnb_core` database
   - Make sure DB credentials match in both `.env` files

3. **Port Allocation:**
   - Host Backend: 4000
   - Traveller Backend: 5001
   - Host Frontend: 5173
   - Traveller Frontend: 5174

4. **Real-time Updates:**
   - Host bookings page polls every 30 seconds
   - For instant updates, consider adding WebSockets later

---

## 🐛 Troubleshooting

### Issue: "Property not found"
**Solution:** Make sure the database migration ran successfully. Check that `price_per_night` column exists in `properties` table.

### Issue: "Traveler not found"
**Solution:** The traveller must be logged in with a valid user ID. Check session cookies.

### Issue: Bookings not showing for host
**Solution:** 
- Check that `traveler_id`, `traveler_name`, and `traveler_email` are being saved in bookings
- Verify the property's `owner_id` matches the logged-in host's ID

### Issue: CORS errors
**Solution:** 
- Check that `WEB_ORIGIN` in backend `.env` matches your frontend URLs
- Make sure `withCredentials: true` is set in API calls

---

## 🎉 Success Criteria

✅ Single shared database with consistent schema
✅ Traveller can search and book properties created by hosts
✅ Host receives booking requests with full traveller information
✅ Host can accept/reject bookings
✅ Booking status updates are visible to travellers
✅ Both systems maintain separate authentication
✅ Real-time updates for hosts (30-second polling)

---

## 📞 Next Steps

Consider these enhancements:
1. **WebSocket Integration** - For instant real-time updates
2. **Email Notifications** - Notify hosts of new bookings
3. **SMS Notifications** - Alert travellers when booking is accepted
4. **Booking Calendar** - Visual calendar for property availability
5. **Review System** - Allow travellers to review properties after stay

---

**Integration completed successfully!** 🚀

For questions or issues, refer to the original plan document: `integrate-host-traveller.plan.md`

