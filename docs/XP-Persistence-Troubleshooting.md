# XP Persistence Troubleshooting Guide

**Issue:** XP shows 0 after login, but user had XP before logging out.

---

## 🔍 Step-by-Step Diagnosis

### **Step 1: Check Console Logs**

When you log in, you should see these messages in the browser console:

```
[Sync] Starting localStorage to database sync...
[Sync] ✅ Successfully synced to database: { conversationsSynced: X, xpSynced: true }
[Login] Synced localStorage to database
[Login] Cleared localStorage
[Login] Loaded from database: { conversations: X, xp: Y, level: Z, transactions: N }
[Login] Saved XP to localStorage: { totalXP: Y, level: Z, transactions: [...] }
[Login] Dispatched xp-updated event
[Login] ✅ Populated localStorage from database
```

**What to check:**
- ✅ Do you see `[Sync] ✅ Successfully synced to database` with `xpSynced: true`?
- ✅ Do you see `[Login] Loaded from database` with an `xp` value > 0?
- ❌ If `xp: 0` in the "Loaded from database" message, the database has 0 XP
- ❌ If you don't see "Loaded from database" at all, the load failed

---

### **Step 2: Check Database Directly**

```bash
# Open Prisma Studio
npx dotenv -e .env.local -- npx prisma studio
```

1. Go to `XPState` table
2. Find your user's row (match by `userId`)
3. Check:
   - `totalXP` - should be > 0 if you had XP
   - `level` - should match your level
   - `transactions` - should be an array with your XP history

**If XPState doesn't exist:**
- XP was never saved to database
- Check Step 3 to see why

**If XPState exists but `totalXP` is 0:**
- XP was never synced to database
- Or XP was cleared somehow

---

### **Step 3: Check if XP Was Saved When Earned**

**In browser console, check localStorage before logout:**

```javascript
// Check current XP in localStorage
JSON.parse(localStorage.getItem('math-tutor-xp'))
```

**What to check:**
- Does `totalXP` match what you expected?
- Are there `transactions` in the array?

**If localStorage has correct XP:**
- The issue is in the sync/load process
- Proceed to Step 4

**If localStorage has 0 XP:**
- XP was never saved when you earned it
- Check Step 5

---

### **Step 4: Check Sync Process**

**Check Network Tab in DevTools:**

1. Open DevTools → Network tab
2. Log out and log back in
3. Look for these requests:

**`POST /api/sync`**
- Status should be `200 OK`
- Check Response tab - should show `{ "success": true, "conversationsSynced": X, "xpSynced": true }`
- Check Payload tab - should include `xp` object with `totalXP`, `level`, `transactions`

**`GET /api/xp`**
- Status should be `200 OK`
- Check Response tab - should show XP state with `totalXP` > 0

**If `/api/sync` fails:**
- Check console for error message
- Check if `DATABASE_URL` is set correctly
- Check if database is accessible

**If `/api/sync` succeeds but `xpSynced` is false:**
- Check if `xp` object was included in the request payload
- Check console for warnings

**If `/api/xp` returns 0:**
- Database has 0 XP (sync didn't work or was cleared)
- Check database directly (Step 2)

---

### **Step 5: Check if XP Is Saved When Earned**

**When you solve a problem or make an attempt:**

1. Open Console
2. Look for:
   - `[XP] Awarded X XP for reason: solve/attempt`
   - `Failed to save XP to database` (if this appears, XP isn't being saved)

**Check Network Tab:**
- Look for `POST /api/xp` request
- Should happen after you earn XP
- Status should be `200 OK`
- Response should show updated XP state

**If no `POST /api/xp` request:**
- XP is only being saved to localStorage
- Check if you're authenticated when earning XP
- Check console for "Failed to save XP to database" warnings

---

## 🐛 Common Issues & Fixes

### **Issue 1: XP Shows 0 After Login**

**Symptoms:**
- Console shows `[Login] Loaded from database: { xp: 0 }`
- Database has 0 XP
- localStorage had XP before logout

**Possible Causes:**
1. **Sync failed silently** - Check Network tab for `/api/sync` errors
2. **XP wasn't in localStorage** - Check Step 3
3. **Sync happened but XP wasn't included** - Check sync payload

**Fix:**
```javascript
// Manually check what was synced
// In console, before logging out:
const xp = JSON.parse(localStorage.getItem('math-tutor-xp'));
console.log('XP to sync:', xp);
```

---

### **Issue 2: XP Display Doesn't Update After Login**

**Symptoms:**
- Console shows correct XP loaded
- Database has correct XP
- But UI still shows 0

**Possible Causes:**
1. **XP display didn't receive update event** - Check if `xp-updated` event was dispatched
2. **localStorage wasn't updated** - Check if localStorage has correct XP after login

**Fix:**
```javascript
// Manually trigger XP update
window.dispatchEvent(new Event('xp-updated'));

// Or manually check localStorage
console.log('XP in localStorage:', JSON.parse(localStorage.getItem('math-tutor-xp')));
```

---

### **Issue 3: XP Not Saved When Earned**

**Symptoms:**
- You earn XP but it doesn't persist
- No `POST /api/xp` requests in Network tab
- Console shows "Failed to save XP to database"

**Possible Causes:**
1. **Not authenticated** - XP only saves to localStorage
2. **API request failing** - Check Network tab for errors
3. **Database connection issue** - Check `DATABASE_URL`

**Fix:**
- Make sure you're logged in when earning XP
- Check console for error messages
- Verify database connection

---

### **Issue 4: XP Lost After Logout**

**Symptoms:**
- Had XP while logged in
- Logged out
- XP disappeared (shows 0)

**Possible Causes:**
1. **localStorage was cleared** - Check if "Reset Data" was clicked
2. **XP was never in localStorage** - Only in database, and database wasn't loaded on logout

**Expected Behavior:**
- XP should persist in localStorage after logout (for anonymous use)
- On login, it should sync to database, then load back

**Fix:**
- Check localStorage: `localStorage.getItem('math-tutor-xp')`
- If empty, XP was cleared somehow

---

## 🔧 Debug Commands

### **In Browser Console:**

```javascript
// Check current XP state
const xp = JSON.parse(localStorage.getItem('math-tutor-xp') || 'null');
console.log('Current XP:', xp);

// Check if authenticated
fetch('/api/xp').then(r => r.json()).then(console.log);

// Manually trigger XP display update
window.dispatchEvent(new Event('xp-updated'));

// Check what would be synced
const { loadConversationHistory } = await import('./app/lib/conversation-history');
const { getXPState } = await import('./app/lib/xp-system');
const history = loadConversationHistory();
const xp = getXPState();
console.log('Would sync:', { conversations: history.sessions.length, xp });
```

### **In Terminal:**

```bash
# Check database directly
npx dotenv -e .env.local -- npx prisma studio

# Or query via psql
psql $DATABASE_URL
SELECT * FROM "XPState" WHERE "userId" = 'your-user-id';
```

---

## 📋 Diagnostic Checklist

Use this checklist to systematically diagnose:

```
[ ] Step 1: Console shows sync messages on login
[ ] Step 2: Database has XP > 0 in XPState table
[ ] Step 3: localStorage has XP before logout
[ ] Step 4: Network tab shows successful /api/sync request
[ ] Step 4: Network tab shows successful /api/xp request on login
[ ] Step 5: Network tab shows /api/xp POST when earning XP
[ ] Step 5: Console shows no "Failed to save XP" errors
[ ] XP Display: localStorage updated after login
[ ] XP Display: xp-updated event dispatched
[ ] XP Display: UI shows correct XP
```

---

## 🎯 Quick Fixes

### **If XP is in database but not showing:**

```javascript
// In console, manually load and set XP
fetch('/api/xp')
  .then(r => r.json())
  .then(xp => {
    localStorage.setItem('math-tutor-xp', JSON.stringify({
      totalXP: xp.totalXP,
      level: xp.level,
      transactions: xp.transactions
    }));
    window.dispatchEvent(new Event('xp-updated'));
  });
```

### **If XP is in localStorage but not in database:**

```javascript
// Manually sync XP
const xp = JSON.parse(localStorage.getItem('math-tutor-xp'));
fetch('/api/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ xp, conversations: [] })
}).then(r => r.json()).then(console.log);
```

---

## 📝 Next Steps

1. **Run through the diagnostic checklist above**
2. **Check console logs** during login
3. **Check Network tab** for API requests
4. **Check database directly** using Prisma Studio
5. **Report findings** - which step failed?

This will help identify exactly where the XP persistence is breaking.

