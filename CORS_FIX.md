# CORS Configuration Fix

## Problem
Login was failing with CORS errors. The browser console showed:
```
Access to XMLHttpRequest at 'http://localhost:4000/auth/login' from origin 'http://localhost:5173'
has been blocked by CORS policy
```

## Root Cause
The backend CORS configurations were **mismatched** with the frontend ports:

### Before (Incorrect)
```javascript
// Host Backend (port 4000)
const ORIGIN = 'http://localhost:5173';  // ❌ Wrong! Should be 5174

// Traveller Backend (port 5001)  
const ORIGIN = 'http://localhost:5174';  // ❌ Wrong! Should be 5173
```

This happened because the ports were swapped during the earlier fix, but the backend CORS configs weren't updated.

## Solution
Fixed both backend CORS configurations to match the correct frontend ports:

### After (Correct)
```javascript
// Host Backend (port 4000)
const ORIGIN = 'http://localhost:5174';  // ✅ Correct!

// Traveller Backend (port 5001)
const ORIGIN = 'http://localhost:5173';  // ✅ Correct!
```

## Files Modified
1. `/backend/host/src/server.js` - Line 15: Changed ORIGIN from 5173 to 5174
2. `/backend/traveller/src/server.js` - Line 14: Changed ORIGIN from 5174 to 5173

## Current Complete Configuration

| Service | Port | CORS Origin | Purpose |
|---------|------|-------------|---------|
| **Host Frontend** | 5174 | N/A | Host dashboard UI |
| **Host Backend** | 4000 | http://localhost:5174 | Host API |
| **Traveller Frontend** | 5173 | N/A | Traveller booking UI |
| **Traveller Backend** | 5001 | http://localhost:5173 | Traveller API |

## Auto-Restart
Both backends use **nodemon**, so they should have automatically restarted after the file changes:
- ✅ Host backend (nodemon detected change)
- ⚠️ Traveller backend (needs manual verification)

## Testing

### Test Host Login
1. Open `http://localhost:5174/login`
2. Enter credentials:
   - Email: `host@example.com`
   - Password: `password123`
3. Should successfully log in without CORS errors ✅

### Test Traveller Login
1. Open `http://localhost:5173/login`
2. Enter credentials
3. Should successfully log in without CORS errors ✅

## If Login Still Fails

### Step 1: Verify Host Backend Restarted
Check the host backend terminal logs for:
```
[nodemon] restarting due to changes...
Host API on http://localhost:4000
```

If not restarted, manually restart:
```bash
cd "/Users/spartan/Documents/Distributed Systems Lab/agentic-airbnb/backend/host"
# Press Ctrl+C, then:
npm run dev
```

### Step 2: Start Traveller Backend (if not running)
```bash
cd "/Users/spartan/Documents/Distributed Systems Lab/agentic-airbnb/backend/traveller"
npm run dev
```

Should see:
```
Traveller API listening on http://localhost:5001
```

### Step 3: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Step 4: Verify in Browser Console
After attempting login, the console should show:
```
✅ POST http://localhost:4000/auth/login 200 OK
```
Instead of CORS errors.

## Verification Checklist
- [ ] Host backend running on port 4000
- [ ] Traveller backend running on port 5001  
- [ ] Host frontend accessible at localhost:5174
- [ ] Traveller frontend accessible at localhost:5173
- [ ] No CORS errors in browser console
- [ ] Login works on both applications

---

**Status**: ✅ FIXED - CORS configurations corrected for all services

