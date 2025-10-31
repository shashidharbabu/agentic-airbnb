# 🧪 Test User Isolation for AI Agent

## Quick Test Guide

Follow these steps to verify that the AI Agent is properly isolated per user:

---

## ✅ Test 1: User Isolation (Most Important)

### Steps:
1. **Start all services:**
   ```bash
   # Terminal 1: AI Agent
   cd agent && python3 run_server_sqlite.py
   
   # Terminal 2: Traveller Backend
   cd backend/traveller && npm start
   
   # Terminal 3: Traveller Frontend
   cd frontend/traveller && npm run dev
   ```

2. **Open browser** to `http://localhost:5173` (or 5174)

3. **Create/Login as User A:**
   - Email: `john@test.com`
   - Password: `password123`
   - Name: `John Doe`

4. **Open AI Agent** (click 🤖 button)

5. **Send message:** "Hello! My name is John and I'm planning a trip to San Francisco."

6. **Wait for AI response**

7. **Logout** (click logout in header)

8. **Login as User B:**
   - Email: `jane@test.com`
   - Password: `password123`
   - Name: `Jane Smith`

9. **Open AI Agent** (click 🤖 button)

10. **Verify:** ✅ AI should greet "Jane", NOT show John's conversation

---

## ✅ Test 2: Logout Cleanup

### Steps:
1. **Login as any user**

2. **Open AI Agent** and send several messages

3. **Logout**

4. **Login again with same user**

5. **Open AI Agent**

6. **Verify:** ✅ Should show greeting message, conversation should be cleared

---

## ✅ Test 3: Same User, Different Browsers

### Steps:
1. **Open two different browsers** (Chrome and Firefox, or Incognito + Regular)

2. **Login as User A in Browser 1**

3. **Login as User A in Browser 2**

4. **Send different messages in each browser's AI Agent**

5. **Verify:** ✅ Each browser shows its own conversation (not shared)

---

## ✅ Test 4: Multiple Users Simultaneously

### Steps:
1. **Open two browsers**

2. **Login as User A in Browser 1**

3. **Login as User B in Browser 2**

4. **Open AI Agent in both browsers**

5. **Send messages simultaneously**

6. **Verify:** ✅ Each user sees their own conversation only

---

## 🐛 Expected Issues (Should NOT Happen)

If you see any of these, there's still a problem:

### ❌ Issue 1: Shared Conversations
**Symptom:** User B sees User A's messages

**Expected:** Each user should have separate conversations

**Fix:** Check that:
- Dashboard.jsx has `bookingId={null}` (not `bookingId={1}`)
- App.jsx has `bookingId={null}` (not `currentBooking={...}`)
- AIAgentPanel is using `traveler.id` in storage key

### ❌ Issue 2: Conversation Persists After Logout
**Symptom:** After logout and login, old conversation still appears

**Expected:** Logout should clear all AI chat data

**Fix:** Check that AuthContext.jsx logout function clears localStorage keys starting with `ai_chat_` and `ai_context_`

### ❌ Issue 3: Same Conversation in Different Bookings
**Symptom:** Opening AI Agent from different bookings shows same conversation

**Expected:** Different bookingIds should have different conversations

**Fix:** Check that bookingId is being passed correctly to AIAgentPanel

---

## 📊 Storage Keys to Check

Open browser DevTools (F12) → Application → Local Storage → Your domain

### Correct Storage Keys:
```
ai_chat_5_general          ← User 5, general chat
ai_chat_5_10               ← User 5, booking #10 chat
ai_chat_8_general          ← User 8, general chat
ai_context_5_general       ← User 5, general context
ai_context_5_10            ← User 5, booking #10 context
```

### Wrong (All Users Share Same):
```
ai_chat_5_general          ← Only these keys exist
ai_context_5_general       ← All users share same conversations ❌
```

---

## ✅ Success Checklist

After running all tests, verify:

- [ ] Each user has isolated conversations
- [ ] Logout clears all AI chat data
- [ ] Multiple users can chat simultaneously without interference
- [ ] Same user in different browsers has separate conversations
- [ ] Storage keys follow format: `ai_chat_{userId}_{bookingId || 'general'}`
- [ ] No console errors when testing
- [ ] AI responses are contextual to the logged-in user

---

## 🎊 If All Tests Pass

**Congratulations!** Your AI Agent is properly isolated per user!

You can now:
- ✅ Deploy with confidence
- ✅ Ensure user privacy
- ✅ Prevent data leakage
- ✅ Provide proper user experience

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________

Test 1 - User Isolation: [ ] PASS / [ ] FAIL
Test 2 - Logout Cleanup: [ ] PASS / [ ] FAIL
Test 3 - Multiple Browsers: [ ] PASS / [ ] FAIL
Test 4 - Multiple Users: [ ] PASS / [ ] FAIL

Overall: [ ] PASS / [ ] FAIL

Notes:
_____________________________________________
_____________________________________________
_____________________________________________
```

---

**Good luck testing!** 🚀

