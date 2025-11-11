# Logout/Login Data Persistence Test Guide

**Purpose:** Verify that user data (conversations, XP) persists correctly when logging out and back in.

---

## 🧪 Test Scenario: Logout/Login Data Flow

### Prerequisites
- You have an account created
- You've solved at least one problem while logged in
- You have some XP earned
- You have at least one conversation saved

---

## Step-by-Step Test Plan

### **Step 1: Verify Initial State (Logged In)**

1. **Check XP Display**
   - Note your current XP and level (e.g., "Level 1, 13 XP")
   - Take a screenshot or write it down

2. **Check Conversation History**
   - Click "💬 Chat History" button
   - Note how many conversations you have
   - Note the problem text of at least one conversation
   - Close the history modal

3. **Check Browser Console**
   - Open DevTools (F12)
   - Go to Console tab
   - Note any errors or warnings

4. **Verify Database (Optional)**
   ```bash
   # Open Prisma Studio to view database
   npx dotenv -e .env.local -- npx prisma studio
   ```
   - Check `User` table - verify your user exists
   - Check `Conversation` table - verify conversations exist
   - Check `XPState` table - verify XP state exists
   - Note the `totalXP` value

---

### **Step 2: Log Out**

1. **Click the user button** (your name in the header)
   - Should show "log out" option
   - Click "log out"

2. **Verify Logout**
   - You should see the "Login / Create account to save progress" banner
   - The user button should be gone
   - You should be on the welcome screen (no conversations visible)

3. **Check XP Display**
   - **Expected:** XP should still show (from localStorage fallback)
   - **Note:** This is correct behavior - localStorage persists across logout
   - The XP value should match what you saw in Step 1

4. **Check Conversation History**
   - Click "💬 Chat History" button
   - **Expected:** You should still see your conversations (from localStorage)
   - The conversations should match what you saw in Step 1

5. **Check Browser Console**
   - Look for any errors
   - Should see no errors related to authentication

---

### **Step 3: Log Back In**

1. **Click "log in / register"** in the banner (or sign in button if visible)

2. **Sign In**
   - Enter your email and password
   - Click "Sign In"

3. **Verify Login**
   - Banner should disappear
   - User button should appear with your name
   - You should see the "Hi [name]!" greeting animation

4. **Check XP Display**
   - **Expected:** XP should match what you had before logout
   - If it doesn't match, check console for sync errors

5. **Check Conversation History**
   - Click "💬 Chat History" button
   - **Expected:** All conversations should be present
   - Should match what you saw before logout

6. **Check Browser Console**
   - Look for "Syncing localStorage to server..." or similar
   - Should see successful sync messages
   - No errors should appear

---

### **Step 4: Verify Database Sync (After Login)**

1. **Wait 2-3 seconds** after login (to allow sync to complete)

2. **Check Database Again** (Optional)
   ```bash
   npx dotenv -e .env.local -- npx prisma studio
   ```
   - Check `Conversation` table - should have all conversations
   - Check `XPState` table - `totalXP` should match what you see in UI
   - Verify `updatedAt` timestamps are recent

---

### **Step 5: Test Cross-Device Sync (Optional)**

If you have access to another device/browser:

1. **On Device 2:**
   - Open the app in a different browser or device
   - Sign in with the same account
   - **Expected:** Should see all conversations and XP from Device 1

2. **On Device 1:**
   - Solve a new problem
   - Earn some XP

3. **On Device 2:**
   - Refresh the page
   - **Expected:** Should see the new conversation and updated XP

---

## ✅ Success Criteria

### **Must Pass:**
- [ ] XP persists across logout/login (same value)
- [ ] Conversations persist across logout/login (all present)
- [ ] No console errors during logout/login
- [ ] Data syncs to database on login (check database or console)
- [ ] localStorage fallback works when logged out

### **Nice to Have:**
- [ ] Cross-device sync works (if testing on multiple devices)
- [ ] Sync happens quickly (< 2 seconds)

---

## 🐛 Troubleshooting

### **XP Doesn't Match After Login**

**Possible Causes:**
1. Sync failed silently
2. Database has different XP than localStorage
3. Multiple XP states (one in localStorage, one in database)

**How to Debug:**
```javascript
// In browser console, check localStorage:
localStorage.getItem('math-tutor-xp')

// Check what's in the database:
// Use Prisma Studio or check console for sync errors
```

**Fix:**
- Check console for sync errors
- Verify `DATABASE_URL` is correct
- Check network tab for failed API calls to `/api/sync`

---

### **Conversations Missing After Login**

**Possible Causes:**
1. Sync failed
2. Database connection issue
3. localStorage data corrupted

**How to Debug:**
```javascript
// In browser console:
localStorage.getItem('math-tutor-conversation-history')

// Check network tab for:
// - POST /api/sync (should succeed)
// - GET /api/conversations (should return conversations)
```

**Fix:**
- Check console for errors
- Verify database is accessible
- Check if conversations exist in localStorage

---

### **Data Doesn't Sync to Database**

**Check:**
1. Is `DATABASE_URL` set correctly in `.env.local`?
2. Is the database accessible?
3. Are there any CORS or network errors in console?
4. Check Network tab for `/api/sync` request - what's the response?

**Common Issues:**
- Database URL incorrect
- Database not running
- Network connectivity issues
- API route errors (check server logs)

---

## 🔍 Verification Commands

### **Check localStorage Data**
```javascript
// In browser console:
console.log('XP:', localStorage.getItem('math-tutor-xp'));
console.log('History:', localStorage.getItem('math-tutor-conversation-history'));
```

### **Check Database Directly**
```bash
# Using Prisma Studio
npx dotenv -e .env.local -- npx prisma studio

# Or using psql (if you have direct access)
psql $DATABASE_URL
SELECT * FROM "XPState" WHERE "userId" = 'your-user-id';
SELECT * FROM "Conversation" WHERE "userId" = 'your-user-id';
```

### **Check API Endpoints**
```bash
# Test sync endpoint (requires auth token)
curl -X POST http://localhost:3000/api/sync \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your-token"

# Test conversations endpoint
curl http://localhost:3000/api/conversations \
  -H "Cookie: next-auth.session-token=your-token"
```

---

## 📝 Test Checklist

Use this checklist when testing:

```
[ ] Step 1: Logged in - XP = ____, Conversations = ____
[ ] Step 2: Logged out - XP still shows (localStorage)
[ ] Step 2: Logged out - Conversations still accessible
[ ] Step 3: Logged back in - XP matches Step 1
[ ] Step 3: Logged back in - All conversations present
[ ] Step 3: Console shows successful sync
[ ] Step 4: Database has correct XP value
[ ] Step 4: Database has all conversations
[ ] (Optional) Step 5: Cross-device sync works
```

---

## 🎯 Expected Behavior Summary

**When Logged Out:**
- Data comes from localStorage (fallback)
- XP and conversations should still be visible
- No database writes happen

**When Logging In:**
- localStorage data syncs to database (one-time sync)
- Future saves go to both localStorage AND database
- XP and conversations should match what was in localStorage

**When Logged In:**
- All new data saves to both localStorage and database
- Data persists across page refreshes
- Data should sync across devices (if using same account)

---

## 💡 Key Points to Remember

1. **localStorage is the source of truth when logged out** - This is by design
2. **Sync happens on login** - One-time migration from localStorage to database
3. **After login, data saves to both** - localStorage (for speed) + database (for sync)
4. **If sync fails, localStorage still works** - Graceful degradation

---

## 🚨 Red Flags

**Stop and investigate if you see:**
- ❌ XP changes unexpectedly on logout/login
- ❌ Conversations disappear after login
- ❌ Console errors during sync
- ❌ Database has different data than UI shows
- ❌ Sync never completes (no success message)

If any of these occur, check the troubleshooting section above.

