# AI Travel Concierge - User Guide

## 🎯 Quick Start

The AI Travel Concierge Agent is now **fully implemented and running**! Follow these steps to test it.

---

## ✅ Prerequisites (Already Running)

1. **AI Agent Server** - Running on `http://localhost:8000` ✅
2. **Host Backend** - Running on `http://localhost:4000` ✅
3. **Host Frontend** - Should be running on `http://localhost:5174`

---

## 🚀 How to Test

### Step 1: Open the Host Dashboard
1. Open your browser and go to: **`http://localhost:5174`**
2. Log in as a host (if not already logged in)
3. Navigate to the **Dashboard** or **Bookings** page

### Step 2: Open the AI Concierge
1. Look for the **🤖 AI Concierge** button in the **bottom-right corner** of the screen
2. Click the button to open the side panel

### Step 3: Select a Booking
1. In the **Select Booking** dropdown, choose any pending booking
2. The dropdown shows: `#ID - Guest Name (Check-in → Check-out)`

### Step 4: (Optional) Add Custom Request
1. In the **Custom Request** textarea, you can add natural language queries like:
   - "We love art museums and vegan food"
   - "Family with 2 kids, wheelchair accessible"
   - "We're vegan, no long hikes, budget-friendly"
2. Leave it blank for a default comprehensive itinerary

### Step 5: Generate Itinerary
1. Click the **✨ Generate Itinerary** button
2. Wait 3-5 seconds while the AI processes your request
3. The button will show: **🔄 Generating Itinerary...**

### Step 6: View Results
The panel will display:

#### 📝 AI Recommendations
- Personalized day-by-day travel suggestions
- Specific restaurant recommendations
- Activity suggestions based on preferences

#### 🎒 Packing Checklist
- Essential items marked with ⭐
- Weather-dependent items marked with 🌡️
- Organized by category (clothing, documents, electronics, etc.)

#### 📅 Day-by-Day Plan
- Each day broken down into:
  - 🌅 **Morning** activities
  - ☀️ **Afternoon** activities
  - 🌙 **Evening** activities

#### 🌤️ Weather Summary
- Current weather information for the destination
- Fetched in real-time via Tavily API

---

## 🧪 Test Scenarios

### Scenario 1: Art & Vegan Food
**Custom Request:** "We love art museums and vegan food"

**Expected Result:**
- Art museum recommendations (SFMOMA, de Young Museum, etc.)
- Vegan restaurant suggestions
- Cultural activities in the itinerary

### Scenario 2: Family with Kids
**Custom Request:** "Family with 2 kids, wheelchair accessible"

**Expected Result:**
- Child-friendly activities
- Wheelchair accessible venues
- Family-oriented restaurants

### Scenario 3: Budget Travel
**Custom Request:** "Budget-friendly activities, we love outdoor adventures"

**Expected Result:**
- Free or low-cost activities
- Outdoor sightseeing
- Budget-tier restaurants

---

## 🔍 API Testing (Advanced)

You can also test the API directly using `curl`:

```bash
curl -X POST http://localhost:8000/api/concierge \
  -H "Content-Type: application/json" \
  -d '{
    "booking_context": {
      "check_in_date": "2025-11-01",
      "check_out_date": "2025-11-03",
      "location": "San Francisco, CA",
      "party_type": "couple",
      "party_size": 2
    },
    "preferences": {
      "budget_tier": "mid-range",
      "interests": ["food", "culture", "sightseeing"],
      "mobility_needs": [],
      "dietary_restrictions": ["vegetarian"]
    },
    "user_message": "We love art museums and vegan food"
  }' | python3 -m json.tool
```

---

## 📊 What Makes This AI Agent Special?

### ✅ Natural Language Understanding (NLU)
- Understands free-text queries like "vegan food and art museums"
- No need for structured inputs or dropdowns
- Conversational interface

### ✅ Context-Aware Recommendations
- Uses booking dates, location, party type, and size
- Considers user preferences (budget, interests, dietary restrictions)
- Integrates real-time data (weather, events)

### ✅ Comprehensive Itineraries
- **Day-by-day planning** with morning/afternoon/evening blocks
- **Activity cards** with pricing, duration, accessibility flags
- **Restaurant recommendations** filtered by dietary needs
- **Weather-aware packing lists** with essential item markers

### ✅ Live Data Integration
- **Tavily API** for real-time weather
- **Tavily API** for local events
- **OpenAI GPT-3.5** for intelligent natural language responses

---

## 🛠️ Troubleshooting

### Issue: AI Agent button not visible
**Solution:** Make sure you're on the host frontend (`http://localhost:5174`) and logged in

### Issue: "Pick a booking" error
**Solution:** Select a booking from the dropdown before clicking "Generate Itinerary"

### Issue: Server errors
**Solution:** Check if all three servers are running:
```bash
# Check AI Agent Server
curl http://localhost:8000/health

# Check Host Backend
curl http://localhost:4000/health

# If needed, restart AI Agent Server:
cd "/Users/spartan/Documents/Distributed Systems Lab/agentic-airbnb/agent"
python3 run_server_sqlite.py
```

### Issue: Slow responses
**Solution:** Normal! AI generation takes 3-5 seconds. OpenAI API calls require time for intelligent responses.

---

## 🎓 Understanding the Results

### Day Plans
Each day includes:
- **Morning (9 AM - 12 PM):** Outdoor activities, museums, cultural sites
- **Afternoon (1 PM - 5 PM):** Shopping, entertainment, sightseeing
- **Evening (6 PM - 10 PM):** Dining, nightlife, cultural experiences

### Activity Tags
- `outdoor` - Open-air activities
- `culture` - Museums, galleries, historical sites
- `sightseeing` - Tourist attractions
- `dining` - Food-related activities
- `shopping` - Retail experiences
- `entertainment` - Shows, performances

### Price Tiers
- `free` - No cost
- `budget` - $0-$20 per person
- `mid-range` - $20-$50 per person
- `luxury` - $50+ per person

### Packing Item Categories
- `documents` - ID, passport, tickets
- `electronics` - Phone, charger, camera
- `clothing` - Weather-appropriate attire
- `toiletries` - Personal care items
- `other` - Miscellaneous

---

## 📸 Screenshot Guide

### 1. AI Concierge Button
Look for the floating button in the **bottom-right corner**:
```
┌─────────────────────────────────────┐
│                                     │
│   Host Dashboard                    │
│                                     │
│   [Content]                         │
│                                     │
│                    ┌──────────────┐ │
│                    │ 🤖 AI        │ │
│                    │ Concierge    │ │
│                    └──────────────┘ │
└─────────────────────────────────────┘
```

### 2. Side Panel
When opened, a **500px panel** slides in from the right:
```
┌────────────────────┬──────────────────┐
│                    │ 🤖 AI Travel     │
│   Dashboard        │ Concierge     [×]│
│                    ├──────────────────┤
│   Content          │ Select Booking:  │
│                    │ [Dropdown ▼]     │
│                    │                  │
│                    │ Custom Request:  │
│                    │ [Text area...]   │
│                    │                  │
│                    │ ✨ Generate      │
│                    │ Itinerary        │
│                    │                  │
│                    │ [Results...]     │
└────────────────────┴──────────────────┘
```

---

## 🎉 Success Criteria

You'll know it's working when you see:

✅ Button appears in bottom-right corner  
✅ Side panel opens smoothly  
✅ Booking dropdown populates with real bookings  
✅ "Generate Itinerary" button triggers API call  
✅ Results display with:
- 📝 AI Recommendations (detailed itinerary)
- 🎒 Packing Checklist (with essential items marked)
- 📅 Day-by-Day Plan (morning/afternoon/evening cards)
- 🌤️ Weather Summary

---

## 📞 Support

If you encounter any issues:
1. Check the browser console for errors (`F12` → Console tab)
2. Check the terminal logs for AI agent server
3. Verify all environment variables are set (`.env` file)
4. Ensure OpenAI API key is valid and has credits

---

**Enjoy your AI-powered travel concierge! 🚀**

