# Discounts Step Removed from Onboarding - Complete ✅

## Summary
The "Discounts" step has been removed from the property onboarding questionnaire flow on the host side. This step previously asked for:
- Weekend premium %
- Weekly discount %
- Monthly discount %

## Changes Made

### 1. App.jsx
**Removed the import:**
```javascript
// Before:
import StepDiscounts from './pages/onboarding/StepDiscounts'

// After: (removed)
```

**Removed the route:**
```javascript
// Before:
<Route
  path="/onboarding/:id/discounts"
  element={(
    <RequireAuth>
      <Layout>
        <StepDiscounts />
      </Layout>
    </RequireAuth>
  )}
/>

// After: (removed)
```

### 2. StepPricing.jsx
**Updated navigation to skip discounts step:**
```javascript
// Before:
nav(`/onboarding/${id}/discounts`)

// After:
nav(`/onboarding/${id}/booking`)
```

### 3. StepBooking.jsx
**Updated back button to skip discounts step:**
```javascript
// Before:
<button onClick={()=>nav(`/onboarding/${id}/discounts`)} ...>Back</button>

// After:
<button onClick={()=>nav(`/onboarding/${id}/pricing`)} ...>Back</button>
```

## New Onboarding Flow

The updated onboarding flow is now:

```
1. Type (property type)
2. Privacy (entire place / private room / shared room)
3. Location (address, city, state, country)
4. Basics (guests, bedrooms, bathrooms)
5. Highlights (property highlights)
6. Amenities (wifi, kitchen, etc.)
7. Safety (smoke alarm, first aid kit, etc.)
8. Title (property name and description)
9. Photos (upload property images)
10. Pricing (price per night)
11. ❌ Discounts (REMOVED) ❌
12. Booking (instant book or request to book)
```

## Navigation Changes

**Before:**
```
Pricing → Discounts → Booking
         ↑         ↓
         └─────────┘
```

**After:**
```
Pricing → Booking
    ↑         ↓
    └─────────┘
```

## Files Modified

```
frontend/host/src/
  ├── App.jsx                              (removed import & route)
  ├── pages/onboarding/
  │   ├── StepPricing.jsx                 (next: discounts → booking)
  │   └── StepBooking.jsx                 (back: discounts → pricing)
  └── pages/onboarding/StepDiscounts.jsx  (now unused, can be deleted)
```

## Testing

### 1. Create New Listing
1. Go to host dashboard
2. Click "Add Property" or "Create New Listing"
3. Go through all onboarding steps
4. **Verify:** After "Pricing" step, goes directly to "Booking" step (no Discounts)

### 2. Test Back Button
1. On "Booking" step, click "Back"
2. **Verify:** Goes back to "Pricing" step (not Discounts)

### 3. Test Forward Flow
1. On "Pricing" step, enter a price and click "Next"
2. **Verify:** Goes to "Booking" step directly

### 4. Check Console
- ✅ No errors about missing routes
- ✅ No warnings about unused imports
- ✅ Navigation works smoothly

## Impact

### ✅ Benefits
- Simpler onboarding flow
- One less step for hosts to complete
- Reduced friction in property creation
- Cleaner user experience

### ⚠️ Note
The discount fields (`weekend_premium_percent`, `discounts.weekly`, `discounts.monthly`) still exist in the database but are no longer being set during onboarding. If needed in the future, they can be:
- Added back to the onboarding
- Made available in the listing edit page
- Set via an API call

## Optional: Remove StepDiscounts.jsx File

Since this file is no longer used, you can optionally delete it:

```bash
rm frontend/host/src/pages/onboarding/StepDiscounts.jsx
```

However, keeping it won't cause any issues - it's just not imported or used anywhere.

---

**Status:** ✅ Complete - Discounts step removed from onboarding
**Date:** 2025-10-27
**Files Changed:** 3 files (App.jsx, StepPricing.jsx, StepBooking.jsx)
**Frontend:** Changes applied (refresh to see new flow)

