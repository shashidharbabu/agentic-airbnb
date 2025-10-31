# 🎯 Testing AI Agent with Real Booking Data

## ✅ Current Status

**AI Agent is LIVE and properly configured!**
- ✅ Backend running on http://localhost:8000
- ✅ Fetches real traveller bookings from database
- ✅ Uses actual booking context in conversations
- ✅ Integrated with traveller backend

---

## 🚀 Quick Test Steps

### Step 1: Verify All Services Are Running

You need 3 services running:

**1. Traveller Backend** (Port 5001)
```bash
# Terminal 1
cd backend/traveller
npm start
```

**2. AI Agent Backend** (Port 8000) - **Already Running** ✅
```bash
# Already started! Check status:
curl http://localhost:8000/health
```

**3. Traveller Frontend** (Port 5173)
```bash
# Terminal 2
cd frontend/traveller
npm run dev
```

### Step 2: Log In and Check Your Bookings

1. Open http://localhost:5173
2. Log in as a traveller
3. Go to "Bookings" page
4. Check if you have any **upcoming** bookings with status **"ACCEPTED"**

**If you don't have any upcoming bookings**:
- Browse properties and make a new booking
- Set dates in the **future** (e.g., next week)
- Wait for host to accept, OR manually update in database:
  ```sql
  UPDATE bookings SET status = 'ACCEPTED' WHERE id = YOUR_BOOKING_ID;
  ```

### Step 3: Test the AI Agent

1. Click the **🤖 AI Assistant** button (bottom right corner)
2. Type: **"I need itinerary for my next travel. Can you do that?"**
3. Press Send

### Step 4: Verify the Response

**Expected Behavior** (if you have upcoming bookings):

The AI Agent should:
- ✅ Mention your **actual property location** (e.g., "your trip to San Francisco")
- ✅ Mention your **actual booking dates**
- ✅ Show a **day-by-day itinerary** for those specific dates
- ✅ Provide **activity recommendations** for that location
- ✅ Suggest **restaurants** in that area
- ✅ Generate a **packing checklist** based on the weather

**Expected Behavior** (if you have NO upcoming bookings):

```
I don't see any upcoming bookings in your account yet. Once you book a 
property, I'll be able to help you plan an amazing itinerary for your trip! 
Feel free to browse available properties and make a booking.
```

---

## 🔍 How to Debug

### Check Backend Logs

Look at the terminal where the AI Agent is running. You should see:

**✅ Good logs (working correctly):**
```
🎯 DEBUG (chat endpoint): Message='I need itinerary for my next travel', traveler_id=1, booking_id=None
🔍 Fetching upcoming bookings for traveler 1...
✅ Found 2 upcoming booking(s). Using: Cozy Apartment in Manhattan
📍 Context: New York, NY, 2025-01-15 to 2025-01-20
✅ Agent response keys: dict_keys(['agent_response', 'day_by_day_plan', 'activity_cards', ...])
```

**❌ Problem logs (not working):**
```
Failed to fetch bookings: 403
```
or
```
ℹ️ No upcoming bookings found for this traveler
```

### Common Issues

**Issue 1: "No upcoming bookings found"**
- **Solution**: Make sure you have a booking with:
  - `status = 'ACCEPTED'`
  - `start_date >= today`

**Issue 2: Traveller backend not running**
- **Error**: `Error fetching traveller bookings: ...`
- **Solution**: Start the traveller backend:
  ```bash
  cd backend/traveller
  npm start
  ```

**Issue 3: AI Agent shows generic "San Francisco" data**
- **Solution**: 
  - Clear browser localStorage
  - Refresh the page
  - Make sure you're logged in
  - Check that traveller_id is being sent (check browser console)

---

## 📊 Example Test Scenarios

### Scenario 1: User with Upcoming Booking to New York

**Setup:**
- Traveller ID: 1
- Booking: Cozy Manhattan Apartment
- Dates: Jan 15 - Jan 20, 2025
- Guests: 2

**User asks:** "I need itinerary for my next travel. Can you do that?"

**AI Response:**
```markdown
📝 Travel Recommendations

Of course! I'd be happy to help you plan an itinerary for your trip to 
New York from January 15, 2025 to January 20, 2025. With your party of 2 
and interests in food, culture, and sightseeing, there are so many great 
activities to enjoy...

📅 Day-by-Day Itinerary

Day 1 - Thu, Jan 15
🌅 Morning: Explore Central Park
Visit the iconic Central Park. Walk through the paths...

☀️ Afternoon: Metropolitan Museum of Art
Spend your afternoon at one of the world's finest art museums...

🌙 Evening: Dinner in Greenwich Village
Try authentic Italian cuisine at one of the neighborhood's...

[... more days ...]

🎒 Packing Checklist

Essential Items:
- ⭐ Warm winter coat (weather dependent)
- ⭐ Comfortable walking shoes
- ⭐ Phone charger
...
```

### Scenario 2: User with No Upcoming Bookings

**Setup:**
- Traveller ID: 5
- No upcoming bookings

**User asks:** "I need itinerary for my next travel"

**AI Response:**
```
I don't see any upcoming bookings in your account yet. Once you book a 
property, I'll be able to help you plan an amazing itinerary for your trip! 
Feel free to browse available properties and make a booking.
```

### Scenario 3: User with Multiple Upcoming Bookings

**Setup:**
- Traveller ID: 2
- Booking 1: Miami (Feb 1-5)
- Booking 2: Seattle (Feb 15-20)

**User asks:** "I need itinerary for my next travel"

**AI Response:**
Uses the **earliest** upcoming booking (Miami, Feb 1-5)

---

## 🧪 Advanced Testing

### Test 1: Natural Language Understanding

Try different phrasings:
- "Can you plan my trip?"
- "What should I do during my vacation?"
- "I'm traveling soon, help me plan it"
- "Give me restaurant recommendations"
- "What should I pack?"

### Test 2: Follow-up Questions

Have a conversation:
1. "I need itinerary for my next travel"
2. (Agent responds)
3. "What about vegan restaurants?"
4. (Agent should provide vegan options for your destination)
5. "What should I pack if it rains?"

### Test 3: Multiple Travellers

Test with different traveller accounts to ensure:
- Each traveller gets their own bookings
- No data leakage between travellers
- Conversation history is per-traveller

---

## 🛠️ Manual API Testing

Test the endpoint directly:

```bash
# Test with traveller_id
curl -X POST http://localhost:8000/api/ai-agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I need itinerary for my next travel",
    "traveler_id": 1
  }'
```

**Expected Response:**
```json
{
  "response": "Of course! I'd be happy to help you plan...",
  "day_by_day_plan": [...],
  "activity_cards": [...],
  "restaurant_recommendations": [...],
  "packing_checklist": [...],
  "extracted_context": {
    "location": "San Francisco, CA",
    "check_in_date": "2025-01-15",
    "check_out_date": "2025-01-20",
    "party_size": 2,
    "property_name": "Cozy Apartment"
  },
  "booking_id": 123,
  "status": "success",
  "has_booking": true
}
```

---

## ✅ Success Criteria

Your AI Agent is working correctly if:

1. ✅ It mentions the **actual property location** from your booking
2. ✅ It uses the **actual booking dates** 
3. ✅ It generates recommendations **specific to that location**
4. ✅ If you have no bookings, it tells you to make one
5. ✅ Backend logs show "✅ Found X upcoming booking(s)"
6. ✅ Response includes `has_booking: true` in the JSON

---

## 🎉 What's New

**Before:**
- ❌ Used dummy data (always San Francisco)
- ❌ Generic dates (always a week from now)
- ❌ No connection to real bookings
- ❌ Same response for everyone

**After:**
- ✅ Uses YOUR real upcoming bookings
- ✅ YOUR actual property location
- ✅ YOUR actual booking dates
- ✅ Personalized to YOUR trip
- ✅ If no bookings, prompts you to make one

---

## 📝 Notes

- The AI Agent uses the **first upcoming booking** if you have multiple
- Bookings must be **ACCEPTED** status
- Bookings must have **start_date >= today**
- The traveller must be **logged in** for traveller_id to be available
- Conversation context is saved in localStorage

---

**Last Updated:** October 28, 2025
**Status:** ✅ **FULLY WORKING**

