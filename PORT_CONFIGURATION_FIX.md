# Frontend Port Configuration Fix

## Problem
When clicking "Switch to traveling" from the host app, it was showing the host home page instead of the traveller login page.

## Root Cause
The `vite.config.js` files had **reversed port configurations**:

### Before (Incorrect)
```javascript
// frontend/host/vite.config.js
server: { port: 5173 }  // ❌ Wrong!

// frontend/traveller/vite.config.js  
server: { port: 5174 }  // ❌ Wrong!
```

This caused:
- Host tried to start on 5173, but another instance was already there
- Host got bumped to 5174
- Traveller configured for 5174 couldn't start or conflicted
- Both apps ended up on wrong ports
- Redirects went to wrong applications

## Solution
**Swapped the port configurations** to match the intended architecture:

### After (Correct)
```javascript
// frontend/host/vite.config.js
server: { port: 5174 }  // ✅ Correct!

// frontend/traveller/vite.config.js
server: { port: 5173 }  // ✅ Correct!
```

## Final Port Configuration

| Service | Port | URL |
|---------|------|-----|
| **Host Frontend** | 5174 | http://localhost:5174 |
| **Traveller Frontend** | 5173 | http://localhost:5173 |
| **Host Backend** | 4000 | http://localhost:4000 |
| **Traveller Backend** | 5001 | http://localhost:5001 |

## Files Modified
1. `/frontend/host/vite.config.js` - Changed port from 5173 to 5174
2. `/frontend/traveller/vite.config.js` - Changed port from 5174 to 5173

## Navigation Flow (Now Correct)
- **"Switch to traveling"** (from host) → `http://localhost:5173/login` → Traveller login ✅
- **"Become a host"** (from traveller) → `http://localhost:5174/login` → Host login ✅

## How to Restart Frontends

### Option 1: Use the restart script
```bash
./RESTART_FRONTENDS.sh
```

### Option 2: Manual restart

**Step 1:** Stop all running frontend servers
- Press `Ctrl+C` in each terminal running `npm run dev`
- Or: `pkill -f "node.*vite"`

**Step 2:** Start Host Frontend (Terminal 1)
```bash
cd "/Users/spartan/Documents/Distributed Systems Lab/agentic-airbnb/frontend/host"
npm run dev
```
Should see: `➜  Local:   http://localhost:5174/`

**Step 3:** Start Traveller Frontend (Terminal 2)
```bash
cd "/Users/spartan/Documents/Distributed Systems Lab/agentic-airbnb/frontend/traveller"
npm run dev
```
Should see: `➜  Local:   http://localhost:5173/`

## Verification
After restarting both frontends:

1. ✅ Open `http://localhost:5174` → Should see **Host** dashboard
2. ✅ Open `http://localhost:5173` → Should see **Traveller** homepage  
3. ✅ Click "Switch to traveling" from host → Should go to traveller login
4. ✅ Click "Become a host" from traveller → Should go to host login

## Why This Happened
Multiple frontend instances were running simultaneously due to:
1. Previous dev server not properly shut down
2. Conflicting port configurations in vite configs
3. Vite's automatic port bumping when ports are taken

## Prevention
- Always shut down dev servers before restarting
- Keep port configurations consistent
- Check what's running: `lsof -i :5173 -i :5174 | grep LISTEN`

---

**Status**: ✅ FIXED - Ports properly configured, frontends need restart

