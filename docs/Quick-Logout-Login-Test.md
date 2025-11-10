# Quick Logout/Login Test

**User:** test@example.com

## ✅ Expected Behavior

1. **While Logged In:**
   - XP and conversations are saved to both localStorage AND database
   - You can see your XP in the header
   - You can see conversations in "💬 Chat History"

2. **When You Log Out:**
   - XP and conversations still visible (from localStorage)
   - Banner appears: "Login / Create account to save progress"

3. **When You Log Back In:**
   - Console shows: `[Login] Synced localStorage to database`
   - Console shows: `[Login] Cleared localStorage`
   - Console shows: `[Login] Loaded from database: { conversations: X, xp: Y, level: Z }`
   - Console shows: `[Login] ✅ Populated localStorage from database`
   - XP should match what you had before
   - Conversations should be available in "💬 Chat History"

---

## 🧪 Quick Test Steps

1. **Before Logout:**
   - Note your XP: `____ XP, Level ____`
   - Note number of conversations: `____ conversations`
   - Open browser console (F12)

2. **Log Out:**
   - Click your name button → "log out"
   - Verify XP still shows (from localStorage)
   - Verify you can still see conversations in history

3. **Log Back In:**
   - Click "log in / register" in banner
   - Sign in with: `test@example.com` + your password
   - **Watch the console** for the 4 log messages above
   - Verify XP matches what you noted
   - Click "💬 Chat History" → verify all conversations are there

---

## 🐛 If It Doesn't Work

### XP Not Showing After Login

**Check Console:**
- Do you see `[Login] Loaded from database`?
- What does it say for `xp` and `level`?

**Check Database:**
```bash
npx dotenv -e .env.local -- npx prisma studio
```
- Go to `XPState` table
- Find row for your user (userId should match your user ID)
- Check `totalXP` and `level` values

**Manual Fix:**
If database has correct XP but UI doesn't show it:
- Open console
- Type: `window.dispatchEvent(new Event('xp-updated'))`
- XP should update

---

### Conversations Not Showing After Login

**Check Console:**
- Do you see `[Login] Loaded from database: { conversations: X }`?
- What is the value of `X`?

**Check Database:**
```bash
npx dotenv -e .env.local -- npx prisma studio
```
- Go to `Conversation` table
- Filter by your userId
- How many conversations are there?

**Check localStorage:**
- Open console
- Type: `localStorage.getItem('math-tutor-conversation-history')`
- Should show JSON with your conversations

---

### Console Shows Errors

**Common Errors:**

1. **`Failed to sync localStorage to server`**
   - Check: Is `DATABASE_URL` set in `.env.local`?
   - Check: Is database accessible?
   - Check: Network tab → Is `/api/sync` request failing?

2. **`Failed to load conversations from database`**
   - Check: Network tab → Is `/api/conversations` request failing?
   - Check: Are you authenticated? (should see session cookie)

3. **`Failed to load XP from database`**
   - Check: Network tab → Is `/api/xp` request failing?
   - Check: Does XPState exist in database for your user?

---

## 🔍 Debug Commands

**In Browser Console:**

```javascript
// Check localStorage XP
JSON.parse(localStorage.getItem('math-tutor-xp'))

// Check localStorage conversations
JSON.parse(localStorage.getItem('math-tutor-conversation-history'))

// Check if authenticated
fetch('/api/conversations').then(r => r.json()).then(console.log)

// Check XP from API
fetch('/api/xp').then(r => r.json()).then(console.log)

// Force XP display update
window.dispatchEvent(new Event('xp-updated'))
```

**In Terminal:**

```bash
# Check database directly
npx dotenv -e .env.local -- npx prisma studio

# Or query via psql (if you have direct access)
psql $DATABASE_URL
SELECT * FROM "XPState" WHERE "userId" = 'your-user-id';
SELECT * FROM "Conversation" WHERE "userId" = 'your-user-id';
```

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Console shows all 4 login messages
2. ✅ XP matches before/after logout/login
3. ✅ All conversations appear in history after login
4. ✅ No console errors
5. ✅ Database has correct data (verify in Prisma Studio)

---

## 📝 Test Checklist

```
[ ] Logged in - XP = ____, Conversations = ____
[ ] Logged out - XP still visible (localStorage)
[ ] Logged back in - Console shows sync messages
[ ] XP matches after login
[ ] Conversations appear in history after login
[ ] No console errors
```

