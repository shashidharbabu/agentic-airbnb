# Quick Start Guide - Host & Traveller Integration

## 🚀 Get Started in 5 Minutes

### Prerequisites
- MySQL running on localhost:3306
- Node.js installed
- Terminal access

---

## Step 1: Create .env Files (2 minutes)

Run these commands to create all environment files:

```bash
# Navigate to project root
cd /Users/spartan/Documents/Distributed\ Systems\ Lab/agentic-airbnb

# Backend Host .env
cat > backend/host/.env << 'EOF'
PORT=4000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=airbnb_core
SESSION_SECRET=host-secret-key-change-me
SESSION_COOKIE_NAME=airbnb_host.sid
WEB_ORIGIN=http://localhost:5173
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
EOF

# Backend Traveller .env
cat > backend/traveller/.env << 'EOF'
PORT=5001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=airbnb_core
SESSION_SECRET=traveller-secret-key-change-me
WEB_ORIGIN=http://localhost:5174
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
EOF

# Frontend Host .env
cat > frontend/host/.env << 'EOF'
VITE_HOST_API=http://localhost:4000
VITE_AGENT_API=http://localhost:8000
EOF

# Frontend Traveller .env
cat > frontend/traveller/.env << 'EOF'
VITE_API_URL=http://localhost:5001
VITE_AGENT_API_URL=http://localhost:8000
EOF

echo "✅ All .env files created!"
```

**⚠️ Important:** Replace `yourpassword` with your actual MySQL root password in the backend .env files.

---

## Step 2: Run Database Migration (1 minute)

```bash
# Make sure MySQL is running
mysql -u root -p airbnb_core < backend/host/sql/unify_schemas.sql
```

Enter your MySQL password when prompted.

---

## Step 3: Install Dependencies (1 minute)

```bash
# Install backend dependencies
cd backend/host && npm install && cd ../..
cd backend/traveller && npm install && cd ../..

# Install frontend dependencies
cd frontend/host && npm install && cd ../..
cd frontend/traveller && npm install && cd ../..
```

---

## Step 4: Start All Services (1 minute)

Open **4 terminal windows** and run these commands:

### Terminal 1 - Host Backend
```bash
cd backend/host
npm run dev
```
✅ Should see: `Host API on http://localhost:4000`

### Terminal 2 - Traveller Backend
```bash
cd backend/traveller
npm run dev
```
✅ Should see: `Traveler API running on http://localhost:5001`

### Terminal 3 - Host Frontend
```bash
cd frontend/host
npm run dev
```
✅ Should see: `Local: http://localhost:5173/`

### Terminal 4 - Traveller Frontend
```bash
cd frontend/traveller
npm run dev
```
✅ Should see: `Local: http://localhost:5174/`

---

## Step 5: Test the Integration (5 minutes)

### 1️⃣ Create a Host Account
- Open http://localhost:5173
- Click "Sign Up"
- Create a host account
- Login

### 2️⃣ Create a Property
- Click "List Your Property" or "Create Listing"
- Fill in property details:
  - Name: "Cozy Downtown Apartment"
  - Location: "San Francisco, CA"
  - Price: $150/night
  - Bedrooms: 2, Bathrooms: 1
  - Max Guests: 4
- Save the property

### 3️⃣ Create a Traveller Account
- Open http://localhost:5174 (new window/tab)
- Click "Sign Up"
- Create a traveller account
- Login

### 4️⃣ Search for Properties
- On the home page, search for "San Francisco"
- You should see the property you just created!

### 5️⃣ Book the Property
- Click on the property
- Select check-in and check-out dates
- Enter number of guests
- Click "Book Now"
- Booking created with status **PENDING**

### 6️⃣ Host Approves Booking
- Go back to host window (http://localhost:5173)
- Navigate to "Bookings" page
- You should see the booking request from the traveller
- Click "Accept"
- Status changes to **ACCEPTED**

### 7️⃣ Traveller Sees Confirmation
- Go back to traveller window (http://localhost:5174)
- Navigate to "My Bookings"
- Refresh (or wait 30 seconds)
- Booking status should show **Confirmed**!

---

## ✅ Success Indicators

You'll know the integration works when:

1. ✅ Traveller can see properties created by host
2. ✅ Traveller can create bookings
3. ✅ Host receives booking with traveller's name and email
4. ✅ Host can accept/reject bookings
5. ✅ Traveller sees status updates
6. ✅ No console errors in any of the apps

---

## 🐛 Common Issues

### "Cannot connect to MySQL"
**Fix:** 
```bash
# Check if MySQL is running
mysql -u root -p -e "SELECT 1"

# If not running, start it:
# macOS: brew services start mysql
# Linux: sudo systemctl start mysql
```

### "Property not found" when traveller searches
**Fix:** 
- Make sure migration ran: `mysql -u root -p airbnb_core < backend/host/sql/unify_schemas.sql`
- Check property was actually created by the host

### "Unauthorized" errors
**Fix:**
- Clear browser cookies
- Logout and login again
- Check that `.env` files have correct `SESSION_SECRET` values

### Ports already in use
**Fix:**
```bash
# Find and kill processes on those ports
lsof -ti:4000 | xargs kill -9
lsof -ti:5001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
lsof -ti:5174 | xargs kill -9
```

---

## 🔍 Verification Checklist

After completing the test flow, verify in the database:

```bash
mysql -u root -p airbnb_core
```

```sql
-- Check if booking was created with traveler info
SELECT 
  b.id, 
  b.traveler_name, 
  b.traveler_email, 
  b.status,
  p.name AS property_name,
  o.name AS owner_name
FROM bookings b
JOIN properties p ON b.property_id = p.id
JOIN owners o ON p.owner_id = o.id
ORDER BY b.created_at DESC
LIMIT 1;
```

You should see:
- ✅ `traveler_name` filled in
- ✅ `traveler_email` filled in  
- ✅ `status` = 'ACCEPTED'
- ✅ Property and owner names

---

## 📊 System Architecture

```
┌─────────────────────┐         ┌─────────────────────┐
│   Host Frontend     │         │ Traveller Frontend  │
│   (Port 5173)       │         │   (Port 5174)       │
└──────────┬──────────┘         └──────────┬──────────┘
           │                               │
           │ HTTP                          │ HTTP
           │                               │
           ▼                               ▼
┌─────────────────────┐         ┌─────────────────────┐
│   Host Backend      │         │ Traveller Backend   │
│   (Port 4000)       │         │   (Port 5001)       │
└──────────┬──────────┘         └──────────┬──────────┘
           │                               │
           └───────────┬───────────────────┘
                       │ Both connect to
                       ▼
            ┌──────────────────┐
            │   MySQL Database │
            │   airbnb_core    │
            └──────────────────┘
                Shared Tables:
                - properties
                - bookings
                - owners
                - users
```

---

## 🎯 What's Been Integrated

- ✅ **Unified Database Schema** - BIGINT IDs, consistent column names
- ✅ **Cross-System Booking Flow** - Traveller → Host → Traveller
- ✅ **Real-time Updates** - Host sees new bookings within 30 seconds
- ✅ **No Breaking Changes** - Existing functionality preserved
- ✅ **Proper Foreign Keys** - Data integrity maintained
- ✅ **Separate Auth Systems** - Hosts and Travellers have distinct accounts

---

## 📚 Additional Resources

- **Full Integration Details:** See `INTEGRATION_SETUP.md`
- **Migration SQL:** See `backend/host/sql/unify_schemas.sql`
- **Original Plan:** See `integrate-host-traveller.plan.md`

---

**🎉 You're all set! Enjoy your integrated Host-Traveller system!**

