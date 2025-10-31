# 🚀 Test Your AI Agent NOW!

## ⚡ Quick 3-Minute Test

Follow these exact steps to test the AI Agent:

---

## Step 1: Start AI Agent Backend (Terminal 1)

```bash
cd "/Users/spartan/Documents/Distributed Systems Lab/agentic-airbnb/agent"
python3 run_server_sqlite.py
```

**Wait for**: 
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

✅ **Leave this terminal running**

---

## Step 2: Test AI Agent Health (Terminal 2)

Open a new terminal and run:

```bash
curl http://localhost:8000/health
```

**Expected Response**:
```json
{"status":"healthy","service":"agent-airbnb","database":"SQLite"}
```

✅ If you see this, AI Agent is working!

---

## Step 3: Test Full AI Endpoint

In the same terminal, run:

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
      "interests": ["food", "culture"],
      "mobility_needs": [],
      "dietary_restrictions": ["vegetarian"]
    },
    "user_message": "Plan my trip"
  }'
```

**Expected**: Long JSON response with:
- `day_by_day_plan` - Daily itinerary
- `activity_cards` - List of activities
- `restaurant_recommendations` - Restaurant list
- `packing_checklist` - Packing items
- `agent_notes` - AI summary

✅ If you see JSON data, API is working!

---

## Step 4: Start Traveller Backend (Terminal 3)

Open another new terminal:

```bash
cd "/Users/spartan/Documents/Distributed Systems Lab/agentic-airbnb/backend/traveller"
npm start
```

**Wait for**: `Server running on port 5001`

✅ **Leave this terminal running**

---

## Step 5: Start Traveller Frontend (Terminal 4)

Open one more terminal:

```bash
cd "/Users/spartan/Documents/Distributed Systems Lab/agentic-airbnb/frontend/traveller"
npm run dev
```

**Wait for**: `Local: http://localhost:5174/` (or 5173)

✅ **Leave this terminal running**

---

## Step 6: Test in Browser

1. **Open** your browser
2. **Go to**: `http://localhost:5174` (or 5173)
3. **Login** with your traveller account
4. **Navigate** to **Dashboard** or **Bookings** page

---

## Step 7: Test AI Agent Button

Look at the **bottom-right corner** of the page.

You should see a **purple gradient button** with 🤖 emoji.

✅ **Click the button** → Side panel opens from right

---

## Step 8: Chat with AI Agent

In the chat panel, type:

```
Plan a 3-day trip to Los Angeles for 2 people
```

**Press Send** and **wait 5-10 seconds**.

You should see:
- 📝 AI summary with day-by-day plan
- 📅 Detailed itinerary for each day
- 🍽️ Restaurant recommendations
- 🎒 Packing checklist

✅ **SUCCESS!** Your AI Agent is working!

---

## 🎯 What to Test

### Test 1: Simple Query
```
Hi, can you help me plan a trip?
```
**Expected**: Greeting and offer to help

### Test 2: Restaurants
```
Find vegan restaurants in San Francisco
```
**Expected**: List of vegan restaurant recommendations

### Test 3: Activities
```
What are some wheelchair-accessible activities in Los Angeles?
```
**Expected**: List of accessible activities

### Test 4: Packing
```
What should I pack for a winter trip to New York?
```
**Expected**: Weather-aware packing checklist

### Test 5: Full Itinerary
```
Plan a 4-day trip to Seattle for a family with 2 kids
```
**Expected**: Complete itinerary with family-friendly activities

---

## ✅ Success Checklist

- [ ] Terminal 1: AI Agent running on port 8000
- [ ] Terminal 2: Health check returns "healthy"
- [ ] Terminal 3: Traveller backend running on port 5001
- [ ] Terminal 4: Frontend running on port 5174/5173
- [ ] Browser: Can see 🤖 button on Dashboard
- [ ] Browser: Can see 🤖 button on Bookings page
- [ ] Chat: Clicking button opens side panel
- [ ] Chat: Sending message gets AI response
- [ ] Response: Shows itinerary, activities, restaurants
- [ ] Response: No errors in browser console

---

## 🐛 Common Issues

### "Connection timeout to localhost:8000"
**Problem**: AI Agent not running  
**Fix**: Check Terminal 1 - restart if needed

### "Invalid API key"
**Problem**: OpenAI key not set  
**Fix**: Check `/agent/.env` file has your key

### "Cannot find module"
**Problem**: Missing dependencies  
**Fix**: 
```bash
cd agent
pip3 install -r requirements.txt
```

### Button not visible
**Problem**: Not on right page  
**Fix**: Make sure you're on Dashboard or Bookings page

### Slow response (10+ seconds)
**Status**: **NORMAL** - AI takes time to generate responses

---

## 📊 Expected Terminal Outputs

### Terminal 1 (AI Agent):
```
🚀 Starting Agent Airbnb - AI Travel Concierge (SQLite)
📍 Server will run on 0.0.0.0:8000
🗄️  Database: agent_airbnb.db
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Terminal 2 (Test Commands):
```
{"status":"healthy","service":"agent-airbnb","database":"SQLite"}
```

### Terminal 3 (Traveller Backend):
```
Server running on port 5001
Database connected successfully
```

### Terminal 4 (Frontend):
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5174/
➜  Network: use --host to expose
```

---

## 🎉 You're Done!

If all checkboxes are checked, your AI Agent is **fully operational**!

Try different queries and explore the features:
- Day-by-day planning
- Activity recommendations
- Restaurant suggestions
- Packing checklists
- Natural language understanding

---

**Need help?** Check:
- `/AI_AGENT_SETUP_COMPLETE.md` - Complete setup guide
- `/CHANGES_SUMMARY.md` - What was changed
- `/agent/README.md` - Technical documentation

**Enjoy your AI Travel Concierge! ✨**

